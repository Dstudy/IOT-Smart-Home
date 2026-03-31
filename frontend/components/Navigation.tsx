'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

const Navigation: React.FC = () => {
    const pathname = usePathname();

    const navItems = [
        { href: '/', label: 'Dashboard', icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        )},
        { href: '/sensor-data', label: 'Sensor Data', icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
        )},
        { href: '/activity-logs', label: 'Activity logs', icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        )},
        { href: '/profile', label: 'Profile', icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
        )},
    ];

    return (
        <nav className="w-64 bg-white h-full flex flex-col shadow-sm border-r border-gray-100 flex-shrink-0">
            <div className="p-6">
                <div className="flex items-center space-x-3 mb-8">
                    <div className="text-gray-800">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-gray-800 leading-tight">Smart Home</h1>
                        <p className="text-xs text-gray-400">Control System</p>
                    </div>
                </div>

                <div className="space-y-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                                    isActive
                                        ? 'bg-gradient-to-r from-pink-500 to-cyan-500 text-white shadow-md'
                                        : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                <span className={isActive ? 'text-white' : 'text-gray-500'}>
                                    {item.icon}
                                </span>
                                <span className="font-semibold text-sm">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
};

export default Navigation;
