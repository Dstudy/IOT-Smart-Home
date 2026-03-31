const express = require('express');
const router = express.Router();
const dataStore = require('../services/dataStore');

/**
 * GET /api/sensors/current
 * Get current sensor readings with system status
 */
router.get('/current', async (req, res) => {
    try {
        const sensors = await dataStore.getCurrentSensorData();
        const devices = await dataStore.getDevices();
        const data = { ...sensors, devices };
        
        res.json({
            success: true,
            data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/sensors/history
 * Get historical sensor data with pagination, sorting, and filtering
 * Query params: page, limit, sortBy, sortOrder, search
 */
router.get('/history', async (req, res) => {
    try {
        const { page, limit, sortBy, sortOrder, search } = req.query;

        const options = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 10,
            sortBy: sortBy || 'timestamp',
            sortOrder: sortOrder || 'desc',
            search: search || ''
        };

        const result = await dataStore.getSensorHistory(options);

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

/**
 * GET /api/sensors/stats
 * Get aggregated sensor statistics
 */
router.get('/stats', async (req, res) => {
    try {
        // Fetch all history for stats (or use Prisma aggregations, but for simplicity we fetch)
        // Note: For large DBs, Prisma aggregations (aggregate, groupBy) should be used instead!
        const result = await dataStore.getSensorHistory({ limit: 1000 }); // limit to 1000 for stats
        const history = result.data;

        if (history.length === 0) {
            return res.json({
                success: true,
                data: {
                    avgTemperature: 0,
                    avgHumidity: 0,
                    avgAmbientLight: 0,
                    maxTemperature: 0,
                    maxAmbientLight: 0
                }
            });
        }

        const stats = {
            avgTemperature: history.reduce((sum, entry) => sum + entry.temperature, 0) / history.length,
            avgHumidity: history.reduce((sum, entry) => sum + entry.humidity, 0) / history.length,
            avgAmbientLight: history.reduce((sum, entry) => sum + entry.ambientLight, 0) / history.length,
            maxTemperature: Math.max(...history.map(e => e.temperature)),
            maxAmbientLight: Math.max(...history.map(e => e.ambientLight))
        };

        // Round values
        stats.avgTemperature = Math.round(stats.avgTemperature * 10) / 10;
        stats.avgHumidity = Math.round(stats.avgHumidity * 10) / 10;
        stats.avgAmbientLight = Math.round(stats.avgAmbientLight);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
