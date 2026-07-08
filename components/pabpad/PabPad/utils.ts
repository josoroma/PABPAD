import { SOUNDS, type SoundId } from "@/lib/audio";

import type { Bank } from "./atoms";
import { BANK_ORDER, PADS, PAD_BANK_PALETTES, PATTERN_TRACK_ID, TIMELINE_PX_PER_SECOND, TRACK_IDS } from "./constants";
import type { ArrangedEvent, MultitrackSession, PatternClip, RecEvent, Track } from "./types";

function getPadColor(index: number, bank: Bank) {
  const col = index % 4;
  const row = Math.floor(index / 4);
  return PAD_BANK_PALETTES[bank][col]?.[row] ?? PADS[index]?.color ?? "#ff2ea6";
}

function getPadLabel(index: number, bank: Bank) {
  const col = index % 4;
  const row = Math.floor(index / 4);
  const bankOffset = BANK_ORDER.indexOf(bank) * 16;
  return `PAD ${13 - row * 4 + col + bankOffset}`;
}

function getNeutralMultitrackPadIndex(event: RecEvent) {
  if (event.type !== "noteon") return undefined;
  if (Number.isInteger(event.padIndex) && event.padIndex >= 0 && event.padIndex < PADS.length) return event.padIndex;
  return ((event.note % PADS.length) + PADS.length) % PADS.length;
}

function getRecordedSoundAt(events: RecEvent[], t: number, fallback: SoundId) {
  let sound = fallback;
  for (const event of events) {
    if (event.t > t) break;
    if (event.type === "sound") sound = event.id;
  }
  return sound;
}

function makeTracks(): Track[] {
  return TRACK_IDS.map((id, index) => ({
    id,
    name: id === PATTERN_TRACK_ID ? "Recorded" : `Track ${index}`,
    muted: id === PATTERN_TRACK_ID,
    clips: [],
  }));
}

