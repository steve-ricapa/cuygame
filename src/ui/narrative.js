// ============================================================================
// Capa narrativa: fotos, álbum, carta, vale, vela y celebración.
// ----------------------------------------------------------------------------
// Todo con HTML real (botones <button>, texto seleccionable, foco gestionado),
// superpuesto al canvas de Phaser. La escena de juego se encarga de congelar el
// mundo; esta capa solo presenta el contenido y devuelve las confirmaciones.
//
// Estados de un recuerdo: locked → triggered → opening → presenting →
// acknowledged → complete. Aquí se gestiona la parte "presenting →
// acknowledged" (presentado ≠ leído).
// ============================================================================

import './narrative.css';
import { NICKNAME, VOUCHER, EPILOGUE } from '../content/birthday.js';
import { resolveAssetUrl } from './photos.js';

// ---- utilidades DOM --------------------------------------------------------

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'on') {
      // Acepta tanto un handler de click como un mapa { evento: handler }.
      if (typeof v === 'function') node.addEventListener('click', v);
      else for (const [ev, fn] of Object.entries(v)) node.addEventListener(ev, fn);
    }
    else if (k === 'dataset') for (const [dk, dv] of Object.entries(v)) node.dataset[dk] = dv;
    else if (v !== null && v !== undefined) node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c == null) continue;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return node;
}

const btn = (label, { primary, ghost, on } = {}) =>
  el('button', {
    class: `narrative-btn${primary ? ' primary' : ''}${ghost ? ' ghost' : ''}`,
    type: 'button',
    text: label,
    on,
  });

const prefersReducedMotion = () =>
  window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const EMBLEM_ICON = { flower: '🌸', note: '🎵', star: '⭐' };

// ---- pila de paneles -------------------------------------------------------

let root = null;
let stack = [];
let onStackEmpty = null;

function ensureRoot() {
  if (root) return root;
  root = el('div', { id: 'narrative-root', 'aria-hidden': 'true' });
  document.body.appendChild(root);
  return root;
}

function focusables(panel) {
  return Array.from(
    panel.querySelectorAll(
      'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
    )
  ).filter((n) => !n.disabled && n.offsetParent !== null);
}

function onKeydown(e) {
  const top = stack[stack.length - 1];
  if (!top) return;
  if (e.key === 'Escape') {
    if (top.dismissible) {
      e.preventDefault();
      top.close();
    }
    return;
  }
  if (e.key === 'Tab') {
    const f = focusables(top.panel);
    if (!f.length) return;
    const first = f[0];
    const last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}

/**
 * Abre un panel. `build(panel, api)` llena el panel y puede devolver una
 * función de limpieza. Devuelve un objeto con close().
 */
function openPanel({ className = '', dismissible = false, onClose, build }) {
  ensureRoot();
  const prevTop = stack[stack.length - 1];
  if (prevTop) prevTop.panel.style.display = 'none';

  const panel = el('div', { class: `narrative-panel ${className}`.trim(), role: 'dialog', 'aria-modal': 'true' });
  const savedFocus = document.activeElement;

  const entry = {
    panel,
    dismissible,
    close() {
      const idx = stack.indexOf(entry);
      if (idx === -1) return;
      stack.splice(idx, 1);
      panel.remove();
      if (cleanup) cleanup();
      const next = stack[stack.length - 1];
      if (next) {
        next.panel.style.display = '';
        const f = focusables(next.panel);
        if (f.length) f[0].focus();
      } else {
        root.classList.remove('open');
        root.setAttribute('aria-hidden', 'true');
        document.getElementById('app')?.removeAttribute('inert');
        if (savedFocus && savedFocus.focus) savedFocus.focus();
        onStackEmpty?.();
      }
      onClose?.();
    },
  };

  const api = { close: () => entry.close() };
  const cleanup = build(panel, api);

  stack.push(entry);
  root.appendChild(panel);
  root.classList.add('open');
  root.setAttribute('aria-hidden', 'false');
  const app = document.getElementById('app');
  if (app) app.setAttribute('inert', '');

  if (stack.length === 1) {
    if (!root.dataset.keybound) {
      document.addEventListener('keydown', onKeydown);
      root.dataset.keybound = '1';
    }
  }

  const f = focusables(panel);
  if (f.length) f[0].focus();
  return entry;
}

export function closeAll() {
  while (stack.length) stack[stack.length - 1].close();
}

export function isOpen() {
  return stack.length > 0;
}

/** Registra el callback que la escena usa para reanudar cuando se cierra todo. */
export function setOnStackEmpty(fn) {
  onStackEmpty = fn;
}

// ---- Toast -----------------------------------------------------------------

let toastTimer = null;
export function toast(message, ms = 2600) {
  ensureRoot();
  document.querySelectorAll('.narrative-toast').forEach((n) => n.remove());
  const node = el('div', { class: 'narrative-toast', text: message });
  document.body.appendChild(node);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.remove(), ms);
}

