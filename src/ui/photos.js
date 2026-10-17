// ============================================================================
// Resolución y verificación de fotos personales.
// ----------------------------------------------------------------------------
// Problema que resuelve: muchas configuraciones de hosting devuelven
// `index.html` (HTTP 200) para una ruta que no existe, así que un <img src>
// "cargaría" una página en vez de una foto. Aquí descargamos el archivo,
// comprobamos que su tipo de contenido sea realmente una imagen y solo
// entonces creamos una URL de objeto para mostrarla.
//
// También admite los nombres base con .jpg/.jpeg/.png/.webp, eligiendo la
// primera variante válida (una sola por nombre base).
// ============================================================================

import { PHOTO_BASE_DIR, PHOTO_EXTENSIONS, LETTER_FILE, MUSIC_BASE_DIR, VOICE_FILE } from '../content/birthday.js';

const objectUrls = new Map();
const resolvedCache = new Map();

/** Une una ruta relativa del proyecto con la base real del despliegue. */
export function resolveAssetUrl(relative) {
  // document.baseURI respeta la base './' de Vite y subdirectorios.
  return new URL(relative, document.baseURI).href;
}

function isImageType(contentType) {
  return typeof contentType === 'string' && contentType.toLowerCase().startsWith('image/');
}

/**
 * Prueba el nombre base con cada extensión admitida y devuelve la primera que
 * sea una imagen real. Resultado: { ok, url, extension } | { ok:false, tried }.
 */
export async function resolvePhoto(baseName) {
  if (resolvedCache.has(baseName)) return resolvedCache.get(baseName);
  const tried = [];
  for (const ext of PHOTO_EXTENSIONS) {
    const rel = `${PHOTO_BASE_DIR}${baseName}.${ext}`;
    const url = resolveAssetUrl(rel);
    try {
      const res = await fetch(url, { cache: 'no-cache' });
      if (!res.ok) {
        tried.push({ ext, status: res.status });
        continue;
      }
      const type = res.headers.get('content-type') || '';
      if (!isImageType(type)) {
        // 200 pero no es una imagen: probable index.html de fallback.
        tried.push({ ext, status: res.status, type, notImage: true });
        continue;
      }
      const blob = await res.blob();
      if (!blob.size) {
        tried.push({ ext, status: res.status, empty: true });
        continue;
      }
      const objectUrl = URL.createObjectURL(blob);
      const result = { ok: true, url: objectUrl, extension: ext, rel };
      resolvedCache.set(baseName, result);
      objectUrls.set(baseName, objectUrl);
      return result;
    } catch (err) {
      tried.push({ ext, error: String(err) });
    }
  }
  const result = { ok: false, tried };
  // No cacheamos fallos: así «Reintentar» vuelve a buscar el archivo de verdad.
  return result;
}

/** Comprueba que un buffer sea una imagen por sus primeros bytes. */
export function sniffImageType(bytes) {
  if (!bytes || bytes.length < 4) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return 'jpeg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return 'png';
  if (bytes[0] === 0x47 && bytes[1] === 0x49) return 'gif';
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[8] === 0x57) return 'webp';
  return null;
}

/**
 * Carga un archivo de texto (carta). Devuelve { ok, text } o { ok:false }.
 * Se usa para public/personal/carta.txt (texto plano, nunca se interpreta HTML).
 */
export async function loadLetterText() {
  try {
    const res = await fetch(resolveAssetUrl(LETTER_FILE), { cache: 'no-cache' });
    if (!res.ok) return { ok: false, status: res.status };
    const type = res.headers.get('content-type') || '';
    if (type.includes('text/html')) return { ok: false, notText: true };
    const text = await res.text();
    if (!text.trim()) return { ok: false, empty: true };
    return { ok: true, text };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

/** ¿Existe un archivo de audio real? (mismo truco: comprobar tipo, no solo 200). */
export async function audioExists(relative) {
  try {
    const res = await fetch(resolveAssetUrl(relative), { method: 'GET', cache: 'no-cache' });
    if (!res.ok) return false;
    const type = res.headers.get('content-type') || '';
    if (type.includes('text/html')) return false; // fallback no es audio
    return type.startsWith('audio/') || type === 'application/octet-stream' || type === '';
  } catch {
    return false;
  }
}

export function voiceUrl() {
  return resolveAssetUrl(VOICE_FILE);
}

export function musicUrl(fileName) {
  return resolveAssetUrl(`${MUSIC_BASE_DIR}${fileName}`);
}
