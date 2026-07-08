"use client";

import { cn } from "@/lib/cn";

import type { CtrlButtonProps } from "./types";

export default function CtrlButton({ label, sub, color = "#ff3b30", active, onClick, onContextMenu, className, title }: CtrlButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      onContextMenu={onContextMenu}
      title={title}
      style={{ ["--pad-color" as string]: color }}
      className={cn(
        "group relative h-8 w-16 rounded-md select-none",
        "bg-neutral-900 ring-1 ring-black/70",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_2px_4px_rgba(0,0,0,0.6)]",
        "transition-[transform,box-shadow] active:translate-y-[1px]",
        active && "glow-soft",
        className
      )}
    >
      <span
        className={cn(
          "absolute inset-[3px] rounded-[5px] flex items-center justify-center px-1 text-center",
          "bg-neutral-950 ring-1 ring-white/5"
        )}
      >
        <span
          className="text-[9px] font-semibold leading-tight tracking-wider"
          style={{ color: active ? "white" : color, textShadow: active ? `0 0 8px ${color}` : undefined }}
        >
          {label}
          {sub && <span className="block opacity-70">{sub}</span>}
        </span>
      </span>
    </button>
  );
}
