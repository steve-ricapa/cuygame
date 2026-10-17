// ============================================================================
// CONTENIDO DEL REGALO — Cuy Adventure: Misión Cumpleaños
// ----------------------------------------------------------------------------
// Este es el ÚNICO archivo que reúne los textos personales, las rutas de las
// fotos, la música de cada escena y las opciones de la recompensa final.
// Cambia aquí el apodo, los títulos o los mensajes: no busques por todo el
// proyecto. Ver PERSONALIZAR.md.
// ============================================================================

// Versión del contenido. Súbela si cambias textos de forma incompatible con
// un guardado antiguo; el sistema de progreso la compara para no reutilizar
// estados corruptos o de una campaña distinta.
export const CONTENT_VERSION = 3;

// Identificador de la campaña (para el esquema de guardado).
export const CAMPAIGN_ID = 'cuy-birthday';

// --- Apodo / título --------------------------------------------------------
export const TITLE = 'Cuy Adventure';
export const SUBTITLE = 'Misión Cumpleaños';
export const TAGLINE = 'Una pequeña aventura para celebrar a alguien muy especial.';
// Se usa cuando no se conoce el nombre. Cámbialo si quieres.
export const NICKNAME = 'mi cuyeya';

// --- Fotos personales ------------------------------------------------------
// Nombres base (sin extensión). El cargador prueba .jpg, .jpeg, .png y .webp y
// avisa si hay más de una variante del mismo nombre. Ver PERSONALIZAR.md.
export const PHOTO_BASE_DIR = 'personal/fotos/';
export const PHOTO_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

// --- Música -----------------------------------------------------------------
export const MUSIC_BASE_DIR = 'personal/musica/';
// 'synth' = cae en la música sintetizada original si el archivo no existe.
export const MUSIC = {
  intro: { file: '01-intro-every-breath-you-take.mp3', synth: 'intro' },
  level1: { file: '02-nivel-1-woman.mp3', synth: 'garden' },
  level2: { file: '03-nivel-2-waiting-for-a-girl-like-you.mp3', synth: 'dusk' },
  level3: { file: '04-nivel-3-the-reason.mp3', synth: 'sky' },
  // Finale / «los premios» (después de pasar los 3 niveles).
  epilogue: { file: 'The Beatles - Here, There and Everywhere.mp3', synth: 'intro' },
};
// Voz opcional de Steve (no obligatoria).
export const VOICE_FILE = 'personal/dedicatoria.mp3';

// --- Los tres niveles -------------------------------------------------------
// El orden del array define la cadena. `exit` es a dónde lleva la meta.
export const LEVELS = [
  {
    id: 'level1',
    title: 'La pequeña soñadora',
    intro: 'Un jardín con flores, recuerdos de cuando todo empezaba.',
    music: 'level1',
    memory: 'memory-childhood',
    emblem: 'flower',
    exit: 'level2',
  },
  {
    id: 'level2',
    title: 'La magia que tienes',
    intro: 'Una plazuela al atardecer, con música y luces cálidas.',
    music: 'level2',
    memory: 'memory-present',
    emblem: 'note',
    exit: 'level3',
  },
  {
    id: 'level3',
    title: 'Todo lo bonito que viene',
    intro: 'Un castillo entre nubes, abierto al cielo de la celebración.',
    music: 'level3',
    memory: 'memory-future',
    emblem: 'star',
    exit: 'epilogue',
  },
];

// --- Recuerdos (cofres obligatorios) ---------------------------------------
export const MEMORIES = {
  'memory-childhood': {
    id: 'memory-childhood',
    title: 'La pequeña soñadora',
    photo: '01-nina',
    emblem: 'flower',
    emblemLabel: 'Flor',
    message:
      'Antes de que yo te conociera, ya empezaba una historia muy especial: ' +
      'la tuya. Hoy también celebramos a esa niña que fuiste.',
    button: 'Guardar este recuerdo',
    epilogueCaption: 'Por la niña que fuiste.',
  },
  'memory-present': {
    id: 'memory-present',
    title: 'La magia que tienes',
    photo: '02-actual',
    emblem: 'note',
    emblemLabel: 'Nota musical',
    message:
      'Hoy celebro tu manera de ser, tu forma de cuidar los detalles ' +
      'y todas esas pequeñas cosas que te hacen tan tú.',
    button: 'Guardar este recuerdo',
    epilogueCaption: 'Por la persona tan especial que eres.',
  },
  'memory-future': {
    id: 'memory-future',
    title: 'Todo lo bonito que viene',
    photo: '03-juntos',
    emblem: 'star',
    emblemLabel: 'Estrella',
    message:
      'Deseo que este nuevo año te regale alegría, calma y motivos ' +
      'para ilusionarte. Qué bonito poder acompañarte en una parte de tu historia.',
    button: 'Guardar este recuerdo',
    epilogueCaption: 'Y por todo lo bonito que todavía te espera.',
  },
};

