import type { SoundId } from "@/lib/audio";
import type { RecEvent } from "../types";

export type PresetCategory = "Beat" | "Bassline" | "Riff" | "Sequence" | "Pattern" | "FX";

export type Preset = {
  id: string;
  name: string;
  description: string;
  category: PresetCategory;
  sound: SoundId;
  events: RecEvent[];
};

export type PresetGroup = {
  category: PresetCategory;
  presets: Preset[];
};

// ---------- Helpers ----------

// 16th-note grid @ 120 BPM => 125 ms per step.
const STEP = 125;

// Pads visual order is top-left -> bottom-right with notes 63..48.
// So visual index = 63 - note.
const idxOf = (note: number) => 63 - note;

function on(t: number, note: number, vel = 100): RecEvent {
  return { t, type: "noteon", note, vel, padIndex: idxOf(note), bankAtRec: "A" };
}
function off(t: number, note: number): RecEvent {
  return { t, type: "noteoff", note, padIndex: idxOf(note), bankAtRec: "A" };
}
function hit(t: number, note: number, vel = 100, durMs = 80): RecEvent[] {
  return [on(t, note, vel), off(t + durMs, note)];
}
function cc(t: number, ccNum: number, value: number): RecEvent {
  return { t, type: "cc", cc: ccNum, value };
}

// Drum note mapping (matches the Tone drum kits in lib/audio):
// note <= 49 -> kick, <=53 -> snare, else hat.
const KICK = 48;
const SNARE = 52;
const HAT = 56;
const HAT_OPEN = 60;

// ---------- Drum patterns ----------

function fourOnFloor(): RecEvent[] {
  const evs: RecEvent[] = [];
  for (let step = 0; step < 16; step++) {
    const t = step * STEP;
    if (step % 4 === 0) evs.push(...hit(t, KICK, 115));
    if (step === 4 || step === 12) evs.push(...hit(t, SNARE, 110));
    if (step % 2 === 0) evs.push(...hit(t, HAT, step % 4 === 0 ? 100 : 70, 40));
  }
  return evs;
}

function breakbeat(): RecEvent[] {
  // Funky breakbeat (1 bar)
  const evs: RecEvent[] = [];
  // Kicks
  [0, 6, 10].forEach((s) => evs.push(...hit(s * STEP, KICK, 115)));
  // Snares on 2 and 4
  [4, 12].forEach((s) => evs.push(...hit(s * STEP, SNARE, 110)));
  // Ghost snares
  [7, 14].forEach((s) => evs.push(...hit(s * STEP, SNARE, 55, 50)));
  // Hats every 8th
  for (let s = 0; s < 16; s += 2) {
    evs.push(...hit(s * STEP, HAT, s % 4 === 0 ? 95 : 65, 35));
  }
  return evs;
}

function hipHopBoom(): RecEvent[] {
  // Boom-bap: kick on 1, 3.5 (step 10); snare on 2 and 4; swung hats
  const evs: RecEvent[] = [];
  [0, 10].forEach((s) => evs.push(...hit(s * STEP, KICK, 118)));
  [4, 12].forEach((s) => evs.push(...hit(s * STEP, SNARE, 112)));
  // Swing hats — slightly delay every second 8th note
  for (let s = 0; s < 16; s += 2) {
    const swing = (s / 2) % 2 === 1 ? 28 : 0;
    evs.push(...hit(s * STEP + swing, HAT, s % 4 === 0 ? 90 : 60, 35));
  }
  return evs;
}

function halfTime(): RecEvent[] {
  // Half-time / trap-ish: snare on beat 3 only, sparse kicks, fast hats
  const evs: RecEvent[] = [];
  [0, 7, 10].forEach((s) => evs.push(...hit(s * STEP, KICK, 115)));
  evs.push(...hit(8 * STEP, SNARE, 115));
  // 16th-note hats
  for (let s = 0; s < 16; s++) {
    const v = s % 4 === 0 ? 95 : s % 2 === 0 ? 70 : 55;
    evs.push(...hit(s * STEP, HAT, v, 30));
  }
  // Open hat lift on the "and" of 4
  evs.push(...hit(14 * STEP, HAT_OPEN, 85, 120));
  return evs;
}

