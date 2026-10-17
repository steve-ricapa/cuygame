import Phaser from 'phaser';
import { music } from '../audio/music.js';
import { sfx } from '../audio/sfx.js';
import {
  MEMORIES,
  EPILOGUE,
  LETTER_FALLBACK,
  NICKNAME,
  VOICE_FILE,
  LEVELS,
} from '../content/birthday.js';
import {
  getFinaleStage,
  setFinaleStage,
  isMemoryConfirmed,
  setVoucherOptions,
  confirmVoucher,
  getVoucher,
} from '../state/save.js';
import { resolvePhoto, loadLetterText, audioExists, voiceUrl } from '../ui/photos.js';
import {
  showStep,
  showMemory,
  showLetter,
  showCandle,
  showReward,
  showCelebration,
  showAlbum,
  openPhotoViewer,
  confetti,
  toast,
} from '../ui/narrative.js';

// ============================================================================
// Epílogo: el jardín de la celebración (no es un cuarto nivel jugable).
// Presenta el cofre final, recuerda las tres fotos, la carta, la vela, la
// celebración y el vale de recompensa. El progreso vive en save.js.
// ============================================================================

const STAGES = ['idle', 'chest', 'photos', 'letter', 'candle', 'reward', 'done'];

export default class EpilogueScene extends Phaser.Scene {
  constructor() {
    super('EpilogueScene');
  }

  create() {
    const { width, height } = this.scale;
    this.scene.stop('HUDScene');
    this.scale.once('resize', () => this.scene.restart());
    this.cameras.main.setBackgroundColor('#bfe6f2');
    this.micCleanup = null;
    this.voiceAudio = null;

    this.buildGarden(width, height);
    music.play('epilogue');

    this.events.once('shutdown', () => {
      this.stopMic();
      if (this.voiceAudio) {
        this.voiceAudio.pause();
        this.voiceAudio = null;
      }
    });

    const stage = getFinaleStage();
    // Salvaguarda: si por algún motivo no se completaron los recuerdos,
    // volvemos al último nivel en vez de mostrar la celebración vacía.
    const allConfirmed = LEVELS.every((l) => isMemoryConfirmed(l.memory));
    if (!allConfirmed) {
      this.scene.start('IntroScene', { levelId: 'level3' });
      return;
    }

    this.runFrom(STAGES.includes(stage) ? stage : 'idle');
  }

  // ------------------------------------------------------------- escenario

