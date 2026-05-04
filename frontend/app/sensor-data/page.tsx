"use client";

import React, { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";

const API_URL = "http://localhost:5000";

interface SensorRecord {
  id: number; // Thêm trường này từ DB
  sensorId: number;
  value: number;
  timestamp: string;
}

export default function SensorDataPage() {
  const [data, setData] = useState<SensorRecord[]>([]);
  const [dateSearch, setDateSearch] = useState("");
  const [valueSearch, setValueSearch] = useState(""); // triggers backend fetch
  const [selectedSensor, setSelectedSensor] = useState("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Pagination from backend
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const fetchSensorData = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/sensors/history?page=${currentPage}&limit=${pageSize}&sortBy=timestamp&sortOrder=desc&searchDate=${dateSearch}&searchValue=${valueSearch}&sensorType=${selectedSensor}`,
      );

      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setTotalPages(result.pagination.totalPages);
      } else {
        console.error("API returned success: false", result);
        toast.error(result.message || "Lỗi khi tải dữ liệu cảm biến!");
      }
    } catch (error) {
      console.error("Error fetching sensor data:", error);
      toast.error("Không thể kết nối đến máy chủ!");
    }
  }, [currentPage, pageSize, dateSearch, valueSearch, selectedSensor]);

  useEffect(() => {
    fetchSensorData();
  }, [fetchSensorData]);

  const handleSearchClick = () => {
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    // format to YYYY-MM-DD HH:mm:ss
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  const displayData = data.map((record) => {
    let sensorName = "";
    let unit = "";

    // Mapping dựa trên ảnh DB của bạn (ví dụ 1: Nhiệt độ, 2: Độ ẩm, 3: Ánh sáng)
    switch (record.sensorId) {
      case 1:
        sensorName = "Nhiệt độ";
        unit = "°C";
        break;
      case 2:
        sensorName = "Độ ẩm";
        unit = "%";
        break;
      case 3:
        sensorName = "Ánh sáng";
        unit = "lx";
        break;
      default:
        sensorName = "Cảm biến";
    }

    return {
      id: `#${record.id}`, // Lấy trực tiếp ID từ DB
      sensor: sensorName,
      value: `${record.value} ${unit}`,
      timestamp: formatDate(record.timestamp),
      timestampMs: new Date(record.timestamp).getTime(),
    };
  });

  // Custom sort across the flattened data
  if (sortOrder === "asc") {
    displayData.sort((a, b) => a.timestampMs - b.timestampMs);
  } else {
    displayData.sort((a, b) => b.timestampMs - a.timestampMs);
  }

  const toggleSort = () => {
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
  };
  return (
    <div className="min-h-[calc(100vh-theme(spacing.16))] bg-gray-50 text-slate-700 font-sans p-6 md:p-10 w-full h-full overflow-y-auto">
      {/* Top Bar for filters */}
      <div className="bg-white rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 mb-8 shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 w-full md:w-auto">
          {/* Search by Date */}
          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg
                className="w-5 h-5 text-emerald-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Ngày: dd/mm/yyyy"
              value={dateSearch}
              onChange={(e) => setDateSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearchClick()}
              className="bg-gray-50 border border-gray-300 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 p-2.5 outline-none transition-all placeholder-gray-400"
            />
          </div>

          {/* Search by Value */}
          <div className="relative w-full md:w-48">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg
                className="w-5 h-5 text-emerald-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Giá trị: 25.5"
              value={valueSearch}
              onChange={(e) => setValueSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearchClick()}
              className="bg-gray-50 border border-gray-300 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 p-2.5 outline-none transition-all placeholder-gray-400"
            />
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearchClick}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-sm px-6 py-2.5 transition-colors flex items-center space-x-2 shadow-sm w-full md:w-auto justify-center"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <span>Tìm kiếm</span>
          </button>
        </div>

        {/* Sensor Dropdown */}
        <div className="w-full md:w-48 relative">
          <select
            value={selectedSensor}
            onChange={(e) => {
              setSelectedSensor(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-gray-50 border border-gray-300 text-slate-700 text-sm rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 block w-full p-2.5 outline-none cursor-pointer appearance-none pr-10"
          >
            <option value="all">Tất cả cảm biến</option>
            <option value="Độ ẩm">Độ ẩm</option>
            <option value="Ánh sáng">Ánh sáng</option>
            <option value="Nhiệt độ">Nhiệt độ</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="text-xs text-slate-500 uppercase bg-gray-50 border-b border-gray-200">
              <tr>
                <th scope="col" className="px-6 py-4 tracking-wider font-bold">
                  ID
                </th>
                <th scope="col" className="px-6 py-4 tracking-wider font-bold">
                  Cảm biến
                </th>
                <th scope="col" className="px-6 py-4 tracking-wider font-bold">
                  Giá trị cảm biến
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 tracking-wider font-bold cursor-pointer hover:text-emerald-600 transition-colors"
                  onClick={toggleSort}
                >
                  <div className="flex items-center space-x-2 select-none">
                    <span>Thời gian</span>
                    <span className="text-emerald-600 font-bold">
                      {sortOrder === "desc" ? "↓" : "↑"}
                    </span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayData.length > 0 ? (
                displayData.map((item, index) => (
                  <tr
                    key={index}
                    className="hover:bg-emerald-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-slate-500">
                      {item.id}
                    </td>
                    <td className="px-6 py-4 text-slate-700">{item.sensor}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {item.value}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {item.timestamp}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    Không có dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 flex items-center justify-between bg-white border-t border-gray-100">
          <span className="text-sm text-slate-500">
            Trang{" "}
            <span className="font-semibold text-slate-900">{currentPage}</span>{" "}
            / {totalPages}
          </span>
          <div className="flex space-x-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-gray-50 hover:border-gray-300 transition-all text-slate-600"
            >
              Trước
            </button>
            <button
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-gray-50 hover:border-gray-300 transition-all text-slate-600"
            >
              Sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