function trapHats(): RecEvent[] {
  // Trap hat rolls with rolling subdivisions
  const evs: RecEvent[] = [];
  evs.push(...hit(0, KICK, 120));
  evs.push(...hit(8 * STEP, SNARE, 115));
  // Hats: 8ths, with two bursts of 32nd-note rolls
  for (let s = 0; s < 16; s += 2) evs.push(...hit(s * STEP, HAT, 80, 35));
  // 32nd roll at step 6
  for (let i = 0; i < 4; i++) {
    evs.push(...hit(6 * STEP + i * (STEP / 2), HAT, 70, 25));
  }
  // 32nd roll at step 14
  for (let i = 0; i < 4; i++) {
    evs.push(...hit(14 * STEP + i * (STEP / 2), HAT, 75, 25));
  }
  return evs;
}

function dnbAmen(): RecEvent[] {
  // 1-bar Amen-flavored break at ~170 BPM feel (compressed into our STEP grid)
  const evs: RecEvent[] = [];
  [0, 10].forEach((s) => evs.push(...hit(s * STEP, KICK, 118)));
  [4, 7, 12].forEach((s) => evs.push(...hit(s * STEP, SNARE, 110)));
  // Tight hats every 8th
  for (let s = 0; s < 16; s += 2) evs.push(...hit(s * STEP, HAT, 75, 30));
  // Open hat on last 8th
  evs.push(...hit(15 * STEP, HAT_OPEN, 85, 100));
  return evs;
}

// ---------- Bass patterns ----------

function bassRoot(): RecEvent[] {
  // Held root note on every quarter
  const evs: RecEvent[] = [];
  for (let s = 0; s < 16; s += 4) {
    evs.push(on(s * STEP, 48, 105));
    evs.push(off(s * STEP + 4 * STEP - 30, 48));
  }
  return evs;
}

function walkingBass(): RecEvent[] {
  // 1, b3, 4, 5 walking pattern in C minor: C(48) Eb(51) F(53) G(55)
  const seq = [48, 51, 53, 55, 48, 51, 53, 55];
  const evs: RecEvent[] = [];
  seq.forEach((n, i) => {
    const t = i * 2 * STEP;
    evs.push(...hit(t, n, 105, 220));
  });
  return evs;
}

function acid303(): RecEvent[] {
  // 16th-note acid line in C minor with accents and an octave jump
  const line = [48, 48, 60, 48, 51, 48, 55, 48, 48, 60, 48, 51, 53, 48, 55, 50];
  const accents = [0, 4, 8, 12];
  const evs: RecEvent[] = [];
  line.forEach((n, i) => {
    const t = i * STEP;
    const vel = accents.includes(i) ? 120 : 75;
    evs.push(...hit(t, n, vel, 100));
  });
  return evs;
}

function reggaeOffbeat(): RecEvent[] {
  // Bass on 1 and 3, mid stab on offbeats
  const evs: RecEvent[] = [];
  [0, 8].forEach((s) => evs.push(...hit(s * STEP, 48, 115, 350)));
  [2, 6, 10, 14].forEach((s) => evs.push(...hit(s * STEP, 55, 90, 120)));
  return evs;
}

// ---------- Melody patterns ----------

function chordStab(): RecEvent[] {
  // C minor stabs (C + Eb) on beats 1 and 3
  const stabs = [0, 4, 8, 12];
  const evs: RecEvent[] = [];
  for (const s of stabs) {
    const t = s * STEP;
    evs.push(on(t, 60, 100), on(t, 63, 100));
    evs.push(off(t + 220, 60), off(t + 220, 63));
  }
  return evs;
}