// ---- visor de foto ---------------------------------------------------------

function photoFrame(url, { alt = 'Recuerdo' } = {}) {
  const img = el('img', { src: url, alt });
  const frame = el('div', { class: 'narrative-photo-frame' }, [img]);
  frame.addEventListener('click', () => frame.classList.toggle('zoomed'));
  frame.style.cursor = 'zoom-in';
  return { frame, img };
}

function photoViewer(url, title, caption) {
  openPanel({
    dismissible: true,
    build: (panel, api) => {
      panel.classList.add('wide');
      const { frame } = photoFrame(url, { alt: title });
      panel.append(
        el('h2', { class: 'narrative-title', text: title }),
        frame,
        el('div', { class: 'narrative-actions' }, [
          btn('Cerrar', { ghost: true, on: () => api.close() }),
        ])
      );
      if (caption) panel.insertBefore(el('p', { class: 'narrative-message', text: caption }), frame);
    },
  });
}

// ---- pantalla: recuerdo (cofre) -------------------------------------------

/**
 * Presenta una foto de recuerdo. Devuelve una promesa que resuelve en cuanto
 * se confirma. `getPhoto` reintenta la descarga. No se cierra con el fondo y
 * no hay cuenta atrás.
 */
export function showMemory({ memory, getPhoto, onExitToMenu }) {
  return new Promise((resolve) => {
    const entry = openPanel({
      dismissible: false,
      build: (panel, api) => {
        let confirming = false;
        const title = el('h2', { class: 'narrative-title', text: memory.title });
        const holder = el('div', { class: 'narrative-photo-slot' });
        const message = el('p', { class: 'narrative-message', text: memory.message });
        const confirmBtn = btn(memory.button || 'Guardar este recuerdo', {
          primary: true,
          on: () => {
            if (confirming || !confirmBtn.dataset.ready) return;
            confirming = true;
            // Resolver ANTES de cerrar: el cierre de respaldo resuelve 'closed'.
            resolve('confirmed');
            api.close();
          },
        });
        confirmBtn.disabled = true;
        const actions = el('div', { class: 'narrative-actions' }, [confirmBtn]);

        const loading = el('div', { class: 'narrative-photo-loading', text: 'Abriendo el cofre…' });
        holder.appendChild(loading);

        const showPhoto = (url) => {
          holder.innerHTML = '';
          const { frame, img } = photoFrame(url, { alt: memory.title });
          holder.appendChild(frame);
          img.addEventListener('load', () => {
            confirmBtn.disabled = false;
            confirmBtn.dataset.ready = '1';
          });
          if (img.complete) {
            confirmBtn.disabled = false;
            confirmBtn.dataset.ready = '1';
          }
        };

        // Falta la foto (o no es válida): se muestra un marcador explícito en
        // vez de dejar a la jugadora atascada. El recuerdo se puede guardar
        // igualmente; `npm run content:check` avisa aparte de que falta el
        // archivo real, así que no se puede regalar sin las tres fotos.
        const showPlaceholder = () => {
          holder.innerHTML = '';
          holder.appendChild(
            el('div', { class: 'narrative-photo-frame placeholder' }, [
              el('div', { class: 'narrative-photo-placeholder' }, [
                el('div', { class: 'narrative-photo-placeholder-icon', text: '📷' }),
                el('p', { text: 'Foto pendiente' }),
              ]),
            ])
          );
          holder.appendChild(
            el('p', { class: 'narrative-photo-error', text: 'No encontré esta foto. Aparecerá aquí en cuanto el archivo exista en public/personal/fotos.' })
          );
          const retry = btn('Reintentar', { ghost: true, on: async () => {
            setBusy();
            const r = await getPhoto();
            if (r.ok) showPhoto(r.url);
            else showPlaceholder();
          } });
          const back = btn('Volver al menú', { ghost: true, on: () => {
            resolve('error');
            api.close();
            onExitToMenu?.();
          } });
          holder.appendChild(el('div', { class: 'narrative-actions' }, [retry, back]));
          confirmBtn.disabled = false;
          confirmBtn.dataset.ready = '1';
        };

        const setBusy = () => {
          holder.innerHTML = '';
          holder.appendChild(el('div', { class: 'narrative-photo-loading', text: 'Cargando la foto…' }));
        };

        const emoji = memory.emoji
          ? el('div', { class: 'narrative-emoji', text: memory.emoji, 'aria-hidden': 'true' })
          : null;

        panel.append(...[emoji, title, holder, message, actions].filter(Boolean));

        (async () => {
          const r = await getPhoto();
          if (r.ok) showPhoto(r.url);
          else showPlaceholder();
        })();
      },
    });
    // Si algo cierra el panel sin confirmar (no debería), resolvemos de forma segura.
    const origClose = entry.close;
    entry.close = () => {
      if (!entry.__resolved) {
        entry.__resolved = true;
        resolve('closed');
      }
      origClose();
    };
  });
}

