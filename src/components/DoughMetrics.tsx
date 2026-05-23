"use client";

import React from 'react';
import { Flame, Activity } from 'lucide-react';

interface DoughMetricsProps {
  hydration?: number;
  temperature?: number;
  crispIndex?: string;
  className?: string;
}

export const DoughMetrics: React.FC<DoughMetricsProps> = ({
  hydration = 65,
  temperature = 400,
  crispIndex = "HIGH",
  className = "",
}) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 w-full ${className}`}>
      
      {/* Hydration Core Card */}
      <div className="bg-[#12100D] border border-[#2E271F] p-4 rounded-lg relative overflow-hidden orange-neon-border group transition-all duration-300">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center space-x-2 text-[10px] tracking-widest text-amber-500/80 font-mono">
            <Activity className="w-3.5 h-3.5" />
            <span>HYDRATION_CORE</span>
          </div>
          <span className="text-[10px] text-gray-500 font-mono">CRISP_INDEX: {crispIndex}</span>
        </div>
        
        {/* Progress Bar Container */}
        <div className="w-full bg-[#1A1814] h-2.5 rounded-full overflow-hidden border border-[#221C16] p-[1px]">
          <div 
            className="h-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 rounded-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(245,158,11,0.5)]"
            style={{ width: `${Math.min(100, Math.max(0, hydration))}%` }}
          />
        </div>
        
        <div className="flex justify-between items-center mt-2 text-[10px] font-mono text-gray-400">
          <span>MIN_BASE: 50%</span>
          <span className="text-amber-500 font-semibold text-xs">VALUE: {hydration}%</span>
        </div>
      </div>

      {/* Thermal Calibration Card */}
      <div className="bg-[#12100D] border border-[#2E271F] p-4 rounded-lg relative overflow-hidden orange-neon-border group transition-all duration-300">
        <div className="flex items-center space-x-2 text-[10px] tracking-widest text-amber-500/80 font-mono mb-2">
          <Flame className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
          <span>THERMAL_OPTIMIZATION</span>
        </div>

        <div className="flex items-center space-x-3 mt-3">
          <div className="p-1.5 bg-amber-500/10 border border-amber-500/20 rounded-md">
            <Flame className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-200 font-mono">{temperature}°C Recommended</div>
            <div className="text-[9px] text-gray-500 tracking-wider font-mono">HIGH-THERMAL BAKE ENVIRONMENT</div>
          </div>
        </div>
      </div>

    </div>
  );
};
