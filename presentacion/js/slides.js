/* =====================================================================
   slides.js — Utilidades compartidas por las diapositivas

   Cada diapositiva es un objeto:
   {
     section, title, trans,        // metadatos (trans: slide|zoom|blur|rise|scan)
     html,                         // contenido
     notes,                        // notas del expositor (HTML)
     init(el),                     // una sola vez (crear cartas, enlazar controles)
     enter(el), leave(el)          // cada vez que se entra / sale (bucles de animación)
   }
   Las diapositivas se definen en slides-a.js, slides-b.js y slides-c.js.
   ===================================================================== */
(function (global) {
  'use strict';

  const SL = {
    /* ---------- Marcado ---------- */
    frac: (n, d) => `<span class="frac"><span class="fn">${n}</span><span class="fd">${d}</span></span>`,

    head: (kicker, title, sub = '') => `
      <header class="slide-head">
        <div class="kicker rv left">${kicker}</div>
        <h2 class="title rv left">${title}</h2>
        ${sub ? `<div class="subtitle rv left">${sub}</div>` : ''}
      </header>`,

    ro: (label, key, cls = '') =>
      `<div class="ro ${cls}"><div class="lbl">${label}</div><div class="val" data-k="${key}">—</div></div>`,

    /** Campo con deslizador + caja numérica sincronizados. */
    field: (label, key, min, max, step, value, unit = '') => `
      <div class="field">
        <label for="${key}-n">${label}</label>
        <input type="range" data-f="${key}" min="${min}" max="${max}" step="${step}" value="${value}" aria-label="${label.replace(/<[^>]+>/g, '')}">
        <input type="number" class="num" id="${key}-n" data-fn="${key}" step="${step}" value="${value}" title="${unit}">
      </div>`,

    /* ---------- Acceso al DOM ---------- */
    q: (el, sel) => el.querySelector(sel),
    qa: (el, sel) => Array.from(el.querySelectorAll(sel)),
    k: (el, key) => el.querySelector(`[data-k="${key}"]`),
    set(el, key, html) { const e = SL.k(el, key); if (e) e.innerHTML = html; },
    unit: (v, u) => `${v}<span class="u">${u}</span>`,

    /**
     * Enlaza un campo (rango + número). onChange(valor) se llama en cada cambio.
     * La caja numérica admite valores fuera del rango del deslizador.
     */
    bindField(el, key, onChange) {
      const r = el.querySelector(`[data-f="${key}"]`);
      const n = el.querySelector(`[data-fn="${key}"]`);
      let value = parseFloat(n.value);
      const api = {
        get: () => value,
        set(v, silent) {
          value = v;
          r.value = v;
          n.value = +(+v).toFixed(4);
          if (!silent) onChange(value);
        },
      };
      r.addEventListener('input', () => { value = parseFloat(r.value); n.value = r.value; onChange(value); });
      n.addEventListener('input', () => {
        const v = parseFloat(n.value);
        if (!Number.isFinite(v)) return;
        value = v;
        r.value = v;
        onChange(value);
      });
      return api;
    },

    /** Activa un botón dentro de un grupo. */
    activate(btns, btn) { btns.forEach(b => b.classList.toggle('on', b === btn)); },

    /* ---------- Diagrama de línea de transmisión (SVG) ---------- */
    /**
     * Dibuja fuente → línea → carga dentro de un <svg>. Devuelve referencias.
     * opts: { w, h, x0, x1, y, gap, srcLabel, loadLabel, z0Label }
     */
    lineDiagram(svg, o) {
      const E = SmithChart.el;
      const y1 = o.y - o.gap / 2, y2 = o.y + o.gap / 2;
      const g = E('g', null, svg);
      // Fuente
      E('line', { x1: o.x0 - 60, y1, x2: o.x0, y2: y1, class: 'conductor' }, g);
      E('line', { x1: o.x0 - 60, y1: y2, x2: o.x0, y2, class: 'conductor' }, g);
      E('circle', { cx: o.x0 - 60, cy: o.y, r: 30, fill: '#0a1a33', stroke: '#22e4ff', 'stroke-width': 2.5 }, g);
      E('path', { d: `M ${o.x0 - 78} ${o.y} q 9 -16 18 0 t 18 0`, fill: 'none', stroke: '#22e4ff', 'stroke-width': 2.5 }, g);
      const ts = E('text', { x: o.x0 - 60, y: o.y + 54, 'text-anchor': 'middle', class: 'lbl' }, g); ts.textContent = o.srcLabel !== undefined ? o.srcLabel : 'FUENTE';
      // Conductores de la línea
      E('line', { x1: o.x0, y1, x2: o.x1, y2: y1, class: 'conductor' }, g);
      E('line', { x1: o.x0, y1: y2, x2: o.x1, y2, class: 'conductor' }, g);
      const tz = E('text', { x: (o.x0 + o.x1) / 2, y: o.z0y !== undefined ? o.z0y : y2 + 30, 'text-anchor': 'middle', class: 'lbl' }, g); tz.textContent = o.z0Label !== undefined ? o.z0Label : 'LÍNEA  Z₀ = 50 Ω';
      // Carga
      const lx = o.x1 + 30;
      E('line', { x1: o.x1, y1, x2: lx, y2: y1, class: 'conductor' }, g);
      E('line', { x1: o.x1, y1: y2, x2: lx, y2, class: 'conductor' }, g);
      const box = E('rect', { x: lx - 16, y: o.y - o.gap / 2 + 8, width: 32, height: o.gap - 16, rx: 5, fill: '#0a1a33', stroke: '#3cf7a6', 'stroke-width': 2.5 }, g);
      const zig = E('path', { d: `M ${lx} ${y1 + 12} l 8 6 l -16 10 l 16 10 l -16 10 l 8 6`, fill: 'none', stroke: '#3cf7a6', 'stroke-width': 2 }, g);
      const tl = E('text', { x: lx, y: o.y + 54 + (o.gap - 80) / 2, 'text-anchor': 'middle', class: 'lbl lbl-w' }, g); tl.textContent = o.loadLabel !== undefined ? o.loadLabel : 'CARGA  Z_L';
      return { g, box, zig, loadLabel: tl, y1, y2 };
    },

    /* ---------- Iconos (SVG en línea) ---------- */
    icon(name) {
      const P = {
        wave: '<path d="M2 12c2.5-6 5-6 7.5 0s5 6 7.5 0 3.5-4 5-2"/>',
        back: '<path d="M20 8H8l4-4M8 8l4 4"/><path d="M4 16c2-3 4-3 6 0s4 3 6 0"/>',
        bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
        target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
        gauge: '<path d="M3 16a9 9 0 0118 0"/><path d="M12 16l5-6"/>',
        line: '<path d="M2 9h20M2 15h20"/>',
        chip: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
        antenna: '<path d="M12 10v12M8 22h8"/><path d="M12 10L5 3M12 10l7-7"/><path d="M7 13a7 7 0 010-6M17 13a7 7 0 000-6" opacity=".6"/>',
        filter: '<path d="M3 4h18l-7 8v6l-4 2v-8z"/>',
        amp: '<path d="M5 4v16l14-8z"/><path d="M2 12h3M19 12h3"/>',
        measure: '<rect x="3" y="5" width="18" height="13" rx="2"/><path d="M6 14c2-5 3-5 4 0s2 4 3-2 2-3 5 1"/>',
        network: '<path d="M3 8h5l2-3 2 6 2-6 2 3h5"/><path d="M12 11v9M8 20h8"/>',
        warn: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',
        check: '<path d="M4 12l5 5L20 6"/>',
        x: '<path d="M6 6l12 12M18 6L6 18"/>',
        plus: '<path d="M12 5v14M5 12h14"/>',
        complex: '<path d="M4 20V4M4 20h16"/><path d="M4 20L16 8"/><circle cx="16" cy="8" r="1.8"/>',
        phase: '<circle cx="12" cy="12" r="9"/><path d="M12 12h9M12 12l6-6"/>',
        heat: '<path d="M12 3c3 4 5 6 5 10a5 5 0 01-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-9z"/>',
        swr: '<path d="M2 12c3-8 5-8 7 0s4 8 6 0 4-8 7 0"/><path d="M2 6h20M2 18h20" stroke-dasharray="2 2"/>',
        book: '<path d="M4 4h7a3 3 0 013 3v13a2 2 0 00-2-2H4zM20 4h-5a3 3 0 00-3 3"/>',
        sim: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/><path d="M6 12l3-4 3 3 3-5 3 6"/>',
      };
      return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${P[name] || ''}</svg>`;
    },

    /** Gráfica simple (x lineal, y lineal) en un <svg>. Devuelve funciones de mapeo. */
    plotFrame(svg, o) {
      const E = SmithChart.el;
      const { w, h, l = 60, r = 16, t = 14, b = 40, xmin, xmax, ymin, ymax, xticks, yticks, xlabel, ylabel, xfmt = v => v, yfmt = v => v } = o;
      const X = v => l + (v - xmin) / (xmax - xmin) * (w - l - r);
      const Y = v => t + (ymax - v) / (ymax - ymin) * (h - t - b);
      const grid = E('g', { class: 'grid' }, svg);
      xticks.forEach(v => {
        E('line', { x1: X(v), y1: t, x2: X(v), y2: h - b }, grid);
        const tx = E('text', { x: X(v), y: h - b + 18, 'text-anchor': 'middle' }, svg); tx.textContent = xfmt(v);
      });
      yticks.forEach(v => {
        E('line', { x1: l, y1: Y(v), x2: w - r, y2: Y(v) }, grid);
        const ty = E('text', { x: l - 8, y: Y(v) + 4, 'text-anchor': 'end' }, svg); ty.textContent = yfmt(v);
      });
      E('rect', { x: l, y: t, width: w - l - r, height: h - t - b, fill: 'none', class: 'axis' }, svg);
      if (xlabel) { const a = E('text', { x: (l + w - r) / 2, y: h - 4, 'text-anchor': 'middle' }, svg); a.textContent = xlabel; }
      if (ylabel) { const a = E('text', { x: 14, y: (t + h - b) / 2, 'text-anchor': 'middle', transform: `rotate(-90 14 ${(t + h - b) / 2})` }, svg); a.textContent = ylabel; }
      return { X, Y, l, r, t, b, w, h, invX: px => xmin + (px - l) / (w - l - r) * (xmax - xmin) };
    },
  };

  global.SL = SL;
  global.SLIDES = [];
})(window);