// ---- pantalla: álbum -------------------------------------------------------

export function showAlbum({ memories, onOpenMemory, onClose }) {
  openPanel({
    dismissible: true,
    onClose,
    build: (panel, api) => {
      panel.classList.add('wide');
      panel.append(el('h2', { class: 'narrative-title', text: 'Mi álbum' }));

      const grid = el('div', { class: 'album-grid' });
      for (const m of memories) {
        if (m.acknowledged) {
          const card = el('button', {
            class: 'album-card',
            type: 'button',
            'aria-label': `Ver ${m.title}`,
            on: () => onOpenMemory(m),
          });
          if (m.photoUrl) card.appendChild(el('img', { src: m.photoUrl, alt: m.title }));
          else card.appendChild(el('div', { class: 'album-emoji', text: m.emoji || EMBLEM_ICON[m.emblem] || '🌸' }));
          card.appendChild(el('div', { class: 'album-label', text: m.title }));
          grid.appendChild(card);
        } else {
          grid.appendChild(
            el('div', { class: 'album-card locked', 'aria-label': 'Recuerdo aún sin descubrir' }, [
              el('div', { class: 'album-emoji', text: '🔒' }),
              el('div', { class: 'album-label', text: 'Sorpresa' }),
            ])
          );
        }
      }
      panel.appendChild(grid);

      panel.appendChild(el('div', { class: 'narrative-actions' }, [btn('Cerrar', { ghost: true, on: () => api.close() })]));
    },
  });
}

export function openPhotoViewer(memory, url) {
  photoViewer(url, memory.title, memory.message);
}

// ---- pantalla: carta -------------------------------------------------------

/**
 * Sobre → carta. `text` es texto plano (nunca se interpreta HTML).
 * Si `voiceAvailable`, ofrece "Escuchar a tu cuy" y llama a onVoice.
 */
export function showLetter({ text, voiceAvailable, onVoice }) {
  return new Promise((resolve) => {
    let resolved = false;
    const finish = (result) => {
      if (resolved) return;
      resolved = true;
      resolve(result);
    };

    openPanel({
      dismissible: true,
      onClose: () => finish('closed'),
      build: (panel, api) => {
        // --- Sobre
        const envelope = el('div', { class: 'letter-envelope' }, [
          el('div', { class: 'envelope-art', text: '✉️' }),
          el('p', { class: 'narrative-message', text: `Para ${NICKNAME}` }),
          el('div', { class: 'narrative-actions' }, [
            btn('Abrir la carta', { primary: true, on: () => renderLetter() }),
          ]),
        ]);

        const renderLetter = () => {
          panel.innerHTML = '';
          panel.append(el('h2', { class: 'narrative-title', text: `Para ${NICKNAME}` }));

          const body = el('div', { class: 'letter-body', role: 'document' });
          const parts = text.trim().split(/\n\s*\n/);
          parts.forEach((p) => body.appendChild(el('p', { text: p })));

          if (voiceAvailable) {
            panel.appendChild(el('div', { class: 'narrative-actions' }, [
              btn('🎧 Escuchar a tu cuy', { on: () => onVoice?.() }),
            ]));
          }
          panel.appendChild(body);

          const actions = el('div', { class: 'narrative-actions' });
          actions.appendChild(btn('Mostrar completa', { ghost: true, on: () => {
            body.scrollTop = body.scrollHeight;
          } }));
          actions.appendChild(btn(EPILOGUE.continueButton, { primary: true, on: () => {
            finish('continue');
            api.close();
          } }));
          panel.appendChild(actions);
        };

        panel.appendChild(envelope);
      },
    });
  });
}

// ---- pantalla: paso genérico ----------------------------------------------

