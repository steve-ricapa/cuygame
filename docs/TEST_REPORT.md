# Informe de pruebas — Cuy Adventure: Misión Cumpleaños

Fecha: comprobación posterior a los niveles ampliados, los cofres sorpresa y la
música del menú.
Entorno: Windows, Node + Vite 7, Chrome headless.

Resumen: **compilación OK**, **14/14 pruebas unitarias OK**, **verificación de
contenido «Todo listo. ✔»** (5/5 fotos y música presentes) y **sondas de
integración sin errores de consola**, incluida la de los mensajes de bloque de
los 3 niveles, los cofres sorpresa y el regalo final con descarga de un PNG
válido.

---

## 1. Compilación de producción

```bash
npm run build
```

Resultado: ✅ `vite build` termina correctamente (~4,5 s, 31 módulos). Se genera
`dist/` con `index.html`, CSS y JS. Aviso único: el *chunk* de JS supera 500 kB
(es el motor Phaser completo); es solo informativo, no un error.

---

## 2. Pruebas unitarias de la lógica de progreso

```bash
npm test        # node --test tools/test-gating.mjs
```

Resultado: ✅ **14/14 pasan**.

| # | Caso | Qué comprueba |
| - | ---- | ------------- |
| 1 | Primer nivel siempre accesible | El nivel 1 se entra sin recuerdos |
| 2 | Apertura por recuerdo previo | El nivel N exige el recuerdo de N−1 |
| 3 | Meta no cruzable sin el recuerdo | `canExitLevel` es falso hasta confirmar |
| 4 | Confirmar es idempotente | Repetir no rompe ni afecta a otros recuerdos |
| 5 | Final solo con los 3 recuerdos | `finale.unlocked` se activa al tercero |
| 6 | Ids desconocidos ignorados | Un recuerdo inventado no se guarda |
| 7 | Otra campaña se descarta | Un guardado ajeno no se reutiliza |
| 8 | Guardado corrupto se repara | `null/número/array/…` no desbloquean nada |
| 9 | `sanitizeState` estricto | No acepta recuerdos/etapas/vale inventados; el vale filtra ids desconocidos y repetidos |
| 10 | Vale en formato antiguo | Acepta un `optionId` antiguo y lo migra a `optionIds` |
| 11 | Coherencia del final | `unlocked` no queda activo con recuerdos incompletos |
| 12 | Sorpresa: idempotente e ids desconocidos | `applyBonusFound`/`bonusFound` solo admiten ids conocidos |
| 13 | Sorpresas no afectan al final | Marcar sorpresas no abre niveles ni el final |
| 14 | `sanitizeState` con sorpresas | Conserva las sorpresas conocidas y descarta las inventadas |

---

## 3. Verificación del contenido personal

```bash
npm run content:check
```

Resultado: ✅ **Todo listo. ✔** (0 errores, 1 aviso de voz opcional).

- Fotos: **5/5** — obligatorias `01-nina.jpeg`, `02-actual.jpeg`,
  `03-juntos.jpeg`; sorpresa `cuy-gracioso gritando.jpeg` y `actual-guapa1.jpeg`.
- Música: **sin avisos** (las 4 pistas + la del epílogo están presentes).
- Integridad de los niveles: ✅ filas del ancho correcto (170 / 208 / 210),
  cofres y meta con suelo debajo, letras de sorpresas sin colisión.
- Voz: 1 aviso (la carta no ofrecerá «Escuchar a tu cuy»).
- Carta: informativo (se usará la de respaldo, `carta.txt` aún no existe).

---

## 4. Sonda de integración headless

`tools/_campaign-probe.mjs` (ignorada por git) conduce el servidor de desarrollo
en Chrome headless mediante el protocolo CDP, sin dependencias externas, y
comprueba consola + estado interno (`window.__game`, disponible solo en DEV).

Resultado: ✅ **sin errores de consola**. Flujos verificados:

- **Título:** el botón HTML «Escuchar música» permite activar el MP3 en el menú.
  Comprobado en Chrome mediante clic real: `01-intro-every-breath-you-take.mp3`
  queda reproduciéndose y el respaldo sintetizado se detiene. La sonda
  confirma además que el archivo existe (`music.hasFile('intro')`).
- **Nivel 1:** 1 cofre, reja **cerrada**, 10 coleccionables (todos con cuerpo de
  física), 4 enemigos, HUD activo.
- **Niveles ampliados:** el 2 mide **208** columnas y el 3 **210**; cada uno tiene
  su cofre principal, su **cofre sorpresa** (`bonus-cuy` col 168, `bonus-guapa`
  col 176) y la meta al final, todos sobre suelo firme.
- **Movimiento:** caminar (Δx≈248) y salto (la sonda pulsa el salto y observa
  el cambio de velocidad vertical; el valor exacto depende del instante).
- **Mensajes con bloques (3 niveles):** sonda dedicada
  `tools/_banner-probe.mjs` → **136** tiles decorativos para `CAROLINA QC <3`
  (Nivel 1), **130** para `TE AMO CUYEYA` (Nivel 2) y **131** para
  `FELIZ CUMPLE` (Nivel 3), todos en las filas **3–7** (el terreno más alto
  empieza en la 13/14), **sin cuerpo de física** (`allDecorative`) y **sin
  errores de consola**. Se atraviesan sin bloquear el paso.
