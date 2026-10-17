import Phaser from 'phaser';
import { sfx } from '../audio/sfx.js';

// ---- Movement tuning (the "game feel" numbers) ----
const ACCELERATION = 1600;
const DRAG = 1300;
const MAX_RUN_SPEED = 240;
const MAX_FALL_SPEED = 900;
const JUMP_VELOCITY = -480;
const JUMP_CUT_VELOCITY = -160;
const EXTRA_FALL_GRAVITY = 900;

// ---- Sprite metrics (32x32 frames; el cuy ocupa x≈5..30, y≈8..29) ----
const FRAME = 32;
const BODY_W = 15;
const BODY_H = 18;
const FEET_Y = 29; // fila del frame donde apoyan las patitas

/**
 * El cuy protagonista: un único personaje coherente en reposo, caminar,
 * salto, caída, aterrizaje, celebración y sorpresa. Sin estados de poder que
 * hagan reaparecer otro personaje.
 */
export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'cuy', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.isDead = false;
    this.isFrozen = false;
    this.invulnerable = false;
    this.wasOnFloor = true;
    this.stretchTween = null;
    this.celebrating = false;

    this.setDepth(2);
    this.setCollideWorldBounds(true);
    this.body.setMaxVelocity(MAX_RUN_SPEED, MAX_FALL_SPEED);
    this.body.setDragX(DRAG);
    this.syncBody();
    this.play('cuy-idle');
  }

  /** Distancia del centro del sprite a las patitas, a la escala actual. */
  get feetOffset() {
    return (FEET_Y - FRAME / 2) * this.scaleY;
  }

  /** Mantiene la caja de colisión constante aunque el sprite se aplaste. */
  syncBody() {
    const unitW = BODY_W / this.scaleX;
    const unitH = BODY_H / this.scaleY;
    this.body.setSize(unitW, unitH);
    // El fondo del cuerpo queda en la fila de las patitas.
    this.body.setOffset((FRAME - unitW) / 2, FEET_Y - unitH);
  }

  /** Squash & stretch puramente visual: la caja no cambia. */
  squashStretch(sx, sy) {
    if (this.stretchTween) this.stretchTween.stop();
    this.setScale(sx, sy);
    this.syncBody();
    this.stretchTween = this.scene.tweens.add({
      targets: this,
      scaleX: 1,
      scaleY: 1,
      duration: 150,
      ease: 'Quad.easeOut',
      onUpdate: () => this.syncBody(),
      onComplete: () => this.syncBody(),
    });
  }

  /** Pequeña celebración al conseguir un emblema. */
  celebrate(ms = 1200) {
    this.celebrating = true;
    this.play('cuy-celebrate', true);
    this.scene.time.delayedCall(ms, () => {
      this.celebrating = false;
    });
  }

  surprise() {
    this.play('cuy-surprise', true);
  }

  /** Caída de derrota: gira y cae (la escena gestiona la reaparición). */
  die() {
    this.isDead = true;
    this.body.checkCollision.none = true;
    this.setCollideWorldBounds(false);
    this.body.setAccelerationX(0);
    this.body.setDragX(0);
    this.body.setVelocity(0, -420);
    this.setFlipY(true);
    this.play('cuy-jump');
  }

  /**
   * Reaparece tras una caída: se recoloca en un punto seguro sin recrear el
   * objeto (los colisionadores siguen siendo válidos). No hay "game over".
   */
  revive(x, y) {
    this.isDead = false;
    this.isFrozen = false;
    this.celebrating = false;
    this.setFlipY(false);
    this.setAlpha(1);
    this.setCollideWorldBounds(true);
    this.body.checkCollision.none = false;
    this.body.enable = true;
    this.body.reset(x, y);
    this.body.setAcceleration(0, 0);
    this.body.setVelocity(0, 0);
    this.body.setDragX(DRAG);
    this.wasOnFloor = true;
    this.syncBody();
    this.play('cuy-idle');
  }

  /** Congela/reanuda la lectura de entrada (durante un cofre o un diálogo). */
  setFrozen(frozen) {
    this.isFrozen = frozen;
    if (frozen && this.body) {
      this.body.setAccelerationX(0);
      this.body.setVelocity(0, 0);
    }
  }

  /**
   * Salto efectivo. Lo decide la escena, que añade margen de "coyote" (seguir
   * pudiendo saltar un instante después de dejar el suelo) y búfer de salto
   * (recordar una pulsación hecha un instante antes de aterrizar). Así el salto
   * no se pierde cuando se pulsa justo al borde de una plataforma o al correr.
   */
  doJump() {
    if (this.isDead || this.isFrozen || !this.body) return;
    this.body.setVelocityY(JUMP_VELOCITY);
    sfx.play('jump');
    this.squashStretch(0.84, 1.16);
  }

  handleInput({ left, right, jumpHeld }) {
    if (this.isDead || this.isFrozen) return;

    const body = this.body;
    const onGround = body.onFloor();

    if (left && !right) {
      body.setAccelerationX(-ACCELERATION);
      this.setFlipX(true);
    } else if (right && !left) {
      body.setAccelerationX(ACCELERATION);
      this.setFlipX(false);
    } else {
      body.setAccelerationX(0);
    }

    if (!jumpHeld && body.velocity.y < JUMP_CUT_VELOCITY) {
      body.setVelocityY(JUMP_CUT_VELOCITY);
    }
    body.setGravityY(body.velocity.y > 0 ? EXTRA_FALL_GRAVITY : 0);

    if (this.celebrating) return;
    if (!onGround) {
      if (body.velocity.y < 0) this.play('cuy-jump', true);
      else this.play('cuy-fall', true);
    } else if (Math.abs(body.velocity.x) > 10) {
      this.play('cuy-run', true);
    } else {
      this.play('cuy-idle', true);
    }
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (!this.isDead && this.body) {
      const onFloor = this.body.onFloor();
      if (onFloor && !this.wasOnFloor && !this.celebrating) {
        this.squashStretch(1.16, 0.84);
      }
      this.wasOnFloor = onFloor;
    }
  }
}
