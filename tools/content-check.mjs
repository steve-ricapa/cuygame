// ============================================================================
// Verificador del contenido personal del regalo.
// ----------------------------------------------------------------------------
// Comprueba, sin abrir el navegador, que:
//   · las fotos existen (3 recuerdos + sorpresas), son una única variante por
//     nombre y son imágenes de verdad (se validan los primeros bytes);
//   · la música y la voz son OPCIONALES (solo avisan si faltan);
//   · las referencias del contenido son coherentes (recuerdo de cada nivel,
//     emblema válido, pista de música existente y salida correcta);
//   · los mapas de los niveles son íntegros (filas del ancho correcto y cofres
//     con suelo debajo) y las letras de las sorpresas no chocan con el motor.
//
// Uso:  npm run content:check          (falla si hay errores)
//       npm run content:check -- --strict  (también falla con avisos)
// ============================================================================

import { readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PHOTO_EXTENSIONS,
  PHOTO_BASE_DIR,
  MEMORIES,
  BONUS_MEMORIES,
  LEVELS,
  EMBLEMS,
  MUSIC,
  MUSIC_BASE_DIR,
  VOICE_FILE,
  LETTER_FILE,
} from '../src/content/birthday.js';
import { sniffImageType } from '../src/ui/photos.js';
import { LEVELS as GAME_LEVELS } from '../src/levels/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const pub = (rel) => resolve(root, 'public', rel);

const errors = [];
const warnings = [];
const infos = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

// ---------------------------------------------------------------- fotos
// 3 fotos obligatorias (una por recuerdo) + 2 sorpresas opcionales (cofres
// extra). Si falta una obligatoria es error; si falta una sorpresa, aviso (el
// cofre mostrará «Foto pendiente» sin bloquear el juego).
const photoSpecs = [
  ...Object.values(MEMORIES).map((m) => ({ base: m.photo, required: true })),
  ...Object.values(BONUS_MEMORIES).map((b) => ({ base: b.photo, required: false })),
];

let photosOk = 0;
for (const { base, required } of photoSpecs) {
  const found = [];
  for (const ext of PHOTO_EXTENSIONS) {
    const abs = pub(`${PHOTO_BASE_DIR}${base}.${ext}`);
    if (existsSync(abs) && statSync(abs).size > 0) {
      let bytes;
      try {
        bytes = readFileSync(abs).subarray(0, 16);
      } catch (e) {
        err(`No se pudo leer public/${PHOTO_BASE_DIR}${base}.${ext}: ${e.message}`);
        continue;
      }
      const sniffed = sniffImageType(Array.from(bytes));
      if (!sniffed) {
        err(`public/${PHOTO_BASE_DIR}${base}.${ext} no parece una imagen (cabecera inválida).`);
        continue;
      }
      found.push({ ext, sniffed, kb: Math.round(statSync(abs).size / 1024) });
    }
  }

  if (found.length === 0) {
    const msg = `Falta la foto «${base}» en public/${PHOTO_BASE_DIR} (${PHOTO_EXTENSIONS.join('/')}).`;
    if (required) err(msg);
    else warn(`${msg} El cofre sorpresa mostrará «Foto pendiente» hasta que la añadas.`);
  } else if (found.length > 1) {
    err(
      `Hay ${found.length} variantes de «${base}» (${found.map((f) => f.ext).join(', ')}). ` +
        'Deja una sola.'
    );
  } else {
    photosOk += 1;
    infos.push(`foto ${base}: ${found[0].ext} (${found[0].sniffed}, ${found[0].kb} KB)`);
  }
}

// ---------------------------------------------------------------- audio
for (const [key, spec] of Object.entries(MUSIC)) {
  if (!existsSync(pub(`${MUSIC_BASE_DIR}${spec.file}`))) {
    warn(`música «${key}»: falta public/${MUSIC_BASE_DIR}${spec.file} — sonará la pista sintetizada «${spec.synth}».`);
  }
}
if (!existsSync(pub(VOICE_FILE))) {
  warn(`voz: falta public/${VOICE_FILE} — la carta no ofrecerá «Escuchar a tu cuy».`);
}
if (!existsSync(pub(LETTER_FILE))) {
  infos.push(`carta: falta public/${LETTER_FILE} — se usará la carta de respaldo de birthday.js.`);
}