export function showStep({ title, message, button = 'Continuar', extraButtons = [], emblems }) {
  return new Promise((resolve) => {
    openPanel({
      dismissible: false,
      build: (panel, api) => {
        if (title) panel.appendChild(el('h2', { class: 'narrative-title', text: title }));
        if (emblems) {
          const row = el('div', { class: 'narrative-emblems' });
          for (const e of emblems) {
            row.appendChild(el('span', { class: e.on ? '' : 'dim', text: EMBLEM_ICON[e.key] || '✨' }));
          }
          panel.appendChild(row);
        }
        if (message) panel.appendChild(el('p', { class: 'narrative-message', text: message }));
        const actions = el('div', { class: 'narrative-actions' });
        for (const b of extraButtons) actions.appendChild(btn(b.label, { ghost: true, on: b.on }));
        actions.appendChild(btn(button, { primary: true, on: () => { api.close(); resolve('continue'); } }));
        panel.appendChild(actions);
      },
    });
  });
}

// ---- pantalla: elección simple (sí / no) ----------------------------------

/**
 * Una pregunta de dos opciones con botones reales. Devuelve 'yes' o 'no'.
 * Se usa para la "patita" de ayuda cuando el jugador se atasca.
 */
export function showChoice({ title, message, yes = 'Sí', no = 'No', emblems }) {
  return new Promise((resolve) => {
    openPanel({
      dismissible: false,
      build: (panel, api) => {
        if (title) panel.appendChild(el('h2', { class: 'narrative-title', text: title }));
        if (emblems) {
          const row = el('div', { class: 'narrative-emblems' });
          for (const e of emblems) {
            row.appendChild(el('span', { class: e.on ? '' : 'dim', text: EMBLEM_ICON[e.key] || '✨' }));
          }
          panel.appendChild(row);
        }
        if (message) panel.appendChild(el('p', { class: 'narrative-message', text: message }));
        panel.appendChild(
          el('div', { class: 'narrative-actions' }, [
            btn(no, { ghost: true, on: () => { api.close(); resolve('no'); } }),
            btn(yes, { primary: true, on: () => { api.close(); resolve('yes'); } }),
          ])
        );
      },
    });
  });
}

// ---- pantalla: vela / deseo -----------------------------------------------

/**
 * La vela se puede apagar con:
 *  1) un botón sencillo (siempre disponible),
 *  2) mantener pulsada la vela,
 *  3) micrófono opcional (llamado por separado).
 * Ninguna opción exige permiso previo.
 */
export function showCandle({ onMic, micAvailable }) {
  return new Promise((resolve) => {
    let holdTimer = null;
    let lit = true;
    openPanel({
      dismissible: false,
      build: (panel, api) => {
        panel.appendChild(el('h2', { class: 'narrative-title', text: 'Tu deseo' }));
        panel.appendChild(el('p', { class: 'narrative-message', text: EPILOGUE.wishLine }));

        const cake = el('div', { class: 'cake-stage' }, [
          el('div', { class: 'cake-art lit', text: '🎂', role: 'img', 'aria-label': 'Torta con la vela encendida' }),
        ]);
        const cakeArt = cake.firstChild;
        panel.appendChild(cake);

        const blow = (source) => {
          if (!lit) return;
          lit = false;
          cakeArt.classList.remove('lit');
          cakeArt.classList.add('out');
          cakeArt.textContent = '🍰';
          clearTimeout(holdTimer);
          setTimeout(() => {
            api.close();
            resolve({ blown: true, source });
          }, prefersReducedMotion() ? 0 : 550);
        };

        const simple = btn(EPILOGUE.candleButtons.simple, { primary: true, on: () => blow('button') });
        const actions = el('div', { class: 'narrative-actions' }, [simple]);
        if (micAvailable) {
          actions.appendChild(btn('🎤 ' + EPILOGUE.candleButtons.mic, { ghost: true, on: () => onMic?.(blow) }));
        }
        panel.appendChild(actions);

        // Mantener pulsada la vela
        cakeArt.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          holdTimer = setTimeout(() => blow('hold'), 800);
        });
        const cancelHold = () => clearTimeout(holdTimer);
        cakeArt.addEventListener('pointerup', cancelHold);
        cakeArt.addEventListener('pointercancel', cancelHold);
        cakeArt.addEventListener('pointerleave', cancelHold);

        panel.appendChild(el('p', { class: 'narrative-sub', text: EPILOGUE.micHint }));
      },
    });
  });
}

// ---- pantalla: regalo final (vale interactivo) -----------------------------

