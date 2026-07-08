"use client";

import { useEffect, useMemo, useRef } from "react";
import WaveSurfer from "wavesurfer.js";

import type { PatternClip, RecEvent, Track } from "./types";
import { formatDuration, getTrackEndMs } from "./utils";

function createPatternPeaks(events: RecEvent[], durationMs: number) {
  const durationSec = Math.max(0.1, durationMs / 1000);
  const sampleCount = Math.max(64, Math.min(12000, Math.round(durationSec * 72)));
  const peaks = new Float32Array(sampleCount);
  const noteOffByNote = new Map<number, number[]>();
  for (const ev of events) {
    if (ev.type !== "noteoff") continue;
    const list = noteOffByNote.get(ev.note) ?? [];
    list.push(ev.t);
    noteOffByNote.set(ev.note, list);
  }
  for (const list of noteOffByNote.values()) list.sort((a, b) => a - b);

  for (const ev of events) {
    if (ev.type !== "noteon") continue;
    const center = Math.max(0, Math.min(sampleCount - 1, Math.round((ev.t / durationMs) * (sampleCount - 1))));
    const amp = Math.max(0.12, Math.min(1, ev.vel / 127));
    const noteOff = noteOffByNote.get(ev.note)?.find((t) => t > ev.t);
    const noteMs = noteOff ? Math.max(120, noteOff - ev.t) : 320;
    const tailSamples = Math.max(5, Math.min(64, Math.round((noteMs / durationMs) * sampleCount)));
    for (let offset = -2; offset <= tailSamples; offset++) {
      const index = center + offset;
      if (index < 0 || index >= sampleCount) continue;
      const attack = offset < 0 ? 1 - Math.abs(offset) / 3 : 1;
      const decay = offset <= 0 ? 1 : Math.max(0.08, 1 - offset / (tailSamples + 1));
      peaks[index] = Math.max(peaks[index], amp * attack * decay);
    }
  }
  if (!peaks.some((peak) => peak > 0)) {
    for (let index = 0; index < sampleCount; index++) peaks[index] = index % 4 === 0 ? 0.16 : 0.06;
  }
  return [peaks];
}

function PatternWaveform({
  clip,
  muted,
  selected,
}: {
  clip: PatternClip;
  muted: boolean;
  selected: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const peaks = useMemo(() => createPatternPeaks(clip.events, clip.durationMs), [clip.events, clip.durationMs]);

  useEffect(() => {
    if (!containerRef.current) return;
    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      height: 36,
      width: "100%",
      peaks,
      duration: Math.max(0.1, clip.durationMs / 1000),
      waveColor: muted ? "rgba(115,115,115,0.24)" : selected ? "rgba(96,165,250,0.55)" : "rgba(255,255,255,0.24)",
      progressColor: muted ? "rgba(115,115,115,0.24)" : selected ? "rgba(59,107,255,0.75)" : "rgba(255,255,255,0.34)",
      cursorWidth: 0,
      interact: false,
      hideScrollbar: true,
      normalize: true,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      barMinHeight: 1,
    });
    return () => wavesurfer.destroy();
  }, [clip.durationMs, muted, peaks, selected]);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-x-1 bottom-1 top-1 opacity-80"
      aria-hidden
    />
  );
}

