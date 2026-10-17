import Phaser from 'phaser';
import Player from '../objects/Player.js';
import Walker from '../objects/Walker.js';
import { rasterizeText } from '../assets/blockFont.js';
import { touchState } from '../input/TouchControls.js';
import { LEVELS, THEMES } from '../levels/index.js';
import { sfx } from '../audio/sfx.js';
import { music } from '../audio/music.js';
import {
  MEMORIES,
  BONUS_MEMORIES,
  BONUS_BY_CHAR,
  HELP,
  HELP_AFTER_FALLS,
  SKY_MESSAGES,
  levelById,
  LEVELS as CAMPAIGN_LEVELS,
} from '../content/birthday.js';
import {
  getState,
  canExitLevel,
  confirmMemory,
  isMemoryConfirmed,
  markBonusFound,
  isBonusFound,
  getAudioPreference,
  setAudioPreference,
} from '../state/save.js';
import { resolvePhoto } from '../ui/photos.js';
import {
  showMemory,
  showChoice,
  showAlbum,
  openPhotoViewer,
  setOnStackEmpty,
  closeAll,
  toast,
} from '../ui/narrative.js';

// ---- World ----
const GAME_WIDTH = 800;
const GAME_HEIGHT = 450;
const TILE = 18;
const ROWS = GAME_HEIGHT / TILE; // 25 — world height is fixed

// ---- Tile frame indices in the 'tiles' spritesheet ----
const T = {
  PLATFORM_SINGLE: 76,
  PLATFORM_LEFT: 77,
  PLATFORM_MID: 78,
  PLATFORM_RIGHT: 79,
  CLOUD_LEFT: 153,
  CLOUD_MID: 154,
  CLOUD_RIGHT: 155,
  CLOUD_SMALL: 156,
  SIGN_RIGHT: 86,
  SPROUT: 124,
  BUSH: 125,
  PINE: 126,
  COIN: 151,
  BLOCK_QUESTION: 10,
  BLOCK_USED: 31,
  BRICK: 6,
};

const DECOR = { '>': T.SIGN_RIGHT, '*': T.BUSH, '^': T.PINE, '"': T.SPROUT, o: 145 };

// Collectible grid char → emblem texture + label.
const COLLECTIBLES = {
  f: { texture: 'emblem-flower', label: 'flor' },
  n: { texture: 'emblem-note', label: 'nota musical' },
  s: { texture: 'emblem-star', label: 'estrella' },
};

const STOMP_BOUNCE = -300;
const ASSIST_JUMP_VELOCITY = -430;
const GATE_BARRIER_HEIGHT = 160;

// "Game feel" del salto: evita que se pierda una pulsación al correr o al
// pisar el borde de una plataforma.
const JUMP_BUFFER_MS = 130; // recuerda el salto pulsado justo antes de aterrizar
const COYOTE_MS = 100; // permite saltar un instante después de dejar el suelo