const GIFT_W = 1080;
const GIFT_FONT_SERIF = 'Georgia, "Times New Roman", serif';
const GIFT_FONT_SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const GIFT_FONT_EMOJI = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';

let cuyImagePromise = null;
/** Carga (una sola vez) el retrato del cuy para el vale. Si falla, devuelve null. */
function loadCuyImage() {
  if (!cuyImagePromise) {
    cuyImagePromise = new Promise((resolve) => {
      try {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = resolveAssetUrl('assets/cuy/portrait.png');
      } catch {
        resolve(null);
      }
    });
  }
  return cuyImagePromise;
}

function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function heartPath(ctx, cx, cy, s) {
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.75);
  ctx.bezierCurveTo(cx - s * 1.05, cy - s * 0.25, cx - s * 0.55, cy - s * 0.95, cx, cy - s * 0.35);
  ctx.bezierCurveTo(cx + s * 0.55, cy - s * 0.95, cx + s * 1.05, cy - s * 0.25, cx, cy + s * 0.75);
  ctx.closePath();
}

/** Dibuja texto ajustado al ancho, respetando saltos de línea. Devuelve el y siguiente. */
function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
  const lines = [];
  for (const paragraph of String(text).split('\n')) {
    const words = paragraph.split(' ');
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(test).width > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    lines.push(line);
  }
  for (const line of lines) {
    ctx.fillText(line, x, y);
    y += lineHeight;
  }
  return y;
}

/**
 * Dibuja el contenido del vale de arriba hacia abajo y devuelve el y final.
 * Se ejecuta dos veces: una para medir la altura y otra para pintar de verdad.
 */
function layoutGiftCard(ctx, options) {
  const PAD = 74;
  const CX = GIFT_W / 2;
  const inner = GIFT_W - 2 * PAD;
  const card = VOUCHER.card;
  let y = 176;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // Encabezado
  ctx.fillStyle = '#B98A2E';
  ctx.font = `600 30px ${GIFT_FONT_SANS}`;
  ctx.fillText(`${card.headerIcon} ${card.header}`, CX, y);
  y += 30;
  ctx.strokeStyle = '#E3C98F';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(CX - 150, y);
  ctx.lineTo(CX + 150, y);
  ctx.stroke();
  y += 78;

  // Título principal (se reduce solo para caber en una línea).
  ctx.fillStyle = '#5A3B2E';
  let titleSize = 78;
  const titleStr = `${card.title} ${card.titleHeart}`;
  ctx.font = `700 ${titleSize}px ${GIFT_FONT_SERIF}`;
  while (titleSize > 42 && ctx.measureText(titleStr).width > inner - 40) {
    titleSize -= 4;
    ctx.font = `700 ${titleSize}px ${GIFT_FONT_SERIF}`;
  }
  ctx.fillText(titleStr, CX, y);
  y += Math.round(titleSize * 1.2);

  // Separador con corazón
  ctx.fillStyle = '#EAA6BC';
  heartPath(ctx, CX, y - 8, 16);
  ctx.fill();
  ctx.strokeStyle = '#E3C98F';
  ctx.beginPath();
  ctx.moveTo(CX - 220, y);
  ctx.lineTo(CX - 28, y);
  ctx.moveTo(CX + 28, y);
  ctx.lineTo(CX + 220, y);
  ctx.stroke();
  y += 62;

  // Dedicatoria
  ctx.fillStyle = '#7A5F4F';
  ctx.font = `italic 31px ${GIFT_FONT_SERIF}`;
  y = drawWrappedText(ctx, card.dedication, CX, y, inner - 150, 46);
  y += 54;

  // Sección: tu aventura elegida
  ctx.fillStyle = '#5A3B2E';
  ctx.font = `700 38px ${GIFT_FONT_SERIF}`;
  ctx.fillText(card.chosenTitle, CX, y);
  y += 40;
  for (const opt of options) {
    const h = 104;
    const x = PAD + 90;
    const w = inner - 180;
    roundRectPath(ctx, x, y, w, h, 26);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = opt.accent || '#E3C98F';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.textAlign = 'left';
    ctx.font = `46px ${GIFT_FONT_EMOJI}`;
    ctx.fillStyle = '#5A3B2E';
    ctx.fillText(opt.icon, x + 36, y + h / 2 + 16);
    ctx.font = `700 36px ${GIFT_FONT_SANS}`;
    ctx.fillStyle = '#5A3B2E';
    ctx.fillText(opt.label, x + 112, y + h / 2 + 13);
    ctx.textAlign = 'center';
    y += h + 20;
  }
  y += 24;

  // Sección: condiciones
  ctx.fillStyle = '#5A3B2E';
  ctx.font = `700 38px ${GIFT_FONT_SERIF}`;
  ctx.fillText(card.conditionsTitle, CX, y);
  y += 44;
  ctx.font = `27px ${GIFT_FONT_SANS}`;
  for (const cond of card.conditions) {
    const w = ctx.measureText(cond).width;
    const left = CX - w / 2;
    ctx.fillStyle = '#EAA6BC';
    heartPath(ctx, left - 30, y - 9, 10);
    ctx.fill();
    ctx.fillStyle = '#7A5F4F';
    ctx.textAlign = 'left';
    ctx.fillText(cond, left, y);
    ctx.textAlign = 'center';
    y += 48;
  }
  y += 24;

  // Mensaje final
  ctx.fillStyle = '#7A5F4F';
  ctx.font = `italic 33px ${GIFT_FONT_SERIF}`;
  y = drawWrappedText(ctx, card.finalMessage, CX, y, inner - 170, 48);
  y += 24;

  // Firma
  ctx.fillStyle = '#5A3B2E';
  ctx.font = `700 31px ${GIFT_FONT_SANS}`;
  y = drawWrappedText(ctx, card.signature, CX, y, inner, 44);

  return y;
}

