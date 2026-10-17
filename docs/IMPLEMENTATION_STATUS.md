# Estado de implementación — Cuy Adventure: Misión Cumpleaños

Registro del trabajo hecho para convertir **AstroHop** (Phaser 3 + Vite) en un
regalo de cumpleaños. Leyenda: ✅ hecho y verificado · ⚠️ hecho pero pendiente de
verificación visual/datos reales · ⬜ pendiente.

> Última actualización: niveles 2 y 3 más largos, cofres sorpresa con recuerdo
> extra, mensajes de bloque en los 3 niveles y música del menú.
> `npm run build` OK · `npm test` **14/14** OK · `npm run content:check` en
> **«Todo listo. ✔»** (5/5 fotos y música presentes).

---

## Fases

### ✅ F0 — Auditoría y base
- `npm install` y `npm run build` funcionan desde el estado inicial.
- Se mantiene JavaScript (no TypeScript), Phaser 3.90 y Vite 7. Sin
  `npm audit fix` forzado (siguen reportándose vulnerabilidades de dependencias).

### ✅ F1 — Contenido y progreso
- `src/content/birthday.js`: **único** archivo de contenido (títulos, recuerdos,
  epílogo, vale, carta de respaldo, música, emblemas, paleta, ayuda).
- `src/state/save.js`: guardado local versionado (`cuy-adventure.save.v1`) con
  validación y recuperación conservadora. Nunca guarda fotos ni audio.
- Candados coherentes: `canEnterLevel`, `canExitLevel`, `applyConfirmMemory`,
  `allMemoriesConfirmed`. Un guardado de otra campaña o corrupto se descarta.

### ✅ F2 — Niveles (exactamente 3)
- `level1/2/3.js` con cofre (`K`), arco-reja de salida (`G`) y coleccionables
  (`f`/`n`/`s`); tres temas visuales (jardín, atardecer, cielo).
- Niveles 2 y 3 **ampliados** (208 y 210 columnas, antes 162 y 164): un tramo más
  de terreno con plataformas, enemigos y coleccionables, y un **hueco final
  salvable** antes de la zona del cofre y la meta.
- `src/levels/index.js` registra **solo** `level1..3`. Los niveles originales
  `level4/5`, `bonus11/15` y las escenas `GameOverScene`/`EndScene` siguen en
  disco pero **no se registran** (imposible cargarlos por accidente).
- **Mensajes dibujados con bloques** (`SKY_MESSAGES` en `birthday.js`): uno por
  nivel (`CAROLINA QC <3`, `TE AMO CUYEYA`, `FELIZ CUMPLE`), dibujados en el
  cielo con tiles de ladrillo, **elevados** (filas 3–7) y **sin cuerpo de
  física**, así que **nunca estorban el camino**. Fuente propia de bloques
  (`src/assets/blockFont.js`) con `A–Z`, `0–9`, `Ñ`, espacio, `. ! ? -` y `<3`.
- **Cofres sorpresa** (`BONUS_MEMORIES`): uno en el nivel 2 (letra `J`) y otro en
  el 3 (letra `W`), tras el cofre principal y **antes** de la meta. Se distinguen
  por un **lazo que flota** (`gift`); **no** abren la reja ni bloquean nada y
  **no** cuentan para el final: solo guardan un recuerdo extra en el álbum.

### ✅ F3 — Escenas y flujo
- Escenas de campaña: `PreloadScene`, `TitleScene`, `IntroScene`, `GameScene`,
  `HUDScene`, `PauseScene`, `EpilogueScene`.
- Cadena: título → nivel 1 → nivel 2 → nivel 3 → epílogo.
- Se eliminan mecánicas de AstroHop que no aplican (tuberías, banderas, salas
  secretas, power-ups, bolas de fuego, bloques ocultos); el jugador es siempre el
  cuy. La muerte es un reaparecido rápido en un punto seguro (sin vidas ni reloj).
- **Salto fiable (coyote time + búfer):** al correr o al pisar el borde de una
  plataforma, una pulsación de salto ya no se pierde. Se puede saltar ~100 ms
  después de dejar el suelo y el juego recuerda un salto pulsado ~130 ms antes de
  aterrizar. Verificado en sonda headless (10/10 saltos, incluidos los pulsados
  en el aire dentro de la ventana).