function arpUp(): RecEvent[] {
  // 16th-note arp up through C minor pentatonic
  const notes = [48, 51, 53, 55, 58, 60, 63, 60, 58, 55, 53, 51, 48, 51, 53, 55];
  const evs: RecEvent[] = [];
  notes.forEach((n, i) => evs.push(...hit(i * STEP, n, 95, 100)));
  return evs;
}

function octaveHook(): RecEvent[] {
  // Octave bounce hook: C low / C high alternating
  const evs: RecEvent[] = [];
  for (let s = 0; s < 16; s++) {
    const n = s % 2 === 0 ? 48 : 60;
    evs.push(...hit(s * STEP, n, s % 4 === 0 ? 115 : 85, 90));
  }
  return evs;
}

function pentatonicRiff(): RecEvent[] {
  // Bluesy pentatonic riff
  const seq: Array<[number, number, number]> = [
    [0, 55, 110],
    [1, 58, 95],
    [2, 60, 95],
    [3, 58, 80],
    [4, 60, 110],
    [6, 63, 100],
    [8, 60, 95],
    [10, 58, 90],
    [12, 55, 110],
    [14, 53, 90],
  ];
  const evs: RecEvent[] = [];
  for (const [s, n, v] of seq) evs.push(...hit(s * STEP, n, v, 150));
  return evs;
}

function dreamyPad(): RecEvent[] {
  // Slow C-minor pad chord (C, Eb, G→63 cap) sustained over the bar
  const evs: RecEvent[] = [];
  const t = 0;
  const dur = 16 * STEP - 30;
  [48, 51, 55, 63].forEach((n) => {
    evs.push(on(t, n, 85));
    evs.push(off(t + dur, n));
  });
  return evs;
}

// ---------- FX / Automation ----------
//
// In local preview, CC 22 is mapped to master volume so swells/gates are
// audible. Other CCs are still emitted for downstream consumers (DAWs).
// Each FX preset also includes audible note content so it is distinguishable.

function holdChord(notes: number[], vel = 70, durMs = 16 * STEP - 30): RecEvent[] {
  const evs: RecEvent[] = [];
  notes.forEach((n) => {
    evs.push(on(0, n, vel));
    evs.push(off(durMs, n));
  });
  return evs;
}

function k1Sweep(): RecEvent[] {
  // Audible: chromatic rising sweep up the pads.
  // Also emits CC 20 ramp for DAW filter macros.
  const evs: RecEvent[] = [];
  const steps = 16;
  for (let i = 0; i < steps; i++) {
    const t = i * STEP;
    const note = 48 + i; // chromatic 48..63
    evs.push(...hit(t, note, 85 + (i * 2), 110));
  }
  const ccSteps = 32;
  const dur = 16 * STEP;
  for (let i = 0; i <= ccSteps; i++) {
    const t = Math.round((i / ccSteps) * dur);
    evs.push(cc(t, 20, Math.round((i / ccSteps) * 127)));
  }
  return evs;
}

function k2Lfo(): RecEvent[] {
  // Audible: tremolo — a held minor chord with CC 22 (master vol) sine LFO.
  const evs: RecEvent[] = [];
  evs.push(...holdChord([48, 51, 55, 60]));
  const steps = 64;
  const dur = 16 * STEP;
  for (let i = 0; i <= steps; i++) {
    const t = Math.round((i / steps) * dur);
    const v = Math.round(64 + 55 * Math.sin((i / steps) * Math.PI * 6));
    evs.push(cc(t, 22, Math.max(10, Math.min(127, v))));
    // Also emit CC 21 sine for DAW LFO macros.
    evs.push(cc(t, 21, Math.max(0, Math.min(127, Math.round(64 + 60 * Math.sin((i / steps) * Math.PI * 4))))));
  }
  return evs;
}

