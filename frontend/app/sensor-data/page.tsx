'use client';

import React, { useEffect, useState } from 'react';

const API_URL = 'http://localhost:5000';

interface SensorRecord {
    id: number;
    temperature: number;
    humidity: number;
    ambientLight: number;
    timestamp: string;
}

interface FlattenedRecord {
    id: string;
    sensor: string;
    value: string;
    timestamp: string;
    timestampMs: number;
}

export default function SensorDataPage() {
    const [data, setData] = useState<SensorRecord[]>([]);
    const [dateSearch, setDateSearch] = useState('');
    const [searchValue, setSearchValue] = useState(''); // triggers backend fetch
    const [selectedSensor, setSelectedSensor] = useState('all');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    
    // Pagination from backend
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(20);
    const [totalPages, setTotalPages] = useState(1);

    const fetchSensorData = async () => {
        try {
            const response = await fetch(
                `${API_URL}/api/sensors/history?page=${currentPage}&limit=${pageSize}&sortBy=timestamp&sortOrder=desc&search=${searchValue}`
            );
            const result = await response.json();

            if (result.success) {
                setData(result.data);
                setTotalPages(result.pagination.totalPages);
            }
        } catch (error) {
            console.error('Error fetching sensor data:', error);
        }
    };

    useEffect(() => {
        fetchSensorData();
    }, [currentPage, pageSize, searchValue]);

    const handleSearchClick = () => {
        setSearchValue(dateSearch);
        setCurrentPage(1);
    };

    const formatDate = (dateString: string) => {
        const d = new Date(dateString);
        // format to YYYY-MM-DD HH:mm:ss
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };

    // Flatten data
    let flattenedData: FlattenedRecord[] = [];
    data.forEach((record) => {
        const baseId = record.id * 10;
        const timeStr = formatDate(record.timestamp);
        const timeMs = new Date(record.timestamp).getTime();
        
        // Push in specific order or reverse to match screenshot IDs
        flattenedData.push({ id: `#${baseId + 1}`, sensor: 'Độ ẩm', value: `${record.humidity.toFixed(1)} %`, timestamp: timeStr, timestampMs: timeMs });
        flattenedData.push({ id: `#${baseId + 2}`, sensor: 'Nhiệt độ', value: `${record.temperature.toFixed(1)} °C`, timestamp: timeStr, timestampMs: timeMs + 1 });
        flattenedData.push({ id: `#${baseId + 3}`, sensor: 'Ánh sáng', value: `${Math.round(record.ambientLight)} lx`, timestamp: timeStr, timestampMs: timeMs + 2 });
    });

    // Filter by sensor dropdown
    let displayData = flattenedData;
    if (selectedSensor !== 'all') {
        displayData = displayData.filter(item => item.sensor === selectedSensor);
    }
    
    // Custom sort across the flattened data
    if (sortOrder === 'asc') {
        displayData.sort((a, b) => a.timestampMs - b.timestampMs);
    } else {
        displayData.sort((a, b) => b.timestampMs - a.timestampMs);
    }

    const toggleSort = () => {
        setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
    };

    return (
        <div className="min-h-[calc(100vh-theme(spacing.16))] bg-[#0f172a] text-gray-300 font-sans p-6 md:p-10 w-full h-full overflow-y-auto">
            {/* Top Bar for filters */}
            <div className="bg-[#1e293b] rounded-xl p-4 flex flex-col md:flex-row items-center justify-between mb-8 shadow-lg border border-gray-700">
                <div className="flex items-center space-x-4 w-full md:w-auto mb-4 md:mb-0">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="dd/mm/yyyy HH:mm:ss"
                            value={dateSearch}
                            onChange={(e) => setDateSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
                            className="bg-[#0f172a] border border-gray-700 text-gray-300 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 p-2.5 outline-none transition-colors placeholder-gray-500"
                        />
                    </div>
                    <button 
                        onClick={handleSearchClick}
                        className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold rounded-lg text-sm px-5 py-2.5 transition-colors flex items-center space-x-2 shadow-md"
                    >
                        <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span>Tìm kiếm</span>
                    </button>
                </div>
                
                <div className="w-full md:w-48 relative">
                    <select 
                        value={selectedSensor}
                        onChange={(e) => setSelectedSensor(e.target.value)}
                        className="bg-[#0f172a] border border-gray-700 text-gray-300 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full p-2.5 outline-none cursor-pointer appearance-none"
                    >
                        <option value="all">Tất cả cảm biến</option>
                        <option value="Độ ẩm">Độ ẩm</option>
                        <option value="Ánh sáng">Ánh sáng</option>
                        <option value="Nhiệt độ">Nhiệt độ</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                        <svg className="w-4 h-4 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-[#1e293b] rounded-xl shadow-lg border border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-emerald-500 uppercase border-b border-gray-700 bg-[#1e293b]">
                            <tr>
                                <th scope="col" className="px-6 py-5 tracking-wider font-semibold">ID</th>
                                <th scope="col" className="px-6 py-5 tracking-wider font-semibold">Cảm biến</th>
                                <th scope="col" className="px-6 py-5 tracking-wider font-semibold">Giá trị cảm biến</th>
                                <th scope="col" className="px-6 py-5 tracking-wider font-semibold cursor-pointer hover:text-emerald-400 transition-colors" onClick={toggleSort}>
                                    <div className="flex items-center space-x-2 select-none">
                                        <span>Thời gian</span>
                                        <span className="text-lg leading-none">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayData.length > 0 ? displayData.map((item, index) => (
                                <tr key={index} className="bg-[#1e293b] border-b border-gray-700 hover:bg-[#2c3e50] transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-400 whitespace-nowrap">{item.id}</td>
                                    <td className="px-6 py-4 text-gray-300 whitespace-nowrap">{item.sensor}</td>
                                    <td className="px-6 py-4 font-bold text-gray-200 whitespace-nowrap">{item.value}</td>
                                    <td className="px-6 py-4 text-gray-400 whitespace-nowrap">{item.timestamp}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500 text-base">
                                        Không có dữ liệu
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Custom Pagination Controls matching dark theme */}
                <div className="p-5 flex items-center justify-between border-t border-gray-700 bg-[#1e293b]">
                    <span className="text-sm text-gray-400">Trang {currentPage} / {totalPages}</span>
                    <div className="flex space-x-3">
                        <button 
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                            className="px-5 py-2 border border-gray-600 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-[#2c3e50] transition-colors text-gray-300"
                        >
                            Trước
                        </button>
                        <button 
                            disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => setCurrentPage(p => p + 1)}
                            className="px-5 py-2 border border-gray-600 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-[#2c3e50] transition-colors text-gray-300"
                        >
                            Sau
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
