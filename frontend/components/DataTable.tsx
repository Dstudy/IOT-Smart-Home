'use client';

import React from 'react';

interface Column {
    key: string;
    label: string;
    sortable?: boolean;
    render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
    columns: Column[];
    data: any[];
    currentPage: number;
    totalPages: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    onSort?: (key: string) => void;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    searchPlaceholder?: string;
}

const DataTable: React.FC<DataTableProps> = ({
    columns,
    data,
    currentPage,
    totalPages,
    pageSize,
    onPageChange,
    onPageSizeChange,
    onSort,
    sortBy,
    sortOrder,
    searchValue,
    onSearchChange,
    searchPlaceholder = 'Search...'
}) => {
    return (
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
            {/* Search Bar */}
            {onSearchChange && (
                <div className="p-4 border-b border-gray-200">
                    <input
                        type="text"
                        value={searchValue || ''}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder={searchPlaceholder}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>{column.label}</span>
                                        {column.sortable && onSort && (
                                            <button
                                                onClick={() => onSort(column.key)}
                                                className="ml-2 text-gray-400 hover:text-gray-600"
                                            >
                                                {sortBy === column.key ? (
                                                    sortOrder === 'asc' ? '↑' : '↓'
                                                ) : (
                                                    '↕'
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="px-6 py-8 text-center text-gray-500"
                                >
                                    No data available
                                </td>
                            </tr>
                        ) : (
                            data.map((row, rowIndex) => (
                                <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
                                    {columns.map((column) => (
                                        <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {column.render
                                                ? column.render(row[column.key], row)
                                                : row[column.key]}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700">Rows per page:</span>
                    <select
                        value={pageSize}
                        onChange={(e) => onPageSizeChange(Number(e.target.value))}
                        className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                    </select>
                </div>

                <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700">
                        Page {currentPage} of {totalPages}
                    </span>
                    <div className="flex space-x-1">
                        <button
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DataTable;
