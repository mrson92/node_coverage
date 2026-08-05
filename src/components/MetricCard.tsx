import React from "react";
import { LucideIcon } from "lucide-react";
import { motion } from "motion/react";

interface MetricCardProps {
  id: string;
  title: string;
  value: string | number;
  subValue?: string;
  changeRate?: {
    direction: "up" | "down" | "flat";
    value: string;
  };
  icon: LucideIcon;
  themeColor: "indigo" | "amber" | "emerald" | "rose" | "sky";
  badgeText?: string;
  description: string;
}

export function MetricCard({
  id,
  title,
  value,
  subValue,
  changeRate,
  icon: Icon,
  themeColor,
  badgeText,
  description,
}: MetricCardProps) {
  const colorMap = {
    indigo: "border-[#222] bg-[#0c0c0c] text-[#E5E5E5] border-l-[3px] border-l-[#A1824A] hover:border-[#333] transition-colors",
    amber: "border-[#222] bg-[#0c0c0c] text-[#E5E5E5] border-l-[3px] border-l-amber-600 hover:border-[#333] transition-colors",
    emerald: "border-[#222] bg-[#0c0c0c] text-[#E5E5E5] border-l-[3px] border-l-emerald-600 hover:border-[#333] transition-colors",
    rose: "border-[#222] bg-[#0c0c0c] text-[#E5E5E5] border-l-[3px] border-l-rose-700 hover:border-[#333] transition-colors",
    sky: "border-[#222] bg-[#0c0c0c] text-[#E5E5E5] border-l-[3px] border-l-[#A1824A] hover:border-[#333] transition-colors",
  };

  const bgIconMap = {
    indigo: "bg-[#111111] text-[#A1824A] border border-[#222]",
    amber: "bg-[#111111] text-amber-500 border border-[#222]",
    emerald: "bg-[#111111] text-emerald-500 border border-[#222]",
    rose: "bg-[#111111] text-rose-500 border border-[#222]",
    sky: "bg-[#111111] text-[#A1824A] border border-[#222]",
  };

  return (
    <motion.div
      id={`metric-card-${id}`}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      whileHover={{ scale: 1.015, transition: { duration: 0.1 } }}
      className={`relative overflow-hidden rounded-sm border p-5 ${colorMap[themeColor]} flex flex-col justify-between h-[155px]`}
    >
      {/* Top Banner accent */}
      <div className={`absolute top-0 left-0 right-0 h-[1.5px] transition-all bg-linear-to-r ${
        themeColor === "indigo" ? "from-[#A1824A] to-transparent" :
        themeColor === "emerald" ? "from-emerald-600 to-transparent" :
        themeColor === "amber" ? "from-amber-600 to-transparent" :
        themeColor === "rose" ? "from-rose-700 to-transparent" :
        "from-[#A1824A] to-transparent"
      }`} />

      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-semibold">
            {title}
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-serif italic text-white tracking-tight leading-none">
              {value}
            </span>
            {subValue && (
              <span className="text-[10px] text-gray-500 font-mono tracking-wider uppercase">
                {subValue}
              </span>
            )}
          </div>
        </div>

        <div className={`p-2 rounded-sm ${bgIconMap[themeColor]}`}>
          <Icon className="w-4 h-4 pointer-events-none" />
        </div>
      </div>

      <div className="flex justify-between items-end mt-4 pt-3 border-t border-[#111111]">
        <span className="text-[11px] text-gray-400 line-clamp-1 flex-1 leading-normal font-sans">
          {description}
        </span>

        {changeRate && (
          <div className="flex items-center gap-1.5 ml-3 font-mono">
            <span
              className={`text-[11px] font-bold ${
                changeRate.direction === "up"
                  ? "text-emerald-400"
                  : changeRate.direction === "down"
                  ? "text-rose-400"
                  : "text-gray-400"
              }`}
            >
              {changeRate.direction === "up" ? "▲" : changeRate.direction === "down" ? "▼" : "■"} {changeRate.value}
            </span>
          </div>
        )}

        {badgeText && (
          <span className={`text-[9px] px-1.5 py-0.2 rounded-xs font-semibold tracking-wider uppercase ${
            themeColor === "rose" ? "bg-rose-950/20 text-rose-300 border border-rose-900/30" :
            themeColor === "amber" ? "bg-amber-950/20 text-amber-300 border border-amber-900/30" :
            "bg-emerald-950/20 text-emerald-300 border border-emerald-900/30"
          }`}>
            {badgeText}
          </span>
        )}
      </div>
    </motion.div>
  );
}
