const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Ensure initial devices exist
async function initDevices() {
  const devices = ["ac", "fan", "light", "dehumidifier", "screen"];
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
  constructor() {
    this.deviceNameMap = {
      "Air Conditioner": "ac",
      Fan: "fan",
      Light: "light",
      Dehumidifier: "dehumidifier",
      Screen: "screen",
    };
    this.sensorIds = null;
  }

  getDbDeviceName(frontendName) {
    // Returns 'ac' if 'Air Conditioner' is passed,
    // otherwise returns the original name in lowercase
    return this.deviceNameMap[frontendName] || frontendName.toLowerCase();
  }

  // Helper to ensure IDs are loaded before any operation
  async ensureSensorIds() {
    if (!this.sensorIds) {
      this.sensorIds = await getSensorIdMap();
    }
    return this.sensorIds;
  }
  // Sensor data methods
  async updateSensorData(data) {
    const sensorIds = await this.ensureSensorIds();

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
      // console.log(
      //   `📊 Recording temperature: ${data.temperature}°C with sensorId: ${sensorIds.temperature}`,
      // );
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
      // console.log(
      //   `📊 Recording humidity: ${data.humidity}% with sensorId: ${sensorIds.humidity}`,
      // );
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
      // console.log(
      //   `📊 Recording ambientLight: ${data.ambientLight} with sensorId: ${sensorIds.ambientLight}`,
      // );
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
    // console.log(`✅ Saved ${writes.length} sensor records`);

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
      searchDate = "",
      searchValue = "",
      sensorType = "all",
    } = options;

    const sensorIds = await getSensorIdMap();
    const skip = (page - 1) * parseInt(limit);

    // 1. Build the filter clause
    let AND = [];

    // Filter by Sensor Type if not "all"
    if (sensorType !== "all") {
      const typeMap = {
        "Nhiệt độ": sensorIds.temperature,
        "Độ ẩm": sensorIds.humidity,
        "Ánh sáng": sensorIds.ambientLight,
      };
      if (typeMap[sensorType]) {
        AND.push({ sensorId: typeMap[sensorType] });
      }
    }

    // 2. Separate Date Search Logic
    if (searchDate) {
      const parsedDate = new Date(searchDate);

      if (!isNaN(parsedDate.getTime())) {
        let startTime = new Date(parsedDate);
        let endTime = new Date(parsedDate);

        // If the string is short (e.g., "2026-04-13 14:30"), we search within that minute
        if (searchDate.length <= 16) {
          startTime.setSeconds(0, 0);
          endTime.setSeconds(59, 999);
        } else {
          // Precise to the second
          startTime.setMilliseconds(0);
          endTime.setMilliseconds(999);
        }

        AND.push({
          timestamp: {
            gte: startTime,
            lte: endTime,
          },
        });
      }
    }

    if (searchValue && !isNaN(searchValue)) {
      const searchNum = parseFloat(searchValue);

      AND.push({
        value: searchNum, // So sánh bằng trực tiếp
      });
    }

    try {
      const whereClause = AND.length > 0 ? { AND } : {};

      // 3. Fetch data and count
      const [rawRecords, totalCount] = await Promise.all([
        prisma.sensorData.findMany({
          where: whereClause,
          orderBy: { [sortBy]: sortOrder },
          skip: skip,
          take: parseInt(limit),
        }),
        prisma.sensorData.count({ where: whereClause }),
      ]);

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
      if (!id) return false;
      await prisma.activityLog.update({
        where: { id },
        data: updates,
      });
      return true;
    } catch (error) {
      console.error("❌ Error updating activity log:", error);
      return false;
    }
  }

  async getActivityLogs(options = {}) {
    const {
      page = 1,
      limit = 10,
      search = "",
      device = "",
      action = "",
      status = "",
      sortOrder = "desc",
    } = options;
    let AND = [];

    if (device && device !== "all") {
      // Map "Air Conditioner" to "ac" before querying DB
      const dbName = this.getDbDeviceName(device);
      AND.push({ deviceName: { equals: dbName } });
    }

    if (action && action !== "all" && action !== "") {
      AND.push({ action: { equals: action } });
    }

    if (status && status !== "all" && status !== "") {
      AND.push({ status: { equals: status } });
    }

    // 2. Advanced Date/Time Search Logic
    if (search) {
      const parsedDate = new Date(search);

      // Check if the search string is a valid date
      if (!isNaN(parsedDate.getTime())) {
        let startTime = new Date(parsedDate);
        let endTime = new Date(parsedDate);

        // Determine precision: Is it "YYYY-MM-DD HH:mm" (16 chars) or "YYYY-MM-DD HH:mm:ss" (19 chars)?
        if (search.length <= 16) {
          // Minute search: 2026-04-12 23:45:00 to 2026-04-12 23:45:59
          startTime.setSeconds(0, 0);
          endTime.setSeconds(59, 999);
        } else {
          // Second search: 2026-04-12 23:45:04.000 to 2026-04-12 23:45:04.999
          startTime.setMilliseconds(0);
          endTime.setMilliseconds(999);
        }

        AND.push({
          timestamp: {
            gte: startTime,
            lte: endTime,
          },
        });
      } else {
        // Fallback to text search if not a date
        AND.push({
          OR: [
            { deviceName: { contains: search, mode: "insensitive" } },
            { action: { contains: search, mode: "insensitive" } },
          ],
        });
      }
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

  async getDailyDeviceStats(targetDate = new Date()) {
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // 1. Get grouped counts for all devices in one query
    const stats = await prisma.activityLog.groupBy({
      by: ["deviceName", "action"],
      where: {
        timestamp: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: "Thành công",
        action: { in: ["ON", "OFF"] },
      },
      _count: {
        action: true,
      },
    });

    // 2. Format the data into a clean object structure
    // This transforms the flat DB list into: { "Device A": { on: 5, off: 3 }, ... }
    const deviceMap = stats.reduce((acc, item) => {
      if (!acc[item.deviceName]) {
        acc[item.deviceName] = {
          deviceName: item.deviceName,
          onCount: 0,
          offCount: 0,
        };
      }

      if (item.action === "ON")
        acc[item.deviceName].onCount = item._count.action;
      if (item.action === "OFF")
        acc[item.deviceName].offCount = item._count.action;

      return acc;
    }, {});

    return Object.values(deviceMap);
  }
}

const dataStore = new DataStore();
module.exports = dataStore;