/** Construye el canvas definitivo del vale (1080 px de ancho, alto variable). */
function buildGiftCanvas(options, cuyImg) {
  const PAD = 74;
  const cuySize = 208;
  const measureCtx = document.createElement('canvas').getContext('2d');
  const contentBottom = layoutGiftCard(measureCtx, options);
  const H = Math.ceil(contentBottom + cuySize + PAD + 10);

  const canvas = document.createElement('canvas');
  canvas.width = GIFT_W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Fondo crema con lavado rosa en la parte alta.
  ctx.fillStyle = '#FFF7EC';
  ctx.fillRect(0, 0, GIFT_W, H);
  const wash = Math.min(H, 980);
  const grad = ctx.createLinearGradient(0, 0, 0, wash);
  grad.addColorStop(0, '#FDECF1');
  grad.addColorStop(1, '#FFF7EC');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, GIFT_W, wash);

  // Contenido.
  layoutGiftCard(ctx, options);

  // Marco ornamental doble.
  const inset = 40;
  ctx.strokeStyle = '#D9A441';
  ctx.lineWidth = 6;
  roundRectPath(ctx, inset, inset, GIFT_W - 2 * inset, H - 2 * inset, 36);
  ctx.stroke();
  ctx.strokeStyle = '#EAA6BC';
  ctx.lineWidth = 2;
  ctx.setLineDash([12, 10]);
  roundRectPath(ctx, inset + 16, inset + 16, GIFT_W - 2 * (inset + 16), H - 2 * (inset + 16), 26);
  ctx.stroke();
  ctx.setLineDash([]);

  // Corazones en las esquinas (se omite la inferior derecha: la ocupa el cuy).
  const corner = inset + 44;
  ctx.fillStyle = '#F2B8C8';
  for (const [hx, hy] of [
    [corner, corner],
    [GIFT_W - corner, corner],
    [corner, H - corner],
  ]) {
    heartPath(ctx, hx, hy, 15);
    ctx.fill();
  }

  // Ilustración del cuy (esquina inferior derecha).
  const cuyX = GIFT_W - PAD - cuySize;
  const cuyY = H - PAD - cuySize + 6;
  ctx.fillStyle = '#FDE7EE';
  roundRectPath(ctx, cuyX - 8, cuyY - 8, cuySize + 16, cuySize + 16, 42);
  ctx.fill();
  if (cuyImg && cuyImg.width) {
    const ar = cuyImg.width / cuyImg.height;
    let dw = cuySize;
    let dh = cuySize;
    if (ar > 1) dh = cuySize / ar;
    else dw = cuySize * ar;
    ctx.drawImage(cuyImg, cuyX + (cuySize - dw) / 2, cuyY + (cuySize - dh) / 2, dw, dh);
  } else {
    ctx.textAlign = 'center';
    ctx.font = `140px ${GIFT_FONT_EMOJI}`;
    ctx.fillStyle = '#5A3B2E';
    ctx.fillText('🐹', cuyX + cuySize / 2, cuyY + cuySize / 2 + 50);
  }

  return canvas;
}

