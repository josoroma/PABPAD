import type { SoundId } from "@/lib/audio";

import type { Bank } from "./atoms";
import { PATTERN_TRACK_ID } from "./constants";
import type { PatternClip, RecEvent, Track } from "./types";

// Built-in original demo songs, generated as multitrack arrangements.

const CYBERPUNK_NIGHT_DRIVE_TITLE = "Cyberpunk Night Drive";
const CYBERPUNK_NIGHT_DRIVE_DURATION = 16000;
const THUNDER_FORGE_TITLE = "Thunder Forge Drum Solo";
const THUNDER_FORGE_DURATION = 12000;
const GLASS_CITY_PURSUIT_TITLE = "Glass City Pursuit";
const GLASS_CITY_PURSUIT_DURATION = 14000;
const HOUSE_BASS_TITLE = "House Bass Original";
const HOUSE_BASS_DURATION = 16000;
const MIDNIGHT_TRAP_TITLE = "Midnight Trap Original";
const MIDNIGHT_TRAP_DURATION = 16000;

function noteEvent(t: number, note: number, durMs: number, vel: number, padIndex: number, bankAtRec: Bank): RecEvent[] {
  return [
    { t, type: "noteon", note, vel, padIndex, bankAtRec },
    { t: t + durMs, type: "noteoff", note, padIndex, bankAtRec },
  ];
}

function ccEvent(t: number, cc: number, value: number): RecEvent {
  return { t, type: "cc", cc, value };
}

function bankEvent(t: number, target: "pad" | "knob" | "fader", bank: Bank): RecEvent {
  return { t, type: "bank", target, bank };
}

function clip(
  id: string,
  name: string,
  sound: SoundId,
  events: RecEvent[],
  startMs = 0,
  durationMs = CYBERPUNK_NIGHT_DRIVE_DURATION,
  sourceId = CYBERPUNK_NIGHT_DRIVE_TITLE
): PatternClip {
  return {
    id,
    name,
    source: "original",
    sourceId,
    sound,
    events: events.sort((a, b) => a.t - b.t),
    startMs,
    durationMs,
  };
}