### ✅ F4 — Cofres obligatorios y fotos
- El cofre es **obligatorio**: la reja de salida no se abre hasta confirmar el
  recuerdo, y la meta comprueba `canExitLevel` además del bloqueo espacial.
- **Cofres sorpresa** (nivel 2 y 3): al abrirlos se muestra un recuerdo con su
  **emoji grande** (😂 / 😍) y se guarda en el álbum (`presented` →
  `acknowledged`). Persisten como `state.bonus` y **no** afectan a candados ni al
  final. En el álbum, los sorpresa **no encontrados no aparecen** (sin spoilers).
- Las fotos se resuelven probando `.jpg/.jpeg/.png/.webp`, verificando que la
  respuesta sea **realmente una imagen** (`content-type: image/*` + bytes), no un
  `index.html` de relleno. Los fallos **no** se cachean (permite «Reintentar»).
  Los nombres con espacio (p. ej. `cuy-gracioso gritando`) se codifican bien.
- Si falta una foto, se muestra un **marcador explícito «Foto pendiente»** y el
  recuerdo se puede guardar igualmente: la partida **no se bloquea**. Aun así,
  `content:check` marca **error** mientras no existan las 3 fotos obligatorias
  (las 2 de los cofres sorpresa solo generan **aviso**).
- Estados del recuerdo: `presented` → `acknowledged` (nunca «leído/verificado»).

### ✅ F5 — Capa narrativa (HTML)
- `src/ui/narrative.js` + `narrative.css`: álbum, foto, elección (patita), carta,
  vela (botón / mantener pulsado / micrófono opcional), **regalo final** y
  celebración.
- Botones HTML reales, foco gestionado, `Escape` donde aplica, foco atrapado por
  panel, `prefers-reduced-motion` respetado, texto ≥16 px y seleccionable.
- **Regalo final en dos fases** (`showReward`): (1) elegir una o varias opciones
  de regalo; (2) un **vale vertical tipo certificado** dibujado en `<canvas>`
  (1080 px de ancho, alto dinámico) con encabezado, título, dedicatoria, las
  opciones elegidas con iconos, condiciones, mensaje final, firma e ilustración
  del cuy. Botones **Descargar** (`Mi_Regalo_De_Cumpleanos.png` vía `canvas.toBlob`),
  **Compartir** (Web Share API con archivo; si no está disponible, descarga) y
  **Cambiar mi elección** (conserva lo marcado). Sin dependencias nuevas: todo se
  dibuja con Canvas 2D, así que el PNG no incluye botones ni elementos del juego.

### ✅ F6 — Audio
- `src/audio/music.js` es el único dueño de la música: intenta el MP3 y cae a la
  pista sintetizada. Silencia durante los cofres; pausa/reanudar también
  restaura la pista sintetizada. Nunca suenan dos pistas a la vez.
- El **menú** (`TitleScene`) pide la pista `intro` (`Every Breath You Take`),
  que antes no sonaba en ninguna escena. Como los navegadores bloquean el audio
  hasta un gesto, un botón HTML «Escuchar música» permite activar el MP3 en el
  menú sin entrar al primer nivel.

### ✅ F7 — Ayuda al atascarse
- Tras `HELP_AFTER_FALLS` (4) caídas se ofrece la «patita» (impulso en el aire,
  una vez). Pista única al tocar la reja cerrada.

### ✅ F8 — Herramientas de verificación
- `npm test` → **14** pruebas de la lógica de progreso (`tools/test-gating.mjs`),
  incluidas las de los recuerdos sorpresa (idempotencia, ids desconocidos, no
  afectan al final y se conservan/descartan al sanear el guardado).
- `npm run content:check` → valida fotos/música/carta y las referencias del
  contenido (`tools/content-check.mjs`, opción `--strict`). Además comprueba la
  **integridad de los mapas** (cada fila mide el ancho del nivel, los cofres/meta
  tienen suelo debajo) y que las letras de las sorpresas sean únicas y no choquen
  con el motor de mapas.