  buildGarden(width, height) {
    const groundY = height - 36;

    this.add.tileSprite(width / 2, groundY - 26, Math.ceil(width / 3) + 1, 24, 'tex-hills')
      .setScale(3)
      .setDepth(-10);
    this.add.tileSprite(width / 2, groundY + 9, width, 18, 'tex-grass-top').setDepth(-4);
    this.add.tileSprite(width / 2, groundY + 29, width, 22, 'tex-dirt').setDepth(-4);

    for (const x of [40, 120, width - 60, width - 150]) {
      this.add.image(x, groundY, 'emblem-flower').setOrigin(0.5, 1).setScale(1.4).setDepth(-2);
    }

    // Cofre final abierto, torta y regalo.
    this.add.image(width / 2, groundY, 'chest', 1).setOrigin(0.5, 1).setScale(2).setDepth(1);
    this.add.image(width / 2 + 96, groundY, 'cake', 1).setOrigin(0.5, 1).setScale(1.6).setDepth(1);
    this.add.image(width / 2 - 96, groundY, 'gift').setOrigin(0.5, 1).setScale(1.8).setDepth(1);

    // El cuy, feliz.
    const cuy = this.add.sprite(width / 2 - 150, groundY, 'cuy', 0).setOrigin(0.5, 1).setScale(1.6);
    cuy.play('cuy-celebrate');

    this.add
      .text(width / 2, 46, EPILOGUE.celebrationTitle, {
        fontFamily: 'monospace',
        fontSize: '26px',
        fontStyle: 'bold',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: width - 40 },
      })
      .setOrigin(0.5)
      .setStroke('#a83246', 6);
  }

  // ---------------------------------------------------------- secuencia

  at(stage, target) {
    return STAGES.indexOf(stage) >= STAGES.indexOf(target);
  }

  async runFrom(stage) {
    if (!this.at(stage, 'chest')) {
      await this.stepChest();
      if (!this.scene.isActive()) return;
    }
    if (!this.at(stage, 'photos')) {
      await this.stepPhotos();
      if (!this.scene.isActive()) return;
    }
    if (!this.at(stage, 'letter')) {
      await this.stepLetter();
      if (!this.scene.isActive()) return;
    }
    if (!this.at(stage, 'candle')) {
      await this.stepCandle();
      if (!this.scene.isActive()) return;
    }
    if (!this.at(stage, 'reward')) {
      await this.stepReward();
      if (!this.scene.isActive()) return;
    }
    await this.stepFinale();
  }

  async stepChest() {
    sfx.play('chest');
    for (let i = 0; i < EPILOGUE.chestTaps.length; i += 1) {
      await showStep({
        title: EPILOGUE.chestTaps[i],
        message: i === 0 ? EPILOGUE.chestLine : undefined,
        emblems: LEVELS.map((l, idx) => ({ key: l.emblem, on: idx <= i })),
        button: i < EPILOGUE.chestTaps.length - 1 ? 'Seguir' : EPILOGUE.openButton,
      });
      if (!this.scene.isActive()) return;
      sfx.play('emblem');
      confetti(900);
    }
    setFinaleStage('chest');
  }

  async stepPhotos() {
    // Recapitulación de los tres recuerdos ya guardados.
    for (const level of LEVELS) {
      const memory = MEMORIES[level.memory];
      await showMemory({
        memory,
        getPhoto: () => resolvePhoto(memory.photo),
        onExitToMenu: () => this.scene.start('TitleScene'),
      });
      if (!this.scene.isActive()) return;
      sfx.play('emblem');
    }
    setFinaleStage('photos');
    await showStep({
      title: 'Tres momentos, una historia',
      message: 'Tu niñez, tu presente y todo lo bonito que viene.',
      button: EPILOGUE.continueButton,
    });
    if (!this.scene.isActive()) return;
  }

  async stepLetter() {
    const res = await loadLetterText();
    const text = res.ok ? res.text : LETTER_FALLBACK;
    const hasVoice = await audioExists(VOICE_FILE);
    if (!this.scene.isActive()) return;

    await showLetter({
      text,
      voiceAvailable: hasVoice,
      onVoice: () => this.playVoice(hasVoice),
    });
    setFinaleStage('letter');
  }

  playVoice(hasVoice) {
    if (!hasVoice) {
      toast('Todavía no hay una dedicatoria grabada.');
      return;
    }
    if (this.voiceAudio) {
      this.voiceAudio.pause();
      this.voiceAudio = null;
    }
    music.duck(true);
    const audio = new Audio(voiceUrl());
    this.voiceAudio = audio;
    audio.addEventListener('ended', () => {
      music.duck(false);
      this.voiceAudio = null;
    });
    audio.play().catch(() => {
      music.duck(false);
      toast('No pude reproducir la dedicatoria.');
    });
  }

  async stepCandle() {
    await showCandle({
      micAvailable: typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia,
      onMic: (blow) => this.startMic(blow),
    });
    if (!this.scene.isActive()) return;
    sfx.play('wish');
    confetti(1600);
    setFinaleStage('candle');
  }

  async stepReward() {
    const current = getVoucher();
    await showReward({
      initialOptionIds: current.optionIds,
      onSelectionChange: (ids) => setVoucherOptions(ids),
    });
    if (!this.scene.isActive()) return;
    confirmVoucher();
    setFinaleStage('reward');
  }

  async stepFinale() {
    setFinaleStage('done');
    music.play('epilogue');
    confetti(2600);
    this.presentFinale();
  }

  presentFinale() {
    showCelebration({
      onReplay: () => {
        confetti(1200);
        this.scene.start('TitleScene');
      },
      onAlbum: () => this.openAlbum(),
      onLetter: () => this.reopenLetter(),
      onVoucher: () => this.reopenVoucher(),
    });
  }

  async reopenLetter() {
    const res = await loadLetterText();
    const text = res.ok ? res.text : LETTER_FALLBACK;
    const hasVoice = await audioExists(VOICE_FILE);
    if (!this.scene.isActive()) return;
    await showLetter({ text, voiceAvailable: hasVoice, onVoice: () => this.playVoice(hasVoice) });
    if (!this.scene.isActive()) return;
    this.presentFinale();
  }

  async reopenVoucher() {
    const current = getVoucher();
    await showReward({
      initialOptionIds: current.optionIds,
      onSelectionChange: (ids) => setVoucherOptions(ids),
    });
    if (!this.scene.isActive()) return;
    confirmVoucher();
    this.presentFinale();
  }

  async openAlbum() {
    const memories = [];
    for (const level of LEVELS) {
      const memory = MEMORIES[level.memory];
      const acknowledged = isMemoryConfirmed(level.memory);
      let photoUrl = null;
      if (acknowledged) {
        const r = await resolvePhoto(memory.photo);
        if (r.ok) photoUrl = r.url;
      }
      memories.push({ ...memory, emblem: level.emblem, acknowledged, photoUrl });
    }
    if (!this.scene.isActive()) return;
    showAlbum({
      memories,
      onOpenMemory: (entry) => openPhotoViewer(entry, entry.photoUrl),
      // Al cerrar el álbum volvemos al panel de celebración (nunca a un callejón).
      onClose: () => this.presentFinale(),
    });
  }

  // --------------------------------------------------------- micrófono

  async startMic(blow) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AC = window.AudioContext || window.webkitAudioContext;
      const ctx = new AC();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      src.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);

      const cleanup = () => {
        if (this.micRaf) cancelAnimationFrame(this.micRaf);
        this.micRaf = null;
        stream.getTracks().forEach((t) => t.stop());
        ctx.close().catch(() => {});
        this.micCleanup = null;
      };
      this.micCleanup = cleanup;

      const tick = () => {
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i += 1) sum += data[i];
        const avg = sum / data.length;
        if (avg > 42) {
          cleanup();
          blow('mic');
          return;
        }
        this.micRaf = requestAnimationFrame(tick);
      };
      tick();
      toast('Sopla cerca del micrófono. Solo se usa para la vela.');
    } catch {
      toast('No pude usar el micrófono; usa el botón de la vela.');
    }
  }

  stopMic() {
    if (this.micCleanup) this.micCleanup();
    this.micCleanup = null;
  }
}
