'use client';

import React, { useRef } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

interface DataPoint {
    temperature: number;
    humidity: number;
    ambientLight: number;
    timestamp: Date;
}

interface RealtimeChartProps {
    data: DataPoint[];
}

const RealtimeChart: React.FC<RealtimeChartProps> = ({ data }) => {
    const chartRef = useRef<ChartJS<'line'>>(null);

    const chartData = {
        labels: data.map(d => new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })),
        datasets: [
            {
                label: 'Temperature (°C)',
                data: data.map(d => d.temperature),
                borderColor: '#f97316', // orange-500
                backgroundColor: '#f97316',
                pointBackgroundColor: '#fff',
                pointBorderColor: '#f97316',
                pointBorderWidth: 2,
                pointRadius: 4,
                tension: 0.1,
                borderWidth: 2,
                yAxisID: 'y',
            },
            {
                label: 'Humidity (%)',
                data: data.map(d => d.humidity),
                borderColor: '#20c2f6',
                backgroundColor: '#20c2f6',
                pointBackgroundColor: '#fff',
                pointBorderColor: '#20c2f6',
                pointBorderWidth: 2,
                pointRadius: 4,
                tension: 0.1,
                borderWidth: 2,
                yAxisID: 'y',
            },
            {
                label: 'Ambient Light (Lux)',
                data: data.map(d => d.ambientLight),
                borderColor: '#facc15', // yellow-400
                backgroundColor: '#facc15',
                pointBackgroundColor: '#fff',
                pointBorderColor: '#facc15',
                pointBorderWidth: 2,
                pointRadius: 4,
                tension: 0.1,
                borderWidth: 2,
                yAxisID: 'y1',
            },
        ],
    };

    const options: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index' as const,
            intersect: false,
        },
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: {
                    usePointStyle: true,
                    boxWidth: 8,
                    boxHeight: 8,
                    padding: 20,
                    font: {
                        size: 13,
                        family: 'system-ui, -apple-system, sans-serif'
                    },
                    color: '#666'
                }
            },
            title: {
                display: false,
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                titleColor: '#333',
                bodyColor: '#666',
                borderColor: '#eee',
                borderWidth: 1,
            }
        },
        scales: {
            x: {
                grid: {
                    display: true,
                    drawOnChartArea: true,
                    color: '#f3f4f6', // faint grid lines
                },
                ticks: {
                    color: '#9ca3af',
                    font: { size: 11 }
                },
                border: { display: false }
            },
            y: {
                type: 'linear' as const,
                display: true,
                position: 'left' as const,
                min: 0,
                max: 100, // Humidity is up to 100, Temp is around 20-35
                grid: {
                    color: '#f3f4f6',
                },
                ticks: {
                    color: '#9ca3af',
                    font: { size: 11 },
                    stepSize: 20
                },
                border: { display: false }
            },
            y1: {
                type: 'linear' as const,
                display: true,
                position: 'right' as const,
                min: 0,
                max: 5000,
                grid: { display: false },
                ticks: {
                    color: '#9ca3af',
                    font: { size: 11 },
                },
                border: { display: false }
            },
        },
    };

    return (
        <Line ref={chartRef} data={chartData} options={options} />
    );
};

export default RealtimeChart;
