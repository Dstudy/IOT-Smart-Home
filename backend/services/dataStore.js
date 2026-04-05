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
initDevices().catch(console.error);

class DataStore {
  // Sensor data methods
  async updateSensorData(data) {
    const record = await prisma.sensorData.create({
      data: {
        temperature: data.temperature,
        humidity: data.humidity,
        ambientLight: data.ambientLight,
        timestamp: new Date(),
      },
    });
    return record;
  }

  async getCurrentSensorData() {
    const latest = await prisma.sensorData.findFirst({
      orderBy: { timestamp: "desc" },
    });
    return (
      latest || {
        temperature: 0,
        humidity: 0,
        ambientLight: 0,
        timestamp: new Date(),
      }
    );
  }

  async getSensorHistory(options = {}) {
    const {
      page = 1,
      limit = 10,
      sortBy = "timestamp",
      sortOrder = "desc",
      search = "",
    } = options;

    let whereClause = {};

    if (search) {
      const numSearch = !isNaN(parseFloat(search))
        ? parseFloat(search)
        : undefined;

      let OR = [];
      if (numSearch !== undefined) {
        OR.push({ temperature: { equals: numSearch } });
        OR.push({ humidity: { equals: numSearch } });
        OR.push({ ambientLight: { equals: numSearch } });
      }

      if (OR.length > 0) {
        whereClause = { OR };
      }
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.sensorData.findMany({
        where: whereClause,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.sensorData.count({ where: whereClause }),
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
