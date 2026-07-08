import { AudioWaveform, Circle, Heart, Library, Megaphone, Music2, Square, Star, Wind } from "lucide-react";

import type { SoundGroupId } from "@/lib/audio";
import type { PadDef } from "../Pad";

import type { Bank } from "./atoms";

export const BANK_OFFSET: Record<Bank, number> = { A: 0, B: 16, C: 32 };
export const BANK_ORDER: Bank[] = ["A", "B", "C"];

export const SOUND_GROUP_ICON = {
  bass: Music2,
  keys: Library,
  strings: AudioWaveform,
  brass: Megaphone,
  winds: Wind,
  lead: Star,
  pad: Circle,
  drums: Square,
  fx: Heart,
} satisfies Record<SoundGroupId, typeof Music2>;

export const PAD_BANK_PALETTES: Record<Bank, string[][]> = {
  A: [
    ["#ff5fc1", "#ff2ea6", "#d91b8c", "#7a5cff"],
    ["#6f8cff", "#3b6bff", "#2451d8", "#1d37a8"],
    ["#6effad", "#2ad17a", "#18a85f", "#0f7d48"],
    ["#ff6b72", "#ff3340", "#d82431", "#a91424"],
  ],
  B: [
    ["#ffd166", "#f59e0b", "#c56f00", "#8f4d00"],
    ["#5eead4", "#14b8a6", "#0f8f82", "#0b665f"],
    ["#c084fc", "#8b5cf6", "#6d35d3", "#4c1d95"],
    ["#bef264", "#84cc16", "#5fa60f", "#3f7b0b"],
  ],
  C: [
    ["#fb7185", "#e11d48", "#b3133a", "#81112d"],
    ["#fdba74", "#f97316", "#c84f0d", "#8f3509"],
    ["#67e8f9", "#06b6d4", "#078aa3", "#075d70"],
    ["#93c5fd", "#3b82f6", "#1d5ed8", "#173d9c"],
  ],
};

export const REGULAR_TRACK_COUNT = 5;
export const PATTERN_TRACK_ID = "patterns";
export const REGULAR_TRACK_IDS = Array.from({ length: REGULAR_TRACK_COUNT }, (_, index) => `track-${index + 1}`);
export const TRACK_IDS = [PATTERN_TRACK_ID, ...REGULAR_TRACK_IDS];
export const TIMELINE_PX_PER_SECOND = 72;
export const TIMELINE_DROP_TAIL_MS = 2000;

// Visual layout (4x4, top-left = PAD13).
// Colors approximate the RGB pattern shown.
export const PADS: PadDef[] = [
  { index: 0,  label: "PAD 13", sub: "SWING 5/8", note: 60, color: "#ff2ea6" },
  { index: 1,  label: "PAD 14", sub: "SWING 6/8", note: 61, color: "#3b6bff" },
  { index: 2,  label: "PAD 15", sub: "SWING 6/8", note: 62, color: "#2ad17a" },
  { index: 3,  label: "PAD 16", sub: "TAP TEMPO", note: 63, color: "#ff3340" },

  { index: 4,  label: "PAD 9",  sub: "",          note: 56, color: "#ff2ea6" },
  { index: 5,  label: "PAD 10", sub: "",          note: 57, color: "#3b6bff" },
  { index: 6,  label: "PAD 11", sub: "",          note: 58, color: "#2ad17a" },
  { index: 7,  label: "PAD 12", sub: "",          note: 59, color: "#ff3340" },

  { index: 8,  label: "PAD 5",  sub: "TRANSPOSE-", note: 52, color: "#ff2ea6" },
  { index: 9,  label: "PAD 6",  sub: "TRANSPOSE+", note: 53, color: "#3b6bff" },
  { index: 10, label: "PAD 7",  sub: "OCTAVE-",    note: 54, color: "#2ad17a" },
  { index: 11, label: "PAD 8",  sub: "OCTAVE+",    note: 55, color: "#ff3340" },

  { index: 12, label: "PAD 1",  sub: "1/4",  note: 48, color: "#7a5cff" },
  { index: 13, label: "PAD 2",  sub: "1/8",  note: 49, color: "#3b6bff" },
  { index: 14, label: "PAD 3",  sub: "1/16", note: 50, color: "#2ad17a" },
  { index: 15, label: "PAD 4",  sub: "1/32", note: 51, color: "#ff3340" },
];

// Keyboard mapping: bottom-left to top-right like a typical 4x4 controller.
// Row layout (visual top-down):
//   PAD13..16: 1 2 3 4
//   PAD9..12:  q w e r
//   PAD5..8:   a s d f
//   PAD1..4:   z x c v
export const KEY_MAP: Record<string, number> = {
  "1": 0, "2": 1, "3": 2, "4": 3,
  q: 4, w: 5, e: 6, r: 7,
  a: 8, s: 9, d: 10, f: 11,
  z: 12, x: 13, c: 14, v: 15,
};
