"use client";

import React, { useEffect, useState, useCallback } from "react";
import SensorCard from "@/components/SensorCard";
import DeviceControl from "@/components/DeviceControl";
import RealtimeChart from "@/components/RealtimeChart";
import { Thermometer, Droplets, Sun } from "lucide-react";
import { toast } from "react-toastify";

const API_URL = "http://localhost:5000";
const WS_URL = "ws://localhost:5000";

// --- Interfaces ---
interface DeviceStats {
  deviceName: string;
  onCount: number;
  offCount: number;
  total: number;
}

interface DailyChartData {
  date: string;
  count: number;
}

interface SensorData {
  temperature: number;
  humidity: number;
  ambientLight: number;
  timestamp: Date;
}

interface Device {
  name: string;
  status: "ON" | "OFF";
  lastToggled: Date;
  autoMode?: boolean;
}

interface Devices {
  ac: Device;
  fan: Device;
  light: Device;
  [key: string]: Device;
}

export default function Dashboard() {
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [devices, setDevices] = useState<Devices | null>(null);
  const [chartData, setChartData] = useState<SensorData[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "disconnected" | "connecting"
  >("connecting");

  const [dailyStats, setDailyStats] = useState<DailyChartData[]>([]);

  // 1. Hàm fetch thống kê cho từng thiết bị của một ngày cụ thể
  const fetchStats = useCallback(async (targetDate?: string) => {
    try {
      // Nếu targetDate có giá trị (ví dụ "2024-05-02"), thêm nó vào query string
      // Nếu không, API sẽ mặc định lấy ngày hôm nay
      const url = targetDate
        ? `${API_URL}/api/devices/daily-device-breakdown?date=${targetDate}`
        : `${API_URL}/api/devices/daily-device-breakdown`;

      const dailyRes = await fetch(url);
      const dailyJson = await dailyRes.json();

      if (dailyJson.success) {
        setDailyStats(dailyJson.data);
      } else {
        throw new Error(dailyJson.error);
      }
    } catch (error: any) {
      console.error("Lỗi khi fetch thống kê:", error);
      toast.error("Không thể tải thông tin thống kê: " + error.message);
    }
  }, []);

  const connectWebSocket = useCallback(() => {
    setConnectionStatus("connecting");
    const websocket = new WebSocket(WS_URL);
    websocket.onopen = () => setConnectionStatus("connected");
    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "initial" || message.type === "sensorUpdate") {
        const data = message.data;
        setSensorData({
          temperature: data.temperature,
          humidity: data.humidity,
          ambientLight: data.ambientLight,
          timestamp: new Date(data.timestamp),
        });
        if (data.devices) setDevices(data.devices);
        setChartData((prev) =>
          [...prev, { ...data, timestamp: new Date(data.timestamp) }].slice(
            -15,
          ),
        );
      }
    };
    websocket.onclose = () => {
      setConnectionStatus("disconnected");
      setTimeout(() => connectWebSocket(), 3000);
    };
    return websocket;
  }, []);

  // Khởi tạo
  useEffect(() => {
    const websocket = connectWebSocket();

    // Fetch dữ liệu thiết bị ban đầu
    fetch(`${API_URL}/api/devices`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setDevices(data.data);
      });

    // Fetch thống kê ban đầu
    fetchStats();

    return () => websocket.close();
  }, [connectWebSocket, fetchStats]);

  const handleDeviceToggle = async (deviceName: string) => {
    try {
      const response = await fetch(
        `${API_URL}/api/devices/${deviceName}/toggle`,
        { method: "POST" },
      );
      const data = await response.json();
      if (data.success && devices) {
        setDevices((prevDevices) => {
          if (!prevDevices) return null;
          return { ...prevDevices, [deviceName]: data.data };
        });
        toast.success(
          `Đã ${data.data.status === "ON" ? "bật" : "tắt"} thiết bị thành công!`,
        );
        // Sau khi bật/tắt thành công, cập nhật lại bảng thống kê ngay lập tức
        fetchStats();
      } else {
        toast.error(data.message || "Lỗi khi điều khiển thiết bị!");
      }
    } catch (error) {
      console.error(error);
      toast.error("Không thể kết nối đến máy chủ!");
    }
  };

  const handleAutoChange = async (deviceName: string, autoMode: boolean) => {
    try {
      const response = await fetch(
        `${API_URL}/api/devices/${deviceName}/auto`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ autoMode }),
        },
      );
      const data = await response.json();
      if (data.success && devices) {
        setDevices({ ...devices, [deviceName]: data.data });
        toast.success(`Đã ${autoMode ? "bật" : "tắt"} chế độ tự động!`);
      } else {
        toast.error(data.message || "Lỗi khi cập nhật chế độ tự động!");
      }
    } catch (error) {
      console.error(error);
      toast.error("Không thể cập nhật chế độ tự động!");
    }
  };

  if (!sensorData)
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 font-sans text-gray-500">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Đang kết nối hệ thống...</span>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen w-full bg-gray-50 p-4 flex flex-col gap-4 font-sans overflow-y-auto">
      {/* 1. Header */}
      <div className="flex justify-between items-center mb-2 shrink-0">
        <h1 className="text-xl font-bold text-gray-800">Smart Home Central</h1>
        <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full shadow-sm border border-gray-100">
          <div
            className={`w-2 h-2 rounded-full ${connectionStatus === "connected" ? "bg-green-500" : "bg-red-500"}`}
          />
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            {connectionStatus}
          </span>
        </div>
      </div>

      {/* 2. Top Row: Sensor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
        <SensorCard
          title="Nhiệt độ"
          value={sensorData.temperature}
          unit="°C"
          type="temp"
          icon={<Thermometer className="w-5 h-5" />}
        />
        <SensorCard
          title="Độ ẩm"
          value={sensorData.humidity}
          unit="%"
          type="humidity"
          icon={<Droplets className="w-5 h-5" />}
        />
        <SensorCard
          title="Ánh sáng"
          value={sensorData.ambientLight}
          unit="Lux"
          type="light"
          icon={<Sun className="w-5 h-5" />}
        />
      </div>

      {/* 3. Main Content: Chart & Control */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[350px]">
        <div className="lg:col-span-2 bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            Lịch sử môi trường (Real-time)
          </h2>
          <div className="flex-1 w-full">
            <RealtimeChart data={chartData} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            Điều khiển nhanh
          </h2>
          {devices && (
            <>
              <DeviceControl
                deviceName="ac"
                displayName="Điều hòa"
                status={devices.ac.status}
                onToggle={handleDeviceToggle}
              />
              <DeviceControl
                deviceName="fan"
                displayName="Quạt trần"
                status={devices.fan.status}
                onToggle={handleDeviceToggle}
              />
              <DeviceControl
                deviceName="light"
                displayName="Đèn chính"
                status={devices.light.status}
                onToggle={handleDeviceToggle}
                autoMode={devices.light.autoMode}
                onAutoChange={handleAutoChange}
              />
              <DeviceControl
                deviceName="dehumidifier"
                displayName="Máy hút ẩm"
                status={devices.dehumidifier.status}
                onToggle={handleDeviceToggle}
              />
              <DeviceControl
                deviceName="screen"
                displayName="Màn hình"
                status={devices.screen.status}
                onToggle={handleDeviceToggle}
              />
            </>
          )}
          <div className="mt-auto p-3 bg-emerald-50 rounded-lg border border-emerald-100">
            <p className="text-[11px] text-emerald-700 font-medium italic">
              Hệ thống đang hoạt động ổn định.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
