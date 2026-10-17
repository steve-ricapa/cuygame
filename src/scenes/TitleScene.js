import Phaser from 'phaser';
import { TITLE, SUBTITLE, TAGLINE, NICKNAME, levelById, LEVELS } from '../content/birthday.js';
import { getState, canEnterLevel } from '../state/save.js';
import { music } from '../audio/music.js';

// Portada: una porción viva del mundo detrás del título, sin física.
export default class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create() {
    const { width, height } = this.scale;
    this.scene.stop('HUDScene');
    this.cameras.main.setBackgroundColor('#bfe6f2');
    this.scale.once('resize', () => this.scene.restart());

    // --- música del menú
    music.play('intro');
    // La reproducción automática de MP3 suele estar bloqueada hasta un gesto.
    // Este botón HTML permite escuchar la canción sin salir del menú.
    const audioBtn = document.createElement('button');
    audioBtn.id = 'menu-audio-btn';
    audioBtn.type = 'button';
    const audioIcon = document.createElement('span');
    audioIcon.textContent = '🔊';
    audioIcon.setAttribute('aria-hidden', 'true');
    const audioLabel = document.createElement('span');
    audioLabel.className = 'menu-audio-label';
    audioLabel.textContent = 'Escuchar música';
    audioBtn.append(audioIcon, audioLabel);
    audioBtn.setAttribute('aria-label', 'Escuchar la música del menú');
    audioBtn.addEventListener('click', async () => {
      audioBtn.disabled = true;
      await music.play('intro', { force: true });
      if (this.scene.isActive()) {
        const playing = music.mode === 'file';
        audioIcon.textContent = playing ? '🎵' : '🔊';
        audioLabel.textContent = playing ? 'Música sonando' : 'Reintentar música';
        audioBtn.setAttribute('aria-label', playing ? 'Música del menú sonando' : 'Reintentar música del menú');
        audioBtn.disabled = false;
      }
    });
    document.getElementById('game-container').appendChild(audioBtn);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => audioBtn.remove());

    // --- fondo animado
    this.hills = this.add
      .tileSprite(width / 2, 414 - 36, Math.ceil(width / 3), 24, 'tex-hills')
      .setScale(3);

    [{ x: 120, y: 70 }, { x: 420, y: 110 }, { x: 690, y: 60 }].forEach(({ x, y }, i) => {
      const cloud = this.add
        .container(x, y, [
          this.add.image(-18, 0, 'tiles', 153),
          this.add.image(0, 0, 'tiles', 154),
          this.add.image(18, 0, 'tiles', 155),
        ])
        .setScale(2);
      this.tweens.add({
        targets: cloud,
        x: x + 40,
        duration: 6000 + i * 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });

    this.add.tileSprite(width / 2, 414 + 9, width, 18, 'tex-grass-top');
    this.add.tileSprite(width / 2, 414 + 29, width, 22, 'tex-dirt');

    this.add.image(80, 414, 'tiles', 125).setOrigin(0.5, 1);
    this.add.image(620, 414, 'tiles', 126).setOrigin(0.5, 1);
    this.add.sprite(180, 396, 'tiles', 151).play('coin-spin');
    this.add.sprite(240, 350, 'tiles', 151).play('coin-spin');

    // El cuy protagonista, mirando a su persona.
    this.add.sprite(120, 398, 'cuy', 0).play('cuy-idle').setScale(2);

    // --- portada + textos
    this.add
      .text(width / 2, 96, TITLE.toUpperCase(), {
        fontFamily: 'monospace',
        fontSize: '52px',
        fontStyle: 'bold',
        color: '#ffe066',
      })
      .setOrigin(0.5)
      .setStroke('#7a3045', 9)
      .setShadow(0, 6, '#00000055', 0, true, true);

    this.add
      .text(width / 2, 142, SUBTITLE.toUpperCase(), {
        fontFamily: 'monospace',
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setStroke('#000000', 4);

    this.add
      .text(width / 2, 176, TAGLINE, {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#3a2a22',
        align: 'center',
        wordWrap: { width: Math.min(520, width - 60) },
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 206, `Para ${NICKNAME} 💝`, {
        fontFamily: 'monospace',
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#a83246',
      })
      .setOrigin(0.5);

    // --- progreso + botón principal
    const state = getState();
    const confirmed = LEVELS.filter((l) => state.memories?.[l.memory] === true).length;
    const nextLevel = LEVELS.find((l) => state.memories?.[l.memory] !== true);
    const allDone = !nextLevel;

    this.add
      .text(width / 2, 240, confirmed > 0 ? `Recuerdos guardados: ${confirmed} de ${LEVELS.length}` : '', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setStroke('#000000', 3);

    const label = allDone
      ? 'Volver a jugar ▶'
      : confirmed > 0
        ? 'Continuar mi aventura ▶'
        : 'Entrar a mi regalo ▶';

    const startBtn = this.add
      .text(width / 2, allDone ? 288 : 296, label, {
        fontFamily: 'monospace',
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#ffffff',
        backgroundColor: '#a83246',
        padding: { x: 18, y: 10 },
      })
      .setOrigin(0.5)
      .setStroke('#5e1c28', 0)
      .setInteractive({ useHandCursor: true });
    this.tweens.add({ targets: startBtn, alpha: 0.82, duration: 700, yoyo: true, repeat: -1 });
    startBtn.on('pointerdown', () => {
      this.scene.start('IntroScene', { levelId: allDone ? LEVELS[0].id : nextLevel.id });
    });

    // --- botón «Ver final»: aparece SOLO cuando ya se pasó los 3 niveles.
    //     Lleva directo a la celebración, sin repetir la aventura.
    if (allDone) {
      const finaleBtn = this.add
        .text(width / 2, 338, '▶ Ver final', {
          fontFamily: 'monospace',
          fontSize: '18px',
          fontStyle: 'bold',
          color: '#3a2a22',
          backgroundColor: '#eac56a',
          padding: { x: 16, y: 8 },
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      this.tweens.add({ targets: finaleBtn, alpha: 0.86, duration: 820, yoyo: true, repeat: -1 });
      finaleBtn.on('pointerdown', () => this.scene.start('EpilogueScene'));
    }

    // --- elegir recuerdo (siempre que esté desbloqueado)
    const chipY = allDone ? 386 : 356;
    const gap = Math.min(150, (width - 40) / LEVELS.length);
    const startX = width / 2 - (gap * (LEVELS.length - 1)) / 2;
    LEVELS.forEach((level, i) => {
      const content = levelById(level.id);
      const unlocked = canEnterLevel(state, level.id);
      const chip = this.add
        .text(startX + i * gap, chipY,
          width <= 540 ? (unlocked ? `Nivel ${i + 1}` : `🔒 ${i + 1}`)
            : (unlocked ? `${i + 1}. ${content.title}` : `🔒 Recuerdo ${i + 1}`), {
          fontFamily: 'monospace',
          fontSize: width <= 540 ? '23px' : '16px',
          color: unlocked ? '#3a2a22' : '#9a8f86',
          align: 'center',
          wordWrap: { width: gap - 8 },
        })
        .setOrigin(0.5);
      if (unlocked) {
        chip.setInteractive({ useHandCursor: true });
        chip.on('pointerdown', () => this.scene.start('IntroScene', { levelId: level.id }));
      }
    });

    // --- pantalla completa (desktop y Android)
    const fsBtn = this.add
      .text(width - 10, 8, '⛶', {
        fontFamily: 'monospace',
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(1, 0)
      .setStroke('#000000', 4)
      .setAlpha(0.85)
      .setPadding(10)
      .setInteractive({ useHandCursor: true });
    fsBtn.on('pointerdown', (pointer, lx, ly, event) => {
      event.stopPropagation();
      if (this.scale.isFullscreen) this.scale.stopFullscreen();
      else this.scale.startFullscreen();
    });

    // --- atajos de teclado
    const startDefault = () => {
      if (allDone) this.scene.start('EpilogueScene');
      else this.scene.start('IntroScene', { levelId: nextLevel.id });
    };
    this.input.keyboard.once('keydown-SPACE', startDefault);
    this.input.keyboard.once('keydown-ENTER', startDefault);
  }

  update() {
    this.hills.tilePositionX += 0.08;
  }
}
