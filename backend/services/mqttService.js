const mqtt = require("mqtt");
const EventEmitter = require("events");
const dataStore = require("./dataStore");

class MqttService extends EventEmitter {
  constructor() {
    super();
    this.client = null;

    // Settings from .env
    this.brokerUrl = process.env.MQTT_SERVER || "mqtt://10.72.10.66:1880";
    this.options = {
      username: process.env.MQTT_USER || "Duong",
      password: process.env.MQTT_PASS || "12345678",
      clientId: "nodejs_backend_" + Math.random().toString(16).substring(2, 8),
    };

    this.topicData = "iot/datasensors";
    this.topicControl = "iot/devicecontrol";
    this.topicResponse = "iot/dataresponse";

    this.lastSeenTimestamp = 0;
    this.RECONNECT_TIMEOUT = 4000; // 3 seconds gap counts as reconnect
  }

  connect() {
    console.log(`Connecting to MQTT broker at ${this.brokerUrl}...`);
    this.client = mqtt.connect(this.brokerUrl, this.options);

    this.client.on("connect", () => {
      console.log("✅ MQTT connected successfully");

      // Subscribe to topics
      this.client.subscribe(this.topicData, (err) => {
        if (!err) console.log(`Subscribed to ${this.topicData}`);
      });
      this.client.subscribe(this.topicResponse, (err) => {
        if (!err) console.log(`Subscribed to ${this.topicResponse}`);
      });
    });

    this.client.on("message", (topic, message) => {
      try {
        const payloadStr = message.toString();

        if (topic === this.topicData) {
          this.handleSensorData(payloadStr);
        } else if (topic === this.topicResponse) {
          this.handleDeviceResponse(payloadStr);
        }
      } catch (err) {
        console.error("Error parsing MQTT message:", err.message);
      }
    });

    this.client.on("error", (err) => {
      console.error("❌ MQTT Connection Error:", err);
    });

    this.client.on("offline", () => {
      console.warn("⚠️ MQTT Client is offline");
    });

    this.client.on("reconnect", () => {
      console.log("🔄 MQTT reconnecting...");
    });
  }

  async handleSensorData(payloadStr) {
    // Expected JSON: {"temp": 25.5, "hum": 60, "lightValue": 800, "gasState": 1}
    const data = JSON.parse(payloadStr);

    const sensorData = {};
    if (data.temp !== undefined) sensorData.temperature = data.temp;
    if (data.hum !== undefined) sensorData.humidity = data.hum;
    if (data.lightValue !== undefined)
      sensorData.ambientLight = data.lightValue;

    if (Object.keys(sensorData).length === 0) {
      console.warn("⚠️ No valid sensor data found in payload");
      return;
    }

    try {
      // Save split records for each sensor type
      const record = await dataStore.updateSensorData(sensorData);

      // Auto mode logic for light
      const devices = await dataStore.getDevices();
      const lightDevice = devices["light"];
      let updatedDevices = null;

      if (lightDevice && lightDevice.autoMode) {
        const threshold = parseInt(process.env.AUTO_LIGHT_THRESHOLD) || 500;
        // ON when UNDER threshold, OFF when OVER
        const targetState = sensorData.ambientLight < threshold ? "ON" : "OFF";

        if (lightDevice.status !== targetState) {
          try {
            const logEntry = await dataStore.addActivityLog({
              deviceName: lightDevice.name,
              action: targetState,
              status: "Chờ xử lí (Auto)",
            });

            await this.toggleDevice("light", targetState);

            await dataStore.toggleDeviceWithoutLogging("light");
            await dataStore.updateActivityLog(logEntry.id, {
              status: "Thành công",
            });

            updatedDevices = await dataStore.getDevices();
          } catch (err) {
            console.error("Auto tracking error:", err.message);
          }
        }
      }

      // Emit event so the WebSocket server can broadcast it
      this.emit(
        "sensorUpdate",
        updatedDevices ? { ...record, devices: updatedDevices } : record,
      );
    } catch (err) {
      console.error("❌ Error saving sensor data to DB:", err.message, err);
    }
  }
  handleDeviceResponse(payloadStr) {
    // Expected JSON: {"device": "Fan", "action": "ON", "status": "success"}
    try {
      console.log("[MQTT] Received device response:", payloadStr);
      const data = JSON.parse(payloadStr);

      // NẾU ESP32 BÁO SẴN SÀNG -> THỰC HIỆN SYNC
      if (data.device === "System" && data.action === "Ready") {
        console.log("🚀 ESP32 is ready. Starting synchronization...");
        this.syncDeviceState();
        return; // Không cần emit cho router vì đây là lệnh nội bộ hệ thống
      }

      // Các phản hồi toggle thiết bị thông thường
      this.emit("deviceResponse", data);
    } catch (err) {
      console.error("Error handling device response:", err.message);
    }
  }

