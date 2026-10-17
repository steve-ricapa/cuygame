# Fuentes y licencias de los recursos

Resumen de de dónde viene cada recurso y bajo qué licencia, para poder publicar
el juego con tranquilidad y mantener los créditos del proyecto original.

---

## Entorno y personajes secundarios — Kenney «Pixel Platformer» (CC0)

- **Autor:** Kenney — <https://kenney.nl>
- **Pack:** *Pixel Platformer (1.2)*
- **Licencia:** Creative Commons Zero (CC0) — dominio público.
  <https://creativecommons.org/publicdomain/zero/1.0/>
- **Copia de la licencia:** `public/assets/kenney_pixel-platformer/License.txt`

Archivos usados (en `public/assets/kenney_pixel-platformer/Tilemap/`):

| Archivo | Uso |
| ------- | --- |
| `tilemap_packed.png` | Terreno, adornos, bloques, objetos |
| `tilemap-characters_packed.png` | Enemigos/variantes |
| `tilemap-backgrounds_packed.png` | Fondos con parallax |

En CC0 se puede usar para fines personales, educativos y comerciales. Se agradece
(y aquí se mantiene) el crédito a Kenney, aunque no es obligatorio.

---

## Protagonista — arte original del cuy (MIT, de este proyecto)

El cuy **no** usa ningún pack de pago. Se dibuja por **parámetros** (JS puro, sin
Phaser) y se exporta a PNG:

- **Generador:** `src/assets/cuyRaster.js` (pixel art lateral: cuerpo, orejas,
  ojo con brillo, patitas, pañuelo rosa; animaciones idle/run/jump/fall/land/
  celebrate/surprise).
- **Exportador:** `tools/gen-cuy.mjs` (`npm run art:cuy`) — escribe el PNG con un
  codificador PNG propio (zlib de Node), sin dependencias.
- **Salida:** `public/assets/cuy/player.png` (spritesheet 32×32 por frame) y
  `public/assets/cuy/player.animations.json` (manifiesto).
- **Licencia:** MIT, igual que el código del proyecto (ver `LICENSE`).

Regenerar tras cambiar el dibujo:

```bash
npm run art:cuy
```

---

## Retrato del cuy — freepixel.art (recurso gratuito)

- **Archivo:** `public/assets/cuy/portrait.png`
- **Origen:** recurso gratuito de <https://freepixel.art> (ver el comentario en
  `src/scenes/PreloadScene.js`).
- ⚠️ **Antes de publicar**, conviene reconfirmar en freepixel.art los términos
  exactos del recurso y, si el autor lo pide, añadirlo a los créditos visibles o
  sustituirlo por un retrato dibujado con `tools/gen-cuy.mjs` (así todo el arte
  del cuy sería 100 % original).

---

## Audio — sintetizado en vivo (original, MIT)

- **Archivos:** `src/audio/sfx.js` (efectos) y `src/audio/music.js` (música).
- Los efectos y las pistas de respaldo se generan con la **Web Audio API**.
  Si falta un MP3, suena la pista sintetizada original.
- Licencia MIT **solo para el código y el audio sintetizado**; no para los MP3
  comerciales publicados por Steve.

---

## Fotos y música personal aportadas por Steve

Steve autorizó incluir las cinco fotos y los cinco MP3 de esta versión en el
repositorio público y Vercel. No se ofrecen bajo la licencia MIT del código:

- Fotos: `01-nina.jpeg`, `02-actual.jpeg`, `03-juntos.jpeg`,
  `actual-guapa1.jpeg`, `cuy-gracioso gritando.jpeg` en `public/personal/fotos/`.
- Música: las cinco pistas `.mp3` de `public/personal/musica/`.
- No incluidos: `public/personal/carta.txt`, `public/personal/dedicatoria.mp3`
  y archivos de `asset-inbox/`.

**Responsabilidad de quien publica:** contar con derechos de distribución de
las canciones y consentimiento para publicar las fotos. Los archivos quedan
descargables por cualquiera con acceso al repositorio o al sitio.

---

## Código y contenido heredados de AstroHop

- Código original, niveles y audio sintetizado de **AstroHop** (MIT).
- Los archivos `src/levels/level4.js`, `level5.js`, `bonus11.js`, `bonus15.js` y
  las escenas `GameOverScene`/`EndScene` se conservan como referencia/crédito pero
  **no se registran** en la campaña del regalo.
