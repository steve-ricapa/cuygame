import Phaser from 'phaser';
import { music } from '../audio/music.js';
import { resetProgress } from '../state/save.js';
import { showChoice, closeAll } from '../ui/narrative.js';

// Menú de pausa sobre GameScene (que queda en pausa).
export default class PauseScene extends Phaser.Scene {
  constructor() {
    super('PauseScene');
  }

  create() {
    const { width, height } = this.scale;
    this.scale.once('resize', () => this.scene.restart());

    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.62);
    this.add
      .text(width / 2, 120, 'Pausa', {
        fontFamily: 'monospace',
        fontSize: '40px',
        fontStyle: 'bold',
        color: '#ffe066',
      })
      .setOrigin(0.5)
      .setStroke('#000000', 6);

    this.options = [
      { label: 'Continuar', action: () => this.resumeGame() },
      { label: 'Ver mi álbum', action: () => this.openAlbum() },
      { label: 'Reiniciar la aventura', action: () => this.confirmReset() },
      { label: 'Salir al inicio', action: () => this.quitToTitle() },
    ];
    this.selected = 0;
    this.texts = this.options.map((opt, i) => {
      const t = this.add
        .text(width / 2, 196 + i * 46, opt.label, {
          fontFamily: 'monospace',
          fontSize: '20px',
          fontStyle: 'bold',
          color: '#ffffff',
        })
        .setOrigin(0.5)
        .setStroke('#000000', 4)
        .setInteractive({ useHandCursor: true });
      t.on('pointerover', () => this.select(i));
      t.on('pointerdown', () => opt.action());
      return t;
    });
    this.select(0);

    const kb = this.input.keyboard;
    kb.on('keydown-UP', () => this.select(this.selected - 1));
    kb.on('keydown-DOWN', () => this.select(this.selected + 1));
    kb.on('keydown-W', () => this.select(this.selected - 1));
    kb.on('keydown-S', () => this.select(this.selected + 1));
    kb.on('keydown-ENTER', () => this.options[this.selected].action());
    kb.on('keydown-SPACE', () => this.options[this.selected].action());
    kb.on('keydown-ESC', () => this.resumeGame());
    kb.on('keydown-P', () => this.resumeGame());
  }

  select(i) {
    this.selected = Phaser.Math.Wrap(i, 0, this.options.length);
    this.texts.forEach((t, idx) => {
      const on = idx === this.selected;
      t.setColor(on ? '#ffe066' : '#ffffff');
      t.setText((on ? '▶ ' : '  ') + this.options[idx].label + (on ? ' ◀' : '  '));
    });
  }

  resumeGame() {
    closeAll();
    this.scene.stop();
    music.resume();
    this.scene.resume('GameScene');
  }

  async openAlbum() {
    const gs = this.scene.get('GameScene');
    music.pause();
    await gs.openAlbum?.();
    music.resume();
  }

  async confirmReset() {
    const answer = await showChoice({
      title: '¿Reiniciar la aventura?',
      message: 'Se borrarán los recuerdos guardados en este dispositivo. Las fotos y la carta no se tocan.',
      yes: 'Sí, reiniciar',
      no: 'Cancelar',
    });
    if (answer === 'yes') {
      resetProgress();
      this.scene.stop('GameScene');
      this.scene.stop('HUDScene');
      this.scene.stop();
      music.stop();
      this.scene.start('TitleScene');
    }
  }

  quitToTitle() {
    closeAll();
    this.scene.stop('GameScene');
    this.scene.stop('HUDScene');
    music.stop();
    this.scene.stop();
    this.scene.start('TitleScene');
  }
}