function makeCyberpunkNightDriveTracks(): Track[] {
  const drums: RecEvent[] = [
    bankEvent(0, "pad", "A"),
    bankEvent(0, "knob", "A"),
    bankEvent(0, "fader", "A"),
    ccEvent(0, 20, 82),
    ccEvent(0, 21, 58),
    ccEvent(0, 22, 104),
    ccEvent(0, 23, 78),
    ccEvent(7600, 22, 86),
    ccEvent(8000, 22, 112),
    ccEvent(12000, 23, 116),
  ];
  for (let t = 0; t < CYBERPUNK_NIGHT_DRIVE_DURATION; t += 500) drums.push(...noteEvent(t, 48, 95, t % 2000 === 0 ? 120 : 108, 12, "A"));
  for (let t = 1000; t < CYBERPUNK_NIGHT_DRIVE_DURATION; t += 2000) drums.push(...noteEvent(t, 52, 85, 112, 8, "A"));
  for (let t = 0; t < CYBERPUNK_NIGHT_DRIVE_DURATION; t += 250) drums.push(...noteEvent(t + 62, 56, 38, t % 1000 === 0 ? 88 : 62, 4, "A"));
  for (const burst of [3500, 7500, 11500, 15500]) {
    for (let i = 0; i < 8; i++) drums.push(...noteEvent(burst + i * 62.5, 60, 28, 54 + i * 6, 0, "A"));
  }

  const bass: RecEvent[] = [
    bankEvent(0, "pad", "B"),
    ccEvent(0, 20, 46),
    ccEvent(0, 21, 74),
    ccEvent(4000, 20, 68),
    ccEvent(8000, 20, 38),
    ccEvent(12000, 20, 92),
  ];
  const bassPattern = [36, 36, 43, 39, 36, 46, 43, 34];
  bassPattern.forEach((note, index) => {
    const t = index * 500;
    bass.push(...noteEvent(t, note, index % 4 === 3 ? 360 : 260, 105, 12 + (index % 4), "B"));
    bass.push(...noteEvent(t + 8000, note + (index === 7 ? 12 : 0), index % 4 === 3 ? 360 : 260, 112, 12 + (index % 4), "B"));
  });
  for (let t = 4000; t < 8000; t += 500) bass.push(...noteEvent(t, [36, 36, 41, 39][(t / 500) % 4]!, 260, 102, 13, "B"));
  for (let t = 12000; t < 16000; t += 250) bass.push(...noteEvent(t, t % 1000 === 750 ? 46 : 36, 135, 96, t % 500 === 0 ? 14 : 15, "B"));

  const pads: RecEvent[] = [
    bankEvent(0, "pad", "C"),
    ccEvent(0, 20, 36),
    ccEvent(0, 21, 105),
    ccEvent(6000, 20, 54),
    ccEvent(10000, 21, 124),
  ];
  const chords = [
    [60, 63, 67],
    [58, 62, 65],
    [55, 60, 63],
    [56, 60, 65],
  ];
  chords.forEach((chord, index) => {
    const t = index * 4000;
    chord.forEach((note, chordIndex) => pads.push(...noteEvent(t + chordIndex * 70, note, 3600, 76 - chordIndex * 4, chordIndex, "C")));
  });

  const lead: RecEvent[] = [
    bankEvent(0, "pad", "B"),
    ccEvent(0, 20, 74),
    ccEvent(0, 21, 52),
    ccEvent(8200, 20, 102),
  ];
  const leadNotes = [
    [2000, 67, 210, 92, 1],
    [2250, 70, 180, 88, 2],
    [2500, 75, 420, 94, 3],
    [5250, 70, 160, 86, 5],
    [5500, 72, 160, 90, 6],
    [5750, 75, 360, 96, 7],
    [9000, 79, 180, 102, 1],
    [9250, 77, 180, 88, 2],
    [9500, 75, 500, 96, 3],
    [13250, 75, 140, 86, 5],
    [13500, 77, 140, 92, 6],
    [13750, 82, 420, 108, 7],
  ] as const;
  leadNotes.forEach(([t, note, dur, vel, padIndex]) => lead.push(...noteEvent(t, note, dur, vel, padIndex, "B")));
  for (let i = 0; i < 12; i++) lead.push(...noteEvent(14500 + i * 62.5, i % 3 === 0 ? 82 : i % 3 === 1 ? 79 : 75, 40, 62 + i * 4, 11, "B"));

  const fxSweep = [
    bankEvent(0, "fader", "B"),
    ccEvent(0, 22, 70),
    ccEvent(0, 23, 34),
    ccEvent(1300, 23, 96),
    ...noteEvent(0, 63, 1850, 78, 3, "C"),
  ];
  const fxImpact = [
    bankEvent(0, "pad", "A"),
    ccEvent(0, 22, 120),
    ...noteEvent(0, 48, 620, 122, 12, "A"),
  ];
  const fxZap = [
    bankEvent(0, "pad", "C"),
    ccEvent(0, 20, 114),
    ...noteEvent(0, 71, 160, 92, 6, "C"),
    ...noteEvent(375, 74, 120, 86, 7, "C"),
    ...noteEvent(750, 67, 190, 90, 10, "C"),
  ];

  return [
    { id: PATTERN_TRACK_ID, name: "Recorded", muted: true, clips: [] },
    { id: "track-1", name: "Neon pulse drums", muted: false, clips: [clip("cyber-drums", "808 road grid + note repeats", "drums-808", drums)] },
    { id: "track-2", name: "Underpass bass", muted: false, clips: [clip("cyber-bass", "Wobble engine line", "bass-wobble", bass)] },
    { id: "track-3", name: "Rain glass pads", muted: false, clips: [clip("cyber-pads", "Headlight chord wash", "pad-atmosphere", pads)] },
    { id: "track-4", name: "Scanner lead", muted: false, clips: [clip("cyber-lead", "Signal flare melody", "lead-saw", lead)] },
    {
      id: "track-5",
      name: "Tunnel FX",
      muted: false,
      clips: [
        clip("cyber-fx-sweep-a", "Opening sodium sweep", "fx-riser", fxSweep, 0, 2000),
        clip("cyber-fx-impact-a", "Bridge impact", "fx-impact", fxImpact, 7800, 900),
        clip("cyber-fx-zap-a", "Drone flybys", "fx-zap", fxZap, 10800, 1200),
        clip("cyber-fx-impact-b", "Final overpass hit", "fx-impact", fxImpact, 15000, 900),
      ],
    },
  ];
}

