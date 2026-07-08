"use client";

import * as Tone from "tone";

import { playDrum } from "./drums";
import { getCurrentSound, getMaster, resumeAudio } from "./engine";
import { playFx } from "./fx";
import { playInstrument } from "./instruments";
import type { SoundId } from "./types";

export { SOUND_GROUPS, SOUNDS } from "./constants";
export { resumeAudio, setKnobCutoff, setKnobDecay, setMasterVolume, setSound } from "./engine";
export type { SoundDef, SoundGroupDef, SoundGroupId, SoundId } from "./types";

export function playNote(note: number, velocity = 1, durationMs = 280, soundOverride?: SoundId) {
  getMaster();

  if (Tone.getContext().state !== "running") {
    void resumeAudio().then(() => playNote(note, velocity, durationMs, soundOverride));
    return;
  }

  const sound = soundOverride ?? getCurrentSound();

  switch (sound) {
    case "drums":
      return playDrum(note, velocity, "standard");
    case "drums-808":
      return playDrum(note, velocity, "808");
    case "drums-cr78":
      return playDrum(note, velocity, "cr78");
    case "drums-glitch":
      return playDrum(note, velocity, "glitch");
    case "fx-sweep":
    case "fx-impact":
    case "fx-laser":
    case "fx-riser":
    case "fx-downlifter":
    case "fx-noise-hit":
    case "fx-zap":
      return playFx(sound, note, velocity, durationMs);
    default:
      return playInstrument(sound, note, velocity, durationMs);
  }
}
