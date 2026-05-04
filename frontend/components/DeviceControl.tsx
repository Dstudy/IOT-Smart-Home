"use client";

import React, { useState } from "react";
import { toast } from "react-toastify";

interface DeviceControlProps {
  deviceName: string;
  displayName: string;
  status: "ON" | "OFF";
  onToggle: (deviceName: string) => Promise<void>;
  autoMode?: boolean;
  onAutoChange?: (deviceName: string, autoMode: boolean) => Promise<void>;
}

const DeviceControl: React.FC<DeviceControlProps> = ({
  deviceName,
  displayName,
  status,
  onToggle,
  autoMode = false,
  onAutoChange,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleAutoToggle = () => {
    if (onAutoChange) {
      onAutoChange(deviceName, !autoMode);
    }
  };

  const handleToggle = async () => {
    // Prevent toggle if loading OR if autoMode is active
    if (isLoading || autoMode) return;

    setIsLoading(true);
    try {
      await onToggle(deviceName);
    } catch (error) {
      console.error("Error toggling device:", error);
      toast.error("Lỗi khi thay đổi trạng thái thiết bị!");
    } finally {
      setIsLoading(false);
    }
  };

  const isOn = status === "ON";

  const getColorClass = () => {
    if (isLoading) return "bg-gray-400 text-white";

    // Style for when manual control is disabled by Auto Mode
    if (autoMode)
      return "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed";

    if (isOn) {
      return "bg-blue-500 hover:bg-blue-600 text-white";
    }

    return "bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium";
  };

  return (
    <div
      className={`bg-white rounded-xl p-5 shadow-sm border border-gray-100 w-full flex flex-col items-center justify-center transition-opacity ${autoMode ? "opacity-95" : "opacity-100"}`}
    >
      <div className="w-full flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
          {displayName}
        </h3>
        {autoMode && (
          <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold animate-pulse">
            AUTO
          </span>
        )}
      </div>

      <button
        onClick={handleToggle}
        // Disable if loading OR if autoMode is enabled
        disabled={isLoading || autoMode}
        className={`w-full py-3 px-4 rounded-xl font-bold tracking-wide transition-all duration-200 flex justify-center items-center ${getColorClass()} ${
          isLoading || autoMode
            ? "cursor-not-allowed"
            : "shadow-sm active:scale-95"
        }`}
      >
        {isLoading ? (
          <span className="flex items-center space-x-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </span>
        ) : (
          <span className="flex items-center space-x-2">
            {!autoMode && (
              <span
                className={`w-2 h-2 rounded-full ${isOn ? "bg-white" : "bg-gray-400"}`}
              ></span>
            )}
            <span>
              {autoMode ? "Locked by Auto" : isOn ? "Turn OFF" : "Turn ON"}
            </span>
          </span>
        )}
      </button>

      {onAutoChange && (
        <div className="mt-4 w-full border-t border-gray-50 pt-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-bold uppercase">
              Auto Control
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={autoMode}
                onChange={handleAutoToggle}
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceControl;
