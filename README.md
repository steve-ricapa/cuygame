# Cuy Adventure — Misión Cumpleaños 🐹

Una aventura de cumpleaños de tres niveles, hecha con Phaser 3 y Vite a partir
de [AstroHop](https://github.com/nunoamorim99/AstroHop). El contenido personal
se mantiene fuera de Git; consulta [PERSONALIZAR.md](PERSONALIZAR.md).

## Proyecto de origen

Astro Hop is a retro, Mario-style 2D platformer built with Phaser 3 and Vite (vanilla JS), playable on desktop and mobile from the same URL and deployed to GitHub Pages.
The project has two goals running in parallel. The first is hands-on game development — physics and game feel, sprite animation, tilemap level design, power-up state machines, mobile touch controls, and a full game-flow loop. The second is using the build as a way to understand the Claude Fable 5 model: how far it can be pushed as a coding partner, where it excels, and where it needs steering, across everything from architecture decisions to spritesheet analysis and asset generation.
Built with original assets (not Nintendo IP), starting from Kenney.nl's CC0 pixel-art packs.

**▶ Proyecto original AstroHop:** https://nunoamorim99.github.io/AstroHop/

<!-- TODO: screenshot/GIF here, e.g.: ![gameplay](docs/screenshot.png) -->

> **🎂 Esta copia es «Cuy Adventure — Misión Cumpleaños».** Sobre el motor de
> AstroHop se construyó una aventura de 3 niveles como regalo de cumpleaños:
> cofres que revelan fotos personales, un epílogo con carta, vela y recompensa.
> Si vas a personalizarla, empieza por **[PERSONALIZAR.md](PERSONALIZAR.md)**.
> Estado, fuentes de arte y pruebas: [`docs/`](docs/). Los créditos de abajo
> corresponden al proyecto original y se mantienen.

## Esta versión del juego

- Tres niveles con el cuy como protagonista, cofres obligatorios, dos cofres
  sorpresa opcionales, mensajes de bloques y una celebración final.
- Fotos completas que se confirman antes de abrir la meta; álbum de recuerdos,
  carta opcional y vale de cumpleaños descargable como PNG.
- Controles para teclado y pantalla táctil, en vertical y horizontal; sin
  pantalla completa ni orientación obligatorias.
- Música personal opcional (si falta, se usa música sintetizada original).
- Las fotos y los MP3 **no están en Git**: un despliegue desde este repositorio
  muestra «Foto pendiente» y usa la música sintetizada. Para entregar el regalo
  completo, consulta [PERSONALIZAR.md](PERSONALIZAR.md) y empaqueta una copia
  privada de `dist/` con los archivos autorizados.

El código y créditos del proyecto original permanecen en el historial y en la
sección de licencias de abajo.

## Tech stack

- [Phaser 3](https://phaser.io/) — game engine (arcade physics, scenes, scaling)
- [Vite](https://vitejs.dev/) — dev server and bundler (vanilla JavaScript, no framework)
- Deployed to GitHub Pages by [GitHub Actions](.github/workflows/deploy.yml) on every push to `main`

## Run it locally

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

## Controls

| Action | Desktop | Mobile |
| ------ | ------- | ------ |
| Move   | Arrow keys or A/D | On-screen ◀ ▶ |
| Jump   | Space, W or ↑ (hold for higher jump) | On-screen **A** button |
| Pause  | Esc or P | ▐▐ button (top right) |
| Sound on/off | ♪ button | ♪ button |
| Fullscreen | ⛶ button | ⛶ button (Android) |

The touch pad supports press-and-hold, sliding between buttons without
lifting, and multi-touch (run + jump at once). In portrait the game
sits above a handheld-style control deck; in landscape the buttons overlay
the screen edges semi-transparently.

## Testing the mobile layout

**On desktop:** `F12` → device toolbar (`Ctrl+Shift+M`) → pick a phone
preset → reload. The touch controls appear below the game.

**On a real phone (same Wi-Fi):**

```bash
npm run dev -- --host
```

Open the `Network:` URL Vite prints (e.g. `http://192.168.1.x:5173`) in the
phone's browser.

## Credits & license

- Code, levels and synthesized audio: made for this project — [MIT](LICENSE)
- Art: [Pixel Platformer](https://kenney.nl/assets/pixel-platformer) by
  [Kenney](https://kenney.nl) — License: [CC0](https://creativecommons.org/publicdomain/zero/1.0/)
- Engine: [Phaser 3](https://phaser.io/) (MIT)
