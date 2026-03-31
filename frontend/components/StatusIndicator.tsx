'use client';

import React from 'react';

interface StatusIndicatorProps {
    status: 'Normal' | 'Warning' | 'Fire';
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status }) => {
    const getStatusConfig = () => {
        switch (status) {
            case 'Fire':
                return {
                    bgColor: 'bg-red-500',
                    textColor: 'text-white',
                    icon: '🔥',
                    message: 'FIRE DETECTED - IMMEDIATE ACTION REQUIRED'
                };
            case 'Warning':
                return {
                    bgColor: 'bg-yellow-500',
                    textColor: 'text-white',
                    icon: '⚠️',
                    message: 'WARNING - Elevated sensor readings detected'
                };
            default:
                return {
                    bgColor: 'bg-green-500',
                    textColor: 'text-white',
                    icon: '✓',
                    message: 'System Operating Normally'
                };
        }
    };

    const config = getStatusConfig();

    return (
        <div className={`${config.bgColor} ${config.textColor} rounded-lg p-6 shadow-lg mb-6 animate-pulse`}>
            <div className="flex items-center justify-center space-x-4">
                <span className="text-4xl">{config.icon}</span>
                <div>
                    <h2 className="text-2xl font-bold">System Status: {status.toUpperCase()}</h2>
                    <p className="text-sm opacity-90 mt-1">{config.message}</p>
                </div>
            </div>
        </div>
    );
};

export default StatusIndicator;