// --- Recuerdos sorpresa (cofres extra) --------------------------------------
// NO son obligatorios y NO abren la meta: son regalitos escondidos en el
// camino. Cada uno se abre con su propio cofre en el mapa (ver `char`) y se
// guarda en el álbum una vez encontrado. `emoji` se muestra grande en el panel.
export const BONUS_MEMORIES = {
  'bonus-cuy': {
    id: 'bonus-cuy',
    char: 'J', // letra del mapa del nivel 2
    title: 'Un cuy muy emocionado',
    emoji: '😂',
    photo: 'cuy-gracioso gritando',
    message:
      'Al verte pasar, este cuy no pudo contenerse: ¡gritó de la pura emoción! ' +
      'Anda por ahí como loco de contento. 🎉',
    button: '¡Qué risa! 😂',
    epilogueCaption: 'Que la risa nunca te falte.',
  },
  'bonus-guapa': {
    id: 'bonus-guapa',
    char: 'W', // letra del mapa del nivel 3
    title: 'Guapísima',
    emoji: '😍',
    photo: 'actual-guapa1',
    message:
      'Una sorpresa más: guardo esta foto aquí para recordarte lo guapa que ' +
      'estás hoy. 😍',
    button: 'Guardar esta sorpresa',
    epilogueCaption: 'Guapa hoy y siempre.',
  },
};

// Mapa inverso: letra del nivel → id del recuerdo sorpresa.
export const BONUS_BY_CHAR = Object.fromEntries(
  Object.values(BONUS_MEMORIES).map((b) => [b.char, b.id])
);

// --- Epílogo ----------------------------------------------------------------
export const EPILOGUE = {
  chestLine: 'Hay algo más para ti.',
  // Los tres toques que adornan el cofre final.
  chestTaps: ['La flor del jardín', 'La nota de la música', 'La estrella del cielo'],
  openButton: 'Abrir mi regalo',
  envelopeLabel: 'Para mi cuyeya',
  continueButton: 'Seguir con mi sorpresa',
  wishLine: 'Antes de abrir tu última sorpresa… pide un deseo.',
  candleButtons: {
    simple: 'Apagar la vela',
    hold: 'Mantener pulsada la vela',
    mic: 'Soplar con el micrófono',
  },
  micHint: 'Solo se usa aquí para apagar la vela; no se graba.',
  celebrationTitle: 'Feliz cumpleaños, mi cuyeya.',
  rewardTitle: 'Tu regalo especial está desbloqueado: un día a tu manera.',
  rewardSaved:
    'Tu elección quedó guardada en este dispositivo. Puedes volver a cambiarla cuando quieras.',
  rewardConfirm: 'Me quedo con este plan',
  replay: 'Volver a jugar',
};

// --- Regalo final: vale interactivo en dos fases ----------------------------
// Fase 1: ella elige una o varias opciones. Fase 2: el juego genera un vale
// personalizado (tarjeta vertical) que se puede descargar como PNG y compartir.
// `accent` es el color de cada opción (borde de la tarjeta y del vale).
export const VOUCHER = {
  // --- Fase 1: elección ---
  chooseTitle: '🎁 Tu regalo especial',
  chooseSubtitle: 'Porque hoy tú eres la protagonista de esta aventura.',
  chooseMessage:
    'Hoy tú eliges el plan y yo me encargo de hacerlo bonito.\n\n' +
    'Sin prisas, sin horarios apurados y sin planes obligatorios. Puedes invitar a tu mamá o a quien quieras compartir este momento.\n\n' +
    'Lo importante es verte feliz. ❤️',
  optionsNote: 'Puedes combinar opciones o inventar tu propio plan. Este regalo es para ti.',
  createButton: 'Crear mi vale 🎟️',
  options: [
    {
      id: 'paseo',
      icon: '🌷',
      label: 'Un paseo para recordar',
      detail: 'Conocer un lugar bonito, caminar, tomar fotos y crear nuevos recuerdos.',
      accent: '#9CBF9B',
    },
    {
      id: 'salida',
      icon: '🍰',
      label: 'Una salida especial',
      detail: 'Ir a una cafetería, restaurante o algún lugar que tengas muchas ganas de conocer.',
      accent: '#EAA6BC',
    },
    {
      id: 'destino',
      icon: '🎡',
      label: 'Tú eliges el destino',
      detail: 'Un parque, una feria, un museo, una actividad divertida o cualquier lugar que te haga ilusión.',
      accent: '#9B86C8',
    },
    {
      id: 'sorpresa',
      icon: '✨',
      label: 'Sorpréndeme, cuy',
      detail: 'Déjame preparar una salida sorpresa pensando especialmente en ti.',
      accent: '#EAC56A',
    },
  ],
  // --- Fase 2: vale generado ---
  card: {
    header: 'VALE ESPECIAL DE CUMPLEAÑOS',
    headerIcon: '🎟️',
    title: 'UN DÍA A TU MANERA',
    titleHeart: '❤️',
    dedication:
      'Este vale es para regalarte momentos bonitos, nuevas aventuras y recuerdos que podamos guardar para siempre.',
    chosenTitle: 'Tu aventura elegida',
    conditionsTitle: 'Condiciones del regalo',
    conditions: [
      'Válido para cuando tú quieras.',
      'Sin fecha de vencimiento.',
      'Puedes elegir la compañía, incluida tu mamá.',
      'El plan puede cambiarse o combinarse como prefieras.',
    ],
    finalMessage:
      'Porque tu felicidad siempre será uno de mis regalos favoritos.',
    signature: 'Con todo mi amor,\nTu cuy 🐹❤️',
  },
  // --- Fase 3: acciones ---
  previewTitle: 'Tu vale está listo ✨',
  previewSubtitle: 'Descárgalo o compártelo; es tuyo para cuando quieras.',
  building: 'Preparando tu vale…',
  downloadButton: 'Descargar mi vale 💝',
  shareButton: 'Compartir 💌',
  shareTitle: 'Mi regalo de cumpleaños',
  shareText: 'Mira el vale que me regalaron 🎟️❤️',
  changeButton: 'Cambiar mi elección',
  continueButton: 'Continuar',
  downloadName: 'Mi_Regalo_De_Cumpleanos.png',
};

