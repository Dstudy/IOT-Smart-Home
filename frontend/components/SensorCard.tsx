"use client";

import React, { useEffect, useState } from "react";

interface SensorCardProps {
  title: string;
  value: number;
  unit: string;
  icon: React.ReactNode;
  type: "temp" | "humidity" | "light";
}

const SensorCard: React.FC<SensorCardProps> = ({
  title,
  value,
  unit,
  icon,
  type,
}) => {
  const [isPulsing, setIsPulsing] = useState(false);

  useEffect(() => {
    setIsPulsing(true);
    const timer = setTimeout(() => setIsPulsing(false), 1000);
    return () => clearTimeout(timer);
  }, [value]);

  // Using stronger shades (100-200-500) so the color is actually visible
  const getStatusStyles = () => {
    const val = Number(value);
    if (type === "temp") {
      if (val >= 29)
        return "from-red-100 to-red-200 border-red-300 text-red-600 shadow-red-100";
      if (val <= 20)
        return "from-blue-100 to-blue-200 border-blue-300 text-blue-600 shadow-blue-100";
      return "from-orange-100 to-orange-200 border-orange-300 text-orange-600 shadow-orange-100";
    }
    if (type === "humidity") {
      if (val > 70)
        return "from-cyan-100 to-cyan-200 border-cyan-300 text-cyan-600 shadow-cyan-100";
      return "from-indigo-100 to-indigo-200 border-indigo-300 text-indigo-600 shadow-indigo-100";
    }
    if (type === "light") {
      if (val > 300)
        return "from-yellow-100 to-yellow-200 border-yellow-300 text-yellow-700 shadow-yellow-100";
      return "from-slate-100 to-slate-200 border-slate-300 text-slate-600 shadow-slate-100";
    }
    return "from-gray-100 to-gray-200 border-gray-300 text-gray-600";
  };

  const statusClasses = getStatusStyles();

  return (
    <div
      className={`
        relative rounded-2xl p-5 border flex flex-col justify-between min-h-[140px] 
        bg-gradient-to-br transition-all duration-500 ease-in-out
        ${statusClasses}
        ${isPulsing ? "scale-[1.02] shadow-md" : "scale-100 shadow-sm"}
      `}
    >
      {/* Visual Flash Effect on update */}
      <div
        className={`absolute inset-0 transition-opacity duration-1000 rounded-2xl ${
          isPulsing ? "bg-white/30 opacity-100" : "opacity-0"
        }`}
      />

      <div className="flex items-start justify-between relative z-10">
        <h3 className="text-[11px] font-bold uppercase tracking-widest opacity-70">
          {title}
        </h3>
        <div
          className={`
            p-2 rounded-xl bg-white/80 backdrop-blur-md shadow-sm transition-all duration-500
            ${isPulsing ? "scale-125 rotate-6" : "scale-100"}
          `}
        >
          {icon}
        </div>
      </div>

      <div className="mt-auto relative z-10">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-black tracking-tight leading-none">
            {typeof value === "number" ? value.toFixed(1) : value}
          </span>
          <span className="text-sm font-bold opacity-70">{unit}</span>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="w-full h-1.5 bg-black/5 rounded-full mt-3 overflow-hidden">
          <div
            className="h-full bg-current transition-all duration-1000 ease-out opacity-60"
            style={{
              width: `${Math.min((Number(value) / (type === "light" ? 1000 : 100)) * 100, 100)}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default SensorCard;
