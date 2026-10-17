import Phaser from 'phaser';
import { ANIMATION_ORDER, ANIMATIONS } from '../assets/cuyRaster.js';
import { PALETTE } from '../content/birthday.js';
import { loadState, getAudioPreference } from '../state/save.js';
import { sfx } from '../audio/sfx.js';
import { music } from '../audio/music.js';

const TILEMAP_DIR = 'assets/kenney_pixel-platformer/Tilemap';

// The pale sky colour baked into Kenney's background tiles — we turn it
// transparent at load time so the hills can sit on our own sky.
const BG_SKY_COLOR = { r: 223, g: 246, b: 245 };

const hex = (n) => '#' + n.toString(16).padStart(6, '0');

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, 324, 22, 0x222230);
    const bar = this.add
      .rectangle(width / 2 - 158, height / 2, 316, 12, 0xeac56a)
      .setOrigin(0, 0.5)
      .setScale(0, 1);
    this.load.on('progress', (value) => bar.setScale(value, 1));

    // --- Tiles de Kenney (entorno).
    this.load.spritesheet('tiles', `${TILEMAP_DIR}/tilemap_packed.png`, {
      frameWidth: 18,
      frameHeight: 18,
    });
    this.load.spritesheet('chars', `${TILEMAP_DIR}/tilemap-characters_packed.png`, {
      frameWidth: 24,
      frameHeight: 24,
    });
    this.load.spritesheet('bg', `${TILEMAP_DIR}/tilemap-backgrounds_packed.png`, {
      frameWidth: 24,
      frameHeight: 24,
    });

    // --- Protagonista: cuy original (spritesheet generado por tools/gen-cuy.mjs).
    this.load.spritesheet('cuy', 'assets/cuy/player.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
    // Retrato del cuy (recurso gratuito de freepixel.art, ver ASSET_SOURCES.md).
    this.load.image('cuy-portrait', 'assets/cuy/portrait.png');
  }

  create() {
    this.makeTilingTexture('tex-grass-top', 'tiles', [2]);
    this.makeTilingTexture('tex-dirt', 'tiles', [122]);
    this.makeTilingTexture('tex-hills', 'bg', [8, 9, 10, 11], BG_SKY_COLOR);
    this.makeTilingTexture('tex-cloud', 'tiles', [153, 154, 155]);
    this.makeFireballTexture();

    this.makeRecoloredTexture('gem-fire', 'tiles', 67, (r, g, b) => [b, g, r]);
    this.makeRecoloredTexture('gem-star', 'tiles', 67, (r, g, b) => {
      const l = Math.min(255, Math.round(Math.max(r, g, b) * 1.15));
      return [l, l, l];
    });
    this.makePipeTextures();

    // --- Objetos originales del cumpleaños (dibujados a mano por píxeles).
    this.makeChestTextures();
    this.makeEmblemTextures();
    this.makeGateTextures();
    this.makeCakeTextures();
    this.makeGiftTexture();

    const spark = this.textures.createCanvas('spark', 4, 4);
    spark.context.fillStyle = '#ffffff';
    spark.context.fillRect(0, 0, 4, 4);
    spark.refresh();
    this.makeRecoloredTexture('mushroom-1up', 'tiles', 128, (r, g, b) => [g, r, b]);

    this.createAnimations();

    // Estado global del juego (HUD) + estado de progreso guardado.
    this.registry.set('score', 0);
    this.registry.set('coins', 0);
    this.registry.set('emblems', 0);
    this.registry.set('collectiblesTotal', 0);
    this.registry.set('world', '');
    loadState();

    // Preferencia de audio guardada (el desbloqueo real ocurre al primer gesto).
    const pref = getAudioPreference();
    sfx.setMuted(pref.muted);
    music.setMuted(pref.muted);

    this.scene.start('TitleScene');
  }

  // ------------------------------------------------------ helpers de textura

  makeTilingTexture(destKey, srcKey, frames, colorKey = null) {
    const first = this.textures.getFrame(srcKey, frames[0]);
    const w = first.width;
    const h = first.height;

    const canvas = this.textures.createCanvas(destKey, w * frames.length, h);
    const ctx = canvas.context;

    frames.forEach((frameIndex, i) => {
      const f = this.textures.getFrame(srcKey, frameIndex);
      ctx.drawImage(f.source.image, f.cutX, f.cutY, w, h, i * w, 0, w, h);
    });

    if (colorKey) {
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i] === colorKey.r && d[i + 1] === colorKey.g && d[i + 2] === colorKey.b) {
          d[i + 3] = 0;
        }
      }
      ctx.putImageData(img, 0, 0);
    }
    canvas.refresh();
  }

  makeRecoloredTexture(destKey, srcKey, frameIndex, transform) {
    const f = this.textures.getFrame(srcKey, frameIndex);
    const canvas = this.textures.createCanvas(destKey, f.width, f.height);
    const ctx = canvas.context;
    ctx.drawImage(f.source.image, f.cutX, f.cutY, f.width, f.height, 0, 0, f.width, f.height);

    const img = ctx.getImageData(0, 0, f.width, f.height);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] === 0) continue;
      const [r, g, b] = transform(d[i], d[i + 1], d[i + 2]);
      d[i] = r;
      d[i + 1] = g;
      d[i + 2] = b;
    }
    ctx.putImageData(img, 0, 0);
    canvas.refresh();
  }

  makePipeTextures() {
    const OUTLINE = '#14541c';
    const DARK = '#2e8a36';
    const MID = '#48b552';
    const LIGHT = '#a0e25c';

    const mouth = this.textures.createCanvas('pipe-mouth', 44, 18);
    const m = mouth.context;
    m.fillStyle = OUTLINE;
    m.fillRect(0, 0, 44, 18);
    m.fillStyle = MID;
    m.fillRect(2, 2, 40, 14);
    m.fillStyle = LIGHT;
    m.fillRect(7, 2, 7, 14);
    m.fillStyle = DARK;
    m.fillRect(33, 2, 6, 14);
    mouth.refresh();

    const shaft = this.textures.createCanvas('pipe-shaft', 36, 18);
    const s = shaft.context;
    s.fillStyle = MID;
    s.fillRect(0, 0, 36, 18);
    s.fillStyle = OUTLINE;
    s.fillRect(0, 0, 2, 18);
    s.fillRect(34, 0, 2, 18);
    s.fillStyle = LIGHT;
    s.fillRect(6, 0, 6, 18);
    s.fillStyle = DARK;
    s.fillRect(28, 0, 5, 18);
    shaft.refresh();
  }

  makeFireballTexture() {
    const size = 10;
    const canvas = this.textures.createCanvas('fireball', size, size);
    const ctx = canvas.context;
    ctx.fillStyle = '#d83b0c';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, 5, 0, Math.PI * 2);
    ctx.fill();
    canvas.refresh();
  }

  // ---- Cofre: cerrado + abierto (2 frames de 22x18) ----
  makeChestTextures() {
    const W = 22;
    const H = 18;
    const canvas = this.textures.createCanvas('chest', W * 2, H);
    const ctx = canvas.context;

    const drawChest = (ox, open) => {
      const wood = '#a5744a';
      const woodDark = '#7d5433';
      const outline = hex(PALETTE.outline);
      const gold = hex(PALETTE.gold);
      // base
      ctx.fillStyle = outline;
      ctx.fillRect(ox + 1, 7, W - 2, H - 8);
      ctx.fillStyle = wood;
      ctx.fillRect(ox + 2, 8, W - 4, H - 10);
      // lid
      ctx.fillStyle = outline;
      if (open) {
        ctx.fillRect(ox + 1, 1, W - 2, 5);
      } else {
        ctx.fillRect(ox + 1, 2, W - 2, 6);
      }
      ctx.fillStyle = woodDark;
      if (open) ctx.fillRect(ox + 2, 2, W - 4, 4);
      else ctx.fillRect(ox + 2, 3, W - 4, 5);
      // interior brillante (abierto)
      if (open) {
        ctx.fillStyle = '#fff3c4';
        ctx.fillRect(ox + 3, 6, W - 6, 3);
        ctx.fillStyle = gold;
        ctx.fillRect(ox + 5, 5, W - 10, 2);
      }
      // bandas doradas + cerradura
      ctx.fillStyle = gold;
      ctx.fillRect(ox + W / 2 - 1, open ? 1 : 2, 2, H - 4);
      ctx.fillRect(ox + 1, 10, W - 2, 2);
      ctx.fillStyle = outline;
      ctx.fillRect(ox + W / 2 - 2, open ? 3 : 7, 4, 4);
    };

    drawChest(0, false);
    drawChest(W, true);
    canvas.refresh();
    // Sub-frames: la textura de canvas trae un solo frame por defecto.
    canvas.add(0, 0, 0, 0, W, H);
    canvas.add(1, 0, W, 0, W, H);
  }

  // ---- Emblemas: flor, nota, estrella (16x16) ----
  makeEmblemTextures() {
    const S = 16;

    // Flor
    const flower = this.textures.createCanvas('emblem-flower', S, S);
    {
      const c = flower.context;
      c.fillStyle = hex(PALETTE.outline);
      c.fillRect(6, 12, 4, 4);
      c.fillStyle = '#6f9e6b';
      c.fillRect(7, 11, 2, 5);
      c.fillStyle = hex(PALETTE.pink);
      const petals = [
        [7, 2], [3, 5], [11, 5], [5, 9], [9, 9],
      ];
      for (const [x, y] of petals) c.fillRect(x - 1, y - 1, 5, 5);
      c.fillStyle = hex(PALETTE.gold);
      c.fillRect(6, 5, 4, 4);
    }
    flower.refresh();

    // Nota musical
    const note = this.textures.createCanvas('emblem-note', S, S);
    {
      const c = note.context;
      c.fillStyle = hex(PALETTE.outline);
      c.fillRect(9, 1, 2, 11);
      c.fillRect(11, 2, 3, 2);
      c.beginPath();
      c.arc(7, 12, 4, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = hex(PALETTE.lavender);
      c.fillRect(10, 2, 2, 10);
      c.fillRect(12, 3, 2, 1);
      c.beginPath();
      c.arc(7, 12, 2.6, 0, Math.PI * 2);
      c.fill();
    }
    note.refresh();

    // Estrella
    const star = this.textures.createCanvas('emblem-star', S, S);
    {
      const c = star.context;
      const cx = 8;
      const cy = 8;
      const pts = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 7 : 3;
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
      }
      c.fillStyle = hex(PALETTE.outline);
      c.beginPath();
      pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
      c.closePath();
      c.fill();
      const inner = pts.map(([x, y]) => [cx + (x - cx) * 0.78, cy + (y - cy) * 0.78]);
      c.fillStyle = hex(PALETTE.gold);
      c.beginPath();
      inner.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
      c.closePath();
      c.fill();
    }
    star.refresh();
  }

  // ---- Arco de meta + barrera (trellis de flores) ----
  makeGateTextures() {
    const W = 40;
    const H = 60;
    const canvas = this.textures.createCanvas('gate-arch', W, H);
    const c = canvas.context;
    const outline = hex(PALETTE.outline);
    const wood = '#b98a5a';
    const woodDark = '#8a6136';
    c.fillStyle = outline;
    c.fillRect(0, 0, 6, H);
    c.fillRect(W - 6, 0, 6, H);
    c.fillRect(0, 0, W, 8);
    c.fillStyle = wood;
    c.fillRect(2, 2, 3, H - 2);
    c.fillRect(W - 5, 2, 3, H - 2);
    c.fillRect(2, 2, W - 4, 5);
    c.fillStyle = woodDark;
    c.fillRect(2, 6, W - 4, 2);
    // flores decorativas arriba
    c.fillStyle = hex(PALETTE.pink);
    for (const x of [8, 16, 24, 32]) {
      c.fillRect(x - 2, -3, 5, 5);
    }
    c.fillStyle = hex(PALETTE.gold);
    for (const x of [8, 16, 24, 32]) c.fillRect(x, -2, 2, 2);
    canvas.refresh();

    // Barrera (arbusto/trellis que bloquea hasta confirmar el recuerdo).
    const barrier = this.textures.createCanvas('gate-barrier', 20, H);
    const b = barrier.context;
    b.fillStyle = hex(PALETTE.outline);
    b.fillRect(2, 0, 16, H);
    b.fillStyle = '#6f9e6b';
    b.fillRect(3, 2, 14, H - 4);
    b.fillStyle = '#88b884';
    for (let y = 6; y < H - 4; y += 10) b.fillRect(5, y, 10, 4);
    b.fillStyle = hex(PALETTE.pink);
    for (let y = 10; y < H - 4; y += 14) b.fillRect(7, y, 4, 4);
    barrier.refresh();
  }

  // ---- Torta (apagada / encendida) + regalo ----
  makeCakeTextures() {
    const W = 28;
    const H = 28;
    const canvas = this.textures.createCanvas('cake', W * 2, H);
    const c = canvas.context;
    const draw = (ox, lit) => {
      const outline = hex(PALETTE.outline);
      // plato
      c.fillStyle = outline;
      c.fillRect(ox + 2, H - 4, W - 4, 3);
      // cuerpo
      c.fillStyle = hex(PALETTE.cream);
      c.fillRect(ox + 4, H - 14, W - 8, 10);
      c.fillStyle = hex(PALETTE.pink);
      c.fillRect(ox + 4, H - 14, W - 8, 3);
      // vela
      c.fillStyle = outline;
      c.fillRect(ox + W / 2 - 2, H - 22, 4, 9);
      c.fillStyle = '#fff6d5';
      c.fillRect(ox + W / 2 - 1, H - 21, 2, 8);
      // llama
      if (lit) {
        c.fillStyle = hex(PALETTE.gold);
        c.fillRect(ox + W / 2 - 1, H - 26, 2, 3);
        c.fillStyle = '#fff0a8';
        c.fillRect(ox + W / 2, H - 26, 1, 2);
      }
    };
    draw(0, false);
    draw(W, true);
    canvas.refresh();
    // Sub-frames: apagada (0) / encendida (1).
    canvas.add(0, 0, 0, 0, W, H);
    canvas.add(1, 0, W, 0, W, H);
  }

  makeGiftTexture() {
    const S = 20;
    const canvas = this.textures.createCanvas('gift', S, S);
    const c = canvas.context;
    const outline = hex(PALETTE.outline);
    c.fillStyle = outline;
    c.fillRect(1, 5, S - 2, S - 6);
    c.fillStyle = hex(PALETTE.lavender);
    c.fillRect(2, 6, S - 4, S - 8);
    c.fillStyle = hex(PALETTE.gold);
    c.fillRect(S / 2 - 2, 5, 4, S - 6);
    c.fillRect(1, 9, S - 2, 3);
    c.fillStyle = hex(PALETTE.pink);
    c.fillRect(S / 2 - 5, 1, 4, 5);
    c.fillRect(S / 2 + 1, 1, 4, 5);
    canvas.refresh();
  }

  // ------------------------------------------------------------- animaciones

  createAnimations() {
    // --- Cuy: rangos reales leídos del manifiesto del generador.
    const range = (key) => {
      const frames = ANIMATIONS[key].length;
      const start = ANIMATION_ORDER.slice(0, ANIMATION_ORDER.indexOf(key)).reduce(
        (n, k) => n + ANIMATIONS[k].length,
        0
      );
      return { start, end: start + frames - 1, frames };
    };
    const anim = (key, frameRate, repeat) => {
      const r = range(key);
      this.anims.create({
        key: `cuy-${key}`,
        frames: this.anims.generateFrameNumbers('cuy', { start: r.start, end: r.end }),
        frameRate,
        repeat,
      });
    };
    anim('idle', 4, -1);
    anim('run', 12, -1);
    anim('jump', 6, 0);
    anim('fall', 6, -1);
    anim('land', 10, 0);
    anim('celebrate', 6, -1);
    anim('surprise', 5, -1);

    // --- Moneda (se conserva del original).
    this.anims.create({
      key: 'coin-spin',
      frames: this.anims.generateFrameNumbers('tiles', { frames: [151, 152] }),
      frameRate: 6,
      repeat: -1,
    });

    // --- Walker (enemigo suave).
    this.anims.create({
      key: 'walker-walk',
      frames: this.anims.generateFrameNumbers('chars', { frames: [18, 19] }),
      frameRate: 6,
      repeat: -1,
    });

    // --- Cofre: cerrado → abierto.
    this.anims.create({
      key: 'chest-open',
      frames: this.anims.generateFrameNumbers('chest', { frames: [0, 1, 1, 1] }),
      frameRate: 12,
      repeat: 0,
    });
  }
}
