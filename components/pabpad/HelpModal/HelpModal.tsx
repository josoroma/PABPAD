"use client";

import {
  Download,
  Grid3X3,
  Library,
  Maximize2,
  Music2,
  Play,
  Plus,
  Rows3,
  Square,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/cn";

import CtrlButton from "../CtrlButton";
import Fader from "../Fader";
import Knob from "../Knob";

import { BANK_LABELS, TABS } from "./constants";
import type { HelpModalProps, TabId } from "./types";

export default function HelpModal({ open, onClose }: HelpModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>("modes");
  const [demoKnob, setDemoKnob] = useState(64);
  const [demoFader, setDemoFader] = useState(100);
  const [demoFull, setDemoFull] = useState(false);
  const [demoNoteRep, setDemoNoteRep] = useState(false);
  const [demoShift, setDemoShift] = useState(false);
  const [demoLoop, setDemoLoop] = useState(false);
  const [demoBankIdx, setDemoBankIdx] = useState(0);
  const [demoSceneStored, setDemoSceneStored] = useState<null | "A" | "B">(null);
  const [demoActiveScene, setDemoActiveScene] = useState<null | "A" | "B">(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const demoBank = BANK_LABELS[demoBankIdx]!;
  const tabContent = useMemo(() => {
    switch (activeTab) {
      case "pads":
        return <PadsTab demoFull={demoFull} setDemoFull={setDemoFull} demoNoteRep={demoNoteRep} setDemoNoteRep={setDemoNoteRep} />;
      case "tracks":
        return <TracksTab />;
      case "backing":
        return <BackingTab demoLoop={demoLoop} setDemoLoop={setDemoLoop} />;
      case "recording":
        return <RecordingTab />;
      case "controls":
        return (
          <ControlsTab
            demoKnob={demoKnob}
            setDemoKnob={setDemoKnob}
            demoFader={demoFader}
            setDemoFader={setDemoFader}
            demoBank={demoBank}
            demoBankIdx={demoBankIdx}
            setDemoBankIdx={setDemoBankIdx}
            demoShift={demoShift}
            setDemoShift={setDemoShift}
            demoSceneStored={demoSceneStored}
            setDemoSceneStored={setDemoSceneStored}
            demoActiveScene={demoActiveScene}
            setDemoActiveScene={setDemoActiveScene}
          />
        );
      case "toolbar":
        return <ToolbarTab />;
      case "modes":
      default:
        return <ModesTab />;
    }
  }, [activeTab, demoActiveScene, demoBank, demoBankIdx, demoFader, demoFull, demoKnob, demoLoop, demoNoteRep, demoSceneStored, demoShift]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="PabPad help"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        className={cn(
          "relative grid max-h-[88dvh] w-full max-w-5xl grid-rows-[auto_auto_1fr]",
          "rounded-2xl bg-neutral-950 text-neutral-200 shadow-2xl ring-1 ring-white/10"
        )}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md p-1.5 text-neutral-400 hover:bg-white/5 hover:text-white"
          aria-label="Close help"
        >
          <X size={16} />
        </button>

        <header className="px-5 pb-3 pt-5 sm:px-6">
          <h2 className="text-lg font-bold tracking-wider">
            PABPAD <span className="text-[var(--accent)]">HELP</span>
          </h2>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-neutral-400">
            Use the tabs to see how each view behaves. The same buttons can do different things in Pads, Track Editor, and Backing Pads mode.
          </p>
        </header>

        <div className="overflow-x-auto border-y border-white/10 px-3 py-2 sm:px-4">
          <div className="flex min-w-max gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ring-1 transition-colors",
                  activeTab === tab.id
                    ? "bg-[var(--accent)]/15 text-[var(--accent)] ring-[var(--accent)]/50"
                    : "bg-neutral-900/50 text-neutral-400 ring-white/10 hover:text-white"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-auto px-5 py-5 sm:px-6">
          {tabContent}
          <p className="mt-6 text-[10px] text-neutral-500">
            Press <Kbd>Esc</Kbd> or click outside the dialog to close.
          </p>
        </div>
      </div>
    </div>
  );
}

function ModesTab() {
  return (
    <div className="space-y-5">
      <Section title="Main Modes">
        <div className="grid gap-3 md:grid-cols-3">
          <ModeCard
            icon={<Grid3X3 size={18} />}
            title="Pads"
            body="The 4x4 performance grid. Click pads, change sound, record a current pattern, use note repeat, banks, scenes, knobs, and faders."
          />
          <ModeCard
            icon={<Rows3 size={18} />}
            title="Track Editor"
            body="Arrange clips on Track 1-5. The left panel collapses to Play and Loop when clips exist so the editor stays focused."
          />
          <ModeCard
            icon={<Music2 size={18} />}
            title="Backing Pads"
            body="Play all non-muted tracks while returning to Pads. You can jam, record a new independent pattern, and keep the arrangement running."
          />
        </div>
      </Section>

      <Section title="Arrangement Waveform View">
        <DemoRow demo={<ArrangementWaveformDemo />}>
          <ul className="list-disc space-y-1 pl-5">
            <li>This is still <b>Pads</b> mode, but it appears after you have clips in the Track Editor and no current pending recording.</li>
            <li>The right side shows a waveform overview of all non-muted tracks instead of the live pad grid.</li>
            <li>The left panel disappears so the waveform can use the full width, and <b>Play</b>, <b>Loop</b>, and <b>Record</b> move to the top of the waveform panel.</li>
            <li><b>Play</b> runs all non-muted track clips and moves the waveform playhead through the arrangement.</li>
            <li><b>Record</b> starts a new current pattern from this pads view. Once you record, the normal colored performance pads return.</li>
            <li>Use the toolbar <Rows3 size={11} className="inline -mt-0.5" /> button to go back to the Track Editor list.</li>
          </ul>
        </DemoRow>
      </Section>

      <Section title="Button Behavior By Mode">
        <div className="overflow-hidden rounded-lg ring-1 ring-white/10">
          <table className="w-full min-w-[680px] text-left text-xs">
            <thead className="bg-white/5 text-[10px] uppercase tracking-wider text-neutral-400">
              <tr>
                <th className="px-3 py-2">Button</th>
                <th className="px-3 py-2">Pads</th>
                <th className="px-3 py-2">Track Editor</th>
                <th className="px-3 py-2">Backing Pads</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-neutral-300">
              <ModeRow button="Play / Stop" pads="Plays current recording if one is pending; otherwise plays arranged tracks." tracks="Plays or stops all non-muted editor tracks from the current arrangement." backing="Starts/stops all tracks while pads stay visible. Disabled during backing recording." />
              <ModeRow button="Record" pads="Records a fresh current pattern from pad hits and control changes." tracks="Disabled in the editor." backing="Starts all tracks if needed and records a new independent current pattern over them." />
              <ModeRow button="Loop" pads="Loops current recording or arrangement playback." tracks="Loops the editor arrangement." backing="Loops all backing tracks; loop changes adjust to edited track lengths immediately." />
              <ModeRow button="Sound" pads="Changes the voice for new live pad hits and records sound changes into the current pattern." tracks="Used for new clips or current pattern sound; existing clips keep saved sounds." backing="Enabled for live pad hits only. Tracks and recorded playback keep their saved sounds." />
              <ModeRow button="Track Editor / Full Window" pads="Switches the right side from pads to the track list." tracks="Shows as Full Window and exits the editor into the full-width arrangement view." backing="When play-all backing mode is active, the editor button keeps the normal Show Pads behavior." />
              <ModeRow button="Play All Tracks + Pads" pads="Latches backing mode and plays all non-muted tracks while showing pads." tracks="Switches to pads without restarting an already-running arrangement." backing="Turns backing mode off and stops the arrangement." />
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

function PadsTab({ demoFull, setDemoFull, demoNoteRep, setDemoNoteRep }: {
  demoFull: boolean;
  setDemoFull: React.Dispatch<React.SetStateAction<boolean>>;
  demoNoteRep: boolean;
  setDemoNoteRep: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <div className="space-y-5">
      <Section title="Playing Pads">
        <DemoRow
          demo={
            <div className="grid grid-cols-4 gap-1.5 rounded-md bg-neutral-900 p-2 ring-1 ring-black/60">
              {["#ff2ea6", "#3b6bff", "#2ad17a", "#ff3340", "#ff2ea6", "#3b6bff", "#2ad17a", "#ff3340", "#ff2ea6", "#3b6bff", "#2ad17a", "#ff3340", "#7a5cff", "#3b6bff", "#2ad17a", "#ff3340"].map((color, i) => (
                <div
                  key={i}
                  className="h-7 w-7 rounded ring-1 ring-black/60"
                  style={{ background: `color-mix(in oklab, ${color} 35%, #0a0a0c)` }}
                />
              ))}
            </div>
          }
        >
          <ul className="list-disc space-y-1 pl-5">
            <li>Click, tap, or use the keyboard rows to trigger pads.</li>
            <li>Pad bank A/B/C changes the note range, giving 48 playable pads across the same 4x4 surface.</li>
            <li>F2 sets live pad velocity unless Full Level is on.</li>
            <li>Sound changes affect new live pad hits. Existing clips keep the sound they were saved with.</li>
          </ul>
        </DemoRow>
      </Section>

      <Section title="Arrangement Waveform">
        <DemoRow demo={<ArrangementWaveformDemo />}>
          <ul className="list-disc space-y-1 pl-5">
            <li>The waveform view appears when track clips exist, pads are visible, and there is no pending current recording.</li>
            <li>It means the app is ready to play the arranged tracks from the pads view without showing playable pad buttons.</li>
            <li>The left panel is hidden in this view; compact transport controls sit above the waveform.</li>
            <li>Click <b>Record</b> to create a fresh current pattern; click the Track Editor toolbar button to manage clips.</li>
            <li>When the arrangement is actively playing from this state, the playhead shows where all tracks are in the timeline.</li>
          </ul>
        </DemoRow>
      </Section>

      <Section title="Pad Modifiers">
        <DemoRow
          demo={
            <div className="flex flex-col gap-2 p-2">
              <CtrlButton label="FULL" sub="LEVEL" color="#3b6bff" active={demoFull} onClick={() => setDemoFull((v) => !v)} />
              <CtrlButton label="NOTE" sub="REPEAT" color="#3b6bff" active={demoNoteRep} onClick={() => setDemoNoteRep((v) => !v)} />
            </div>
          }
        >
          <ul className="list-disc space-y-1 pl-5">
            <li><b>Full Level</b> makes every new pad hit velocity 127.</li>
            <li><b>Note Repeat</b> retriggers held pads every 125 ms and records those repeated hits.</li>
            <li>Releasing one pad stops repeat for that pad only.</li>
            <li>Turning Note Repeat off stops every active repeat timer immediately.</li>
          </ul>
        </DemoRow>
      </Section>

      <Section title="Keyboard">
        <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
          <Kbd>1 2 3 4</Kbd><span>Top row, Pads 13-16</span>
          <Kbd>Q W E R</Kbd><span>Pads 9-12</span>
          <Kbd>A S D F</Kbd><span>Pads 5-8</span>
          <Kbd>Z X C V</Kbd><span>Bottom row, Pads 1-4</span>
          <Kbd>Space</Kbd><span>Play / stop</span>
          <Kbd>Shift</Kbd><span>SHIFT modifier while held</span>
        </div>
      </Section>
    </div>
  );
}

function TracksTab() {
  return (
    <div className="space-y-5">
      <Section title="Track Editor">
        <ul className="list-disc space-y-1 pl-5">
          <li>The editor has a muted <b>Recorded</b> lane at the top and five playable tracks below it.</li>
          <li>Use <Plus size={11} className="inline -mt-0.5" /> to add the current recorded pattern to the selected track. The button is enabled only when a current pattern exists.</li>
          <li>Adding the current pattern clears the local recording and starts all tracks from the beginning.</li>
          <li>Dragging moves clips on the timeline. Option-drag copies.</li>
          <li>Adding or removing clips while playback is active updates the arrangement immediately, including the longest-track loop length.</li>
        </ul>
      </Section>

      <Section title="Left Panel In Track Editor">
        <ul className="list-disc space-y-1 pl-5">
          <li>When clips exist, the left side shows only <b>Play</b> and <b>Loop</b>.</li>
          <li><b>Play</b> starts all non-muted tracks. It does not auto-add the current recording.</li>
          <li><b>Loop</b> repeats the editor arrangement and follows timeline edits immediately.</li>
          <li>Record is hidden/disabled in the editor so new recordings are made from the pads view.</li>
        </ul>
      </Section>

      <Section title="Track Row Buttons">
        <ButtonLine icon={<Play size={12} />} title="Row Play" body="Plays just that track from the beginning." />
        <ButtonLine icon={<span className="text-[10px] font-bold">M</span>} title="Mute" body="Removes the row from all-track playback without deleting clips." />
        <ButtonLine icon={<Rows3 size={12} />} title="Copy / Move" body="Use drag gestures for clip placement; row controls help manage clips in place." />
        <ButtonLine icon={<Trash2 size={12} />} title="Delete" body="Deletes the selected clip or row content depending on the button location." />
      </Section>
    </div>
  );
}

function BackingTab({ demoLoop, setDemoLoop }: {
  demoLoop: boolean;
  setDemoLoop: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <div className="space-y-5">
      <Section title="Play All Tracks While Showing Pads">
        <DemoRow
          demo={
            <div className="grid grid-cols-2 gap-2 p-2">
              <button className="h-8 rounded-md bg-neutral-950 text-emerald-300 ring-1 ring-emerald-400/40">
                <Square size={12} className="mx-auto" fill="currentColor" />
              </button>
              <CtrlButton label={demoLoop ? "LOOP ON" : "LOOP"} color="#2ad17a" active={demoLoop} onClick={() => setDemoLoop((v) => !v)} className="h-8 w-full" />
            </div>
          }
        >
          <ul className="list-disc space-y-1 pl-5">
            <li>The music-note toolbar button enters a latched backing mode: all non-muted tracks play while pads stay visible.</li>
            <li>If tracks are already playing in the editor, entering this mode keeps the current timers running instead of restarting the arrangement.</li>
            <li>With backing mode off, the editor toggle reads <Maximize2 size={11} className="inline -mt-0.5" /> <b>Full Window</b> and opens the full-width arrangement view; with backing mode on, it remains the normal Show Pads control.</li>
            <li>Sound overlap is avoided by continuing the existing arrangement instead of launching a second one.</li>
            <li>Highlighted pads show which visible pad slots may sound during backing playback, even when the source was recorded on another bank.</li>
          </ul>
        </DemoRow>
      </Section>

      <Section title="Live Jam Rules">
        <ul className="list-disc space-y-1 pl-5">
          <li>Live pad clicks play over the backing tracks.</li>
          <li>The Sound picker is enabled, but it affects only live pad hits you click or press.</li>
          <li>Track clips and recorded playback keep their saved sounds.</li>
          <li>K1, K2, and F1 are global live performance controls in this mode and apply from now on, including future loop passes.</li>
          <li>Recorded clip automation does not rewrite the backing clips while you jam.</li>
        </ul>
      </Section>

      <Section title="Recording Over Backing">
        <ul className="list-disc space-y-1 pl-5">
          <li>Record starts all tracks if needed, keeps pads visible, and captures a new independent current pattern.</li>
          <li>While recording over backing, the Play / Stop button is disabled.</li>
          <li>When recording stops, the app plays all tracks plus the new current pattern from the beginning.</li>
          <li>Use Track Editor and the add-current-pattern button when you want to commit that pattern to a track.</li>
        </ul>
      </Section>
    </div>
  );
}

function RecordingTab() {
  return (
    <div className="space-y-5">
      <Section title="Current Pattern">
        <ul className="list-disc space-y-1 pl-5">
          <li>Recording captures pad hits, note-off events, sound changes, bank changes, and knob/fader CC automation.</li>
          <li>After recording stops, the current pattern is pending but not automatically added to the track editor.</li>
          <li><b>Clear recording</b> deletes only the current local pattern. It does not delete track-editor clips and does not stop playback.</li>
          <li>After you add the current pattern to a selected track, the local recording is cleared.</li>
        </ul>
      </Section>

      <Section title="Adding To Tracks">
        <ul className="list-disc space-y-1 pl-5">
          <li>Switch to Track Editor and select the target track row.</li>
          <li>Click <Plus size={11} className="inline -mt-0.5" /> to add the current pattern to that row.</li>
          <li>The add button is disabled when no current recorded pattern exists.</li>
          <li>Once added, the arrangement restarts from the beginning so you can hear the new timeline immediately.</li>
        </ul>
      </Section>

      <Section title="Playback">
        <ul className="list-disc space-y-1 pl-5">
          <li>In Pads mode, Play replays the current pattern if one is pending.</li>
          <li>In Track Editor, Play runs all non-muted tracks and does not auto-add pending recordings.</li>
          <li>In Backing Pads mode, Play starts/stops all tracks while the pads remain visible.</li>
        </ul>
      </Section>
    </div>
  );
}

function ControlsTab({
  demoKnob,
  setDemoKnob,
  demoFader,
  setDemoFader,
  demoBank,
  demoBankIdx,
  setDemoBankIdx,
  demoShift,
  setDemoShift,
  demoSceneStored,
  setDemoSceneStored,
  demoActiveScene,
  setDemoActiveScene,
}: {
  demoKnob: number;
  setDemoKnob: React.Dispatch<React.SetStateAction<number>>;
  demoFader: number;
  setDemoFader: React.Dispatch<React.SetStateAction<number>>;
  demoBank: string;
  demoBankIdx: number;
  setDemoBankIdx: React.Dispatch<React.SetStateAction<number>>;
  demoShift: boolean;
  setDemoShift: React.Dispatch<React.SetStateAction<boolean>>;
  demoSceneStored: null | "A" | "B";
  setDemoSceneStored: React.Dispatch<React.SetStateAction<null | "A" | "B">>;
  demoActiveScene: null | "A" | "B";
  setDemoActiveScene: React.Dispatch<React.SetStateAction<null | "A" | "B">>;
}) {
  return (
    <div className="space-y-5">
      <Section title="Knobs And Faders">
        <DemoRow
          demo={
            <div className="flex items-center gap-4 p-2">
              <Knob label="K1" value={demoKnob} onChange={setDemoKnob} color="#ff3b30" />
              <Fader label="F1" value={demoFader} onChange={setDemoFader} />
            </div>
          }
        >
          <ul className="list-disc space-y-1 pl-5">
            <li><b>K1</b> controls filter cutoff or brightness.</li>
            <li><b>K2</b> controls decay/release length.</li>
            <li><b>F1</b> controls master volume.</li>
            <li><b>F2</b> controls live pad velocity unless Full Level is active.</li>
            <li>In Backing Pads mode, K1/K2/F1 act as live global performance controls from now on.</li>
          </ul>
        </DemoRow>
      </Section>

      <Section title="Banks">
        <DemoRow
          demo={
            <div className="grid grid-cols-3 gap-2 p-2">
              <CtrlButton label={`KNOB ${demoBank}`} sub={`${demoBankIdx + 1}/3`} color="#ff3b30" active onClick={() => setDemoBankIdx((i) => (i + 1) % 3)} />
              <CtrlButton label={`FADER ${demoBank}`} sub={`${demoBankIdx + 1}/3`} color="#3b6bff" active onClick={() => setDemoBankIdx((i) => (i + 1) % 3)} />
              <CtrlButton label={`PAD ${demoBank}`} sub={`${demoBankIdx + 1}/3`} color="#ff2ea6" active onClick={() => setDemoBankIdx((i) => (i + 1) % 3)} />
            </div>
          }
        >
          <ul className="list-disc space-y-1 pl-5">
            <li>Knob Bank and Fader Bank each store three independent pages.</li>
            <li>Pad Bank changes the playable note range for the 4x4 grid.</li>
            <li>Hold or toggle <b>SHIFT</b> to step banks backward.</li>
          </ul>
        </DemoRow>
      </Section>

      <Section title="Scene Snapshots A / B">
        <DemoRow
          demo={
            <div className="flex flex-col gap-2 p-2">
              <CtrlButton
                label="A"
                color="#ff2ea6"
                sub={demoSceneStored === "A" || demoActiveScene === "A" ? (demoActiveScene === "A" ? "●" : "✓") : "—"}
                active={demoActiveScene === "A"}
                onClick={() => { setDemoSceneStored("A"); setDemoActiveScene("A"); }}
                onContextMenu={(e) => { e.preventDefault(); setDemoSceneStored(null); setDemoActiveScene(null); }}
              />
              <CtrlButton
                label="B"
                color="#ff2ea6"
                sub={demoSceneStored === "B" || demoActiveScene === "B" ? (demoActiveScene === "B" ? "●" : "✓") : "—"}
                active={demoActiveScene === "B"}
                onClick={() => { setDemoSceneStored("B"); setDemoActiveScene("B"); }}
                onContextMenu={(e) => { e.preventDefault(); setDemoSceneStored(null); setDemoActiveScene(null); }}
              />
              <CtrlButton label="SHIFT" color="#3b6bff" active={demoShift} onClick={() => setDemoShift((v) => !v)} className="h-8 w-20" />
            </div>
          }
        >
          <ul className="list-disc space-y-1 pl-5">
            <li>Click an empty scene slot to capture K1/K2, F1/F2, Sound, Pad Bank, Knob Bank, and Fader Bank.</li>
            <li>Click a stored slot to recall it.</li>
            <li>SHIFT + click overwrites a stored scene.</li>
            <li>Right-click clears a slot.</li>
            <li>Scenes persist in localStorage across reloads.</li>
          </ul>
        </DemoRow>
      </Section>
    </div>
  );
}

function ToolbarTab() {
  return (
    <div className="space-y-5">
      <Section title="Top Toolbar">
        <DemoRow
          demo={
            <div className="flex flex-wrap items-center gap-1.5 p-2">
              <button className="rounded p-1 text-neutral-400 ring-1 ring-neutral-800"><Trash2 size={11} /></button>
              <button className="rounded p-1 text-neutral-400 ring-1 ring-neutral-800"><Download size={11} /></button>
              <button className="rounded p-1 text-neutral-400 ring-1 ring-neutral-800"><Upload size={11} /></button>
              <button className="rounded p-1 text-neutral-400 ring-1 ring-neutral-800"><Rows3 size={11} /></button>
              <button className="rounded p-1 text-emerald-300 ring-1 ring-emerald-400/40"><Music2 size={11} /></button>
            </div>
          }
        >
          <ul className="list-disc space-y-1 pl-5">
            <li><Trash2 size={11} className="inline -mt-0.5" /> clears the current local recording only.</li>
            <li><Download size={11} className="inline -mt-0.5" /> exports a multitrack session when tracks exist; otherwise exports the current recording.</li>
            <li><Upload size={11} className="inline -mt-0.5" /> imports recordings or multitrack sessions.</li>
            <li><Rows3 size={11} className="inline -mt-0.5" /> / <Grid3X3 size={11} className="inline -mt-0.5" /> toggles between Pads and Track Editor.</li>
            <li><Music2 size={11} className="inline -mt-0.5" /> plays all tracks while showing pads. Press again to turn the mode off.</li>
          </ul>
        </DemoRow>
      </Section>

      <Section title="Preset And Sound Menus">
        <ButtonLine icon={<Library size={12} />} title="Presets" body="Loads a built-in pattern into the selected track or current context." />
        <ButtonLine icon={<Music2 size={12} />} title="Sound" body="Chooses the live pad voice. In Backing Pads mode it affects only pads you press, not track clips." />
      </Section>

      <Section title="Import / Export Notes">
        <ul className="list-disc space-y-1 pl-5">
          <li>Multitrack sessions include tracks, clips, clip sounds, current sound, and selected track.</li>
          <li>Original songs and presets are recorded event data played through the local synth, not audio files.</li>
          <li>Imported session current sound is ignored while Backing Pads mode is active so the live pad voice does not unexpectedly change.</li>
        </ul>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
        {title}
      </h3>
      <div className="text-xs leading-relaxed text-neutral-300">{children}</div>
    </section>
  );
}

function DemoRow({ demo, children }: { demo: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-[auto_1fr]">
      <div className="shrink-0 rounded-md bg-neutral-900/60 p-1.5 ring-1 ring-white/5">
        {demo}
      </div>
      <div>{children}</div>
    </div>
  );
}

function ArrangementWaveformDemo() {
  return (
    <div className="w-48 rounded-md bg-neutral-950 p-2 ring-1 ring-black/70">
      <div className="mb-2 flex items-center justify-between text-[8px] uppercase tracking-wider text-neutral-500">
        <span>All tracks</span>
        <span>2.0s</span>
      </div>
      <div className="mb-2 flex h-12 items-end gap-1 rounded bg-black p-2 ring-1 ring-white/10">
        {Array.from({ length: 28 }, (_, index) => (
          <span
            key={index}
            className="w-1 rounded-full bg-emerald-300/70"
            style={{ height: `${18 + ((index * 17) % 34)}px` }}
          />
        ))}
      </div>
      <div className="space-y-1">
        {[0, 1, 2].map((track) => (
          <div key={track} className="grid grid-cols-[1.5rem_1fr] items-center gap-1">
            <span className="text-[8px] font-bold text-neutral-500">T{track + 1}</span>
            <div className="flex h-5 items-center gap-0.5 rounded bg-black px-1 ring-1 ring-white/10">
              {Array.from({ length: 18 }, (_, index) => (
                <span
                  key={index}
                  className="w-0.5 rounded-full bg-white/45"
                  style={{ height: `${4 + ((index * 11 + track * 5) % 13)}px` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ModeCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-lg bg-neutral-900/50 p-3 ring-1 ring-white/10">
      <div className="mb-2 flex items-center gap-2 text-white">
        <span className="text-[var(--accent)]">{icon}</span>
        <h4 className="text-xs font-bold uppercase tracking-wider">{title}</h4>
      </div>
      <p className="text-xs leading-relaxed text-neutral-400">{body}</p>
    </div>
  );
}

function ModeRow({ button, pads, tracks, backing }: { button: string; pads: string; tracks: string; backing: string }) {
  return (
    <tr>
      <td className="px-3 py-2 font-bold text-white">{button}</td>
      <td className="px-3 py-2">{pads}</td>
      <td className="px-3 py-2">{tracks}</td>
      <td className="px-3 py-2">{backing}</td>
    </tr>
  );
}

function ButtonLine({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="mb-2 flex items-start gap-2 text-xs">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-neutral-900 text-neutral-300 ring-1 ring-white/10">
        {icon}
      </span>
      <span>
        <b className="text-white">{title}</b>
        <span className="text-neutral-400"> - {body}</span>
      </span>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-neutral-200">
      {children}
    </kbd>
  );
}