function makeThunderForgeTracks(): Track[] {
  const mainKit: RecEvent[] = [
    bankEvent(0, "pad", "A"),
    bankEvent(0, "knob", "B"),
    bankEvent(0, "fader", "A"),
    ccEvent(0, 20, 94),
    ccEvent(0, 21, 42),
    ccEvent(0, 22, 122),
    ccEvent(2500, 20, 72),
    ccEvent(5200, 21, 64),
    ccEvent(8200, 20, 112),
  ];
  for (let t = 0; t < THUNDER_FORGE_DURATION; t += 250) {
    if (t % 500 === 0) mainKit.push(...noteEvent(t, 48, 70, t % 2000 === 0 ? 124 : 108, 12, "A"));
    if (t % 1000 === 500 || t % 1000 === 750) mainKit.push(...noteEvent(t, 49, 65, 100, 13, "A"));
    if (t % 1000 === 0) mainKit.push(...noteEvent(t + 125, 52, 70, 116, 8, "A"));
    mainKit.push(...noteEvent(t + 62, 56, 32, t % 1000 === 0 ? 92 : 68, 4, "A"));
  }
  for (const t of [1750, 3750, 5750, 7750, 9750, 10750]) {
    [52, 53, 52, 50, 49, 48].forEach((note, index) => mainKit.push(...noteEvent(t + index * 83, note, 46, 82 + index * 6, 8 + (index % 4), "A")));
  }

  const doubleKick: RecEvent[] = [
    bankEvent(0, "pad", "B"),
    ccEvent(0, 20, 54),
    ccEvent(0, 21, 36),
    ccEvent(7200, 22, 112),
  ];
  for (let t = 0; t < THUNDER_FORGE_DURATION; t += 125) {
    if (t < 2000 || (t >= 4000 && t < 6000) || t >= 8500) doubleKick.push(...noteEvent(t, t % 250 === 0 ? 48 : 49, 48, 92 + (t % 500 === 0 ? 20 : 0), 12 + ((t / 125) % 2), "B"));
  }

  const cymbals: RecEvent[] = [
    bankEvent(0, "pad", "C"),
    ccEvent(0, 20, 118),
    ccEvent(0, 21, 30),
    ccEvent(6000, 23, 120),
  ];
  for (let t = 0; t < THUNDER_FORGE_DURATION; t += 125) cymbals.push(...noteEvent(t + 35, t % 500 === 0 ? 60 : 58, 24, t % 500 === 0 ? 96 : 58, t % 500 === 0 ? 0 : 6, "C"));
  for (const burst of [2850, 6850, 10850]) {
    for (let i = 0; i < 16; i++) cymbals.push(...noteEvent(burst + i * 31.25, 60, 18, 50 + i * 4, 3, "C"));
  }

  const stabs: RecEvent[] = [
    bankEvent(0, "pad", "B"),
    ccEvent(0, 20, 76),
    ccEvent(0, 21, 48),
    ccEvent(8000, 20, 102),
  ];
  [0, 2000, 4000, 6000, 8000, 9500, 11000].forEach((t, index) => {
    stabs.push(...noteEvent(t, [40, 43, 38, 45, 40, 47, 36][index]!, index >= 5 ? 360 : 240, 96, 15, "B"));
  });

  const impacts: RecEvent[] = [
    bankEvent(0, "fader", "C"),
    ccEvent(0, 22, 116),
    ccEvent(0, 23, 102),
    ...noteEvent(0, 48, 500, 116, 12, "A"),
    ...noteEvent(6000, 48, 520, 122, 12, "A"),
    ...noteEvent(11250, 48, 700, 127, 12, "A"),
  ];

  return [
    { id: PATTERN_TRACK_ID, name: "Recorded", muted: true, clips: [] },
    { id: "track-1", name: "Forge kit lead", muted: false, clips: [clip("forge-main-kit", "Original arena drum solo", "drums", mainKit, 0, THUNDER_FORGE_DURATION, THUNDER_FORGE_TITLE)] },
    { id: "track-2", name: "Double-kick engine", muted: false, clips: [clip("forge-double-kick", "Twin low-kick runs", "drums-808", doubleKick, 0, THUNDER_FORGE_DURATION, THUNDER_FORGE_TITLE)] },
    { id: "track-3", name: "Cymbal shrapnel", muted: false, clips: [clip("forge-cymbals", "Rapid repeat cymbal sparks", "drums-glitch", cymbals, 0, THUNDER_FORGE_DURATION, THUNDER_FORGE_TITLE)] },
    { id: "track-4", name: "Riff shadows", muted: false, clips: [clip("forge-stabs", "Low-string hit markers", "bass-acid", stabs, 0, THUNDER_FORGE_DURATION, THUNDER_FORGE_TITLE)] },
    { id: "track-5", name: "Stage blasts", muted: false, clips: [clip("forge-impacts", "Pyro impact accents", "fx-impact", impacts, 0, THUNDER_FORGE_DURATION, THUNDER_FORGE_TITLE)] },
  ];
}

