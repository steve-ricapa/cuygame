// ============================================================================
// Música: un único responsable de qué suena.
// ----------------------------------------------------------------------------
// Si existe el archivo MP3 (que Steve aporta con autorización), se reproduce.
// Si no, cae en la música sintetizada original del proyecto. Nunca suenan las
// dos a la vez y nunca suena el nombre de una canción comercial si lo que se
// oye es otra cosa.
// ============================================================================

import { MUSIC, MUSIC_BASE_DIR } from '../content/birthday.js';
import { musicUrl, audioExists } from '../ui/photos.js';
import { sfx } from './sfx.js';

const FADE_MS = 900; // 0.6–1.2 s, ajustable
const TARGET_VOLUME = 0.55;

class MusicManager {
  constructor() {
    this.el = null;
    this.trackKey = null;
    this.mode = null; // 'file' | 'synth'
    this.muted = false;
    this.ducked = false;
    this.playToken = 0;
    this.synthResumeKey = null;
    this.wantedKey = null;
    this.availability = new Map(); // key -> boolean (hay archivo)
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.el) this.el.volume = this.effectiveVolume();
  }

  effectiveVolume() {
    if (this.muted) return 0;
    return this.ducked ? TARGET_VOLUME * 0.3 : TARGET_VOLUME;
  }

  async hasFile(key) {
    const spec = MUSIC[key];
    if (!spec?.file) return false;
    if (this.availability.has(key)) return this.availability.get(key);
    const ok = await audioExists(`${MUSIC_BASE_DIR}${spec.file}`);
    this.availability.set(key, ok);
    return ok;
  }

  /** Reproduce la pista de una escena. No reinicia si ya está sonando. */
  async play(key, { force = false } = {}) {
    const spec = MUSIC[key];
    if (!spec) return;
    this.wantedKey = key;
    if (!force && this.trackKey === key && this.mode === 'synth' && sfx.musicTimer) return;
    if (!force && this.trackKey === key && this.mode === 'file' && this.el && !this.el.paused) return;

    const token = ++this.playToken;
    this.stop(300, true);

    const useFile = await this.hasFile(key);
    if (token !== this.playToken) return; // otra llamada ganó

    if (useFile) {
      try {
        const el = new Audio(musicUrl(spec.file));
        el.loop = true;
        el.volume = 0;
        el.preload = 'auto';
        await el.play();
        if (token !== this.playToken) {
          el.pause();
          return;
        }
        this.el = el;
        this.trackKey = key;
        this.mode = 'file';
        this.wantedKey = key;
        this.fadeTo(this.effectiveVolume(), FADE_MS);
      } catch {
        this.startSynth(key, spec, token);
      }
    } else {
      this.startSynth(key, spec, token);
    }
  }

  startSynth(key, spec, token) {
    if (token !== this.playToken) return;
    sfx.setMuted(this.muted);
    sfx.startMusic(spec.synth);
    this.trackKey = key;
    this.mode = 'synth';
    this.wantedKey = key;
  }

  fadeTo(target, ms) {
    if (!this.el) return;
    const el = this.el;
    const start = el.volume;
    const t0 = performance.now();
    const step = (now) => {
      if (el !== this.el) return;
      const k = Math.min(1, (now - t0) / ms);
      el.volume = Math.max(0, Math.min(1, start + (target - start) * k));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /** Detiene (con desvanecido salvo que sea un cambio inmediato). */
  stop(ms = FADE_MS, immediate = false) {
    const el = this.el;
    this.el = null;
    this.trackKey = null;
    this.mode = null;
    this.synthResumeKey = null;
    // Corta también la pista sintetizada: si no, al pasar del respaldo
    // sintetizado al MP3 sonarían las dos a la vez.
    sfx.stopMusic();
    if (!el) return;
    if (immediate) {
      el.pause();
      return;
    }
    const start = el.volume;
    const t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / ms);
      el.volume = Math.max(0, start * (1 - k));
      if (k < 1) requestAnimationFrame(step);
      else el.pause();
    };
    requestAnimationFrame(step);
  }

  pause() {
    // Recuerda la pista sintetizada para poder reanudarla: stopMusic() la corta.
    if (this.mode === 'synth' && this.trackKey) {
      this.synthResumeKey = this.trackKey;
      sfx.stopMusic();
    } else if (this.el) {
      this.el.pause();
    }
  }

  resume() {
    if (this.synthResumeKey) {
      const spec = MUSIC[this.synthResumeKey];
      this.synthResumeKey = null;
      if (spec) {
        sfx.setMuted(this.muted);
        sfx.startMusic(spec.synth);
      }
    }
    if (this.el) this.el.play().catch(() => {});
  }

  /** Baja la música mientras se abre un cofre o se lee; no reinicia. */
  duck(on) {
    this.ducked = on;
    if (this.el) this.fadeTo(this.effectiveVolume(), 300);
  }

  /** Detiene y limpia del todo (al salir o al ocultar la pestaña). */
  dispose() {
    this.stop(0, true);
  }
}

export const music = new MusicManager();
