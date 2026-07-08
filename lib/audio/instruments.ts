"use client";

import * as Tone from "tone";

import { connectVoice, disposeLater, midiToNote, scaledDuration } from "./engine";
import { advanceWobblePhase, instrumentPreset } from "./presets";
import type { InstrumentPreset, SoundId, TriggerSynth } from "./types";

function oscillatorOptions(type: InstrumentPreset["oscillator"]): Tone.SynthOptions["oscillator"] {
  return { type } as Tone.SynthOptions["oscillator"];
}

export function createInstrument(preset: InstrumentPreset): TriggerSynth {
  const common = { volume: preset.volume ?? -10 };

  if (preset.kind === "fm") {
    return new Tone.FMSynth({
      ...common,
      harmonicity: preset.harmonicity ?? 2,
      modulationIndex: preset.modulationIndex ?? 8,
      oscillator: oscillatorOptions(preset.oscillator),
      envelope: preset.envelope,
      modulationEnvelope: { attack: 0.01, decay: 0.18, sustain: 0.15, release: 0.2 },
    });
  }

  if (preset.kind === "am") {
    return new Tone.AMSynth({
      ...common,
      harmonicity: preset.harmonicity ?? 1.5,
      oscillator: oscillatorOptions(preset.oscillator),
      envelope: preset.envelope,
      modulationEnvelope: { attack: 0.02, decay: 0.2, sustain: 0.25, release: 0.25 },
    });
  }

  if (preset.kind === "mono") {
    // The internal filter's static frequency would be overridden by
    // `filterEnvelope` anyway (Tone.Signal connections replace the param),
    // so only Q is set here. The preset's actual cutoff is applied by the
    // external filter that connectVoice() builds from `preset.filter`.
    return new Tone.MonoSynth({
      ...common,
      oscillator: oscillatorOptions(preset.oscillator),
      envelope: preset.envelope,
      filter: { type: "lowpass", Q: preset.filter?.Q ?? 1 },
      filterEnvelope: { attack: 0.004, decay: 0.12, sustain: 0.25, release: 0.08, baseFrequency: 80, octaves: 2.5 },
    });
  }

  return new Tone.Synth({
    ...common,
    oscillator: oscillatorOptions(preset.oscillator),
    envelope: preset.envelope,
  });
}

export function playInstrument(id: SoundId, note: number, velocity: number, durationMs: number) {
  if (id === "bass-wobble") advanceWobblePhase();
  const preset = instrumentPreset(id);
  const synth = createInstrument(preset);
  const nodes = connectVoice(synth, preset);
  // Slow-attack voices (pads, ensemble strings) need room to bloom; percussive
  // voices keep a tight minimum.
  const duration = scaledDuration(durationMs, preset.envelope.attack > 0.1 ? 0.45 : 0.05);
  synth.triggerAttackRelease(midiToNote(note), duration, Tone.now(), Math.max(0, Math.min(1, velocity)));
  disposeLater(nodes, duration + preset.envelope.release);
}
