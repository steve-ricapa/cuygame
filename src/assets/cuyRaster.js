// ============================================================================
// Arte original del cuy (protagonista) — pixel art lateral por parámetros.
// ----------------------------------------------------------------------------
// No depende de ningún pack de pago ni de descargas: dibuja un cuy de perfil
// con cuerpo redondeado, orejas pequeñas, ojo oscuro con brillo, patitas
// cortas, sin cola larga y con un pañuelo rosa opcional. Todos los frames
// (reposo, caminar, salto, caída, aterrizaje, celebración, sorpresa) salen de
// la misma función, así que la escala y la línea de apoyo son coherentes.
//
// Este módulo es JS puro (sin Phaser) para poder usarse también desde un
// script de Node que exporta el spritesheet a PNG (tools/gen-cuy.mjs).
// ============================================================================

export const FRAME_SIZE = 32;

// ---- Paleta del cuy ----
const C = {
  outline: [0x54, 0x37, 0x2d],
  body: [0xc6, 0x8b, 0x59],
  bodyLight: [0xdc, 0xa8, 0x74],
  bodyDark: [0xac, 0x74, 0x46],
  belly: [0xff, 0xf4, 0xdd],
  bellyShade: [0xf0, 0xdf, 0xbe],
  cream: [0xff, 0xf4, 0xdd],
  creamShade: [0xf1, 0xe2, 0xc6],
  patch: [0xb0, 0x74, 0x46],
  earInner: [0xea, 0xa6, 0xbc],
  eye: [0x2a, 0x1a, 0x14],
  glint: [0xff, 0xff, 0xff],
  nose: [0xe0, 0x8b, 0xa6],
  mouth: [0x8a, 0x5a, 0x48],
  scarf: [0xea, 0xa6, 0xbc],
  scarfDark: [0xd1, 0x86, 0x9e],
  leg: [0xb8, 0x7b, 0x4c],
  legDark: [0x96, 0x60, 0x39],
};

const rgba = ([r, g, b]) => [r, g, b, 255];

// ---- Primitivas ----
const inEllipse = (x, y, cx, cy, rx, ry) => {
  const dx = (x + 0.5 - cx) / rx;
  const dy = (y + 0.5 - cy) / ry;
  return dx * dx + dy * dy <= 1;
};

const inCircle = (x, y, cx, cy, r) => inEllipse(x, y, cx, cy, r, r);

const inRoundRect = (x, y, x0, y0, x1, y1) =>
  x >= x0 && x < x1 && y >= y0 && y < y1;

// ---- Parámetros por defecto (pose de reposo) ----
function basePose() {
  return {
    bodyCx: 14.5,
    bodyCy: 19.5,
    bodyRx: 9.6,
    bodyRy: 7.0,
    haunchCx: 10.5,
    haunchCy: 20.0,
    haunchRy: 6.2,
    headCx: 22.0,
    headCy: 14.8,
    headRx: 6.2,
    headRy: 5.6,
    headDx: 0,
    headDy: 0,
    earCx: 20.6,
    earCy: 10.0,
    earRx: 2.0,
    earRy: 2.4,
    earBack: false,
    eye: 'open', // open | closed | wide | happy
    mouth: 'calm', // calm | open | smile
    scarf: true,
    legFrontX: 16.5,
    legFrontTop: 25.0,
    legFrontBottom: 29.0,
    legBackX: 10.0,
    legBackTop: 25.0,
    legBackBottom: 29.0,
    tilt: 0, // desplaza la cabeza/cuerpo horizontalmente
    star: false, // brillo de celebración (no usado por defecto)
  };
}

// ---- Composición de frames ----
function pose(over = {}) {
  return { ...basePose(), ...over };
}

export const ANIMATION_ORDER = ['idle', 'run', 'jump', 'fall', 'land', 'celebrate', 'surprise'];

