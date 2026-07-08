"use client";

import { useAtom } from "jotai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRightLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Circle,
  ClipboardPaste,
  Copy,
  Download,
  Grid3X3,
  Heart,
  HelpCircle,
  Library,
  Maximize2,
  Music2,
  Play,
  Plus,
  Repeat,
  Rows3,
  Square,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { playNote, resumeAudio, setKnobCutoff, setKnobDecay, setMasterVolume, setSound, SOUND_GROUPS, SOUNDS, type SoundId } from "@/lib/audio";
import { cn } from "@/lib/cn";

import CtrlButton from "../CtrlButton";
import Fader from "../Fader";
import HelpModal from "../HelpModal";
import Knob from "../Knob";
import Pad from "../Pad";

import {
  currentSoundAtom,
  activeSceneAtom,
  faderBankAtom,
  faderPagesAtom,
  fadersAtom,
  fullLevelAtom,
  knobBankAtom,
  knobPagesAtom,
  knobsAtom,
  noteRepeatAtom,
  padBankAtom,
  sceneAAtom,
  sceneBAtom,
  selectedPresetIdAtom,
  shiftAtom,
  type Bank,
  type Scene,
} from "./atoms";
import {
  BANK_OFFSET,
  BANK_ORDER,
  KEY_MAP,
  PADS,
  PATTERN_TRACK_ID,
  SOUND_GROUP_ICON,
  TIMELINE_DROP_TAIL_MS,
  TIMELINE_PX_PER_SECOND,
  TRACK_IDS,
} from "./constants";
import { useRecorder } from "./hooks/useRecorder";
import { PRESETS, PRESET_GROUPS } from "./presets";
import { ORIGINAL_SESSIONS } from "./sessions";
import { CLIP_SELECTED_CLASS, PAD_BANK_TEXT_CLASS, TRACK_SELECTED_CLASS, TRACK_SELECTED_LABEL_CLASS } from "./styles";
import type { ArrangedEvent, MultitrackSession, PatternClip, PatternSource, RecEvent, RecEventInput, Track } from "./types";
import {
  appendClipToTrack,
  cloneClip,
  createClipId,
  downloadJSON,
  formatDuration,
  getArrangedEventsFromTracks,
  getNeutralMultitrackPadIndex,
  getPadColor,
  getPadLabel,
  getPatternDuration,
  getPlayableArrangementEndMs,
  getRecordedSoundAt,
  getTrackEndMs,
  hasNoteEvents,
  makeTracks,
  normalizeEvents,
  parseMultitrackSession,
  placeClipInTrack,
  removeClipFromTrack,
  timelinePx,
} from "./utils";
import { ArrangementWaveform, PatternWaveform } from "./Waveform";

