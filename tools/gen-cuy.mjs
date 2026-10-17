// Exporta el arte del cuy a un spritesheet PNG real + su manifiesto.
// Uso:  node tools/gen-cuy.mjs
// No necesita dependencias: codifica el PNG con zlib (incluido en Node).

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSheet, manifest, FRAME_SIZE } from '../src/assets/cuyRaster.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const outDir = resolve(root, 'public/assets/cuy');
mkdirSync(outDir, { recursive: true });

// ---- Codificador PNG mínimo (RGBA, sin filtros) ---------------------------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePNG(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  // scanlines con byte de filtro 0
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    for (let i = 0; i < stride; i++) {
      raw[y * (stride + 1) + 1 + i] = rgba[y * stride + i];
    }
  }
  const idat = deflateSync(raw, { level: 9 });

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---- Generar --------------------------------------------------------------
const sheet = buildSheet();
const png = encodePNG(sheet.width, sheet.height, sheet.data);
writeFileSync(resolve(outDir, 'player.png'), png);
writeFileSync(resolve(outDir, 'player.animations.json'), JSON.stringify(manifest(), null, 2) + '\n');

console.log(
  `cuy spritesheet → ${sheet.width}x${sheet.height}px, ${sheet.frameCount} frames ` +
    `(${FRAME_SIZE}x${FRAME_SIZE} c/u)`
);
console.log('escrito: public/assets/cuy/player.png');
console.log('escrito: public/assets/cuy/player.animations.json');
