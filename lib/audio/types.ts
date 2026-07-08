import type * as Tone from "tone";

export type SoundId =
  | "pluck"
  | "drums"
  | "drums-808"
  | "bass"
  | "bass-acid"
  | "bass-reese"
  | "bass-fm"
  | "bass-round"
  | "bass-wobble"
  | "pad"
  | "pad-choir"
  | "pad-glass"
  | "pad-strings"
  | "pad-atmosphere"
  | "strings-ensemble"
  | "strings-pizzicato"
  | "strings-cello"
  | "strings-synth"
  | "brass-section"
  | "brass-stab"
  | "brass-horn"
  | "brass-muted"
  | "winds-flute"
  | "winds-clarinet"
  | "winds-pan"
  | "winds-breath"
  | "lead"
  | "lead-saw"
  | "lead-soft"
  | "lead-sync"
  | "lead-chip"
  | "lead-brass"
  | "keys"
  | "keys-piano"
  | "keys-epiano"
  | "keys-organ"
  | "drums-cr78"
  | "drums-glitch"
  | "fx-sweep"
  | "fx-impact"
  | "fx-laser"
  | "fx-riser"
  | "fx-downlifter"
  | "fx-noise-hit"
  | "fx-zap";

export type SoundGroupId = "bass" | "keys" | "strings" | "brass" | "winds" | "lead" | "pad" | "drums" | "fx";

export type SoundGroupDef = {
  id: SoundGroupId;
  name: string;
};

export type SoundDef = {
  id: SoundId;
  name: string;
  description: string;
  group: SoundGroupId;
};

export type DrumKit = "standard" | "808" | "cr78" | "glitch";

export type ToneSource = Tone.ToneAudioNode & {
  dispose: () => void;
};

export type TriggerSynth = ToneSource & {
  triggerAttackRelease: (note: Tone.Unit.Frequency, duration: Tone.Unit.Time, time?: Tone.Unit.Time, velocity?: number) => void;
};

export type InstrumentKind = "synth" | "am" | "fm" | "mono";

export type InstrumentPreset = {
  kind: InstrumentKind;
  oscillator: NonNullable<Tone.SynthOptions["oscillator"]["type"]>;
  envelope: {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
  };
  volume?: number;
  modulationIndex?: number;
  harmonicity?: number;
  filter?: {
    type: BiquadFilterType;
    frequency: number;
    Q?: number;
  };
  chorus?: number;
  feedbackDelay?: number;
  distortion?: number;
  tremolo?: number;
};
