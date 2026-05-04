"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Calendar, RefreshCw, Power } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import { useCallback, useEffect, useState } from "react";

interface DeviceStat {
  deviceName: string;
  onCount: number;
  offCount: number;
}

const API_URL = "http://localhost:5000";

const DeviceHistoryDashboard = () => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [stats, setStats] = useState<DeviceStat[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStats = useCallback(async (date: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/devices/daily-device-breakdown?date=${date}`,
      );
      const json = await response.json();

      if (json.success) {
        setStats(json.data);
      } else {
        // 2. Update Toast Call
        toast.error("Failed to load data for this date.");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Connection error!");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats(selectedDate);
  }, [selectedDate, fetchStats]);

  return (
    <div className="p-6 mx-auto bg-gray-50 min-h-screen">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Device Activity Monitor
          </h1>
          <p className="text-gray-500">History of ON/OFF toggles per device</p>
        </div>

        <div className="flex items-center bg-white border rounded-lg px-3 py-2 shadow-sm">
          <Calendar className="text-gray-400 mr-2" size={20} />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="outline-none text-gray-700 bg-transparent"
          />
          <button
            onClick={() => fetchStats(selectedDate)}
            className="ml-4 p-1 hover:bg-gray-100 rounded-full"
          >
            <RefreshCw
              size={18}
              className={`${isLoading ? "animate-spin" : ""} text-blue-600`}
            />
          </button>
        </div>
      </div>

      {/* Chart Section */}
      {stats.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Activity Overview
          </h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f0f0f0"
                />
                <XAxis
                  dataKey="deviceName"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#000000", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: "#f9fafb" }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  labelStyle={{ color: "#414040", fontWeight: "bold" }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  height={36}
                />
                <Bar
                  name="Total ON"
                  dataKey="onCount"
                  fill="#22c55e"
                  radius={[4, 4, 0, 0]}
                  barSize={30}
                />
                <Bar
                  name="Total OFF"
                  dataKey="offCount"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                  barSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase">
                Device Name
              </th>
              <th className="px-6 py-4 text-sm font-semibold text-green-600 uppercase text-center">
                Total "ON"
              </th>
              <th className="px-6 py-4 text-sm font-semibold text-red-600 uppercase text-center">
                Total "OFF"
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {stats.length > 0 ? (
              stats.map((device) => (
                <tr
                  key={device.deviceName}
                  className="hover:bg-blue-50/30 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-gray-800">
                    {device.deviceName}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 font-bold">
                      <Power size={14} className="mr-1" /> {device.onCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-700 font-bold">
                      <Power size={14} className="mr-1" /> {device.offCount}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={3}
                  className="px-6 py-12 text-center text-gray-400"
                >
                  {isLoading
                    ? "Fetching data..."
                    : "No logs found for this date."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DeviceHistoryDashboard;