- **Cofre sorpresa:** la misma sonda abre el del Nivel 2 y comprueba que aparece
  el panel con el **emoji grande** (😂), el título correcto y la **foto resuelta**
  (URL `blob:`), incluido el nombre con espacio (`cuy-gracioso gritando`). No
  abre la reja ni afecta a `canExitLevel`. En prueba interactiva también se
  confirmó `bonus-cuy` y `bonus-guapa` (😍), se comprobaron ambas fotos y se
  verificó que aparecen en el álbum sin abrir la reja. Al regresar al nivel,
  un cofre sorpresa ya guardado no vuelve a abrirse automáticamente.
- **Salto al correr (regresión del "a veces no salta"):** sonda dedicada
  `tools/_jump-probe.mjs` pulsando salto mientras el cuy camina → **10/10 saltos**
  registrados, incluidos los pulsados con `onFloor() === false` (coyote time).
- **Regalo final:** sonda dedicada `tools/_gift-probe.mjs`:
  - Fase 1 con 4 opciones; «Crear mi vale 🎟️» deshabilitado sin selección.
  - Selección **múltiple** (`paseo` + `sorpresa`) y **persistida** en el guardado.
  - Fase 2: `<canvas>` de **1080 px de ancho** (alto dinámico ≈1684–2062), con el
    retrato del cuy cargado (200×200) y dibujado (no fondo plano).
  - **«Descargar mi vale 💝»** genera un **PNG válido** `Mi_Regalo_De_Cumpleanos.png`
    (firma PNG correcta, ~390 KB).
  - **«Cambiar mi elección»** vuelve a las opciones **conservando** lo marcado.
  - **«Continuar»** cierra el regalo y llega a la celebración. Sin errores.
- **Caída a un pozo:** reaparece vivo; tras 4 caídas aparece «¿Te doy una
  patita?» y al aceptar queda `assist=true` sin congelar el juego.
- **Cofre:** abre la foto, «Guardar este recuerdo» → **abre la reja** y marca
  `memory-childhood` confirmado.
- **Si falta una foto:** el cofre muestra «Foto pendiente» y permite continuar
  sin bloquear la partida. Hoy las 5 fotos están presentes y `content:check`
  termina sin errores; las 3 fotos principales son obligatorias para entregar
  el regalo, las 2 sorpresas son opcionales.
- **Meta:** al cruzarla pasa a `IntroScene` del nivel 2.
- **Epílogo completo:** 3 toques al cofre → 3 fotos → resumen → carta → vela →
  recompensa → celebración, terminando en `finale.stage = 'done'`.

### Detalle de la secuencia del epílogo (extracto)

```
La flor del jardín            => Seguir
La nota de la música          => Seguir
La estrella del cielo         => Abrir mi regalo
La pequeña soñadora           => Guardar este recuerdo
La magia que tienes           => Guardar este recuerdo
Todo lo bonito que viene      => Guardar este recuerdo
Tres momentos, una historia   => Seguir con mi sorpresa
?                             => Abrir la carta
Para mi cuyeya               => Seguir con mi sorpresa
Tu deseo                      => Apagar la vela
🎁 Tu regalo especial         => (elegir) Crear mi vale 🎟️ → Tu vale está listo ✨ → Continuar
Feliz cumpleaños, mi cuyeya. => Ver mi álbum
Mi álbum …                    => (cerrar)
finalStage: done   ·   no errors
```

---

## 5. Pruebas manuales / visuales (pendientes)

| Área | Estado |
| ---- | ------ |
| Aspecto del cuy (spritesheet y retrato) | ⚠️ no inspeccionado a ojo por el agente; mirar `tools/_cuy-preview.png` y `public/assets/cuy/portrait.png` |
| Diseño del vale descargable | ⚠️ verificado por código (1080 px, PNG válido, cuy dibujado); falta el visto bueno visual de Steve sobre `Mi_Regalo_De_Cumpleanos.png` |
| Layout táctil en móvil real | ⚠️ probado por código y con emulación de escritorio; falta un dispositivo físico |
| Con fotos reales | ✅ las 5 fotos están y `content:check` da «Todo listo. ✔» |
| Cofres sorpresa y mensajes de bloque | ⚠️ verificados por sonda headless (se dibujan, el panel abre con emoji y foto); conviene verlos a ojo |
| Accesibilidad (foco, teclado, `prefers-reduced-motion`) | ✅ implementada por código; revisión manual recomendada |

---

## 6. Cómo reproducir todo

```bash
npm install
npm test                                   # 14/14
npm run content:check                      # Todo listo. ✔ (5/5 fotos)
npm run build                              # compila
npx vite --port 5175 --strictPort          # en una terminal
node tools/_campaign-probe.mjs             # en otra (requiere Chrome instalado)
node tools/_banner-probe.mjs               # mensajes de bloque (3 niveles) + cofre sorpresa + música del menú
node tools/_gift-probe.mjs                 # regalo final: 2 fases + descarga PNG
```
