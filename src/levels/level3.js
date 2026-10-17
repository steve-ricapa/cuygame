import { sparse, ground, gap } from './builder.js';

// NIVEL 3 — Todo lo bonito que viene (castillo entre nubes).
// Ascenso lateral suave por terrazas. Estrellas opcionales, cofre principal 'K'
// (col 132), cofre sorpresa 'W' (col 176) y arco final 'G' (col 203) que abre
// el epílogo al confirmar el recuerdo.

const W = 210;

export default {
  name: '3 · Todo lo bonito que viene',
  title: 'Todo lo bonito que viene',
  theme: 'sky',
  next: 'epilogue',
  memory: 'memory-future',
  emblem: 'star',
  width: W,
  rows: [
    // r13 — estrellas altas (ruta opcional)
    sparse(W, [34, 'ss'], [78, 'ss'], [120, 'ss'], [176, 'ss']),
    // r14 — terrazas altas
    sparse(W, [32, 'PPPPP'], [76, 'PPPPP'], [118, 'PPPPP'], [174, 'PPPPP'], [198, 'PPPPP']),
    // r15 — monedas sobre las terrazas altas
    sparse(W, [33, 'ccc'], [77, 'ccc'], [119, 'ccc'], [175, 'ccc'], [199, 'ccc']),
    // r16 — terrazas medias
    sparse(W, [14, 'PPPP'], [52, 'PPPP'], [96, 'PPPP'], [156, 'PPPP'], [186, 'PPPP']),
    // r17 — plataforma que cruza el hueco central
    sparse(W, [66, 'PPPP'], [132, 'PPPP'], [170, 'PPPP']),
    // r18 — monedas del ascenso
    sparse(W, [16, 'ccc'], [54, 'ccc'], [98, 'ccc'], [158, 'ccc'], [188, 'ccc']),
    // r19 — terrazas bajas y bloques
    sparse(W, [24, 'BMB'], [86, 'B?B'], [140, 'ccc'], [170, 'B?B'], [200, 'ccc']),
    // r20 — nubes sólidas bajas (¡se distinguen del fondo!) + puente del hueco nuevo
    sparse(W, [20, 'PPPP'], [44, 'PPP'], [82, 'PPPP'], [163, 'PPP'], [190, 'PPP']),
    // r21 — estrellas y monedas del camino
    sparse(W, [8, 'c'], [20, 's'], [38, 'cc'], [58, 's'], [74, 'cc'], [92, 's'],
      [110, 'cc'], [128, 's'], [150, 'cc'], [170, 's'], [196, 'cc']),
    // r22 — inicio, banderines, enemigos suaves, cofre, sorpresa y arco final
    sparse(W, [3, 'p'], [6, '>'], [16, '*'], [30, 'e'], [48, '"'], [64, 'e'],
      [80, '*'], [104, 'e'], [122, '^'], [132, 'K'], [152, '*'],
      [176, 'W'], [190, 'e'], [203, 'G']),
    // r23/r24 — terrazas con huecos (46-48, 70-72, 100-102, 164-166)
    ground(46) + gap(3) + ground(21) + gap(3) + ground(27) + gap(3) + ground(61) + gap(3) + ground(43),
    ground(46) + gap(3) + ground(21) + gap(3) + ground(27) + gap(3) + ground(61) + gap(3) + ground(43),
  ],
};
