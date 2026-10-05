/* =====================================================================
   slides-b.js — Diapositivas 9 a 16
   Impedancia normalizada · Γ · Explorador · VSWR · Ejemplo · Línea · Adaptación
   ===================================================================== */
(function () {
  'use strict';
  const { frac, head, ro, field, q, qa, k, icon } = SL;
  const E = SmithChart.el;
  const fmt = RF.fmt, fmtC = RF.fmtC;
  const U = SL.unit;

  /** Escribe en un panel de lecturas el análisis completo de un punto. */
  function fillReadouts(el, a, Z0) {
    const zTxt = a.open ? '∞ (abierto)' : fmtC(a.z, 3);
    const ZTxt = a.open ? '∞' : fmtC(a.Z, 1) + '<span class="u">Ω</span>';
    SL.set(el, 'z', zTxt);
    SL.set(el, 'Z', ZTxt);
    SL.set(el, 'g', fmtC(a.gamma, 4));
    SL.set(el, 'm', fmt(a.mag, 4));
    SL.set(el, 'ph', fmt(a.phase, 2) + '<span class="u">°</span>');
    SL.set(el, 'vswr', a.vswr === Infinity ? '∞' : fmt(a.vswr, 3));
    SL.set(el, 'p', fmt(a.pRefl, 2) + '<span class="u">%</span>');
    SL.set(el, 'rl', (a.rl === Infinity ? '∞' : fmt(a.rl, 2)) + '<span class="u">dB</span>');
  }

  /* ===================================================================
     9. IMPEDANCIA NORMALIZADA
     =================================================================== */
  SLIDES.push({
    section: 'La Carta de Smith',
    title: 'Impedancia normalizada',
    trans: 'slide',
    html: `
      ${head('03 · La Carta de Smith', 'Impedancia normalizada')}
      <div class="content" style="grid-template-columns: 420px 430px 1fr">
        <div class="col">
          <div class="eq big rv left"><i>z</i><sub>L</sub> = ${frac('<i>Z</i><sub>L</sub>', '<i>Z</i><sub>0</sub>')} = <i>r</i> + <i>jx</i></div>
          <div class="panel rv left">
            <div class="panel-label">¿Por qué normalizar?</div>
            <p class="small" style="margin:0">Una sola carta sirve para <b>cualquier sistema</b> (50 Ω, 75 Ω, 300 Ω…) porque trabaja con valores relativos a Z₀. Las magnitudes <i>r</i> = R/Z₀ y <i>x</i> = X/Z₀ son <b>adimensionales</b>.</p>
          </div>
          <div class="panel rv left">
            <div class="panel-label">Ejemplo</div>
            <div class="sym-list" style="font-size:19px">
              <span>Z<sub>L</sub></span><span>75 + j25 Ω</span>
              <span>Z<sub>0</sub></span><span>50 Ω</span>
              <span>z<sub>L</sub></span><span class="hl" style="font-family:var(--font-mono)">(75 + j25)/50 = 1.5 + j0.5</span>
            </div>
          </div>
          <button class="btn rv left" data-act="ex">Cargar el ejemplo</button>
        </div>
        <div class="col">
          <div class="panel glow rv">
            <div class="panel-label">Datos de la carga</div>
            ${field('<i>R</i><sub>L</sub> (Ω)', 'r9', 0, 300, 1, 75)}
            ${field('<i>X</i><sub>L</sub> (Ω)', 'x9', -200, 200, 1, 25)}
            ${field('<i>Z</i><sub>0</sub> (Ω)', 'z9', 10, 150, 1, 50)}
          </div>
          <div class="readouts rv">
            ${ro('r = R/Z₀', 'r', 'violet')}${ro('x = X/Z₀', 'x', 'turq')}
            <div class="ro wide"><div class="lbl">z<sub>L</sub> normalizada</div><div class="val" data-k="zl">—</div></div>
          </div>
          <div class="status info rv" data-k="st"></div>
        </div>
        <div class="center rv zoom"><div class="chart-host" style="width:580px;height:580px"></div></div>
      </div>`,
    notes: `
      <p><strong>Idea:</strong> la Carta de Smith no se dibuja en ohmios sino en impedancia normalizada z = Z/Z₀. Así, la misma carta sirve para un sistema de 50 Ω, de 75 Ω o cualquier otro.</p>
      <p><strong>Ecuación:</strong> z<sub>L</sub> = Z<sub>L</sub>/Z₀ = r + jx, con r = R/Z₀ y x = X/Z₀. Ambas son adimensionales.</p>
      <p><strong>Ejemplo:</strong> Z<sub>L</sub> = 75 + j25 Ω en una línea de 50 Ω → z<sub>L</sub> = 1.5 + j0.5. El punto queda en la intersección del círculo r = 1.5 (violeta) con el arco x = 0.5 (turquesa).</p>
      <p><strong>Demostración:</strong> cambiar Z₀ manteniendo la misma carga: por ejemplo, con Z₀ = 75 Ω la misma carga da z = 1 + j0.33, y el punto se desplaza. <em>La carga no cambió; cambió la referencia.</em> Con R<sub>L</sub> = Z₀ y X<sub>L</sub> = 0 el punto queda en el centro.</p>
      <p>Si se escribe una resistencia negativa en la caja numérica, la aplicación advierte que se trata de un caso activo (|Γ| &gt; 1), fuera de la carta de cargas pasivas.</p>`,
    init(el) {
      this.el = el;
      this.chart = new SmithChart(q(el, '.chart-host'), { labels: true, point: true, coords: true });
      const upd = () => this.update(false);
      this.fr = SL.bindField(el, 'r9', upd);
      this.fx = SL.bindField(el, 'x9', upd);
      this.fz = SL.bindField(el, 'z9', upd);
      q(el, '[data-act="ex"]').addEventListener('click', () => {
        this.fr.set(75, true); this.fx.set(25, true); this.fz.set(50, true); this.update(true);
      });
      this.update(false);
    },
    update(animate) {
      const el = this.el, Z0 = this.fz.get();
      const ZL = { re: this.fr.get(), im: this.fx.get() };
      const st = k(el, 'st');
      if (!(Z0 > 0)) {
        st.className = 'status bad'; st.innerHTML = 'Z₀ debe ser un número positivo.';
        this.chart.setParts({ point: false, vector: false });
        return;
      }
      const a = RF.analyzeLoad(ZL, Z0);
      this.chart.setParts({ point: true, vector: true });
      SL.set(el, 'r', fmt(a.z.re, 3));
      SL.set(el, 'x', fmt(a.z.im, 3));
      SL.set(el, 'zl', fmtC(a.z, 3));
      if (a.z.re < 0) {
        st.className = 'status bad';
        st.innerHTML = `R < 0 → |Γ| = ${fmt(a.mag, 3)} > 1. Corresponde a un <b>dispositivo activo</b>, no a una carga pasiva convencional; queda fuera de la carta.`;
        this.chart.clearHighlight();
      } else {
        st.className = 'status info';
        st.innerHTML = `${RF.classify(a.z, a.mag)}. Γ = ${fmtC(a.gamma, 3)}`;
        this.chart.highlightR(a.z.re, 'r', animate);
        this.chart.highlightX(a.z.im, 'x', animate);
      }
      if (animate) this.chart.animateTo(a.gamma, 900, 'z');
      else this.chart.setGamma(a.gamma);
    },
  });

  /* ===================================================================
     10. EL COEFICIENTE DE REFLEXIÓN
     =================================================================== */
  SLIDES.push({
    section: 'Reflexión y VSWR',
    title: 'El coeficiente de reflexión',
    trans: 'zoom',
    html: `
      ${head('04 · Reflexión y VSWR', 'El coeficiente de reflexión Γ')}
      <div class="content" style="grid-template-columns: 1fr 520px">
        <div class="col">
          <div class="row rv left" style="gap:16px">
            <div class="eq">Γ = ${frac('<i>Z</i><sub>L</sub> − <i>Z</i><sub>0</sub>', '<i>Z</i><sub>L</sub> + <i>Z</i><sub>0</sub>')} = ${frac('<i>V</i><sup>−</sup>', '<i>V</i><sup>+</sup>')} = |Γ| <i>e</i><sup><i>j</i>θ</sup></div>
            <div class="sym-list" style="font-size:16px"><span>V⁺</span><span>onda de tensión incidente</span><span>V⁻</span><span>onda de tensión reflejada</span><span>|Γ|, θ</span><span>magnitud y fase de Γ</span></div>
          </div>
          <div class="panel glow rv" style="padding:6px 10px">
            <svg class="diagram gw" viewBox="0 0 900 250" width="100%" style="display:block"></svg>
          </div>
          <div class="panel rv" style="padding:10px 18px">
            ${field('<i>R</i><sub>L</sub> (Ω)', 'r10', 0, 400, 1, 100)}
            ${field('<i>X</i><sub>L</sub> (Ω)', 'x10', -200, 200, 1, 0)}
            <div class="row"><span class="muted small">Z₀ = 50 Ω ·</span>
              <button class="btn sm" data-z="50,0">50 Ω</button><button class="btn sm" data-z="100,0">100 Ω</button>
              <button class="btn sm" data-z="0,0">Cortocircuito</button><button class="btn sm" data-z="1e9,0">Abierto</button>
              <button class="btn sm" data-z="50,50">50 + j50 Ω</button>
            </div>
          </div>
        </div>
        <div class="col">
          <div class="panel rv right" style="padding:10px 14px">
            <div class="row" style="flex-wrap:nowrap; gap:10px">
              <svg class="gauge" viewBox="0 0 240 140" width="250"></svg>
              <div style="flex:1">
                <div class="panel-label">Potencia reflejada</div>
                <div class="big-num" data-k="p">—</div>
                <div class="meter orange"><span data-k="pm"></span></div>
                <p class="tiny muted" style="margin:6px 0 0">P<sub>refl</sub> (%) = |Γ|² × 100</p>
              </div>
            </div>
          </div>
          <div class="row rv right" style="flex-wrap:nowrap; gap:12px; align-items:stretch">
            <div style="width:270px;height:270px" class="chart-host"></div>
            <div class="readouts one" style="flex:1">${ro('Γ', 'g')}${ro('|Γ|', 'm', 'orange')}${ro('∠Γ', 'ph', 'violet')}</div>
          </div>
          <div class="callout violet rv right" style="font-size:16px"><b>Magnitud ≠ potencia:</b> |Γ| compara <em>tensiones</em>; la potencia va con el cuadrado. Con |Γ| = 0.5 se refleja la mitad de la tensión, pero solo el <b>25 %</b> de la potencia.</div>
        </div>
      </div>`,
    notes: `
      <p><strong>Definición:</strong> el coeficiente de reflexión es el cociente entre la onda de tensión reflejada y la incidente en la carga: Γ = V⁻/V⁺ = (Z<sub>L</sub> − Z₀)/(Z<sub>L</sub> + Z₀). Es un número complejo: su <em>magnitud</em> indica cuánta onda regresa y su <em>fase</em> indica con qué desfase regresa.</p>
      <p><strong>Casos clave</strong> (usar los botones): 50 Ω → Γ = 0, sin reflexión. Cortocircuito → Γ = −1: reflexión total con inversión de fase (180°). Circuito abierto → Γ = +1: reflexión total en fase. 100 Ω → Γ = 1/3. 50 + j50 Ω → Γ complejo, con fase distinta de 0°.</p>
      <p><strong>Animación:</strong> la onda naranja (reflejada) cambia de amplitud con |Γ| y se desplaza según la fase. El medidor indica |Γ| y la barra el porcentaje de potencia reflejada.</p>
      <p><strong>Error común:</strong> confundir |Γ| con la potencia reflejada. Como la potencia es proporcional al cuadrado de la tensión, P<sub>refl</sub> = |Γ|²·P<sub>inc</sub>. Ejemplo: |Γ| = 0,5 → 25 %; |Γ| = 0,1 → solo 1 %.</p>
      <p>Relación con la carta: el punto pequeño de la derecha está a una distancia |Γ| del centro y forma un ángulo θ con el eje horizontal.</p>`,
    init(el) {
      this.el = el;
      const svg = q(el, 'svg.gw');
      this.svg = svg;
      E('line', { x1: 40, y1: 70, x2: 800, y2: 70, stroke: 'rgba(255,255,255,.1)' }, svg);
      E('line', { x1: 40, y1: 180, x2: 800, y2: 180, stroke: 'rgba(255,255,255,.1)' }, svg);
      this.load = E('rect', { x: 812, y: 30, width: 48, height: 190, rx: 8, fill: 'rgba(251,146,60,.1)', stroke: '#fb923c', 'stroke-width': 2 }, svg);
      const tl = E('text', { x: 836, y: 240, 'text-anchor': 'middle', class: 'lbl lbl-w' }, svg); tl.textContent = 'Z_L';
      const a = E('text', { x: 44, y: 22, class: 'lbl', style: 'fill:#22e4ff' }, svg); a.textContent = 'V⁺ · ONDA INCIDENTE →';
      const b = E('text', { x: 44, y: 242, class: 'lbl', style: 'fill:#fb923c' }, svg); b.textContent = '← V⁻ = Γ·V⁺ · ONDA REFLEJADA';
      this.inc = E('path', { class: 'wave-inc' }, svg);
      this.ref = E('path', { class: 'wave-ref' }, svg);
      // Medidor de |Γ|
      const gs = q(el, 'svg.gauge');
      const cx = 120, cy = 120, R = 92;
      const arcP = (a0, a1) => `M ${cx + R * Math.cos(Math.PI - a0 * Math.PI)} ${cy - R * Math.sin(Math.PI - a0 * Math.PI)} A ${R} ${R} 0 0 1 ${cx + R * Math.cos(Math.PI - a1 * Math.PI)} ${cy - R * Math.sin(Math.PI - a1 * Math.PI)}`;
      [[0, 0.1, '#3cf7a6'], [0.1, 0.33, '#22e4ff'], [0.33, 0.6, '#fbbf24'], [0.6, 0.9, '#fb923c'], [0.9, 1, '#ff4d5e']].forEach(([a0, a1, c]) =>
        E('path', { d: arcP(a0, a1), fill: 'none', stroke: c, 'stroke-width': 12, opacity: .85 }, gs));
      [0, 0.25, 0.5, 0.75, 1].forEach(v => {
        const ang = Math.PI - v * Math.PI;
        const t = E('text', { x: cx + (R - 24) * Math.cos(ang), y: cy - (R - 24) * Math.sin(ang) + 4, 'text-anchor': 'middle', style: 'font: 11px var(--font-mono); fill:#9fb2cc' }, gs);
        t.textContent = v;
      });
      this.needle = E('line', { x1: cx, y1: cy, x2: cx - R + 6, y2: cy, stroke: '#fff', 'stroke-width': 3, 'stroke-linecap': 'round', style: 'filter: drop-shadow(0 0 4px #22e4ff); transition: all .4s' }, gs);
      E('circle', { cx, cy, r: 6, fill: '#fff' }, gs);
      this.gv = E('text', { x: cx, y: cy - 30, 'text-anchor': 'middle', style: 'font: 600 22px var(--font-mono); fill:#22e4ff' }, gs);
      const gl = E('text', { x: cx, y: cy + 18, 'text-anchor': 'middle', style: 'font: 11px var(--font-mono); fill:#9fb2cc; letter-spacing:.15em' }, gs); gl.textContent = '|Γ|';
      this.gc = { cx, cy, R };
      this.chart = new SmithChart(q(el, '.chart-host'), { labels: false, density: 'light', point: true, vswr: true });
      const upd = () => this.update();
      this.fr = SL.bindField(el, 'r10', upd);
      this.fx = SL.bindField(el, 'x10', upd);
      qa(el, '[data-z]').forEach(b2 => b2.addEventListener('click', () => {
        const [R2, X2] = b2.dataset.z.split(',').map(Number);
        this.fr.set(R2, true); this.fx.set(X2, true); this.update();
      }));
      this.update();
    },
    update() {
      const el = this.el;
      const a = RF.analyzeLoad({ re: this.fr.get(), im: this.fx.get() }, 50);
      this.gamma = a.gamma;
      const m = Math.min(1, a.mag);
      const ang = Math.PI - m * Math.PI, { cx, cy, R } = this.gc;
      this.needle.setAttribute('x2', cx + (R - 6) * Math.cos(ang));
      this.needle.setAttribute('y2', cy - (R - 6) * Math.sin(ang));
      this.gv.textContent = fmt(a.mag, 3);
      SL.set(el, 'g', fmtC(a.gamma, 3));
      SL.set(el, 'm', fmt(a.mag, 3));
      SL.set(el, 'ph', fmt(a.phase, 1) + '<span class="u">°</span>');
      SL.set(el, 'p', fmt(a.pRefl, 1) + ' %');
      k(el, 'pm').style.width = Math.min(100, a.pRefl) + '%';
      this.chart.setGamma(a.gamma);
      this.load.setAttribute('stroke', RF.colorForMag(a.mag));
    },
    enter() {
      const kk = 2 * Math.PI / 190, w = 2 * Math.PI * 0.7, A = 40, x0 = 40, x1 = 806;
      Anim.loop((t) => {
        const m = Math.min(1.2, Cx.abs(this.gamma)), ph = Cx.arg(this.gamma);
        this.inc.setAttribute('d', Anim.curve(x => 70 - A * Math.cos(w * t - kk * (x - x1)), x0, x1, 180));
        this.ref.setAttribute('d', Anim.curve(x => 180 - A * m * Math.cos(w * t + kk * (x - x1) + ph), x0, x1, 180));
      });
    },
  });

  /* ===================================================================
     11. EXPLORADOR INTERACTIVO
     =================================================================== */
  const PRESETS = [
    ['Adaptación perfecta', 50, 0],
    ['Resistiva baja', 25, 0],
    ['Resistiva alta', 100, 0],
    ['Inductiva', 50, 25],
    ['Capacitiva', 50, -25],
    ['Compleja', 75, 25],
  ];

  SLIDES.push({
    section: 'Reflexión y VSWR',
    title: 'Explorador interactivo',
    trans: 'blur',
    html: `
      ${head('04 · Laboratorio', 'Explorador interactivo de la Carta de Smith', '')}
      <div class="content" style="grid-template-columns: 680px 1fr; gap: 30px">
        <div class="center rv zoom" style="position:relative">
          <div class="chart-host" style="width:650px;height:650px"></div>
        </div>
        <div class="col" style="position:relative">
          <div class="panel glow rv right" style="padding:12px 16px">
            <div class="row" style="justify-content:space-between; flex-wrap:nowrap">
              <div class="panel-label" style="margin:0">Resultados en tiempo real</div>
              <div class="row" style="gap:8px; flex-wrap:nowrap"><label class="small muted" for="z0e">Z₀ (Ω)</label><input id="z0e" class="num" type="number" value="50" min="1" step="1" style="width:90px" data-k2="z0"></div>
            </div>
            <div class="readouts" style="margin-top:10px">
              ${ro('z normalizada', 'z')}${ro('Z (Ω)', 'Z', 'violet')}
              ${ro('Γ', 'g')}${ro('|Γ|', 'm', 'orange')}
              ${ro('∠Γ', 'ph', 'violet')}${ro('VSWR', 'vswr', 'turq')}
              ${ro('Potencia reflejada', 'p', 'orange')}${ro('Pérdida de retorno', 'rl', 'turq')}
            </div>
            <div class="status info" data-k="cls" style="margin-top:10px; font-size:16px"></div>
          </div>
          <div class="panel rv right" style="padding:12px 16px">
            <div class="panel-label">Ejemplos (Z₀ = 50 Ω)</div>
            <div class="preset-grid">
              ${PRESETS.map(([t, R, X]) => `<button class="btn sm" data-p="${R},${X}"><span>${t}</span><span class="mono">${fmtC({ re: R, im: X }, 0)} Ω</span></button>`).join('')}
            </div>
          </div>
          <div class="row rv right">
            <button class="btn" data-act="reset">↺ Reiniciar</button>
            <button class="btn violet" data-act="explain">Mostrar explicación</button>
          </div>
          <div class="explain-pop panel glow" data-k="pop" hidden></div>
        </div>
      </div>`,
    notes: `
      <p><strong>Esta es la herramienta central de la exposición.</strong> Invitar al público a proponer impedancias.</p>
      <p><strong>Uso:</strong> hacer clic o arrastrar sobre la carta. El panel muestra en tiempo real: z normalizada, Z en ohmios (según Z₀), Γ en forma rectangular, |Γ|, su fase, el VSWR, la potencia reflejada y la pérdida de retorno. El círculo naranja discontinuo es el círculo de VSWR constante; el vector blanco va del centro al punto (su longitud es |Γ|). El color del punto cambia de verde (buena adaptación) a rojo (reflexión elevada).</p>
      <p><strong>Recorrido sugerido con los ejemplos:</strong></p>
      <ol>
        <li>Adaptación perfecta (50 Ω): centro, Γ = 0, VSWR = 1.</li>
        <li>25 Ω y 100 Ω: ambos en el eje real, simétricos respecto al centro; los dos tienen |Γ| = 1/3 y VSWR = 2, pero fases de 180° y 0°.</li>
        <li>50 + j25 Ω y 50 − j25 Ω: sobre el círculo r = 1, arriba (inductiva) y abajo (capacitiva).</li>
        <li>75 + j25 Ω: nuestro ejemplo, |Γ| ≈ 0,277 y VSWR ≈ 1,77.</li>
      </ol>
      <p>Cambiar Z₀ (por ejemplo, a 75 Ω) para mostrar que el mismo punto representa una impedancia distinta en ohmios. "Mostrar explicación" interpreta el punto actual. Con la carta enfocada se puede mover el punto con las flechas del teclado.</p>`,
    init(el) {
      this.el = el;
      this.Z0 = 50;
      this.chart = new SmithChart(q(el, '.chart-host'), {
        labels: true, phaseScale: true, wlScale: true, interactive: true, point: true, vswr: true, coords: true,
        onChange: () => this.update(),
      });
      const z0in = q(el, '[data-k2="z0"]');
      z0in.addEventListener('input', () => {
        const v = parseFloat(z0in.value);
        if (v > 0) { this.Z0 = v; z0in.style.borderColor = ''; this.update(); }
        else z0in.style.borderColor = '#ff4d5e';
      });
      this.z0in = z0in;
      qa(el, '[data-p]').forEach(b => b.addEventListener('click', () => {
        const [R, X] = b.dataset.p.split(',').map(Number);
        this.Z0 = 50; z0in.value = 50;
        this.chart.animateTo(RF.reflectionCoefficient({ re: R, im: X }, 50), 1000, 'line');
      }));
      q(el, '[data-act="reset"]').addEventListener('click', () => {
        this.Z0 = 50; z0in.value = 50;
        this.chart.animateTo({ re: 0, im: 0 }, 700);
        k(el, 'pop').hidden = true;
        q(el, '[data-act="explain"]').classList.remove('on');
        q(el, '[data-act="explain"]').textContent = 'Mostrar explicación';
      });
      q(el, '[data-act="explain"]').addEventListener('click', (e) => {
        const pop = k(el, 'pop');
        pop.hidden = !pop.hidden;
        e.currentTarget.classList.toggle('on', !pop.hidden);
        e.currentTarget.textContent = pop.hidden ? 'Mostrar explicación' : 'Ocultar explicación';
        this.update();
      });
      this.chart.setGamma(RF.reflectionCoefficient({ re: 75, im: 25 }, 50));
    },
    update() {
      const el = this.el, a = RF.analyzeGamma(this.chart.gamma, this.Z0);
      fillReadouts(el, a, this.Z0);
      SL.set(el, 'cls', `<b>${RF.classify(a.z, a.mag)}</b>`);
      const pop = k(el, 'pop');
      if (!pop.hidden) {
        const q2 = a.mag < 0.1 ? '<span class="good">Excelente</span> (|S11| &lt; −20 dB)' : a.mag < 0.316 ? '<span class="hl">Aceptable en muchas aplicaciones</span> (|S11| &lt; −10 dB)' : '<span class="warn">Desadaptación significativa</span>';
        pop.innerHTML = `
          <div class="panel-label">Interpretación del punto</div>
          ${a.open ? '<p class="small">El punto está en Γ = 1: <b>circuito abierto</b>, impedancia infinita y reflexión total.</p>' : `
          <p class="small" style="margin:0 0 6px">El punto es la intersección del círculo <b class="hl2">r = ${fmt(a.z.re, 2)}</b> y del arco <b class="hl3">x = ${fmt(a.z.im, 2)}</b>: Z = ${fmtC(a.Z, 1)} Ω con Z₀ = ${fmt(this.Z0, 0)} Ω.</p>`}
          <p class="small" style="margin:0 0 6px">Se refleja el <b>${fmt(a.pRefl, 1)} %</b> de la potencia incidente y llega a la carga el ${fmt(a.pDeliv, 1)} % (línea sin pérdidas).</p>
          <p class="small" style="margin:0 0 6px">El círculo naranja (VSWR = ${a.vswr === Infinity ? '∞' : fmt(a.vswr, 2)}) reúne las impedancias con la misma |Γ|: las que se observan al recorrer una línea ideal.</p>
          <p class="small" style="margin:0">Calidad de adaptación: ${q2}.</p>`;
      }
    },
  });

  /* ===================================================================
     12. CÓMO UBICAR UNA IMPEDANCIA
     =================================================================== */
  const LOCATE = [
    'Identificar Z₀ = 50 Ω',
    'Obtener Z<sub>L</sub> = 75 + j25 Ω',
    'Normalizar: z<sub>L</sub> = Z<sub>L</sub>/Z₀ = 1.5 + j0.5',
    'Ubicar el círculo de resistencia r = 1.5',
    'Ubicar el arco de reactancia x = 0.5',
    'Marcar el punto de intersección',
    'Interpretar: Γ, |Γ|, fase y VSWR',
  ];
  SLIDES.push({
    section: 'Reflexión y VSWR',
    title: 'Cómo ubicar una impedancia',
    trans: 'slide',
    html: `
      ${head('04 · Reflexión y VSWR', 'Cómo ubicar una impedancia en la carta')}
      <div class="content" style="grid-template-columns: 590px 1fr">
        <div class="col">
          <div class="panel rv left" style="padding:8px 12px"><ol class="steps loc-steps">${LOCATE.map(s => `<li>${s}</li>`).join('')}</ol></div>
          <div class="row rv left">
            <button class="btn primary" data-act="next">Siguiente paso ▶</button>
            <button class="btn" data-act="all">Ejecutar todo</button>
            <button class="btn sm" data-act="reset">↺ Reiniciar</button>
          </div>
          <div class="readouts rv left loc-res" style="opacity:.25; transition: opacity .5s">
            ${ro('Γ', 'g')}${ro('|Γ|', 'm', 'orange')}${ro('∠Γ', 'ph', 'violet')}${ro('VSWR', 'vswr', 'turq')}
          </div>
        </div>
        <div class="center rv zoom"><div class="chart-host" style="width:650px;height:650px"></div></div>
      </div>`,
    notes: `
      <p><strong>Procedimiento práctico</strong> que se aplica siempre, tanto a mano como con software. Avanzar con "Siguiente paso":</p>
      <ol>
        <li>Identificar la impedancia de referencia del sistema, Z₀ = 50 Ω.</li>
        <li>Conocer la carga: Z<sub>L</sub> = 75 + j25 Ω (dato medido, calculado o simulado).</li>
        <li>Normalizar: z<sub>L</sub> = 1.5 + j0.5. Error común: olvidar este paso.</li>
        <li>Buscar el círculo r = 1.5 (se ilumina en violeta).</li>
        <li>Buscar el arco x = +0.5 (turquesa). Como x es positiva, el arco está en la mitad superior.</li>
        <li>La intersección es la impedancia de carga.</li>
        <li>Interpretar: la distancia al centro es |Γ| ≈ 0,277; el ángulo es ≈ 33,7°; el VSWR ≈ 1,77. El punto está cerca del centro y del lado inductivo: desadaptación moderada.</li>
      </ol>
      <p>En una carta impresa, el VSWR se lee trasladando la distancia del punto al centro sobre el eje real derecho; aquí se calcula directamente.</p>`,
    init(el) {
      this.el = el;
      this.chart = new SmithChart(q(el, '.chart-host'), { labels: true, phaseScale: true, point: true, vswr: false, coords: false });
      this.items = qa(el, '.loc-steps li');
      q(el, '[data-act="next"]').addEventListener('click', () => this.step());
      q(el, '[data-act="all"]').addEventListener('click', () => this.runAll());
      q(el, '[data-act="reset"]').addEventListener('click', () => this.reset());
      this.reset();
    },
    reset() {
      clearTimeout(this.timer);
      this.n = 0;
      const ch = this.chart;
      ch.clearHighlight();
      ch.setParts({ point: false, vector: false, vswr: false, coords: false });
      ch.setGamma({ re: 0, im: 0 }, { silent: true });
      this.items.forEach(li => li.classList.remove('done', 'current'));
      q(this.el, '.loc-res').style.opacity = .25;
      ['g', 'm', 'ph', 'vswr'].forEach(key => SL.set(this.el, key, '—'));
    },
    step() {
      if (this.n >= LOCATE.length) return false;
      const ch = this.chart, n = this.n;
      const a = RF.analyzeLoad({ re: 75, im: 25 }, 50);
      if (n === 3) ch.highlightR(a.z.re, 'r');
      if (n === 4) ch.highlightX(a.z.im, 'x');
      if (n === 5) {
        ch.setParts({ point: true, vector: false, coords: true });
        ch.setGamma({ re: 0, im: 0 }, { silent: true });
        ch.animateTo(a.gamma, 1100, 'z');
      }
      if (n === 6) {
        ch.setParts({ vector: true, vswr: true });
        ch.setGamma(a.gamma);
        q(this.el, '.loc-res').style.opacity = 1;
        SL.set(this.el, 'g', fmtC(a.gamma, 4));
        SL.set(this.el, 'm', fmt(a.mag, 3));
        SL.set(this.el, 'ph', fmt(a.phase, 1) + '<span class="u">°</span>');
        SL.set(this.el, 'vswr', fmt(a.vswr, 2));
      }
      this.items.forEach((li, i) => { li.classList.toggle('done', i < n); li.classList.toggle('current', i === n); });
      this.n++;
      return true;
    },
    runAll() {
      this.reset();
      const go = () => { if (this.step()) this.timer = setTimeout(go, Anim.enabled ? 1200 : 0); };
      go();
    },
    leave() { clearTimeout(this.timer); },
  });

  /* ===================================================================
     13. VSWR
     =================================================================== */
  SLIDES.push({
    section: 'Reflexión y VSWR',
    title: 'Relación de onda estacionaria (VSWR)',
    trans: 'rise',
    html: `
      ${head('04 · Reflexión y VSWR', 'Relación de onda estacionaria (ROE · VSWR)')}
      <div class="content" style="grid-template-columns: 1fr 470px">
        <div class="col">
          <div class="panel glow rv zoom" style="padding:6px 10px">
            <svg class="diagram vs" viewBox="0 0 920 330" width="100%" style="display:block"></svg>
            <div class="legend" style="padding:0 8px 6px"><span style="--c:#22e4ff">Incidente</span><span style="--c:#fb923c">Reflejada</span><span style="--c:#ffffff">Total</span><span style="--c:#a78bfa">Envolvente |V(d)|</span></div>
          </div>
          <div class="row rv" style="gap:16px; flex-wrap:nowrap; align-items:stretch">
            <div class="panel" style="flex:1; padding:10px 16px">
              ${field('|Γ|', 'g13', 0, 1, 0.01, 0.3)}
              <div class="row" style="gap:8px">
                <button class="btn sm" data-g="0" style="border-color:#3cf7a6">Adaptación · 0</button>
                <button class="btn sm" data-g="0.3">Moderada · 0.3</button>
                <button class="btn sm orange" data-g="0.7">Elevada · 0.7</button>
                <button class="btn sm" data-g="1" style="border-color:#ff4d5e">Total · 1</button>
              </div>
            </div>
            <div class="eq" style="align-self:center">VSWR = ${frac('<i>V</i><sub>máx</sub>', '<i>V</i><sub>mín</sub>')} = ${frac('1 + |Γ|', '1 − |Γ|')}</div>
          </div>
        </div>
        <div class="col">
          <div class="center rv right"><div class="chart-host" style="width:400px;height:400px"></div></div>
          <div class="readouts rv right">${ro('|Γ|', 'm', 'orange')}${ro('VSWR', 'vswr', 'turq')}<div class="ro orange wide"><div class="lbl">Potencia reflejada</div><div class="val" data-k="p">—</div></div></div>
          <p class="small muted rv right" style="margin:0">El círculo de VSWR corta el eje real derecho justo en <b class="hl">r = VSWR</b>.</p>
        </div>
      </div>`,
    notes: `
      <p><strong>Qué es:</strong> cuando hay onda incidente y reflejada en la misma línea, se suman. En algunos puntos llegan en fase (máximos de tensión) y en otros en contrafase (mínimos). El patrón de la envolvente no se desplaza: es una <em>onda estacionaria</em>.</p>
      <p><strong>Ecuación:</strong> V<sub>máx</sub> = |V⁺|(1 + |Γ|) y V<sub>mín</sub> = |V⁺|(1 − |Γ|), por lo que VSWR = (1 + |Γ|)/(1 − |Γ|). Va de 1 (adaptación) a ∞ (reflexión total). En español también se llama ROE (relación de onda estacionaria).</p>
      <p><strong>Demostración con los botones:</strong></p>
      <ul>
        <li>|Γ| = 0: la envolvente es plana, VSWR = 1. Solo hay onda viajera.</li>
        <li>|Γ| = 0,3: VSWR ≈ 1,86; se refleja el 9 % de la potencia.</li>
        <li>|Γ| = 0,7: VSWR ≈ 5,67; 49 % reflejado.</li>
        <li>|Γ| = 1: aparecen nulos de tensión; VSWR → ∞ (la aplicación muestra ∞ en lugar de dividir por cero).</li>
      </ul>
      <p>Los máximos están separados λ/2 entre sí, y un máximo y un mínimo consecutivos están separados λ/4. En la carta, el círculo de VSWR tiene radio |Γ| y corta el eje real derecho en r = VSWR: una forma gráfica rápida de leerlo.</p>`,
    init(el) {
      this.el = el;
      const svg = q(el, 'svg.vs');
      this.base = 150; this.A = 62; this.x0 = 50; this.x1 = 840;
      E('line', { x1: 50, y1: 150, x2: 840, y2: 150, stroke: 'rgba(255,255,255,.12)' }, svg);
      E('rect', { x: 848, y: 40, width: 40, height: 220, rx: 8, fill: 'rgba(251,146,60,.08)', stroke: '#fb923c', 'stroke-width': 2 }, svg);
      const tl = E('text', { x: 868, y: 282, 'text-anchor': 'middle', class: 'lbl lbl-w' }, svg); tl.textContent = 'CARGA';
      this.maxL = E('line', { x1: 50, x2: 840, stroke: '#a78bfa', 'stroke-dasharray': '3 6', opacity: .6 }, svg);
      this.minL = E('line', { x1: 50, x2: 840, stroke: '#a78bfa', 'stroke-dasharray': '3 6', opacity: .6 }, svg);
      this.maxT = E('text', { x: 54, class: 'lbl', style: 'fill:#c4b5fd' }, svg);
      this.minT = E('text', { x: 54, class: 'lbl', style: 'fill:#c4b5fd' }, svg);
      this.env1 = E('path', { class: 'wave-env' }, svg);
      this.env2 = E('path', { class: 'wave-env' }, svg);
      this.inc = E('path', { class: 'wave-inc', style: 'stroke-width:1.8;opacity:.55' }, svg);
      this.ref = E('path', { class: 'wave-ref', style: 'stroke-width:1.8;opacity:.55' }, svg);
      this.tot = E('path', { class: 'wave-tot', style: 'stroke-width:3' }, svg);
      const sc = E('text', { x: 50, y: 318, class: 'lbl' }, svg); sc.textContent = '← hacia la fuente           d (distancia desde la carga)';
      this.chart = new SmithChart(q(el, '.chart-host'), { labels: true, density: 'light', point: true, vswr: true });
      this.fg = SL.bindField(el, 'g13', () => this.update());
      qa(el, '[data-g]').forEach(b => b.addEventListener('click', () => {
        const from = this.fg.get(), to = +b.dataset.g;
        Anim.tween(600, t => { this.fg.set(from + (to - from) * t, true); this.update(); }, () => { this.fg.set(to, true); this.update(); });
      }));
      this.update();
    },
    update() {
      const el = this.el, m = Math.max(0, Math.min(1, this.fg.get()));
      this.m = m;
      const s = RF.vswr(m);
      SL.set(el, 'm', fmt(m, 2));
      SL.set(el, 'vswr', s === Infinity ? '∞' : fmt(s, 2));
      SL.set(el, 'p', fmt(RF.reflectedPowerPct(m), 1) + '<span class="u">%</span>');
      SL.set(el, 'rl', (m === 0 ? '∞' : fmt(RF.returnLossDb(m), 1)) + '<span class="u">dB</span>');
      this.chart.setGamma({ re: m, im: 0 });
      const yM = this.base - this.A * (1 + m), ym = this.base - this.A * (1 - m);
      this.maxL.setAttribute('y1', yM); this.maxL.setAttribute('y2', yM);
      this.minL.setAttribute('y1', ym); this.minL.setAttribute('y2', ym);
      this.maxT.setAttribute('y', yM - 6); this.maxT.textContent = `Vmáx = ${fmt(1 + m, 2)}·V⁺`;
      this.minT.setAttribute('y', ym + 16); this.minT.textContent = `Vmín = ${fmt(1 - m, 2)}·V⁺`;
    },
    enter() {
      const kk = 2 * Math.PI / 300, w = 2 * Math.PI * 0.6, { base, A, x0, x1 } = this;
      Anim.loop((t) => {
        const m = this.m;
        const bz = x => (x - x1) * kk;
        this.inc.setAttribute('d', Anim.curve(x => base - A * Math.cos(w * t - bz(x)), x0, x1, 160));
        this.ref.setAttribute('d', Anim.curve(x => base - A * m * Math.cos(w * t + bz(x)), x0, x1, 160));
        this.tot.setAttribute('d', Anim.curve(x => base - A * (Math.cos(w * t - bz(x)) + m * Math.cos(w * t + bz(x))), x0, x1, 220));
        const env = x => A * Math.hypot(1 + m * Math.cos(2 * bz(x)), m * Math.sin(2 * bz(x)));
        this.env1.setAttribute('d', Anim.curve(x => base - env(x), x0, x1, 160));
        this.env2.setAttribute('d', Anim.curve(x => base + env(x), x0, x1, 160));
      });
    },
  });

  /* ===================================================================
     14. EJEMPLO PRÁCTICO RESUELTO
     =================================================================== */
  SLIDES.push({
    section: 'Reflexión y VSWR',
    title: 'Ejemplo práctico resuelto',
    trans: 'scan',
    html: `
      ${head('04 · Ejemplo resuelto', 'Ejemplo práctico: Z<sub>L</sub> = 75 + j25 Ω en una línea de 50 Ω')}
      <div class="content" style="grid-template-columns: 1fr 600px">
        <div class="col ex-steps" style="gap:10px"></div>
        <div class="col">
          <div class="center"><div class="chart-host" style="width:560px;height:560px"></div></div>
          <div class="row" style="justify-content:center">
            <button class="btn primary" data-act="next">Siguiente paso ▶</button>
            <button class="btn sm" data-act="reset">↺ Reiniciar</button>
          </div>
        </div>
      </div>`,
    notes: `
      <p><strong>Ejercicio completo con valores reales</strong> (calculados por la aplicación con las mismas funciones que dibujan la carta):</p>
      <ol>
        <li><strong>Normalizar:</strong> z<sub>L</sub> = (75 + j25)/50 = 1.5 + j0.5.</li>
        <li><strong>Coeficiente de reflexión:</strong> Γ = (z<sub>L</sub> − 1)/(z<sub>L</sub> + 1) = (0.5 + j0.5)/(2.5 + j0.5). Multiplicando por el conjugado del denominador: (1.5 + j1.0)/6.5 ≈ 0.2308 + j0.1538. En la carta se ven sus componentes real e imaginaria.</li>
        <li><strong>Magnitud:</strong> |Γ| = √(0.2308² + 0.1538²) ≈ 0.277; fase ≈ 33.7°. El círculo naranja tiene ese radio.</li>
        <li><strong>VSWR:</strong> (1 + 0.277)/(1 − 0.277) ≈ 1.77. Gráficamente: donde el círculo corta el eje real derecho, r ≈ 1.77.</li>
        <li><strong>Potencia reflejada:</strong> |Γ|² × 100 ≈ 7.7 %. Por tanto, en una línea sin pérdidas llega a la carga ≈ 92.3 %.</li>
      </ol>
      <p><strong>Conclusión:</strong> la desadaptación es moderada. En muchas aplicaciones se busca |Γ| &lt; 0.316 (S11 &lt; −10 dB); este caso lo cumple (S11 ≈ −11.1 dB), aunque podría mejorarse con una red de adaptación.</p>`,
    init(el) {
      this.el = el;
      const a = this.a = RF.analyzeLoad({ re: 75, im: 25 }, 50);
      const num = Cx.sub(a.z, { re: 1, im: 0 }), den = Cx.add(a.z, { re: 1, im: 0 });
      const steps = [
        ['Normalizar', `<i>z</i><sub>L</sub> = ${frac('75 + <i>j</i>25', '50')} = <b class="hl">${fmtC(a.z, 1)}</b>`],
        ['Coeficiente de reflexión', `Γ = ${frac('<i>z</i><sub>L</sub> − 1', '<i>z</i><sub>L</sub> + 1')} = ${frac(fmtC(num, 1), fmtC(den, 1))} ≈ <b class="hl">${fmtC(a.gamma, 4)}</b>`],
        ['Magnitud (y fase)', `|Γ| = √(${fmt(a.gamma.re, 4)}² + ${fmt(a.gamma.im, 4)}²) ≈ <b class="hl">${fmt(a.mag, 3)}</b> <span class="muted" style="font-size:.7em">∠ ${fmt(a.phase, 1)}°</span>`],
        ['VSWR', `VSWR = ${frac('1 + ' + fmt(a.mag, 3), '1 − ' + fmt(a.mag, 3))} ≈ <b class="hl">${fmt(a.vswr, 2)}</b>`],
        ['Potencia reflejada', `P<sub>refl</sub> = |Γ|² × 100 ≈ <b class="hl">${fmt(a.pRefl, 1)} %</b> <span class="muted" style="font-size:.7em">→ entregada ≈ ${fmt(a.pDeliv, 1)} %</span>`],
      ];
      q(el, '.ex-steps').innerHTML = `
        <div class="row rv left" style="gap:10px"><span class="tag">Datos</span><span class="mono" style="font-size:20px">Z₀ = 50 Ω · Z<sub>L</sub> = 75 + j25 Ω</span><span class="tag turq">ejemplo numérico</span></div>
        ${steps.map(([t, eq], i) => `
          <div class="ex-step" data-s="${i}">
            <div class="ex-n">${i + 1}</div>
            <div><div class="panel-label" style="margin:0 0 2px">Paso ${i + 1} · ${t}</div><div class="eq sm plain">${eq}</div></div>
          </div>`).join('')}
        <div class="ex-step" data-s="5" style="padding:10px 14px">
          <div style="flex:1"><div class="pbar"><span>Entregada</span><div class="meter"><span style="width:${a.pDeliv}%"></span></div><b>${fmt(a.pDeliv, 1)} %</b></div>
          <div class="pbar"><span>Reflejada</span><div class="meter orange"><span style="width:${a.pRefl}%"></span></div><b>${fmt(a.pRefl, 1)} %</b></div></div>
        </div>`;
      this.chart = new SmithChart(q(el, '.chart-host'), { labels: true, phaseScale: true, point: true });
      q(el, '[data-act="next"]').addEventListener('click', () => this.step());
      q(el, '[data-act="reset"]').addEventListener('click', () => this.reset());
      this.reset();
    },
    reset() {
      this.n = 0;
      const ch = this.chart;
      ch.clearHighlight(); ch.clearDots(); ch.clearTraces();
      ch.setParts({ point: false, vector: false, vswr: false, coords: false });
      qa(this.el, '.ex-step').forEach(s => s.classList.remove('shown', 'current'));
    },
    step() {
      if (this.n > 4) return;
      const ch = this.chart, a = this.a, S = SmithChart.S, n = this.n;
      if (n === 0) {
        ch.highlightR(1.5, 'r'); ch.highlightX(0.5, 'x');
        ch.setParts({ point: true, coords: true });
        ch.setGamma({ re: 0, im: 0 }, { silent: true });
        ch.animateTo(a.gamma, 1100, 'z');
      }
      if (n === 1) {
        ch.setParts({ vector: true });
        const p = SmithChart.toXY(a.gamma);
        const l1 = E('path', { d: `M ${p.x} ${p.y} V 0`, stroke: '#a78bfa', 'stroke-width': .8, 'stroke-dasharray': '2 1.5', fill: 'none' }, ch.L.trace);
        const l2 = E('path', { d: `M 0 0 H ${p.x}`, stroke: '#22e4ff', 'stroke-width': 1.6, fill: 'none' }, ch.L.trace);
        const t1 = E('text', { x: p.x / 2, y: 6, 'text-anchor': 'middle', class: 'sc-dot-label' }, ch.L.trace); t1.textContent = 'Re ' + fmt(a.gamma.re, 3);
        const t2 = E('text', { x: p.x + 2, y: p.y / 2 + 4, class: 'sc-dot-label' }, ch.L.trace); t2.textContent = 'Im ' + fmt(a.gamma.im, 3);
        SmithChart.drawIn(l1, 600); SmithChart.drawIn(l2, 600);
      }
      if (n === 2) {
        ch.setParts({ vswr: true });
        ch.setGamma(a.gamma);
        const r = 16, th = a.phase * Math.PI / 180;
        const arc = E('path', { d: `M ${r} 0 A ${r} ${r} 0 0 0 ${r * Math.cos(th)} ${-r * Math.sin(th)}`, fill: 'none', stroke: '#fbbf24', 'stroke-width': 1 }, ch.L.trace);
        SmithChart.drawIn(arc, 600);
        const t = E('text', { x: r + 3, y: -4, class: 'sc-dot-label', style: 'fill:#fbbf24' }, ch.L.trace); t.textContent = fmt(a.phase, 1) + '°';
      }
      if (n === 3) {
        const gv = { re: a.mag, im: 0 };
        ch.addDot(gv, '#2dd4bf', 'r = VSWR ≈ ' + fmt(a.vswr, 2), 2.4);
        ch.highlightR(a.vswr, 'rv');
      }
      qa(this.el, '.ex-step').forEach(s => {
        const i = +s.dataset.s;
        if (i <= n || (n === 4 && i === 5)) s.classList.add('shown');
        s.classList.toggle('current', i === n);
      });
      this.n++;
    },
  });

  /* ===================================================================
     15. DESPLAZAMIENTO SOBRE LA LÍNEA
     =================================================================== */
  SLIDES.push({
    section: 'Líneas y adaptación',
    title: 'Desplazamiento sobre una línea',
    trans: 'zoom',
    html: `
      ${head('05 · Líneas y adaptación', 'Desplazamiento sobre una línea de transmisión')}
      <div class="content" style="grid-template-columns: 1fr 620px">
        <div class="col">
          <div class="row rv left" style="gap:16px; flex-wrap:nowrap">
            <div class="eq">Γ(<i>d</i>) = Γ<sub>L</sub> · <i>e</i><sup>−<i>j</i>2β<i>d</i></sup></div>
            <div class="sym-list" style="font-size:15px">
              <span>Γ<sub>L</sub></span><span>coeficiente de reflexión en la carga</span>
              <span>β</span><span>constante de fase, β = 2π/λ</span>
              <span>d</span><span>distancia desde la carga hacia la fuente</span>
            </div>
          </div>
          <div class="panel glow rv" style="padding:6px 10px">
            <svg class="diagram ln" viewBox="0 0 860 210" width="100%" style="display:block"></svg>
          </div>
          <div class="panel rv" style="padding:10px 16px">
            ${field('<i>d</i> / λ', 'd15', 0, 0.5, 0.001, 0)}
            <div class="row" style="gap:8px">
              <button class="btn primary sm" data-act="play">▶ Mover</button>
              <button class="btn sm" data-act="reset">↺ Reiniciar</button>
              <span class="muted small" style="margin-left:8px">Carga:</span>
              <select class="num" data-k2="load" style="width:auto">
                <option value="75,25">75 + j25 Ω</option><option value="100,0">100 Ω</option>
                <option value="25,-25">25 − j25 Ω</option><option value="0,0">Cortocircuito</option>
              </select>
            </div>
          </div>
          <div class="readouts three rv">
            ${ro('z de entrada', 'zin')}${ro('Z de entrada', 'Zin', 'violet')}${ro('∠Γ(d)', 'ph', 'turq')}
            ${ro('|Γ| (constante)', 'm', 'orange')}${ro('2βd', 'bd', 'violet')}${ro('VSWR', 'vswr', 'turq')}
          </div>
        </div>
        <div class="center rv zoom"><div class="chart-host" style="width:600px;height:600px"></div></div>
      </div>`,
    notes: `
      <p><strong>Idea fundamental:</strong> la impedancia que "se ve" depende del punto de la línea donde se mida. Al alejarnos de la carga hacia la fuente, la impedancia de entrada cambia.</p>
      <p><strong>Ecuación:</strong> en una línea ideal sin pérdidas, Γ(d) = Γ<sub>L</sub>·e<sup>−j2βd</sup>. El factor exponencial tiene módulo 1: <em>la magnitud |Γ| no cambia</em>, solo gira la fase, un ángulo 2βd = 4π·d/λ. Por eso el punto se mueve sobre el círculo de VSWR constante, en sentido horario ("hacia el generador").</p>
      <p><strong>Consecuencia:</strong> una vuelta completa (360°) corresponde a 2βd = 2π, es decir, d = λ/2. La impedancia se repite cada media longitud de onda. Con d = λ/4 el punto queda diametralmente opuesto: z<sub>in</sub> = 1/z<sub>L</sub> (principio del transformador de λ/4).</p>
      <p><strong>Demostración:</strong> pulsar "Mover" y comentar cómo el marcador recorre la línea mientras el punto gira en la carta. Pausar en d = 0.25λ para mostrar la inversión de impedancia. La escala exterior de la carta está en longitudes de onda hacia el generador. Probar con el cortocircuito: el punto recorre el borde y la entrada es una reactancia pura (principio de los stubs).</p>`,
    init(el) {
      this.el = el;
      this.ch = new SmithChart(q(el, '.chart-host'), { labels: true, phaseScale: true, wlScale: true, point: true, vswr: true, coords: true });
      this.loadDot = this.ch.addDot({ re: 0, im: 0 }, '#fb923c', '', 2.2);
      const svg = q(el, 'svg.ln');
      this.svg = svg;
      // Línea: carga a la derecha (x = 780). 0.5λ = 680 px.
      this.xL = 780; this.px = 680 / 0.5;
      SL.lineDiagram(svg, { x0: 100, x1: 780, y: 160, gap: 36, z0y: 205, z0Label: '', srcLabel: '', loadLabel: '' });
      const tf = E('text', { x: 40, y: 125, 'text-anchor': 'middle', class: 'lbl' }, svg); tf.textContent = 'FUENTE';
      const tc = E('text', { x: 810, y: 125, 'text-anchor': 'middle', class: 'lbl lbl-w' }, svg); tc.textContent = 'CARGA';
      for (let i = 0; i <= 10; i++) {
        const x = this.xL - i * 0.05 * this.px;
        E('line', { x1: x, y1: 182, x2: x, y2: i % 5 ? 188 : 194, stroke: '#6b7f9b' }, svg);
        if (i % 5 === 0) { const t = E('text', { x, y: 208, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:12px' }, svg); t.textContent = (i * 0.05).toFixed(2) + 'λ'; }
      }
      const te = E('text', { x: 100, y: 18, class: 'lbl', style: 'fill:#c4b5fd' }, svg); te.textContent = 'ENVOLVENTE DE TENSIÓN |V(d)|';
      this.env = E('path', { class: 'wave-env', style: 'stroke-dasharray:none;stroke-width:2.5' }, svg);
      this.cursor = E('line', { y1: 24, y2: 178, stroke: '#22e4ff', 'stroke-width': 2, 'stroke-dasharray': '4 3' }, svg);
      this.cdot = E('circle', { r: 6, fill: '#22e4ff', style: 'filter: drop-shadow(0 0 6px #22e4ff)' }, svg);
      this.clbl = E('text', { 'text-anchor': 'middle', class: 'lbl lbl-w', style: 'font-size:13px' }, svg);
      this.fd = SL.bindField(el, 'd15', () => this.update());
      this.sel = q(el, '[data-k2="load"]');
      this.sel.addEventListener('change', () => this.setLoad());
      this.playBtn = q(el, '[data-act="play"]');
      this.playBtn.addEventListener('click', () => this.setPlaying(!this.playing));
      q(el, '[data-act="reset"]').addEventListener('click', () => { this.setPlaying(false); this.fd.set(0); });
      this.setLoad();
    },
    setPlaying(p) {
      this.playing = p;
      this.playBtn.innerHTML = p ? '❚❚ Pausa' : '▶ Mover';
      this.playBtn.classList.toggle('on', p);
    },
    setLoad() {
      const [R, X] = this.sel.value.split(',').map(Number);
      this.zL = { re: R / 50, im: X / 50 };
      this.gL = RF.zToGamma(this.zL);
      this.loadDot.set(this.gL);
      const m = Cx.abs(this.gL);
      const y0 = 160 - 18, A = 46;
      this.env.setAttribute('d', Anim.curve(x => {
        const d = (this.xL - x) / this.px;
        const g = RF.gammaAtDistance(this.gL, d);
        return y0 - A * Cx.abs({ re: 1 + g.re, im: g.im }) + 0;
      }, 100, this.xL, 200));
      this.update();
    },
    update() {
      const el = this.el, d = this.fd.get();
      const g = RF.gammaAtDistance(this.gL, d);
      const a = RF.analyzeGamma(g, 50);
      this.ch.setGamma(g);
      this.ch.clearTraces();
      const pts = [];
      const N = Math.max(2, Math.ceil(d * 400));
      for (let i = 0; i <= N; i++) pts.push(RF.gammaAtDistance(this.gL, d * i / N));
      if (d > 0) this.ch.drawTrace(pts, 'sc-trace');
      const x = this.xL - d * this.px;
      const y = 142 - 46 * Cx.abs({ re: 1 + g.re, im: g.im });
      this.cursor.setAttribute('x1', x); this.cursor.setAttribute('x2', x);
      this.cdot.setAttribute('cx', x); this.cdot.setAttribute('cy', y);
      this.clbl.setAttribute('x', Math.max(130, x)); this.clbl.setAttribute('y', 40);
      this.clbl.textContent = `d = ${d.toFixed(3)}λ`;
      SL.set(el, 'zin', a.open ? '∞' : fmtC(a.z, 3));
      SL.set(el, 'Zin', a.open ? '∞' : fmtC(a.Z, 1) + '<span class="u">Ω</span>');
      SL.set(el, 'ph', fmt(a.phase, 1) + '<span class="u">°</span>');
      SL.set(el, 'm', fmt(a.mag, 3));
      SL.set(el, 'bd', fmt(720 * d, 1) + '<span class="u">°</span>');
      SL.set(el, 'vswr', a.vswr === Infinity ? '∞' : fmt(a.vswr, 2));
    },
    enter() {
      Anim.loop((t, dt) => {
        if (!this.playing || dt === 0) return;
        let d = this.fd.get() + dt * 0.04;
        if (d > 0.5) d -= 0.5;
        this.fd.set(d);
      });
    },
    leave() { this.setPlaying(false); },
  });

  /* ===================================================================
     16. ADAPTACIÓN DE IMPEDANCIAS
     =================================================================== */
  const MATCH_LOADS = [[20, 0], [25, -20], [15, 10]];
  SLIDES.push({
    section: 'Líneas y adaptación',
    title: 'Adaptación de impedancias',
    trans: 'slide',
    html: `
      ${head('05 · Líneas y adaptación', 'Adaptación de impedancias')}
      <div class="content" style="grid-template-columns: 1fr 600px">
        <div class="col">
          <div class="row rv left" style="gap:18px">
            <div class="eq big"><i>Z</i><sub>L</sub> = <i>Z</i><sub>0</sub> ⇒ Γ = 0</div>
            <p class="small" style="margin:0; max-width:420px">En una línea de 50 Ω, la carga ideal es <b class="hl">50 + j0 Ω</b>. Adaptar es insertar una red sin pérdidas que lleve la impedancia vista <b>al centro de la carta</b>.</p>
          </div>
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 12px">
            <div class="card rv"><h3>Transformador de λ/4</h3><p>Tramo de línea de λ/4 con <i>Z</i>₁ = √(<i>Z</i>₀·<i>R</i><sub>L</sub>). Para cargas resistivas.</p></div>
            <div class="card rv"><h3>Redes LC (red L)</h3><p>Un elemento en serie y otro en paralelo. Recorre círculos de r y de g constantes.</p></div>
            <div class="card rv"><h3>Stub en cortocircuito</h3><p>Tramo de línea terminado en corto que aporta una susceptancia pura en paralelo.</p></div>
            <div class="card rv"><h3>Stub en circuito abierto</h3><p>Igual, terminado en abierto. Muy usado en microstrip (no necesita vías a tierra).</p></div>
          </div>
          <div class="callout orange rv" style="font-size:17px">La solución depende de la <b>frecuencia</b>, de la <b>impedancia de la carga</b> y de la <b>estructura de la red</b>: una red calculada para una frecuencia solo adapta en una banda alrededor de ella.</div>
          <div class="panel rv" style="padding:10px 14px">
            <div class="panel-label">Red L calculada · Z₀ = 50 Ω · f = 1 GHz</div>
            <div class="readouts" style="grid-template-columns: repeat(3, 1fr)">${ro('Serie (x<sub>s</sub>)', 'xs', 'violet')}${ro('Paralelo (b)', 'b', 'turq')}${ro('|Γ| final', 'gf')}</div>
          </div>
        </div>
        <div class="col">
          <div class="row rv right" style="justify-content:center">
            ${MATCH_LOADS.map(([R, X], i) => `<button class="btn sm" data-ml="${i}">Z<sub>L</sub> = ${fmtC({ re: R, im: X }, 0)} Ω</button>`).join('')}
          </div>
          <div class="center rv zoom"><div class="chart-host" style="width:540px;height:540px"></div></div>
          <div class="status info rv right" data-k="cap" style="font-size:16px; min-height:52px"></div>
          <div class="row rv right" style="justify-content:center"><button class="btn primary" data-act="anim">▶ Animar adaptación</button></div>
        </div>
      </div>`,
    notes: `
      <p><strong>Concepto:</strong> adaptar es conseguir que la impedancia vista desde la línea sea igual a Z₀, para que Γ = 0 y toda la potencia disponible llegue a la carga. Se hace con elementos que idealmente no disipan potencia: inductores, capacitores o tramos de línea.</p>
      <p><strong>Técnicas:</strong> transformador de λ/4 (Z₁ = √(Z₀·R<sub>L</sub>), solo para cargas resistivas), redes L con componentes concentrados, y stubs en cortocircuito o en abierto (tramos de línea que aportan una reactancia o susceptancia pura).</p>
      <p><strong>Animación (red L):</strong> elegir una carga y pulsar "Animar adaptación".</p>
      <ol>
        <li>Un elemento en <em>serie</em> solo cambia x, así que el punto se mueve sobre su círculo de r constante (violeta) hasta cortar el círculo de conductancia g = 1 (ámbar, discontinuo).</li>
        <li>Un elemento en <em>paralelo</em> solo cambia la susceptancia b, así que el punto se mueve sobre el círculo g = 1 hasta el centro.</li>
      </ol>
      <p>Los valores de x<sub>s</sub> y b, y los componentes equivalentes a 1 GHz, los calcula la aplicación; el |Γ| final verifica que la adaptación se consiguió. Existe una segunda solución con signos opuestos. Recordar que esta red adapta exactamente solo a la frecuencia de diseño.</p>`,
    init(el) {
      this.el = el;
      this.ch = new SmithChart(q(el, '.chart-host'), { labels: true, point: true, coords: false });
      this.btns = qa(el, '[data-ml]');
      this.btns.forEach(b => b.addEventListener('click', () => this.setLoad(+b.dataset.ml)));
      q(el, '[data-act="anim"]').addEventListener('click', () => this.run());
      this.setLoad(0);
    },
    setLoad(i) {
      this.token = (this.token || 0) + 1;
      SL.activate(this.btns, this.btns[i]);
      const [R, X] = MATCH_LOADS[i];
      this.zL = { re: R / 50, im: X / 50 };
      this.net = RF.lNetworkSeriesFirst(this.zL);
      const ch = this.ch, f = 1e9, Z0 = 50;
      ch.clearHighlight(); ch.clearTraces(); ch.clearDots();
      ch.setParts({ point: true, vector: false });
      ch.setZ(this.zL);
      ch.addDot(RF.zToGamma(this.zL), '#fb923c', 'Z_L', 2);
      const Xs = this.net.xs * Z0, Bs = this.net.b / Z0;
      const cs = RF.reactanceToComponent(Xs, f), cp = RF.susceptanceToComponent(Bs, f);
      SL.set(this.el, 'xs', `${fmt(this.net.xs, 3)}<div class="tiny muted">${cs.type === 'L' ? 'L = ' + RF.fmtEng(cs.value, 'H') : 'C = ' + RF.fmtEng(cs.value, 'F')}</div>`);
      SL.set(this.el, 'b', `${fmt(this.net.b, 3)}<div class="tiny muted">${cp.type === 'C' ? 'C = ' + RF.fmtEng(cp.value, 'F') : 'L = ' + RF.fmtEng(cp.value, 'H')}</div>`);
      const zEnd = RF.addShuntSusceptance(RF.addSeriesReactance(this.zL, this.net.xs), this.net.b);
      this.gFinal = Cx.abs(RF.zToGamma(zEnd));
      SL.set(this.el, 'gf', '—');
      SL.set(this.el, 'cap', `Carga: z<sub>L</sub> = ${fmtC(this.zL, 2)} · |Γ| = ${fmt(Cx.abs(RF.zToGamma(this.zL)), 3)}. Pulsa <b>Animar adaptación</b>.`);
    },
    async run() {
      const tok = this.token = (this.token || 0) + 1;
      const ch = this.ch, zL = this.zL, net = this.net, cap = k(this.el, 'cap');
      ch.clearHighlight(); ch.clearTraces();
      ch.setZ(zL);
      const alive = () => tok === this.token && App.idx === SLIDES.indexOf(this);
      // Paso 1: elemento serie → círculo r constante
      ch.highlightR(zL.re, 'r');
      ch.highlightG(1, 'g');
      cap.className = 'status info';
      cap.innerHTML = `<b>1. Elemento en serie</b> (x<sub>s</sub> = ${fmt(net.xs, 3)}): el punto se desplaza por el círculo <b class="hl2">r = ${fmt(zL.re, 2)}</b> hasta el círculo <b style="color:#fbbf24">g = 1</b>.`;
      await Anim.wait(700); if (!alive()) return;
      const pts1 = [];
      await new Promise(res => Anim.tween(1500, t => {
        const z = RF.addSeriesReactance(zL, net.xs * t);
        const g = RF.zToGamma(z); pts1.push(g); ch.setGamma(g);
      }, res));
      if (!alive()) return;
      ch.drawTrace(pts1.length > 1 ? pts1 : [RF.zToGamma(zL), RF.zToGamma(net.z1)], 'sc-trace violet');
      await Anim.wait(500); if (!alive()) return;
      // Paso 2: elemento paralelo → círculo g = 1
      cap.innerHTML = `<b>2. Elemento en paralelo</b> (b = ${fmt(net.b, 3)}): el punto recorre el círculo <b style="color:#fbbf24">g = 1</b> hasta el centro.`;
      const pts2 = [];
      await new Promise(res => Anim.tween(1500, t => {
        const z = RF.addShuntSusceptance(net.z1, net.b * t);
        const g = RF.zToGamma(z); pts2.push(g); ch.setGamma(g);
      }, res));
      if (!alive()) return;
      ch.drawTrace(pts2.length > 1 ? pts2 : [RF.zToGamma(net.z1), { re: 0, im: 0 }], 'sc-trace');
      SL.set(this.el, 'gf', fmt(this.gFinal, 4));
      cap.className = this.gFinal < 0.01 ? 'status ok' : 'status mid';
      cap.innerHTML = this.gFinal < 0.01
        ? `<b>Adaptado:</b> |Γ| = ${fmt(this.gFinal, 4)} a la frecuencia de diseño. La impedancia vista es Z₀ = 50 Ω.`
        : `|Γ| final = ${fmt(this.gFinal, 4)}: la red no consigue adaptación completa.`;
    },
    leave() { this.token = (this.token || 0) + 1; },
  });
})();
