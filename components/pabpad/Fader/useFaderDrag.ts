"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Vertical track drag: pointer position within the track maps linearly to
 * 0..127 (bottom = 0, top = 127).
 */
export function useFaderDrag(onChange: (v: number) => void) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const apply = useCallback(
    (clientY: number) => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const rel = 1 - (clientY - rect.top) / rect.height;
      onChange(Math.max(0, Math.min(127, Math.round(rel * 127))));
    },
    [onChange]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setDragging(true);
      apply(e.clientY);
    },
    [apply]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (dragging) apply(e.clientY);
    },
    [apply, dragging]
  );

  const stop = useCallback(() => setDragging(false), []);

  return { trackRef, onPointerDown, onPointerMove, onPointerUp: stop, onPointerCancel: stop };
}