function canvasToBlob(canvas) {
  return new Promise((resolve) => {
    if (canvas.toBlob) {
      canvas.toBlob((blob) => resolve(blob), 'image/png');
      return;
    }
    // Respaldo para navegadores sin canvas.toBlob.
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const bin = atob(dataUrl.split(',')[1]);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i += 1) arr[i] = bin.charCodeAt(i);
      resolve(new Blob([arr], { type: 'image/png' }));
    } catch {
      resolve(null);
    }
  });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = el('a', { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 15000);
}

export function showCelebration({ onReplay, onAlbum, onLetter, onVoucher }) {
  openPanel({
    dismissible: false,
    build: (panel, api) => {
      panel.appendChild(el('h2', { class: 'narrative-title', text: EPILOGUE.celebrationTitle }));
      panel.appendChild(el('p', { class: 'narrative-message', text: EPILOGUE.rewardTitle }));
      panel.appendChild(el('div', { class: 'narrative-sub', text: '🎂 🎁 ⭐ 🎵 🌸' }));
      panel.appendChild(el('div', { class: 'narrative-actions' }, [
        // Cerrar este panel antes de abrir el siguiente: evita apilar capas.
        btn('Ver mi álbum', { primary: true, on: () => { api.close(); onAlbum?.(); } }),
        btn('Leer la carta', { on: () => { api.close(); onLetter?.(); } }),
        btn('Mi vale', { on: () => { api.close(); onVoucher?.(); } }),
        btn(EPILOGUE.replay, { ghost: true, on: () => { api.close(); onReplay?.(); } }),
      ]));
    },
  });
}

/**
 * Regalo final en dos fases:
 *  1) elige una o varias opciones;
 *  2) se genera un vale (tarjeta vertical) descargable como PNG y compartible.
 * Resuelve con `{ optionIds }` al pulsar «Continuar». Selección local, sin envíos.
 */