  /**
   * Syncs all device states from database to the hardware
   */
  async syncDeviceState() {
    try {
      const devices = await dataStore.getDevices();
      // console.log("[MQTT] Syncing states for devices:", Object.keys(devices));

      for (const [key, device] of Object.entries(devices)) {
        // Map db name to ESP command and publish directly
        let espDeviceName = "";
        if (device.name === "ac") espDeviceName = "AC";
        else if (device.name === "fan") espDeviceName = "Fan";
        else if (device.name === "light") espDeviceName = "Light";
        else if (device.name === "dehumidifier") espDeviceName = "Dehumidifier";
        else if (device.name === "screen") espDeviceName = "Screen";

        if (espDeviceName) {
          const command =
            device.status === "ON"
              ? `On${espDeviceName}`
              : `Off${espDeviceName}`;
          console.log(
            `[MQTT] Sync: Publishing to ${this.topicControl}: ${command}`,
          );
          this.client.publish(this.topicControl, command);
        }
      }
    } catch (err) {
      console.error("❌ Error syncing device states:", err.message);
    }
  }

  /**
   * Toggles a device and waits for a response from the ESP32
   */
  async toggleDevice(deviceName, targetState) {
    return new Promise((resolve, reject) => {
      if (!this.client || !this.client.connected) {
        return reject(new Error("MQTT client is not connected"));
      }

      // Map frontend deviceName to ESP32 command strings
      // AC -> OnAC/OffAC, Fan -> OnFan/OffFan, Light -> OnLight/OffLight
      let espDeviceName = "";
      if (deviceName === "ac") espDeviceName = "AC";
      else if (deviceName === "fan") espDeviceName = "Fan";
      else if (deviceName === "light") espDeviceName = "Light";
      else if (deviceName === "dehumidifier") espDeviceName = "Dehumidifier";
      else if (deviceName === "screen") espDeviceName = "Screen";
      else return reject(new Error("Unknown device type"));

      const command =
        targetState === "ON" ? `On${espDeviceName}` : `Off${espDeviceName}`;

      // Create a listener for the response
      const onResponse = (response) => {
        // Ensure the response matches our device and action
        if (
          response.device.toUpperCase() === espDeviceName.toUpperCase() &&
          response.action === targetState
        ) {
          console.log(
            `[MQTT] Received response for ${response.device} action ${response.action}: ${response.status}`,
          );
          clearTimeout(timeoutId);
          this.removeListener("deviceResponse", onResponse);

          if (response.status === "success") {
            resolve(response);
          } else {
            reject(new Error(`Device returned status: ${response.status}`));
          }
        }
      };

      // Set a timeout of 5 seconds to give up if the ESP32 doesn't respond
      const timeoutId = setTimeout(() => {
        this.removeListener("deviceResponse", onResponse);
        reject(new Error("MQTT device response timeout (10000ms)"));
      }, 10000);

      // Listen for the response EVENT before publishing
      this.on("deviceResponse", onResponse);

      // Publish control command
      console.log(`[MQTT] Publishing to ${this.topicControl}: ${command}`);
      this.client.publish(this.topicControl, command);
    });
  }
}

// Singleton instance
const mqttService = new MqttService();
module.exports = mqttService;
