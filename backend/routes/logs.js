const express = require("express");
const router = express.Router();
const dataStore = require("../services/dataStore");

/**
 * @swagger
 * tags:
 *   name: Logs
 *   description: Quản lý lịch sử hoạt động của hệ thống
 */

/**
 * @swagger
 * /api/logs:
 *   get:
 *     summary: Lấy danh sách lịch sử hoạt động (Activity Logs)
 *     tags: [Logs]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: device
 *         schema: { type: string }
 *         description: Lọc theo tên thiết bị
 *       - in: query
 *         name: action
 *         schema: { type: string }
 *         description: Lọc theo hành động (ON/OFF)
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *         description: Lọc theo trạng thái (Thành công/Thất bại/Chờ xử lí)
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc], default: 'desc' }
 *     responses:
 *       200:
 *         description: Trả về danh sách logs theo bộ lọc
 */
router.get("/", async (req, res) => {
  try {
    const { page, limit, device, action, status, search, sortOrder } =
      req.query;

    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      device: device || "",
      action: action || "",
      status: status || "",
      search: search || "",
      sortOrder: sortOrder || "desc",
    };

    const result = await dataStore.getActivityLogs(options);

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

module.exports = router;
