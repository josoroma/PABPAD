"use client";

import { cn } from "@/lib/cn";

import type { PadProps } from "./types";
import { usePadPointer } from "./usePadPointer";

export default function Pad({ pad, pressed, onDown, onUp, onHover, neutral = false, icon, disabled = false, highlighted = false }: PadProps) {
  const pointerHandlers = usePadPointer({ disabled, color: pad.color, onDown, onUp, onHover });

  return (
    <button
      type="button"
      disabled={disabled}
      {...pointerHandlers}
      style={{ ["--pad-color" as string]: pad.color }}
      className={cn(
        "relative aspect-square w-full rounded-md select-none",
        "ring-1 ring-black/80",
        "transition-[transform,box-shadow,background-color] duration-75 will-change-transform",
        disabled && "cursor-default",
        highlighted && !pressed && !neutral && "ring-2 ring-white/35 shadow-[0_0_22px_var(--pad-color)]",
        neutral
          ? pressed
            ? "translate-y-[1px] bg-white/15 shadow-[0_0_18px_rgba(255,255,255,0.35)]"
            : disabled ? "bg-black" : "bg-black hover:bg-neutral-950"
          : pressed
            ? "translate-y-[1px] glow-strong bg-[color-mix(in_oklab,var(--pad-color)_55%,black)]"
            : "glow-soft bg-[color-mix(in_oklab,var(--pad-color)_18%,#0a0a0c)] hover:bg-[color-mix(in_oklab,var(--pad-color)_28%,#0a0a0c)]"
      )}
      aria-label={pad.label}
    >
      <span
        className={cn(
          "absolute inset-[4px] rounded-[5px] ring-1 ring-white/5",
          "flex flex-col items-start justify-between p-1.5 text-left",
          "transition-colors duration-75",
          neutral
            ? "items-center justify-center bg-black text-white"
            : pressed
              ? "bg-[color-mix(in_oklab,var(--pad-color)_70%,white)]"
              : "bg-[color-mix(in_oklab,var(--pad-color)_22%,#0a0a0c)]"
        )}
      >
        {neutral ? (
          <span className={cn("text-white transition-transform", pressed && "scale-110")}>{icon}</span>
        ) : (
          <>
          {highlighted && !pressed && (
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-white/80 shadow-[0_0_8px_rgba(255,255,255,0.75)]" />
          )}
          <span
            className="text-[9px] font-bold tracking-wider leading-none"
            style={{
              color: pressed ? "#0a0a0c" : pad.color,
              textShadow: pressed ? "0 0 6px rgba(255,255,255,0.8)" : `0 0 6px ${pad.color}`,
            }}
          >
            {pad.label}
          </span>
          {pad.sub && (
          <span
            className="text-[8px] font-medium tracking-wider leading-none"
            style={{ color: pressed ? "rgba(10,10,12,0.75)" : "#a3a3ad" }}
          >
            {pad.sub}
          </span>
          )}
          </>
        )}
      </span>
    </button>
  );
}
