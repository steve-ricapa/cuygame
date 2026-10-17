// ============================================================================
// Pruebas de la lógica de progreso (sin navegador).
// ----------------------------------------------------------------------------
// Comprueba, con el runner integrado de Node, que las reglas de obertura de
// niveles, de la meta y del final son las correctas y que un guardado corrupto
// o de otra campaña nunca desbloquea cosas. Las fotos y el audio no se tocan.
//
// Uso:  npm test
// ============================================================================

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  defaultState,
  sanitizeState,
  allMemoriesConfirmed,
  applyConfirmMemory,
  memoryConfirmed,
  canEnterLevel,
  canExitLevel,
  applyBonusFound,
  bonusFound,
  KNOWN_BONUS_IDS,
} from '../src/state/save.js';
import { LEVELS, CAMPAIGN_ID, CONTENT_VERSION } from '../src/content/birthday.js';

const [L1, L2, L3] = LEVELS;

const confirmedAll = () => {
  const s = defaultState();
  for (const l of LEVELS) applyConfirmMemory(s, l.memory);
  return s;
};

test('el primer nivel siempre se puede entrar', () => {
  const s = defaultState();
  assert.equal(canEnterLevel(s, L1.id), true);
  assert.equal(canEnterLevel(s, L2.id), false);
  assert.equal(canEnterLevel(s, L3.id), false);
});

test('un nivel se abre solo con el recuerdo del nivel anterior', () => {
  const s = defaultState();
  applyConfirmMemory(s, L1.memory);
  assert.equal(canEnterLevel(s, L2.id), true);
  assert.equal(canEnterLevel(s, L3.id), false);
  applyConfirmMemory(s, L2.memory);
  assert.equal(canEnterLevel(s, L3.id), true);
});

test('la meta no se cruza sin confirmar el recuerdo del propio nivel', () => {
  const s = defaultState();
  assert.equal(canExitLevel(s, L1.id), false);
  applyConfirmMemory(s, L1.memory);
  assert.equal(canExitLevel(s, L1.id), true);
  assert.equal(canExitLevel(s, L2.id), false);
});

test('confirmar es idempotente y no altera recuerdos ajenos', () => {
  const s = defaultState();
  applyConfirmMemory(s, L1.memory);
  applyConfirmMemory(s, L1.memory);
  assert.equal(memoryConfirmed(s, L1.memory), true);
  assert.equal(memoryConfirmed(s, L2.memory), false);
  assert.equal(allMemoriesConfirmed(s), false);
});

test('el final solo se desbloquea con los tres recuerdos', () => {
  const s = defaultState();
  applyConfirmMemory(s, L1.memory);
  applyConfirmMemory(s, L2.memory);
  assert.equal(s.finale.unlocked, false);
  applyConfirmMemory(s, L3.memory);
  assert.equal(allMemoriesConfirmed(s), true);
  assert.equal(s.finale.unlocked, true);
});

test('se ignoran ids de recuerdo desconocidos', () => {
  const s = defaultState();
  applyConfirmMemory(s, 'memory-inventado');
  assert.deepEqual(s.memories, {});
});

test('un guardado de otra campaña se descarta por completo', () => {
  const raw = {
    schema: 1,
    campaign: 'otro-juego',
    memories: { [L1.memory]: true },
    finale: { unlocked: true, stage: 'done' },
  };
  const s = sanitizeState(raw);
  assert.equal(s.campaign, CAMPAIGN_ID);
  assert.deepEqual(s.memories, {});
  assert.equal(s.finale.unlocked, false);
  assert.equal(s.finale.stage, 'idle');
});

test('un guardado corrupto se repara sin desbloquear nada', () => {
  for (const bad of [null, undefined, 42, 'x', [], { schema: 1, campaign: CAMPAIGN_ID, memories: 'no' }]) {
    const s = sanitizeState(bad);
    assert.equal(allMemoriesConfirmed(s), false);
    assert.equal(s.finale.unlocked, false);
  }
});

test('sanitizeState no acepta recuerdos ni etapas inventadas', () => {
  const s = sanitizeState({
    schema: 1,
    campaign: CAMPAIGN_ID,
    contentVersion: -1,
    memories: { [L1.memory]: true, 'memory-falso': true },
    finale: { unlocked: true, stage: 'hackeado' },
    voucher: { optionIds: ['paseo', 'plan-falso', 'paseo', 42], confirmed: true },
  });
  assert.deepEqual(Object.keys(s.memories), [L1.memory]);
  assert.equal(s.finale.stage, 'idle');
  assert.equal(s.finale.unlocked, false, 'sin los tres recuerdos, el final queda cerrado');
  assert.deepEqual(s.voucher.optionIds, ['paseo'], 'solo opciones conocidas y sin repetir');
  assert.equal(s.voucher.confirmed, true);
  assert.equal(s.contentVersion, CONTENT_VERSION);
});

test('el vale acepta la forma antigua (una sola opción)', () => {
  const s = sanitizeState({
    schema: 1,
    campaign: CAMPAIGN_ID,
    memories: { 'memory-childhood': true, 'memory-present': true, 'memory-future': true },
    voucher: { optionId: 'salida' },
  });
  assert.deepEqual(s.voucher.optionIds, ['salida']);
});

test('el final no puede quedar desbloqueado con recuerdos incompletos', () => {
  const s = sanitizeState({
    schema: 1,
    campaign: CAMPAIGN_ID,
    memories: { [L1.memory]: true },
    finale: { unlocked: true, stage: 'reward' },
  });
  assert.equal(s.finale.unlocked, false);
  assert.equal(s.finale.stage, 'idle');
});

test('marcar un recuerdo sorpresa es idempotente e ignora ids desconocidos', () => {
  const s = defaultState();
  const known = KNOWN_BONUS_IDS[0];
  assert.equal(bonusFound(s, known), false);
  applyBonusFound(s, known);
  applyBonusFound(s, known);
  assert.equal(bonusFound(s, known), true);
  assert.equal(bonusFound(s, 'bonus-inventado'), false);
  applyBonusFound(s, 'bonus-inventado');
  assert.deepEqual(Object.keys(s.bonus), [known]);
});

test('los recuerdos sorpresa no afectan al progreso ni al final', () => {
  const s = defaultState();
  for (const id of KNOWN_BONUS_IDS) applyBonusFound(s, id);
  assert.equal(allMemoriesConfirmed(s), false);
  assert.equal(s.finale.unlocked, false);
  assert.equal(canExitLevel(s, L1.id), false);
});

test('sanitizeState conserva los sorpresas conocidos y descarta los inventados', () => {
  const known = KNOWN_BONUS_IDS[0];
  const s = sanitizeState({
    schema: 1,
    campaign: CAMPAIGN_ID,
    bonus: { [known]: true, 'bonus-falso': true, otro: 'sí' },
  });
  assert.deepEqual(Object.keys(s.bonus), [known]);
});