export const ANIMATIONS = {
  // Reposo: respiración suave + parpadeo en el último frame.
  idle: [
    pose({ bodyRy: 6.9, headDy: 0.2 }),
    pose({ bodyRy: 7.3, headDy: -0.3, earRy: 2.5 }),
    pose({ bodyRy: 7.1, headDy: -0.1 }),
    pose({ bodyRy: 7.0, headDy: 0, eye: 'closed' }),
  ],
  // Caminar/correr: patitas alternas reconocibles.
  run: [
    pose({ legFrontX: 18.0, legFrontTop: 24.4, legFrontBottom: 28.8, legBackX: 8.5, legBackTop: 25.4, legBackBottom: 29.0 }),
    pose({ legFrontX: 16.0, legFrontTop: 25.2, legFrontBottom: 29.2, legBackX: 10.5, legBackTop: 24.8, legBackBottom: 29.0 }),
    pose({ legFrontX: 14.5, legFrontTop: 25.6, legFrontBottom: 29.2, legBackX: 12.5, legBackTop: 24.4, legBackBottom: 28.8, bodyCy: 19.0 }),
    pose({ legFrontX: 15.5, legFrontTop: 25.0, legFrontBottom: 29.0, legBackX: 11.0, legBackTop: 25.0, legBackBottom: 29.2 }),
    pose({ legFrontX: 17.0, legFrontTop: 24.6, legFrontBottom: 28.8, legBackX: 9.5, legBackTop: 25.4, legBackBottom: 29.0, bodyCy: 19.0 }),
    pose({ legFrontX: 18.0, legFrontTop: 25.2, legFrontBottom: 29.2, legBackX: 8.5, legBackTop: 24.8, legBackBottom: 29.0 }),
  ],
  // Salto: despegue y ascenso, patitas recogidas, orejas hacia atrás.
  jump: [
    pose({ bodyCy: 19.0, bodyRy: 6.6, legFrontX: 16.5, legFrontTop: 23.0, legFrontBottom: 25.4, legBackX: 10.5, legBackTop: 23.4, legBackBottom: 25.6, earBack: true, eye: 'wide', headDy: -0.5 }),
    pose({ bodyCy: 18.6, bodyRy: 6.4, legFrontX: 17.0, legFrontTop: 22.0, legFrontBottom: 24.2, legBackX: 10.0, legBackTop: 22.4, legBackBottom: 24.4, earBack: true, eye: 'wide', headDy: -0.8 }),
  ],
  // Caída: pose distinta, patitas extendidas y orejas hacia arriba.
  fall: [
    pose({ bodyRy: 7.2, legFrontX: 17.5, legFrontTop: 24.4, legFrontBottom: 28.6, legBackX: 9.5, legBackTop: 24.4, legBackBottom: 28.6, earCy: 9.4, earRy: 2.6, eye: 'wide' }),
    pose({ bodyRy: 7.3, legFrontX: 17.8, legFrontTop: 24.8, legFrontBottom: 29.0, legBackX: 9.2, legBackTop: 24.8, legBackBottom: 29.0, earCy: 9.2, earRy: 2.7, eye: 'wide' }),
  ],
  // Aterrizaje: compresión leve (el cuerpo físico no cambia).
  land: [
    pose({ bodyRy: 5.9, bodyRx: 10.3, bodyCy: 20.4, headCy: 15.6, earCy: 10.8, legFrontTop: 25.0, legFrontBottom: 28.6, legBackTop: 25.0, legBackBottom: 28.6 }),
    pose({ bodyRy: 6.8, bodyRx: 9.8, bodyCy: 19.8, headCy: 15.1, earCy: 10.3 }),
  ],
  // Celebración: saltito feliz.
  celebrate: [
    pose({ bodyCy: 18.0, legFrontX: 17.0, legFrontTop: 22.6, legFrontBottom: 25.0, legBackX: 10.0, legBackTop: 22.8, legBackBottom: 25.2, earCy: 9.2, earRy: 2.6, eye: 'happy', mouth: 'smile' }),
    pose({ bodyCy: 19.5, legFrontX: 16.5, legFrontTop: 24.6, legFrontBottom: 28.6, legBackX: 10.5, legBackTop: 24.6, legBackBottom: 28.6, eye: 'happy', mouth: 'smile' }),
    pose({ bodyCy: 17.6, legFrontX: 18.0, legFrontTop: 22.0, legFrontBottom: 24.6, legBackX: 9.0, legBackTop: 22.4, legBackBottom: 24.8, earCy: 9.0, earRy: 2.7, eye: 'happy', mouth: 'open' }),
  ],
  // Sorpresa: al descubrir un cofre.
  surprise: [
    pose({ earCy: 9.0, earRy: 2.7, eye: 'wide', mouth: 'open', bodyRy: 7.3, headDy: -0.4 }),
    pose({ earCy: 8.6, earRy: 2.9, eye: 'wide', mouth: 'open', bodyRy: 7.4, headDy: -0.8, bodyCy: 19.0 }),
    pose({ earCy: 9.0, earRy: 2.7, eye: 'wide', mouth: 'open', bodyRy: 7.2, headDy: -0.3 }),
  ],
};

