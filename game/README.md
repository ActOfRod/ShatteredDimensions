# Rainfall — a RoR2-inspired mobile roguelike

A mobile-first 3D roguelike in the spirit of **Risk of Rain 2**. Built with
**Vite + React + Three.js (React Three Fiber)**. It runs in any modern
mobile browser today and can be packaged as a native iOS/Android app later
with Capacitor.

## What's in the first build

- **1 playable survivor: Commando**
  - Primary: **Double Tap** (auto-fires)
  - Secondary: **Phase Round** (piercing shot)
  - Utility: **Tactical Dive** (dash + i-frames)
  - Special: **Suppressive Fire** (6-shot spread burst)
- **3 worlds** (stages): Distant Roost → Scorched Acres → Abyssal Depths (then loops with scaling)
- **Enemies:** Lemurians (melee), Beetles (melee), Lesser Wisps (ranged), **Stone Titan** boss
- **Items:** 10 stacking items across common / uncommon / legendary rarities
- **Chests** you buy with gold — random item per rarity tier
- **Teleporter event:** find it, stand on it 30 s, kill the boss, advance
- **Director-style enemy spawning**, difficulty rises with time & stage
- **Mobile HUD:** virtual twin-stick controls (nipplejs), HP / XP / gold / timer / items, cooldown buttons

## Run it locally

Requires Node 18+.

```bash
npm install
npm run dev
```

Open the URL Vite prints. The config uses `host: true` so the dev server
is reachable on your LAN — see the next section.

## Play it on your phone while developing

You have three options, from fastest to most production-like:

### Option 1 — LAN (Wi-Fi) dev server (fastest; hot reload on phone)

1. Make sure your phone and computer are on **the same Wi-Fi network**.
2. Run `npm run dev`.
3. Vite prints two URLs — use the **Network** one, e.g. `http://192.168.1.23:5173`.
4. Open that URL in your phone's browser (Safari or Chrome).
5. Add to Home Screen for a fullscreen, app-like experience (iOS: Share → *Add to Home Screen*; Android: browser menu → *Install app*).

Troubleshooting:
- If it won't load, your firewall is probably blocking port 5173. On macOS System Settings → Network, on Windows allow Node through the firewall.
- If you're on a public / hotel network, enable a phone hotspot and connect both devices to it.

### Option 2 — Public tunnel (test from anywhere, e.g. on cellular)

Use `ngrok` or Cloudflare Tunnel to expose your local dev server over HTTPS:

```bash
# In a new terminal while `npm run dev` is running:
npx ngrok http 5173
```

Open the `https://…ngrok-free.app` URL it prints on your phone.

### Option 3 — Deploy a build to the web

Push this project to GitHub, then deploy with zero config to:
- **Vercel:** `vercel` (or Import on vercel.com)
- **Netlify:** `netlify deploy --prod` (or drag-drop the `dist/` folder)
- **Cloudflare Pages / GitHub Pages**: works too — just serve `dist/`.

`npm run build` produces a static `dist/` folder.

### Option 4 — Wrap as a native iOS / Android app (Capacitor)

When you're ready to ship to stores or test native features (haptics, full-screen, no URL bar, etc.), add Capacitor:

```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android @capacitor/ios
npx cap init "Rainfall" "com.yourname.rainfall" --web-dir=dist
npm run build
npx cap add android
npx cap add ios
npx cap sync
npx cap open android   # or: npx cap open ios
```

From Android Studio / Xcode you can install directly onto your phone over USB.

## Controls

- **Mobile**
  - Left stick — move
  - Right stick — aim & fire (auto-fires while held)
  - Right-side buttons — secondary, dash, special, fire toggle
- **Desktop (for testing)**
  - WASD / arrows — move
  - Space — fire
  - E — secondary
  - Shift — dash
  - Q or R — special

## Project structure

```
src/
  game/
    types.ts          Shared TS types (characters, worlds, items, enemies)
    characters.ts     Character definitions & abilities. Add new survivors here.
    worlds.ts         World/stage definitions. Add new stages here.
    items.ts          Stacking items + default stats
    enemies.ts        Enemy stat blocks
    store.ts          zustand store: state + actions (runs, inventory, etc.)
    GameLoop.tsx      Frame-by-frame simulation (movement, AI, spawner, combat)
  render/
    World.tsx         Arena terrain, sky, fog, props for the current world
    Player.tsx        Player mesh, hit flash, dash effect
    Enemies.tsx       Visual mesh per enemy kind + HP bars (+ boss bar)
    Projectiles.tsx   Instanced projectile renderer
    Pickups.tsx       Gold coins, chests, teleporter
    DamageNumbers.tsx Floating combat text
    CameraRig.tsx     Top-down-ish RoR2 camera following player
  ui/
    HUD.tsx           On-screen HP/XP/gold/timer/inventory/prompts
    Joystick.tsx      nipplejs virtual joystick wrapper
    MobileControls.tsx Twin sticks + ability buttons + keyboard fallback
    Menus.tsx         Main menu, stage-cleared screen, game-over screen
  App.tsx             Composition root
  main.tsx            React entry
  index.css           Root styles (touch disable, safe-area, colors)
```

## Extending the game

- **Add a survivor:** edit `src/game/characters.ts`. Export a new `CharacterDef` and
  append it to `CHARACTERS`. It will appear on the main menu automatically.
  Each ability is just a function that can spawn projectiles / modify stats.
- **Add a world:** edit `src/game/worlds.ts`. Add a `WorldDef` and set `nextWorld`
  to chain stages. Colors drive the ambient look; `propCount` / `arenaRadius`
  tune density and size.
- **Add an item:** edit `src/game/items.ts`. Each item has an `apply(stacks, stats)`
  function — it is re-run from scratch whenever inventory changes.
- **Add an enemy:** edit `src/game/enemies.ts` to add an `EnemyDef`, then extend
  the `enemyPool(stageIndex)` in `store.ts` to include it. Custom visuals go in
  `src/render/Enemies.tsx`.
- **Add a boss:** mark an enemy with `isBoss: true` and change the boss spawn
  in `GameLoop.tsx` to pick per-world.

## Known next steps / nice-to-haves

- More survivors (Huntress, Engineer, MUL-T, Artificer)
- Per-world unique bosses & ambient mobs
- Shrines, equipment items, elite affixes
- Persistent unlocks across runs (localStorage)
- Sound effects + music (`<audio>` or Howler.js)
- Particle effects on hit / death (Three.js instanced particles)
- Post-processing bloom via `@react-three/postprocessing`
- Multiplayer (Colyseus / Geckos.io)
- Capacitor splash screen + native haptics

## License

MIT — do whatever.
