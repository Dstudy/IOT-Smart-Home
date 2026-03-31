require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const http = require('http');

const dataStore = require('./services/dataStore');
const mqttService = require('./services/mqttService');
const sensorsRouter = require('./routes/sensors');
const devicesRouter = require('./routes/devices');
const logsRouter = require('./routes/logs');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/sensors', sensorsRouter);
app.use('/api/devices', devicesRouter);
app.use('/api/logs', logsRouter);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date() });
});

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server });

// WebSocket connection handling
wss.on('connection', async (ws) => {
    console.log('New WebSocket client connected');

    // Send initial data
    try {
        const sensors = await dataStore.getCurrentSensorData();
        const devices = await dataStore.getDevices();
        
        ws.send(JSON.stringify({
            type: 'initial',
            data: { ...sensors, devices }
        }));
    } catch (err) {
        console.error('Error fetching initial data for WS:', err);
    }

    ws.on('close', () => {
        console.log('WebSocket client disconnected');
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

// Broadcast sensor updates to all connected clients
function broadcastSensorUpdate(data) {
    wss.clients.forEach((client) => {
        if (client.readyState === 1) { // WebSocket.OPEN
            client.send(JSON.stringify({
                type: 'sensorUpdate',
                data
            }));
        }
    });
}

// Connect to MQTT Broker
mqttService.connect();

// Forward MQTT sensor updates to WebSocket clients
mqttService.on('sensorUpdate', (data) => {
    broadcastSensorUpdate(data);
});

// Start server
server.listen(PORT, () => {
    console.log(`🏠 Smart Home System Backend running on port ${PORT}`);
    console.log(`📊 API: http://localhost:${PORT}/api`);
    console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
    console.log(`💚 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
});