// ---- Rasterizado de un frame ----------------------------------------------

function ternario(cond, a, b) {
  return cond ? a : b;
}

export function rasterFrame(p) {
  const W = FRAME_SIZE;
  const H = FRAME_SIZE;
  const out = new Uint8ClampedArray(W * H * 4); // transparente por defecto

  const headCx = p.headCx + p.headDx + p.tilt;
  const headCy = p.headCy + p.headDy;

  // Máscara de silueta (cuerpo + cabeza + orejas + patitas).
  const mask = new Uint8Array(W * H);
  const bodyHit = (x, y) =>
    inEllipse(x, y, p.bodyCx, p.bodyCy, p.bodyRx, p.bodyRy) ||
    inEllipse(x, y, p.haunchCx, p.haunchCy, p.bodyRx * 0.62, p.haunchRy);
  const headHit = (x, y) => inEllipse(x, y, headCx, headCy, p.headRx, p.headRy);
  const earHit = (x, y) =>
    inEllipse(x, y, p.earCx + p.tilt, p.earCy + (p.earBack ? 0.6 : 0), p.earRx, p.earRy);
  const legFrontHit = (x, y) =>
    inRoundRect(x, y, p.legFrontX - 1.6, p.legFrontTop, p.legFrontX + 1.6, p.legFrontBottom);
  const legBackHit = (x, y) =>
    inRoundRect(x, y, p.legBackX - 1.6, p.legBackTop, p.legBackX + 1.6, p.legBackBottom);
  const muzzleHit = (x, y) => inEllipse(x, y, headCx + 5.0, headCy + 1.6, 2.7, 2.3);

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const hit =
        bodyHit(x, y) || headHit(x, y) || earHit(x, y) ||
        legFrontHit(x, y) || legBackHit(x, y) || muzzleHit(x, y);
      if (hit) mask[y * W + x] = 1;
    }
  }

  // Color interior por prioridad de región.
  const region = (x, y) => {
    // Ojo
    const ex = headCx + 2.4;
    const ey = headCy - 0.3;
    if (p.eye === 'closed') {
      if (inRoundRect(x, y, ex - 2, ey + 0.5, ex + 2, ey + 1.5)) return rgba(C.eye);
    } else {
      const r = p.eye === 'wide' ? 2.1 : 1.7;
      if (inCircle(x, y, ex, ey, r)) {
        // Brillo en la esquina superior-derecha del ojo
        if (p.eye !== 'happy' && inCircle(x, y, ex + 0.6, ey - 0.6, 0.6)) return rgba(C.glint);
        return rgba(C.eye);
      }
    }
    // Bozal / boca
    if (muzzleHit(x, y)) {
      if (p.mouth === 'open' && inEllipse(x, y, headCx + 6.0, headCy + 2.6, 1.2, 0.9)) {
        return rgba(C.mouth);
      }
      if (p.mouth === 'smile' && inRoundRect(x, y, headCx + 4.4, headCy + 2.2, headCx + 6.4, headCy + 3.0)) {
        return rgba(C.mouth);
      }
      return rgba(C.cream);
    }
    // Nariz
    if (inCircle(x, y, headCx + 7.1, headCy + 1.4, 0.9)) return rgba(C.nose);
    // Pañuelo (banda alrededor del cuello)
    if (p.scarf && inEllipse(x, y, headCx - 4.0, headCy + 4.0, 3.2, 1.5)) {
      return rgba(C.scarfDark);
    }
    if (p.scarf && inEllipse(x, y, headCx - 4.4, headCy + 3.4, 3.4, 1.5)) {
      return rgba(C.scarf);
    }
    // Oreja
    if (earHit(x, y)) {
      if (inEllipse(x, y, p.earCx + p.tilt, p.earCy + 0.4, p.earRx * 0.5, p.earRy * 0.55)) {
        return rgba(C.earInner);
      }
      return rgba(C.cream);
    }
    // Cabeza: crema con parche marrón alrededor de la oreja/ojo
    if (headHit(x, y)) {
      if (inEllipse(x, y, headCx - 0.6, headCy - 2.6, 4.0, 2.6)) return rgba(C.patch);
      return y > headCy + 1.2 ? rgba(C.creamShade) : rgba(C.cream);
    }
    // Patitas
    if (legFrontHit(x, y) || legBackHit(x, y)) {
      return y > p.legFrontBottom - 1.2 ? rgba(C.legDark) : rgba(C.leg);
    }
    // Cuerpo: marrón con panza crema
    if (bodyHit(x, y)) {
      if (inEllipse(x, y, p.bodyCx + 1.5, p.bodyCy + 1.6, p.bodyRx * 0.72, p.bodyRy * 0.62)) {
        return y > p.bodyCy + 2.4 ? rgba(C.bellyShade) : rgba(C.belly);
      }
      return y > p.bodyCy ? rgba(C.bodyDark) : rgba(C.bodyLight);
    }
    return null;
  };

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (!mask[i]) continue;
      // Contorno: píxel de silueta con un vecino fuera de la silueta.
      const edge =
        x === 0 || y === 0 || x === W - 1 || y === H - 1 ||
        !mask[i - 1] || !mask[i + 1] || !mask[i - W] || !mask[i + W];
      const color = edge ? rgba(C.outline) : region(x, y) || rgba(C.body);
      const o = i * 4;
      out[o] = color[0];
      out[o + 1] = color[1];
      out[o + 2] = color[2];
      out[o + 3] = 255;
    }
  }

  return out;
}

