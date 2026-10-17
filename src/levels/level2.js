import { sparse, ground, gap } from './builder.js';

// NIVEL 2 — La magia que tienes (plazuela al atardecer).
// Algo más dinámico que el jardín pero de lectura clara: balcones bajos,
// azoteas y farolitos. Cofre principal 'K' (col 128), cofre sorpresa 'J'
// (col 168) y meta 'G' al final (col 200).
const W = 208;

export default {
  name: '2 · La magia que tienes',
  title: 'La magia que tienes',
  theme: 'dusk',
  next: 'level3',
  memory: 'memory-present',
  emblem: 'note',
  width: W,
  rows: [
    // r14 — notas altas (ruta opcional)
    sparse(W, [30, 'nn'], [88, 'nn'], [126, 'nn'], [172, 'nn']),
    // r15 — azoteas altas
    sparse(W, [28, 'PPPPP'], [86, 'PPPPP'], [124, 'PPPPP'], [166, 'PPPPP'], [194, 'PPPPP']),
    // r16 — monedas sobre las azoteas
    sparse(W, [29, 'ccc'], [87, 'ccc'], [125, 'ccc'], [167, 'ccc'], [195, 'ccc']),
    // r17 — balcones medios
    sparse(W, [16, 'PPPP'], [48, 'PPPP'], [74, 'PPPP'], [110, 'PPPP'], [152, 'PPPP'], [184, 'PPPP']),
    // r18 — plataformas que cruzan los huecos
    sparse(W, [60, 'PPPP'], [102, 'PPPP']),
    // r19 — bloques y cajas con música
    sparse(W, [40, 'B?B'], [80, 'ccc'], [118, 'B?B'], [156, 'B?B'], [190, 'ccc']),
    // r20 — balcones bajos (incluye el puente sobre el hueco nuevo)
    sparse(W, [24, 'PPP'], [52, 'PPP'], [92, 'PPP'], [134, 'PPP'], [146, 'PPP'], [176, 'PPP']),
    // r21 — notas y monedas a ras de suelo
    sparse(W, [10, 'c'], [22, 'n'], [36, 'cc'], [58, 'n'], [76, 'cc'], [96, 'n'],
      [114, 'cc'], [132, 'n'], [156, 'cc'], [176, 'n'], [194, 'cc']),
    // r22 — inicio, farolitos, enemigos, cofre, sorpresa y meta
    sparse(W, [3, 'p'], [6, '>'], [14, '*'], [26, 'e'], [44, '"'], [56, 'e'],
      [70, '*'], [84, 'e'], [100, '^'], [112, 'n'], [128, 'K'],
      [140, '*'], [154, 'e'], [168, 'J'], [182, '"'], [194, 'e'], [200, 'G']),
    // r23/r24 — suelo con cuatro huecos (38-40, 70-72, 100-102, 147-149)
    ground(38) + gap(3) + ground(29) + gap(3) + ground(27) + gap(3) + ground(44) + gap(3) + ground(58),
    ground(38) + gap(3) + ground(29) + gap(3) + ground(27) + gap(3) + ground(44) + gap(3) + ground(58),
  ],
};
