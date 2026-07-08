"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Vertical drag-to-turn interaction: dragging up increases the value,
 * one pixel per step, clamped to 0..127.
 */
export function useKnobDrag(value: number, onChange: (v: number) => void) {
  const [dragging, setDragging] = useState(false);
  const startY = useRef(0);
  const startV = useRef(value);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setDragging(true);
      startY.current = e.clientY;
      startV.current = value;
    },
    [value]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      const dy = startY.current - e.clientY;
      const next = Math.max(0, Math.min(127, Math.round(startV.current + dy)));
      onChange(next);
    },
    [dragging, onChange]
  );

  const stop = useCallback(() => setDragging(false), []);

  return { onPointerDown, onPointerMove, onPointerUp: stop, onPointerCancel: stop };
}