// --- Carta de respaldo ------------------------------------------------------
// Se usa solo si NO existe public/personal/carta.txt. Cámbiala en el archivo
// de texto cuando quieras; este es el borrador preparado.
export const LETTER_FALLBACK = `Mi cuyeya:

Hoy quería regalarte algo que tuviera un poquito de todo lo que me haces sentir: ternura, alegría y esas ganas de verte sonreír.

Por eso existe esta pequeña aventura. No para contar los meses que llevamos juntos, sino para celebrar algo mucho más importante hoy: que tú estás aquí y que es tu cumpleaños.

Me encanta que seas detallista. Que encuentres formas de hacer especiales cosas que otras personas dejarían pasar. Hoy quería que tú también sintieras ese cariño en cada pequeño rincón.

Ver a la niña que fuiste me hace pensar en toda la historia que había antes de que nos conociéramos. Y verte hoy me hace sentir mucha alegría de poder compartir una parte de tu vida.

Para este nuevo año deseo que tengas motivos para reír, tranquilidad en los días difíciles y oportunidades para hacer las cosas que te ilusionan. Que nunca te falten personas que te quieran bien y que también encuentres tiempo para ti.

Gracias por dejarme acompañarte. Hoy la protagonista eres tú.

Feliz cumpleaños, mi cuyeya. Te amo.

Steve.`;

export const LETTER_FILE = 'personal/carta.txt';

// --- Mensajes dibujados con bloques (cielo de cada nivel) -------------------
// Cada entrada se dibuja en el cielo del nivel indicado, ELEVADO, para no
// estorbar el camino (son bloques decorativos: no tienen colisión). Escribe en
// mayúsculas; los acentos se simplifican y «<3» se dibuja como un corazón.
// Fila segura recomendada: 3-7 (debajo del HUD y muy por encima del terreno).
export const SKY_MESSAGES = [
  { level: 'level1', text: 'CAROLINA QC <3', row: 3, col: null },
  { level: 'level2', text: 'TE AMO CUYEYA', row: 3, col: null },
  { level: 'level3', text: 'FELIZ CUMPLE', row: 3, col: null },
];

// --- Emblemas ---------------------------------------------------------------
export const EMBLEMS = {
  flower: { label: 'Flor', color: 0xEAA6BC },
  note: { label: 'Nota musical', color: 0x9B86C8 },
  star: { label: 'Estrella', color: 0xEAC56A },
};

// --- Paleta -----------------------------------------------------------------
export const PALETTE = {
  cream: 0xfff4dd,
  outline: 0x54372d,
  caramel: 0xc68b59,
  pink: 0xeaa6bc,
  sage: 0x9cbf9b,
  lavender: 0x9b86c8,
  night: 0x252542,
  gold: 0xeac56a,
};

// --- Ayuda al atascarse -----------------------------------------------------
export const HELP = {
  prompt: '¿Te doy una patita?',
  yes: 'Sí, por favor',
  no: 'Puedo sola',
};

// Ayuda: cuántas caídas en un nivel antes de ofrecer el empujoncito.
export const HELP_AFTER_FALLS = 4;

// --- Requisitos -------------------------------------------------------------
// Un nivel se abre cuando el recuerdo anterior está confirmado.
export function requiredMemoryFor(levelId) {
  const idx = LEVELS.findIndex((l) => l.id === levelId);
  if (idx <= 0) return null;
  return LEVELS[idx - 1].memory;
}

export function memoryForLevel(levelId) {
  return LEVELS.find((l) => l.id === levelId)?.memory ?? null;
}

export function levelById(levelId) {
  return LEVELS.find((l) => l.id === levelId) ?? null;
}