// ---- Scoring (kept minimal: the game is a gift, not a competition) ----
const SCORE_COIN = 100;
const SCORE_COLLECTIBLE = 250;
const SCORE_STOMP = 100;

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    this.levelId = data.levelId ?? 'level1';
    this.spawnColOverride = data.spawnCol ?? null;
  }

  create() {
    this.level = LEVELS[this.levelId];
    this.theme = THEMES[this.level.theme];
    this.worldWidth = this.level.width * TILE;
    this.contentLevel = levelById(this.levelId);

    this.worldFrozen = false;
    this.finishing = false;
    this.falls = 0;
    this.helpOffered = false;
    this.assist = false;
    this.airJumpUsed = false;
    this.gateHintShown = false;

    this.chests = [];
    this.collected = 0;
    this.collectibleTotal = 0;

    if (!this.scene.isActive('HUDScene')) this.scene.launch('HUDScene');
    this.registry.set('world', this.level.title ?? this.level.name);
    this.registry.set('coins', 0);
    this.registry.set('score', 0);

    music.play(this.contentLevel?.music ?? 'intro');

    this.solids = [];
    this.blocks = this.physics.add.staticGroup();
    this.coins = this.add.group();
    this.enemies = this.add.group();
    this.collectibles = this.add.group();
    this.chestZones = this.physics.add.staticGroup();
    this.gateSolids = this.physics.add.staticGroup();
    this.gateZones = this.physics.add.staticGroup();
    this.gate = null;

    this.cameras.main.setBackgroundColor(this.theme.sky);
    if (this.theme.parallax) this.buildParallax();

    // World bounds: bottom check OFF so you can fall into pits.
    this.physics.world.setBounds(0, 0, this.worldWidth, GAME_HEIGHT, true, true, true, false);

    this.parseGrid();
    this.drawSkyMessages();
    this.spawnPlayer();
    this.setupInput();
    this.setupPause();

    this.registry.set('coins', 0);
    this.registry.set('emblems', 0);
    this.registry.set('collectiblesTotal', this.collectibleTotal);

    const cam = this.cameras.main;
    cam.setBounds(0, 0, this.worldWidth, GAME_HEIGHT);
    cam.startFollow(this.player, true, 0.12, 0.12);
    cam.fadeIn(250);

    // --- Physics wiring
    this.physics.add.collider(this.player, this.solids);
    this.physics.add.collider(this.player, this.blocks, this.onPlayerBlockCollide, null, this);
    this.physics.add.collider(this.player, this.gateSolids, this.onGateBlock, null, this);
    this.physics.add.collider(this.enemies, this.solids);
    this.physics.add.collider(this.enemies, this.blocks);
    this.physics.add.collider(this.enemies, this.gateSolids);
    this.physics.add.collider(this.enemies, this.enemies);
    this.physics.add.overlap(this.player, this.coins, this.onCollectCoin, null, this);
    this.physics.add.overlap(this.player, this.collectibles, this.onCollectEmblem, null, this);
    this.physics.add.overlap(this.player, this.enemies, this.onPlayerEnemyContact, null, this);
    this.physics.add.overlap(this.player, this.chestZones, this.onChestZone, null, this);
    this.physics.add.overlap(this.player, this.gateZones, this.onGateZone, null, this);

    // If this memory was already confirmed (replay), the gate starts open.
    if (isMemoryConfirmed(this.level.memory)) this.openGate(true);

    this.events.once('shutdown', () => {
      music.duck(false);
      setOnStackEmpty(null);
      closeAll();
      document.getElementById('app')?.removeAttribute('inert');
    });
  }

  // ----------------------------------------------------- grid parsing

  buildMatrix() {
    const { rows, width } = this.level;
    const empty = ' '.repeat(width);
    const pad = Array(ROWS - rows.length).fill(empty);
    return pad.concat(rows.map((r) => r.padEnd(width, ' ')));
  }

  parseGrid() {
    const grid = this.buildMatrix();
    const width = this.level.width;
    this.grid = grid;

    const isFilled = (row, col) =>
      row >= 0 && row < ROWS && col >= 0 && col < width &&
      (grid[row][col] === 'X' || grid[row][col] === 'x');

    for (let row = 0; row < ROWS; row++) {
      let col = 0;
      while (col < width) {
        const ch = grid[row][col];
        const x = col * TILE + TILE / 2;
        const y = row * TILE + TILE / 2;

        if (ch === 'X') {
          const start = col;
          while (col < width && grid[row][col] === 'X') {
            const frame = isFilled(row - 1, col) ? this.theme.terrainFill : this.theme.terrainTop;
            this.add.image(col * TILE + TILE / 2, y, 'tiles', frame);
            col++;
          }
          const run = col - start;
          this.addSolid(start * TILE + (run * TILE) / 2, y, run * TILE, TILE);
          continue;
        }

        if (ch === 'x') {
          const frame = isFilled(row - 1, col) ? this.theme.terrainFill : this.theme.terrainTop;
          this.add.image(x, y, 'tiles', frame);
          col++;
          continue;
        }

        if (ch === 'P') {
          const start = col;
          while (col < width && grid[row][col] === 'P') col++;
          this.buildPlatform(start, col - start, row);
          continue;
        }

        // Cofres sorpresa (letra propia → id de recuerdo). No son obligatorios.
        if (BONUS_BY_CHAR[ch]) {
          this.buildBonusChest(col, row, BONUS_BY_CHAR[ch]);
          col++;
          continue;
        }

        switch (ch) {
          case 'B':
            this.addBlock(x, y, T.BRICK, 'brick');
            break;
          case '?':
          case 'M':
          case 'S':
            this.addBlock(x, y, T.BLOCK_QUESTION, 'question', 'coin');
            break;
          case 'c': {
            const coin = this.add.sprite(x, y, 'tiles', T.COIN).play('coin-spin');
            this.physics.add.existing(coin, true);
            this.coins.add(coin);
            break;
          }
          case 'e':
            this.enemies.add(new Walker(this, x, y));
            break;
          case 'p':
            this.spawnCol = col;
            this.spawnRow = row;
            break;
          case 'K':
            this.buildChest(col, row);
            break;
          case 'G':
            this.buildGate(col, row);
            break;
          case 'f':
          case 'n':
          case 's':
            this.buildCollectible(x, y, ch);
            break;
          default:
            if (DECOR[ch]) {
              this.add.image(x, (row + 1) * TILE, 'tiles', DECOR[ch]).setOrigin(0.5, 1);
            }
        }
        col++;
      }
    }
  }

  findFloorRow(col, fromRow = 0) {
    for (let row = fromRow; row < ROWS; row++) {
      if (this.grid[row][col] === 'X') return row;
    }
    return ROWS - 2;
  }

  // ----------------------------------------------------- sky messages
  //
  // Dibuja el mensaje de este nivel (SKY_MESSAGES) con "bloques" en el cielo.
  // Son imágenes decorativas sin cuerpo de física, así que NUNCA estorban el
  // camino: el mensaje queda elevado y se atraviesa sin más.
  drawSkyMessages() {
    const msg = SKY_MESSAGES.find((m) => m.level === this.levelId);
    if (!msg || !msg.text) return;

    const { cells, width } = rasterizeText(msg.text);
    if (!cells.length) return;

    // Centrado sobre la primera pantalla salvo que se indique `col`.
    const screenCols = Math.floor(GAME_WIDTH / TILE);
    const startCol = Number.isInteger(msg.col)
      ? msg.col
      : Math.max(1, Math.round((screenCols - width) / 2));
    const startRow = Math.max(0, msg.row ?? 3);

    const maxCol = this.level.width - 1;
    const maxRow = ROWS - 1;
    this.bannerTiles = [];
    for (const { dx, dy } of cells) {
      const col = startCol + dx;
      const row = startRow + dy;
      if (col < 0 || col > maxCol || row < 0 || row > maxRow) continue;
      const img = this.add
        .image(col * TILE + TILE / 2, row * TILE + TILE / 2, 'tiles', T.BRICK)
        .setDepth(1);
      this.bannerTiles.push(img);
    }
  }

  buildPlatform(startCol, run, row) {
    const y = row * TILE + TILE / 2;
    for (let i = 0; i < run; i++) {
      let frame = T.PLATFORM_MID;
      if (run === 1) frame = T.PLATFORM_SINGLE;
      else if (i === 0) frame = T.PLATFORM_LEFT;
      else if (i === run - 1) frame = T.PLATFORM_RIGHT;
      this.add.image((startCol + i) * TILE + TILE / 2, y, 'tiles', frame);
    }
    this.addSolid(startCol * TILE + (run * TILE) / 2, y, run * TILE, TILE);
  }

  addBlock(x, y, frame, type, content = null) {
    const block = this.blocks.create(x, y, 'tiles', frame);
    block.setData('type', type);
    if (content) block.setData('content', content);
    return block;
  }

  addSolid(x, y, width, height) {
    const zone = this.add.zone(x, y, width, height);
    this.physics.add.existing(zone, true);
    this.solids.push(zone);
    return zone;
  }

  buildCollectible(x, y, ch) {
    const spec = COLLECTIBLES[ch];
    const sprite = this.add.sprite(x, y, spec.texture).setDepth(1);
    sprite.setData('kind', ch);
    this.physics.add.existing(sprite, true);
    this.collectibles.add(sprite);
    this.tweens.add({
      targets: sprite,
      y: y - 3,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.collectibleTotal += 1;
  }

  // ----------------------------------------------------- chest & gate

  buildChest(col, row) {
    const floorRow = this.findFloorRow(col, row);
    const floorY = floorRow * TILE;
    const cx = col * TILE + TILE / 2;
    const memoryId = this.level.memory;
    const confirmed = isMemoryConfirmed(memoryId);

    const sprite = this.add.sprite(cx, floorY - 9, 'chest', confirmed ? 1 : 0).setDepth(1);
    const zone = this.add.zone(cx, floorY - 60, 92, 140);
    this.physics.add.existing(zone, true);
    const index = this.chests.length;
    zone.setData('chestIndex', index);
    this.chestZones.add(zone);

    this.chests.push({
      kind: 'memory',
      sprite,
      zone,
      memoryId,
      floorRow,
      col,
      opened: false,
      safeCol: Math.max(2, col - 5),
    });
  }

  // Cofre sorpresa: no abre la meta, guarda un recuerdo extra en el álbum.
  // Se distingue por el lazo (`gift`) que flota encima.
  buildBonusChest(col, row, bonusId) {
    const bonus = BONUS_MEMORIES[bonusId];
    if (!bonus) return;
    const floorRow = this.findFloorRow(col, row);
    const floorY = floorRow * TILE;
    const cx = col * TILE + TILE / 2;
    const found = isBonusFound(bonusId);

    const sprite = this.add.sprite(cx, floorY - 9, 'chest', found ? 1 : 0).setDepth(1);

    let marker = null;
    if (!found) {
      marker = this.add.sprite(cx, floorY - 32, 'gift').setDepth(1);
      this.tweens.add({
        targets: marker,
        y: floorY - 38,
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    const zone = this.add.zone(cx, floorY - 60, 92, 140);
    this.physics.add.existing(zone, true);
    const index = this.chests.length;
    zone.setData('chestIndex', index);
    this.chestZones.add(zone);

    this.chests.push({
      kind: 'bonus',
      bonusId,
      sprite,
      marker,
      zone,
      floorRow,
      col,
      opened: found,
      safeCol: Math.max(2, col - 5),
    });
  }

  buildGate(col, row) {
    const floorRow = this.findFloorRow(col, row);
    const floorY = floorRow * TILE;
    const gx = col * TILE + TILE / 2;

    this.add.image(gx, floorY, 'gate-arch').setOrigin(0.5, 1).setDepth(0);

    const barrier = this.add
      .tileSprite(gx, floorY - GATE_BARRIER_HEIGHT / 2, 20, GATE_BARRIER_HEIGHT, 'gate-barrier')
      .setDepth(3);
    const solid = this.add.zone(gx, floorY - GATE_BARRIER_HEIGHT / 2, 20, GATE_BARRIER_HEIGHT);
    this.physics.add.existing(solid, true);
    this.gateSolids.add(solid);

    const zone = this.add.zone(gx, floorY - 30, 30, 60);
    this.physics.add.existing(zone, true);
    this.gateZones.add(zone);

    this.gate = { x: gx, floorY, col, barrier, solid, open: false };
  }

  openGate(instant = false) {
    if (!this.gate || this.gate.open) return;
    this.gate.open = true;
    this.gate.solid.destroy();
    if (instant) {
      this.gate.barrier.destroy();
      return;
    }
    sfx.play('gate');
    if (this.gate.barrier.body) this.gate.barrier.body.enable = false;
    this.tweens.add({
      targets: this.gate.barrier,
      alpha: 0,
      scaleY: 0.2,
      duration: 500,
      ease: 'Quad.easeIn',
      onComplete: () => this.gate.barrier.destroy(),
    });
  }

  spawnPlayer() {
    const col = this.spawnColOverride ?? this.spawnCol ?? 3;
    const fromRow = this.spawnColOverride !== null ? 0 : this.spawnRow ?? 0;
    const floorRow = this.findFloorRow(col, fromRow);
    const feetY = floorRow * TILE;

    this.player = new Player(this, col * TILE + TILE / 2, feetY - 12);
    this.player.y = feetY - this.player.feetOffset;
    this.player.body.reset(this.player.x, this.player.y);
    this.checkpoint = { col, row: fromRow };
  }

  // ----------------------------------------------------------- parallax

  buildParallax() {
    this.hills = this.add
      .tileSprite(GAME_WIDTH / 2, 414 - 36, Math.ceil(GAME_WIDTH / 3), 24, 'tex-hills')
      .setScale(3)
      .setScrollFactor(0)
      .setDepth(-10);

    const span = GAME_WIDTH + (this.worldWidth - GAME_WIDTH) * 0.2;
    for (let x = 100; x < span; x += Phaser.Math.Between(160, 240)) {
      const y = Phaser.Math.Between(50, 130);
      if (Phaser.Math.Between(0, 2) === 2) {
        this.add.image(x, y, 'tiles', T.CLOUD_SMALL).setScale(2).setScrollFactor(0.2).setDepth(-10);
      } else {
        this.add.image(x - 36, y, 'tiles', T.CLOUD_LEFT).setScale(2).setScrollFactor(0.2).setDepth(-10);
        this.add.image(x, y, 'tiles', T.CLOUD_MID).setScale(2).setScrollFactor(0.2).setDepth(-10);
        this.add.image(x + 36, y, 'tiles', T.CLOUD_RIGHT).setScale(2).setScrollFactor(0.2).setDepth(-10);
      }
    }
  }

  // ------------------------------------------------------------- blocks

  onPlayerBlockCollide(player, block) {
    const hitFromBelow = player.body.touching.up && block.y < player.y;
    if (!hitFromBelow) return;
    const type = block.getData('type');
    if (type === 'question') this.openQuestionBlock(block);
    else if (type === 'brick') this.bumpBlock(block);
  }

  openQuestionBlock(block) {
    block.setData('type', 'used');
    block.setFrame(T.BLOCK_USED);
    this.bumpBlock(block);

    const coin = this.add.sprite(block.x, block.y - TILE, 'tiles', T.COIN).play('coin-spin');
    sfx.play('coin');
    this.sparkle(block.x, block.y - TILE);
    this.addScore(SCORE_COIN, block.x, block.y - TILE * 2);
    this.bumpCoinCount();
    this.tweens.add({
      targets: coin,
      y: coin.y - 30,
      duration: 200,
      ease: 'Quad.easeOut',
      yoyo: true,
      onComplete: () => coin.destroy(),
    });
  }

  bumpBlock(block) {
    sfx.play('bump');
    this.tweens.add({
      targets: block,
      y: block.y - 6,
      duration: 70,
      ease: 'Quad.easeOut',
      yoyo: true,
    });
  }

  // ---------------------------------------------------- collect & score

  bumpCoinCount() {
    this.registry.values.coins += 1;
  }

  onCollectCoin(player, coin) {
    coin.body.enable = false;
    sfx.play('coin');
    this.sparkle(coin.x, coin.y);
    this.addScore(SCORE_COIN, coin.x, coin.y);
    this.bumpCoinCount();
    this.tweens.add({
      targets: coin,
      y: coin.y - 24,
      scale: 1.4,
      alpha: 0,
      duration: 250,
      ease: 'Cubic.easeOut',
      onComplete: () => coin.destroy(),
    });
  }

  onCollectEmblem(player, emblem) {
    if (!emblem.active) return;
    emblem.body.enable = false;
    this.collected += 1;
    this.registry.set('emblems', this.collected);
    sfx.play('emblem');
    this.sparkle(emblem.x, emblem.y, 0xffe066);
    this.addScore(SCORE_COLLECTIBLE, emblem.x, emblem.y);
    this.tweens.add({
      targets: emblem,
      y: emblem.y - 22,
      scale: 1.5,
      alpha: 0,
      duration: 260,
      ease: 'Cubic.easeOut',
      onComplete: () => emblem.destroy(),
    });
  }

  // ------------------------------------------------------ player contact

  onPlayerEnemyContact(player, enemy) {
    if (player.isDead || enemy.isSquashed || this.worldFrozen || this.finishing) return;

    const stomping =
      player.body.velocity.y > 0 &&
      player.body.bottom < enemy.body.center.y + 4;

    if (stomping) {
      enemy.squash();
      sfx.play('stomp');
      this.cameras.main.shake(70, 0.004);
      player.body.setVelocityY(STOMP_BOUNCE);
      this.addScore(SCORE_STOMP, enemy.x, enemy.y - 16);
    } else {
      this.killPlayer();
    }
  }

  sparkle(x, y, tint = 0xffe066) {
    const particles = this.add
      .particles(x, y, 'spark', {
        speed: { min: 50, max: 150 },
        lifespan: 350,
        scale: { start: 1.3, end: 0 },
        tint,
        emitting: false,
      })
      .setDepth(5);
    particles.explode(8);
    this.time.delayedCall(500, () => particles.destroy());
  }

  addScore(amount, x, y) {
    this.registry.values.score += amount;
    const popup = this.add
      .text(x, y, `+${amount}`, {
        fontFamily: 'monospace',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setStroke('#000000', 3)
      .setDepth(10);
    this.tweens.add({
      targets: popup,
      y: y - 28,
      alpha: 0,
      duration: 600,
      onComplete: () => popup.destroy(),
    });
  }

  // ---------------------------------------------------- freeze / lock

  lock() {
    if (this.worldFrozen) return;
    this.worldFrozen = true;
    this.player.setFrozen(true);
    if (this.player.body) this.player.body.setVelocity(0, 0);
    music.duck(true);
    setOnStackEmpty(() => this.unlock());
  }

  unlock() {
    if (!this.worldFrozen) return;
    this.worldFrozen = false;
    if (this.player && this.player.active) this.player.setFrozen(false);
    music.duck(false);
    setOnStackEmpty(null);
  }

  // ------------------------------------------------------------- álbum

  async openAlbum() {
    if (this.worldFrozen || this.finishing || this.player.isDead) return;
    this.lock();

    const memories = [];
    for (const level of CAMPAIGN_LEVELS) {
      const memory = MEMORIES[level.memory];
      const acknowledged = isMemoryConfirmed(level.memory);
      let photoUrl = null;
      if (acknowledged) {
        const r = await resolvePhoto(memory.photo);
        if (r.ok) photoUrl = r.url;
      }
      memories.push({ ...memory, emblem: level.emblem, acknowledged, photoUrl });
    }

    // Recuerdos sorpresa ya encontrados (no revelamos los que faltan: spoiler).
    for (const bonus of Object.values(BONUS_MEMORIES)) {
      if (!isBonusFound(bonus.id)) continue;
      let photoUrl = null;
      const r = await resolvePhoto(bonus.photo);
      if (r.ok) photoUrl = r.url;
      memories.push({
        ...bonus,
        emblem: null,
        emoji: bonus.emoji || '🎁',
        acknowledged: true,
        photoUrl,
      });
    }

    if (!this.scene.isActive()) return;
    showAlbum({
      memories,
      onOpenMemory: (entry) => openPhotoViewer(entry, entry.photoUrl),
    });
  }

  // ------------------------------------------------------------- audio

  toggleMute() {
    const pref = getAudioPreference();
    const muted = !pref.muted;
    setAudioPreference(muted);
    sfx.setMuted(muted);
    music.setMuted(muted);
    return muted;
  }

  // ------------------------------------------------------------- chests

  onChestZone(player, zone) {
    if (this.worldFrozen || this.finishing || this.player.isDead) return;
    const chest = this.chests[zone.getData('chestIndex')];
    if (!chest || chest.opened) return;
    this.openChest(chest);
  }

  async openChest(chest) {
    chest.opened = true;
    this.lock();

    chest.sprite.play('chest-open');
    sfx.play('chest');
    this.sparkle(chest.sprite.x, chest.sprite.y - 6, 0xffe066);

    if (chest.kind === 'bonus') {
      const bonus = BONUS_MEMORIES[chest.bonusId];
      const bonusResult = await showMemory({
        memory: bonus,
        getPhoto: () => resolvePhoto(bonus.photo),
        onExitToMenu: () => {
          this.scene.start('TitleScene');
        },
      });
      if (!this.scene.isActive()) return;
      if (bonusResult === 'confirmed') {
        markBonusFound(chest.bonusId);
        chest.sprite.setFrame(1);
        if (chest.marker) chest.marker.destroy();
        this.player.celebrate(1200);
        sfx.play('emblem');
        toast(`${bonus.emoji || '🎁'} ¡Sorpresa guardada en tu álbum!`);
      } else {
        chest.sprite.setFrame(0);
        chest.opened = false;
      }
      this.unlock();
      return;
    }

    const memory = MEMORIES[chest.memoryId];
    const result = await showMemory({
      memory,
      getPhoto: () => resolvePhoto(memory.photo),
      onExitToMenu: () => {
        this.scene.start('TitleScene');
      },
    });

    if (!this.scene.isActive()) return;

    if (result === 'confirmed') {
      confirmMemory(chest.memoryId);
      chest.sprite.setFrame(1);
      this.openGate();
      this.checkpoint = { col: chest.safeCol, row: chest.floorRow - 1 };
      this.player.celebrate(1400);
      sfx.play('emblem');
      toast('¡Emblema conseguido! La meta se abrió.');
    } else {
      // Error de foto o cierre inesperado: el cofre queda disponible de nuevo.
      chest.sprite.setFrame(0);
      chest.opened = false;
    }
    this.unlock();
  }

  // ------------------------------------------------------------- gate

  onGateBlock(player, solid) {
    if (this.gate?.open || this.gateHintShown || this.worldFrozen) return;
    this.gateHintShown = true;
    toast('Abre el cofre del recuerdo para abrir la meta 💝');
  }

  onGateZone() {
    this.tryFinish();
  }

  tryFinish() {
    if (this.finishing || this.worldFrozen || this.player.isDead) return;
    if (!this.gate?.open || !canExitLevel(getState(), this.levelId)) {
      this.onGateBlock();
      return;
    }
    this.finishing = true;
    this.player.setFrozen(true);
    if (this.player.body) this.player.body.setVelocity(0, 0);
    sfx.play('flag');
    this.cameras.main.fadeOut(700);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      if (this.level.next === 'epilogue') this.scene.start('EpilogueScene');
      else this.scene.start('IntroScene', { levelId: this.level.next });
    });
  }

  // ------------------------------------------------------- death & help

  killPlayer() {
    if (this.player.isDead || this.worldFrozen || this.finishing) return;
    sfx.play('death');
    this.player.die();
    this.cameras.main.stopFollow();
    this.cameras.main.fadeOut(220);
    this.time.delayedCall(430, () => this.respawn());
  }

  respawn() {
    this.falls += 1;
    const col = this.checkpoint.col;
    const row = this.checkpoint.row ?? 0;
    const floorRow = this.findFloorRow(col, row);
    const feetY = floorRow * TILE;
    this.player.revive(col * TILE + TILE / 2, feetY - this.player.feetOffset);
    this.airJumpUsed = false;
    this.cameras.main.fadeIn(250);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.maybeOfferHelp();
  }

  async maybeOfferHelp() {
    if (this.helpOffered || this.falls < HELP_AFTER_FALLS) return;
    this.helpOffered = true;
    this.lock();
    const answer = await showChoice({
      title: HELP.prompt,
      message: 'Puedo dejarte dar un saltito extra en el aire para pasar los huecos.',
      yes: HELP.yes,
      no: HELP.no,
    });
    if (!this.scene.isActive()) return;
    if (answer === 'yes') {
      this.assist = true;
      toast('¡Saltito extra activado! Pulsa saltar otra vez en el aire.');
    }
    this.unlock();
  }

  // ------------------------------------------------------- timer & pause

  setupPause() {
    this.input.keyboard.on('keydown-ESC', () => this.pauseGame());
    this.input.keyboard.on('keydown-P', () => this.pauseGame());
  }

  pauseGame() {
    if (this.worldFrozen || this.finishing || this.player.isDead || this.scene.isPaused()) return;
    this.scene.launch('PauseScene');
    this.scene.pause();
  }

  // -------------------------------------------------------------- input

  setupInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D');
    this.jumpWasHeld = false;
    this.jumpBufferMs = 0;
    this.coyoteMs = 0;
  }

  // -------------------------------------------------------------- update

  update(time, delta) {
    if (this.hills && this.cameras.main) {
      this.hills.tilePositionX = (this.cameras.main.scrollX * 0.4) / 3;
    }

    if (this.worldFrozen || this.finishing) {
      this.jumpBufferMs = 0;
      return;
    }
    if (this.player.isDead) {
      this.jumpBufferMs = 0;
      return;
    }

    if (this.player.y > GAME_HEIGHT + 40) {
      this.killPlayer();
      return;
    }

    const left = this.cursors.left.isDown || this.keys.A.isDown || touchState.left;
    const right = this.cursors.right.isDown || this.keys.D.isDown || touchState.right;
    const jumpHeld =
      this.cursors.up.isDown ||
      this.cursors.space.isDown ||
      this.keys.W.isDown ||
      touchState.jump;

    // Borde de la pulsación (teclado o botón táctil).
    const jumpEdge = jumpHeld && !this.jumpWasHeld;
    this.jumpWasHeld = jumpHeld;

    // Búfer: recuerda un salto pulsado un poco antes de tocar el suelo.
    if (jumpEdge) this.jumpBufferMs = JUMP_BUFFER_MS;
    else this.jumpBufferMs = Math.max(0, this.jumpBufferMs - delta);

    const onGround = this.player.body.onFloor();

    // Coyote: se puede saltar poco después de haber dejado el suelo.
    this.coyoteMs = onGround ? COYOTE_MS : Math.max(0, this.coyoteMs - delta);

    const canJump = onGround || this.coyoteMs > 0;
    if (this.jumpBufferMs > 0 && canJump && !this.player.isFrozen) {
      this.jumpBufferMs = 0;
      this.coyoteMs = 0;
      this.player.doJump();
    }

    this.player.handleInput({ left, right, jumpHeld });

    // "Patita" extra: a mid-air jump once the player accepts help.
    if (onGround) this.airJumpUsed = false;
    if (this.assist && jumpEdge && !onGround && !this.airJumpUsed && !this.player.isFrozen) {
      this.airJumpUsed = true;
      this.player.body.setVelocityY(ASSIST_JUMP_VELOCITY);
      this.player.squashStretch(0.85, 1.15);
      sfx.play('jump');
    }
  }
}
