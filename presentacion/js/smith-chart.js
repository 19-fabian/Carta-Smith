/* =====================================================================
   smith-chart.js — Carta de Smith vectorial (SVG), calculada matemáticamente

   Sistema de coordenadas:
   - Plano complejo Γ = u + jv.  Escala S: |Γ| = 1  ↔  S unidades SVG.
   - SVG tiene el eje vertical hacia ABAJO, por eso:  x = S·u,  y = −S·v.
     Así, la mitad superior de la pantalla corresponde a v > 0 (inductiva).
   ===================================================================== */
(function (global) {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const S = 100; // radio del círculo unitario en unidades SVG

  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  /** Γ → coordenadas SVG (con inversión del eje vertical). */
  function toXY(g) { return { x: g.re * S, y: -g.im * S }; }

  const GRID = {
    normal: {
      rMajor: [0.2, 0.5, 1, 2, 5],
      rMinor: [0.1, 0.3, 0.4, 0.6, 0.7, 0.8, 0.9, 1.2, 1.4, 1.6, 1.8, 3, 4, 10],
      xMajor: [0.2, 0.5, 1, 2, 5],
      xMinor: [0.1, 0.3, 0.4, 0.6, 0.7, 0.8, 0.9, 1.2, 1.4, 1.6, 1.8, 3, 4, 10],
    },
    light: {
      rMajor: [0.2, 0.5, 1, 2, 5], rMinor: [],
      xMajor: [0.2, 0.5, 1, 2, 5], xMinor: [],
    },
  };

  let counter = 0;

  class SmithChart {
    /**
     * @param {HTMLElement} host  contenedor
     * @param {object} opts
     *   labels, phaseScale, wlScale, plane, regions, density ('normal'|'light'),
     *   interactive, point, vector, vswr, coords, onChange(gamma), hidden (empieza oculta)
     */
    constructor(host, opts = {}) {
      this.o = Object.assign({
        labels: true, phaseScale: false, wlScale: false, plane: false, regions: false,
        density: 'normal', interactive: false, point: false, vector: true, vswr: false,
        coords: false, onChange: null, hidden: false, clampUnit: true,
      }, opts);
      this.id = 'sc' + (++counter);
      this.gamma = { re: 0, im: 0 };
      this.highlights = {};
      this._cancelMove = null;

      let ext = this.o.labels ? 108 : 104;
      if (this.o.phaseScale) ext = 122;
      if (this.o.wlScale) ext = 131;
      if (this.o.plane) ext = Math.max(ext, 130);
      this.ext = ext;

      this.wrap = document.createElement('div');
      this.wrap.className = 'smith-wrap' + (this.o.interactive ? ' interactive' : '');
      const svg = this.svg = el('svg', {
        class: 'smith',
        viewBox: `${-ext} ${-ext} ${2 * ext} ${2 * ext}`,
        preserveAspectRatio: 'xMidYMid meet',
        role: 'img',
        'aria-label': 'Carta de Smith',
      });
      this.wrap.appendChild(svg);
      host.appendChild(this.wrap);

      // Definiciones: degradado de fondo único por instancia
      const defs = el('defs', null, svg);
      const grad = el('radialGradient', { id: this.id + '-bg', cx: '50%', cy: '50%', r: '50%' }, defs);
      el('stop', { offset: '0%', 'stop-color': '#0d2446', 'stop-opacity': '0.85' }, grad);
      el('stop', { offset: '100%', 'stop-color': '#050d1c', 'stop-opacity': '0.9' }, grad);

      // Capas
      const L = this.L = {};
      const layer = (name) => (L[name] = el('g', { class: 'sc-group sc-' + name, 'data-group': name }, svg));
      layer('bg');
      layer('regions');
      layer('plane');
      layer('rcircles');
      layer('xarcs');
      layer('axis');
      layer('unit');
      layer('labels');
      layer('phase');
      layer('center');
      layer('overlay');
      layer('trace');
      layer('vswrL');
      layer('vectorL');
      layer('dots');
      layer('pointL');

      this._drawBackground();
      this._drawGrid();
      if (this.o.regions) this._drawRegions();
      if (this.o.plane) this._drawPlane();
      if (this.o.labels) this._drawLabels();
      if (this.o.phaseScale) this._drawPhaseScale();
      this._drawCenter();
      this._buildPoint();

      if (!this.o.regions) L.regions.style.display = 'none';
      if (!this.o.plane) L.plane.style.display = 'none';
      if (this.o.hidden) this.hideAll();
      if (this.o.interactive) this._bindInteraction();
      this.setGamma(this.gamma, { silent: true });
    }

    /* ---------------- Construcción de la rejilla ---------------- */

    _drawBackground() {
      const bg = el('circle', { cx: 0, cy: 0, r: S }, this.L.bg);
      bg.style.fill = `url(#${this.id}-bg)`;
    }

    /** Trayectoria de un círculo de resistencia constante (como path para poder "dibujarlo"). */
    static resistancePath(r) {
      const c = RF.resistanceCircle(r);
      const cx = c.cx * S, rad = c.radius * S;
      // Empieza en Γ = 1 (extremo derecho) y da la vuelta completa
      return `M ${cx + rad} 0 A ${rad} ${rad} 0 1 0 ${cx - rad} 0 A ${rad} ${rad} 0 1 0 ${cx + rad} 0`;
    }

    /**
     * Arco de reactancia constante x, limitado al interior del círculo unitario:
     * desde Γ = 1 (r → ∞) hasta el borde, en Γ(jx) = (jx − 1)/(jx + 1) (r = 0).
     * Centro (1, 1/x), radio |1/x|. Es siempre el arco menor (large-arc = 0).
     * Dirección: para x > 0 el recorrido en pantalla es en sentido horario (sweep = 1).
     */
    static reactancePath(x) {
      const c = RF.reactanceCircle(x);
      const rad = c.radius * S;
      const end = toXY(RF.zToGamma({ re: 0, im: x }));
      const sweep = x > 0 ? 1 : 0;
      return `M ${S} 0 A ${rad} ${rad} 0 0 ${sweep} ${end.x.toFixed(4)} ${end.y.toFixed(4)}`;
    }

    _drawGrid() {
      const g = GRID[this.o.density] || GRID.normal;
      const add = (layer, d, cls) => el('path', { d, class: cls, pathLength: 1 }, layer);
      g.rMinor.forEach(r => add(this.L.rcircles, SmithChart.resistancePath(r), 'sc-r minor'));
      g.rMajor.forEach(r => add(this.L.rcircles, SmithChart.resistancePath(r), 'sc-r major'));
      [...g.xMinor].forEach(x => {
        add(this.L.xarcs, SmithChart.reactancePath(x), 'sc-x minor');
        add(this.L.xarcs, SmithChart.reactancePath(-x), 'sc-x minor');
      });
      g.xMajor.forEach(x => {
        add(this.L.xarcs, SmithChart.reactancePath(x), 'sc-x major');
        add(this.L.xarcs, SmithChart.reactancePath(-x), 'sc-x major');
      });
      // Eje real (x = 0): de Γ = −1 (cortocircuito) a Γ = +1 (circuito abierto)
      el('path', { d: `M ${-S} 0 L ${S} 0`, class: 'sc-axis', pathLength: 1 }, this.L.axis);
      // Círculo unitario |Γ| = 1  (r = 0)
      el('path', { d: SmithChart.resistancePath(0), class: 'sc-unit', pathLength: 1 }, this.L.unit);
    }

    _drawRegions() {
      const up = el('path', { d: `M ${-S} 0 A ${S} ${S} 0 0 1 ${S} 0 Z`, class: 'sc-region-up' }, this.L.regions);
      const dn = el('path', { d: `M ${-S} 0 A ${S} ${S} 0 0 0 ${S} 0 Z`, class: 'sc-region-down' }, this.L.regions);
      const t1 = el('text', { x: -40, y: -62, 'text-anchor': 'middle', class: 'sc-region-label', fill: '#c4b5fd', opacity: 0.8 }, this.L.regions);
      t1.textContent = 'INDUCTIVA  (x > 0)';
      const t2 = el('text', { x: -40, y: 66, 'text-anchor': 'middle', class: 'sc-region-label', fill: '#5eead4', opacity: 0.8 }, this.L.regions);
      t2.textContent = 'CAPACITIVA  (x < 0)';
      this.regionEls = { up, dn };
    }

    _drawPlane() {
      const P = this.L.plane;
      el('line', { x1: -125, y1: 0, x2: 125, y2: 0 }, P);
      el('line', { x1: 0, y1: -125, x2: 0, y2: 125 }, P);
      const t1 = el('text', { x: 112, y: -4 }, P); t1.textContent = 'Re{Γ}';
      const t2 = el('text', { x: 3, y: -118 }, P); t2.textContent = 'Im{Γ}';
      [-1, -0.5, 0.5, 1].forEach(v => {
        const a = el('text', { x: v * S, y: 8, 'text-anchor': 'middle', style: 'font-size:4.5px;font-style:normal' }, P);
        a.textContent = String(v).replace('-', '−');
        const b = el('text', { x: -3, y: -v * S + 1.5, 'text-anchor': 'end', style: 'font-size:4.5px;font-style:normal' }, P);
        b.textContent = (v > 0 ? '+' : '−') + 'j' + Math.abs(v);
      });
    }

    _drawLabels() {
      const Lb = this.L.labels;
      const rVals = [0.2, 0.5, 1, 2, 5];
      const t0 = el('text', { x: -S + 1.5, y: -1.6, class: 'sc-label' }, Lb); t0.textContent = '0';
      rVals.forEach(r => {
        const p = toXY(RF.zToGamma({ re: r, im: 0 }));
        const t = el('text', { x: p.x - 1, y: -1.6, class: 'sc-label', 'text-anchor': 'end' }, Lb);
        t.textContent = String(r);
      });
      const tinf = el('text', { x: S - 1.5, y: -1.6, class: 'sc-label', 'text-anchor': 'end' }, Lb); tinf.textContent = '∞';
      [0.2, 0.5, 1, 2, 5].forEach(x => {
        [x, -x].forEach(xx => {
          const g = RF.zToGamma({ re: 0, im: xx });
          const k = 0.925;
          const p = toXY({ re: g.re * k, im: g.im * k });
          const t = el('text', {
            x: p.x, y: p.y + 1.3, class: 'sc-label ' + (xx > 0 ? 'x-pos' : 'x-neg'), 'text-anchor': 'middle',
          }, Lb);
          t.textContent = (xx > 0 ? '+j' : '−j') + x;
        });
      });
    }

    _drawPhaseScale() {
      const P = this.L.phase;
      const r0 = 101.5, r1 = 106;
      el('circle', { cx: 0, cy: 0, r: r1, class: 'sc-phase-ring' }, P);
      for (let a = 0; a < 360; a += 5) {
        const rad = a * Math.PI / 180;
        const major = a % 30 === 0;
        const rr = major ? r1 : (a % 10 === 0 ? r0 + 2.6 : r0 + 3.3);
        el('line', {
          x1: r0 * Math.cos(rad), y1: -r0 * Math.sin(rad), x2: rr * Math.cos(rad), y2: -rr * Math.sin(rad),
          class: 'sc-tick' + (major ? ' major' : ''),
        }, P);
        if (major) {
          const lr = 110;
          const deg = a > 180 ? a - 360 : a;
          const t = el('text', { x: lr * Math.cos(rad), y: -lr * Math.sin(rad) + 1.2, class: 'sc-phase-label', 'text-anchor': 'middle' }, P);
          t.textContent = (deg < 0 ? '−' : '') + Math.abs(deg) + '°';
        }
      }
      if (this.o.wlScale) {
        const w0 = 114, w1 = 118.5;
        el('circle', { cx: 0, cy: 0, r: w1, class: 'sc-phase-ring' }, P);
        // Longitudes de onda hacia el generador: 0 en Γ = −1 (θ = 180°), crece en sentido horario.
        // θ = 180° − 720°·(d/λ)
        for (let k = 0; k < 50; k++) {
          const wl = k / 100;
          const th = (180 - 720 * wl) * Math.PI / 180;
          const major = k % 5 === 0;
          const rr = major ? w1 : w0 + 2.4;
          el('line', { x1: w0 * Math.cos(th), y1: -w0 * Math.sin(th), x2: rr * Math.cos(th), y2: -rr * Math.sin(th), class: 'sc-tick' + (major ? ' major' : '') }, P);
          if (major) {
            const lr = 122.5;
            const t = el('text', { x: lr * Math.cos(th), y: -lr * Math.sin(th) + 1.1, class: 'sc-wl-label', 'text-anchor': 'middle' }, P);
            t.textContent = wl.toFixed(2) + 'λ';
          }
        }
        const tt = el('text', { x: 0, y: -127.5, class: 'sc-scale-title', 'text-anchor': 'middle' }, P);
        tt.textContent = 'LONGITUDES DE ONDA HACIA EL GENERADOR  ⟳';
      }
    }

    _drawCenter() {
      el('circle', { cx: 0, cy: 0, r: 1.5, class: 'sc-center' }, this.L.center);
    }

    _buildPoint() {
      const L = this.L;
      this.vswrCircle = el('circle', { cx: 0, cy: 0, r: 0, class: 'sc-vswr' }, L.vswrL);
      this.vectorLine = el('line', { x1: 0, y1: 0, x2: 0, y2: 0, class: 'sc-vector' }, L.vectorL);
      this.pointG = el('g', null, L.pointL);
      this.halo = el('circle', { r: 5.5, class: 'sc-point-halo pulse' }, this.pointG);
      this.dot = el('circle', { r: 2.8, class: 'sc-point' }, this.pointG);
      this.coordText = el('text', { class: 'sc-coord', x: 0, y: 0 }, L.pointL);
      this.setParts({ point: this.o.point, vector: this.o.vector && this.o.point, vswr: this.o.vswr, coords: this.o.coords });
    }

    /** Muestra u oculta las partes del punto. */
    setParts(p) {
      if ('point' in p) { this.L.pointL.style.display = p.point ? '' : 'none'; this.o.point = p.point; }
      if ('vector' in p) { this.L.vectorL.style.display = p.vector ? '' : 'none'; this.o.vector = p.vector; }
      if ('vswr' in p) { this.L.vswrL.style.display = p.vswr ? '' : 'none'; this.o.vswr = p.vswr; }
      if ('coords' in p) { this.coordText.style.display = p.coords ? '' : 'none'; this.o.coords = p.coords; }
    }

    /* ---------------- Punto principal ---------------- */

    /** Ubica el punto en Γ. Para cargas activas (|Γ| > 1) lo dibuja limitado al margen. */
    setGamma(g, { silent = false } = {}) {
      if (!g || !Number.isFinite(g.re) || !Number.isFinite(g.im)) g = { re: 1, im: 0 };
      this.gamma = { re: g.re, im: g.im };
      const mag = Cx.abs(g);
      const shown = mag > 1.12 ? Cx.scale(g, 1.12 / mag) : g;
      const p = toXY(shown);
      const color = RF.colorForMag(mag);
      this.pointG.setAttribute('transform', `translate(${p.x.toFixed(3)} ${p.y.toFixed(3)})`);
      this.dot.setAttribute('fill', color);
      this.halo.setAttribute('stroke', color);
      this.vectorLine.setAttribute('x2', p.x.toFixed(3));
      this.vectorLine.setAttribute('y2', p.y.toFixed(3));
      this.vectorLine.style.stroke = color;
      this.vswrCircle.setAttribute('r', (Math.min(mag, 1.12) * S).toFixed(3));
      if (this.o.coords) {
        const z = RF.gammaToZ(g);
        this.coordText.textContent = Cx.isFinite(z) ? `z = ${RF.fmtC(z, 2)}` : 'z → ∞';
        const right = p.x < 40;
        this.coordText.setAttribute('x', (p.x + (right ? 6 : -6)).toFixed(2));
        this.coordText.setAttribute('y', (p.y - 5).toFixed(2));
        this.coordText.setAttribute('text-anchor', right ? 'start' : 'end');
      }
      if (!silent && this.o.onChange) this.o.onChange(this.gamma);
    }

    setZ(z, opts) { this.setGamma(RF.zToGamma(z), opts); }

    /**
     * Desplaza el punto animadamente hasta Γ destino.
     * mode 'line' (recta en el plano Γ) o 'z' (interpolación en z, sigue la geometría de la carta).
     */
    animateTo(target, ms = 900, mode = 'line') {
      if (this._cancelMove) this._cancelMove();
      const from = { ...this.gamma };
      const zFrom = RF.gammaToZ(from), zTo = RF.gammaToZ(target);
      const useZ = mode === 'z' && Cx.isFinite(zFrom) && Cx.isFinite(zTo);
      return new Promise(res => {
        this._cancelMove = Anim.tween(ms, t => {
          const g = useZ ? RF.zToGamma(Cx.lerp(zFrom, zTo, t)) : Cx.lerp(from, target, t);
          this.setGamma(g);
        }, () => { this._cancelMove = null; this.setGamma(target); res(); });
      });
    }

    /* ---------------- Resaltados y trazos ---------------- */

    /** Dibuja progresivamente un elemento con pathLength = 1. */
    static drawIn(path, ms = 900, delay = 0) {
      path.setAttribute('pathLength', 1);
      path.classList.add('sc-draw');
      if (!Anim.enabled || ms <= 0) { path.style.transition = 'none'; path.style.strokeDashoffset = 0; return; }
      path.style.transition = 'none';
      path.style.strokeDashoffset = 1;
      path.getBoundingClientRect();
      path.style.transition = `stroke-dashoffset ${ms}ms cubic-bezier(.5,.1,.3,1) ${delay}ms`;
      requestAnimationFrame(() => { path.style.strokeDashoffset = 0; });
    }

    _hl(key, d, cls, animate) {
      this.clearHighlight(key);
      const p = el('path', { d, class: cls }, this.L.overlay);
      this.highlights[key] = p;
      if (animate !== false) SmithChart.drawIn(p, 900);
      return p;
    }
    highlightR(r, key = 'r', animate) { return this._hl(key, SmithChart.resistancePath(r), 'sc-hl-r', animate); }
    highlightX(x, key = 'x', animate) {
      if (Math.abs(x) < 1e-9) return this._hl(key, `M ${S} 0 L ${-S} 0`, 'sc-hl-x', animate);
      return this._hl(key, SmithChart.reactancePath(x), 'sc-hl-x', animate);
    }
    highlightG(g, key = 'g', animate) {
      const c = RF.conductanceCircle(g);
      const cx = c.cx * S, rad = c.radius * S;
      return this._hl(key, `M ${cx - rad} 0 A ${rad} ${rad} 0 1 0 ${cx + rad} 0 A ${rad} ${rad} 0 1 0 ${cx - rad} 0`, 'sc-hl-g', animate);
    }
    clearHighlight(key) {
      if (key === undefined) { Object.keys(this.highlights).forEach(k => this.clearHighlight(k)); return; }
      const p = this.highlights[key];
      if (p) { p.remove(); delete this.highlights[key]; }
    }

    /** Atributo d de una trayectoria definida por una lista de Γ. */
    static pathD(gammas) {
      return Anim.poly(gammas.filter(g => Number.isFinite(g.re) && Number.isFinite(g.im)).map(g => { const p = toXY(g); return [p.x, p.y]; }));
    }
    /** Dibuja una trayectoria en la capa de trazos. */
    drawTrace(gammas, cls = 'sc-trace', animateMs = 0) {
      const p = el('path', { d: SmithChart.pathD(gammas), class: cls }, this.L.trace);
      if (animateMs) SmithChart.drawIn(p, animateMs);
      return p;
    }
    clearTraces() { this.L.trace.innerHTML = ''; }

    /** Punto secundario (marcador) con etiqueta opcional. */
    addDot(g, color = '#fff', label = '', r = 2.2) {
      const grp = el('g', null, this.L.dots);
      const c = el('circle', { r, class: 'sc-dot', fill: color }, grp);
      const t = el('text', { class: 'sc-dot-label', x: 4, y: -3.5 }, grp);
      t.textContent = label;
      const api = {
        el: grp,
        set(gg, lbl) {
          const p = toXY(gg);
          grp.setAttribute('transform', `translate(${p.x.toFixed(3)} ${p.y.toFixed(3)})`);
          if (lbl !== undefined) t.textContent = lbl;
        },
        color(cc) { c.setAttribute('fill', cc); },
        remove() { grp.remove(); },
        show(v) { grp.style.display = v ? '' : 'none'; },
      };
      api.set(g);
      return api;
    }
    clearDots() { this.L.dots.innerHTML = ''; }

    /* ---------------- Construcción progresiva ---------------- */

    hideAll() {
      ['rcircles', 'xarcs', 'axis', 'unit', 'labels', 'phase', 'center', 'regions', 'plane'].forEach(n => {
        this.L[n].classList.add('sc-hidden');
      });
    }
    showAll() {
      Object.values(this.L).forEach(g => {
        g.classList.remove('sc-hidden');
        g.querySelectorAll('.sc-draw').forEach(p => { p.style.transition = 'none'; p.style.strokeDashoffset = 0; });
      });
    }

    /** Hace visible un grupo y dibuja sus trazos de forma escalonada. */
    reveal(name, ms = 1200, stagger = 40) {
      const g = this.L[name];
      if (!g) return;
      if (name === 'regions' || name === 'plane') g.style.display = '';
      g.classList.remove('sc-hidden');
      const paths = g.querySelectorAll('path[pathLength], line[pathLength]');
      paths.forEach((p, i) => SmithChart.drawIn(p, ms, i * stagger));
    }

    /**
     * Construye la carta paso a paso.
     * @param {string[]} order nombres de grupos
     * @param {number} step milisegundos entre grupos
     */
    build(order = ['unit', 'axis', 'rcircles', 'xarcs', 'labels', 'phase', 'center'], step = 650) {
      this.hideAll();
      const timers = [];
      order.forEach((name, i) => {
        if (!Anim.enabled) { this.reveal(name, 0); return; }
        timers.push(setTimeout(() => this.reveal(name, 1100, name === 'xarcs' || name === 'rcircles' ? 35 : 0), i * step));
      });
      return () => timers.forEach(clearTimeout);
    }

    /* ---------------- Interacción ---------------- */

    /** Coordenadas de pantalla → Γ (compatible con el escalado CSS del escenario). */
    clientToGamma(cx, cy) {
      const rect = this.svg.getBoundingClientRect();
      const vb = 2 * this.ext;
      const sc = Math.min(rect.width, rect.height) / vb;
      const ox = rect.left + (rect.width - vb * sc) / 2;
      const oy = rect.top + (rect.height - vb * sc) / 2;
      const x = (cx - ox) / sc - this.ext;
      const y = (cy - oy) / sc - this.ext;
      return { re: x / S, im: -y / S };
    }

    _clamp(g) {
      if (!this.o.clampUnit) return g;
      const m = Cx.abs(g);
      return m > 1 ? Cx.scale(g, 1 / m) : g;
    }

    _bindInteraction() {
      const svg = this.svg;
      svg.setAttribute('tabindex', '0');
      let dragging = false;
      const move = (e) => {
        if (this._cancelMove) { this._cancelMove(); this._cancelMove = null; }
        this.setGamma(this._clamp(this.clientToGamma(e.clientX, e.clientY)));
      };
      svg.addEventListener('pointerdown', (e) => {
        dragging = true;
        svg.setPointerCapture(e.pointerId);
        svg.focus({ preventScroll: true });
        move(e);
        e.preventDefault();
      });
      svg.addEventListener('pointermove', (e) => { if (dragging) move(e); });
      const end = (e) => { dragging = false; try { svg.releasePointerCapture(e.pointerId); } catch (_) {} };
      svg.addEventListener('pointerup', end);
      svg.addEventListener('pointercancel', end);
      // Teclado: flechas mueven el punto (Shift = paso grande), Inicio = centro
      svg.addEventListener('keydown', (e) => {
        const step = e.shiftKey ? 0.05 : 0.01;
        const g = { ...this.gamma };
        let handled = true;
        switch (e.key) {
          case 'ArrowLeft': g.re -= step; break;
          case 'ArrowRight': g.re += step; break;
          case 'ArrowUp': g.im += step; break;
          case 'ArrowDown': g.im -= step; break;
          case 'Home': g.re = 0; g.im = 0; break;
          default: handled = false;
        }
        if (handled) {
          e.preventDefault();
          e.stopPropagation();
          this.setGamma(this._clamp(g));
        }
      });
    }
  }

  SmithChart.S = S;
  SmithChart.toXY = toXY;
  SmithChart.el = el;
  global.SmithChart = SmithChart;
})(window);
