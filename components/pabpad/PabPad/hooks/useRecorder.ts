"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import type { RecEvent, RecEventInput } from "../types";

export function useRecorder(opts: {
  onPlay: (ev: RecEvent) => void;
}) {
  const eventsRef = useRef<RecEvent[]>([]);
  const startRef = useRef<number>(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const loopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [recording, setRecording] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [count, setCount] = useState(0);
  const [loop, setLoop] = useState(false);

  // Read at the end of each playback pass so toggling LOOP during playback
  // takes effect immediately instead of using the value captured at play().
  const loopRef = useRef(loop);
  loopRef.current = loop;

  const push = useCallback((ev: RecEventInput) => {
    if (!recording) return;
    const t = performance.now() - startRef.current;
    eventsRef.current.push({ ...ev, t } as RecEvent);
    setCount(eventsRef.current.length);
  }, [recording]);

  const startRecording = useCallback((initialEvents: RecEventInput[] = []) => {
    stopPlayback();
    eventsRef.current = initialEvents.map((event) => ({ ...event, t: 0 } as RecEvent));
    setCount(eventsRef.current.length);
    startRef.current = performance.now();
    setRecording(true);
  }, []);

  const stopRecording = useCallback(() => {
    setRecording(false);
  }, []);

  const clear = useCallback(() => {
    stopPlayback();
    eventsRef.current = [];
    setCount(0);
  }, []);

  const scheduleOnce = useCallback(() => {
    const evs = eventsRef.current;
    if (!evs.length) return 0;
    const duration = evs[evs.length - 1]!.t + 200;
    evs.forEach((ev) => {
      const id = setTimeout(() => opts.onPlay(ev), ev.t);
      timersRef.current.push(id);
    });
    return duration;
  }, [opts]);

  const play = useCallback(() => {
    if (recording) setRecording(false);
    if (!eventsRef.current.length) return;
    stopPlayback();
    setPlaying(true);
    const loopFn = () => {
      const dur = scheduleOnce();
      loopTimerRef.current = setTimeout(() => {
        if (loopRef.current) loopFn();
        else setPlaying(false);
      }, dur);
    };
    loopFn();
  }, [recording, scheduleOnce]);

  function stopPlayback() {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    if (loopTimerRef.current) clearTimeout(loopTimerRef.current);
    loopTimerRef.current = null;
    setPlaying(false);
  }

  const stop = useCallback(() => stopPlayback(), []);

  const exportJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify(eventsRef.current, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pabpad-session-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const getEvents = useCallback(() => {
    return eventsRef.current.map((event) => ({ ...event }));
  }, []);

  const loadEvents = useCallback((events: RecEvent[]): { ok: boolean; count: number; error?: string } => {
    stopPlayback();
    setRecording(false);
    if (!Array.isArray(events)) {
      return { ok: false, count: 0, error: "Preset is not an array of events" };
    }
    const valid: RecEvent[] = [];
    for (const ev of events) {
      if (!ev || typeof ev !== "object") continue;
      const e = ev as Partial<RecEvent> & { t?: unknown; type?: unknown };
      if (typeof e.t !== "number" || typeof e.type !== "string") continue;
      if (e.type === "noteon" || e.type === "noteoff" || e.type === "cc" || e.type === "bank" || e.type === "sound") {
        valid.push(ev as RecEvent);
      }
    }
    valid.sort((a, b) => a.t - b.t);
    eventsRef.current = valid;
    setCount(valid.length);
    return { ok: true, count: valid.length };
  }, []);

  return useMemo(() => ({
    recording, playing, count, loop, setLoop,
    push, startRecording, stopRecording, clear,
    play, stop, exportJSON, loadEvents, getEvents,
  }), [recording, playing, count, loop, setLoop, push, startRecording, stopRecording, clear, play, stop, exportJSON, loadEvents, getEvents]);
}
