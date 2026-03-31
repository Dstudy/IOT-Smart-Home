'use client';

import React from 'react';

interface SensorCardProps {
    title: string;
    value: number | string;
    unit: string;
    icon: React.ReactNode | string;
    gradientClass: string;
    iconColor?: string;
}

const SensorCard: React.FC<SensorCardProps> = ({
    title,
    value,
    unit,
    icon,
    gradientClass,
    iconColor = 'text-gray-500'
}) => {
    return (
        <div
            className={`relative rounded-xl p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-between min-h-[128px] bg-gradient-to-br ${gradientClass} overflow-hidden`}
        >
            {/* Nội dung chính luôn nằm trên cùng */}
            <div className="flex items-start justify-between relative z-10">
                <h3 className="text-[15px] font-medium text-gray-700">{title}</h3>
                <span className={`text-xl ${iconColor}`}>{icon}</span>
            </div>

            <div className="mt-auto relative z-10">
                <div className="text-gray-800 flex items-baseline space-x-1">
                    <span className="text-3xl font-medium tracking-tight">
                        {typeof value === 'number' ? value.toFixed(1) : value}
                    </span>
                    <span className="text-lg font-medium text-gray-700">{unit}</span>
                </div>
            </div>

        </div>
    );
};

export default SensorCard;