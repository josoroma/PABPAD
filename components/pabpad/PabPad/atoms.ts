"use client";

import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

import type { SoundId } from "@/lib/audio";

export type Bank = "A" | "B" | "C";

export const padBankAtom = atom<Bank>("A");
export const knobBankAtom = atom<Bank>("A");
export const faderBankAtom = atom<Bank>("A");

export const fullLevelAtom = atom<boolean>(false);
export const shiftAtom = atom<boolean>(false);
export const noteRepeatAtom = atom<boolean>(false);

export const knobsAtom = atom<[number, number]>([64, 64]); // 0..127
export const fadersAtom = atom<[number, number]>([100, 100]); // 0..127

// Per-bank K1/K2 pages. KNOB BANK button stores the live values into the
// outgoing slot and recalls the incoming slot, so each bank really does
// keep its own K1/K2 values across sessions.
export type KnobPages = { A: [number, number]; B: [number, number]; C: [number, number] };
export const knobPagesAtom = atomWithStorage<KnobPages>("pabpad.knobPages", {
  A: [64, 64],
  B: [64, 64],
  C: [64, 64],
});

// Per-bank F1/F2 pages. Same model as knobPagesAtom — FADER BANK cycles the
// active page and persists each slot's values across reloads.
export type FaderPages = { A: [number, number]; B: [number, number]; C: [number, number] };
export const faderPagesAtom = atomWithStorage<FaderPages>("pabpad.faderPages", {
  A: [100, 100],
  B: [100, 100],
  C: [100, 100],
});

export const currentSoundAtom = atom<SoundId>("pluck");

// Persisted across reloads — the last preset the user picked from the menu.
export const selectedPresetIdAtom = atomWithStorage<string | null>(
  "pabpad.selectedPresetId",
  null
);

// Scene snapshots stored in the A / B buttons.
// SHIFT + click on A or B captures the current macros into that slot;
// a plain click recalls the slot.
export type Scene = {
  knobs: [number, number];
  faders: [number, number];
  sound: SoundId;
  padBank: Bank;
  knobBank: Bank;
  faderBank: Bank;
};

export const sceneAAtom = atomWithStorage<Scene | null>("pabpad.sceneA", null);
export const sceneBAtom = atomWithStorage<Scene | null>("pabpad.sceneB", null);
export const activeSceneAtom = atom<"A" | "B" | null>(null);