function makeGlassCityPursuitTracks(): Track[] {
  const drums: RecEvent[] = [
    bankEvent(0, "pad", "A"),
    ccEvent(0, 20, 86),
    ccEvent(0, 21, 50),
    ccEvent(0, 22, 104),
  ];
  for (let t = 0; t < GLASS_CITY_PURSUIT_DURATION; t += 500) drums.push(...noteEvent(t, 48, 78, 110, 12, "A"));
  for (let t = 750; t < GLASS_CITY_PURSUIT_DURATION; t += 1000) drums.push(...noteEvent(t, 52, 68, 104, 8, "A"));
  for (let t = 0; t < GLASS_CITY_PURSUIT_DURATION; t += 250) drums.push(...noteEvent(t + 125, t % 1000 === 750 ? 60 : 56, 34, t % 1000 === 750 ? 86 : 64, t % 1000 === 750 ? 3 : 4, "A"));

  const bass: RecEvent[] = [
    bankEvent(0, "pad", "B"),
    ccEvent(0, 20, 42),
    ccEvent(3500, 20, 82),
    ccEvent(7000, 20, 50),
    ccEvent(10500, 20, 104),
  ];
  const bassNotes = [38, 38, 45, 43, 38, 50, 45, 36];
  for (let t = 0; t < GLASS_CITY_PURSUIT_DURATION; t += 500) {
    const step = Math.floor(t / 500) % bassNotes.length;
    bass.push(...noteEvent(t, bassNotes[step]!, step % 4 === 3 ? 300 : 190, 94 + (step === 5 ? 12 : 0), 12 + (step % 4), "B"));
  }

  const keys: RecEvent[] = [
    bankEvent(0, "knob", "C"),
    ccEvent(0, 20, 96),
    ccEvent(0, 21, 44),
    ccEvent(6600, 23, 92),
  ];
  const arps = [62, 65, 69, 74, 69, 65, 60, 65, 67, 72, 76, 79, 76, 72];
  arps.forEach((note, index) => keys.push(...noteEvent(2000 + index * 250, note, 110, 76 + (index % 4) * 5, index % 8, "C")));
  arps.forEach((note, index) => keys.push(...noteEvent(8500 + index * 187.5, note + (index % 5 === 0 ? 12 : 0), 90, 72 + (index % 6) * 5, index % 8, "C")));

  const pads: RecEvent[] = [
    bankEvent(0, "pad", "C"),
    ccEvent(0, 20, 48),
    ccEvent(0, 21, 116),
  ];
  [[57, 62, 65], [55, 60, 64], [52, 57, 62], [53, 57, 60]].forEach((chord, index) => {
    chord.forEach((note, chordIndex) => pads.push(...noteEvent(index * 3500 + chordIndex * 80, note, 3300, 68, chordIndex, "C")));
  });

  const lead: RecEvent[] = [
    bankEvent(0, "pad", "B"),
    ccEvent(0, 20, 88),
    ccEvent(0, 21, 56),
    ccEvent(9800, 20, 124),
  ];
  [[5000, 74], [5250, 76], [5500, 81], [6250, 79], [6500, 76], [6750, 74], [11000, 81], [11250, 84], [11500, 86], [12000, 88]].forEach(([t, note], index) => {
    lead.push(...noteEvent(t, note, index > 6 ? 180 : 220, 90 + (index % 3) * 8, 5 + (index % 4), "B"));
  });

  const fx: RecEvent[] = [
    bankEvent(0, "fader", "B"),
    ccEvent(0, 22, 82),
    ccEvent(0, 23, 58),
    ...noteEvent(0, 63, 1500, 74, 3, "C"),
    ...noteEvent(7000, 48, 650, 118, 12, "A"),
    ...noteEvent(12800, 63, 900, 96, 3, "C"),
  ];

  return [
    { id: PATTERN_TRACK_ID, name: "Recorded", muted: true, clips: [] },
    { id: "track-1", name: "Pursuit drums", muted: false, clips: [clip("glass-drums", "Tight chase grid", "drums-808", drums, 0, GLASS_CITY_PURSUIT_DURATION, GLASS_CITY_PURSUIT_TITLE)] },
    { id: "track-2", name: "Chrome bass", muted: false, clips: [clip("glass-bass", "Side-street pulse", "bass-reese", bass, 0, GLASS_CITY_PURSUIT_DURATION, GLASS_CITY_PURSUIT_TITLE)] },
    { id: "track-3", name: "Signal keys", muted: false, clips: [clip("glass-keys", "Glass-tower arps", "keys", keys, 0, GLASS_CITY_PURSUIT_DURATION, GLASS_CITY_PURSUIT_TITLE)] },
    { id: "track-4", name: "Hologram pads", muted: false, clips: [clip("glass-pads", "Wide pursuit chords", "pad-glass", pads, 0, GLASS_CITY_PURSUIT_DURATION, GLASS_CITY_PURSUIT_TITLE)] },
    { id: "track-5", name: "Rooftop lead", muted: false, clips: [clip("glass-lead", "Final turn melody", "lead-sync", lead, 0, GLASS_CITY_PURSUIT_DURATION, GLASS_CITY_PURSUIT_TITLE), clip("glass-fx", "Hard-light transitions", "fx-sweep", fx, 0, GLASS_CITY_PURSUIT_DURATION, GLASS_CITY_PURSUIT_TITLE)] },
  ];
}