// ------------------------------------------------------- referencias
const memoryIds = new Set(Object.keys(MEMORIES));
const musicKeys = new Set(Object.keys(MUSIC));
const emblemKeys = new Set(Object.keys(EMBLEMS));
const levelIds = new Set(LEVELS.map((l) => l.id));

for (const level of LEVELS) {
  if (!memoryIds.has(level.memory)) err(`El nivel «${level.id}» apunta a un recuerdo inexistente: ${level.memory}.`);
  if (!emblemKeys.has(level.emblem)) err(`El nivel «${level.id}» usa un emblema inexistente: ${level.emblem}.`);
  if (!musicKeys.has(level.music)) err(`El nivel «${level.id}» usa una pista inexistente: ${level.music}.`);
  if (level.exit !== 'epilogue' && !levelIds.has(level.exit)) {
    err(`El nivel «${level.id}» sale hacia un destino inexistente: ${level.exit}.`);
  }
}
for (const m of Object.values(MEMORIES)) {
  if (!emblemKeys.has(m.emblem)) err(`El recuerdo «${m.id}» usa un emblema inexistente: ${m.emblem}.`);
}

// --------------------------------------------- recuerdos sorpresa (cofres)
// Letras ya usadas por el motor de mapas; una sorpresa NO puede reutilizarlas.
const RESERVED_CHARS = new Set([
  ' ', 'X', 'P', 'B', '?', 'M', 'S', 'c', 'e', 'p', 'K', 'G', 'f', 'n', 's',
  '>', '*', '"', '^', 'o',
]);
const bonusChars = new Map(); // char -> id
for (const b of Object.values(BONUS_MEMORIES)) {
  if (!b.char) err(`El recuerdo sorpresa «${b.id}» no define una letra de mapa.`);
  else if (RESERVED_CHARS.has(b.char)) err(`El recuerdo sorpresa «${b.id}» usa la letra reservada '${b.char}'.`);
  else if (bonusChars.has(b.char)) err(`Letra '${b.char}' repetida entre «${bonusChars.get(b.char)}» y «${b.id}».`);
  else bonusChars.set(b.char, b.id);
  if (!b.photo) err(`El recuerdo sorpresa «${b.id}» no tiene foto.`);
}

// ------------------------------------------------- integridad de niveles
for (const [id, lv] of Object.entries(GAME_LEVELS)) {
  if (!lv || !Array.isArray(lv.rows)) { err(`El nivel «${id}» no tiene filas.`); continue; }
  lv.rows.forEach((row, i) => {
    if (row.length !== lv.width) {
      err(`Nivel «${id}»: la fila ${i} mide ${row.length}, se esperaba ${lv.width}.`);
    }
  });
  // Cofres y meta deben tener suelo debajo (si no, quedan inalcanzables).
  lv.rows.forEach((row, ri) => {
    [...row].forEach((ch, col) => {
      if (ch === 'K' || ch === 'G' || bonusChars.has(ch)) {
        let supported = false;
        for (let r2 = ri + 1; r2 < lv.rows.length; r2++) {
          if (lv.rows[r2][col] === 'X') { supported = true; break; }
        }
        if (!supported) err(`Nivel «${id}»: '${ch}' en la columna ${col} no tiene suelo debajo.`);
      }
    });
  });
  // Cada sorpresa debe aparecer al menos una vez en algún nivel.
}
const allGridChars = new Set();
for (const lv of Object.values(GAME_LEVELS)) for (const row of lv.rows) for (const ch of row) allGridChars.add(ch);
for (const [ch, bid] of bonusChars) {
  if (!allGridChars.has(ch)) err(`El recuerdo sorpresa «${bid}» usa la letra '${ch}' pero no aparece en ningún nivel.`);
}

// ---------------------------------------------------------------- salida
console.log('— Verificación del contenido —');
console.log(`fotos listas: ${photosOk}/${photoSpecs.length}`);
for (const i of infos) console.log('  · ' + i);
for (const w of warnings) console.log('  ⚠ ' + w);
for (const e of errors) console.log('  ✗ ' + e);

const strict = process.argv.includes('--strict');
if (errors.length) {
  console.log(`\n${errors.length} error(es). Corrige lo anterior antes de regalar el juego.`);
  process.exit(1);
}
if (strict && warnings.length) {
  console.log(`\n${warnings.length} aviso(s) en modo --strict.`);
  process.exit(1);
}
console.log('\nTodo listo. ✔');
