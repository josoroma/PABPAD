# PabPad

PabPad is a browser-based music pad workstation built with Next.js. It lets you play a 4x4 pad grid, shape synth sounds with knobs and faders, record patterns, arrange clips across tracks, and jam over built-in original songs.

[![PabPad screenshot](https://img.youtube.com/vi/lIWBI1QEz7k/hqdefault.jpg)](https://www.youtube.com/watch?v=lIWBI1QEz7k)

## What You Can Do

- Play expressive pads with keyboard or mouse input.
- Pick from bass, keys, strings, brass, winds, lead, pad, drum, and sound-effect voices.
- Shape playback with macro knobs, faders, banks, scenes, note repeat, and full-level mode.
- Record live pad performances and controller changes as patterns.
- Arrange recorded or built-in clips in the Track Editor.
- Play all non-muted tracks as an arrangement or as backing tracks while pads stay visible.
- Load built-in Originals such as Night Drive, Thunder, Pursuit, House Bass, and Midnight Trap.
- Save and load sessions as JSON.

## Tech Stack

- Next.js 16 with Turbopack
- React 19
- TypeScript
- Tailwind CSS 4
- Tone.js for synthesis and audio playback
- WaveSurfer.js for arrangement and pattern waveform views
- Jotai for local controller state
- lucide-react for icons
- Sonner for toast notifications

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the app at:

```text
http://localhost:3000
```

## Available Scripts

```bash
npm run dev
```

Runs the local development server with Turbopack.

```bash
npm run build
```

Builds the production app.

```bash
npm run start
```

Starts the production server after a build.

```bash
npm run lint
```

Runs ESLint across the project.

## Basic Workflow

1. Use the pad grid or keyboard shortcuts to play sounds.
2. Choose a sound from the toolbar sound picker.
3. Press Record to capture a pattern.
4. Open the Track Editor and add the pattern to a track.
5. Arrange clips, mute tracks, preview rows, and play the arrangement.
6. Use Play All Tracks while showing pads to keep the arrangement running as backing while you jam.

## Main Views

### Pads

The performance view for live playing, sound selection, recording, note repeat, banks, scenes, knobs, and faders.

### Track Editor

The arrangement view for placing clips across tracks. When backing mode is off, the editor toggle changes to Full Window so you can jump to the full-width arrangement waveform view.

### Backing Pads

A latched mode where all non-muted tracks continue playing while pads remain visible for live performance or new recording.

## Keyboard Shortcuts

- `1 2 3 4`, `q w e r`, `a s d f`, `z x c v`: play the 16 visible pads.
- `Space`: play or stop.
- `Shift`: hold for shifted pad behavior.

## Project Structure

```text
app/                    Next.js app entry points
components/pabpad/      PabPad UI components and feature modules
lib/audio/              Tone.js audio engine, sounds, presets, drums, FX, and instruments
lib/cn.ts               Class name utility
public/                 Static assets
```

## Validation

Run these before shipping changes:

```bash
npx tsc --noEmit
npm run lint
npm run build
```