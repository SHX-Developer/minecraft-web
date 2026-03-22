# VoxelCraft MVP (Three.js)

Minecraft-like browser MVP on HTML/CSS/JavaScript (ES modules) + Three.js.

## Features

- First-person controls with Pointer Lock and corrected forward/back movement.
- `Shift` crouch: reduced movement speed + lower camera + shorter collision height.
- Double-tap `W` sprint (forward only) with auto-stop rules.
- Procedural chunk world (terrain layers, water level, beaches, sparse trees).
- Chunk mesh batching with hidden-face culling.
- Separate opaque / transparent rendering path (water is translucent).
- Texture atlas UV mapping with per-face support (`top/side/bottom`).
- Block interaction:
  - LMB break (with lightweight particle burst).
  - RMB place next to targeted face.
  - Border edits rebuild neighboring chunk meshes.
- Hotbar selection:
  - Keyboard `1..9`.
  - Mouse wheel with cyclic wrapping.
- Underwater mode:
  - Blue tint overlay.
  - Reduced visibility via fog.
  - Swim movement + vertical control.
- Day/night cycle:
  - Day 2 min + night 2 min.
  - Dynamic sky/fog/light transitions.
  - Simple sun and moon objects.
- Optional background music system that starts only after user interaction.
- Procedural SFX:
  - block breaking click/crunch
  - footsteps (different cadence for sprint/crouch/water)

## Run Locally

1. Open this folder in VS Code (or any editor with static hosting).
2. Start a local server:
   - Live Server: right click `index.html` -> `Open with Live Server`
   - or terminal: `npx serve .` / `python -m http.server`
3. Open the served URL in browser.
4. Click inside the canvas to lock pointer.

## Controls

- `W` forward, `S` backward, `A/D` strafe
- `Space` jump (or swim up in water)
- `Shift` crouch (or swim down in water)
- Double-tap `W` to sprint forward
- `Mouse` look around
- `LMB` break block
- `RMB` place block
- `Mouse wheel` cycle hotbar slot
- `1..9` direct hotbar slot select
- `Esc` unlock pointer

## Music Setup

- Put your files in `assets/audio/`.
- Default expected names are:
  - `assets/audio/13. Aria Math.mp3` (detected local example)
  - `assets/audio/track1.mp3`
  - `assets/audio/track2.mp3`
- You can change playlist paths and volume in `src/utils/constants.js`:
  - `MUSIC_TRACKS`
  - `MUSIC_VOLUME`
  - `SFX_MASTER_VOLUME`
  - `SFX_BREAK_VOLUME`
  - `SFX_FOOTSTEP_VOLUME`
- If files are missing, music system stays idle without crashing.

## Project Structure

```text
index.html
style.css
src/
  main.js
  core/
    game.js
    renderer.js
    camera.js
    input.js
  world/
    world.js
    chunk.js
    chunkMesh.js
    blockTypes.js
    worldGenerator.js
  player/
    player.js
    playerController.js
    raycast.js
  ui/
    hotbar.js
  systems/
    dayNightCycle.js
    waterSystem.js
  audio/
    musicManager.js
    sfxManager.js
  effects/
    particlesManager.js
  utils/
    constants.js
    helpers.js
assets/
  textures/
    atlas.png
  audio/
    .gitkeep
README.md
```

## Notes

- This is still MVP scope: no inventory, mobs, save/load, multiplayer, crafting.
- Water physics are intentionally lightweight and gameplay-oriented.