// ---- Spritesheet -----------------------------------------------------------
// Frames concatenados horizontalmente en el orden de ANIMATION_ORDER.
// Devuelve también el índice inicial de cada animación.

export function buildSheet() {
  const frameCount = ANIMATION_ORDER.reduce((n, k) => n + ANIMATIONS[k].length, 0);
  const width = frameCount * FRAME_SIZE;
  const height = FRAME_SIZE;
  const data = new Uint8ClampedArray(width * height * 4);

  const starts = {};
  let index = 0;
  for (const key of ANIMATION_ORDER) {
    starts[key] = index;
    for (const p of ANIMATIONS[key]) {
      const frame = rasterFrame(p);
      for (let y = 0; y < FRAME_SIZE; y++) {
        for (let x = 0; x < FRAME_SIZE; x++) {
          const src = (y * FRAME_SIZE + x) * 4;
          const dst = (y * width + (index * FRAME_SIZE + x)) * 4;
          data[dst] = frame[src];
          data[dst + 1] = frame[src + 1];
          data[dst + 2] = frame[src + 2];
          data[dst + 3] = frame[src + 3];
        }
      }
      index++;
    }
  }

  // Rangos [from, to] por animación (inclusive).
  const ranges = {};
  for (const key of ANIMATION_ORDER) {
    ranges[key] = [starts[key], starts[key] + ANIMATIONS[key].length - 1];
  }

  return { width, height, data, frameCount, ranges };
}

export function manifest() {
  const sheet = buildSheet();
  return {
    name: 'cuy',
    frameWidth: FRAME_SIZE,
    frameHeight: FRAME_SIZE,
    frames: sheet.frameCount,
    sheet: 'player.png',
    animations: Object.fromEntries(
      ANIMATION_ORDER.map((k) => [k, { frames: sheet.ranges[k], count: ANIMATIONS[k].length }])
    ),
  };
}
