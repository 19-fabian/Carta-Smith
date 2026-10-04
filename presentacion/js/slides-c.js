/* =====================================================================
   slides-c.js — Diapositivas 17 a 23
   Antenas · Microstrip y HFSS · S11 · Simulador · Cierre
   ===================================================================== */
(function () {
  'use strict';
  const { frac, head, ro, field, q, qa, k, icon } = SL;
  const E = SmithChart.el;
  const fmt = RF.fmt, fmtC = RF.fmtC;

  /* ===================================================================
     Modelos de datos ilustrativos (definidos matemáticamente)
     =================================================================== */

  /** Antena modelada como RLC serie alrededor de su resonancia. */
  function rlcModel(R, f0, Q) {
    const w0 = 2 * Math.PI * f0;
    const L = Q * R / w0;
    const C = 1 / (w0 * w0 * L);
    return { R, f0, Q, L, C, Z: f => RF.seriesRLC(R, L, C, f) };
  }
  const ANT = rlcModel(70, 2.45e9, 7);      // diapositiva 17
  const S11M = rlcModel(40, 2.45e9, 5);     // diapositiva 19

  function sweep(model, f1, f2, n, Z0 = 50) {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const f = f1 + (f2 - f1) * i / n;
      const Z = model.Z(f);
      const g = RF.reflectionCoefficient(Z, Z0);
      out.push({ f, Z, g, mag: Cx.abs(g) });
    }
    return out;
  }

  /* ===================================================================
     17. ANTENAS Y RF
     =================================================================== */
  SLIDES.push({
    section: 'Aplicaciones',
    title: 'Aplicación en antenas y RF',
    trans: 'rise',
    html: `
      ${head('06 · Aplicaciones', 'Aplicación en antenas y radiofrecuencia')}
      <div class="content" style="grid-template-columns: 380px 1fr 470px; gap: 22px">
        <div class="col" style="gap:9px">
          ${[
            ['antenna', 'Diseño de antenas', 'Impedancia de entrada vs. frecuencia.'],
            ['wave', 'Comunicaciones inalámbricas', 'Enlaces, Wi-Fi, celular, satélite.'],
            ['chip', 'Circuitos de RF', 'Interconexiones y transiciones en PCB.'],
            ['amp', 'Amplificadores', 'Redes de entrada/salida, estabilidad.'],
            ['filter', 'Filtros', 'Respuesta de impedancia en la banda.'],
            ['network', 'Redes de adaptación', 'Elementos L, C, stubs y λ/4.'],
            ['measure', 'Sistemas de medición', 'Analizador vectorial de redes (VNA).'],
          ].map(([ic, t, d], i) => `
            <div class="card row rv left" style="--i:${i + 1}; flex-wrap:nowrap; padding:8px 12px; gap:12px">
              <div class="icon-badge" style="width:40px;height:40px">${icon(ic)}</div>
              <div><h3 style="font-size:17px;margin:0">${t}</h3><p style="font-size:14px;margin:0">${d}</p></div>
            </div>`).join('')}
        </div>
        <div class="col">
          <div class="panel glow rv zoom" style="padding:6px; flex:1">
            <svg class="diagram ant" viewBox="0 0 560 520" width="100%" height="100%" style="display:block"></svg>
          </div>
        </div>
        <div class="col">
          <div class="center rv right"><div class="chart-host" style="width:400px;height:400px"></div></div>
          <div class="panel rv right" style="padding:8px 14px">
            ${field('<i>f</i> (GHz)', 'f17', 2.0, 2.9, 0.005, 2.45)}
            <div class="readouts">${ro('Z antena', 'Z', 'violet')}${ro('|Γ| · VSWR', 'mv', 'orange')}</div>
          </div>
          <p class="tiny muted rv right" style="margin:0"><span class="tag orange">datos ilustrativos</span> Modelo RLC serie: R = 70 Ω, f₀ = 2,45 GHz, Q = 7, Z₀ = 50 Ω. No es una medición.</p>
        </div>
      </div>`,
    notes: `
      <p><strong>Aplicaciones:</strong> la Carta de Smith es la forma estándar de visualizar impedancias y coeficientes de reflexión en antenas, comunicaciones inalámbricas, circuitos de RF, amplificadores (redes de entrada y salida), filtros, redes de adaptación y equipos de medición como el analizador vectorial de redes (VNA), que muestra directamente sus resultados sobre una carta.</p>
      <p><strong>Antenas:</strong> una antena conectada a una línea de 50 Ω presenta una impedancia de entrada que <em>cambia con la frecuencia</em>. Cerca de su resonancia la parte reactiva se anula; por debajo suele ser capacitiva y por encima inductiva.</p>
      <p><strong>Demostración:</strong> mover el deslizador de frecuencia. El punto recorre la trayectoria dibujada en la carta: abajo (capacitiva) a frecuencias bajas, cruza el eje real en la resonancia (2,45 GHz) y sube (inductiva) a frecuencias mayores. En resonancia Z = 70 Ω, |Γ| ≈ 0,17 y VSWR ≈ 1,4.</p>
      <p><strong>Honestidad académica:</strong> estos datos provienen de un modelo RLC serie simplificado, definido en el código, no de una antena medida. Un dipolo real tiene una resistencia de radiación cercana a 73 Ω en λ/2, pero su comportamiento completo requiere simulación o medición.</p>`,
    init(el) {
      this.el = el;
      this.data = sweep(ANT, 2.0e9, 2.9e9, 180);
      this.ch = new SmithChart(q(el, '.chart-host'), { labels: true, density: 'light', point: true, vswr: true });
      this.ch.drawTrace(this.data.map(d => d.g), 'sc-trace');
      this.ch.addDot(this.data[0].g, '#9fb2cc', '2.0 GHz', 1.6);
      this.ch.addDot(this.data[this.data.length - 1].g, '#9fb2cc', '2.9 GHz', 1.6);
      // Ilustración: VNA → coaxial 50 Ω → dipolo con ondas radiadas
      const s = q(el, 'svg.ant');
      const vna = E('g', null, s);
      E('rect', { x: 30, y: 380, width: 200, height: 120, rx: 10, fill: '#0a1830', stroke: '#22e4ff', 'stroke-width': 2 }, vna);
      E('rect', { x: 44, y: 394, width: 120, height: 82, rx: 4, fill: '#03101f', stroke: 'rgba(34,228,255,.4)' }, vna);
      E('circle', { cx: 104, cy: 435, r: 34, fill: 'none', stroke: '#22e4ff', 'stroke-width': 1.2 }, vna);
      E('circle', { cx: 121, cy: 435, r: 17, fill: 'none', stroke: 'rgba(34,228,255,.6)' }, vna);
      E('line', { x1: 70, y1: 435, x2: 138, y2: 435, stroke: 'rgba(34,228,255,.6)' }, vna);
      this.vnaDot = E('circle', { r: 3.5, fill: '#fbbf24' }, vna);
      [0, 1, 2].forEach(i => E('circle', { cx: 196, cy: 405 + i * 26, r: 8, fill: '#13284a', stroke: '#9fb2cc' }, vna));
      const tv = E('text', { x: 130, y: 494, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:12px' }, vna); tv.textContent = 'ANALIZADOR VECTORIAL (VNA)';
      // Cable coaxial
      E('path', { d: 'M 230 440 C 330 440, 330 300, 330 230', fill: 'none', stroke: '#2a3446', 'stroke-width': 14, 'stroke-linecap': 'round' }, s);
      E('path', { d: 'M 230 440 C 330 440, 330 300, 330 230', fill: 'none', stroke: '#e8b04a', 'stroke-width': 3 }, s);
      this.pulse = E('circle', { r: 6, fill: '#22e4ff', style: 'filter: drop-shadow(0 0 6px #22e4ff)' }, s);
      this.coaxPath = 'M 230 440 C 330 440, 330 300, 330 230';
      const tc = E('text', { x: 350, y: 370, class: 'lbl', style: 'font-size:13px' }, s); tc.textContent = 'COAXIAL · Z₀ = 50 Ω';
      // Dipolo
      E('line', { x1: 330, y1: 230, x2: 330, y2: 214, stroke: '#9fb2cc', 'stroke-width': 4 }, s);
      E('line', { x1: 200, y1: 210, x2: 324, y2: 210, stroke: '#e8b04a', 'stroke-width': 7, 'stroke-linecap': 'round' }, s);
      E('line', { x1: 336, y1: 210, x2: 460, y2: 210, stroke: '#e8b04a', 'stroke-width': 7, 'stroke-linecap': 'round' }, s);
      const td = E('text', { x: 330, y: 250, 'text-anchor': 'middle', class: 'lbl lbl-w', style: 'font-size:13px' }, s); td.textContent = 'DIPOLO λ/2 · Z_ant(f)';
      this.waves = [0, 1, 2, 3].map(() => E('ellipse', { cx: 330, cy: 210, fill: 'none', stroke: '#22e4ff', 'stroke-width': 2 }, s));
      const tr = E('text', { x: 20, y: 30, class: 'lbl', style: 'fill:#22e4ff;font-size:13px' }, s); tr.textContent = 'RADIACIÓN';
      this.ff = SL.bindField(el, 'f17', () => this.update());
      this.update();
    },
    update() {
      const f = this.ff.get() * 1e9;
      const Z = ANT.Z(f), a = RF.analyzeLoad(Z, 50);
      this.ch.setGamma(a.gamma);
      SL.set(this.el, 'Z', fmtC(Z, 1) + '<span class="u">Ω</span>');
      SL.set(this.el, 'mv', fmt(a.mag, 3) + ' · ' + fmt(a.vswr, 2));
      // Punto en la pantalla del VNA (Γ a escala)
      this.vnaDot.setAttribute('cx', 104 + a.gamma.re * 34);
      this.vnaDot.setAttribute('cy', 435 - a.gamma.im * 34);
    },
    enter() {
      const path = E('path', { d: this.coaxPath });
      const len = 330;
      Anim.loop((t) => {
        this.waves.forEach((w, i) => {
          const p = ((t * 0.35 + i / 4) % 1);
          w.setAttribute('rx', 40 + p * 260);
          w.setAttribute('ry', 20 + p * 170);
          w.setAttribute('opacity', (0.7 * (1 - p)).toFixed(2));
        });
        // Pulso a lo largo del cable (Bézier evaluada analíticamente)
        const u = (t * 0.5) % 1;
        const P0 = [230, 440], P1 = [330, 440], P2 = [330, 300], P3 = [330, 230];
        const b = (i) => Math.pow(1 - u, 3) * P0[i] + 3 * Math.pow(1 - u, 2) * u * P1[i] + 3 * (1 - u) * u * u * P2[i] + u * u * u * P3[i];
        this.pulse.setAttribute('cx', b(0)); this.pulse.setAttribute('cy', b(1));
      });
    },
  });

  /* ===================================================================
     18. MICROSTRIP Y ANSYS HFSS
     =================================================================== */
  const F0 = 1.09e9; // misma frecuencia central del análisis CARTA.PY
  SLIDES.push({
    section: 'Aplicaciones',
    title: 'Microstrip y Ansys HFSS',
    trans: 'zoom',
    html: `
      ${head('06 · Aplicaciones', 'Aplicación en líneas microstrip y Ansys HFSS')}
      <div class="content" style="grid-template-columns: 1fr 560px; gap: 22px">
        <div class="col" style="gap:12px">
          <div class="panel glow rv zoom" style="padding:4px 8px">
            <svg class="diagram iso" viewBox="0 0 800 330" width="100%" style="display:block"></svg>
          </div>
          <div class="row rv" style="gap:14px; flex-wrap:nowrap; align-items:stretch">
            <div class="panel" style="flex:1; padding:8px 16px">
              ${field('<i>W</i> (mm)', 'w18', 0.3, 8, 0.05, 3.0)}
              ${field('<i>h</i> (mm)', 'h18', 0.2, 3.2, 0.05, 1.6)}
              ${field('ε<sub>r</sub>', 'e18', 1, 12, 0.05, 4.4)}
              ${field('<i>ℓ</i> (mm)', 'l18', 10, 200, 1, 100)}
            </div>
            <div class="readouts one" style="width:210px">
              ${ro('Z₀ microstrip', 'zc')}${ro('ε eff', 'ee', 'violet')}${ro('λg a 1.09 GHz', 'lg', 'turq')}
            </div>
          </div>
          <p class="tiny muted rv" style="margin:0">Z₀ y ε<sub>eff</sub>: aproximación cuasiestática de Hammerstad (la misma de <span class="mono">CARTA.PY</span>). Valores por defecto del proyecto: FR4, εr = 4,4, h = 1,6 mm, W = 3 mm, ℓ = 100 mm.</p>
        </div>
        <div class="col" style="gap:10px">
          <div class="panel rv right" style="padding:6px 8px">
            <div class="panel-label" style="margin:4px 8px">|S11| (dB) · puerto 2 terminado en 50 Ω</div>
            <svg class="plot s18" viewBox="0 0 540 220" width="100%" style="display:block"></svg>
          </div>
          <div class="row rv right" style="flex-wrap:nowrap; gap:12px; align-items:flex-start">
            <div class="chart-host" style="width:250px;height:250px; flex:none"></div>
            <div class="callout orange" style="font-size:14.5px; padding:10px 12px"><b>Modelo analítico de línea ideal</b> (sin pérdidas ni dispersión), referencia 50 Ω. <b>No es un resultado de HFSS.</b> En HFSS se simula la estructura 3D completa (FEM): puertos de onda, mallado adaptativo, pérdidas del FR4 (tan δ) y del cobre, y se exportan los parámetros S (archivo Touchstone) para verlos en la carta.</div>
          </div>
          <div class="readouts three rv right">${ro('S11 a 1.04 GHz', 'm1')}${ro('S11 a 1.09 GHz', 'm2', 'orange')}${ro('S11 a 1.14 GHz', 'm3')}</div>
        </div>
      </div>`,
    notes: `
      <p><strong>Conexión con nuestro trabajo:</strong> relacionamos la carta con una línea microstrip en FR4, con los mismos parámetros del análisis del proyecto (CARTA.PY): ε<sub>r</sub> = 4,4, h = 1,6 mm, W = 3 mm, ℓ = 100 mm y frecuencia central de 1,09 GHz.</p>
      <p><strong>Estructura:</strong> pista de cobre superior, sustrato dieléctrico FR4 y plano de tierra inferior. Los puertos de excitación (violeta) están en los extremos: el puerto 1 inyecta la señal y el puerto 2 se termina en 50 Ω.</p>
      <p><strong>Impedancia característica:</strong> depende del ancho W, la altura h y la permitividad ε<sub>r</sub> (y en menor medida del espesor del cobre y de la frecuencia). Con la fórmula de Hammerstad, W = 3 mm da Z₀ ≈ 50,8 Ω: prácticamente adaptada. <em>Demostración:</em> reducir W a ~1 mm: Z₀ sube a ~85 Ω, la línea deja de estar adaptada y en la carta aparece un círculo; S11 muestra mínimos periódicos cada vez que la línea mide un múltiplo de λ/2.</p>
      <p><strong>S11:</strong> es el coeficiente de reflexión en el puerto 1 referido a una impedancia de referencia (aquí 50 Ω). Por eso puede dibujarse directamente en la carta.</p>
      <p><strong>HFSS:</strong> Ansys HFSS resuelve las ecuaciones de Maxwell en 3D por elementos finitos; incluye pérdidas, conectores y discontinuidades. Lo que mostramos es un <em>modelo analítico ideal</em>, no una simulación de HFSS. Si se dispone del archivo Touchstone exportado de HFSS, CARTA.PY puede leerlo y graficar el resultado real.</p>`,
    init(el) {
      this.el = el;
      this.drawIso(q(el, 'svg.iso'));
      // Gráfica S11
      const ps = q(el, 'svg.s18');
      this.pf = SL.plotFrame(ps, {
        w: 540, h: 220, l: 50, b: 34, xmin: 0.1, xmax: 2.0, ymin: -60, ymax: 0,
        xticks: [0.1, 0.5, 1.0, 1.5, 2.0], yticks: [0, -10, -20, -30, -40, -50, -60],
        xlabel: 'Frecuencia (GHz)', xfmt: v => v.toFixed(1),
      });
      E('line', { x1: this.pf.l, x2: 540 - this.pf.r, y1: this.pf.Y(-10), y2: this.pf.Y(-10), class: 'thr' }, ps);
      E('rect', { x: this.pf.X(1.04), y: this.pf.t, width: this.pf.X(1.14) - this.pf.X(1.04), height: 220 - this.pf.t - this.pf.b, fill: 'rgba(167,139,250,.15)' }, ps);
      this.curve = E('path', { class: 'curve' }, ps);
      this.ch = new SmithChart(q(el, '.chart-host'), { labels: false, density: 'light', point: true, vector: false });
      this.marks = [['#22e4ff', '1.04'], ['#fb923c', '1.09'], ['#22e4ff', '1.14']].map(([c, l]) => this.ch.addDot({ re: 0, im: 0 }, c, '', 1.8));
      const upd = () => this.update();
      this.fw = SL.bindField(el, 'w18', upd);
      this.fh = SL.bindField(el, 'h18', upd);
      this.fe = SL.bindField(el, 'e18', upd);
      this.fl = SL.bindField(el, 'l18', upd);
      this.update();
    },
    drawIso(s) {
      // Proyección isométrica: x a lo largo de la línea, y a lo ancho, z hacia arriba
      const L = 100, Wb = 40, sc = 4.4, hz = 16, ox = 220, oy = 52;
      const P = (x, y, z) => [ox + (x - y) * 0.866 * sc, oy + (x + y) * 0.5 * sc - z];
      const poly = (pts, attrs) => E('path', Object.assign({ d: Anim.poly(pts) + 'Z' }, attrs), s);
      // Plano de tierra (cara superior oculta, solo laterales)
      poly([P(0, Wb, -4), P(L, Wb, -4), P(L, Wb, 0), P(0, Wb, 0)], { fill: '#8a5520' });
      poly([P(L, 0, -4), P(L, Wb, -4), P(L, Wb, 0), P(L, 0, 0)], { fill: '#6e4419' });
      // Sustrato
      poly([P(0, 0, hz), P(L, 0, hz), P(L, Wb, hz), P(0, Wb, hz)], { fill: 'rgba(60,247,166,.22)', stroke: 'rgba(60,247,166,.6)' });
      poly([P(0, Wb, 0), P(L, Wb, 0), P(L, Wb, hz), P(0, Wb, hz)], { fill: 'rgba(60,247,166,.32)', stroke: 'rgba(60,247,166,.6)' });
      poly([P(L, 0, 0), P(L, Wb, 0), P(L, Wb, hz), P(L, 0, hz)], { fill: 'rgba(60,247,166,.18)', stroke: 'rgba(60,247,166,.6)' });
      // Pista
      const y1 = Wb / 2 - 1.6, y2 = Wb / 2 + 1.6;
      poly([P(0, y1, hz + 2), P(L, y1, hz + 2), P(L, y2, hz + 2), P(0, y2, hz + 2)], { fill: '#e8b04a', stroke: '#ffd27a', 'stroke-width': .8 });
      // Puertos
      poly([P(0, y1 - 7, -4), P(0, y2 + 7, -4), P(0, y2 + 7, hz + 16), P(0, y1 - 7, hz + 16)], { fill: 'rgba(167,139,250,.28)', stroke: '#a78bfa', 'stroke-width': 1.4 });
      poly([P(L, y1 - 7, -4), P(L, y2 + 7, -4), P(L, y2 + 7, hz + 16), P(L, y1 - 7, hz + 16)], { fill: 'rgba(167,139,250,.28)', stroke: '#a78bfa', 'stroke-width': 1.4 });
      const lbl = (pt, dx, dy, txt, col = '#9fb2cc') => {
        E('line', { x1: pt[0], y1: pt[1], x2: pt[0] + dx, y2: pt[1] + dy, stroke: col, 'stroke-width': 1, opacity: .7 }, s);
        const t = E('text', { x: pt[0] + dx + (dx >= 0 ? 4 : -4), y: pt[1] + dy + 4, 'text-anchor': dx >= 0 ? 'start' : 'end', class: 'lbl', style: `fill:${col};font-size:13px` }, s);
        t.textContent = txt;
      };
      lbl(P(55, y1, hz + 2), 30, -46, 'PISTA DE COBRE (W)', '#e8b04a');
      lbl(P(70, Wb, hz / 2), 40, 40, 'SUSTRATO FR4 (h, εr)', '#3cf7a6');
      lbl(P(30, Wb, -2), -40, 34, 'PLANO DE TIERRA', '#d08a3c');
      lbl(P(0, Wb / 2, hz + 16), -30, -24, 'PUERTO 1', '#c4b5fd');
      lbl(P(L, Wb / 2, hz + 16), 26, -22, 'PUERTO 2 (50 Ω)', '#c4b5fd');
      this.isoP = P; this.isoHz = hz; this.isoL = L; this.isoMid = Wb / 2;
      this.isoPulse = E('circle', { r: 5, fill: '#22e4ff', style: 'filter: drop-shadow(0 0 6px #22e4ff)' }, s);
    },
    update() {
      const el = this.el;
      const W = this.fw.get(), h = this.fh.get(), er = this.fe.get(), lmm = this.fl.get();
      if (!(W > 0 && h > 0 && er >= 1 && lmm > 0)) return;
      const { eeff, Z0: Zc } = RF.microstrip(W, h, er);
      const lg = RF.C0 / F0 / Math.sqrt(eeff) * 1000;
      SL.set(el, 'zc', fmt(Zc, 2) + '<span class="u">Ω</span>');
      SL.set(el, 'ee', fmt(eeff, 3));
      SL.set(el, 'lg', fmt(lg, 1) + '<span class="u">mm</span>');
      const s11 = (f) => {
        const theta = 2 * Math.PI * f * Math.sqrt(eeff) * (lmm / 1000) / RF.C0;
        const Zin = RF.lineInputImpedance({ re: 50, im: 0 }, Zc, theta);
        return RF.reflectionCoefficient(Zin, 50);
      };
      const pts = [], gs = [];
      for (let i = 0; i <= 400; i++) {
        const f = 0.1 + 1.9 * i / 400;
        const g = s11(f * 1e9);
        gs.push(g);
        pts.push([this.pf.X(f), this.pf.Y(Math.max(-60, RF.magToDb(Cx.abs(g))))]);
      }
      this.curve.setAttribute('d', Anim.poly(pts));
      this.ch.clearTraces();
      this.ch.drawTrace(gs, 'sc-trace');
      [1.04e9, 1.09e9, 1.14e9].forEach((f, i) => {
        const g = s11(f), db = RF.magToDb(Cx.abs(g));
        this.marks[i].set(g);
        SL.set(el, 'm' + (i + 1), (db < -99 ? '< −99' : fmt(db, 1)) + '<span class="u">dB</span>');
        if (i === 1) this.ch.setGamma(g);
      });
    },
    enter() {
      Anim.loop((t) => {
        const u = (t * 0.35) % 1;
        const p = this.isoP(u * this.isoL, this.isoMid, this.isoHz + 3);
        this.isoPulse.setAttribute('cx', p[0]); this.isoPulse.setAttribute('cy', p[1]);
      });
    },
  });

  /* ===================================================================
     19. INTERPRETACIÓN DE S11
     =================================================================== */
  SLIDES.push({
    section: 'Aplicaciones',
    title: 'Interpretación de S11',
    trans: 'slide',
    html: `
      ${head('06 · Aplicaciones', 'Interpretación de S11 en la Carta de Smith')}
      <div class="content" style="grid-template-columns: 1fr 520px; gap: 22px">
        <div class="col" style="gap:12px">
          <div class="row rv left" style="gap:14px; flex-wrap:nowrap">
            <div class="eq sm">S11 = Γ<sub>entrada</sub> <span class="op">·</span> S11(dB) = 20·log<sub>10</sub>(|S11|)</div>
            <span class="tag orange">datos ilustrativos</span>
          </div>
          <div class="panel glow rv" style="padding:6px 8px; position:relative">
            <svg class="plot s19" viewBox="0 0 900 300" width="100%" style="display:block; cursor:ew-resize; touch-action:none"></svg>
          </div>
          <div class="row rv" style="gap:14px; flex-wrap:nowrap; align-items:flex-start">
            <div class="panel" style="flex:1; padding:6px 10px">
              <table class="tbl s11tbl"><thead><tr><th>S11 (dB)</th><th>|S11|</th><th>P refl.</th><th>VSWR</th></tr></thead><tbody></tbody></table>
            </div>
            <div class="col" style="width:290px; gap:8px">
              <div class="row"><button class="btn primary sm" data-act="play">▶ Barrido</button><button class="btn sm" data-act="f0">Ir a f₀</button></div>
              <p class="tiny muted" style="margin:0">Modelo RLC serie: R = 40 Ω, f₀ = 2,45 GHz, Q = 5, Z₀ = 50 Ω. No es una medición experimental.</p>
              <p class="tiny muted" style="margin:0">Haz clic en una fila para dibujar su círculo de |S11| constante.</p>
            </div>
          </div>
        </div>
        <div class="col" style="gap:10px">
          <div class="center rv right"><div class="chart-host" style="width:440px;height:440px"></div></div>
          <div class="readouts rv right">
            ${ro('Frecuencia', 'f')}${ro('S11', 'db', 'orange')}
            ${ro('|S11|', 'm', 'orange')}${ro('Potencia reflejada', 'p', 'violet')}
            ${ro('z normalizada', 'z', 'turq')}${ro('Z (Ω)', 'Z', 'violet')}
          </div>
        </div>
      </div>`,
    notes: `
      <p><strong>Relación:</strong> S11 es el coeficiente de reflexión en el puerto de entrada cuando los demás puertos están terminados en la impedancia de referencia. Por tanto, S11 = Γ<sub>entrada</sub> y puede dibujarse en la carta. En dB: S11(dB) = 20·log₁₀|S11| (con 20 porque |S11| es un cociente de tensiones).</p>
      <p><strong>Tabla de referencia</strong> (calculada): −30 dB → |S11| ≈ 0,032, 0,1 % reflejado; −20 dB → 0,1 y 1 %; −10 dB → 0,316 y 10 % (criterio habitual de "ancho de banda de adaptación"); −3 dB → 0,708 y ≈ 50 %; 0 dB → reflexión total.</p>
      <p><strong>Demostración:</strong> pulsar "Barrido": el cursor recorre la frecuencia en la gráfica y el punto se mueve sincronizado en la carta. Ambas vistas muestran los mismos datos complejos: la gráfica muestra solo la magnitud; la carta muestra magnitud <em>y</em> fase, es decir, si la carga es inductiva o capacitiva. Arrastrar el cursor sobre la gráfica para elegir una frecuencia. Pulsar la fila de −10 dB: aparece el círculo |S11| = 0,316; las frecuencias cuyo punto queda dentro cumplen el criterio de −10 dB.</p>
      <p><strong>Aclaración:</strong> los datos se generan con un modelo RLC serie definido en el código (no son una medición). En la resonancia (2,45 GHz) Z = 40 Ω, Γ ≈ −0,111 y S11 ≈ −19,1 dB.</p>`,
    init(el) {
      this.el = el;
      this.data = sweep(S11M, 2.0e9, 3.0e9, 400);
      const svg = q(el, 'svg.s19');
      this.pf = SL.plotFrame(svg, {
        w: 900, h: 300, l: 56, b: 36, xmin: 2.0, xmax: 3.0, ymin: -30, ymax: 0,
        xticks: [2.0, 2.2, 2.4, 2.6, 2.8, 3.0], yticks: [0, -5, -10, -15, -20, -25, -30],
        xlabel: 'Frecuencia (GHz)', ylabel: '|S11| (dB)', xfmt: v => v.toFixed(1),
      });
      E('line', { x1: this.pf.l, x2: 900 - this.pf.r, y1: this.pf.Y(-10), y2: this.pf.Y(-10), class: 'thr' }, svg);
      const tt = E('text', { x: 900 - this.pf.r - 6, y: this.pf.Y(-10) - 6, 'text-anchor': 'end', style: 'fill:#fb923c' }, svg); tt.textContent = '−10 dB';
      const pts = this.data.map(d => [this.pf.X(d.f / 1e9), this.pf.Y(Math.max(-30, RF.magToDb(d.mag)))]);
      this.curvePath = E('path', { class: 'curve', d: Anim.poly(pts) }, svg);
      this.cursor = E('line', { class: 'cursor', y1: this.pf.t, y2: 300 - this.pf.b }, svg);
      this.cdot = E('circle', { r: 6, fill: '#fff', style: 'filter: drop-shadow(0 0 6px #22e4ff)' }, svg);
      this.ch = new SmithChart(q(el, '.chart-host'), { labels: true, point: true, vswr: false, coords: false });
      this.trace = this.ch.drawTrace(this.data.map(d => d.g), 'sc-trace');
      // Tabla de referencia, calculada
      const tb = q(el, '.s11tbl tbody');
      [-30, -20, -10, -3, 0].forEach(db => {
        const m = RF.dbToMag(db), s = RF.vswr(m);
        const tr = document.createElement('tr');
        tr.dataset.m = m;
        tr.innerHTML = `<td>${fmt(db, 0)}</td><td>${fmt(m, 3)}</td><td>${fmt(RF.reflectedPowerPct(m), db === -30 ? 2 : 1)} %</td><td>${s === Infinity ? '∞' : fmt(s, 2)}</td>`;
        tb.appendChild(tr);
      });
      qa(el, '.s11tbl tbody tr').forEach(tr => tr.addEventListener('click', () => {
        const sel = tr.classList.toggle('sel');
        qa(el, '.s11tbl tbody tr').forEach(o => { if (o !== tr) o.classList.remove('sel'); });
        this.ch.clearHighlight('c');
        if (sel) {
          const p = E('circle', { cx: 0, cy: 0, r: +tr.dataset.m * SmithChart.S, fill: 'rgba(251,146,60,.07)', stroke: '#fb923c', 'stroke-width': 1, 'stroke-dasharray': '2 1.5' }, this.ch.L.overlay);
          this.ch.highlights.c = p;
        }
      }));
      // Arrastre sobre la gráfica
      let drag = false;
      const pick = (e) => {
        const r = svg.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width * 900;
        const f = Math.max(2.0, Math.min(3.0, this.pf.invX(px)));
        this.setPlaying(false);
        this.setIndex(Math.round((f - 2.0) / 1.0 * 400));
      };
      svg.addEventListener('pointerdown', (e) => { drag = true; svg.setPointerCapture(e.pointerId); pick(e); });
      svg.addEventListener('pointermove', (e) => { if (drag) pick(e); });
      svg.addEventListener('pointerup', () => { drag = false; });
      this.playBtn = q(el, '[data-act="play"]');
      this.playBtn.addEventListener('click', () => this.setPlaying(!this.playing));
      q(el, '[data-act="f0"]').addEventListener('click', () => { this.setPlaying(false); this.setIndex(180); });
      this.pos = 180;
      this.setIndex(180);
    },
    setPlaying(p) {
      this.playing = p;
      this.playBtn.innerHTML = p ? '❚❚ Pausa' : '▶ Barrido';
      this.playBtn.classList.toggle('on', p);
    },
    setIndex(i) {
      i = Math.max(0, Math.min(this.data.length - 1, i));
      this.idx = i;
      const d = this.data[i], a = RF.analyzeGamma(d.g, 50);
      const x = this.pf.X(d.f / 1e9), y = this.pf.Y(Math.max(-30, RF.magToDb(d.mag)));
      this.cursor.setAttribute('x1', x); this.cursor.setAttribute('x2', x);
      this.cdot.setAttribute('cx', x); this.cdot.setAttribute('cy', y);
      this.ch.setGamma(d.g);
      const el = this.el;
      SL.set(el, 'f', fmt(d.f / 1e9, 3) + '<span class="u">GHz</span>');
      SL.set(el, 'db', fmt(a.s11db, 2) + '<span class="u">dB</span>');
      SL.set(el, 'm', fmt(a.mag, 3));
      SL.set(el, 'p', fmt(a.pRefl, 2) + '<span class="u">%</span>');
      SL.set(el, 'z', fmtC(a.z, 3));
      SL.set(el, 'Z', fmtC(a.Z, 1) + '<span class="u">Ω</span>');
    },
    enter() {
      Anim.loop((t, dt) => {
        if (!this.playing || dt === 0) return;
        this.pos = (this.idx + dt * 60);
        if (this.pos > this.data.length - 1) this.pos = 0;
        this.setIndex(Math.floor(this.pos));
      });
    },
    leave() { this.setPlaying(false); },
  });

  /* ===================================================================
     20. SIMULADOR DE ADAPTACIÓN
     =================================================================== */
  SLIDES.push({
    section: 'Laboratorio',
    title: 'Simulador de adaptación',
    trans: 'blur',
    html: `
      ${head('07 · Laboratorio', 'Simulador de adaptación: reactancia en serie')}
      <div class="content" style="grid-template-columns: 500px 1fr 420px; gap: 22px">
        <div class="col" style="gap:10px">
          <div class="panel glow rv left" style="padding:10px 16px">
            <div class="panel-label">Datos del sistema</div>
            <div class="sim-grid" style="grid-template-columns: 80px 1fr 80px 1fr">
              <label>Z₀ (Ω)</label><input class="num" type="number" data-in="z0" value="50" step="1">
              <label>R<sub>L</sub> (Ω)</label><input class="num" type="number" data-in="rl" value="50" step="1">
              <label>X<sub>L</sub> (Ω)</label><input class="num" type="number" data-in="xl" value="-40" step="1">
              <label>f (MHz)</label><input class="num" type="number" data-in="f" value="1090" step="1">
            </div>
          </div>
          <div class="panel rv left" style="padding:10px 16px">
            <div class="panel-label">Elemento reactivo en serie</div>
            ${field('<i>X</i><sub>s</sub> (Ω)', 'xs20', -300, 300, 0.5, 0)}
            <div class="status info" data-k="comp" style="font-size:16px; padding:6px 12px"></div>
            <div class="row" style="margin-top:10px">
              <button class="btn primary sm" data-act="cancel">Cancelar reactancia (X<sub>s</sub> = −X<sub>L</sub>)</button>
              <button class="btn sm" data-act="reset">↺ Reiniciar</button>
            </div>
          </div>
          <div class="callout orange rv left" style="font-size:15.5px">Un elemento en serie solo cambia <b>x</b>: el punto se mueve sobre su <b>círculo de r constante</b>. Si R<sub>L</sub> ≠ Z₀, nunca llega al centro: hace falta otro elemento (red L, λ/4…).</div>
        </div>
        <div class="center rv zoom"><div class="chart-host" style="width:500px;height:500px"></div></div>
        <div class="col" style="gap:10px">
          <table class="tbl rv right" style="font-size:15px">
            <thead><tr><th></th><th>Carga</th><th>Con X<sub>s</sub></th></tr></thead>
            <tbody>
              <tr><td>z</td><td data-k="z0">—</td><td data-k="z1">—</td></tr>
              <tr><td>Γ</td><td data-k="g0">—</td><td data-k="g1">—</td></tr>
              <tr><td>|Γ|</td><td data-k="m0">—</td><td data-k="m1">—</td></tr>
              <tr><td>VSWR</td><td data-k="s0">—</td><td data-k="s1">—</td></tr>
              <tr><td>P refl.</td><td data-k="p0">—</td><td data-k="p1">—</td></tr>
            </tbody>
          </table>
          <div class="status rv right" data-k="st" style="font-size:16px"></div>
          <div class="ro rv right"><div class="lbl">Mínimo |Γ| alcanzable solo con elemento serie</div><div class="val" data-k="gmin">—</div></div>
        </div>
      </div>`,
    notes: `
      <p><strong>Objetivo:</strong> experimentar con la red de adaptación más sencilla: un único elemento reactivo (inductor o capacitor) en serie con la carga.</p>
      <p><strong>Cálculo:</strong> Z<sub>in</sub> = R<sub>L</sub> + j(X<sub>L</sub> + X<sub>s</sub>). Si X<sub>s</sub> &gt; 0 es un inductor, L = X<sub>s</sub>/(2πf); si X<sub>s</sub> &lt; 0 es un capacitor, C = −1/(2πf·X<sub>s</sub>). La aplicación calcula el nuevo Γ, |Γ|, VSWR y potencia reflejada.</p>
      <p><strong>Demostración 1</strong> (valores iniciales: Z₀ = 50 Ω, Z<sub>L</sub> = 50 − j40 Ω, f = 1090 MHz): pulsar "Cancelar reactancia": se agrega X<sub>s</sub> = +40 Ω (un inductor de ≈ 5,8 nH), el punto sube por el círculo r = 1 hasta el centro y |Γ| = 0: aquí sí se consigue adaptación, porque R<sub>L</sub> = Z₀.</p>
      <p><strong>Demostración 2:</strong> cambiar R<sub>L</sub> a 100 Ω y volver a cancelar la reactancia. El punto llega al eje real en z = 2, pero no al centro: |Γ| = 1/3, VSWR = 2. La aplicación lo indica claramente: la reactancia serie <em>no puede</em> corregir la parte resistiva. El "mínimo |Γ| alcanzable" muestra el mejor resultado posible con este elemento: |R<sub>L</sub> − Z₀|/(R<sub>L</sub> + Z₀).</p>
      <p>La simulación nunca declara "adaptado" si los cálculos no lo demuestran (criterio: |Γ| &lt; 0,01).</p>`,
    init(el) {
      this.el = el;
      this.ch = new SmithChart(q(el, '.chart-host'), { labels: true, point: true, coords: true });
      this.orig = this.ch.addDot({ re: 0, im: 0 }, '#9fb2cc', '', 2.2);
      this.inp = {};
      qa(el, '[data-in]').forEach(i => { this.inp[i.dataset.in] = i; i.addEventListener('input', () => this.update()); });
      this.fxs = SL.bindField(el, 'xs20', () => this.update());
      q(el, '[data-act="cancel"]').addEventListener('click', () => {
        const xl = parseFloat(this.inp.xl.value);
        if (!Number.isFinite(xl)) return;
        const from = this.fxs.get(), to = -xl;
        Anim.tween(900, t => { this.fxs.set(from + (to - from) * t, true); this.update(); }, () => { this.fxs.set(to, true); this.update(); });
      });
      q(el, '[data-act="reset"]').addEventListener('click', () => {
        this.inp.z0.value = 50; this.inp.rl.value = 50; this.inp.xl.value = -40; this.inp.f.value = 1090;
        this.fxs.set(0);
      });
      this.update();
    },
    update() {
      const el = this.el, st = k(el, 'st');
      const Z0 = parseFloat(this.inp.z0.value), RL = parseFloat(this.inp.rl.value), XL = parseFloat(this.inp.xl.value), f = parseFloat(this.inp.f.value) * 1e6;
      const Xs = this.fxs.get();
      const bad = (msg) => { st.className = 'status bad'; st.innerHTML = msg; };
      if (![Z0, RL, XL, f].every(Number.isFinite)) return bad('Introduce valores numéricos en todos los campos.');
      if (Z0 <= 0) return bad('Z₀ debe ser positiva.');
      if (f <= 0) return bad('La frecuencia debe ser positiva.');
      const a0 = RF.analyzeLoad({ re: RL, im: XL }, Z0);
      const a1 = RF.analyzeLoad({ re: RL, im: XL + Xs }, Z0);
      const put = (sfx, a) => {
        SL.set(el, 'z' + sfx, fmtC(a.z, 2));
        SL.set(el, 'g' + sfx, fmtC(a.gamma, 3));
        SL.set(el, 'm' + sfx, fmt(a.mag, 3));
        SL.set(el, 's' + sfx, a.vswr === Infinity ? '∞' : fmt(a.vswr, 2));
        SL.set(el, 'p' + sfx, fmt(a.pRefl, 1) + ' %');
      };
      put('0', a0); put('1', a1);
      const c = RF.reactanceToComponent(Xs, f);
      SL.set(el, 'comp', c.type === 'none' ? 'Sin elemento (X<sub>s</sub> = 0)'
        : c.type === 'L' ? `Inductor en serie: <b>L = ${RF.fmtEng(c.value, 'H')}</b> a ${fmt(f / 1e6, 0)} MHz`
          : `Capacitor en serie: <b>C = ${RF.fmtEng(c.value, 'F')}</b> a ${fmt(f / 1e6, 0)} MHz`);
      const gmin = Math.abs(RL - Z0) / (RL + Z0);
      SL.set(el, 'gmin', RL > 0 ? fmt(gmin, 3) + `<span class="u">VSWR ${fmt(RF.vswr(gmin), 2)}</span>` : '—');
      // Carta
      this.orig.set(a0.gamma);
      this.ch.setGamma(a1.gamma);
      this.ch.clearTraces();
      if (RL >= 0) {
        this.ch.highlightR(a0.z.re, 'r', false);
        const pts = [];
        for (let i = 0; i <= 60; i++) pts.push(RF.zToGamma({ re: a0.z.re, im: a0.z.im + (a1.z.im - a0.z.im) * i / 60 }));
        this.ch.drawTrace(pts, 'sc-trace violet');
      } else this.ch.clearHighlight('r');
      // Diagnóstico honesto
      if (RL < 0) { st.className = 'status bad'; st.innerHTML = 'R<sub>L</sub> &lt; 0: caso activo (|Γ| &gt; 1). No corresponde a una carga pasiva convencional.'; return; }
      if (a1.mag < 0.01) { st.className = 'status ok'; st.innerHTML = `<b>Adaptación conseguida:</b> |Γ| = ${fmt(a1.mag, 4)} a ${fmt(f / 1e6, 0)} MHz (solo a esa frecuencia).`; return; }
      if (Math.abs(a1.z.im) < 0.01) {
        st.className = 'status mid';
        st.innerHTML = `<b>Reactancia cancelada</b>, pero R<sub>L</sub> = ${fmt(RL, 1)} Ω ≠ Z₀: |Γ| = ${fmt(a1.mag, 3)}. <b>No hay adaptación completa</b>; falta transformar la parte resistiva.`;
        return;
      }
      const better = a1.mag < a0.mag - 1e-6, worse = a1.mag > a0.mag + 1e-6;
      st.className = better ? 'status info' : worse ? 'status bad' : 'status info';
      st.innerHTML = `|Γ| pasa de ${fmt(a0.mag, 3)} a <b>${fmt(a1.mag, 3)}</b> (${better ? 'mejora' : worse ? 'empeora' : 'sin cambio'}). Aún no hay adaptación.`;
    },
  });

  /* ===================================================================
     21. VENTAJAS, LIMITACIONES Y ERRORES
     =================================================================== */
  const list = (items, ic, cls) => items.map((t, i) => `
    <li class="rv" style="--i:${i + 2}"><span class="li-ic ${cls}">${icon(ic)}</span><span>${t}</span></li>`).join('');
  SLIDES.push({
    section: 'Cierre',
    title: 'Ventajas, limitaciones y errores comunes',
    trans: 'rise',
    html: `
      ${head('08 · Cierre', 'Ventajas, limitaciones y errores comunes')}
      <div class="content" style="grid-template-columns: repeat(3, 1fr); gap: 22px">
        <div class="panel three-col good-col rv">
          <h3><span class="good">●</span> Ventajas</h3>
          <ul class="ilist">${list([
            'Representación gráfica de impedancias complejas.',
            'Análisis directo del coeficiente de reflexión (magnitud y fase).',
            'Evaluación inmediata de la adaptación (distancia al centro).',
            'Diseño de redes de adaptación por trayectorias.',
            'Interpretación de mediciones (VNA) y simulaciones (S11).',
          ], 'check', 'good')}</ul>
        </div>
        <div class="panel three-col warn-col rv">
          <h3><span class="warn">●</span> Limitaciones</h3>
          <ul class="ilist">${list([
            'Requiere una impedancia de referencia Z₀.',
            'Puede ser difícil de interpretar al principio.',
            'Pérdidas, dispersión y discontinuidades reales requieren análisis adicional.',
            'La precisión de una lectura manual es limitada.',
          ], 'warn', 'warn')}</ul>
        </div>
        <div class="panel three-col bad-col rv">
          <h3><span class="bad">●</span> Errores comunes</h3>
          <ul class="ilist">${list([
            'No normalizar la impedancia (z = Z/Z₀).',
            'Confundir resistencia con impedancia.',
            'Intercambiar los signos: inductiva (+, arriba) y capacitiva (−, abajo).',
            'Confundir |Γ| con el porcentaje de potencia reflejada (|Γ|²).',
            'Creer que el centro es siempre 50 Ω: el centro es Z₀.',
          ], 'x', 'bad')}</ul>
        </div>
      </div>`,
    notes: `
      <p><strong>Ventajas:</strong> la carta concentra en una sola imagen la impedancia, el coeficiente de reflexión, el VSWR y el efecto de las líneas y de los elementos de adaptación. Por eso los VNA y los simuladores la siguen usando.</p>
      <p><strong>Limitaciones:</strong> todo depende de la impedancia de referencia elegida; al principio cuesta interpretarla; en sistemas reales las pérdidas hacen que el punto se mueva en espiral hacia el centro en lugar de en círculos, y las discontinuidades (conectores, curvas, vías) requieren simulación electromagnética; y la lectura manual tiene una precisión limitada (hoy se combina con software).</p>
      <p><strong>Errores comunes</strong> (repasarlos con ejemplos ya vistos):</p>
      <ul>
        <li>No normalizar: ubicar "75" en lugar de 1.5.</li>
        <li>Confundir R con Z: la impedancia incluye la reactancia.</li>
        <li>Invertir signos: inductiva arriba, capacitiva abajo.</li>
        <li>Confundir |Γ| = 0,5 con 50 % de potencia (en realidad es 25 %).</li>
        <li>Suponer que el centro es siempre 50 Ω: es Z₀, sea cual sea.</li>
      </ul>`,
  });

  /* ===================================================================
     22. CONCLUSIONES
     =================================================================== */
  SLIDES.push({
    section: 'Cierre',
    title: 'Conclusiones',
    trans: 'blur',
    cls: 'conclusions',
    html: `
      <div class="bg-chart"></div>
      ${head('08 · Cierre', 'Conclusiones')}
      <div class="content" style="grid-template-columns: 860px 1fr">
        <ul class="ilist concl">${[
          'La Carta de Smith representa <b>impedancias complejas</b> de manera gráfica.',
          'Relaciona la <b>impedancia normalizada</b> con el <b>coeficiente de reflexión</b>.',
          'Facilita el análisis de la <b>adaptación</b> entre líneas de transmisión y cargas.',
          'Permite calcular e interpretar el <b>VSWR</b>.',
          'Es una herramienta fundamental para diseñar <b>redes de adaptación</b>.',
          'Tiene aplicaciones directas en <b>antenas, líneas microstrip</b> y sistemas de RF.',
          'Se complementa con simuladores electromagnéticos como <b>Ansys HFSS</b>.',
        ].map((t, i) => `<li class="rv left" style="--i:${i + 2}"><span class="li-ic good">${icon('check')}</span><span>${t}</span></li>`).join('')}</ul>
        <div></div>
      </div>
      <blockquote class="final-quote rv glowin" style="--i:10">“Comprender la Carta de Smith es comprender cómo controlar la energía que se transmite, se refleja y se entrega en un sistema de radiofrecuencia.”</blockquote>`,
    notes: `
      <p><strong>Cierre (≈2 min).</strong> Repasar las ideas principales mientras el punto de la carta viaja desde una carga desadaptada hasta el centro siguiendo una red de adaptación:</p>
      <ul>
        <li>La carta convierte números complejos en geometría: cada punto es una impedancia y un coeficiente de reflexión.</li>
        <li>La distancia al centro es |Γ|; los círculos concéntricos son de VSWR constante.</li>
        <li>Moverse por una línea es girar sobre un círculo; añadir elementos en serie o en paralelo es moverse por círculos de r o de g constante.</li>
        <li>Adaptar es llevar el punto al centro.</li>
        <li>Lo aplicamos a antenas, microstrip y S11, y lo conectamos con la simulación electromagnética (HFSS).</li>
      </ul>
      <p>Leer la frase final con calma: resume que la carta es una herramienta para controlar la energía en un sistema de RF.</p>`,
    init(el) {
      this.ch = new SmithChart(q(el, '.bg-chart'), { labels: false, point: true, vswr: false, vector: false });
      const zL = { re: 0.4, im: -0.6 };
      const net = RF.lNetworkSeriesFirst(zL);
      this.path = [];
      for (let i = 0; i <= 80; i++) this.path.push(RF.zToGamma(RF.addSeriesReactance(zL, net.xs * i / 80)));
      for (let i = 0; i <= 80; i++) this.path.push(RF.zToGamma(RF.addShuntSusceptance(net.z1, net.b * i / 80)));
      this.ch.drawTrace(this.path, 'sc-trace');
      this.ch.addDot(this.path[0], '#ff4d5e', '', 2);
    },
    enter() {
      const t0 = Anim.time;
      Anim.loop((t) => {
        const cyc = ((t - t0) % 7) / 5;
        const u = Math.min(1, cyc);
        const i = Math.min(this.path.length - 1, Math.floor(Anim.ease.inOut(u) * (this.path.length - 1)));
        this.ch.setGamma(this.path[i], { silent: true });
      });
    },
  });

  /* ===================================================================
     23. PREGUNTAS
     =================================================================== */
  SLIDES.push({
    section: 'Cierre',
    title: '¿Preguntas?',
    trans: 'zoom',
    cls: 'questions',
    html: `
      <div class="q-chart"></div>
      <svg class="cover-line q-line" viewBox="0 0 1600 150" preserveAspectRatio="none" aria-hidden="true">
        <path class="qw1" fill="none" stroke="#22e4ff" stroke-width="3" style="filter: drop-shadow(0 0 6px #22e4ff)"/>
        <path class="qw2" fill="none" stroke="#a78bfa" stroke-width="1.6" opacity=".6"/>
      </svg>
      <div class="q-main">
        <div class="rv glowin" style="--i:1"><h1 class="cover-title q-title">¿PREGUNTAS?</h1></div>
        <p class="cover-sub rv" style="--i:3">Gracias por su atención</p>
      </div>
      <div class="cover-team">
        <div class="member rv" style="--i:5"><span class="dot"></span>SHARON MAWENZY MARTINEZ</div>
        <div class="member rv" style="--i:6"><span class="dot"></span>BRAYAN STIVEN CORREA</div>
        <div class="member rv" style="--i:7"><span class="dot"></span>FABIAN STEVEN VARGAS</div>
      </div>`,
    notes: `
      <p><strong>Ronda de preguntas.</strong> Tener preparadas las diapositivas interactivas para responder en vivo (usar el menú, tecla M, para saltar):</p>
      <ul>
        <li>"¿Dónde queda una carga X?" → diapositiva 11 (explorador): ubicarla y leer Γ, VSWR y potencia reflejada.</li>
        <li>"¿Por qué λ/4 invierte la impedancia?" → diapositiva 15: mover d a 0,25λ.</li>
        <li>"¿Cómo se adapta?" → diapositivas 16 y 20.</li>
        <li>"¿Qué significa −10 dB?" → diapositiva 19 (10 % de potencia reflejada, VSWR ≈ 1,92).</li>
        <li>"¿Qué aporta HFSS?" → diapositiva 18: simulación 3D de onda completa, con pérdidas y discontinuidades, frente al modelo ideal.</li>
      </ul>
      <p>Agradecer al docente y a los asistentes.</p>`,
    init(el) {
      this.ch = new SmithChart(q(el, '.q-chart'), { labels: false, phaseScale: true, point: true, vswr: true, hidden: true });
      this.w1 = q(el, '.qw1'); this.w2 = q(el, '.qw2');
    },
    enter() {
      if (this.cancel) this.cancel();
      this.cancel = this.ch.build(['unit', 'rcircles', 'xarcs', 'axis', 'phase', 'center'], 400);
      const k2 = 2 * Math.PI / 300, w = k2 * 200;
      Anim.loop((t) => {
        this.w1.setAttribute('d', Anim.curve(x => 75 - 26 * Math.sin(w * t - k2 * x), 0, 1600, 240));
        this.w2.setAttribute('d', Anim.curve(x => 75 - 14 * Math.sin(w * t * 1.3 - k2 * 1.5 * x + 2), 0, 1600, 240));
        this.ch.setGamma(Cx.polar(0.62, -t * 0.5), { silent: true });
      });
    },
    leave() { if (this.cancel) this.cancel(); },
  });
})();
