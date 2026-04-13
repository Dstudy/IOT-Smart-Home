const express = require("express");
const router = express.Router();
const dataStore = require("../services/dataStore");
const mqttService = require("../services/mqttService");

/**
 * @swagger
 * tags:
 *   name: Devices
 *   description: Quản lý trạng thái và điều khiển thiết bị (AC, Light, Fan)
 */

/**
 * @swagger
 * /api/devices:
 *   get:
 *     summary: Lấy danh sách trạng thái tất cả thiết bị
 *     tags: [Devices]
 *     responses:
 *       200:
 *         description: Trả về trạng thái hiện tại của các thiết bị
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
 * @swagger
 * /api/devices/{deviceName}/toggle:
 *   post:
 *     summary: Bật/Tắt thiết bị
 *     tags: [Devices]
 *     parameters:
 *       - in: path
 *         name: deviceName
 *         required: true
 *         schema:
 *           type: string
 *           enum: [ac, light, fan]
 *         description: Tên thiết bị cần điều khiển
 *     responses:
 *       200:
 *         description: Điều khiển thành công
 *       400:
 *         description: Tên thiết bị không hợp lệ
 *       500:
 *         description: Lỗi kết nối MQTT hoặc lỗi server
 */
router.post("/:deviceName/toggle", async (req, res) => {
  try {
    const { deviceName } = req.params;
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
    const logEntry = await dataStore.addActivityLog({
      deviceName: currentDevice.name,
      action: newStatus,
      status: "Chờ xử lí",
    });

    try {
      await mqttService.toggleDevice(deviceName, newStatus);
      const device = await dataStore.toggleDeviceWithoutLogging(deviceName);
      await dataStore.updateActivityLog(logEntry.id, { status: "Thành công" });

      return res.json({
        success: true,
        data: device,
        message: `${device.name} turned ${device.status} successfully`,
      });
    } catch (mqttError) {
      await dataStore.updateActivityLog(logEntry.id, { status: "Thất bại" });
      return res.status(500).json({
        success: false,
        error: "Thiết bị không phản hồi. " + mqttError.message,
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/devices/{deviceName}/auto:
 *   post:
 *     summary: Thiết lập chế độ tự động cho thiết bị
 *     tags: [Devices]
 *     parameters:
 *       - in: path
 *         name: deviceName
 *         required: true
 *         schema:
 *           type: string
 *         description: Tên thiết bị
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               autoMode:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Cập nhật chế độ tự động thành công
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
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