export function showReward({ initialOptionIds = [], onSelectionChange } = {}) {
  return new Promise((resolve) => {
    const selected = new Set(
      (Array.isArray(initialOptionIds) ? initialOptionIds : []).filter((id) =>
        VOUCHER.options.some((o) => o.id === id)
      )
    );

    openPanel({
      className: 'wide gift-panel',
      dismissible: false,
      build: (panel, api) => {
        const stage = el('div', { class: 'gift-stage' });
        panel.appendChild(stage);

        let finished = false;
        let buildToken = 0;
        let canvas = null;

        const selectedOptions = () => VOUCHER.options.filter((o) => selected.has(o.id));
        const notify = () => onSelectionChange?.([...selected]);

        const finishReward = () => {
          if (finished) return;
          finished = true;
          notify();
          api.close();
          resolve({ optionIds: [...selected] });
        };

        const renderPhase1 = () => {
          canvas = null;
          stage.textContent = '';
          stage.appendChild(el('h2', { class: 'narrative-title', text: VOUCHER.chooseTitle }));
          stage.appendChild(el('p', { class: 'narrative-sub', text: VOUCHER.chooseSubtitle }));
          stage.appendChild(el('p', { class: 'narrative-message gift-message', text: VOUCHER.chooseMessage }));

          const grid = el('div', { class: 'gift-options', role: 'group', 'aria-label': VOUCHER.chooseTitle });
          for (const opt of VOUCHER.options) {
            const card = el('button', {
              class: 'gift-option',
              type: 'button',
              'aria-pressed': String(selected.has(opt.id)),
              on: () => {
                if (selected.has(opt.id)) selected.delete(opt.id);
                else selected.add(opt.id);
                card.setAttribute('aria-pressed', String(selected.has(opt.id)));
                createBtn.disabled = selected.size === 0;
                notify();
              },
            }, [
              el('span', { class: 'gift-check', text: '✓', 'aria-hidden': 'true' }),
              el('span', { class: 'gift-icon', text: opt.icon, 'aria-hidden': 'true' }),
              el('span', { class: 'gift-text' }, [
                el('strong', { class: 'gift-label', text: opt.label }),
                el('span', { class: 'gift-detail', text: opt.detail }),
              ]),
            ]);
            grid.appendChild(card);
          }
          stage.appendChild(grid);
          stage.appendChild(el('p', { class: 'gift-note', text: VOUCHER.optionsNote }));

          const createBtn = btn(VOUCHER.createButton, { primary: true, on: () => startPhase2() });
          createBtn.disabled = selected.size === 0;
          stage.appendChild(el('div', { class: 'narrative-actions' }, [createBtn]));

          const f = focusables(panel);
          if (f.length) f[0].focus();
        };

        const renderBuilding = () => {
          stage.textContent = '';
          stage.appendChild(el('h2', { class: 'narrative-title', text: VOUCHER.previewTitle }));
          stage.appendChild(el('div', { class: 'gift-building', text: VOUCHER.building }));
        };

        const renderPhase2 = () => {
          if (!canvas) {
            startPhase2();
            return;
          }
          stage.textContent = '';
          stage.appendChild(el('h2', { class: 'narrative-title', text: VOUCHER.previewTitle }));
          stage.appendChild(el('p', { class: 'narrative-sub', text: VOUCHER.previewSubtitle }));

          canvas.className = 'gift-canvas';
          canvas.setAttribute('role', 'img');
          canvas.setAttribute(
            'aria-label',
            `Vale de cumpleaños: ${selectedOptions().map((o) => o.label).join(', ')}`
          );
          stage.appendChild(el('div', { class: 'gift-preview' }, [canvas]));

          const downloadBtn = btn(VOUCHER.downloadButton, {
            primary: true,
            on: async () => {
              const blob = await canvasToBlob(canvas);
              if (!blob) {
                toast('No pude generar la imagen; guarda una captura de pantalla.');
                return;
              }
              downloadBlob(blob, VOUCHER.downloadName);
              toast('Vale descargado 💝');
            },
          });

          const shareBtn = btn(VOUCHER.shareButton, {
            on: async () => {
              const blob = await canvasToBlob(canvas);
              if (!blob) {
                toast('No pude generar la imagen para compartir.');
                return;
              }
              const file = new File([blob], VOUCHER.downloadName, { type: 'image/png' });
              const canShareFiles =
                typeof navigator !== 'undefined' &&
                !!navigator.canShare &&
                !!navigator.share &&
                navigator.canShare({ files: [file] });
              if (canShareFiles) {
                try {
                  await navigator.share({ files: [file], title: VOUCHER.shareTitle, text: VOUCHER.shareText });
                } catch (err) {
                  if (err?.name !== 'AbortError') {
                    downloadBlob(blob, VOUCHER.downloadName);
                    toast('Comparte el archivo descargado 💌');
                  }
                }
              } else {
                downloadBlob(blob, VOUCHER.downloadName);
                toast('Tu navegador no permite compartir; lo descargué 💌');
              }
            },
          });

          const changeBtn = btn(VOUCHER.changeButton, { ghost: true, on: () => renderPhase1() });
          const continueBtn = btn(VOUCHER.continueButton, { primary: true, on: () => finishReward() });

          stage.appendChild(el('div', { class: 'narrative-actions gift-actions' }, [downloadBtn, shareBtn]));
          stage.appendChild(el('div', { class: 'narrative-actions gift-actions' }, [changeBtn, continueBtn]));

          const f = focusables(panel);
          if (f.length) f[0].focus();
        };

        const startPhase2 = async () => {
          renderBuilding();
          const token = ++buildToken;
          const cuyImg = await loadCuyImage();
          if (token !== buildToken) return; // se cambió de fase mientras cargaba
          canvas = buildGiftCanvas(selectedOptions(), cuyImg);
          renderPhase2();
        };

        renderPhase1();
      },
    });
  });
}

// ---- confeti ligero --------------------------------------------------------

export function confetti(durationMs = 2200) {
  if (prefersReducedMotion()) return;
  const colors = ['#EAC56A', '#EAA6BC', '#9B86C8', '#9CBF9B', '#FFF4DD'];
  const layer = el('div', { class: 'confetti-layer' });
  document.body.appendChild(layer);
  const n = 70;
  for (let i = 0; i < n; i++) {
    const piece = el('span');
    const size = 6 + Math.random() * 8;
    piece.style.cssText = `position:absolute;left:${Math.random() * 100}%;top:-20px;width:${size}px;height:${size}px;background:${colors[i % colors.length]};border-radius:${Math.random() > 0.5 ? '50%' : '2px'};`;
    layer.appendChild(piece);
    const dx = (Math.random() - 0.5) * 200;
    const rot = Math.random() * 720 - 360;
    piece.animate(
      [
        { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
        { transform: `translate(${dx}px, ${window.innerHeight + 60}px) rotate(${rot}deg)`, opacity: 0.9 },
      ],
      { duration: durationMs + Math.random() * 1200, easing: 'cubic-bezier(0.3,0.7,0.6,1)', fill: 'forwards' }
    );
  }
  setTimeout(() => layer.remove(), durationMs + 1600);
}

export { el, btn, EMBLEM_ICON };
