import { sparse, ground, gap } from './builder.js';

// NIVEL 1 — La pequeña soñadora (jardín luminoso).
// Recorrido amable: terreno seguro al inicio, saltos amplios y una zona
// despejada que lleva al cofre (col 139) y a la meta (arco 'G' en col 160).
// El cofre 'K' está sobre suelo firme y la salida queda bloqueada hasta
// confirmar el recuerdo.

const W = 170;

export default {
  name: '1 · La pequeña soñadora',
  title: 'La pequeña soñadora',
  theme: 'garden',
  next: 'level2',
  memory: 'memory-childhood',
  emblem: 'flower',
  width: W,
  rows: [
    // r15 — flores altas sobre las plataformas
    sparse(W, [22, 'ff'], [60, 'ff'], [120, 'ff']),
    // r16 — plataformas altas (ruta opcional)
    sparse(W, [20, 'PPPPP'], [58, 'PPPPP'], [118, 'PPPPP']),
    // r17 — monedas sobre las plataformas altas
    sparse(W, [21, 'ccc'], [59, 'ccc'], [119, 'ccc']),
    // r18 — plataformas medias
    sparse(W, [12, 'PPPP'], [44, 'PPPP'], [86, 'PPPP'], [132, 'PPPP']),
    // r19 — bloques y monedas
    sparse(W, [30, 'B?B'], [70, 'ccc'], [100, 'B?B'], [140, 'ccc']),
    // r20 — plataformas bajas y seguras
    sparse(W, [28, 'PPP'], [66, 'PPP'], [96, 'PPP']),
    // r21 — senderito de flores y monedas a ras de suelo
    sparse(W, [8, 'c'], [18, 'f'], [34, 'cc'], [52, 'f'], [72, 'cc'], [92, 'f'],
      [110, 'cc'], [128, 'f'], [150, 'cc']),
    // r22 — inicio, decoración, enemigos suaves, cofre y meta
    sparse(W, [3, 'p'], [6, '>'], [14, '*'], [24, 'e'], [36, '"'], [48, 'e'],
      [62, '*'], [78, 'e'], [94, '^'], [108, 'e'], [132, '"'], [139, 'K'],
      [160, 'G']),
    // r23/r24 — suelo con dos hoyos pequeños (40-42 y 73-75)
    ground(40) + gap(3) + ground(30) + gap(3) + ground(94),
    ground(40) + gap(3) + ground(30) + gap(3) + ground(94),
  ],
};
