'use client';

import React, { useEffect, useState, useCallback } from 'react';
import SensorCard from '@/components/SensorCard';
import DeviceControl from '@/components/DeviceControl';
import RealtimeChart from '@/components/RealtimeChart';

// Import Icons (Giả sử bạn dùng lucide-react hoặc tương tự)
// Nếu không, hãy thay thế bằng string hoặc component icon của bạn
import { Thermometer, Droplets, Sun } from 'lucide-react';

const API_URL = 'http://localhost:5000';
const WS_URL = 'ws://localhost:5000';

interface SensorData {
  temperature: number;
  humidity: number;
  ambientLight: number;
  timestamp: Date;
}

interface Device {
  name: string;
  status: 'ON' | 'OFF';
  lastToggled: Date;
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
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');

  const connectWebSocket = useCallback(() => {
    setConnectionStatus('connecting');
    const websocket = new WebSocket(WS_URL);
    websocket.onopen = () => setConnectionStatus('connected');
    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'initial' || message.type === 'sensorUpdate') {
        const data = message.data;
        setSensorData({
          temperature: data.temperature,
          humidity: data.humidity,
          ambientLight: data.ambientLight,
          timestamp: new Date(data.timestamp)
        });
        if (data.devices) setDevices(data.devices);
        setChartData(prev => [...prev, { ...data, timestamp: new Date(data.timestamp) }].slice(-15));
      }
    };
    websocket.onclose = () => {
      setConnectionStatus('disconnected');
      setTimeout(() => connectWebSocket(), 3000);
    };
    return websocket;
  }, []);

  useEffect(() => {
    const websocket = connectWebSocket();
    fetch(`${API_URL}/api/devices`)
      .then(res => res.json())
      .then(data => { if (data.success) setDevices(data.data); });
    return () => websocket.close();
  }, [connectWebSocket]);

  const handleDeviceToggle = async (deviceName: string) => {
    try {
      const response = await fetch(`${API_URL}/api/devices/${deviceName}/toggle`, { method: 'POST' });
      const data = await response.json();
      if (data.success && devices) {
        setDevices({ ...devices, [deviceName]: data.data });
      }
    } catch (error) { console.error(error); }
  };

  if (!sensorData) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="h-screen w-full bg-gray-50 p-4 flex flex-col overflow-hidden font-sans">

      {/* 1. Header */}
      <div className="flex justify-between items-center mb-4 shrink-0">
        <h1 className="text-xl font-bold text-gray-800">Smart Home Central</h1>
        <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full shadow-sm border border-gray-100">
          <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{connectionStatus}</span>
        </div>
      </div>

      {/* 2. Top Row: 3 Sensor Cards với Gradient màu sắc */}
      <div className="grid grid-cols-3 gap-4 mb-4 shrink-0">
        <SensorCard
          title="Nhiệt độ"
          value={sensorData.temperature}
          unit="°C"
          icon={<Thermometer className="w-5 h-5" />}
          iconColor="text-red-500"
          // Gradient nhẹ màu Đỏ
          gradientClass="from-red-50 to-red-100/50 border border-red-100"
        />
        <SensorCard
          title="Độ ẩm"
          value={sensorData.humidity}
          unit="%"
          icon={<Droplets className="w-5 h-5" />}
          iconColor="text-blue-500"
          // Gradient nhẹ màu Xanh nước biển
          gradientClass="from-blue-50 to-blue-100/50 border border-blue-100"
        />
        <SensorCard
          title="Ánh sáng"
          value={sensorData.ambientLight}
          unit="Lux"
          icon={<Sun className="w-5 h-5" />}
          iconColor="text-yellow-600"
          // Gradient nhẹ màu Vàng
          gradientClass="from-yellow-50 to-yellow-100/50 border border-yellow-100"
        />
      </div>

      {/* 3. Main Content: Giữ nguyên bố cục không scroll */}
      <div className="flex flex-1 gap-4 overflow-hidden">

        {/* Cột trái: Chart */}
        <div className="flex-[2] flex flex-col overflow-hidden">
          <div className="flex-1 bg-white p-4 rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Lịch sử môi trường (Real-time)</h2>
            <div className="h-full w-full pb-8">
              <RealtimeChart data={chartData} />
            </div>
          </div>
        </div>

        {/* Cột phải: 3 nút điều khiển dọc */}
        <div className="flex-1 bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Điều khiển nhanh</h2>
          {devices && (
            <>
              <DeviceControl deviceName="ac" displayName="Điều hòa" status={devices.ac.status} onToggle={handleDeviceToggle} />
              <DeviceControl deviceName="fan" displayName="Quạt trần" status={devices.fan.status} onToggle={handleDeviceToggle} />
              <DeviceControl deviceName="light" displayName="Đèn chính" status={devices.light.status} onToggle={handleDeviceToggle} />
            </>
          )}
          <div className="mt-auto p-3 bg-gray-50 rounded-lg border border-gray-100">
            <p className="text-[11px] text-gray-600 font-medium">Hệ thống đang hoạt động ổn định.</p>
          </div>
        </div>

      </div>
    </div>
  );
}