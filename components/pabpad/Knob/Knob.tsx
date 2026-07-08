"use client";

import { cn } from "@/lib/cn";

import type { KnobProps } from "./types";
import { useKnobDrag } from "./useKnobDrag";

export default function Knob({ label, value, onChange, color = "#ff3b30" }: KnobProps) {
  const dragHandlers = useKnobDrag(value, onChange);

  // -135deg at 0, +135deg at 127
  const angle = -135 + (value / 127) * 270;

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        {...dragHandlers}
        className={cn(
          "relative h-11 w-11 rounded-full select-none cursor-grab active:cursor-grabbing",
          "bg-gradient-to-b from-neutral-700 to-neutral-900",
          "ring-1 ring-black/60 shadow-[inset_0_2px_3px_rgba(255,255,255,0.08),0_4px_10px_rgba(0,0,0,0.6)]"
        )}
        style={{ ["--pad-color" as string]: color }}
        role="slider"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={127}
        aria-valuenow={value}
      >
        <div
          className="absolute inset-2 rounded-full bg-neutral-950 ring-1 ring-white/5"
          style={{ transform: `rotate(${angle}deg)` }}
        >
          <span className="absolute left-1/2 top-1 h-2 w-[2px] -translate-x-1/2 rounded-full bg-white/80 shadow-[0_0_6px_var(--pad-color)]" />
        </div>
      </div>
      <span className="text-[10px] font-medium tracking-wider text-neutral-300">{label}</span>
    </div>
  );
}