function riseFall(): RecEvent[] {
  // Audible: held pad chord with master-volume swell up then down.
  const evs: RecEvent[] = [];
  evs.push(...holdChord([48, 55, 60, 63], 80));
  const half = (16 * STEP) / 2;
  const steps = 32;
  for (let i = 0; i <= steps; i++) {
    evs.push(cc(Math.round((i / steps) * half), 22, Math.round((i / steps) * 127)));
  }
  for (let i = 0; i <= steps; i++) {
    evs.push(cc(Math.round(half + (i / steps) * half), 22, Math.round((1 - i / steps) * 127)));
  }
  return evs;
}

function stutterGate(): RecEvent[] {
  // Audible: rapid stuttered stabs of a single chord every 16th.
  // Also a CC 22 chopping pattern for DAW gating macros.
  const evs: RecEvent[] = [];
  const chord = [48, 55, 60];
  for (let s = 0; s < 16; s++) {
    const t = s * STEP;
    const vel = s % 2 === 0 ? 110 : 70;
    const dur = 60;
    chord.forEach((n) => {
      evs.push(on(t, n, vel));
      evs.push(off(t + dur, n));
    });
  }
  for (let s = 0; s < 32; s++) {
    evs.push(cc(s * (STEP / 2), 22, s % 2 === 0 ? 127 : 0));
  }
  return evs;
}

function zigzagPan(): RecEvent[] {
  // Audible: octave bounce between low and high notes — the auditory analog of
  // a hard pan. Also emits CC 23 triangle for DAW pan macros.
  const evs: RecEvent[] = [];
  for (let s = 0; s < 16; s++) {
    const n = s % 2 === 0 ? 48 : 60;
    evs.push(...hit(s * STEP, n, 90, 100));
  }
  const steps = 48;
  const dur = 16 * STEP;
  for (let i = 0; i <= steps; i++) {
    const t = Math.round((i / steps) * dur);
    const phase = (i / steps) * 6;
    const v = Math.round(64 + 60 * (2 * Math.abs(phase - Math.round(phase)) - 0.5) * 2);
    evs.push(cc(t, 23, Math.max(0, Math.min(127, v))));
  }
  return evs;
}

// ---------- More Drums ----------

function technoDriver(): RecEvent[] {
  // Driving techno: kick every quarter, offbeat open hat, clap on 2 & 4
  const evs: RecEvent[] = [];
  for (let s = 0; s < 16; s += 4) evs.push(...hit(s * STEP, KICK, 120));
  for (let s = 2; s < 16; s += 4) evs.push(...hit(s * STEP, HAT_OPEN, 90, 110));
  [4, 12].forEach((s) => evs.push(...hit(s * STEP, SNARE, 105)));
  for (let s = 0; s < 16; s++) evs.push(...hit(s * STEP, HAT, s % 4 === 0 ? 0 : 55, 25));
  return evs;
}

function houseShuffle(): RecEvent[] {
  // Shuffled house with snappy clap on 2 & 4 and rolling hats
  const evs: RecEvent[] = [];
  for (let s = 0; s < 16; s += 4) evs.push(...hit(s * STEP, KICK, 118));
  [4, 12].forEach((s) => evs.push(...hit(s * STEP, SNARE, 110)));
  for (let s = 2; s < 16; s += 4) evs.push(...hit(s * STEP, HAT, 80, 45));
  for (let s = 0; s < 16; s += 2) {
    const swing = (s / 2) % 2 === 1 ? 35 : 0;
    evs.push(...hit(s * STEP + swing, HAT, s % 4 === 0 ? 70 : 55, 25));
  }
  return evs;
}

function afroLatin(): RecEvent[] {
  // Tumbao-ish groove
  const evs: RecEvent[] = [];
  [0, 6, 10].forEach((s) => evs.push(...hit(s * STEP, KICK, 110)));
  [3, 7, 11, 15].forEach((s) => evs.push(...hit(s * STEP, SNARE, 70, 60)));
  [4, 12].forEach((s) => evs.push(...hit(s * STEP, SNARE, 110)));
  for (let s = 0; s < 16; s += 1) evs.push(...hit(s * STEP, HAT, s % 2 === 0 ? 75 : 50, 25));
  return evs;
}

