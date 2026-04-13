const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Ensure initial devices exist
async function initDevices() {
  const devices = ["ac", "fan", "light"];
  for (const dev of devices) {
    await prisma.device.upsert({
      where: { name: dev },
      update: {},
      create: { name: dev, status: "OFF", autoMode: false },
    });
  }
}

// Ensure initial sensor entries exist
async function initSensors() {
  const sensors = ["temperature", "humidity", "ambientLight"];
  for (const sensor of sensors) {
    await prisma.sensor.upsert({
      where: { name: sensor },
      update: {},
      create: { name: sensor },
    });
  }
}

async function getSensorIdMap() {
  const sensors = await prisma.sensor.findMany();
  return sensors.reduce((map, sensor) => {
    map[sensor.name] = sensor.id;
    return map;
  }, {});
}

// Initialize both devices and sensors on startup
async function initializeDatabase() {
  try {
    await initDevices();
    console.log("✅ Devices initialized");
    await initSensors();
    console.log("✅ Sensors initialized");
    const sensorMap = await getSensorIdMap();
    console.log("✅ Sensor ID Map:", sensorMap);
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    process.exit(1);
  }
}

// Start initialization immediately
initializeDatabase();

class DataStore {
  // Sensor data methods
  async updateSensorData(data) {
    const sensorIds = await getSensorIdMap();

    if (
      !sensorIds.temperature ||
      !sensorIds.humidity ||
      !sensorIds.ambientLight
    ) {
      console.error("❌ Sensor IDs not found! Available IDs:", sensorIds);
      throw new Error("Sensors not initialized. Please restart the server.");
    }

    const timestamp = new Date();

    const writes = [];
    if (data.temperature !== undefined) {
      console.log(
        `📊 Recording temperature: ${data.temperature}°C with sensorId: ${sensorIds.temperature}`,
      );
      writes.push(
        prisma.sensorData.create({
          data: {
            sensorId: sensorIds.temperature,
            value: data.temperature,
            timestamp,
          },
        }),
      );
    }
    if (data.humidity !== undefined) {
      console.log(
        `📊 Recording humidity: ${data.humidity}% with sensorId: ${sensorIds.humidity}`,
      );
      writes.push(
        prisma.sensorData.create({
          data: {
            sensorId: sensorIds.humidity,
            value: data.humidity,
            timestamp,
          },
        }),
      );
    }
    if (data.ambientLight !== undefined) {
      console.log(
        `📊 Recording ambientLight: ${data.ambientLight} with sensorId: ${sensorIds.ambientLight}`,
      );
      writes.push(
        prisma.sensorData.create({
          data: {
            sensorId: sensorIds.ambientLight,
            value: data.ambientLight,
            timestamp,
          },
        }),
      );
    }

    if (writes.length === 0) {
      console.warn("⚠️ No sensor data to write");
      return {
        temperature: 0,
        humidity: 0,
        ambientLight: 0,
        timestamp,
      };
    }

    await Promise.all(writes);
    console.log(`✅ Saved ${writes.length} sensor records`);

    return {
      temperature: data.temperature ?? 0,
      humidity: data.humidity ?? 0,
      ambientLight: data.ambientLight ?? 0,
      timestamp,
    };
  }

  async getCurrentSensorData() {
    const sensorIds = await getSensorIdMap();
    const [temperatureRow, humidityRow, ambientLightRow] = await Promise.all([
      prisma.sensorData.findFirst({
        where: { sensorId: sensorIds.temperature },
        orderBy: { timestamp: "desc" },
      }),
      prisma.sensorData.findFirst({
        where: { sensorId: sensorIds.humidity },
        orderBy: { timestamp: "desc" },
      }),
      prisma.sensorData.findFirst({
        where: { sensorId: sensorIds.ambientLight },
        orderBy: { timestamp: "desc" },
      }),
    ]);

    const latestTimestamp = [temperatureRow, humidityRow, ambientLightRow]
      .filter(Boolean)
      .reduce((latest, row) => {
        if (!latest || row.timestamp > latest) return row.timestamp;
        return latest;
      }, null);

    return {
      temperature: temperatureRow?.value ?? 0,
      humidity: humidityRow?.value ?? 0,
      ambientLight: ambientLightRow?.value ?? 0,
      timestamp: latestTimestamp || new Date(),
    };
  }

