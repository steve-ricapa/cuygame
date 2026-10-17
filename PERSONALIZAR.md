# Personalizar el regalo 🎁

Esta guía es para **Steve** (el que prepara el regalo). Explica lo único que hay
que hacer antes de regalar el juego y cómo cambiar los textos si quieres.

> El juego es **Cuy Adventure — Misión Cumpleaños**: una aventura de 3 niveles
> donde el cuy protagonista abre cofres que revelan fotos personales y termina
> en una celebración con carta, vela y una recompensa elegible.

---

## Lo único obligatorio: 3 fotos

Coloca **tres fotos** en `public/personal/fotos/` con estos nombres exactos
(la extensión puede ser `.jpg`, `.jpeg`, `.png` o `.webp` — elige **una sola**
por cada nombre):

| Archivo base | Significado | Dónde aparece |
| ------------ | ----------- | ------------- |
| `01-nina`    | Ella de niña | Cofre del **Nivel 1** |
| `02-actual`  | Ella hoy     | Cofre del **Nivel 2** |
| `03-juntos`  | Ustedes dos  | Cofre del **Nivel 3** |

Ejemplos válidos: `01-nina.jpg`, `02-actual.png`, `03-juntos.webp`.

Estas tres son las fotos de los **cofres principales**. Si falta alguna, el juego
muestra «Foto pendiente» y deja avanzar, pero `content:check` marcará error para
que no entregues el regalo incompleto.

### Sorpresas opcionales: 2 fotos más 🎁

Los niveles 2 y 3 esconden un **cofre sorpresa** (se nota por el lazo que flota
encima). No bloquean el camino ni hacen falta para ganar: al abrirlos, el
recuerdo extra se guarda en el **álbum**. Si añades estas fotos se ven con su
emoji; si no, el cofre muestra «Foto pendiente» y todo lo demás sigue igual.

| Archivo base | Significado | Dónde aparece |
| ------------ | ----------- | ------------- |
| `cuy-gracioso gritando` | Un cuy gritando de pura emoción (😂) | Nivel 2 (cofre sorpresa) |
| `actual-guapa1` | Guapísima (😍) | Nivel 3 (cofre sorpresa) |

> Los nombres con espacio (como `cuy-gracioso gritando`) se admiten tal cual.

**Recomendaciones (para todas)**

- Que se vea bien en grande: idealmente **800 px o más** en el lado más largo.
- Se muestran **completas** (sin recortar) y se pueden ampliar con un clic/tap,
  así que no importa si son verticales u horizontales.
- Mantén cada archivo por debajo de unos **4–5 MB** para que cargue rápido en el
  celular.
- No dejes dos variantes del mismo nombre (`01-nina.jpg` **y** `01-nina.png`):
  el verificador lo marcará como error.

> ⚠️ **Privacidad y permisos:** Steve autorizó expresamente publicar las cinco
> fotos y los cinco MP3 de esta versión en el repositorio público y en Vercel.
> Cualquiera podrá descargarlos y permanecerán en el historial Git incluso si
> más tarde se borran del árbol actual. La carta y la dedicatoria siguen
> excluidas por `.gitignore` hasta que decidas otra cosa.

---

## Opcional: música

Pon los MP3 en `public/personal/musica/`. Si un archivo no existe, el juego usa
automáticamente una **pista sintetizada** original, así que todo funciona sin
música.

| Archivo | Suena en |
| ------- | -------- |
| `01-intro-every-breath-you-take.mp3` | Menú y arranque |
| `02-nivel-1-woman.mp3`               | Nivel 1 |
| `03-nivel-2-waiting-for-a-girl-like-you.mp3` | Nivel 2 |
| `04-nivel-3-the-reason.mp3`          | Nivel 3 |
| `The Beatles - Here, There and Everywhere.mp3` | Epílogo y el regalo final («los premios») |

Usa solo música que tengas **derecho a usar** (comprada o con licencia). No hace
falta descargar nada para que el juego funcione.

---

## Opcional: la carta

Escribe tu carta en `public/personal/carta.txt` (texto plano). Se muestra al
final, después del tercer recuerdo. Los párrafos se separan con una **línea en
blanco**. Si no creas el archivo, se usa una carta de respaldo que ya viene
preparada en `src/content/birthday.js` (`LETTER_FALLBACK`).

Opcional: si quieres que ofrezca «🎧 Escuchar a tu cuy», graba tu voz en
`public/personal/dedicatoria.mp3`.

---

## Opcional: mensajes dibujados con bloques

En el cielo de **cada nivel** aparece un mensaje dibujado con bloques tipo
ladrillo. Están **elevados y sin colisión**, así que nunca estorban el camino.
Se configuran en `src/content/birthday.js`:

```js
export const SKY_MESSAGES = [
  { level: 'level1', text: 'CAROLINA QC <3', row: 3, col: null },
  { level: 'level2', text: 'TE AMO CUYEYA',  row: 3, col: null },
  { level: 'level3', text: 'FELIZ CUMPLE',   row: 3, col: null },
];
```

- `level` es el nivel donde se dibuja, `text` lo que dice, `row` la fila del
  cielo (0 = arriba del todo; seguro: 3–7) y `col` la columna (`null` = centrado).
