import Phaser from 'phaser';
import { sfx } from '../audio/sfx.js';
import { getAudioPreference } from '../state/save.js';

// HUD del cumpleaños: nombre del recuerdo, emblemas recogidos y acciones
// (pausa, álbum, silencio). Sin reloj ni vidas: el juego no castiga.
export default class HUDScene extends Phaser.Scene {
  constructor() {
    super('HUDScene');
  }

  create() {
    const mkText = (text, color, size = '14px') =>
      this.add
        .text(0, 0, text, {
          fontFamily: 'monospace',
          fontSize: size,
          fontStyle: 'bold',
          color,
        })
        .setStroke('#241a2b', 3);

    this.titleLabel = this.add
      .text(0, 0, 'RECUERDO', {
        fontFamily: 'monospace',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#eac56a',
      })
      .setOrigin(0, 0);
    this.titleValue = mkText('', '#ffffff', '14px').setOrigin(0, 0);

    this.emblemIcon = this.add.image(0, 0, 'emblem-flower').setScale(1.1);
    this.emblemValue = mkText('x0 / 0', '#ffffff', '14px').setOrigin(0, 0);

    const corner = (txt, onTap, size = '20px') => {
      const b = this.add
        .text(0, 4, txt, {
          fontFamily: 'monospace',
          fontSize: size,
          fontStyle: 'bold',
          color: '#ffffff',
        })
        .setOrigin(1, 0)
        .setStroke('#241a2b', 3)
        .setAlpha(0.9)
        .setPadding(10)
        .setInteractive({ useHandCursor: true });
      b.on('pointerdown', onTap);
      return b;
    };

    this.pauseBtn = corner('▐▐', () => {
      const gs = this.scene.get('GameScene');
      if (gs.scene.isActive()) gs.pauseGame();
    });

    this.albumBtn = corner('📖', () => {
      const gs = this.scene.get('GameScene');
      if (gs.scene.isActive()) gs.openAlbum();
    }, '18px');

    this.muteBtn = corner('♪', () => {
      const gs = this.scene.get('GameScene');
      if (!gs.scene.isActive()) return;
      const muted = gs.toggleMute();
      this.muteBtn.setAlpha(muted ? 0.3 : 0.9);
    });
    this.muteBtn.setAlpha(getAudioPreference().muted ? 0.3 : 0.9);

    this.layout();
    this.refresh();

    this.scale.on('resize', this.layout, this);
    this.registry.events.on('changedata', this.refresh, this);
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.layout, this);
      this.registry.events.off('changedata', this.refresh, this);
    });
  }

  layout() {
    const w = this.scale.width;
    const compact = w < 700;

    this.titleLabel.setPosition(12, 6);
    this.titleValue.setPosition(12, 20);
    this.titleValue.setFontSize(compact ? '12px' : '14px');
    this.titleValue.setWordWrapWidth(w * 0.42);

    const ex = Math.round(w * 0.5);
    this.emblemIcon.setPosition(ex, 28);
    this.emblemValue.setPosition(ex + 12, 20);
    this.emblemValue.setFontSize(compact ? '12px' : '14px');

    this.pauseBtn.setX(w - 4);
    this.albumBtn.setX(w - 48);
    this.muteBtn.setX(w - 92);
  }

  refresh() {
    const r = this.registry;
    this.titleValue.setText(String(r.get('world') ?? ''));
    const got = r.get('emblems') ?? 0;
    const total = r.get('collectiblesTotal') ?? 0;
    this.emblemValue.setText(`x${got} / ${total}`);
  }
}
