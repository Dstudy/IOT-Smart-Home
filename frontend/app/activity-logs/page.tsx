"use client";

import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

const API_URL = "http://localhost:5000";

interface ActivityLog {
  id: number;
  deviceName: string;
  action: string;
  status: string;
  timestamp: string;
}

export default function ActivityLogsPage() {
  const [data, setData] = useState<ActivityLog[]>([]);
  const [dateSearch, setDateSearch] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [deviceFilter, setDeviceFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActivityLogs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${API_URL}/api/logs?page=${currentPage}&limit=${pageSize}&sortOrder=${sortOrder}&device=${deviceFilter === "all" ? "" : deviceFilter}&action=${actionFilter === "all" ? "" : actionFilter}&status=${statusFilter === "all" ? "" : statusFilter}&search=${searchValue}`,
      );
      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setTotalPages(result.pagination.totalPages);
      } else {
        toast.error(result.message || "Lỗi khi tải lịch sử hoạt động!");
      }
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      toast.error("Không thể kết nối đến máy chủ!");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivityLogs();
    const interval = setInterval(fetchActivityLogs, 5000);
    return () => clearInterval(interval);
  }, [
    currentPage,
    pageSize,
    sortOrder,
    deviceFilter,
    actionFilter,
    statusFilter,
    searchValue,
  ]);

  const handleSearchClick = () => {
    setSearchValue(dateSearch);
    setCurrentPage(1);
  };

  const toggleSort = () => {
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  return (
    <div className="min-h-[calc(100vh-theme(spacing.16))] bg-gray-50 text-slate-700 font-sans p-6 md:p-10 w-full h-full overflow-y-auto">
      {/* Top Bar for filters */}
      <div className="bg-white rounded-xl p-4 flex flex-col xl:flex-row items-center justify-between mb-8 shadow-sm border border-gray-200 space-y-4 xl:space-y-0 xl:space-x-4">
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 w-full xl:w-auto">
          <div className="relative w-full sm:w-64">
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
              placeholder="dd/mm/yyyy HH:mm:ss"
              value={dateSearch}
              onChange={(e) => setDateSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearchClick()}
              className="bg-gray-50 border border-gray-300 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 p-2.5 outline-none transition-all placeholder-gray-400"
            />
          </div>
          <button
            onClick={handleSearchClick}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-sm px-6 py-2.5 w-full sm:w-auto transition-colors flex items-center justify-center space-x-2 shadow-sm"
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

        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 w-full xl:w-auto">
          {/* Action Filter */}
          <div className="w-full sm:w-44 relative">
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-gray-50 border border-gray-300 text-slate-700 text-sm rounded-lg focus:ring-2 focus:ring-emerald-500 block w-full p-2.5 outline-none cursor-pointer appearance-none pr-10"
            >
              <option value="all">Tất cả hành động</option>
              <option value="ON">ON (Bật)</option>
              <option value="OFF">OFF (Tắt)</option>
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

          {/* Status Filter */}
          <div className="w-full sm:w-44 relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-gray-50 border border-gray-300 text-slate-700 text-sm rounded-lg focus:ring-2 focus:ring-emerald-500 block w-full p-2.5 outline-none cursor-pointer appearance-none pr-10"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="Thành công">Thành công</option>
              <option value="Thất bại">Thất bại</option>
              <option value="Chờ xử lí">Chờ xử lí</option>
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

          {/* Device Filter */}
          <div className="w-full sm:w-44 relative">
            <select
              value={deviceFilter}
              onChange={(e) => {
                setDeviceFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-gray-50 border border-gray-300 text-slate-700 text-sm rounded-lg focus:ring-2 focus:ring-emerald-500 block w-full p-2.5 outline-none cursor-pointer appearance-none pr-10"
            >
              <option value="all">Tất cả thiết bị</option>
              <option value="Air Conditioner">Air Conditioner</option>
              <option value="Fan">Fan</option>
              <option value="Light">Light</option>
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
                  Thiết bị
                </th>
                <th scope="col" className="px-6 py-4 tracking-wider font-bold">
                  Hành động
                </th>
                <th scope="col" className="px-6 py-4 tracking-wider font-bold">
                  Trạng thái
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 tracking-wider font-bold cursor-pointer hover:text-emerald-600 transition-colors"
                  onClick={toggleSort}
                >
                  <div className="flex items-center space-x-2 select-none">
                    <span>Thời gian</span>
                    <span className="text-emerald-600">
                      {sortOrder === "desc" ? "↓" : "↑"}
                    </span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading && data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                    <p className="mt-2 text-gray-400 text-sm font-medium">
                      Đang tải dữ liệu...
                    </p>
                  </td>
                </tr>
              ) : data.length > 0 ? (
                data.map((item, index) => (
                  <tr
                    key={item.id || index}
                    className="hover:bg-emerald-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-slate-400">
                      #{item.id}
                    </td>
                    <td className="px-6 py-4 text-slate-900 font-semibold">
                      {item.deviceName}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded text-xs font-bold ${
                          item.action === "ON"
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                            : "bg-gray-100 text-gray-600 border border-gray-200"
                        }`}
                      >
                        {item.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          item.status === "Thành công" ||
                          item.status.includes("Normal")
                            ? "bg-green-50 text-green-700 border-green-100"
                            : item.status === "Thất bại" ||
                                item.status === "Error"
                              ? "bg-red-50 text-red-700 border-red-100"
                              : "bg-amber-50 text-amber-700 border-amber-100"
                        }`}
                      >
                        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current"></span>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                      {formatDate(item.timestamp)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    Không có dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
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
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition-all text-slate-600"
            >
              Trước
            </button>
            <button
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition-all text-slate-600"
            >
              Sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