- Escribe en **mayúsculas**; los acentos se simplifican solos (`José` → `JOSE`,
  `Ñ` sí se dibuja) y `<3` se dibuja como un corazón.
- Admito `A–Z`, `0–9`, `Ñ`, espacio, `. ! ? -` y `<3`.
- Si dejas `text: ''`, ese nivel no dibuja nada.
- El del Nivel 1 usa su nombre (`CAROLINA QC <3`); cambia cualquier texto por el
  que quieras. Si el mensaje es más ancho que la pantalla, se recorta al centro
  sin romper nada.

---

## El regalo final (vale descargable)

Al terminar los tres niveles, dentro de la celebración aparece el **regalo
final**, en dos pantallas:

1. **Elegir el plan** — ella puede marcar **una o varias** opciones (paseo,
   salida especial, tú eliges el destino, sorpréndeme). Pulsa **«Crear mi vale
   🎟️»**.
2. **Vale generado** — el juego dibuja una **tarjeta romántica vertical** con las
   opciones elegidas, las condiciones y una ilustración del cuy. Desde ahí puede:

   - **«Descargar mi vale 💝»** → guarda `Mi_Regalo_De_Cumpleanos.png` (1080 px de
     ancho, sin botones ni nada del juego) ideal para la galería o WhatsApp.
   - **«Compartir 💌»** → usa el compartir del móvil con el PNG; si el navegador
     no lo permite, **descarga** el archivo como alternativa.
   - **«Cambiar mi elección»** → vuelve a la pantalla anterior sin perder lo ya
     marcado.
   - **«Continuar»** → sigue con el cierre de la celebración.

Todo se dibuja en el propio navegador (canvas), sin servicios externos. Para
cambiar cualquiera de los textos (títulos, la dedicatoria, las condiciones, la
firma, las opciones…), edita **`VOUCHER`** en `src/content/birthday.js`.

---

## Comprobar antes de regalar

Con las fotos en su sitio, ejecuta:

```bash
npm run content:check
```

Debe terminar en **«Todo listo. ✔»**. Si algo falta, te dice exactamente qué
archivo y por qué. La música y la voz solo generan **avisos** (son opcionales);
las **3 fotos de los recuerdos** son **errores** si faltan, y las 2 de las
sorpresas solo **avisan** (el cofre muestra «Foto pendiente»).

---

## Cambiar los textos

Casi todo el texto personal vive en **un solo archivo**:
`src/content/birthday.js`. Ahí puedes cambiar sin tocar el resto del proyecto:

- **Apodo** (`NICKNAME`, por defecto `"mi cuyeya"`) — se usa en la carta y el
  epílogo. Cámbialo si prefieres otro.
- **Mensajes con bloques** (`SKY_MESSAGES`) — el rótulo del cielo de cada nivel.
- **Títulos de los niveles** (`LEVELS[].title` / `.intro`).
- **Mensajes de los recuerdos** (`MEMORIES[].message` y `.button`).
- **Recuerdos sorpresa** (`BONUS_MEMORIES`): texto, emoji (`😂`, `😍`…) y foto de
  cada cofre sorpresa. La letra `char` debe ser única y no chocar con el motor.
- **Texto del epílogo y la celebración** (`EPILOGUE`).
- **El regalo final / vale** (`VOUCHER`): textos de la pantalla de elección, las
  cuatro opciones y todos los textos de la tarjeta descargable (título,
  dedicatoria, condiciones, firma…). Ver más abajo.
- **La carta de respaldo** (`LETTER_FALLBACK`).
- **La ayuda al atascarse** (`HELP`, `HELP_AFTER_FALLS`).

> ⚠️ Si cambias los **ids** de recuerdos o niveles, revisa también
> `src/levels/*.js`. Para textos, títulos o mensajes no hace falta tocar nada
> más.

---

## Probar y publicar

```bash
npm install        # solo la primera vez
npm run dev        # probar en http://localhost:5173
npm test           # pruebas de la lógica de progreso (14)
npm run build      # genera dist/ listo para publicar
npm run preview    # revisar el build ya compilado
```

El juego es responsive: funciona en **escritorio y celular**. En el celular los
controles táctiles aparecen debajo (vertical) o superpuestos (horizontal).

---

## Regalar sin publicar nada

Tienes dos caminos sencillos:

1. **Carpeta local:** `npm run build` y abre/entrega la carpeta `dist/` (o sirve
   `dist/` con `npm run preview`).
2. **GitHub Pages u otro hosting:** sube el contenido de `dist/`. Al estar el
   proyecto en un subdirectorio, la base ya es relativa (`base: './'`), así que
   funciona sin más ajustes.

Recuerda incluir tus archivos personales (`dist/personal/...`) si entregas la
carpeta compilada, ya que Vite los copia desde `public/`.

---

## Qué NO hacer

- No inventes datos sobre ella (fechas de relación, sueños, edad): el contenido
  ya está escrito para ser cálido **sin afirmar cosas** que quizá no sean ciertas.
- No subas nuevas fotos, nuevas pistas comerciales, la carta ni el ZIP sin
  permiso para hacerlos públicos. Las cinco fotos y cinco pistas actuales fueron
  autorizadas expresamente para esta versión.
- No hace falta ninguna cuenta, backend, compra ni IA en tiempo de ejecución.