  async getSensorStats() {
    const sensorIds = await getSensorIdMap();
    if (
      !sensorIds.temperature ||
      !sensorIds.humidity ||
      !sensorIds.ambientLight
    ) {
      return {
        avgTemperature: 0,
        avgHumidity: 0,
        avgAmbientLight: 0,
        maxTemperature: 0,
        maxAmbientLight: 0,
      };
    }

    const [temperatureStats, humidityStats, ambientLightStats] =
      await Promise.all([
        prisma.sensorData.aggregate({
          where: { sensorId: sensorIds.temperature },
          _avg: { value: true },
          _max: { value: true },
        }),
        prisma.sensorData.aggregate({
          where: { sensorId: sensorIds.humidity },
          _avg: { value: true },
          _max: { value: true },
        }),
        prisma.sensorData.aggregate({
          where: { sensorId: sensorIds.ambientLight },
          _avg: { value: true },
          _max: { value: true },
        }),
      ]);

    return {
      avgTemperature: Number(temperatureStats._avg.value ?? 0),
      avgHumidity: Number(humidityStats._avg.value ?? 0),
      avgAmbientLight: Number(ambientLightStats._avg.value ?? 0),
      maxTemperature: Number(temperatureStats._max.value ?? 0),
      maxAmbientLight: Number(ambientLightStats._max.value ?? 0),
    };
  }

  async getSensorHistory(options = {}) {
    const {
      page = 1,
      limit = 10,
      sortBy = "timestamp",
      sortOrder = "desc",
      search = "",
    } = options;

    const skip = (page - 1) * parseInt(limit);

    // 1. Build the filter clause
    let whereClause = {};

    // If there's a search term, try to filter by the sensor value
    if (search && !isNaN(search)) {
      const searchNum = parseFloat(search);
      whereClause.value = {
        gte: searchNum - 0.5,
        lte: searchNum + 0.5,
      };
    }

    try {
      // 2. Fetch raw data rows and total count simultaneously
      const [rawRecords, totalCount] = await Promise.all([
        prisma.sensorData.findMany({
          where: whereClause,
          orderBy: { [sortBy]: sortOrder }, // Dynamic sort: timestamp, value, etc.
          skip: skip,
          take: parseInt(limit),
        }),
        prisma.sensorData.count({ where: whereClause }),
      ]);

      // 3. Return raw rows so the frontend "switch(record.sensorId)" works
      return {
        success: true,
        data: rawRecords.map((row) => ({
          id: row.id,
          sensorId: row.sensorId,
          value: Number(row.value),
          timestamp: row.timestamp,
        })),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      };
    } catch (error) {
      console.error("❌ Error in getSensorHistory:", error);
      return {
        success: false,
        data: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      };
    }
  }

  // Device methods
  async getDevices() {
    const devices = await prisma.device.findMany();
    const deviceMap = {};
    devices.forEach((d) => {
      deviceMap[d.name] = d;
    });
    return deviceMap;
  }

  async toggleDeviceWithoutLogging(deviceName) {
    const currentDevice = await prisma.device.findUnique({
      where: { name: deviceName },
    });

    if (!currentDevice) {
      throw new Error("Device not found");
    }

    const newStatus = currentDevice.status === "ON" ? "OFF" : "ON";

    const updatedDevice = await prisma.device.update({
      where: { name: deviceName },
      data: { status: newStatus, lastToggled: new Date() },
    });

    return updatedDevice;
  }

  async toggleDevice(deviceName) {
    const device = await this.toggleDeviceWithoutLogging(deviceName);

    await this.addActivityLog({
      deviceName: device.name,
      action: device.status,
      status: "Thành công",
    });

    return device;
  }

  async updateDeviceAutoMode(deviceName, autoMode) {
    const updatedDevice = await prisma.device.update({
      where: { name: deviceName },
      data: { autoMode },
    });
    return updatedDevice;
  }

  // Activity log methods
  async addActivityLog(log) {
    const record = await prisma.activityLog.create({
      data: {
        deviceName: log.deviceName,
        action: log.action,
        status: log.status || log.action,
        timestamp: new Date(),
      },
    });
    return record;
  }

  async updateActivityLog(id, updates) {
    try {
      await prisma.activityLog.update({
        where: { id },
        data: updates,
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async getActivityLogs(options = {}) {
    const {
      page = 1,
      limit = 20,
      device = "",
      action = "",
      status = "",
      search = "",
      sortOrder = "desc",
    } = options;

    let AND = [];

    if (device && device !== "all") {
      AND.push({ deviceName: { contains: device } });
    }
    if (action && action !== "all") {
      AND.push({ action: { equals: action } });
    }
    if (status && status !== "all") {
      AND.push({ status: { equals: status } });
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.activityLog.findMany({
        where: AND.length > 0 ? { AND } : {},
        orderBy: { timestamp: sortOrder },
        skip,
        take: limit,
      }),
      prisma.activityLog.count({ where: AND.length > 0 ? { AND } : {} }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

const dataStore = new DataStore();
module.exports = dataStore;
