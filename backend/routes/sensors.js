const express = require("express");
const router = express.Router();
const dataStore = require("../services/dataStore");

/**
 * @swagger
 * tags:
 *   name: Sensors
 *   description: Truy xuất dữ liệu cảm biến (Nhiệt độ, Độ ẩm, Ánh sáng)
 */

/**
 * @swagger
 * /api/sensors/current:
 *   get:
 *     summary: Lấy dữ liệu cảm biến thời gian thực
 *     tags: [Sensors]
 *     responses:
 *       200:
 *         description: Trả về giá trị cảm biến mới nhất kèm trạng thái hệ thống
 */
router.get("/current", async (req, res) => {
  try {
    const sensors = await dataStore.getCurrentSensorData();
    const devices = await dataStore.getDevices();
    const data = { ...sensors, devices };

    res.json({
      success: true,
      data,
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
 * /api/sensors/history:
 *   get:
 *     summary: Lấy lịch sử dữ liệu cảm biến (Phân trang)
 *     tags: [Sensors]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, default: 'timestamp' }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc], default: 'desc' }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Trả về danh sách lịch sử cảm biến
 */
router.get("/history", async (req, res) => {
  try {
    const { page, limit, sortBy, sortOrder, search } = req.query;

    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      sortBy: sortBy || "timestamp",
      sortOrder: sortOrder || "desc",
      search: search || "",
    };

    const result = await dataStore.getSensorHistory(options);

    res.json({
      success: true,
      ...result,
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
 * /api/sensors/stats:
 *   get:
 *     summary: Lấy số liệu thống kê trung bình của cảm biến
 *     tags: [Sensors]
 *     responses:
 *       200:
 *         description: Trả về giá trị trung bình nhiệt độ, độ ẩm, ánh sáng
 */
router.get("/stats", async (req, res) => {
  try {
    const stats = await dataStore.getSensorStats();

    stats.avgTemperature = Math.round(stats.avgTemperature * 10) / 10;
    stats.avgHumidity = Math.round(stats.avgHumidity * 10) / 10;
    stats.avgAmbientLight = Math.round(stats.avgAmbientLight);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