function ArrangementWaveform({
  tracks,
  durationMs,
  playheadMs,
  playing,
  controls,
}: {
  tracks: Track[];
  durationMs: number;
  playheadMs: number;
  playing: boolean;
  controls?: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playableTracks = useMemo(
    () => tracks.filter((track) => !track.muted && track.clips.length > 0),
    [tracks]
  );
  const arrangedEvents = useMemo(() => {
    const events: RecEvent[] = [];
    for (const track of playableTracks) {
      for (const clip of track.clips) {
        for (const event of clip.events) {
          events.push({ ...event, t: event.t + clip.startMs } as RecEvent);
        }
      }
    }
    return events.sort((a, b) => a.t - b.t);
  }, [playableTracks]);
  const peaks = useMemo(
    () => createPatternPeaks(arrangedEvents, Math.max(200, durationMs)),
    [arrangedEvents, durationMs]
  );

  useEffect(() => {
    if (!containerRef.current) return;
    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      height: 120,
      width: "100%",
      peaks,
      duration: Math.max(0.1, durationMs / 1000),
      waveColor: "rgba(255,255,255,0.22)",
      progressColor: "rgba(45,212,191,0.72)",
      cursorWidth: 0,
      interact: false,
      hideScrollbar: true,
      normalize: true,
      barWidth: 3,
      barGap: 2,
      barRadius: 2,
      barMinHeight: 2,
    });
    return () => wavesurfer.destroy();
  }, [durationMs, peaks]);

  const playheadLeft = durationMs > 0 ? `${Math.min(100, Math.max(0, (playheadMs / durationMs) * 100))}%` : "0%";

  return (
    <div className="flex min-h-[620px] flex-col rounded-xl bg-neutral-950/70 p-3 ring-1 ring-black/60">
      <div className="mb-3 grid gap-3 px-1 md:grid-cols-[1fr_auto_1fr] md:items-center">
        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-300">All tracks waveform</span>
        {controls && (
          <div className="flex items-center justify-start gap-2 md:justify-center">
            {controls}
          </div>
        )}
        <span className="text-left text-[10px] uppercase tracking-wider text-neutral-500 md:text-right">
          {playableTracks.length} tracks · {formatDuration(durationMs)}
        </span>
      </div>

      <div className="relative rounded-lg bg-black/70 p-3 ring-1 ring-white/10">
        <div ref={containerRef} className="h-[120px]" aria-label="All tracks waveform" />
        {playing && durationMs > 0 && (
          <div
            className="pointer-events-none absolute bottom-2 top-2 w-px bg-emerald-200 shadow-[0_0_12px_rgba(110,231,183,0.9)]"
            style={{ left: playheadLeft }}
            aria-hidden
          />
        )}
      </div>

      <div className="mt-3 flex-1 space-y-2 overflow-hidden">
        {playableTracks.map((track, index) => {
          const trackDuration = Math.max(durationMs, getTrackEndMs(track), 200);

          return (
            <div key={track.id} className="grid grid-cols-[4.25rem_minmax(0,1fr)] gap-2 rounded-lg bg-black/35 p-2 ring-1 ring-white/10">
              <div className="flex min-w-0 flex-col justify-center rounded-md bg-neutral-950 px-2 ring-1 ring-neutral-800">
                <span className="text-[9px] font-bold uppercase text-neutral-500">T{index + 1}</span>
                <span className="truncate text-[10px] font-semibold text-neutral-200">{track.name}</span>
              </div>
              <div className="relative h-14 overflow-hidden rounded-md bg-neutral-950/80 ring-1 ring-neutral-900">
                {track.clips.map((clip) => {
                  const width = Math.max(2, (clip.durationMs / trackDuration) * 100);
                  const left = (clip.startMs / trackDuration) * 100;

                  return (
                    <div
                      key={clip.id}
                      className="absolute bottom-1 top-1 overflow-hidden rounded-md bg-neutral-900 ring-1 ring-neutral-700"
                      style={{ left: `${left}%`, width: `${width}%`, minWidth: 48 }}
                      title={`${clip.name} · ${formatDuration(clip.durationMs)}`}
                    >
                      <PatternWaveform clip={clip} muted={false} selected={false} />
                    </div>
                  );
                })}
                {playing && durationMs > 0 && (
                  <div
                    className="pointer-events-none absolute bottom-0 top-0 z-20 w-px bg-white shadow-[0_0_8px_rgba(255,255,255,0.85)]"
                    style={{ left: playheadLeft }}
                    aria-hidden
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


export { ArrangementWaveform, PatternWaveform };
