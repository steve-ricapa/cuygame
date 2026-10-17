import Phaser from 'phaser';
import { LEVELS } from '../levels/index.js';
import { levelById, NICKNAME } from '../content/birthday.js';
import { music } from '../audio/music.js';
import { EMBLEM_ICON } from '../ui/narrative.js';

// Tarjeta entre niveles: nombre del recuerdo + una línea de introducción.
export default class IntroScene extends Phaser.Scene {
  constructor() {
    super('IntroScene');
  }

  init(data) {
    this.levelId = data.levelId ?? 'level1';
  }

  create() {
    const { width, height } = this.scale;
    this.scene.stop('HUDScene');
    this.cameras.main.setBackgroundColor('#252542');
    this.scale.once('resize', () => this.scene.restart());

    const level = LEVELS[this.levelId];
    const content = levelById(this.levelId);
    music.play(content?.music ?? 'intro');

    const index = (content ? content.id : this.levelId).replace('level', '');
    const emblem = EMBLEM_ICON[level.emblem] || '✨';

    this.add
      .text(width / 2, height / 2 - 92, `Recuerdo ${index} de 3`, {
        fontFamily: 'monospace',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#eac56a',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 - 46, `${emblem}  ${level.title}`, {
        fontFamily: 'monospace',
        fontSize: '30px',
        fontStyle: 'bold',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: width - 60 },
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 16, content?.intro ?? '', {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: '#e7e0f5',
        align: 'center',
        wordWrap: { width: Math.min(520, width - 60) },
      })
      .setOrigin(0.5);

    const prompt = this.add
      .text(width / 2, height / 2 + 100, `Vamos, ${NICKNAME} ✦`, {
        fontFamily: 'monospace',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#9cbf9b',
      })
      .setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.35, duration: 600, yoyo: true, repeat: -1 });

    // Se puede saltar la tarjeta tocando o pulsando una tecla.
    const go = () => this.scene.start('GameScene', { levelId: this.levelId });
    this.time.delayedCall(2400, go);
    this.input.keyboard.once('keydown-SPACE', go);
    this.input.keyboard.once('keydown-ENTER', go);
    this.input.once('pointerdown', go);
  }
}