export default function PabPad() {
  const [pressed, setPressed] = useState<Set<number>>(new Set());
  const [activeColor, setActiveColor] = useState<string | null>(null);
  const [hoverColor, setHoverColor] = useState<string | null>(null);
  const activeFadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [padBank, setPadBank] = useAtom(padBankAtom);
  const [knobBank, setKnobBank] = useAtom(knobBankAtom);
  const [faderBank, setFaderBank] = useAtom(faderBankAtom);
  const [fullLevel, setFullLevel] = useAtom(fullLevelAtom);
  const [shift, setShift] = useAtom(shiftAtom);
  const [noteRepeat, setNoteRepeat] = useAtom(noteRepeatAtom);
  const [knobs, setKnobs] = useAtom(knobsAtom);
  const [knobPages, setKnobPages] = useAtom(knobPagesAtom);
  const [faders, setFaders] = useAtom(fadersAtom);
  const [faderPages, setFaderPages] = useAtom(faderPagesAtom);
  const [currentSound, setCurrentSound] = useAtom(currentSoundAtom);
  const [selectedPresetId, setSelectedPresetId] = useAtom(selectedPresetIdAtom);
  const [sceneA, setSceneA] = useAtom(sceneAAtom);
  const [sceneB, setSceneB] = useAtom(sceneBAtom);
  const [activeScene, setActiveScene] = useAtom(activeSceneAtom);
  const [helpOpen, setHelpOpen] = useState(false);
  const [presetMenuOpen, setPresetMenuOpen] = useState(false);
  const [soundMenuOpen, setSoundMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const presetMenuRef = useRef<HTMLDivElement | null>(null);
  const soundMenuRef = useRef<HTMLDivElement | null>(null);
  const arrangementTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const arrangementEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const arrangementFrameRef = useRef<number | null>(null);
  const arrangementLoopRef = useRef(false);
  const arrangementDurationRef = useRef(0);
  const arrangementPlayheadRef = useRef(0);
  const showTrackEditorRef = useRef(false);
  const onPlayRef = useRef<() => void>(() => undefined);
  // Latest playArrangement, read from the loop-restart timer to avoid a
  // self-reference inside its own useCallback.
  const playArrangementRef = useRef<(sourceTracks?: Track[], opts?: { jamMode?: boolean; keepRecorderPlayback?: boolean }) => Promise<void>>(async () => undefined);
  const [tracks, setTracks] = useState<Track[]>(makeTracks);
  const [selectedTrackId, setSelectedTrackId] = useState(PATTERN_TRACK_ID);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [clipboardClip, setClipboardClip] = useState<PatternClip | null>(null);
  const [showTrackEditor, setShowTrackEditor] = useState(false);
  const [arrangementPlaying, setArrangementPlaying] = useState(false);
  const [backingTracksMode, setBackingTracksMode] = useState(false);
  const [arrangementPlayheadMs, setArrangementPlayheadMs] = useState(0);
  const [recordedPatternPending, setRecordedPatternPending] = useState(false);

  const offset = useMemo(() => BANK_OFFSET[padBank], [padBank]);
  const padBankColor = getPadColor(0, padBank);
  const currentSoundDef = useMemo(
    () => SOUNDS.find((sound) => sound.id === currentSound),
    [currentSound]
  );
  const selectedPreset = useMemo(
    () => PRESETS.find((preset) => preset.id === selectedPresetId),
    [selectedPresetId]
  );
  const soundGroups = useMemo(
    () => SOUND_GROUPS.map((group) => ({
      group,
      sounds: SOUNDS.filter((sound) => sound.group === group.id),
    })).filter((section) => section.sounds.length > 0),
    []
  );
  const selectedTrack = useMemo(
    () => tracks.find((track) => track.id === selectedTrackId) ?? tracks[0],
    [tracks, selectedTrackId]
  );
  const trackClipCount = useMemo(
    () => tracks.reduce((total, track) => total + track.clips.length, 0),
    [tracks]
  );
  const playableTrackClipCount = useMemo(
    () => tracks.reduce((total, track) => total + (track.muted ? 0 : track.clips.length), 0),
    [tracks]
  );
  const arrangementDuration = useMemo(
    () => tracks.reduce((max, track) => Math.max(max, getTrackEndMs(track)), 0),
    [tracks]
  );
  const arrangementTimelineWidth = useMemo(
    () => Math.max(320, timelinePx(arrangementDuration + TIMELINE_DROP_TAIL_MS)),
    [arrangementDuration]
  );
  const editorVisible = showTrackEditor;

  useEffect(() => {
    showTrackEditorRef.current = showTrackEditor;
  }, [showTrackEditor]);

  // Hydrate K1/K2 from the persisted active knob-bank page on first mount,
  // BEFORE the knobs effect would otherwise overwrite the page with defaults.
  const knobsHydratedRef = useRef(false);
  useEffect(() => {
    if (knobsHydratedRef.current) return;
    knobsHydratedRef.current = true;
    const page = knobPages[knobBank];
    if (page[0] !== knobs[0] || page[1] !== knobs[1]) setKnobs([page[0], page[1]]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Same hydration trick for F1/F2 against the persisted fader-bank page.
  const fadersHydratedRef = useRef(false);
  useEffect(() => {
    if (fadersHydratedRef.current) return;
    fadersHydratedRef.current = true;
    const page = faderPages[faderBank];
    if (page[0] !== faders[0] || page[1] !== faders[1]) setFaders([page[0], page[1]]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Latch the panel color to the latest active pad; fade back to neutral on release.
  const lightUp = useCallback((color: string, fadeMs = 320) => {
    if (activeFadeTimer.current) {
      clearTimeout(activeFadeTimer.current);
      activeFadeTimer.current = null;
    }
    setActiveColor(color);
    activeFadeTimer.current = setTimeout(() => {
      setActiveColor(null);
      activeFadeTimer.current = null;
    }, fadeMs);
  }, []);

  // Flash a pad briefly during playback
  const flashTimer = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  // Per-pad retrigger intervals used by NOTE REPEAT.
  const repeatTimersRef = useRef<Map<number, ReturnType<typeof setInterval>>>(new Map());
  // 16th notes at 120 BPM = 125 ms between retriggers.
  const NOTE_REPEAT_MS = 125;
  const flashPad = useCallback((idx: number, ms = 150, bank: Bank = padBank) => {
    setPressed((s) => new Set(s).add(idx));
    const pad = PADS[idx];
    if (pad) lightUp(getPadColor(idx, bank), ms + 120);
    const existing = flashTimer.current.get(idx);
    if (existing) clearTimeout(existing);
    const id = setTimeout(() => {
      setPressed((s) => {
        const n = new Set(s);
        n.delete(idx);
        return n;
      });
      flashTimer.current.delete(idx);
    }, ms);
    flashTimer.current.set(idx, id);
  }, [lightUp, padBank]);
  const recorderEventsForPlaybackRef = useRef<RecEvent[]>([]);

  const resetPadFlashes = useCallback(() => {
    flashTimer.current.forEach(clearTimeout);
    flashTimer.current.clear();
    setPressed(new Set());
  }, []);

  const playRecordedEvent = useCallback((ev: RecEvent, soundOverride?: SoundId, opts?: { reflectControls?: boolean; reflectPadBank?: boolean; visualPadIndex?: number; applyControls?: boolean }) => {
    const reflectControls = opts?.reflectControls ?? true;
    const reflectPadBank = opts?.reflectPadBank ?? true;
    const applyControls = opts?.applyControls ?? !backingTracksMode;
    if (ev.type === "noteon") {
      if (reflectPadBank) setPadBank(ev.bankAtRec);
      playNote(ev.note, ev.vel / 127, 280, soundOverride);
      if (typeof opts?.visualPadIndex === "number") flashPad(opts.visualPadIndex, 150, padBank);
      else if (reflectPadBank) flashPad(ev.padIndex, 150, ev.bankAtRec);
    } else if (ev.type === "noteoff") {
      if (reflectPadBank) setPadBank(ev.bankAtRec);
    } else if (ev.type === "cc") {
      // Honour macros during playback so presets can ride them, AND mirror
      // the value into the visible K1/K2/F1/F2 atoms so the UI animates.
      if (ev.cc === 20) {
        if (applyControls) setKnobCutoff(ev.value);
        if (reflectControls) setKnobs((k) => [ev.value, k[1]]);
      } else if (ev.cc === 21) {
        if (applyControls) setKnobDecay(ev.value);
        if (reflectControls) setKnobs((k) => [k[0], ev.value]);
      } else if (ev.cc === 22) {
        if (applyControls) setMasterVolume(ev.value / 127);
        if (reflectControls) setFaders((f) => [ev.value, f[1]]);
      } else if (ev.cc === 23) {
        if (reflectControls) setFaders((f) => [f[0], ev.value]);
      }
    } else if (ev.type === "bank") {
      if (ev.target === "pad") {
        if (reflectPadBank) setPadBank(ev.bank);
      }
      else if (ev.target === "knob") {
        if (reflectControls) setKnobBank(ev.bank);
      }
      else if (ev.target === "fader") {
        if (reflectControls) setFaderBank(ev.bank);
      }
    } else if (ev.type === "sound") {
      if (reflectControls) {
        setCurrentSound(ev.id);
        setSound(ev.id);
      }
    }
  }, [backingTracksMode, flashPad, padBank, setCurrentSound, setFaders, setFaderBank, setKnobBank, setKnobs, setPadBank]);

  const rec = useRecorder({
    onPlay: (ev) => playRecordedEvent(
      ev,
      backingTracksMode && ev.type === "noteon"
        ? getRecordedSoundAt(recorderEventsForPlaybackRef.current, ev.t, currentSound)
        : undefined,
      backingTracksMode ? {
        reflectControls: false,
        reflectPadBank: false,
        visualPadIndex: getNeutralMultitrackPadIndex(ev),
        applyControls: false,
      } : undefined
    ),
  });
  useEffect(() => {
    recorderEventsForPlaybackRef.current = rec.getEvents();
  }, [rec, rec.count]);
  const hasCurrentRecording = recordedPatternPending && rec.count > 0;
  const backingPlaybackPadIndexes = useMemo(() => {
    const indexes = new Set<number>();
    const collect = (events: RecEvent[]) => {
      for (const event of events) {
        const index = getNeutralMultitrackPadIndex(event);
        if (typeof index === "number") indexes.add(index);
      }
    };

    for (const track of tracks) {
      if (track.muted) continue;
      for (const clip of track.clips) collect(clip.events);
    }
    if (hasCurrentRecording) collect(rec.getEvents());
    return indexes;
  }, [hasCurrentRecording, rec, tracks]);
  const playingCurrentRecording = rec.playing && !editorVisible;
  const backingTracksPlaying = backingTracksMode && arrangementPlaying;
  const compactEditorControls = editorVisible && (trackClipCount > 0 || hasCurrentRecording);
  const compactPadControls = trackClipCount > 0 && !hasCurrentRecording && (!rec.playing || !recordedPatternPending);
  const compactArrangementControls = !rec.recording && !playingCurrentRecording && (compactEditorControls || (!backingTracksMode && compactPadControls));
  const neutralMultitrackPads = trackClipCount > 0 && !backingTracksMode && !editorVisible && !rec.recording && !hasCurrentRecording && !playingCurrentRecording;

  const triggerOn = useCallback(
    (visualIndex: number) => {
      const pad = PADS[visualIndex];
      if (!pad) return;
      const padColor = getPadColor(visualIndex, padBank);
      const note = pad.note + offset;
      const vel = fullLevel ? 127 : Math.round((faders[1] / 127) * 90) + 30;
      resumeAudio();
      playNote(note, vel / 127, 280, currentSound);
      rec.push({ type: "noteon", note, vel, padIndex: visualIndex, bankAtRec: padBank } as RecEventInput);
      setPressed((s) => new Set(s).add(visualIndex));
      // Light the panel with this pad's strong color while it's held.
      if (activeFadeTimer.current) {
        clearTimeout(activeFadeTimer.current);
        activeFadeTimer.current = null;
      }
      setActiveColor(padColor);
      // NOTE REPEAT: while held, retrigger this pad at a fixed rate. The audio
      // and record stream are re-fired; the visual "pressed" state stays
      // latched (held) so we don't fight with flashPad.
      if (noteRepeat) {
        const existing = repeatTimersRef.current.get(visualIndex);
        if (existing) clearInterval(existing);
        const id = setInterval(() => {
          playNote(note, vel / 127, 280, currentSound);
          rec.push({ type: "noteon", note, vel, padIndex: visualIndex, bankAtRec: padBank } as RecEventInput);
        }, NOTE_REPEAT_MS);
        repeatTimersRef.current.set(visualIndex, id);
      }
    },
    [currentSound, fullLevel, faders, offset, padBank, rec, noteRepeat]
  );

  const triggerOff = useCallback(
    (visualIndex: number) => {
      const pad = PADS[visualIndex];
      if (!pad) return;
      const padColor = getPadColor(visualIndex, padBank);
      const note = pad.note + offset;
      rec.push({ type: "noteoff", note, padIndex: visualIndex, bankAtRec: padBank } as RecEventInput);
      // Stop any NOTE REPEAT interval for this pad.
      const rid = repeatTimersRef.current.get(visualIndex);
      if (rid) {
        clearInterval(rid);
        repeatTimersRef.current.delete(visualIndex);
      }
      setPressed((s) => {
        if (!s.has(visualIndex)) return s;
        const n = new Set(s);
        n.delete(visualIndex);
        // If nothing else is held, schedule a fade-out of the panel color.
        if (n.size === 0) lightUp(padColor, 320);
        return n;
      });
    },
    [offset, padBank, rec, lightUp]
  );

  // If NOTE REPEAT is toggled OFF while pads are still held, stop the
  // retriggers immediately (the pads themselves keep latched until release).
  useEffect(() => {
    if (noteRepeat) return;
    repeatTimersRef.current.forEach((id) => clearInterval(id));
    repeatTimersRef.current.clear();
  }, [noteRepeat]);

  // Keyboard handling
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const k = e.key.toLowerCase();
      if (k === " ") {
        e.preventDefault();
        onPlayRef.current();
        return;
      }
      if (k === "shift") setShift(true);
      const idx = KEY_MAP[k];
      if (idx !== undefined) triggerOn(idx);
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "shift") setShift(false);
      const idx = KEY_MAP[k];
      if (idx !== undefined) triggerOff(idx);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [triggerOn, triggerOff, setShift]);

  // Knob/Fader CC mapping + record
  useEffect(() => {
    // K1 -> filter cutoff macro, K2 -> decay/release macro.
    setKnobCutoff(knobs[0]);
    setKnobDecay(knobs[1]);
    // Persist live K1/K2 edits into the active knob bank slot (after hydration).
    if (knobsHydratedRef.current) {
      setKnobPages((p) => ({ ...p, [knobBank]: [knobs[0], knobs[1]] }));
    }
    rec.push({ type: "cc", cc: 20, value: knobs[0] } as RecEventInput);
    rec.push({ type: "cc", cc: 21, value: knobs[1] } as RecEventInput);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [knobs]);
  useEffect(() => {
    // F1 controls local preview volume
    setMasterVolume(faders[0] / 127);
    // Persist live F1/F2 edits into the active fader bank slot (after hydration).
    if (fadersHydratedRef.current) {
      setFaderPages((p) => ({ ...p, [faderBank]: [faders[0], faders[1]] }));
    }
    rec.push({ type: "cc", cc: 22, value: faders[0] } as RecEventInput);
    rec.push({ type: "cc", cc: 23, value: faders[1] } as RecEventInput);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faders]);

  const applyLivePerformanceControls = useCallback(() => {
    setMasterVolume(faders[0] / 127);
    setKnobCutoff(knobs[0]);
    setKnobDecay(knobs[1]);
  }, [faders, knobs]);

  const nextBank = useCallback(() => {
    setPadBank(BANK_ORDER[(BANK_ORDER.indexOf(padBank) + 1) % BANK_ORDER.length]!);
  }, [padBank, setPadBank]);

  const prevBank = useCallback(() => {
    setPadBank(BANK_ORDER[(BANK_ORDER.indexOf(padBank) + BANK_ORDER.length - 1) % BANK_ORDER.length]!);
  }, [padBank, setPadBank]);

  const nextKnobBank = useCallback(() => {
    const next = BANK_ORDER[(BANK_ORDER.indexOf(knobBank) + 1) % BANK_ORDER.length]!;
    // Snapshot the live K1/K2 into the outgoing slot, then recall the next slot.
    setKnobPages((p) => ({ ...p, [knobBank]: [knobs[0], knobs[1]] }));
    const target = knobPages[next];
    setKnobs([target[0], target[1]]);
    setKnobBank(next);
    rec.push({ type: "bank", target: "knob", bank: next } as RecEventInput);
  }, [knobBank, knobs, knobPages, rec, setKnobs, setKnobPages, setKnobBank]);

  const prevKnobBank = useCallback(() => {
    const prev = BANK_ORDER[(BANK_ORDER.indexOf(knobBank) + BANK_ORDER.length - 1) % BANK_ORDER.length]!;
    setKnobPages((p) => ({ ...p, [knobBank]: [knobs[0], knobs[1]] }));
    const target = knobPages[prev];
    setKnobs([target[0], target[1]]);
    setKnobBank(prev);
    rec.push({ type: "bank", target: "knob", bank: prev } as RecEventInput);
  }, [knobBank, knobs, knobPages, rec, setKnobs, setKnobPages, setKnobBank]);

  const nextFaderBank = useCallback(() => {
    const next = BANK_ORDER[(BANK_ORDER.indexOf(faderBank) + 1) % BANK_ORDER.length]!;
    // Snapshot the live F1/F2 into the outgoing slot, then recall the next slot.
    setFaderPages((p) => ({ ...p, [faderBank]: [faders[0], faders[1]] }));
    const target = faderPages[next];
    setFaders([target[0], target[1]]);
    setFaderBank(next);
    rec.push({ type: "bank", target: "fader", bank: next } as RecEventInput);
  }, [faderBank, faders, faderPages, rec, setFaders, setFaderPages, setFaderBank]);

  const prevFaderBank = useCallback(() => {
    const prev = BANK_ORDER[(BANK_ORDER.indexOf(faderBank) + BANK_ORDER.length - 1) % BANK_ORDER.length]!;
    setFaderPages((p) => ({ ...p, [faderBank]: [faders[0], faders[1]] }));
    const target = faderPages[prev];
    setFaders([target[0], target[1]]);
    setFaderBank(prev);
    rec.push({ type: "bank", target: "fader", bank: prev } as RecEventInput);
  }, [faderBank, faders, faderPages, rec, setFaders, setFaderPages, setFaderBank]);

  // ----- A / B scene snapshots -----
  const captureScene = useCallback(
    (): Scene => ({
      knobs: [knobs[0], knobs[1]],
      faders: [faders[0], faders[1]],
      sound: currentSound,
      padBank,
      knobBank,
      faderBank,
    }),
    [knobs, faders, currentSound, padBank, knobBank, faderBank]
  );
  const onSceneClick = useCallback(
    (slot: "A" | "B") => {
      const stored = slot === "A" ? sceneA : sceneB;
      // SHIFT (button or held key) stores; otherwise recall (capture if empty).
      if (shift || !stored) {
        const snap = captureScene();
        (slot === "A" ? setSceneA : setSceneB)(snap);
        setActiveScene(slot);
        toast.success(`Scene ${slot} stored`);
        return;
      }
      setKnobs(stored.knobs);
      setFaders(stored.faders);
      setCurrentSound(stored.sound);
      setPadBank(stored.padBank);
      setKnobBank(stored.knobBank);
      setFaderBank(stored.faderBank);
      setActiveScene(slot);
      toast.success(`Scene ${slot} recalled`);
    },
    [
      shift,
      sceneA,
      sceneB,
      captureScene,
      setSceneA,
      setSceneB,
      setKnobs,
      setFaders,
      setCurrentSound,
      setPadBank,
      setKnobBank,
      setFaderBank,
      setActiveScene,
    ]
  );
  const onSceneClear = useCallback(
    (slot: "A" | "B") => {
      (slot === "A" ? setSceneA : setSceneB)(null);
      if (activeScene === slot) setActiveScene(null);
      toast.success(`Scene ${slot} cleared`);
    },
    [setSceneA, setSceneB, activeScene, setActiveScene]
  );

  const startLocalRecording = useCallback(() => {
    setRecordedPatternPending(false);
    rec.startRecording([
      { type: "sound", id: currentSound },
      { type: "bank", target: "pad", bank: padBank },
      { type: "bank", target: "knob", bank: knobBank },
      { type: "bank", target: "fader", bank: faderBank },
      { type: "cc", cc: 20, value: knobs[0] },
      { type: "cc", cc: 21, value: knobs[1] },
      { type: "cc", cc: 22, value: faders[0] },
      { type: "cc", cc: 23, value: faders[1] },
    ]);
  }, [currentSound, faderBank, faders, knobBank, knobs, padBank, rec]);

  const clearLocalRecording = useCallback(() => {
    rec.clear();
    setRecordedPatternPending(false);
  }, [rec]);

  useEffect(() => {
    arrangementLoopRef.current = rec.loop;
  }, [rec.loop]);

  const stopArrangementTimers = useCallback(() => {
    arrangementTimersRef.current.forEach(clearTimeout);
    arrangementTimersRef.current = [];
    if (arrangementEndTimerRef.current) clearTimeout(arrangementEndTimerRef.current);
    arrangementEndTimerRef.current = null;
    if (arrangementFrameRef.current !== null) cancelAnimationFrame(arrangementFrameRef.current);
    arrangementFrameRef.current = null;
  }, []);

  const stopArrangement = useCallback((opts?: { keepBackingTracksMode?: boolean }) => {
    stopArrangementTimers();
    setArrangementPlaying(false);
    if (!opts?.keepBackingTracksMode) setBackingTracksMode(false);
    arrangementDurationRef.current = 0;
    arrangementPlayheadRef.current = 0;
    setArrangementPlayheadMs(0);
  }, [stopArrangementTimers]);

  const clearRecording = useCallback(() => {
    clearLocalRecording();
  }, [clearLocalRecording]);

  const startPlayhead = useCallback((duration: number) => {
    if (arrangementFrameRef.current !== null) cancelAnimationFrame(arrangementFrameRef.current);
    const startedAt = performance.now();
    arrangementDurationRef.current = duration;
    arrangementPlayheadRef.current = 0;
    setArrangementPlayheadMs(0);
    const tick = () => {
      const elapsed = Math.min(arrangementDurationRef.current, performance.now() - startedAt);
      arrangementPlayheadRef.current = elapsed;
      setArrangementPlayheadMs(elapsed);
      if (elapsed < arrangementDurationRef.current) {
        arrangementFrameRef.current = requestAnimationFrame(tick);
      } else {
        arrangementFrameRef.current = null;
      }
    };
    arrangementFrameRef.current = requestAnimationFrame(tick);
  }, []);

  const playArrangement = useCallback(async (sourceTracks = tracks, opts?: { jamMode?: boolean; keepRecorderPlayback?: boolean }) => {
    const { events, duration } = getArrangedEventsFromTracks(sourceTracks);
    if (!events.length) {
      toast("Move a clip from Recorded to Track 1-5 to hear it.");
      return;
    }
    if (rec.recording) rec.stopRecording();
    if (!opts?.keepRecorderPlayback) rec.stop();
    stopArrangementTimers();
    await resumeAudio();
    if (opts?.jamMode) applyLivePerformanceControls();
    setArrangementPlaying(true);
    startPlayhead(duration);
    events.forEach((ev) => {
      const reflectPlaybackUi = !opts?.jamMode && showTrackEditorRef.current;
      const id = setTimeout(
        () => playRecordedEvent(ev, ev.sound, {
          reflectControls: reflectPlaybackUi,
          reflectPadBank: reflectPlaybackUi,
          visualPadIndex: opts?.jamMode
            ? getNeutralMultitrackPadIndex(ev)
            : reflectPlaybackUi ? undefined : getNeutralMultitrackPadIndex(ev),
          applyControls: !opts?.jamMode,
        }),
        ev.t
      );
      arrangementTimersRef.current.push(id);
    });
    arrangementEndTimerRef.current = setTimeout(() => {
      stopArrangementTimers();
      if (arrangementLoopRef.current) {
        void playArrangementRef.current(sourceTracks, opts);
      } else {
        setArrangementPlaying(false);
        arrangementDurationRef.current = 0;
        arrangementPlayheadRef.current = 0;
        setArrangementPlayheadMs(0);
      }
    }, duration + 120);
  }, [applyLivePerformanceControls, playRecordedEvent, rec, startPlayhead, stopArrangementTimers, tracks]);

  useEffect(() => {
    playArrangementRef.current = playArrangement;
  });

  const syncLiveArrangement = useCallback((sourceTracks: Track[]) => {
    if (!arrangementPlaying) return;
    const elapsed = arrangementPlayheadRef.current;
    const { events, duration } = getArrangedEventsFromTracks(sourceTracks);
    arrangementTimersRef.current.forEach(clearTimeout);
    arrangementTimersRef.current = [];
    if (arrangementEndTimerRef.current) clearTimeout(arrangementEndTimerRef.current);
    arrangementEndTimerRef.current = null;
    arrangementDurationRef.current = duration;

    const restartOpts = backingTracksMode ? { jamMode: true, keepRecorderPlayback: true } : undefined;
    if (!events.length || elapsed >= duration) {
      if (arrangementLoopRef.current && events.length) {
        void playArrangement(sourceTracks, restartOpts);
      } else {
        setArrangementPlaying(false);
        arrangementDurationRef.current = 0;
        arrangementPlayheadRef.current = 0;
        setArrangementPlayheadMs(0);
      }
      return;
    }

    const reflectPlaybackUi = !backingTracksMode && showTrackEditorRef.current;
    for (const arrangedEvent of events) {
      if (arrangedEvent.t < elapsed) continue;
      const id = setTimeout(
        () => playRecordedEvent(arrangedEvent, arrangedEvent.sound, {
          reflectControls: reflectPlaybackUi,
          reflectPadBank: reflectPlaybackUi,
          visualPadIndex: backingTracksMode
            ? getNeutralMultitrackPadIndex(arrangedEvent)
            : reflectPlaybackUi ? undefined : getNeutralMultitrackPadIndex(arrangedEvent),
          applyControls: !backingTracksMode,
        }),
        arrangedEvent.t - elapsed
      );
      arrangementTimersRef.current.push(id);
    }

    arrangementEndTimerRef.current = setTimeout(() => {
      stopArrangementTimers();
      if (arrangementLoopRef.current) {
        void playArrangement(sourceTracks, restartOpts);
      } else {
        setArrangementPlaying(false);
        arrangementDurationRef.current = 0;
        arrangementPlayheadRef.current = 0;
        setArrangementPlayheadMs(0);
      }
    }, duration - elapsed + 120);
  }, [arrangementPlaying, backingTracksMode, playArrangement, playRecordedEvent, stopArrangementTimers]);

  const playBackingTracksWithCurrentRecording = useCallback(async (opts?: { preserveView?: boolean; includeCurrentRecording?: boolean }) => {
    if (playableTrackClipCount === 0) {
      toast("Move a clip from Recorded to Track 1-5 to hear it.");
      return;
    }
    const shouldPlayCurrentRecording = opts?.includeCurrentRecording ?? recordedPatternPending;
    if (rec.recording) rec.stopRecording();
    rec.stop();
    stopArrangement({ keepBackingTracksMode: true });
    resetPadFlashes();
    if (!opts?.preserveView) setShowTrackEditor(false);
    await resumeAudio();
    if (shouldPlayCurrentRecording && hasNoteEvents(rec.getEvents())) rec.play();
    void playArrangement(tracks, { jamMode: true, keepRecorderPlayback: true });
  }, [playArrangement, playableTrackClipCount, rec, recordedPatternPending, resetPadFlashes, stopArrangement, tracks]);

  const startBackingTracksForNewRecording = useCallback(async () => {
    if (playableTrackClipCount === 0) {
      toast("Move a clip from Recorded to Track 1-5 to hear it.");
      return;
    }
    rec.stop();
    resetPadFlashes();
    setBackingTracksMode(true);
    setShowTrackEditor(false);
    await resumeAudio();
    if (!arrangementPlaying) {
      void playArrangement(tracks, { jamMode: true, keepRecorderPlayback: true });
    }
    startLocalRecording();
  }, [arrangementPlaying, playArrangement, playableTrackClipCount, rec, resetPadFlashes, startLocalRecording, tracks]);

  const toggleBackingTracksMode = useCallback(() => {
    if (backingTracksMode) {
      rec.stop();
      stopArrangement();
      return;
    }
    if (playableTrackClipCount === 0) {
      toast("Move a clip from Recorded to Track 1-5 to hear it.");
      return;
    }
    setBackingTracksMode(true);
    void playBackingTracksWithCurrentRecording();
  }, [backingTracksMode, playBackingTracksWithCurrentRecording, playableTrackClipCount, rec, stopArrangement]);

  const onRec = () => {
    if (editorVisible) return;
    if (rec.recording) {
      const recordedEvents = rec.getEvents();
      const hasRecordedNotes = hasNoteEvents(recordedEvents);
      setRecordedPatternPending(hasRecordedNotes);
      rec.stopRecording();
      if (backingTracksMode) {
        void playBackingTracksWithCurrentRecording({ includeCurrentRecording: hasRecordedNotes });
      }
    } else {
      if (backingTracksMode) {
        void startBackingTracksForNewRecording();
        return;
      }
      if (arrangementPlaying) stopArrangement({ keepBackingTracksMode: backingTracksMode });
      if (rec.playing) rec.stop();
      resetPadFlashes();
      startLocalRecording();
    }
  };

  const onPlay = () => {
    if (rec.recording) return;
    if (backingTracksMode) {
      if (arrangementPlaying || rec.playing) {
        rec.stop();
        stopArrangement({ keepBackingTracksMode: true });
      }
      void playBackingTracksWithCurrentRecording({ preserveView: true });
      return;
    }
    if (arrangementPlaying) {
      stopArrangement();
      return;
    }
    if (editorVisible) {
      if (rec.playing) rec.stop();
      if (playableTrackClipCount > 0) void playArrangement();
      else if (trackClipCount > 0) toast("Move a clip from Recorded to Track 1-5 to hear it.");
      return;
    }
    if (rec.playing) {
      rec.stop();
      return;
    }
    if (recordedPatternPending && rec.count > 0) {
      resetPadFlashes();
      rec.play();
      return;
    }
    if (playableTrackClipCount > 0) void playArrangement();
    else if (trackClipCount > 0) toast("Move a clip from Recorded to Track 1-5 to hear it.");
  };
  useEffect(() => {
    onPlayRef.current = onPlay;
  });

  const addClipToSelectedTrack = useCallback(
    (opts: {
      name: string;
      source: PatternSource;
      sourceId?: string;
      sound: SoundId;
      events: unknown;
    }) => {
      const events = normalizeEvents(opts.events);
      if (!events.length) {
        toast.error("Pattern has no playable events");
        return false;
      }
      const targetId = selectedTrack?.id ?? TRACK_IDS[0]!;
      const clip: PatternClip = {
        id: createClipId(),
        name: opts.name,
        source: opts.source,
        sourceId: opts.sourceId,
        sound: opts.sound,
        events,
        startMs: 0,
        durationMs: getPatternDuration(events),
      };
      const nextTracks = tracks.map((track) => {
        if (track.id !== targetId) return track;
        return appendClipToTrack(track, clip);
      });
      setTracks(nextTracks);
      setSelectedTrackId(targetId);
      setSelectedClipId(clip.id);
      setShowTrackEditor(true);
      if (!backingTracksMode) setCurrentSound(opts.sound);
      rec.loadEvents(events);
      setRecordedPatternPending(false);
      toast.success(`Added ${opts.name} to ${selectedTrack?.name ?? "Track 1"}`);
      syncLiveArrangement(nextTracks);
      return true;
    },
    [backingTracksMode, rec, selectedTrack, setCurrentSound, syncLiveArrangement, tracks]
  );

  const clearTrack = useCallback((trackId: string) => {
    const nextTracks = tracks.map((track) =>
      track.id === trackId ? { ...track, clips: [] } : track
    );
    setTracks(nextTracks);
    const track = tracks.find((item) => item.id === trackId);
    if (track?.clips.some((clip) => clip.id === selectedClipId)) setSelectedClipId(null);
    syncLiveArrangement(nextTracks);
  }, [selectedClipId, syncLiveArrangement, tracks]);

  const deleteClip = useCallback((trackId: string, clipId: string) => {
    const nextTracks = tracks.map((track) =>
      track.id === trackId ? removeClipFromTrack(track, clipId) : track
    );
    setTracks(nextTracks);
    if (selectedClipId === clipId) setSelectedClipId(null);
    syncLiveArrangement(nextTracks);
  }, [selectedClipId, syncLiveArrangement, tracks]);

  const copyClip = useCallback((clip: PatternClip) => {
    setClipboardClip(cloneClip(clip));
    toast.success(`Copied ${clip.name}`);
  }, []);

  const pasteToTrack = useCallback((trackId: string) => {
    if (!clipboardClip) return;
    const clip = cloneClip(clipboardClip);
    const nextTracks = tracks.map((track) => {
      if (track.id !== trackId) return track;
      return appendClipToTrack(track, clip);
    });
    setTracks(nextTracks);
    setSelectedTrackId(trackId);
    setSelectedClipId(clip.id);
    setShowTrackEditor(true);
    toast.success("Pasted pattern");
    syncLiveArrangement(nextTracks);
  }, [clipboardClip, syncLiveArrangement, tracks]);

  const moveClip = useCallback((fromTrackId: string, clipId: string, toTrackId: string, copy = false, startMs?: number) => {
    const copyClipToDestination = copy && !(fromTrackId === PATTERN_TRACK_ID && toTrackId !== PATTERN_TRACK_ID);
    const fromTrack = tracks.find((track) => track.id === fromTrackId);
    const clip = fromTrack?.clips.find((item) => item.id === clipId);
    if (!clip) return;
    const movedClip = copyClipToDestination ? cloneClip(clip) : clip;
    const withoutMoved = tracks.map((track) => {
      if (!copyClipToDestination && track.id === fromTrackId) return removeClipFromTrack(track, clipId);
      return track;
    });
    const nextTracks = withoutMoved.map((track) => {
      if (track.id !== toTrackId) return track;
      return typeof startMs === "number"
        ? placeClipInTrack(track, movedClip, startMs)
        : appendClipToTrack(track, movedClip);
    });
    setTracks(nextTracks);
    setSelectedTrackId(toTrackId);
    if (!copyClipToDestination) setSelectedClipId(clipId);
    toast.success(copyClipToDestination ? "Copied pattern" : "Moved pattern");
    syncLiveArrangement(nextTracks);
  }, [syncLiveArrangement, tracks]);

  const toggleTrackMute = useCallback((trackId: string) => {
    if (trackId === PATTERN_TRACK_ID) return;
    const nextTracks = tracks.map((track) =>
      track.id === trackId ? { ...track, muted: !track.muted } : track
    );
    setTracks(nextTracks);
    syncLiveArrangement(nextTracks);
  }, [syncLiveArrangement, tracks]);

  const previewTrack = useCallback(async (track: Track) => {
    if (!track.clips.length) return;
    stopArrangement();
    if (rec.recording) rec.stopRecording();
    rec.stop();
    const events: ArrangedEvent[] = [];
    let duration = 0;
    for (const clip of track.clips) {
      duration = Math.max(duration, clip.startMs + clip.durationMs);
      for (const ev of clip.events) {
        events.push({
          ...ev,
          t: ev.t + clip.startMs,
          trackId: track.id,
          clipId: clip.id,
          sound: clip.sound,
        } as ArrangedEvent);
      }
    }
    setCurrentSound(track.clips[0]!.sound);
    await resumeAudio();
    setArrangementPlaying(true);
    startPlayhead(duration);
    events.sort((a, b) => a.t - b.t).forEach((ev) => {
      const reflectPlaybackUi = showTrackEditorRef.current;
      const id = setTimeout(
        () => playRecordedEvent(ev, ev.sound, {
          reflectControls: reflectPlaybackUi,
          reflectPadBank: reflectPlaybackUi,
          visualPadIndex: reflectPlaybackUi ? undefined : getNeutralMultitrackPadIndex(ev),
        }),
        ev.t
      );
      arrangementTimersRef.current.push(id);
    });
    arrangementEndTimerRef.current = setTimeout(() => {
      if (arrangementFrameRef.current !== null) cancelAnimationFrame(arrangementFrameRef.current);
      arrangementFrameRef.current = null;
      setArrangementPlaying(false);
      setArrangementPlayheadMs(0);
    }, duration + 120);
  }, [playRecordedEvent, rec, setCurrentSound, startPlayhead, stopArrangement]);

  const addCurrentPatternToTrack = useCallback(() => {
    const events = normalizeEvents(rec.getEvents());
    if (!hasCurrentRecording || !hasNoteEvents(events)) {
      toast.error("Record or load a pattern first");
      return;
    }
    const targetId = selectedTrack?.id ?? TRACK_IDS[0]!;
    const clip: PatternClip = {
      id: createClipId(),
      name: `Current pattern ${trackClipCount + 1}`,
      source: "recording",
      sound: currentSound,
      events,
      startMs: 0,
      durationMs: getPatternDuration(events),
    };
    const nextTracks = tracks.map((track) => {
      if (track.id !== targetId) return track;
      return appendClipToTrack(track, clip);
    });
    setTracks(nextTracks);
    setSelectedTrackId(targetId);
    setSelectedClipId(clip.id);
    setShowTrackEditor(true);
    setCurrentSound(currentSound);
    clearLocalRecording();
    toast.success(`Added ${clip.name} to ${selectedTrack?.name ?? "Track 1"}`);
    void playArrangement(nextTracks);
  }, [clearLocalRecording, currentSound, hasCurrentRecording, playArrangement, rec, selectedTrack, setCurrentSound, trackClipCount, tracks]);

  const exportSessionJSON = useCallback(() => {
    if (trackClipCount > 0) {
      const session: MultitrackSession = {
        type: "pabpad-multitrack-session",
        version: 1,
        savedAt: new Date().toISOString(),
        currentSound,
        selectedTrackId,
        tracks: tracks.map((track) => ({
          ...track,
          clips: track.clips.map((clip) => ({
            ...clip,
            events: clip.events.map((event) => ({ ...event })),
          })),
        })),
      };
      downloadJSON(session, `pabpad-multitrack-${Date.now()}.json`);
      return;
    }
    rec.exportJSON();
  }, [currentSound, rec, selectedTrackId, trackClipCount, tracks]);

  const loadPreset = useCallback(
    (id: string) => {
      const p = PRESETS.find((x) => x.id === id);
      if (!p) return;
      setPresetMenuOpen(false);
      if (addClipToSelectedTrack({
        name: p.name,
        source: "preset",
        sourceId: p.id,
        sound: p.sound,
        events: p.events,
      })) {
        setSelectedPresetId(p.id);
      }
    },
    [addClipToSelectedTrack, setSelectedPresetId]
  );

  const pickSound = useCallback(
    (id: SoundId) => {
      setCurrentSound(id);
      rec.push({ type: "sound", id } as RecEventInput);
      setSoundMenuOpen(false);
      resumeAudio();
      // In backing/pads mode, the picker is a live-pad voice only. Avoid adding
      // an audition note over the arrangement.
      if (!backingTracksMode) playNote(60, 0.9, 280, id);
      toast.success(`Sound: ${SOUNDS.find((s) => s.id === id)?.name ?? id}`);
    },
    [backingTracksMode, rec, setCurrentSound]
  );

  const loadOriginalSession = useCallback((opts: {
    title: string;
    makeTracks: () => Track[];
    selectedSound: SoundId;
  }) => {
    stopArrangement();
    if (rec.recording) rec.stopRecording();
    rec.stop();
    const nextTracks = opts.makeTracks();
    const firstClip = nextTracks.find((track) => track.id === "track-1")?.clips[0] ?? null;
    setTracks(nextTracks);
    setSelectedTrackId("track-1");
    setSelectedClipId(firstClip?.id ?? null);
    setShowTrackEditor(true);
    setCurrentSound(opts.selectedSound);
    if (firstClip) rec.loadEvents(firstClip.events);
    setRecordedPatternPending(false);
    setPresetMenuOpen(false);
    setSoundMenuOpen(false);
    syncLiveArrangement(nextTracks);
    toast.success(`Loaded ${opts.title}`);
  }, [rec, setCurrentSound, stopArrangement, syncLiveArrangement]);

  const onImportFile = useCallback(
    async (file: File) => {
      try {
	        const text = await file.text();
	        const parsed = JSON.parse(text);
	        const session = parseMultitrackSession(parsed);
	        if (session) {
	          const selectedId = session.selectedTrackId && TRACK_IDS.includes(session.selectedTrackId)
	            ? session.selectedTrackId
	            : TRACK_IDS[0]!;
	          const selected = session.tracks.find((track) => track.id === selectedId) ?? session.tracks[0];
	          const firstClip = selected?.clips[0] ?? session.tracks.flatMap((track) => track.clips)[0];
	          setTracks(session.tracks);
	          setSelectedTrackId(selectedId);
	          setSelectedClipId(firstClip?.id ?? null);
	          setShowTrackEditor(true);
	          if (session.currentSound && !backingTracksMode) setCurrentSound(session.currentSound);
	          if (firstClip) rec.loadEvents(firstClip.events);
	          setRecordedPatternPending(false);
	          toast.success(`Imported multitrack session (${session.tracks.reduce((total, track) => total + track.clips.length, 0)} clips)`);
	          return;
	        }
	        // Accept either a raw event array or an object { events: [...] }
	        const events: unknown = Array.isArray(parsed) ? parsed : parsed?.events;
	        addClipToSelectedTrack({
          name: file.name.replace(/\.json$/i, ""),
          source: "import",
          sourceId: file.name,
          sound: currentSound,
          events,
        });
      } catch {
        toast.error("Could not read preset file (must be valid JSON)");
      }
	    },
	    [addClipToSelectedTrack, backingTracksMode, currentSound, rec, setCurrentSound]
	  );

  // Close preset menu on outside click / Escape
  useEffect(() => {
    if (!presetMenuOpen && !soundMenuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (presetMenuOpen && !presetMenuRef.current?.contains(e.target as Node)) setPresetMenuOpen(false);
      if (soundMenuOpen && !soundMenuRef.current?.contains(e.target as Node)) setSoundMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setPresetMenuOpen(false); setSoundMenuOpen(false); }
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [presetMenuOpen, soundMenuOpen]);

  // Sync the chosen sound into the audio engine.
  useEffect(() => {
    setSound(currentSound);
  }, [currentSound]);

  // In backing/pads mode, live controls are a global performance layer.
  // Reapply them when the mode is entered so older clip automation cannot
  // leave the engine at a stale value.
  useEffect(() => {
    if (!backingTracksMode) return;
    applyLivePerformanceControls();
  }, [applyLivePerformanceControls, backingTracksMode]);

  // After playback stops, restore master volume from the F1 fader (CC 22 rides
  // can leave the master at any value while an FX preset is playing).
  useEffect(() => {
    if (!rec.playing && !arrangementPlaying) {
      setMasterVolume(faders[0] / 127);
      setKnobCutoff(knobs[0]);
      setKnobDecay(knobs[1]);
    }
  }, [rec.playing, arrangementPlaying, faders, knobs]);

  useEffect(() => {
    return () => stopArrangement();
  }, [stopArrangement]);

  // Drive the page background from the active pad color.
  // Press wins (strong color); hover falls back to a softer tint; otherwise default --bg.
  useEffect(() => {
    const root = document.documentElement;
    const prev = root.style.getPropertyValue("--body-bg");
    const next = activeColor
      ? activeColor
      : hoverColor
        ? `color-mix(in oklab, ${hoverColor} 55%, #0a0a0c)`
        : null;
    if (next) root.style.setProperty("--body-bg", next);
    else root.style.removeProperty("--body-bg");
    return () => {
      if (prev) root.style.setProperty("--body-bg", prev);
      else root.style.removeProperty("--body-bg");
    };
  }, [activeColor, hoverColor]);

  return (
    <div
      style={{
        ["--panel-active" as string]: activeColor ?? "transparent",
        backgroundImage: activeColor
          ? `radial-gradient(120% 80% at 50% 0%, color-mix(in oklab, ${activeColor} 38%, #0a0a0c) 0%, #0a0a0c 70%)`
          : undefined,
        boxShadow: activeColor
          ? `0 0 0 1px color-mix(in oklab, ${activeColor} 60%, transparent) inset, 0 0 60px -10px color-mix(in oklab, ${activeColor} 70%, transparent)`
          : undefined,
      }}
      className={cn(
        "relative w-full max-w-[820px]",
        "rounded-2xl p-3 sm:p-4",
        "bg-gradient-to-b from-neutral-900 to-neutral-950",
        "ring-1 ring-black/80 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.04)_inset]",
        "transition-[background-image,box-shadow] duration-200 ease-out"
      )}
    >
      {/* Top bar */}
      <div className="mb-3 flex items-start gap-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-mono px-2 py-1 rounded ring-1 ring-neutral-800 text-neutral-400">
            {rec.recording ? (
              <span className="text-red-400">● REC</span>
            ) : rec.playing || arrangementPlaying ? (
              <span className="text-emerald-300">▶ PLAY</span>
            ) : (
              "● IDLE"
            )}
            <span className="ml-1 text-neutral-500">
              {editorVisible ? `${trackClipCount} clip` : `${rec.count} evt`}
            </span>
          </span>
          <div className="relative">
            <select
              value=""
              onChange={(event) => {
                const session = ORIGINAL_SESSIONS.find((item) => item.id === event.target.value);
                if (!session) return;
                loadOriginalSession(session);
              }}
              className="h-7 w-[152px] appearance-none rounded px-2 pr-7 text-[10px] font-semibold uppercase tracking-wider text-cyan-100 outline-none ring-1 ring-cyan-500/30 bg-neutral-950 hover:bg-cyan-500/10 focus:ring-cyan-300"
              aria-label="Load original song"
              title="Load original song"
            >
              <option value="" disabled>Originals</option>
              {ORIGINAL_SESSIONS.map((session) => (
                <option key={session.id} value={session.id}>{session.label}</option>
              ))}
            </select>
            <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-cyan-200" aria-hidden />
          </div>
          <div ref={presetMenuRef} className="relative">
            <button
              onClick={() => { setPresetMenuOpen((v) => !v); setSoundMenuOpen(false); }}
              className="flex items-center gap-1 rounded px-2 py-1 ring-1 ring-neutral-800 text-[10px] font-semibold tracking-wider uppercase text-neutral-400 hover:text-white"
              aria-haspopup="menu"
              aria-expanded={presetMenuOpen}
              title="Load original open example presets"
            >
              <Library size={11} /> {selectedPreset?.name ?? "Presets"}
            </button>
            {presetMenuOpen && (
              <div
                role="menu"
                className="absolute left-0 top-full mt-1 z-20 min-w-[280px] max-h-[60vh] overflow-y-auto rounded-md bg-neutral-950 ring-1 ring-neutral-800 shadow-xl p-1"
              >
                <div className="px-2 pt-1 pb-0.5 text-[9px] uppercase tracking-wider text-neutral-500">
                  Original open examples
                </div>
                {PRESET_GROUPS.map((g) => (
                  <div key={g.category}>
                    <div className="my-1 border-t border-neutral-900" />
                    <div className="px-2 pt-1 pb-0.5 text-[9px] uppercase tracking-wider text-neutral-500">
                      {g.category}
                    </div>
                    {g.presets.map((p) => {
                      const isSelected = p.id === selectedPresetId;
                      return (
                        <button
                          key={p.id}
                          role="menuitem"
                          aria-current={isSelected ? "true" : undefined}
                          onClick={() => loadPreset(p.id)}
                          className={
                            "w-full text-left px-2 py-1.5 rounded outline-none transition-colors " +
                            (isSelected
                              ? "bg-[var(--accent)]/15 ring-1 ring-[var(--accent)]/60 hover:bg-[var(--accent)]/20"
                              : "hover:bg-neutral-900 focus:bg-neutral-900")
                          }
                        >
                          <div
                            className={
                              "text-[11px] font-semibold " +
                              (isSelected ? "text-[var(--accent)]" : "text-neutral-100")
                            }
                          >
                            {isSelected && <span aria-hidden className="mr-1">✓</span>}
                            {p.name}{" "}
                            <span
                              className={
                                "font-normal " +
                                (isSelected ? "text-[var(--accent)]/70" : "text-neutral-500")
                              }
                            >
                              — {p.sound}
                            </span>
                          </div>
                          <div
                            className={
                              "text-[10px] leading-tight " +
                              (isSelected ? "text-[var(--accent)]/70" : "text-neutral-500")
                            }
                          >
                            {p.description}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))}
                <div className="my-1 border-t border-neutral-900" />
                <button
                  role="menuitem"
                  onClick={() => {
                    setPresetMenuOpen(false);
                    fileInputRef.current?.click();
                  }}
                  className="w-full text-left px-2 py-1.5 rounded hover:bg-neutral-900 outline-none flex items-center gap-1.5"
                >
                  <Upload size={11} className="text-neutral-400" />
                  <span className="text-[11px] text-neutral-200">Import from file…</span>
                </button>
              </div>
            )}
          </div>
          <div ref={soundMenuRef} className="relative">
            <button
              onClick={() => {
                setSoundMenuOpen((v) => !v);
                setPresetMenuOpen(false);
              }}
              className="flex items-center gap-1 rounded px-2 py-1 ring-1 ring-neutral-800 text-[10px] font-semibold tracking-wider uppercase text-neutral-400 hover:text-white"
              aria-haspopup="menu"
              aria-expanded={soundMenuOpen}
              title={backingTracksMode ? "Pick the live pad voice" : "Pick the preview synth voice"}
            >
              <Music2 size={11} /> Sound: {currentSoundDef?.name ?? currentSound}
            </button>
            {soundMenuOpen && (
              <div
                role="menu"
                className="absolute left-0 top-full mt-1 z-20 max-h-[70vh] min-w-[320px] overflow-y-auto rounded-md bg-neutral-950 ring-1 ring-neutral-800 shadow-xl p-1.5"
              >
                <div className="px-2 pt-1 pb-1.5 text-[9px] uppercase tracking-wider text-neutral-500">Preview synth voices</div>
                {soundGroups.map(({ group, sounds }) => {
                  const GroupIcon = SOUND_GROUP_ICON[group.id];
                  const groupHasSelection = sounds.some((sound) => sound.id === currentSound);

                  return (
                    <section key={group.id} className="mb-1.5 last:mb-0">
                      <div
                        className={cn(
                          "flex items-center gap-1.5 px-2 py-1 text-[9px] font-bold uppercase tracking-wider",
                          groupHasSelection ? "text-[var(--accent)]" : "text-neutral-500"
                        )}
                      >
                        <GroupIcon size={11} />
                        <span>{group.name}</span>
                        <span className="ml-auto text-[8px] font-semibold text-neutral-600">{sounds.length}</span>
                      </div>
                      <div className="space-y-1">
                        {sounds.map((sound) => {
                          const isSelected = sound.id === currentSound;

                          return (
                            <button
                              key={sound.id}
                              role="menuitem"
                              onClick={() => pickSound(sound.id)}
                              className={cn(
                                "group w-full rounded px-2 py-1.5 text-left outline-none transition-colors",
                                "hover:bg-neutral-900 focus:bg-neutral-900",
                                isSelected && "bg-[var(--accent)]/15 ring-1 ring-[var(--accent)]/60"
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className={cn(
                                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-full ring-1",
                                    isSelected
                                      ? "bg-[var(--accent)] text-black ring-[var(--accent)]"
                                      : "text-neutral-600 ring-neutral-800 group-hover:text-neutral-300"
                                  )}
                                >
                                  {isSelected ? <Check size={10} strokeWidth={3} /> : <GroupIcon size={9} />}
                                </span>
                                <span
                                  className={cn(
                                    "text-[11px] font-semibold",
                                    isSelected ? "text-[var(--accent)]" : "text-neutral-100"
                                  )}
                                >
                                  {sound.name}
                                </span>
                              </div>
                              <div
                                className={cn(
                                  "pl-6 text-[10px] leading-tight",
                                  isSelected ? "text-[var(--accent)]/75" : "text-neutral-500"
                                )}
                              >
                                {sound.description}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
          </div>
          <button
            onClick={clearRecording}
            className={cn(
              "rounded p-1 ring-1 hover:text-white",
              hasCurrentRecording
                ? "bg-red-500/15 text-red-300 ring-red-400/50 shadow-[0_0_14px_-6px_rgba(248,113,113,0.9)]"
                : "text-neutral-500 ring-neutral-800"
            )}
            aria-label="Clear recording"
            title={hasCurrentRecording ? "Clear current recorded pattern" : "Clear recording"}
          >
            <Trash2 size={11} />
          </button>
          <button
            onClick={exportSessionJSON}
            disabled={!rec.count && trackClipCount === 0}
            className="rounded p-1 ring-1 ring-neutral-800 text-neutral-500 hover:text-white disabled:opacity-40"
            aria-label="Save recording"
            title={trackClipCount > 0 ? "Save multitrack session (JSON)" : "Save recording (JSON)"}
          >
            <Download size={11} />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded p-1 ring-1 ring-neutral-800 text-neutral-500 hover:text-white"
            aria-label="Load recording"
            title="Load recording (JSON)"
          >
            <Upload size={11} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImportFile(f);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => setShowTrackEditor((value) => !value)}
            className={cn(
              "flex items-center gap-1 rounded p-1 ring-1 ring-neutral-800 text-neutral-500 hover:text-white",
              editorVisible && "text-[var(--accent)] ring-[var(--accent)]/40"
            )}
            aria-label={editorVisible ? backingTracksMode ? "Show pads" : "Full window" : "Show track editor"}
            title={editorVisible ? backingTracksMode ? "Show pads" : "Full window" : "Show track editor"}
          >
            {editorVisible ? backingTracksMode ? <Grid3X3 size={11} /> : <Maximize2 size={11} /> : <Rows3 size={11} />}
            {editorVisible && !backingTracksMode && <span className="hidden text-[9px] font-bold uppercase tracking-wider sm:inline">Full window</span>}
          </button>
          <button
            onClick={toggleBackingTracksMode}
            disabled={!backingTracksMode && playableTrackClipCount === 0}
            className={cn(
              "rounded p-1 ring-1 ring-neutral-800 text-neutral-500 hover:text-white disabled:opacity-40",
              backingTracksMode && "text-emerald-300 ring-emerald-400/40"
            )}
            aria-label={backingTracksMode ? "Turn off backing tracks mode" : "Play tracks as backing"}
            title={backingTracksMode ? "Turn off play-all-tracks pads mode" : "Play all tracks while showing pads"}
          >
            {backingTracksPlaying ? <Square size={11} fill="currentColor" /> : <Music2 size={11} />}
          </button>
          <div className="ml-auto flex shrink-0 items-center gap-1.5 pl-2 text-neutral-200" aria-label="PabPad">
            <span className="text-xs font-bold tracking-[0.25em]">PABPAD</span>
            <Heart className="h-3.5 w-3.5 shrink-0 fill-[var(--accent)] text-[var(--accent)]" />
          </div>
          <div className="basis-full truncate text-[10px] font-medium text-neutral-500 sm:hidden">
            Play pads, shape sounds, record patterns, arrange tracks.
          </div>
        </div>
      </div>

      {/* Main layout: left controls + right pad grid */}
      <div className="grid grid-cols-12 gap-3">
        {/* LEFT PANEL */}
        {!neutralMultitrackPads && !editorVisible && (
        <section className="col-span-12 md:col-span-5 lg:col-span-4 rounded-xl bg-neutral-950/60 ring-1 ring-black/60 p-3">
          {compactArrangementControls ? (
            <div className="grid grid-cols-2 gap-2 items-center">
              <button
                onClick={onPlay}
                className={cn(
                  "h-8 rounded-md ring-1 ring-black/70 bg-neutral-950",
                  "flex items-center justify-center text-[11px] font-semibold tracking-wider",
                  rec.playing || arrangementPlaying
                    ? "text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.6)]"
                    : "text-neutral-300"
                )}
                aria-label="Play or stop"
                title="Play / stop"
              >
                {rec.playing || arrangementPlaying ? <Square size={11} fill="currentColor" /> : <Play size={12} />}
              </button>
              <CtrlButton
                label={rec.loop ? "LOOP ON" : "LOOP"}
                color="#2ad17a"
                active={rec.loop}
                onClick={() => rec.setLoop(!rec.loop)}
                className="h-8 w-full"
              />
              {!editorVisible && (
                <button
                  onClick={onRec}
                  className={cn(
                    "col-span-2 h-8 rounded-md ring-1 ring-black/70 bg-neutral-950",
                    "flex items-center justify-center",
                    rec.recording ? "text-red-400 shadow-[0_0_12px_rgba(248,113,113,0.7)]" : "text-neutral-300"
                  )}
                  aria-label="Record"
                  title="Start / stop local MIDI recording"
                >
                  <Circle size={12} fill={rec.recording ? "currentColor" : "none"} />
                </button>
              )}
            </div>
          ) : (
          <>
            {/* Knobs row */}
          <div className="grid grid-cols-2 gap-4 place-items-center">
            <Knob label="K1" value={knobs[0]} onChange={(v) => setKnobs([v, knobs[1]])} color="#ff3b30" />
            <Knob label="K2" value={knobs[1]} onChange={(v) => setKnobs([knobs[0], v])} color="#ff3b30" />
          </div>

          {/* Faders + side buttons */}
          <div className="mt-4 grid grid-cols-[auto_auto_1fr] gap-3 items-start">
            <div className="flex flex-col items-center gap-2">
              <Fader label="F1" value={faders[0]} onChange={(v) => setFaders([v, faders[1]])} />
            </div>
            <div className="flex flex-col items-center gap-2">
              <Fader label="F2" value={faders[1]} onChange={(v) => setFaders([faders[0], v])} />
            </div>
            <div className="flex flex-col gap-2 items-stretch">
              <CtrlButton
                label="A"
                color="#ff2ea6"
                sub={sceneA ? (activeScene === "A" ? "●" : "✓") : "—"}
                active={activeScene === "A"}
                onClick={() => onSceneClick("A")}
                onContextMenu={(e) => { e.preventDefault(); onSceneClear("A"); }}
                title={sceneA
                  ? (shift ? "SHIFT: overwrite scene A" : "Recall scene A (SHIFT to overwrite, right-click to clear)")
                  : "Capture current macros into scene A"}
              />
              <CtrlButton
                label="B"
                color="#ff2ea6"
                sub={sceneB ? (activeScene === "B" ? "●" : "✓") : "—"}
                active={activeScene === "B"}
                onClick={() => onSceneClick("B")}
                onContextMenu={(e) => { e.preventDefault(); onSceneClear("B"); }}
                title={sceneB
                  ? (shift ? "SHIFT: overwrite scene B" : "Recall scene B (SHIFT to overwrite, right-click to clear)")
                  : "Capture current macros into scene B"}
              />
              <CtrlButton
                label="FULL"
                sub="LEVEL"
                color="#3b6bff"
                active={fullLevel}
                onClick={() => setFullLevel((v) => !v)}
              />
            </div>
          </div>

          {/* Bank row */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            <CtrlButton
              label={`KNOB ${knobBank}`}
              sub={`${BANK_ORDER.indexOf(knobBank) + 1}/3`}
              color="#ff3b30"
              onClick={shift ? prevKnobBank : nextKnobBank}
              active
              title="Cycle knob bank A → B → C. Each bank stores its own K1/K2 values (persisted to localStorage). Hold SHIFT to step backwards."
            />
            <CtrlButton
              label={`FADER ${faderBank}`}
              sub={`${BANK_ORDER.indexOf(faderBank) + 1}/3`}
              color="#3b6bff"
              onClick={shift ? prevFaderBank : nextFaderBank}
              active
              title="Cycle fader bank A → B → C. Each bank stores its own F1/F2 values (persisted to localStorage). Hold SHIFT to step backwards."
            />
            <CtrlButton
              label={`PAD ${padBank}`}
              sub={`${BANK_ORDER.indexOf(padBank) + 1}/3`}
              color={padBankColor}
              onClick={shift ? prevBank : nextBank}
              active
              title="Cycle pad bank A → B → C (transposes the 4×4 grid). Hold SHIFT to step backwards."
            />
          </div>

          {/* Transport */}
          <div className="mt-3 grid grid-cols-3 gap-2 items-center">
            <button
              onClick={onPlay}
              disabled={rec.recording}
              className={cn(
                "h-8 rounded-md ring-1 ring-black/70 bg-neutral-950",
                "flex items-center justify-center text-[11px] font-semibold tracking-wider disabled:cursor-not-allowed disabled:opacity-35",
                rec.playing || arrangementPlaying ? "text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.6)]" : "text-neutral-300"
              )}
              aria-label="Play or stop"
              title={rec.recording
                ? "Play / stop is disabled while recording"
                : backingTracksMode
                ? "Play / stop all tracks while showing pads"
                : editorVisible
                  ? "Play / stop all editor tracks"
                  : rec.count > 0 ? "Play / stop the local recording" : "Play / stop all non-muted tracks"}
            >
              {rec.playing || arrangementPlaying ? <Square size={11} fill="currentColor" /> : <Play size={12} />}
            </button>
            <CtrlButton
              label="NOTE"
              sub="REPEAT"
              color="#3b6bff"
              active={noteRepeat}
              onClick={() => setNoteRepeat((v) => !v)}
              className="h-8 w-full"
            />
            <button
              className="h-8 rounded-md ring-1 ring-black/70 bg-neutral-950 flex items-center justify-center"
              onClick={nextBank}
              aria-label="Next pad bank"
              title="Next pad bank"
            >
              <ChevronUp size={14} className="text-[#ff2ea6]" />
            </button>

            <button
              onClick={onRec}
              disabled={editorVisible}
              className={cn(
                "h-8 rounded-md ring-1 ring-black/70 bg-neutral-950",
                "flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-35",
                rec.recording ? "text-red-400 shadow-[0_0_12px_rgba(248,113,113,0.7)]" : "text-neutral-300"
              )}
              aria-label="Record"
              title={editorVisible ? "Recording is disabled in track editor" : "Start / stop local MIDI recording"}
            >
              <Circle size={12} fill={rec.recording ? "currentColor" : "none"} />
            </button>
            <CtrlButton
              label={rec.loop ? "LOOP ON" : "LOOP"}
              color="#2ad17a"
              active={rec.loop}
              onClick={() => rec.setLoop(!rec.loop)}
              className="h-8 w-full"
            />
            <button
              className="h-8 rounded-md ring-1 ring-black/70 bg-neutral-950 flex items-center justify-center"
              onClick={prevBank}
              aria-label="Previous pad bank"
              title="Previous pad bank"
            >
              <ChevronDown size={14} className="text-[#ff2ea6]" />
            </button>
          </div>

          {/* SHIFT row */}
          <div className="mt-2">
            <CtrlButton
              label="SHIFT"
              color="#3b6bff"
              active={shift}
              onClick={() => setShift((v) => !v)}
              className="h-8 w-full"
            />
          </div>

          {/* Hint */}
          <p className="mt-4 text-[10px] text-neutral-500 leading-relaxed">
            Keys: <kbd className="text-neutral-300">1234 / qwer / asdf / zxcv</kbd>.{" "}
            <kbd className="text-neutral-300">Space</kbd> play.{" "}
            <kbd className="text-neutral-300">Shift</kbd> hold.
            <Repeat className="inline ml-1 align-text-bottom" size={12} />
          </p>
          </>
          )}
        </section>
        )}

        {/* PAD GRID / TRACK EDITOR */}
        <section className={cn("col-span-12", !neutralMultitrackPads && !editorVisible && "md:col-span-7 lg:col-span-8")}>
          {editorVisible ? (
            <div className="rounded-xl bg-neutral-950/60 p-2.5 ring-1 ring-black/60">
              <div className="mb-2 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-1">
                <div className="flex min-w-0 items-center gap-2">
                  <Rows3 size={13} className="shrink-0 text-[var(--accent)]" />
                  <span className="truncate text-[10px] font-bold uppercase text-neutral-300">
                    Track editor
                  </span>
                  <span className="shrink-0 rounded bg-neutral-900 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-neutral-500">
                    {trackClipCount} clips
                  </span>
                </div>
                <div className="flex items-center justify-center gap-1.5">
                  <button
                    onClick={onPlay}
                    disabled={rec.recording}
                    className={cn(
                      "h-7 w-8 rounded-md bg-neutral-950 ring-1 ring-black/70",
                      "flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-35",
                      rec.playing || arrangementPlaying
                        ? "text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.6)]"
                        : "text-neutral-300"
                    )}
                    aria-label="Play or stop"
                    title={rec.recording ? "Play / stop is disabled while recording" : "Play / stop all editor tracks"}
                  >
                    {rec.playing || arrangementPlaying ? <Square size={11} fill="currentColor" /> : <Play size={12} />}
                  </button>
                  <button
                    onClick={() => rec.setLoop(!rec.loop)}
                    className={cn(
                      "h-7 w-8 rounded-md bg-neutral-950 ring-1 ring-black/70",
                      "flex items-center justify-center",
                      rec.loop ? "text-emerald-300 ring-emerald-400/40" : "text-neutral-300"
                    )}
                    aria-label={rec.loop ? "Turn loop off" : "Turn loop on"}
                    title={rec.loop ? "Loop on" : "Loop"}
                  >
                    <Repeat size={12} />
                  </button>
                </div>
                <div className="flex items-center justify-end gap-1">
	                  <button
	                    onClick={addCurrentPatternToTrack}
	                    disabled={!hasCurrentRecording}
	                    className={cn(
                        "rounded p-1 ring-1 hover:text-white disabled:opacity-30",
                        hasCurrentRecording
                          ? "bg-[var(--accent)]/15 text-[var(--accent)] ring-[var(--accent)]/50 shadow-[0_0_14px_-6px_var(--accent)]"
                          : "text-neutral-500 ring-neutral-800"
                      )}
	                    aria-label="Add current pattern"
	                    title="Add current pattern to selected track"
	                  >
	                    <Plus size={12} />
	                  </button>
	                </div>
              </div>

              <div className="space-y-1.5">
                {tracks.map((track, index) => {
                  const isPatternTrack = track.id === PATTERN_TRACK_ID;
                  const selected = track.id === selectedTrackId;
                  const hasClips = track.clips.length > 0;

                  return (
	                    <div
	                      key={track.id}
	                      onClick={() => {
	                        setSelectedTrackId(track.id);
	                        setSelectedClipId(null);
	                      }}
	                      onDragOver={(e) => e.preventDefault()}
	                      onDrop={(e) => {
	                        e.preventDefault();
	                        const fromTrackId = e.dataTransfer.getData("application/x-pab-track-id");
	                        const clipId = e.dataTransfer.getData("application/x-pab-clip-id");
	                        if (!fromTrackId) return;
	                        if (!clipId) return;
	                        moveClip(fromTrackId, clipId, track.id, e.altKey);
	                      }}
                      className={cn(
                        "grid min-h-16 grid-cols-[3.75rem_minmax(0,1fr)_auto] items-center gap-2 rounded-lg p-1.5 ring-1 transition-colors",
                        selected
                          ? TRACK_SELECTED_CLASS
                          : "bg-neutral-950/80 ring-neutral-900 hover:ring-neutral-700"
                      )}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTrackId(track.id);
                          setSelectedClipId(null);
                        }}
                        className={cn(
                          "h-10 rounded-md text-left ring-1 px-2",
                          selected ? TRACK_SELECTED_LABEL_CLASS : "bg-neutral-950 text-neutral-400 ring-neutral-800"
                        )}
                        aria-label={`Select ${track.name}`}
                        title={`Select ${track.name}`}
                      >
                        <span className="block text-[9px] font-bold uppercase">
                          {isPatternTrack ? "REC" : `T${index}`}
                        </span>
                        <span className="block truncate text-[10px] font-semibold">{track.name}</span>
                      </button>

	                      {hasClips ? (
	                        <div
	                          className="min-w-0 overflow-x-auto rounded-md bg-neutral-950/70 p-1 ring-1 ring-neutral-900"
	                          onDragOver={(e) => e.preventDefault()}
	                          onDrop={(e) => {
	                            e.preventDefault();
	                            e.stopPropagation();
	                            const fromTrackId = e.dataTransfer.getData("application/x-pab-track-id");
	                            const clipId = e.dataTransfer.getData("application/x-pab-clip-id");
	                            if (!fromTrackId || !clipId) return;
	                            const lane = e.currentTarget;
	                            const rect = lane.getBoundingClientRect();
	                            const x = e.clientX - rect.left + lane.scrollLeft;
	                            const startMs = Math.round((Math.max(0, x) / TIMELINE_PX_PER_SECOND) * 1000);
	                            moveClip(fromTrackId, clipId, track.id, e.altKey, startMs);
	                          }}
	                        >
                          <div
                            className="relative h-11"
                            style={{ width: arrangementTimelineWidth }}
                          >
                            {arrangementPlaying && arrangementDuration > 0 && !isPatternTrack && (
                              <div
                                className="pointer-events-none absolute bottom-0 top-0 z-20 w-px bg-white shadow-[0_0_8px_rgba(255,255,255,0.85)]"
                                style={{ left: timelinePx(arrangementPlayheadMs) }}
                                aria-hidden
                              >
                                <span className="absolute -left-1 top-0 h-1.5 w-1.5 rounded-full bg-white" />
                              </div>
                            )}
                            {track.clips.map((clip) => {
                              const clipSound = SOUNDS.find((sound) => sound.id === clip.sound)?.name ?? clip.sound;
                              const width = Math.max(72, timelinePx(clip.durationMs));
                              const clipSelected = selected && selectedClipId === clip.id;

                              return (
                                <div
                                  key={clip.id}
                                  draggable
                                  onDragStart={(e) => {
                                    e.dataTransfer.setData("application/x-pab-track-id", track.id);
                                    e.dataTransfer.setData("application/x-pab-clip-id", clip.id);
                                    e.dataTransfer.effectAllowed = "copyMove";
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTrackId(track.id);
                                    setSelectedClipId(clip.id);
	                                  }}
	                                  className={cn(
	                                    "group absolute bottom-0 top-0 flex flex-col justify-between overflow-hidden rounded-md px-2 py-1.5 text-left ring-1",
	                                    track.muted
	                                      ? "bg-neutral-950 text-neutral-600 ring-neutral-900"
	                                      : "bg-neutral-900 text-neutral-100 ring-neutral-700",
                                    clipSelected && CLIP_SELECTED_CLASS
                                  )}
                                  style={{ left: timelinePx(clip.startMs), width }}
                                  role="button"
                                  tabIndex={0}
	                                  aria-label={`${clip.name} on ${track.name}`}
	                                  title={`${clip.name} · ${clipSound}`}
	                                >
	                                  <PatternWaveform clip={clip} muted={track.muted} selected={clipSelected} />
	                                  <span className="relative z-10 flex min-w-0 items-center gap-1.5">
	                                    <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--accent)]" />
	                                    <span className="truncate text-[11px] font-bold">{clip.name}</span>
	                                  </span>
	                                  <span className="relative z-10 mt-1 flex items-center gap-1.5 text-[9px] uppercase text-neutral-500">
	                                    <span>{clip.source}</span>
	                                    <span>{formatDuration(clip.durationMs)}</span>
	                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedTrackId(track.id);
                                        setSelectedClipId(clip.id);
                                        copyClip(clip);
                                      }}
	                                      className="relative z-20 ml-auto rounded p-0.5 text-neutral-600 hover:text-white"
                                      aria-label={`Copy ${clip.name}`}
                                      title={`Copy ${clip.name}`}
                                    >
                                      <Copy size={10} />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteClip(track.id, clip.id);
                                      }}
	                                      className="relative z-20 rounded p-0.5 text-neutral-600 hover:text-red-300"
                                      aria-label={`Delete ${clip.name}`}
                                      title={`Delete ${clip.name}`}
                                    >
                                      <Trash2 size={10} />
                                    </button>
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-md border border-dashed border-neutral-800 px-2 py-3 text-[10px] font-semibold uppercase text-neutral-700">
                          {isPatternTrack ? "Add recordings here" : "Empty"}
                        </div>
                      )}

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            previewTrack(track);
                          }}
                          disabled={!hasClips}
                          className="rounded p-1 text-neutral-500 ring-1 ring-neutral-800 hover:text-white disabled:opacity-30"
                          aria-label={`Preview ${track.name}`}
                          title={`Preview ${track.name}`}
                        >
                          <Play size={11} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTrackMute(track.id);
                          }}
                          disabled={!hasClips || isPatternTrack}
                          className={cn(
                            "h-5 rounded px-1.5 text-[9px] font-bold ring-1 disabled:opacity-30",
                            track.muted ? "text-amber-300 ring-amber-400/40" : "text-neutral-500 ring-neutral-800 hover:text-white"
                          )}
                          aria-label={isPatternTrack ? "Recorded row is always muted" : track.muted ? `Unmute ${track.name}` : `Mute ${track.name}`}
                          title={isPatternTrack ? "Recorded row is always muted" : track.muted ? `Unmute ${track.name}` : `Mute ${track.name}`}
                        >
                          M
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const lastClip = track.clips.at(-1);
                            if (lastClip) copyClip(lastClip);
                          }}
                          disabled={!hasClips}
                          className="rounded p-1 text-neutral-500 ring-1 ring-neutral-800 hover:text-white disabled:opacity-30"
                          aria-label={`Copy last pattern from ${track.name}`}
                          title={`Copy last pattern from ${track.name}`}
                        >
                          <Copy size={11} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            pasteToTrack(track.id);
                          }}
                          disabled={!clipboardClip}
                          className="rounded p-1 text-neutral-500 ring-1 ring-neutral-800 hover:text-white disabled:opacity-30"
                          aria-label={`Paste to ${track.name}`}
                          title={`Paste to ${track.name}`}
                        >
                          <ClipboardPaste size={11} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            clearTrack(track.id);
                          }}
                          disabled={!hasClips}
                          className="rounded p-1 text-neutral-500 ring-1 ring-neutral-800 hover:text-white disabled:opacity-30"
                          aria-label={`Clear ${track.name}`}
                          title={`Clear ${track.name}`}
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-2 flex items-center justify-between px-1 text-[10px] text-neutral-500">
                <span>Target: {selectedTrack?.name ?? "Track 1"} · {formatDuration(arrangementDuration)}</span>
                <span className="flex items-center gap-1 text-neutral-600">
                  <ArrowRightLeft size={11} /> Drag moves · Option-drag copies
                </span>
              </div>
            </div>
          ) : (
            <>
              {neutralMultitrackPads ? (
                <ArrangementWaveform
                  tracks={tracks}
                  durationMs={getPlayableArrangementEndMs(tracks)}
                  playheadMs={arrangementPlayheadMs}
                  playing={arrangementPlaying}
                  controls={
                    <>
                      <button
                        onClick={onPlay}
                        disabled={rec.recording}
                        className={cn(
                          "h-10 w-12 rounded-lg bg-neutral-950 ring-1 ring-black/70",
                          "flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-35",
                          rec.playing || arrangementPlaying
                            ? "text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.6)]"
                            : "text-neutral-300"
                        )}
                        aria-label="Play or stop"
                        title={rec.recording ? "Play / stop is disabled while recording" : "Play / stop all tracks"}
                      >
                        {rec.playing || arrangementPlaying ? <Square size={12} fill="currentColor" /> : <Play size={13} />}
                      </button>
                      <button
                        onClick={() => rec.setLoop(!rec.loop)}
                        className={cn(
                          "h-10 w-12 rounded-lg bg-neutral-950 ring-1 ring-black/70",
                          "flex items-center justify-center",
                          rec.loop ? "text-emerald-300 ring-emerald-400/50 shadow-[0_0_12px_rgba(16,185,129,0.6)]" : "text-neutral-300"
                        )}
                        aria-label={rec.loop ? "Turn loop off" : "Turn loop on"}
                        title={rec.loop ? "Loop on" : "Loop"}
                      >
                        <Repeat size={13} />
                      </button>
                      <button
                        onClick={onRec}
                        className={cn(
                          "h-10 w-12 rounded-lg bg-neutral-950 ring-1 ring-black/70",
                          "flex items-center justify-center",
                          rec.recording ? "text-red-400 shadow-[0_0_12px_rgba(248,113,113,0.7)]" : "text-neutral-300"
                        )}
                        aria-label="Record"
                        title="Start / stop local MIDI recording"
                      >
                        <Circle size={13} fill={rec.recording ? "currentColor" : "none"} />
                      </button>
                    </>
                  }
                />
              ) : (
              <div className="grid grid-cols-4 gap-2 rounded-xl p-2.5 bg-neutral-950/60 ring-1 ring-black/60">
                {PADS.map((pad) => {
                  const highlighted = backingTracksMode && backingPlaybackPadIndexes.has(pad.index);
                  const bankPad = {
                    ...pad,
                    label: getPadLabel(pad.index, padBank),
                    color: getPadColor(pad.index, padBank),
                  };

                  return (
                  <Pad
                    key={pad.index}
                    pad={bankPad}
                    pressed={pressed.has(pad.index)}
                    onDown={() => triggerOn(pad.index)}
                    onUp={() => triggerOff(pad.index)}
                    onHover={(c) => setHoverColor(c)}
                    neutral={false}
                    disabled={false}
                    highlighted={highlighted}
                  />
                  );
                })}
              </div>
              )}
              {!neutralMultitrackPads && (
              <div className="mt-2 px-1 text-[10px] text-neutral-500 flex items-center justify-between">
                <span>
                  Bank <span className={cn("font-semibold", PAD_BANK_TEXT_CLASS[padBank])}>{padBank}</span> — pads{" "}
                  {BANK_ORDER.indexOf(padBank) * 16 + 1}–{BANK_ORDER.indexOf(padBank) * 16 + 16} of 48
                </span>
                <span className="text-neutral-600">3 banks × 16 pads = 48 assignable</span>
              </div>
              )}
            </>
          )}
        </section>
      </div>

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />

      {/* Floating help button (bottom right of viewport) */}
      <button
        onClick={() => setHelpOpen(true)}
        aria-label="Open help"
        title="Help"
        className="fixed bottom-4 right-4 z-40 flex items-center gap-1.5 rounded-full bg-neutral-950/90 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-300 ring-1 ring-white/10 shadow-lg backdrop-blur hover:text-white hover:ring-white/30"
      >
        <HelpCircle size={14} /> Help
      </button>
    </div>
  );
}
