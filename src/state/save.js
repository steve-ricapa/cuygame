// ============================================================================
// Progreso y guardado local (sin cuentas ni servidor).
// ----------------------------------------------------------------------------
// Guarda SOLO datos pequeños: versión, recuerdos confirmados, final, opción del
// vale y preferencia de audio. Nunca fotos ni audio dentro de localStorage.
// Si el almacenamiento falla, sigue funcionando en memoria durante la sesión.
// ============================================================================

import { CAMPAIGN_ID, CONTENT_VERSION, LEVELS, VOUCHER, BONUS_MEMORIES } from '../content/birthday.js';

const STORAGE_KEY = 'cuy-adventure.save.v1';
const SCHEMA_VERSION = 1;

const levelIds = LEVELS.map((l) => l.id);
const memoryIds = LEVELS.map((l) => l.memory);
const voucherIds = VOUCHER.options.map((o) => o.id);
const bonusIds = Object.keys(BONUS_MEMORIES);

// ---- Estado por defecto ----------------------------------------------------

export function defaultState() {
  return {
    schema: SCHEMA_VERSION,
    campaign: CAMPAIGN_ID,
    contentVersion: CONTENT_VERSION,
    memories: {}, // { memoryId: true }
    bonus: {}, // { bonusId: true } — recuerdos sorpresa (opcionales)
    finale: {
      unlocked: false,
      stage: 'idle', // idle | chest | photos | letter | candle | reward | done
    },
    voucher: {
      optionIds: [], // opciones elegidas (varias)
      confirmed: false,
    },
    audio: {
      muted: false,
      enabled: false, // se activa tras el primer gesto
    },
  };
}

// ---- Validación / recuperación conservadora --------------------------------
// Devuelve un estado SIEMPRE utilizable. Si el guardado es de otra campaña,
// de otra versión o está corrupto, se conserva lo que se pueda validar y se
// rellena el resto con los valores por defecto (nunca se aceptan niveles o
// recuerdos inexistentes).

export function sanitizeState(raw) {
  const base = defaultState();
  if (!raw || typeof raw !== 'object') return base;

  // Campaña o esquema distintos → empezar limpio (no reutilizar AstroHop).
  if (raw.campaign !== CAMPAIGN_ID) return base;
  if (Number(raw.schema) !== SCHEMA_VERSION) return base;

  const out = defaultState();
  out.contentVersion = CONTENT_VERSION;

  // Recuerdos: solo ids conocidos, solo true.
  if (raw.memories && typeof raw.memories === 'object') {
    for (const id of memoryIds) {
      if (raw.memories[id] === true) out.memories[id] = true;
    }
  }

  // Recuerdos sorpresa (opcionales): solo ids conocidos, solo true.
  if (raw.bonus && typeof raw.bonus === 'object') {
    for (const id of bonusIds) {
      if (raw.bonus[id] === true) out.bonus[id] = true;
    }
  }

  // Final.
  const stages = ['idle', 'chest', 'photos', 'letter', 'candle', 'reward', 'done'];
  if (raw.finale && typeof raw.finale === 'object') {
    out.finale.unlocked = raw.finale.unlocked === true;
    if (stages.includes(raw.finale.stage)) out.finale.stage = raw.finale.stage;
  }
  // Coherencia: el final no puede estar desbloqueado si faltan recuerdos.
  if (allMemoriesConfirmed(out) === false) {
    out.finale.unlocked = false;
    if (out.finale.stage !== 'idle') out.finale.stage = 'idle';
  }

  // Vale (regalo final). Acepta la forma nueva (varias opciones) y también la
  // antigua (una sola `optionId`) por compatibilidad con guardados previos.
  if (raw.voucher && typeof raw.voucher === 'object') {
    const chosen = new Set();
    const list = Array.isArray(raw.voucher.optionIds) ? raw.voucher.optionIds : [];
    for (const id of list) if (voucherIds.includes(id)) chosen.add(id);
    if (voucherIds.includes(raw.voucher.optionId)) chosen.add(raw.voucher.optionId);
    out.voucher.optionIds = [...chosen];
    out.voucher.confirmed = raw.voucher.confirmed === true;
  }

  // Audio.
  if (raw.audio && typeof raw.audio === 'object') {
    out.audio.muted = raw.audio.muted === true;
    out.audio.enabled = raw.audio.enabled === true;
  }

  return out;
}

// ---- Lógica pura (testeable sin navegador) ---------------------------------