function minimalTick(): RecEvent[] {
  // Sparse minimal: kick on 1, ghost snare on 11, closed hats every 8th
  const evs: RecEvent[] = [];
  evs.push(...hit(0, KICK, 118));
  evs.push(...hit(8 * STEP, KICK, 100));
  evs.push(...hit(11 * STEP, SNARE, 70, 50));
  for (let s = 0; s < 16; s += 2) evs.push(...hit(s * STEP, HAT, 60, 25));
  return evs;
}

// ---------- More Bass ----------

function subDrop(): RecEvent[] {
  // Long held sub on root with octave drop on beat 3
  const evs: RecEvent[] = [];
  evs.push(on(0, 48, 115));
  evs.push(off(8 * STEP - 30, 48));
  evs.push(on(8 * STEP, 48, 120));
  evs.push(off(16 * STEP - 30, 48));
  return evs;
}

function funkSlap(): RecEvent[] {
  // Slap-style: roots + octave pops + ghosted 16ths
  const seq: Array<[number, number, number, number]> = [
    [0, 48, 120, 100],
    [2, 60, 90, 60],
    [3, 48, 60, 50],
    [4, 51, 110, 110],
    [6, 60, 95, 60],
    [8, 48, 120, 100],
    [10, 53, 100, 90],
    [11, 60, 80, 50],
    [12, 55, 115, 110],
    [14, 48, 90, 80],
    [15, 60, 75, 50],
  ];
  const evs: RecEvent[] = [];
  for (const [s, n, v, d] of seq) evs.push(...hit(s * STEP, n, v, d));
  return evs;
}

function dubBass(): RecEvent[] {
  // Slow dub bass: half-bar root, fifth bounce
  const evs: RecEvent[] = [];
  evs.push(...hit(0, 48, 115, 800));
  evs.push(...hit(6 * STEP, 55, 100, 220));
  evs.push(...hit(8 * STEP, 48, 115, 800));
  evs.push(...hit(14 * STEP, 55, 100, 220));
  return evs;
}

// ---------- More Melody ----------

function minorProgression(): RecEvent[] {
  // i - VI - III - VII in C minor: Cm, Ab, Eb, Bb
  // Voiced as triads on the top row.
  const chords: Array<[number, number, number]> = [
    [48, 51, 55], // Cm
    [56, 60, 51], // Ab/Eb voicing (Ab=56, C=60, Eb=51)
    [51, 55, 58], // Eb
    [58, 50, 53], // Bb voicing
  ];
  const evs: RecEvent[] = [];
  chords.forEach((c, i) => {
    const t = i * 4 * STEP;
    const dur = 4 * STEP - 40;
    c.forEach((n) => {
      evs.push(on(t, n, 90));
      evs.push(off(t + dur, n));
    });
  });
  return evs;
}

function trance16ths(): RecEvent[] {
  // Trance-style 16th-note arp on an A minor triad shape
  const notes = [48, 55, 60, 63, 60, 55, 48, 55, 60, 63, 60, 55, 48, 55, 60, 63];
  const evs: RecEvent[] = [];
  notes.forEach((n, i) => evs.push(...hit(i * STEP, n, i % 4 === 0 ? 105 : 85, 90)));
  return evs;
}

function lullabyMelody(): RecEvent[] {
  // Slow, gentle melody — quarter notes with rests
  const seq: Array<[number, number]> = [
    [0, 60],
    [2, 63],
    [4, 60],
    [6, 58],
    [8, 55],
    [10, 58],
    [12, 60],
    [14, 51],
  ];
  const evs: RecEvent[] = [];
  for (const [s, n] of seq) evs.push(...hit(s * STEP, n, 85, 220));
  return evs;
}

