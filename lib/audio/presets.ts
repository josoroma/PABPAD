"use client";

import type { InstrumentPreset, SoundId } from "./types";

// bass-wobble alternates its filter cutoff between two values on every note.
let wobblePhase = false;

/** Advance the wobble step. Call once per played bass-wobble note. */
export function advanceWobblePhase() {
  wobblePhase = !wobblePhase;
}

export function instrumentPreset(id: SoundId): InstrumentPreset {
  switch (id) {
    case "bass":
      return { kind: "mono", oscillator: "sine", envelope: { attack: 0.01, decay: 0.18, sustain: 0.45, release: 0.16 }, filter: { type: "lowpass", frequency: 520, Q: 1.5 }, volume: -5 };
    case "bass-acid":
      return { kind: "mono", oscillator: "sawtooth", envelope: { attack: 0.005, decay: 0.12, sustain: 0.28, release: 0.08 }, filter: { type: "lowpass", frequency: 900, Q: 12 }, distortion: 0.15, volume: -8 };
    case "bass-reese":
      return { kind: "mono", oscillator: "fatsawtooth", envelope: { attack: 0.02, decay: 0.24, sustain: 0.55, release: 0.2 }, filter: { type: "lowpass", frequency: 620, Q: 2 }, chorus: 0.55, volume: -10 };
    case "bass-fm":
      return { kind: "fm", oscillator: "sine", envelope: { attack: 0.005, decay: 0.16, sustain: 0.25, release: 0.14 }, modulationIndex: 18, harmonicity: 0.5, filter: { type: "lowpass", frequency: 760, Q: 2 }, volume: -8 };
    case "bass-round":
      return { kind: "mono", oscillator: "triangle", envelope: { attack: 0.012, decay: 0.2, sustain: 0.5, release: 0.18 }, filter: { type: "lowpass", frequency: 700, Q: 1 }, volume: -6 };
    case "bass-wobble":
      return { kind: "mono", oscillator: "sawtooth", envelope: { attack: 0.008, decay: 0.18, sustain: 0.4, release: 0.12 }, filter: { type: "lowpass", frequency: wobblePhase ? 420 : 1450, Q: 8 }, distortion: 0.08, volume: -8 };
    case "keys":
      return { kind: "fm", oscillator: "sine", envelope: { attack: 0.004, decay: 0.35, sustain: 0.18, release: 0.22 }, modulationIndex: 12, harmonicity: 3.01, filter: { type: "highpass", frequency: 180, Q: 0.6 }, volume: -9 };
    case "keys-piano":
      return { kind: "synth", oscillator: "triangle", envelope: { attack: 0.004, decay: 0.38, sustain: 0.08, release: 0.18 }, filter: { type: "lowpass", frequency: 2600, Q: 1 }, volume: -8 };
    case "keys-epiano":
      return { kind: "am", oscillator: "sine", envelope: { attack: 0.01, decay: 0.45, sustain: 0.22, release: 0.3 }, harmonicity: 1.5, tremolo: 0.18, volume: -10 };
    case "keys-organ":
      return { kind: "synth", oscillator: "square8", envelope: { attack: 0.01, decay: 0.08, sustain: 0.8, release: 0.16 }, filter: { type: "lowpass", frequency: 3200, Q: 0.7 }, volume: -11 };
    case "pad":
      return { kind: "synth", oscillator: "fatsawtooth", envelope: { attack: 0.18, decay: 0.35, sustain: 0.75, release: 0.8 }, filter: { type: "lowpass", frequency: 1150, Q: 1 }, chorus: 0.35, volume: -16 };
    case "pad-choir":
      return { kind: "am", oscillator: "sine", envelope: { attack: 0.28, decay: 0.5, sustain: 0.78, release: 1 }, harmonicity: 0.5, filter: { type: "lowpass", frequency: 1650, Q: 1 }, chorus: 0.42, volume: -15 };
    case "pad-glass":
      return { kind: "fm", oscillator: "sine", envelope: { attack: 0.24, decay: 0.5, sustain: 0.55, release: 1.1 }, modulationIndex: 4, harmonicity: 2.5, feedbackDelay: 0.22, volume: -18 };
    case "pad-strings":
    case "strings-ensemble":
      return { kind: "synth", oscillator: "fatsawtooth", envelope: { attack: 0.2, decay: 0.35, sustain: 0.7, release: 0.75 }, filter: { type: "lowpass", frequency: 1800, Q: 1.4 }, chorus: 0.5, volume: -15 };
    case "pad-atmosphere":
      return { kind: "fm", oscillator: "sine", envelope: { attack: 0.35, decay: 0.6, sustain: 0.6, release: 1.3 }, modulationIndex: 6, harmonicity: 1.01, feedbackDelay: 0.32, chorus: 0.32, volume: -18 };
    case "strings-pizzicato":
      return { kind: "synth", oscillator: "triangle", envelope: { attack: 0.004, decay: 0.18, sustain: 0.08, release: 0.1 }, filter: { type: "lowpass", frequency: 1900, Q: 1.5 }, volume: -8 };
    case "strings-cello":
      return { kind: "synth", oscillator: "sawtooth", envelope: { attack: 0.08, decay: 0.25, sustain: 0.55, release: 0.35 }, filter: { type: "lowpass", frequency: 900, Q: 2 }, volume: -12 };
    case "strings-synth":
      return { kind: "synth", oscillator: "fatsawtooth", envelope: { attack: 0.06, decay: 0.2, sustain: 0.62, release: 0.35 }, filter: { type: "lowpass", frequency: 2400, Q: 1 }, chorus: 0.45, volume: -12 };
    case "brass-section":
      return { kind: "synth", oscillator: "fatsawtooth", envelope: { attack: 0.07, decay: 0.18, sustain: 0.55, release: 0.28 }, filter: { type: "lowpass", frequency: 1600, Q: 3 }, chorus: 0.28, volume: -12 };
    case "brass-stab":
      return { kind: "synth", oscillator: "sawtooth", envelope: { attack: 0.006, decay: 0.16, sustain: 0.18, release: 0.08 }, filter: { type: "lowpass", frequency: 2300, Q: 5 }, volume: -8 };
    case "brass-horn":
      return { kind: "synth", oscillator: "triangle", envelope: { attack: 0.09, decay: 0.18, sustain: 0.5, release: 0.32 }, filter: { type: "lowpass", frequency: 1200, Q: 2 }, volume: -10 };
    case "brass-muted":
      return { kind: "synth", oscillator: "sawtooth", envelope: { attack: 0.015, decay: 0.12, sustain: 0.32, release: 0.16 }, filter: { type: "bandpass", frequency: 1350, Q: 7 }, volume: -9 };
    case "winds-flute":
      return { kind: "synth", oscillator: "sine", envelope: { attack: 0.05, decay: 0.12, sustain: 0.45, release: 0.22 }, filter: { type: "highpass", frequency: 260, Q: 0.7 }, volume: -9 };
    case "winds-clarinet":
      return { kind: "synth", oscillator: "square4", envelope: { attack: 0.04, decay: 0.18, sustain: 0.5, release: 0.22 }, filter: { type: "lowpass", frequency: 1800, Q: 2.5 }, volume: -12 };
    case "winds-pan":
      return { kind: "synth", oscillator: "triangle", envelope: { attack: 0.035, decay: 0.16, sustain: 0.35, release: 0.25 }, filter: { type: "lowpass", frequency: 2100, Q: 1 }, feedbackDelay: 0.1, volume: -10 };
    case "winds-breath":
      return { kind: "am", oscillator: "sine", envelope: { attack: 0.08, decay: 0.2, sustain: 0.35, release: 0.28 }, harmonicity: 0.75, filter: { type: "bandpass", frequency: 1100, Q: 1.5 }, volume: -13 };
    case "lead":
      return { kind: "synth", oscillator: "square", envelope: { attack: 0.006, decay: 0.12, sustain: 0.42, release: 0.12 }, filter: { type: "lowpass", frequency: 2800, Q: 5 }, volume: -9 };
    case "lead-saw":
      return { kind: "synth", oscillator: "fatsawtooth", envelope: { attack: 0.004, decay: 0.12, sustain: 0.45, release: 0.14 }, filter: { type: "lowpass", frequency: 3500, Q: 4 }, chorus: 0.28, volume: -11 };
    case "lead-soft":
      return { kind: "synth", oscillator: "triangle", envelope: { attack: 0.012, decay: 0.16, sustain: 0.45, release: 0.2 }, filter: { type: "lowpass", frequency: 2300, Q: 1.4 }, volume: -8 };
    case "lead-sync":
      return { kind: "fm", oscillator: "sawtooth", envelope: { attack: 0.004, decay: 0.12, sustain: 0.35, release: 0.1 }, modulationIndex: 20, harmonicity: 2, filter: { type: "lowpass", frequency: 3600, Q: 6 }, volume: -12 };
    case "lead-chip":
      return { kind: "synth", oscillator: "pulse", envelope: { attack: 0.002, decay: 0.08, sustain: 0.42, release: 0.06 }, filter: { type: "highpass", frequency: 320, Q: 1 }, volume: -12 };
    case "lead-brass":
      return { kind: "synth", oscillator: "sawtooth", envelope: { attack: 0.01, decay: 0.16, sustain: 0.38, release: 0.12 }, filter: { type: "lowpass", frequency: 2600, Q: 4 }, volume: -9 };
    case "pluck":
    default:
      return { kind: "synth", oscillator: "triangle", envelope: { attack: 0.003, decay: 0.18, sustain: 0.05, release: 0.08 }, filter: { type: "lowpass", frequency: 3200, Q: 3 }, volume: -8 };
  }
}