export function allMemoriesConfirmed(state) {
  return memoryIds.every((id) => state.memories?.[id] === true);
}

export function memoryConfirmed(state, memoryId) {
  return state.memories?.[memoryId] === true;
}

/** Confirma un recuerdo. Idempotente: confirmar dos veces no cambia nada. */
export function applyConfirmMemory(state, memoryId) {
  if (!memoryIds.includes(memoryId)) return state;
  if (state.memories[memoryId] === true) return state;
  state.memories[memoryId] = true;
  if (allMemoriesConfirmed(state)) state.finale.unlocked = true;
  return state;
}

/** ¿Puede abrirse `levelId`? El primero siempre; el resto con el recuerdo previo. */
export function canEnterLevel(state, levelId) {
  const idx = levelIds.indexOf(levelId);
  if (idx < 0) return false;
  if (idx === 0) return true;
  // `allMemoriesConfirmed` no hace falta: basta el recuerdo del nivel anterior.
  return memoryIds.slice(0, idx).every((id) => state.memories[id] === true);
}

/** ¿Puede cruzarse la meta de `levelId` hacia su salida? */
export function canExitLevel(state, levelId) {
  const idx = levelIds.indexOf(levelId);
  if (idx < 0) return false;
  return state.memories[memoryIds[idx]] === true;
}

/** ¿Se ha encontrado ya el recuerdo sorpresa `bonusId`? */
export function bonusFound(state, bonusId) {
  return state.bonus?.[bonusId] === true;
}

/** Marca un recuerdo sorpresa. Idempotente; ignora ids desconocidos. */
export function applyBonusFound(state, bonusId) {
  if (!bonusIds.includes(bonusId)) return state;
  state.bonus[bonusId] = true;
  return state;
}

// ---- Almacenamiento --------------------------------------------------------

let memoryState = null; // respaldo si localStorage no está disponible

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeStorage(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* almacenamiento denegado: la sesión continúa en memoria */
  }
}

/** Carga el estado (valida y repara). Mantiene una copia en memoria. */
export function loadState() {
  const raw = readStorage();
  memoryState = sanitizeState(raw ?? memoryState);
  return memoryState;
}

export function getState() {
  if (!memoryState) return loadState();
  return memoryState;
}

/** Persiste el estado actual. */
export function saveState() {
  if (!memoryState) return;
  writeStorage(memoryState);
}

/** API cómoda hacia las escenas. */

export function confirmMemory(memoryId) {
  const state = getState();
  applyConfirmMemory(state, memoryId);
  saveState();
  return state;
}

export function isMemoryConfirmed(memoryId) {
  return memoryConfirmed(getState(), memoryId);
}

export function markBonusFound(bonusId) {
  const state = getState();
  applyBonusFound(state, bonusId);
  saveState();
  return state;
}

export function isBonusFound(bonusId) {
  return bonusFound(getState(), bonusId);
}

export function setFinaleStage(stage) {
  const state = getState();
  state.finale.stage = stage;
  if (stage === 'done') state.finale.unlocked = true;
  saveState();
}

export function getFinaleStage() {
  return getState().finale.stage;
}

export function unlockFinale() {
  const state = getState();
  state.finale.unlocked = true;
  saveState();
}

export function isFinaleUnlocked() {
  return getState().finale.unlocked === true;
}

export function setVoucherOptions(optionIds) {
  const state = getState();
  const list = Array.isArray(optionIds) ? optionIds : [];
  const seen = new Set();
  state.voucher.optionIds = list.filter((id) => {
    if (!voucherIds.includes(id) || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
  saveState();
}

export function confirmVoucher() {
  const state = getState();
  state.voucher.confirmed = true;
  saveState();
}

export function getVoucher() {
  const v = getState().voucher;
  return { optionIds: [...(v.optionIds || [])], confirmed: v.confirmed === true };
}

export function setAudioPreference(muted, enabled) {
  const state = getState();
  if (typeof muted === 'boolean') state.audio.muted = muted;
  if (typeof enabled === 'boolean') state.audio.enabled = enabled;
  saveState();
}

export function getAudioPreference() {
  return { ...getState().audio };
}

/** Borrado total (requiere confirmación en la UI). No toca archivos personales. */
export function resetProgress() {
  memoryState = defaultState();
  saveState();
  return memoryState;
}

// Exportar helpers de ids por si una escena los necesita.
export const KNOWN_LEVEL_IDS = levelIds;
export const KNOWN_MEMORY_IDS = memoryIds;
export const KNOWN_BONUS_IDS = bonusIds;
