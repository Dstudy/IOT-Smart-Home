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

    if (
      data.temp !== undefined &&
      data.hum !== undefined &&
      data.lightValue !== undefined
    ) {
      const sensorData = {
        temperature: data.temp,
        humidity: data.hum,
        ambientLight: data.lightValue,
      };

      try {
        // Update dataStore
        const record = await dataStore.updateSensorData(sensorData);

        // Auto mode logic for light
        const devices = await dataStore.getDevices();
        const lightDevice = devices["light"];
        let updatedDevices = null;

        if (lightDevice && lightDevice.autoMode) {
          const threshold = parseInt(process.env.AUTO_LIGHT_THRESHOLD) || 500;
          // ON when UNDER threshold, OFF when OVER
          const targetState =
            sensorData.ambientLight < threshold ? "ON" : "OFF";

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
        console.error("Error saving sensor data to DB:", err);
      }
    }
  }

  handleDeviceResponse(payloadStr) {
    // Expected JSON: {"device": "Fan", "action": "ON", "status": "success"}
    const data = JSON.parse(payloadStr);

    // Emit an event that the router can listen to
    this.emit("deviceResponse", data);
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
        reject(new Error("MQTT device response timeout (5000ms)"));
      }, 5000);

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