function blueScale(): RecEvent[] {
  // C blues scale walk: C Eb F F# G Bb C ...
  const notes = [48, 51, 53, 54, 55, 58, 60, 58, 55, 54, 53, 51, 48, 51, 53, 55];
  const evs: RecEvent[] = [];
  notes.forEach((n, i) => evs.push(...hit(i * STEP, n, i % 4 === 0 ? 105 : 80, 110)));
  return evs;
}

// ---------- More FX ----------

// ---------- Catalog ----------

function sorted(evs: RecEvent[]): RecEvent[] {
  return [...evs].sort((a, b) => a.t - b.t);
}

export const PRESETS: Preset[] = [
  // Open beat examples
  {
    id: "four-on-floor",
    name: "Four-on-the-floor",
    description: "Open 1-bar house beat at 120 BPM.",
    category: "Beat",
    sound: "drums",
    events: sorted(fourOnFloor()),
  },
  {
    id: "breakbeat",
    name: "Breakbeat",
    description: "Open funk break with ghost snares.",
    category: "Beat",
    sound: "drums",
    events: sorted(breakbeat()),
  },
  {
    id: "hiphop-boom",
    name: "Boom-bap",
    description: "Hip-hop kit with swung hats and a 16th-note kick.",
    category: "Beat",
    sound: "drums-808",
    events: sorted(hipHopBoom()),
  },
  {
    id: "half-time",
    name: "Half-time",
    description: "Trap-flavored half-time groove with 16th hats.",
    category: "Beat",
    sound: "drums-808",
    events: sorted(halfTime()),
  },
  {
    id: "trap-hats",
    name: "Trap hats",
    description: "Sparse kick/snare with 32nd-note hat rolls.",
    category: "Beat",
    sound: "drums-808",
    events: sorted(trapHats()),
  },
  {
    id: "dnb-amen",
    name: "Amen-style break",
    description: "Drum-and-bass styled 1-bar Amen break.",
    category: "Beat",
    sound: "drums",
    events: sorted(dnbAmen()),
  },
  {
    id: "techno-driver",
    name: "Techno driver",
    description: "Four-on-the-floor kick with offbeat open hats and claps.",
    category: "Beat",
    sound: "drums-808",
    events: sorted(technoDriver()),
  },
  {
    id: "house-shuffle",
    name: "House shuffle",
    description: "Shuffled house with snappy claps and rolling hats.",
    category: "Beat",
    sound: "drums",
    events: sorted(houseShuffle()),
  },
  {
    id: "afro-latin",
    name: "Afro-Latin groove",
    description: "Tumbao-flavored kick / ghost snare pattern.",
    category: "Beat",
    sound: "drums",
    events: sorted(afroLatin()),
  },
  {
    id: "minimal-tick",
    name: "Minimal tick",
    description: "Sparse minimal techno with ghost snare accent.",
    category: "Beat",
    sound: "drums-808",
    events: sorted(minimalTick()),
  },

  // Open bassline examples
  {
    id: "bass-root",
    name: "Root pulse",
    description: "Held root note on every quarter — solid foundation.",
    category: "Bassline",
    sound: "bass",
    events: sorted(bassRoot()),
  },
  {
    id: "walking-bass",
    name: "Walking bass",
    description: "1-b3-4-5 walk in C minor.",
    category: "Bassline",
    sound: "bass",
    events: sorted(walkingBass()),
  },
  {
    id: "acid-303",
    name: "Acid 303 line",
    description: "16th-note acid line with accents and octave jumps.",
    category: "Bassline",
    sound: "bass-acid",
    events: sorted(acid303()),
  },
  {
    id: "reggae-offbeat",
    name: "Reggae offbeat",
    description: "Roots-style bass on 1 and 3 with offbeat stabs.",
    category: "Bassline",
    sound: "bass",
    events: sorted(reggaeOffbeat()),
  },
  {
    id: "sub-drop",
    name: "Sub drop",
    description: "Held sub root across the bar — deep foundation.",
    category: "Bassline",
    sound: "bass",
    events: sorted(subDrop()),
  },
  {
    id: "funk-slap",
    name: "Funk slap",
    description: "Roots, ghosted 16ths, and octave pops.",
    category: "Bassline",
    sound: "bass-acid",
    events: sorted(funkSlap()),
  },
  {
    id: "dub-bass",
    name: "Dub bass",
    description: "Slow dub roots with fifth bounce.",
    category: "Bassline",
    sound: "bass",
    events: sorted(dubBass()),
  },

  // Open riff, sequence, and pattern examples
  {
    id: "minor-stabs",
    name: "Minor stabs",
    description: "Two-note minor chord stabs on the top row.",
    category: "Pattern",
    sound: "lead-saw",
    events: sorted(chordStab()),
  },
  {
    id: "arp-up",
    name: "Pentatonic arp",
    description: "16th-note arpeggio up & down a C-minor pentatonic.",
    category: "Sequence",
    sound: "pluck",
    events: sorted(arpUp()),
  },
  {
    id: "octave-hook",
    name: "Octave hook",
    description: "Alternating low/high C with accented downbeats.",
    category: "Riff",
    sound: "lead",
    events: sorted(octaveHook()),
  },
  {
    id: "pentatonic-riff",
    name: "Pentatonic riff",
    description: "Bluesy riff sketched across one bar.",
    category: "Riff",
    sound: "keys",
    events: sorted(pentatonicRiff()),
  },
  {
    id: "dreamy-pad",
    name: "Dreamy pad chord",
    description: "Sustained 4-note minor pad over the whole bar.",
    category: "Pattern",
    sound: "pad",
    events: sorted(dreamyPad()),
  },
  {
    id: "minor-progression",
    name: "Minor progression",
    description: "i – VI – III – VII chord cycle in C minor.",
    category: "Pattern",
    sound: "keys",
    events: sorted(minorProgression()),
  },
  {
    id: "trance-16ths",
    name: "Trance arp",
    description: "Driving 16th-note trance arpeggio on a minor triad.",
    category: "Sequence",
    sound: "lead-saw",
    events: sorted(trance16ths()),
  },
  {
    id: "lullaby",
    name: "Lullaby",
    description: "Slow, gentle quarter-note melody with rests.",
    category: "Riff",
    sound: "keys",
    events: sorted(lullabyMelody()),
  },
  {
    id: "blue-scale",
    name: "Blue scale walk",
    description: "C blues scale walked up and down across a bar.",
    category: "Riff",
    sound: "lead",
    events: sorted(blueScale()),
  },

  // FX / Automation
  {
    id: "k1-sweep",
    name: "K1 filter sweep",
    description: "Chromatic rising sweep with CC 20 ramp for filter macros.",
    category: "FX",
    sound: "lead-saw",
    events: sorted(k1Sweep()),
  },
  {
    id: "k2-lfo",
    name: "K2 LFO tremolo",
    description: "Held minor chord with CC 22 sine tremolo — audible.",
    category: "FX",
    sound: "keys",
    events: sorted(k2Lfo()),
  },
  {
    id: "rise-fall",
    name: "Rise / Fall",
    description: "Pad chord swelling up then back down — classic build-up.",
    category: "FX",
    sound: "pad",
    events: sorted(riseFall()),
  },
  {
    id: "stutter-gate",
    name: "Stutter gate",
    description: "Hard 16th-note gated chord stabs — gated tremolo.",
    category: "FX",
    sound: "lead",
    events: sorted(stutterGate()),
  },
  {
    id: "zigzag-pan",
    name: "Zigzag pan",
    description: "Octave bounce + CC 23 triangle for auto-pan macros.",
    category: "FX",
    sound: "pluck",
    events: sorted(zigzagPan()),
  },
];

export const PRESET_CATEGORIES: PresetCategory[] = ["Beat", "Bassline", "Riff", "Sequence", "Pattern", "FX"];

export const PRESET_GROUPS: PresetGroup[] = PRESET_CATEGORIES.map((c) => ({
  category: c,
  presets: PRESETS.filter((p) => p.category === c),
}));
