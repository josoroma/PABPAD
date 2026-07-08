"use client";

import * as Tone from "tone";

import { connectVoice, cutoff, disposeLater, getDecayMul, getMaster, midiToFreq, scaledDuration } from "./engine";
import type { SoundId } from "./types";

export function playFx(id: SoundId, note: number, velocity: number, durationMs: number) {
  const time = Tone.now();
  const duration = scaledDuration(durationMs, 0.18);
  const level = Math.max(0, Math.min(1, velocity));
  const decayMul = getDecayMul();

  if (id === "fx-impact") {
    const boom = new Tone.MembraneSynth({
      volume: -5,
      pitchDecay: 0.12,
      octaves: 9,
      envelope: { attack: 0.001, decay: 0.9 * decayMul, sustain: 0, release: 0.08 },
    });
    const noise = new Tone.NoiseSynth({
      volume: -12,
      noise: { type: "brown" },
      envelope: { attack: 0.001, decay: 0.45 * decayMul, sustain: 0, release: 0.1 },
    });
    const boomNodes = connectVoice(boom, { kind: "synth", oscillator: "sine", envelope: { attack: 0, decay: 0.8, sustain: 0, release: 0.08 }, filter: { type: "lowpass", frequency: 900, Q: 1 } });
    const noiseNodes = connectVoice(noise, { kind: "synth", oscillator: "sine", envelope: { attack: 0, decay: 0.4, sustain: 0, release: 0.08 }, filter: { type: "lowpass", frequency: 1800, Q: 0.8 } });
    boom.triggerAttackRelease("C1", 0.8 * decayMul, time, level);
    noise.triggerAttackRelease(0.45 * decayMul, time, level);
    disposeLater([...boomNodes, ...noiseNodes], 1 * decayMul);
    return;
  }

  if (id === "fx-noise-hit" || id === "fx-sweep" || id === "fx-riser" || id === "fx-downlifter") {
    const noise = new Tone.NoiseSynth({
      volume: id === "fx-noise-hit" ? -8 : -14,
      noise: { type: id === "fx-downlifter" ? "pink" : "white" },
      envelope: {
        attack: id === "fx-riser" ? duration * 0.45 : 0.004,
        decay: id === "fx-noise-hit" ? 0.12 * decayMul : duration,
        sustain: id === "fx-riser" ? 0.7 : 0,
        release: 0.08,
      },
    });
    const filter = new Tone.Filter({
      type: id === "fx-downlifter" ? "lowpass" : "bandpass",
      frequency: cutoff(id === "fx-downlifter" ? 4200 : id === "fx-riser" ? 500 : 1800),
      Q: id === "fx-noise-hit" ? 1 : 2.5,
    });
    noise.connect(filter);
    filter.connect(getMaster());
    const target = cutoff(id === "fx-downlifter" ? 260 : id === "fx-riser" ? 6500 : 5200);
    filter.frequency.rampTo(target, duration);
    noise.triggerAttackRelease(duration, time, level);
    disposeLater([noise, filter], duration + 0.2);
    return;
  }

  const synth = new Tone.Synth({
    volume: id === "fx-zap" ? -7 : -10,
    oscillator: { type: id === "fx-laser" ? "sawtooth" : "square" },
    envelope: { attack: 0.001, decay: 0.12 * decayMul, sustain: 0.05, release: 0.04 },
  });
  const nodes = connectVoice(synth, {
    kind: "synth",
    oscillator: "square",
    envelope: { attack: 0, decay: 0.1, sustain: 0, release: 0.04 },
    filter: { type: "lowpass", frequency: id === "fx-laser" ? 2800 : 3800, Q: 8 },
    distortion: id === "fx-zap" ? 0.35 : 0.12,
  });
  const start = midiToFreq(note) * (id === "fx-laser" ? 3 : 1.8);
  const end = midiToFreq(note) * (id === "fx-laser" ? 0.45 : 0.85);
  synth.frequency.setValueAtTime(start, time);
  synth.frequency.exponentialRampToValueAtTime(end, time + Math.max(0.04, duration * 0.45));
  synth.triggerAttackRelease(start, Math.min(duration, 0.22 * decayMul), time, level);
  disposeLater(nodes, 0.35 * decayMul);
}
