"use client";

import { useMemo } from "react";

type PadPointerOptions = {
  disabled: boolean;
  color: string;
  onDown: () => void;
  onUp: () => void;
  onHover?: (color: string | null) => void;
};

/**
 * Pointer interaction for a performance pad: capture on press, release on
 * up/cancel, hover color reporting, and release when dragging off the pad.
 */
export function usePadPointer({ disabled, color, onDown, onUp, onHover }: PadPointerOptions) {
  return useMemo(
    () => ({
      onPointerDown: (e: React.PointerEvent) => {
        if (disabled) return;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        onDown();
      },
      onPointerUp: () => {
        if (!disabled) onUp();
      },
      onPointerCancel: () => {
        if (!disabled) onUp();
      },
      onPointerEnter: () => {
        if (!disabled) onHover?.(color);
      },
      onPointerLeave: (e: React.PointerEvent) => {
        if (disabled) return;
        if (e.buttons) onUp();
        onHover?.(null);
      },
    }),
    [color, disabled, onDown, onHover, onUp]
  );
}
