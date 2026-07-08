"use client";

import * as Tone from "tone";

import type { InstrumentPreset, SoundId, ToneSource } from "./types";

let master: Tone.Gain | null = null;
let currentSound: SoundId = "pluck";

// Macro modulation driven by K1 (cutoff) and K2 (decay).
// K1: 0..127 -> 0.25x..4x brightness. K2: 0..127 -> 0.5x..2.5x note length.
let cutoffMul = 1;
let decayMul = 1;

export function setKnobCutoff(v0to127: number) {
  const n = Math.max(0, Math.min(127, v0to127)) / 127;
  cutoffMul = Math.pow(2, (n - 0.5) * 4);
}

export function setKnobDecay(v0to127: number) {
  const n = Math.max(0, Math.min(127, v0to127)) / 127;
  decayMul = 0.5 + n * 2;
}

export function getDecayMul() {
  return decayMul;
}

export function getMaster() {
  if (!master) {
    const limiter = new Tone.Limiter(-1).toDestination();
    master = new Tone.Gain(0.6).connect(limiter);
  }
  return master;
}

export async function resumeAudio() {
  getMaster();
  await Tone.start();
}

export function setMasterVolume(v: number) {
  const clamped = Math.max(0, Math.min(1, v));
  getMaster().gain.rampTo(clamped, 0.01);
}

export function setSound(id: SoundId) {
  currentSound = id;
}

export function getCurrentSound() {
  return currentSound;
}

export function midiToFreq(note: number) {
  return Tone.Frequency(note, "midi").toFrequency();
}

export function midiToNote(note: number) {
  return Tone.Frequency(note, "midi").toNote();
}

export function scaledDuration(durationMs: number, minimum = 0.04) {
  return Math.max(minimum, (durationMs * decayMul) / 1000);
}

export function cutoff(base: number) {
  return Math.max(80, Math.min(16000, base * cutoffMul));
}

export function connectVoice(source: ToneSource, preset: InstrumentPreset) {
  const nodes: ToneSource[] = [source];
  let output: Tone.ToneAudioNode = source;

  if (preset.filter) {
    const filter = new Tone.Filter({
      type: preset.filter.type,
      frequency: cutoff(preset.filter.frequency),
      Q: preset.filter.Q ?? 1,
    });
    output.connect(filter);
    output = filter;
    nodes.push(filter);
  }

  if (preset.chorus) {
    const chorus = new Tone.Chorus(3.5, 2.5, preset.chorus).start();
    output.connect(chorus);
    output = chorus;
    nodes.push(chorus);
  }

  if (preset.feedbackDelay) {
    const delay = new Tone.FeedbackDelay("8n", preset.feedbackDelay);
    output.connect(delay);
    output = delay;
    nodes.push(delay);
  }

  if (preset.distortion) {
    const distortion = new Tone.Distortion(preset.distortion);
    output.connect(distortion);
    output = distortion;
    nodes.push(distortion);
  }

  if (preset.tremolo) {
    const tremolo = new Tone.Tremolo(5, preset.tremolo).start();
    output.connect(tremolo);
    output = tremolo;
    nodes.push(tremolo);
  }

  output.connect(getMaster());
  return nodes;
}

export function disposeLater(nodes: ToneSource[], seconds: number) {
  window.setTimeout(() => {
    nodes.forEach((node) => node.dispose());
  }, Math.ceil((seconds + 0.35) * 1000));
}
