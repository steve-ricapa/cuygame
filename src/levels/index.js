import level1 from './level1.js';
import level2 from './level2.js';
import level3 from './level3.js';

// ============================================================================
// CAMPAÑA DE CUMPLEAÑOS — exactamente tres niveles.
// ----------------------------------------------------------------------------
// La cadena es level1 → level2 → level3 → epílogo. Los archivos level4,
// level5, bonus11 y bonus15 siguen en el proyecto (créditos y código de
// AstroHop) pero NO forman parte del recorrido: no se registran aquí, así que
// es imposible cargarlos por accidente.
// ============================================================================

export const LEVELS = { level1, level2, level3 };

// Temas visuales de la campaña. Los frames se refieren al spritesheet 'tiles'
// de Kenney (ver docs/ASSET_SOURCES.md).
export const THEMES = {
  // Jardín luminoso — la infancia.
  garden: {
    sky: '#bfe6f2',
    terrainTop: 2, // pasto
    terrainFill: 122, // tierra
    parallax: true,
  },
  // Plazuela al atardecer — la persona de hoy.
  dusk: {
    sky: '#f2b07a',
    terrainTop: 2,
    terrainFill: 122,
    parallax: true,
  },
  // Castillo entre nubes — lo que viene.
  sky: {
    sky: '#9b86c8',
    terrainTop: 81, // cima clara, como nube
    terrainFill: 121, // relleno suave
    parallax: true,
  },
  // Se conservan por compatibilidad con el código original de AstroHop.
  overworld: { sky: '#5c94fc', terrainTop: 2, terrainFill: 122, parallax: true },
  underground: { sky: '#12122a', terrainTop: 42, terrainFill: 142, parallax: false },
  snow: { sky: '#a8c8ec', terrainTop: 81, terrainFill: 121, parallax: true, dragFactor: 0.3 },
};

// Orden de la campaña (para navegación y guardado).
export const CAMPAIGN_ORDER = ['level1', 'level2', 'level3'];
