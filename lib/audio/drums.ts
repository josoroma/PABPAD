"use client";

import * as Tone from "tone";

import { connectVoice, disposeLater, getDecayMul } from "./engine";
import type { DrumKit } from "./types";

export function playDrum(note: number, velocity: number, kit: DrumKit) {
  const time = Tone.now();
  const level = Math.max(0, Math.min(1, velocity));
  const decayMul = getDecayMul();

  if (note <= 49) {
    const long = kit === "808";
    const synth = new Tone.MembraneSynth({
      volume: kit === "cr78" ? -9 : -4,
      pitchDecay: long ? 0.08 : kit === "glitch" ? 0.01 : 0.04,
      octaves: long ? 8 : kit === "glitch" ? 3 : 5,
      oscillator: { type: kit === "glitch" ? "square" : "sine" },
      envelope: { attack: 0.001, decay: (long ? 0.8 : 0.28) * decayMul, sustain: 0.01, release: 0.05 },
    });
    const nodes = connectVoice(synth, { kind: "synth", oscillator: "sine", envelope: { attack: 0, decay: 0.2, sustain: 0, release: 0.05 }, filter: { type: "lowpass", frequency: kit === "808" ? 720 : 1500, Q: 1 } });
    synth.triggerAttackRelease(kit === "808" ? "C1" : "C2", long ? 0.75 * decayMul : 0.22 * decayMul, time, level);
    disposeLater(nodes, long ? 1.1 * decayMul : 0.5 * decayMul);
    return;
  }

  if (note <= 53) {
    const noise = new Tone.NoiseSynth({
      volume: kit === "cr78" ? -12 : -7,
      noise: { type: kit === "808" ? "pink" : "white" },
      envelope: { attack: 0.001, decay: (kit === "glitch" ? 0.035 : 0.14) * decayMul, sustain: 0, release: 0.02 },
    });
    const tone = new Tone.Synth({
      volume: -16,
      oscillator: { type: kit === "808" ? "triangle" : "square" },
      envelope: { attack: 0.001, decay: 0.08 * decayMul, sustain: 0, release: 0.02 },
    });
    const noiseNodes = connectVoice(noise, { kind: "synth", oscillator: "sine", envelope: { attack: 0, decay: 0.1, sustain: 0, release: 0.02 }, filter: { type: kit === "808" ? "bandpass" : "highpass", frequency: kit === "cr78" ? 1800 : 2600, Q: 1.2 } });
    const toneNodes = connectVoice(tone, { kind: "synth", oscillator: "square", envelope: { attack: 0, decay: 0.08, sustain: 0, release: 0.02 } });
    noise.triggerAttackRelease(0.12 * decayMul, time, level);
    tone.triggerAttackRelease(kit === "cr78" ? "G3" : "D3", 0.08 * decayMul, time, level * 0.7);
    disposeLater([...noiseNodes, ...toneNodes], 0.32 * decayMul);
    return;
  }

  const open = note >= 58;
  const hat = new Tone.MetalSynth({
    volume: kit === "glitch" ? -14 : -18,
    envelope: { attack: 0.001, decay: (open ? 0.18 : kit === "glitch" ? 0.025 : 0.06) * decayMul, release: 0.01 },
    harmonicity: kit === "glitch" ? 7.1 : 5.1,
    modulationIndex: kit === "cr78" ? 16 : 28,
    resonance: 4000,
    octaves: 1.5,
  });
  hat.frequency.value = kit === "cr78" ? 220 : 320;
  const nodes = connectVoice(hat, { kind: "synth", oscillator: "sine", envelope: { attack: 0, decay: 0.06, sustain: 0, release: 0.02 }, filter: { type: "highpass", frequency: kit === "cr78" ? 4200 : 6200, Q: 0.7 } });
  hat.triggerAttackRelease(open ? 0.18 * decayMul : 0.055 * decayMul, time, level);
  disposeLater(nodes, open ? 0.32 * decayMul : 0.16 * decayMul);
}