function makeHouseBassTracks(): Track[] {
  const drums: RecEvent[] = [
    bankEvent(0, "pad", "A"),
    bankEvent(0, "knob", "A"),
    bankEvent(0, "fader", "A"),
    ccEvent(0, 20, 78),
    ccEvent(0, 21, 48),
    ccEvent(0, 22, 108),
    ccEvent(0, 23, 82),
    ccEvent(8000, 22, 118),
  ];
  for (let t = 0; t < HOUSE_BASS_DURATION; t += 500) drums.push(...noteEvent(t, 48, 80, 118, 12, "A"));
  for (let t = 1000; t < HOUSE_BASS_DURATION; t += 2000) drums.push(...noteEvent(t, 52, 72, 104, 8, "A"));
  for (let t = 0; t < HOUSE_BASS_DURATION; t += 250) drums.push(...noteEvent(t + 125, t % 2000 === 1500 ? 60 : 56, 34, t % 1000 === 500 ? 86 : 62, t % 2000 === 1500 ? 3 : 4, "A"));
  for (const t of [3750, 7750, 11750, 15750]) {
    for (let i = 0; i < 6; i++) drums.push(...noteEvent(t + i * 62.5, 56, 24, 58 + i * 7, 4, "A"));
  }

  const bass: RecEvent[] = [
    bankEvent(0, "pad", "B"),
    ccEvent(0, 20, 42),
    ccEvent(0, 21, 62),
    ccEvent(4000, 20, 72),
    ccEvent(8000, 20, 54),
    ccEvent(12000, 20, 100),
  ];
  const bassSteps = [
    [36, 0], [36, 375], [43, 750], [46, 1125],
    [36, 1500], [48, 1875], [46, 2250], [43, 2625],
    [34, 3000], [34, 3375], [41, 3750], [43, 4125],
    [36, 4500], [43, 4875], [46, 5250], [48, 5625],
  ] as const;
  for (let section = 0; section < 3; section++) {
    const offset = section * 5000;
    bassSteps.forEach(([note, t], index) => {
      if (offset + t >= HOUSE_BASS_DURATION) return;
      bass.push(...noteEvent(offset + t, note + (section === 2 && index % 7 === 0 ? 12 : 0), index % 4 === 0 ? 190 : 145, 98 + (index % 5) * 4, 12 + (index % 4), "B"));
    });
  }
  for (let i = 0; i < 12; i++) bass.push(...noteEvent(14000 + i * 125, i % 4 === 0 ? 48 : i % 4 === 1 ? 46 : i % 4 === 2 ? 43 : 36, 82, 86 + i * 3, 15, "B"));

  const chords: RecEvent[] = [
    bankEvent(0, "pad", "C"),
    ccEvent(0, 20, 88),
    ccEvent(0, 21, 50),
    ccEvent(7200, 23, 108),
  ];
  const houseChords = [
    [60, 64, 67],
    [58, 62, 65],
    [55, 60, 64],
    [57, 60, 65],
  ];
  for (let bar = 0; bar < 8; bar++) {
    const chord = houseChords[bar % houseChords.length]!;
    [250, 750, 1250, 1750].forEach((hitOffset, hitIndex) => {
      chord.forEach((note, chordIndex) => chords.push(...noteEvent(bar * 2000 + hitOffset + chordIndex * 18, note, hitIndex === 3 ? 220 : 150, 72 + hitIndex * 5, chordIndex, "C")));
    });
  }

  const hook: RecEvent[] = [
    bankEvent(0, "pad", "B"),
    ccEvent(0, 20, 96),
    ccEvent(0, 21, 44),
    ccEvent(10000, 20, 122),
  ];
  const hookNotes = [
    [4200, 72], [4450, 74], [4700, 76], [5200, 79],
    [8200, 76], [8450, 74], [8700, 72], [9200, 67],
    [12200, 72], [12450, 76], [12700, 79], [13200, 84],
  ] as const;
  hookNotes.forEach(([t, note], index) => hook.push(...noteEvent(t, note, index % 4 === 3 ? 260 : 140, 78 + (index % 4) * 8, 5 + (index % 4), "B")));

  const fx: RecEvent[] = [
    bankEvent(0, "fader", "B"),
    ccEvent(0, 22, 92),
    ccEvent(0, 23, 64),
    ...noteEvent(0, 63, 1200, 70, 3, "C"),
    ...noteEvent(7800, 63, 1100, 86, 3, "C"),
    ...noteEvent(15000, 48, 620, 112, 12, "A"),
  ];

  return [
    { id: PATTERN_TRACK_ID, name: "Recorded", muted: true, clips: [] },
    { id: "track-1", name: "House kit", muted: false, clips: [clip("house-drums", "Four-on-floor pocket", "drums", drums, 0, HOUSE_BASS_DURATION, HOUSE_BASS_TITLE)] },
    { id: "track-2", name: "Main bass", muted: false, clips: [clip("house-bass", "Original rolling bassline", "bass-acid", bass, 0, HOUSE_BASS_DURATION, HOUSE_BASS_TITLE)] },
    { id: "track-3", name: "Piano stabs", muted: false, clips: [clip("house-chords", "Offbeat chord chops", "keys-piano", chords, 0, HOUSE_BASS_DURATION, HOUSE_BASS_TITLE)] },
    { id: "track-4", name: "Roof hook", muted: false, clips: [clip("house-hook", "Late-night lead hook", "lead-soft", hook, 0, HOUSE_BASS_DURATION, HOUSE_BASS_TITLE)] },
    { id: "track-5", name: "Club air", muted: false, clips: [clip("house-fx", "Filter sweeps and hit", "fx-sweep", fx, 0, HOUSE_BASS_DURATION, HOUSE_BASS_TITLE)] },
  ];
}

