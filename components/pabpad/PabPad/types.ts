import type { SoundId } from "@/lib/audio";

/** A single recorded control-surface event on the pattern timeline. */
export type RecEvent =
  | { t: number; type: "noteon"; note: number; vel: number; padIndex: number; bankAtRec: "A" | "B" | "C" }
  | { t: number; type: "noteoff"; note: number; padIndex: number; bankAtRec: "A" | "B" | "C" }
  | { t: number; type: "cc"; cc: number; value: number }
  | { t: number; type: "sound"; id: SoundId }
  | { t: number; type: "bank"; target: "pad" | "knob" | "fader"; bank: "A" | "B" | "C" };

type WithoutTimestamp<T> = T extends unknown ? Omit<T, "t"> : never;
export type RecEventInput = WithoutTimestamp<RecEvent>;

export type PatternSource = "preset" | "original" | "import" | "recording";

export type PatternClip = {
  id: string;
  name: string;
  source: PatternSource;
  sourceId?: string;
  sound: SoundId;
  events: RecEvent[];
  startMs: number;
  durationMs: number;
};

export type Track = {
  id: string;
  name: string;
  muted: boolean;
  clips: PatternClip[];
};

export type ArrangedEvent = RecEvent & {
  trackId: string;
  clipId: string;
  sound: SoundId;
};

export type MultitrackSession = {
  type: "pabpad-multitrack-session";
  version: 1;
  savedAt: string;
  currentSound: SoundId;
  selectedTrackId: string;
  tracks: Track[];
};