- `npm run art:cuy` → regenera el spritesheet del cuy (`tools/gen-cuy.mjs`).
- Sondas de integración headless (ignoradas por git): recorrido completo
  (`tools/_campaign-probe.mjs`), salto (`_jump-probe.mjs`), **rótulos de los 3
  niveles + cofres sorpresa** (`_banner-probe.mjs`), celebración
  (`_celebration-probe.mjs`) y regalo final (`_gift-probe.mjs`: elige varias
  opciones, genera el canvas 1080×N, descarga un PNG válido
  `Mi_Regalo_De_Cumpleanos.png`, cambia la elección y continúa).
  Todas terminan **sin errores de consola**.
  La sonda `_banner-probe.mjs` confirma, además, que el menú pide la pista
  `intro`, que el archivo existe y que al abrir un cofre sorpresa aparece el
  panel con su emoji y la foto resuelta (incluido el nombre con espacio).

### ✅ F9 — Privacidad y empaquetado
- Steve autorizó incluir las cinco fotos y los cinco MP3 en el repositorio
  público y en el despliegue Vercel. Vite los copia de `public/personal/` a
  `dist/personal/`; sus URLs serán públicas.
- `.gitignore` mantiene fuera `public/personal/carta.txt`,
  `public/personal/dedicatoria.mp3` y `asset-inbox/*` (con excepción de
  `.gitkeep` en la bandeja local).

### ⚠️ F10 — Contenido real
- Steve ya cargó las **5 fotos**: las 3 de los recuerdos
  (`public/personal/fotos/01-nina.jpeg`, `02-actual.jpeg`, `03-juntos.jpeg`) y
  las 2 de los cofres sorpresa (`cuy-gracioso gritando.jpeg`, `actual-guapa1.jpeg`),
  más la **música** (4 pistas + la del epílogo). `content:check` marca
  **«Todo listo. ✔»** solo con avisos de voz opcional.
- Pendiente opcional: `public/personal/carta.txt` y `public/personal/dedicatoria.mp3`
  (si faltan, se usa la carta de respaldo y no hay voz). No bloquean el regalo.

### ⚠️ F11 — Verificación visual
- El arte del cuy es **paramétrico** y no se ha podido inspeccionar a ojo desde
  el agente. Conviene que Steve mire `tools/_cuy-preview.png` y
  `public/assets/cuy/portrait.png`.
- El **vale descargable** se verificó por código (1080 px de ancho, PNG válido,
  sin errores) y con muestreo de píxeles (el cuy sí aparece), pero conviene que
  Steve **vea el PNG** en `Mi_Regalo_De_Cumpleanos.png` para dar el visto bueno al
  diseño.
- Falta confirmar el diseño en un **móvil real** (el layout táctil está probado
  por código y en el navegador de escritorio con emulación).
- Los **mensajes de bloque** (3 niveles) y los **cofres sorpresa** están
  verificados por sonda headless (se dibujan decorativos en las filas 3–7, el
  panel abre con su emoji y la foto resuelta, sin errores de consola), pero
  conviene verlos a ojo en el navegador.

---

## Notas de arquitectura

- **Dos «LEVELS» distintos, a propósito:** `src/content/birthday.js` exporta un
  **array** `LEVELS` (orden de campaña, con memoria/emblema/música/salida) y
  `src/levels/index.js` exporta un **objeto** `{level1, level2, level3}` para
  buscar mallas por id. No confundirlos.
- **Registro `emblems` vs `coins`:** el HUD cuenta `emblems` (coleccionables del
  regalo); `coins` se reserva para las monedas normales.
- **Cofres: un solo motor.** Cada cofre en `this.chests` lleva `kind`
  (`'memory'` | `'bonus'`). El principal abre la reja; el sorpresa solo muestra
  un recuerdo y lo guarda. Ambos comparten la zona y la animación `chest-open`.
- **Recuerdos sorpresa:** `BONUS_MEMORIES` (con `char`, `emoji`, `photo`) y el
  mapa inverso `BONUS_BY_CHAR`. En el guardado viven en `state.bonus`
  (`KNOWN_BONUS_IDS` los sanea); nunca afectan a `canExitLevel` ni al final.
- **Anchos de nivel:** L1 = 170, L2 = 208, L3 = 210. Las filas de `rows` deben
  medir **exactamente** el ancho (el `ground(...)`+`gap(...)` debe sumar `width`);
  `content:check` lo comprueba para que no aparezcan huecos al final.
- **Base relativa** (`base: './'`) para que el build funcione en subdirectorios.