function makeMidnightTrapTracks(): Track[] {
  const drums: RecEvent[] = [
    bankEvent(0, "pad", "A"),
    bankEvent(0, "knob", "A"),
    bankEvent(0, "fader", "A"),
    ccEvent(0, 20, 92),
    ccEvent(0, 21, 42),
    ccEvent(0, 22, 112),
    ccEvent(0, 23, 86),
    ccEvent(7900, 22, 92),
    ccEvent(8200, 22, 118),
  ];
  for (let t = 0; t < MIDNIGHT_TRAP_DURATION; t += 1000) drums.push(...noteEvent(t, 48, 90, 122, 12, "A"));
  [750, 1500, 2750, 4000, 5750, 7000, 8750, 9500, 10750, 12000, 13750, 15000].forEach((t, index) => {
    drums.push(...noteEvent(t, index % 3 === 0 ? 49 : 48, 82, 108, 13, "A"));
  });
  for (let t = 1000; t < MIDNIGHT_TRAP_DURATION; t += 2000) drums.push(...noteEvent(t, 52, 82, 116, 8, "A"));
  for (let t = 0; t < MIDNIGHT_TRAP_DURATION; t += 250) drums.push(...noteEvent(t + 62, 56, 28, t % 1000 === 0 ? 86 : 58, 4, "A"));
  for (const roll of [3500, 7500, 11500, 15500]) {
    for (let i = 0; i < 12; i++) drums.push(...noteEvent(roll + i * 41.7, i % 4 === 0 ? 60 : 56, 20, 48 + i * 5, i % 4 === 0 ? 3 : 4, "A"));
  }

  const sub: RecEvent[] = [
    bankEvent(0, "pad", "B"),
    ccEvent(0, 20, 34),
    ccEvent(0, 21, 82),
    ccEvent(6000, 20, 58),
    ccEvent(12000, 20, 40),
  ];
  const subLine = [
    [0, 36, 460], [750, 36, 210], [1500, 43, 360], [2250, 34, 260],
    [3000, 36, 460], [4000, 31, 380], [5000, 34, 280], [5750, 43, 430],
  ] as const;
  for (let section = 0; section < 2; section++) {
    const offset = section * 8000;
    subLine.forEach(([t, note, dur], index) => sub.push(...noteEvent(offset + t, note + (section === 1 && index === 7 ? 12 : 0), dur, 110, 12 + (index % 4), "B")));
  }
  for (let i = 0; i < 8; i++) sub.push(...noteEvent(14000 + i * 187.5, i % 2 === 0 ? 36 : 43, 120, 92 + i * 4, 15, "B"));

  const bells: RecEvent[] = [
    bankEvent(0, "pad", "C"),
    ccEvent(0, 20, 108),
    ccEvent(0, 21, 74),
    ccEvent(8000, 20, 76),
  ];
  const bellNotes = [72, 75, 79, 82, 79, 75, 70, 75];
  for (let bar = 0; bar < 8; bar++) {
    bellNotes.forEach((note, index) => {
      if (index % 2 === 1 && bar < 2) return;
      bells.push(...noteEvent(bar * 2000 + index * 250, note + (bar >= 4 && index === 3 ? 12 : 0), 130, 62 + (index % 4) * 8, index % 8, "C"));
    });
  }

  const pads: RecEvent[] = [
    bankEvent(0, "pad", "C"),
    ccEvent(0, 20, 44),
    ccEvent(0, 21, 118),
  ];
  [[55, 58, 62], [53, 56, 60], [51, 55, 58], [50, 53, 58]].forEach((chord, index) => {
    chord.forEach((note, chordIndex) => pads.push(...noteEvent(index * 4000 + chordIndex * 90, note, 3600, 58, chordIndex, "C")));
  });

  const lead: RecEvent[] = [
    bankEvent(0, "pad", "B"),
    ccEvent(0, 20, 86),
    ccEvent(0, 21, 48),
    ccEvent(9800, 20, 118),
  ];
  const leadNotes = [
    [4500, 79], [4750, 82], [5000, 84], [5750, 82],
    [8500, 75], [8750, 79], [9000, 82], [9750, 79],
    [12500, 82], [12750, 84], [13000, 87], [13750, 91],
  ] as const;
  leadNotes.forEach(([t, note], index) => lead.push(...noteEvent(t, note, index % 4 === 3 ? 260 : 150, 76 + (index % 4) * 8, 5 + (index % 4), "B")));

  const fx: RecEvent[] = [
    bankEvent(0, "fader", "B"),
    ccEvent(0, 22, 96),
    ccEvent(0, 23, 70),
    ...noteEvent(0, 63, 1200, 72, 3, "C"),
    ...noteEvent(7800, 48, 640, 118, 12, "A"),
    ...noteEvent(11800, 71, 180, 92, 6, "C"),
    ...noteEvent(12250, 74, 160, 88, 7, "C"),
    ...noteEvent(15000, 63, 900, 96, 3, "C"),
  ];

  return [
    { id: PATTERN_TRACK_ID, name: "Recorded", muted: true, clips: [] },
    { id: "track-1", name: "Trap drums", muted: false, clips: [clip("trap-drums", "Snare pocket and hat rolls", "drums-808", drums, 0, MIDNIGHT_TRAP_DURATION, MIDNIGHT_TRAP_TITLE)] },
    { id: "track-2", name: "808 sub", muted: false, clips: [clip("trap-sub", "Sliding midnight 808", "bass-fm", sub, 0, MIDNIGHT_TRAP_DURATION, MIDNIGHT_TRAP_TITLE)] },
    { id: "track-3", name: "Glass bells", muted: false, clips: [clip("trap-bells", "Minor bell motif", "keys", bells, 0, MIDNIGHT_TRAP_DURATION, MIDNIGHT_TRAP_TITLE)] },
    { id: "track-4", name: "Smoke pad", muted: false, clips: [clip("trap-pads", "Dark suspended pad", "pad-choir", pads, 0, MIDNIGHT_TRAP_DURATION, MIDNIGHT_TRAP_TITLE)] },
    { id: "track-5", name: "Hook and drops", muted: false, clips: [clip("trap-lead", "Sparse neon hook", "lead-chip", lead, 0, MIDNIGHT_TRAP_DURATION, MIDNIGHT_TRAP_TITLE), clip("trap-fx", "Drops and risers", "fx-zap", fx, 0, MIDNIGHT_TRAP_DURATION, MIDNIGHT_TRAP_TITLE)] },
  ];
}

const ORIGINAL_SESSIONS = [
  { id: "night-drive", label: "Night Drive", title: CYBERPUNK_NIGHT_DRIVE_TITLE, makeTracks: makeCyberpunkNightDriveTracks, selectedSound: "lead-saw" },
  { id: "thunder", label: "Thunder", title: THUNDER_FORGE_TITLE, makeTracks: makeThunderForgeTracks, selectedSound: "drums" },
  { id: "pursuit", label: "Pursuit", title: GLASS_CITY_PURSUIT_TITLE, makeTracks: makeGlassCityPursuitTracks, selectedSound: "lead-sync" },
  { id: "house-bass", label: "House Bass", title: HOUSE_BASS_TITLE, makeTracks: makeHouseBassTracks, selectedSound: "bass-acid" },
  { id: "midnight-trap", label: "Midnight Trap", title: MIDNIGHT_TRAP_TITLE, makeTracks: makeMidnightTrapTracks, selectedSound: "bass-fm" },
] satisfies Array<{
  id: string;
  label: string;
  title: string;
  makeTracks: () => Track[];
  selectedSound: SoundId;
}>;

export { ORIGINAL_SESSIONS };
