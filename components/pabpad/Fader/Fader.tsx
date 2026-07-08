"use client";

import { cn } from "@/lib/cn";

import type { FaderProps } from "./types";
import { useFaderDrag } from "./useFaderDrag";

export default function Fader({ label, value, onChange }: FaderProps) {
  const { trackRef, ...dragHandlers } = useFaderDrag(onChange);

  // Cap is positioned by percentage of height.
  const pct = value / 127;

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        ref={trackRef}
        {...dragHandlers}
        className={cn(
          "relative h-24 w-6 rounded-md select-none cursor-pointer",
          "bg-neutral-950 ring-1 ring-black/70 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]"
        )}
        role="slider"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={127}
        aria-valuenow={value}
      >
        {/* center groove */}
        <div className="absolute left-1/2 top-1 bottom-1 w-[2px] -translate-x-1/2 rounded-full bg-neutral-800" />
        {/* cap */}
        <div
          className="absolute left-1/2 h-4 w-5 -translate-x-1/2 rounded-sm bg-gradient-to-b from-neutral-300 to-neutral-600 ring-1 ring-black/70 shadow-md"
          style={{ bottom: `calc(${pct * 100}% - 8px)` }}
        >
          <div className="absolute left-1/2 top-1/2 h-[2px] w-3 -translate-x-1/2 -translate-y-1/2 bg-neutral-900/80" />
        </div>
      </div>
      <span className="text-[10px] font-medium tracking-wider text-neutral-300">{label}</span>
    </div>
  );
}
