const express = require("express");
const router = express.Router();
const dataStore = require("../services/dataStore");
const mqttService = require("../services/mqttService");

/**
 * GET /api/devices
 * Get all device states
 */
router.get("/", async (req, res) => {
  try {
    const devices = await dataStore.getDevices();
    res.json({
      success: true,
      data: devices,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/devices/:deviceName/toggle
 * Toggle a device ON/OFF
 */
router.post("/:deviceName/toggle", async (req, res) => {
  try {
    const { deviceName } = req.params;

    // Validate device name
    const validDevices = ["ac", "light", "fan"];
    if (!validDevices.includes(deviceName)) {
      return res.status(400).json({
        success: false,
        error: "Invalid device name. Valid devices: ac, light, fan",
      });
    }

    const devices = await dataStore.getDevices();
    const currentDevice = devices[deviceName];
    if (!currentDevice) {
      return res
        .status(404)
        .json({ success: false, error: "Device not found" });
    }

    const newStatus = currentDevice.status === "ON" ? "OFF" : "ON";

    // 1. Immediately log as Waiting (Chờ xử lí)
    const logEntry = await dataStore.addActivityLog({
      deviceName: currentDevice.name,
      action: newStatus,
      status: "Chờ xử lí",
    });

    try {
      // 2. Await actual MQTT response from ESP32
      await mqttService.toggleDevice(deviceName, newStatus);

      // 3. Status Success
      const device = await dataStore.toggleDeviceWithoutLogging(deviceName);
      await dataStore.updateActivityLog(logEntry.id, { status: "Thành công" });

      return res.json({
        success: true,
        data: device,
        message: `${device.name} turned ${device.status} successfully`,
      });
    } catch (mqttError) {
      // 4. Status Fail
      console.error("MQTT Toggle Error:", mqttError.message);
      await dataStore.updateActivityLog(logEntry.id, { status: "Thất bại" });

      return res.status(500).json({
        success: false,
        error: "Thiết bị không phản hồi. " + mqttError.message,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/devices/:deviceName/auto
 * Set auto mode (threshold is fixed from environment)
 */
router.post("/:deviceName/auto", async (req, res) => {
  try {
    const { deviceName } = req.params;
    const { autoMode } = req.body;

    let mode = autoMode === true || autoMode === "true";

    const devices = await dataStore.getDevices();
    if (!devices[deviceName]) {
      return res
        .status(404)
        .json({ success: false, error: "Device not found" });
    }

    const device = await dataStore.updateDeviceAutoMode(deviceName, mode);

    return res.json({
      success: true,
      data: device,
      message: `Auto mode for ${device.name} updated`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