function createClipId() {
  return `clip-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeEvents(events: unknown): RecEvent[] {
  if (!Array.isArray(events)) return [];
  const valid: RecEvent[] = [];
  for (const ev of events) {
    if (!ev || typeof ev !== "object") continue;
    const e = ev as Partial<RecEvent> & { t?: unknown; type?: unknown };
    if (typeof e.t !== "number" || typeof e.type !== "string") continue;
    if (e.type === "noteon" || e.type === "noteoff" || e.type === "cc" || e.type === "bank" || e.type === "sound") {
      valid.push({ ...(ev as RecEvent) });
    }
  }
  return valid.sort((a, b) => a.t - b.t);
}

function getPatternDuration(events: RecEvent[]) {
  return events.reduce((max, ev) => Math.max(max, ev.t), 0) + 200;
}

function hasNoteEvents(events: RecEvent[]) {
  return events.some((event) => event.type === "noteon");
}

function cloneClip(clip: PatternClip): PatternClip {
  return {
    ...clip,
    id: createClipId(),
    events: clip.events.map((event) => ({ ...event })),
  };
}

function getTrackEndMs(track: Track) {
  return track.clips.reduce((max, clip) => Math.max(max, clip.startMs + clip.durationMs), 0);
}

function getPlayableArrangementEndMs(tracks: Track[]) {
  return tracks.reduce((max, track) => {
    if (track.muted) return max;
    return Math.max(max, getTrackEndMs(track));
  }, 0);
}

function getArrangedEventsFromTracks(tracks: Track[]) {
  const events: ArrangedEvent[] = [];
  for (const track of tracks) {
    if (track.muted) continue;
    for (const clip of track.clips) {
      for (const ev of clip.events) {
        events.push({
          ...ev,
          t: ev.t + clip.startMs,
          trackId: track.id,
          clipId: clip.id,
          sound: clip.sound,
        } as ArrangedEvent);
      }
    }
  }
  return {
    events: events.sort((a, b) => a.t - b.t),
    duration: getPlayableArrangementEndMs(tracks),
  };
}

function appendClipToTrack(track: Track, clip: PatternClip): Track {
  const startMs = getTrackEndMs(track);
  return {
    ...track,
    muted: track.id === PATTERN_TRACK_ID ? true : false,
    clips: [...track.clips, { ...clip, startMs }],
  };
}

function placeClipInTrack(track: Track, clip: PatternClip, startMs: number): Track {
  return {
    ...track,
    muted: track.id === PATTERN_TRACK_ID ? true : false,
    clips: [...track.clips, { ...clip, startMs: Math.max(0, startMs) }]
      .sort((a, b) => a.startMs - b.startMs),
  };
}

function removeClipFromTrack(track: Track, clipId: string): Track {
  return { ...track, clips: track.clips.filter((clip) => clip.id !== clipId) };
}

function formatDuration(ms: number) {
  return `${(ms / 1000).toFixed(ms >= 10000 ? 0 : 1)}s`;
}

function timelinePx(ms: number) {
  return Math.max(0, Math.round((ms / 1000) * TIMELINE_PX_PER_SECOND));
}

function downloadJSON(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function isSoundId(value: unknown): value is SoundId {
  return typeof value === "string" && SOUNDS.some((sound) => sound.id === value);
}

function normalizeClip(value: unknown, fallbackName: string): PatternClip | null {
  if (!value || typeof value !== "object") return null;
  const clip = value as Partial<PatternClip> & { events?: unknown };
  const events = normalizeEvents(clip.events);
  if (!events.length) return null;
  const durationMs = typeof clip.durationMs === "number"
    ? Math.max(0, clip.durationMs)
    : getPatternDuration(events);
  return {
    id: typeof clip.id === "string" ? clip.id : createClipId(),
    name: typeof clip.name === "string" ? clip.name : fallbackName,
    source: clip.source === "preset" || clip.source === "original" || clip.source === "import" || clip.source === "recording"
      ? clip.source
      : "import",
    sourceId: typeof clip.sourceId === "string" ? clip.sourceId : undefined,
    sound: isSoundId(clip.sound) ? clip.sound : "pluck",
    events,
    startMs: typeof clip.startMs === "number" ? Math.max(0, clip.startMs) : 0,
    durationMs,
  };
}

function normalizeTrack(value: unknown, index: number): Track {
  const track = value && typeof value === "object"
    ? value as Partial<Track> & { clips?: unknown }
    : {};
  const clips = Array.isArray(track.clips)
    ? track.clips
        .map((clip, clipIndex) => normalizeClip(clip, `Pattern ${clipIndex + 1}`))
        .filter((clip): clip is PatternClip => Boolean(clip))
        .sort((a, b) => a.startMs - b.startMs)
    : [];
  return {
    id: TRACK_IDS[index] ?? `track-${index + 1}`,
    name: typeof track.name === "string"
      ? track.name
      : TRACK_IDS[index] === PATTERN_TRACK_ID ? "Recorded" : `Track ${index}`,
    muted: TRACK_IDS[index] === PATTERN_TRACK_ID
      ? true
      : typeof track.muted === "boolean" ? track.muted : false,
    clips,
  };
}

function parseMultitrackSession(value: unknown): { tracks: Track[]; currentSound?: SoundId; selectedTrackId?: string } | null {
  if (!value || typeof value !== "object") return null;
  const session = value as Partial<MultitrackSession> & { tracks?: unknown };
  if (session.type !== "pabpad-multitrack-session" || !Array.isArray(session.tracks)) return null;
  const incomingTracks = session.tracks;
  const hasPatternTrack = incomingTracks.some((track) =>
    Boolean(track && typeof track === "object" && (track as Partial<Track>).id === PATTERN_TRACK_ID)
  );
  const tracks = hasPatternTrack
    ? TRACK_IDS.map((id, index) => {
        const trackById = incomingTracks.find((track) =>
          Boolean(track && typeof track === "object" && (track as Partial<Track>).id === id)
        );
        return normalizeTrack(trackById ?? incomingTracks[index], index);
      })
    : TRACK_IDS.map((id, index) => {
        if (id === PATTERN_TRACK_ID) return normalizeTrack(undefined, index);
        return normalizeTrack(incomingTracks[index - 1], index);
      });
  return {
    tracks,
    currentSound: isSoundId(session.currentSound) ? session.currentSound : undefined,
    selectedTrackId: typeof session.selectedTrackId === "string" ? session.selectedTrackId : undefined,
  };
}


export {
  appendClipToTrack,
  cloneClip,
  createClipId,
  downloadJSON,
  formatDuration,
  getArrangedEventsFromTracks,
  getNeutralMultitrackPadIndex,
  getPadColor,
  getPadLabel,
  getPatternDuration,
  getPlayableArrangementEndMs,
  getRecordedSoundAt,
  getTrackEndMs,
  hasNoteEvents,
  isSoundId,
  makeTracks,
  normalizeEvents,
  parseMultitrackSession,
  placeClipInTrack,
  removeClipFromTrack,
  timelinePx,
};
