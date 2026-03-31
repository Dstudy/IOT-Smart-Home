const express = require('express');
const router = express.Router();
const dataStore = require('../services/dataStore');

/**
 * GET /api/logs
 * Get activity logs with pagination and filtering
 * Query params: page, limit, device, action, sortOrder
 */
router.get('/', async (req, res) => {
    try {
        const { page, limit, device, action, status, search, sortOrder } = req.query;

        const options = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 10,
            device: device || '',
            action: action || '',
            status: status || '',
            search: search || '',
            sortOrder: sortOrder || 'desc'
        };

        const result = await dataStore.getActivityLogs(options);

        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
