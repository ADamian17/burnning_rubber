# Burning Rubber

A one-thumb arcade lane-dodger for iOS and Android. You drive up a highway
against oncoming traffic; the gaps get tighter the longer you survive.

Originally a 2019 browser game built with jQuery. This is the mobile rewrite —
Vite + TypeScript + canvas, wrapped with Capacitor.

## Running it

```bash
cd app
pnpm install
pnpm dev          # browser, or open the LAN URL on a phone
pnpm ios          # build, sync, and open Xcode
```

`pnpm dev --host` prints a LAN address. Opening that in mobile Safari is the
quickest way to test touch and frame rate, because Safari and the Capacitor
shell run the same WKWebView engine.

## Layout

```
app/                 the game
  src/engine/        canvas, fixed-timestep loop, sprite rasteriser
  src/game/          constants, fleet data, game logic
  src/assets/cars/   vehicle sprites (SVG)
  ios/               Capacitor's Xcode project (committed)
design/              design sources — the screens are authored here first
  cars/              vehicle generator output + fleet.json
  ds/                design-system component previews
  screens/           multi-screen canvases synced to Claude Design
  *.dc.html          individual screen artboards
  gen-*.mjs          generators; edit these, not their output
```

## Two rules the code depends on

**Footprint is gameplay.** Traffic varies by width and length, not paint,
because those decide whether a gap is passable. A lane is 98.25pt (393 ÷ 4) and
vehicles run 46pt to 76pt wide. `design/cars/fleet.json` is the source of truth;
`app/src/game/fleet.ts` mirrors it.

**Width is a player stat.** A narrow car physically fits gaps a wide one cannot,
so the garage is a strategic choice rather than a cosmetic one. Hatpin (46pt)
leaves 52pt of slack in a lane; Boarhound (72pt) leaves 26pt.

## Tests

```
pnpm test        invariants — the rules the game is built on
pnpm test:e2e    behaviour and visual snapshots, in WebKit
pnpm test:all    both
```

Snapshots run at two sizes: **393x852**, the canvas everything is designed
against, and **375x812**, the iPhone XS the game is actually played on.
Baselines live beside the spec and are committed; a change that alters a screen
fails until they are re-recorded:

```
pnpm exec playwright test snapshots --update-snapshots
```

Review the new images before committing them. The point of a baseline is that
someone looked at it — regenerating on a failure without looking is the same as
not having the test. It has already happened once: the run snapshot silently
recorded the summary screen twice, because an unattended car crashes before the
screenshot is taken, and `--update-snapshots` writes whatever it is shown.

## Design

Screens are designed before they are built. The artboards in `design/` are the
spec, and `node design/gen-screens.mjs` combines them into the canvases that
sync to Claude Design.

The shared kit — buttons, toggles, plates, meters — lives one preview per
component in `design/ds/`, which is what the Design System pane renders.
`node design/gen-components.mjs` collects those same previews onto a single
`Components.dc.html` canvas, for when you want to see the kit whole rather than
a card at a time. Both read the previews; neither is a second copy of them.

Art direction is late-80s arcade cabinet: `#F28D35` on near-black, Underdog for
display type, Outfit for anything numeric. No HUD element may sit in the bottom
35% of the screen — that space belongs to the player's thumb.

## Status

The engine runs: road, steering, footprint-aware spawning, collision, scoring.
None of the 17 designed screens are wired up yet.

**Audio is unresolved.** The original sound files had unclear licensing and were
removed rather than shipped. New audio needs sourcing before release.

## Credits

Design and code by Adonis D Martin. Vehicle artwork is original to this project.
Typefaces are Underdog and Outfit, both SIL Open Font License 1.1.
