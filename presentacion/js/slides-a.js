/* =====================================================================
   slides-a.js — Diapositivas 1 a 8
   Inicio · Introducción · Fundamentos · Construcción de la carta
   ===================================================================== */
(function () {
  'use strict';
  const { frac, head, ro, field, q, qa, k, icon } = SL;
  const E = SmithChart.el;
  const fmt = RF.fmt, fmtC = RF.fmtC;

  /* ===================================================================
     1. PORTADA
     =================================================================== */
  SLIDES.push({
    section: 'Inicio',
    title: 'Portada',
    trans: 'blur',
    cls: 'cover',
    html: `
      <div class="cover-chart"></div>
      <svg class="cover-line" viewBox="0 0 1600 150" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="cvFade" x1="0" x2="1">
            <stop offset="0" stop-color="#22e4ff" stop-opacity="0"/>
            <stop offset=".15" stop-color="#22e4ff" stop-opacity=".9"/>
            <stop offset=".85" stop-color="#22e4ff" stop-opacity=".9"/>
            <stop offset="1" stop-color="#22e4ff" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <line x1="0" y1="38" x2="1600" y2="38" stroke="url(#cvFade)" stroke-width="2" opacity=".55"/>
        <line x1="0" y1="112" x2="1600" y2="112" stroke="url(#cvFade)" stroke-width="2" opacity=".55"/>
        <path class="cv-wave" fill="none" stroke="url(#cvFade)" stroke-width="3"/>
        <path class="cv-wave2" fill="none" stroke="#a78bfa" stroke-width="1.5" opacity=".45"/>
        <g class="cv-particles"></g>
      </svg>
      <div class="cover-main">
        <div class="kicker rv left">Ingeniería Electrónica · Líneas de transmisión · Radiofrecuencia</div>
        <div class="rv glowin" style="--i:1"><h1 class="cover-title">CARTA DE SMITH</h1></div>
        <p class="cover-sub rv" style="--i:4">El lenguaje gráfico de las impedancias y las ondas reflejadas</p>
        <p class="cover-sub2 rv" style="--i:5">Análisis de impedancias, coeficiente de reflexión y adaptación en líneas de transmisión.</p>
      </div>
      <div class="cover-team">
        <div class="member rv" style="--i:8"><span class="dot"></span>SHARON MAWENZY MARTINEZ</div>
        <div class="member rv" style="--i:9"><span class="dot"></span>BRAYAN STIVEN CORREA</div>
        <div class="member rv" style="--i:10"><span class="dot"></span>FABIAN STEVEN VARGAS</div>
      </div>`,
    notes: `
      <p><strong>Apertura (≈1 min).</strong> Saludo y presentación del equipo: Sharon Mawenzy Martínez, Brayan Stiven Correa y Fabián Steven Vargas.</p>
      <p>Mientras la carta se dibuja en el fondo, explicar el objetivo: <em>entender cómo se comporta una señal de radiofrecuencia cuando viaja por una línea y llega a una carga</em>, y cómo una herramienta gráfica —la Carta de Smith— permite analizar y corregir ese comportamiento.</p>
      <p>La onda que recorre la parte inferior representa la señal que se propaga por una línea de transmisión. El punto que gira sobre la carta muestra algo que veremos más adelante: al desplazarnos por una línea, la impedancia "da vueltas" sobre la carta.</p>
      <p>Hoja de ruta: 1) el problema de las reflexiones, 2) fundamentos (impedancia y líneas), 3) construcción de la carta, 4) coeficiente de reflexión y VSWR, 5) desplazamiento y adaptación, 6) aplicaciones en antenas, microstrip y S11, 7) conclusiones.</p>
      `,
    init(el) {
      this.chart = new SmithChart(q(el, '.cover-chart'), { labels: false, phaseScale: false, point: true, vector: true, vswr: true, hidden: true });
      const pg = q(el, '.cv-particles');
      this.parts = [];
      for (let i = 0; i < 46; i++) {
        this.parts.push({ c: E('circle', { r: 1.5 + Math.random() * 2.2, fill: i % 5 ? '#22e4ff' : '#c4b5fd', opacity: 0.4 + Math.random() * 0.6 }, pg), x: Math.random() * 1600, s: 120 + Math.random() * 160, ph: Math.random() * 6 });
      }
      this.wave = q(el, '.cv-wave');
      this.wave2 = q(el, '.cv-wave2');
    },
    enter() {
      if (this.cancel) this.cancel();
      this.cancel = this.chart.build(['unit', 'axis', 'rcircles', 'xarcs', 'center'], 550);
      const k = 2 * Math.PI / 260, w = k * 220;
      Anim.loop((t) => {
        this.wave.setAttribute('d', Anim.curve(x => 75 - 24 * Math.sin(w * t - k * x), 0, 1600, 240));
        this.wave2.setAttribute('d', Anim.curve(x => 75 - 12 * Math.sin(w * t * 0.7 - k * 1.6 * x + 1), 0, 1600, 240));
        for (const p of this.parts) {
          const x = (p.x + p.s * t) % 1600;
          p.c.setAttribute('cx', x.toFixed(1));
          p.c.setAttribute('cy', (75 - 24 * Math.sin(w * t - k * x) + 6 * Math.sin(p.ph + t)).toFixed(1));
        }
        // Punto girando en un círculo de |Γ| = 0.5 (desplazamiento hacia el generador)
        this.chart.setGamma(Cx.polar(0.5, 0.6 - t * 0.6), { silent: true });
      });
    },
    leave() { if (this.cancel) this.cancel(); },
  });

  /* ===================================================================
     2. EL PROBLEMA DE LAS REFLEXIONES
     =================================================================== */
  SLIDES.push({
    section: 'Introducción',
    title: 'El problema de las reflexiones',
    trans: 'slide',
    html: `
      ${head('01 · Introducción', '¿Qué sucede cuando una señal encuentra una impedancia diferente?')}
      <div class="content" style="grid-template-rows: 300px 1fr; gap: 18px">
        <div class="panel glow rv zoom" style="padding:6px 10px">
          <svg class="diagram tl" viewBox="0 0 1452 290" width="100%" height="100%"></svg>
        </div>
        <div style="display:grid; grid-template-columns: 1.05fr 0.95fr 0.9fr; gap: 20px; min-height:0">
          <div class="panel rv">
            <div class="panel-label">Escenario</div>
            <div class="seg" style="margin-bottom:12px">
              <button class="btn" data-scn="match">Carga adaptada · Z<sub>L</sub> = 50 Ω</button>
              <button class="btn orange" data-scn="mis">Carga desadaptada · Z<sub>L</sub> = 150 Ω</button>
            </div>
            <p class="small" data-k="expl" style="margin:4px 0 10px"></p>
            <button class="btn sm" data-act="replay">↻ Repetir propagación</button>
          </div>
          <div class="panel rv">
            <div class="panel-label">Balance de potencia <span class="muted">(línea sin pérdidas)</span></div>
            <div class="pbar"><span>Incidente</span><div class="meter"><span style="width:100%"></span></div><b>100 %</b></div>
            <div class="pbar"><span>Entregada a la carga</span><div class="meter"><span data-k="mDel"></span></div><b data-k="pDel"></b></div>
            <div class="pbar"><span>Reflejada</span><div class="meter orange"><span data-k="mRef"></span></div><b data-k="pRef"></b></div>
            <div class="readouts" style="margin-top:12px">${ro('Γ en la carga', 'g')}${ro('|Γ|', 'm', 'orange')}</div>
          </div>
          <div class="callout violet rv center" style="font-size:27px; line-height:1.3; font-family: var(--font-title); text-align:center">
            <div>¿Estamos aprovechando realmente <span class="hl">toda la potencia</span> que entrega la fuente?</div>
          </div>
        </div>
      </div>`,
    notes: `
      <p><strong>Idea central:</strong> una línea de transmisión tiene una impedancia característica Z₀ (aquí 50 Ω). Cuando la señal llega a una carga con una impedancia diferente, <em>no toda la onda puede ser absorbida</em>: una parte se transmite a la carga y otra parte se refleja y regresa hacia la fuente.</p>
      <p><strong>Demostración:</strong> pulsar <em>Carga adaptada</em>: la onda incidente (cian) viaja hasta la carga y no aparece onda reflejada; toda la potencia incidente se entrega. Luego pulsar <em>Carga desadaptada</em> (150 Ω): cuando la onda llega a la carga aparece una onda reflejada (naranja) que regresa. Con Γ = (150 − 50)/(150 + 50) = 0,5, se refleja |Γ|² = 25 % de la potencia y llega a la carga el 75 %.</p>
      <p><strong>Analogía:</strong> una onda en una cuerda que pasa a otra cuerda más gruesa: parte continúa y parte rebota. Si las cuerdas son iguales (adaptadas), no hay rebote.</p>
      <p>Cerrar con la pregunta: <em>¿estamos aprovechando toda la potencia?</em> Esa pregunta motiva toda la presentación: necesitamos una herramienta para analizar y corregir estas reflexiones.</p>`,
    init(el) {
      const svg = q(el, 'svg.tl');
      this.d = SL.lineDiagram(svg, { x0: 170, x1: 1260, y: 145, gap: 76, z0y: 150, z0Label: 'LÍNEA DE TRANSMISIÓN · Z₀ = 50 Ω' });
      this.x0 = 170; this.x1 = 1260;
      this.inc = E('path', { class: 'wave-inc' }, svg);
      this.ref = E('path', { class: 'wave-ref' }, svg);
      const t1 = E('text', { x: 720, y: 22, 'text-anchor': 'middle', class: 'lbl', fill: '#22e4ff', style: 'fill:#22e4ff' }, svg); t1.textContent = 'ONDA INCIDENTE  →';
      this.refLbl = E('text', { x: 720, y: 284, 'text-anchor': 'middle', class: 'lbl', style: 'fill:#fb923c' }, svg);
      this.btns = qa(el, '[data-scn]');
      this.btns.forEach(b => b.addEventListener('click', () => this.setScenario(b.dataset.scn)));
      q(el, '[data-act="replay"]').addEventListener('click', () => { this.t0 = Anim.time; });
      this.setScenario('mis');
    },
    setScenario(s) {
      this.scn = s;
      SL.activate(this.btns, this.btns.find(b => b.dataset.scn === s));
      const ZL = s === 'match' ? 50 : 150;
      const a = RF.analyzeLoad({ re: ZL, im: 0 }, 50);
      this.gamma = a.gamma;
      this.t0 = Anim.time;
      const root = this.d.g.ownerSVGElement.closest('.slide');
      SL.set(root, 'g', fmtC(a.gamma, 2));
      SL.set(root, 'm', fmt(a.mag, 2));
      SL.set(root, 'pDel', fmt(a.pDeliv, 0) + ' %');
      SL.set(root, 'pRef', fmt(a.pRefl, 0) + ' %');
      k(root, 'mDel').style.width = a.pDeliv + '%';
      k(root, 'mRef').style.width = a.pRefl + '%';
      SL.set(root, 'expl', s === 'match'
        ? '<span class="good">Z<sub>L</sub> = Z<sub>0</sub>:</span> la carga “se parece” a la línea. La onda se absorbe por completo y <b>no hay onda reflejada</b> (Γ = 0).'
        : '<span class="warn">Z<sub>L</sub> ≠ Z<sub>0</sub>:</span> la discontinuidad en la carga devuelve parte de la onda. Γ = (150 − 50)/(150 + 50) = <b>0,5</b>.');
      const col = s === 'match' ? '#3cf7a6' : '#fb923c';
      this.d.box.setAttribute('stroke', col);
      this.d.zig.setAttribute('stroke', col);
      this.d.loadLabel.textContent = `CARGA  Z_L = ${ZL} Ω`;
      this.refLbl.textContent = s === 'match' ? 'SIN ONDA REFLEJADA (Γ = 0)' : '←  ONDA REFLEJADA';
    },
    enter() {
      this.t0 = Anim.time;
      const v = 360, k2 = 2 * Math.PI / 170, w = k2 * v, A = 24;
      const x0 = this.x0, x1 = this.x1, Lp = x1 - x0;
      Anim.loop((t) => {
        // Sin animaciones se muestra directamente el régimen establecido
        const tau = Anim.enabled ? t - this.t0 : 1e3;
        const front = Math.min(x1, x0 + v * tau);
        this.inc.setAttribute('d', front > x0 + 1 ? Anim.curve(x => 62 - A * Math.sin(w * t - k2 * (x - x0)), x0, front, Math.max(2, Math.round((front - x0) / 6))) : '');
        const mag = Cx.abs(this.gamma), ph = Cx.arg(this.gamma);
        if (mag > 1e-6 && tau > Lp / v) {
          const rf = Math.max(x0, x1 - v * (tau - Lp / v));
          this.ref.setAttribute('d', Anim.curve(x => 228 - A * mag * Math.sin(w * t + k2 * (x - x0) - 2 * k2 * Lp + ph), rf, x1, Math.max(2, Math.round((x1 - rf) / 6))));
        } else this.ref.setAttribute('d', '');
        const hit = tau > Lp / v;
        this.d.box.setAttribute('fill', hit ? (mag > 0 ? 'rgba(251,146,60,.18)' : 'rgba(60,247,166,.18)') : '#0a1a33');
      });
    },
  });

  /* ===================================================================
     3. ¿QUÉ ES LA CARTA DE SMITH?
     =================================================================== */
  SLIDES.push({
    section: 'Introducción',
    title: '¿Qué es la Carta de Smith?',
    trans: 'zoom',
    html: `
      ${head('01 · Introducción', '¿Qué es la Carta de Smith?')}
      <div class="content" style="grid-template-columns: 380px 1fr 450px; align-items: stretch">
        <div class="col">
          ${[
            ['complex', 'Impedancia compleja', 'Z = R + jX: oposición total de un elemento a la corriente alterna.'],
            ['back', 'Coeficiente de reflexión', 'Γ: fracción compleja de la onda de tensión que regresa.'],
            ['line', 'Línea de transmisión', 'Estructura que guía la energía; se caracteriza por Z₀.'],
            ['target', 'Adaptación', 'Lograr Z<sub>L</sub> = Z₀ para que Γ = 0.'],
            ['swr', 'Onda estacionaria (VSWR)', 'Relación entre los máximos y mínimos de tensión.'],
          ].map(([ic, t, d], i) => `
            <div class="card row rv left" style="--i:${i + 1}; flex-wrap:nowrap; align-items:flex-start">
              <div class="icon-badge">${icon(ic)}</div>
              <div><h3 style="font-size:19px;margin:0">${t}</h3><p>${d}</p></div>
            </div>`).join('')}
        </div>
        <div class="center"><div class="chart-host" style="width:600px;height:600px"></div></div>
        <div class="col">
          <div class="panel rv right">
            <div class="panel-label">Definición</div>
            <p style="margin:0 0 10px">Es una <b>representación gráfica del plano complejo del coeficiente de reflexión Γ</b>, sobre la que se dibujan curvas de <span class="hl2">resistencia</span> y <span class="hl3">reactancia</span> normalizadas constantes.</p>
            <div class="eq sm">Γ = ${frac('<i>z</i> − 1', '<i>z</i> + 1')} <span class="op">,</span> <i>z</i> = ${frac('<i>Z</i>', '<i>Z</i><sub>0</sub>')}</div>
            <p class="small muted" style="margin:10px 0 0">Cada punto de la carta es, al mismo tiempo, un valor de <b>z</b> y un valor de <b>Γ</b>.</p>
          </div>
          <div class="panel rv right">
            <div class="panel-label">Origen</div>
            <p class="small" style="margin:0">Desarrollada por <b>Phillip H. Smith</b> (Bell Telephone Laboratories) y publicada en <b>1939</b> para resolver gráficamente los cálculos de líneas de transmisión sin calculadoras electrónicas.</p>
          </div>
          <div class="callout rv right" style="font-size:19px">La Carta de Smith convierte <b>cálculos complejos de radiofrecuencia</b> en una representación gráfica que facilita el <span class="hl">análisis</span> y el <span class="hl">diseño</span>.</div>
        </div>
      </div>`,
    notes: `
      <p><strong>Qué es:</strong> la Carta de Smith es un diagrama polar del coeficiente de reflexión Γ (un número complejo de módulo ≤ 1 para cargas pasivas). Sobre ese círculo se dibujan curvas de resistencia normalizada constante y de reactancia normalizada constante. Por eso cada punto representa simultáneamente una impedancia normalizada z y su coeficiente de reflexión Γ.</p>
      <p><strong>Ecuación:</strong> Γ = (z − 1)/(z + 1), donde z = Z/Z₀ es la impedancia normalizada. No hace falta memorizarla ahora; la construiremos en la diapositiva 7.</p>
      <p><strong>Conceptos de la izquierda</strong> (presentarlos brevemente, se desarrollan después): impedancia compleja, coeficiente de reflexión, línea de transmisión, adaptación y VSWR.</p>
      <p><strong>Historia:</strong> Phillip H. Smith, ingeniero de Bell Labs, la publicó en 1939. Antes de las computadoras, resolver líneas de transmisión implicaba operar con números complejos y funciones trigonométricas; la carta permitía hacerlo con regla y compás. Hoy sigue presente en analizadores vectoriales de redes (VNA) y simuladores.</p>
      <p>Mientras la carta se construye, señalar: el borde, el eje horizontal, los círculos y los arcos.</p>`,
    init(el) {
      this.chart = new SmithChart(q(el, '.chart-host'), { labels: true, hidden: true });
    },
    enter() {
      if (this.cancel) this.cancel();
      this.cancel = this.chart.build(['unit', 'axis', 'rcircles', 'xarcs', 'labels', 'center'], 700);
    },
    leave() { if (this.cancel) this.cancel(); },
  });

  /* ===================================================================
     4. ¿POR QUÉ ES NECESARIA?
     =================================================================== */
  SLIDES.push({
    section: 'Introducción',
    title: '¿Por qué es necesaria?',
    trans: 'rise',
    html: `
      ${head('01 · Introducción', '¿Por qué es necesaria? Los efectos de la desadaptación')}
      <div class="content" style="grid-template-columns: 1fr 560px">
        <div class="col">
          <div class="panel glow rv zoom" style="padding:8px 12px">
            <svg class="diagram sw" viewBox="0 0 880 300" width="100%" style="display:block"></svg>
            <div class="legend" style="padding:0 10px 6px">
              <span style="--c:#22e4ff">Incidente</span><span style="--c:#fb923c">Reflejada</span>
              <span style="--c:#ffffff">Tensión total</span><span style="--c:#a78bfa">Envolvente |V(d)|</span>
            </div>
          </div>
          <div class="panel rv" style="padding:12px 20px">
            ${field('<i>R</i><sub>L</sub> (Ω)', 'r4', 1, 300, 1, 150)}
            ${field('<i>X</i><sub>L</sub> (Ω)', 'x4', -200, 200, 1, 0)}
            <div class="readouts three" style="margin-top:8px">${ro('|Γ|', 'm')}${ro('VSWR', 'vswr', 'violet')}${ro('Z₀', 'z0', 'turq')}</div>
          </div>
        </div>
        <div class="col">
          ${[
            ['back', 'Potencia reflejada', 'Una fracción |Γ|² de la potencia incidente regresa hacia la fuente.', 'pr'],
            ['bolt', 'Menos potencia en la carga', 'En una línea sin pérdidas: P<sub>L</sub> = P<sub>inc</sub>(1 − |Γ|²).', 'pd'],
            ['swr', 'Ondas estacionarias', 'La suma de ondas crea máximos y mínimos de tensión fijos.', 'sw'],
            ['warn', 'Esfuerzos eléctricos', 'Picos de tensión de hasta (1 + |Γ|)·|V⁺| sobre dieléctricos y transistores.', 'vm'],
            ['heat', 'Eficiencia del sistema', 'El transmisor ve una carga distinta de la de diseño: menor rendimiento y calentamiento.', 'rl'],
          ].map(([ic, t, d, key], i) => `
            <div class="card row rv right prob" data-p="${key}" style="--i:${i + 2}; flex-wrap:nowrap; padding:10px 14px">
              <div class="icon-badge">${icon(ic)}</div>
              <div style="flex:1"><h3 style="font-size:18px;margin:0">${t}</h3><p style="font-size:15px">${d}</p></div>
              <div class="pval" data-k="${key}"></div>
            </div>`).join('')}
          <div class="callout orange rv" style="font-size:16px; --i:8">
            <b>¿Se pierde siempre la potencia reflejada?</b> No necesariamente. Regresa hacia la fuente: si esta está adaptada se disipa en su impedancia interna; si no, vuelve a reflejarse. Lo seguro es que <b>no llega a la carga</b> en ese recorrido; el efecto final depende de cada sistema.
          </div>
        </div>
      </div>`,
    notes: `
      <p><strong>Relación con la diapositiva anterior:</strong> ya vimos que la desadaptación produce una onda reflejada. Ahora cuantificamos sus consecuencias.</p>
      <p><strong>Demostración:</strong> mover el deslizador de R<sub>L</sub>. En 50 Ω (con X = 0) la onda reflejada desaparece, la envolvente es plana y el VSWR vale 1. Al alejarse de 50 Ω crece la onda naranja y la envolvente violeta muestra máximos y mínimos: es la onda estacionaria. Probar también una reactancia (X ≠ 0): aunque R sea 50 Ω, sigue habiendo reflexión.</p>
      <p><strong>Consecuencias:</strong> (1) potencia reflejada |Γ|²; (2) potencia entregada 1 − |Γ|² en una línea ideal; (3) ondas estacionarias; (4) picos de tensión de hasta (1 + |Γ|) veces la amplitud incidente, que pueden dañar componentes o perforar dieléctricos en sistemas de potencia; (5) el amplificador trabaja con una carga distinta de la de diseño.</p>
      <p><strong>Precisión importante:</strong> no decir que la potencia reflejada "siempre se pierde". Regresa a la fuente; lo que le ocurra depende de la fuente y del sistema (puede disiparse, re-reflejarse o, en algunos sistemas, gestionarse con circuladores y aisladores). Lo que sí es cierto es que esa potencia no se entregó a la carga.</p>`,
    init(el) {
      const svg = q(el, 'svg.sw');
      this.svg = svg;
      SL.lineDiagram(svg, { x0: 110, x1: 770, y: 250, gap: 40, z0y: 232, z0Label: '', srcLabel: '', loadLabel: '' });
      this.x0 = 110; this.x1 = 770;
      E('line', { x1: 110, y1: 110, x2: 770, y2: 110, stroke: 'rgba(255,255,255,.12)' }, svg);
      this.env1 = E('path', { class: 'wave-env' }, svg);
      this.env2 = E('path', { class: 'wave-env' }, svg);
      this.inc = E('path', { class: 'wave-inc', style: 'stroke-width:2.2;opacity:.85' }, svg);
      this.ref = E('path', { class: 'wave-ref', style: 'stroke-width:2.2;opacity:.85' }, svg);
      this.tot = E('path', { class: 'wave-tot' }, svg);
      const a = E('text', { x: 800, y: 115, class: 'lbl' }, svg); a.textContent = 'CARGA';
      const b = E('text', { x: 20, y: 115, class: 'lbl' }, svg); b.textContent = 'FUENTE';
      this.cards = qa(el, '.prob');
      const upd = () => this.update(el);
      this.fr = SL.bindField(el, 'r4', upd);
      this.fx = SL.bindField(el, 'x4', upd);
      this.update(el);
    },
    update(el) {
      const ZL = { re: this.fr.get(), im: this.fx.get() };
      const a = RF.analyzeLoad(ZL, 50);
      this.gamma = a.gamma;
      SL.set(el, 'm', fmt(a.mag, 3));
      SL.set(el, 'vswr', fmt(a.vswr, 2));
      SL.set(el, 'z0', SL.unit('50', 'Ω'));
      SL.set(el, 'pr', fmt(a.pRefl, 1) + ' %');
      SL.set(el, 'pd', fmt(a.pDeliv, 1) + ' %');
      SL.set(el, 'sw', 'VSWR ' + fmt(a.vswr, 2));
      SL.set(el, 'vm', fmt(1 + a.mag, 2) + '·V⁺');
      SL.set(el, 'rl', 'RL ' + fmt(a.rl, 1) + ' dB');
      const sev = a.mag > 0.33;
      this.cards.forEach(c => c.classList.toggle('warn-card', sev));
      if (a.active) SL.set(el, 'm', fmt(a.mag, 3) + ' <span class="u">activa</span>');
    },
    enter() {
      const kk = 2 * Math.PI / 280, w = 2 * Math.PI * 0.8, A = 38, base = 110, x1 = this.x1;
      Anim.loop((t) => {
        const g = this.gamma, m = Math.min(1, Cx.abs(g)), ph = Cx.arg(g);
        const zf = x => (x - x1) * kk; // βz (z ≤ 0 en la línea)
        this.inc.setAttribute('d', Anim.curve(x => base - A * Math.cos(w * t - zf(x)), this.x0, x1, 160));
        this.ref.setAttribute('d', Anim.curve(x => base - A * m * Math.cos(w * t + zf(x) + ph), this.x0, x1, 160));
        this.tot.setAttribute('d', Anim.curve(x => base - A * (Math.cos(w * t - zf(x)) + m * Math.cos(w * t + zf(x) + ph)), this.x0, x1, 200));
        const env = x => A * Cx.abs({ re: 1 + m * Math.cos(2 * zf(x) + ph), im: m * Math.sin(2 * zf(x) + ph) });
        this.env1.setAttribute('d', Anim.curve(x => base - env(x), this.x0, x1, 160));
        this.env2.setAttribute('d', Anim.curve(x => base + env(x), this.x0, x1, 160));
      });
    },
  });

  /* ===================================================================
     5. ¿QUÉ ES LA IMPEDANCIA?
     =================================================================== */
  SLIDES.push({
    section: 'Fundamentos',
    title: 'Fundamentos: la impedancia',
    trans: 'slide',
    html: `
      ${head('02 · Fundamentos', '¿Qué es la impedancia?')}
      <div class="content" style="grid-template-columns: 1fr 640px">
        <div class="col">
          <div class="row rv left" style="gap:26px">
            <div class="eq big"><i>Z</i> = <i>R</i> + <i>j</i><i>X</i></div>
            <div class="sym-list">
              <span>Z</span><span>impedancia total (Ω)</span>
              <span>R</span><span>resistencia: disipa energía (Ω)</span>
              <span>X</span><span>reactancia: almacena energía (Ω)</span>
              <span>j</span><span>unidad imaginaria, <i>j</i>² = −1</span>
            </div>
          </div>
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 12px">
            <div class="card rv" data-type="R"><h3><span class="hl">●</span> Resistencia pura</h3><p><i>X</i> = 0 → <i>Z</i> = <i>R</i>. Tensión y corriente en fase. Vector sobre el eje real.</p></div>
            <div class="card rv" data-type="L"><h3><span class="hl2">●</span> Reactancia inductiva</h3><p><i>X<sub>L</sub></i> = ω<i>L</i> &gt; 0. La corriente se atrasa respecto a la tensión. Vector hacia arriba.</p></div>
            <div class="card rv" data-type="C"><h3><span class="hl3">●</span> Reactancia capacitiva</h3><p><i>X<sub>C</sub></i> = −1/(ω<i>C</i>) &lt; 0. La corriente se adelanta. Vector hacia abajo.</p></div>
            <div class="card rv" data-type="Z"><h3><span class="warn">●</span> Impedancia compleja</h3><p><i>R</i> ≠ 0 y <i>X</i> ≠ 0. |<i>Z</i>| = √(<i>R</i>² + <i>X</i>²), θ = arctan(<i>X</i>/<i>R</i>).</p></div>
          </div>
          <div class="callout rv small" style="font-size:18px">La reactancia depende de la frecuencia (ω = 2π<i>f</i>): por eso una misma carga puede estar adaptada a una frecuencia y desadaptada a otra.</div>
        </div>
        <div class="col">
          <div class="panel glow rv zoom" style="padding:8px">
            <svg class="diagram cp" viewBox="0 0 600 420" width="100%" style="display:block"></svg>
          </div>
          <div class="panel rv" style="padding:10px 18px">
            ${field('<i>R</i> (Ω)', 'r5', 0, 100, 1, 50)}
            ${field('<i>X</i> (Ω)', 'x5', -50, 50, 1, 25)}
            <div class="row" style="margin:6px 0 10px">
              <button class="btn sm" data-z="50,0">50 + j0 Ω</button>
              <button class="btn sm violet" data-z="50,25">50 + j25 Ω</button>
              <button class="btn sm" data-z="50,-25" style="border-color:rgba(45,212,191,.6)">50 − j25 Ω</button>
            </div>
            <div class="readouts three">${ro('Z', 'z')}${ro('|Z|', 'mag', 'violet')}${ro('θ', 'th', 'turq')}</div>
          </div>
        </div>
      </div>`,
    notes: `
      <p><strong>Concepto:</strong> la impedancia generaliza la resistencia para corriente alterna. Tiene una parte real, la resistencia R, que disipa energía (se convierte en calor o, en una antena, en radiación), y una parte imaginaria, la reactancia X, que almacena energía en campos magnéticos (inductores) o eléctricos (capacitores) y la devuelve en cada ciclo.</p>
      <p><strong>Signos:</strong> reactancia inductiva X<sub>L</sub> = ωL es positiva; reactancia capacitiva X<sub>C</sub> = −1/(ωC) es negativa. Este signo determinará si el punto queda en la mitad superior o inferior de la Carta de Smith.</p>
      <p><strong>Demostración:</strong> usar los botones de ejemplo: 50 + j0 Ω (vector horizontal, resistiva pura), 50 + j25 Ω (el vector sube: inductiva) y 50 − j25 Ω (baja: capacitiva). Mostrar cómo cambian |Z| y el ángulo θ. Luego mover los deslizadores libremente.</p>
      <p><strong>Analogía:</strong> R es como la fricción (consume energía); X es como un resorte o una masa (almacena y devuelve energía).</p>
      <p>Destacar que X depende de la frecuencia: este hecho explica por qué la adaptación es siempre válida en una banda concreta.</p>`,
    init(el) {
      const svg = q(el, 'svg.cp');
      const O = { x: 60, y: 210 }, s = 3.8;
      this.map = (R, X) => ({ x: O.x + R * s, y: O.y - X * s });
      E('rect', { x: 0, y: 0, width: 600, height: 420, fill: 'none' }, svg);
      E('path', { d: `M ${O.x} 0 V 420 M 0 ${O.y} H 600`, stroke: 'rgba(34,228,255,.5)', 'stroke-width': 1.5 }, svg);
      for (let v = 25; v <= 125; v += 25) {
        E('line', { x1: O.x + v * s, y1: 0, x2: O.x + v * s, y2: 420, stroke: 'rgba(34,228,255,.08)' }, svg);
        const t = E('text', { x: O.x + v * s, y: O.y + 18, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:12px' }, svg); t.textContent = v;
      }
      [-50, -25, 25, 50].forEach(v => {
        E('line', { x1: 0, y1: O.y - v * s, x2: 600, y2: O.y - v * s, stroke: 'rgba(34,228,255,.08)' }, svg);
        const t = E('text', { x: O.x - 8, y: O.y - v * s + 4, 'text-anchor': 'end', class: 'lbl', style: 'font-size:12px' }, svg); t.textContent = (v > 0 ? '+' : '−') + 'j' + Math.abs(v);
      });
      const t1 = E('text', { x: 590, y: O.y - 10, 'text-anchor': 'end', class: 'lbl' }, svg); t1.textContent = 'R (Ω) · EJE REAL';
      const t2 = E('text', { x: O.x + 10, y: 18, class: 'lbl', style: 'fill:#c4b5fd' }, svg); t2.textContent = '+jX · INDUCTIVA';
      const t3 = E('text', { x: O.x + 10, y: 410, class: 'lbl', style: 'fill:#5eead4' }, svg); t3.textContent = '−jX · CAPACITIVA';
      E('rect', { x: O.x, y: 0, width: 540, height: O.y, fill: 'rgba(167,139,250,.04)' }, svg);
      E('rect', { x: O.x, y: O.y, width: 540, height: 420 - O.y, fill: 'rgba(45,212,191,.04)' }, svg);
      const defs = E('defs', null, svg);
      const mk = E('marker', { id: 'arrZ', viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, defs);
      E('path', { d: 'M0 0 L10 5 L0 10 z', fill: '#fff' }, mk);
      this.projR = E('line', { stroke: '#22e4ff', 'stroke-width': 3, opacity: .7 }, svg);
      this.projX = E('line', { stroke: '#a78bfa', 'stroke-width': 3, 'stroke-dasharray': '6 5' }, svg);
      this.arc = E('path', { fill: 'none', stroke: '#fbbf24', 'stroke-width': 2 }, svg);
      this.vec = E('line', { x1: O.x, y1: O.y, stroke: '#fff', 'stroke-width': 3.5, 'marker-end': 'url(#arrZ)', style: 'filter: drop-shadow(0 0 6px #22e4ff)' }, svg);
      this.lbl = E('text', { class: 'lbl lbl-w', style: 'font-size:16px' }, svg);
      this.thl = E('text', { class: 'lbl', style: 'fill:#fbbf24;font-size:14px' }, svg);
      this.O = O;
      this.cards = qa(el, '[data-type]');
      const upd = () => this.draw(el, this.fr.get(), this.fx.get());
      this.fr = SL.bindField(el, 'r5', upd);
      this.fx = SL.bindField(el, 'x5', upd);
      qa(el, '[data-z]').forEach(b => b.addEventListener('click', () => {
        const [R, X] = b.dataset.z.split(',').map(Number);
        const R0 = this.fr.get(), X0 = this.fx.get();
        Anim.tween(700, (t) => {
          this.fr.set(R0 + (R - R0) * t, true); this.fx.set(X0 + (X - X0) * t, true);
          this.draw(el, R0 + (R - R0) * t, X0 + (X - X0) * t);
        }, () => { this.fr.set(R, true); this.fx.set(X, true); this.draw(el, R, X); });
      }));
      this.draw(el, 50, 25);
    },
    draw(el, R, X) {
      const O = this.O, p = this.map(R, X);
      this.vec.setAttribute('x2', p.x); this.vec.setAttribute('y2', p.y);
      this.projR.setAttribute('x1', O.x); this.projR.setAttribute('y1', O.y); this.projR.setAttribute('x2', p.x); this.projR.setAttribute('y2', O.y);
      this.projX.setAttribute('x1', p.x); this.projX.setAttribute('y1', O.y); this.projX.setAttribute('x2', p.x); this.projX.setAttribute('y2', p.y);
      const mag = Math.hypot(R, X), th = Math.atan2(X, R);
      const rr = 46;
      if (mag > 1e-9 && Math.abs(th) > 0.01) {
        const ex = O.x + rr * Math.cos(th), ey = O.y - rr * Math.sin(th);
        this.arc.setAttribute('d', `M ${O.x + rr} ${O.y} A ${rr} ${rr} 0 0 ${th > 0 ? 0 : 1} ${ex} ${ey}`);
      } else this.arc.setAttribute('d', '');
      this.thl.setAttribute('x', O.x + rr + 8); this.thl.setAttribute('y', O.y - (th > 0 ? 8 : -20)); this.thl.textContent = 'θ';
      this.lbl.setAttribute('x', Math.min(p.x + 10, 470)); this.lbl.setAttribute('y', p.y + (X >= 0 ? -10 : 22));
      this.lbl.textContent = `Z = ${fmtC({ re: R, im: X }, 1)} Ω`;
      SL.set(el, 'z', fmtC({ re: R, im: X }, 1) + '<span class="u">Ω</span>');
      SL.set(el, 'mag', fmt(mag, 2) + '<span class="u">Ω</span>');
      SL.set(el, 'th', fmt(th * 180 / Math.PI, 1) + '<span class="u">°</span>');
      const type = Math.abs(X) < 0.5 ? 'R' : (Math.abs(R) < 0.5 ? (X > 0 ? 'L' : 'C') : 'Z');
      this.cards.forEach(c => c.classList.toggle('focus', c.dataset.type === type || (type === 'Z' && c.dataset.type === (X > 0 ? 'L' : 'C'))));
    },
  });

  /* ===================================================================
     6. ¿QUÉ ES UNA LÍNEA DE TRANSMISIÓN?
     =================================================================== */
  SLIDES.push({
    section: 'Fundamentos',
    title: 'Líneas de transmisión',
    trans: 'scan',
    html: `
      ${head('02 · Fundamentos', '¿Qué es una línea de transmisión?')}
      <div class="content" style="grid-template-columns: 1fr 560px">
        <div class="col">
          <div class="panel glow rv zoom" style="padding:6px 10px">
            <svg class="diagram flowsvg" viewBox="0 0 880 200" width="100%" style="display:block"></svg>
          </div>
          <p class="rv" style="margin:0">Estructura que <b>guía la energía electromagnética</b> desde una fuente hasta una carga. A altas frecuencias su longitud es comparable con λ, por lo que tensión y corriente <span class="hl">varían a lo largo de ella</span>.</p>
          <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap: 12px">
            <div class="card rv focus tl-card"><span class="tag" style="float:right">enfoque</span>
              <svg viewBox="0 0 120 80" class="mini"><circle cx="60" cy="40" r="32" fill="#2a3446" stroke="#9fb2cc" stroke-width="3"/><circle cx="60" cy="40" r="25" fill="rgba(45,212,191,.25)"/><circle cx="60" cy="40" r="7" fill="#e8b04a"/></svg>
              <h3>Cable coaxial</h3><p>Conductor interno, dieléctrico y malla. Campos confinados. Z₀ típicas: 50 Ω y 75 Ω.</p></div>
            <div class="card rv tl-card">
              <svg viewBox="0 0 120 80" class="mini"><rect x="20" y="34" width="80" height="12" rx="6" fill="rgba(159,178,204,.25)"/><circle cx="34" cy="40" r="9" fill="#e8b04a"/><circle cx="86" cy="40" r="9" fill="#e8b04a"/></svg>
              <h3>Par de conductores</h3><p>Línea bifilar o par trenzado. Dos conductores paralelos separados por un dieléctrico.</p></div>
            <div class="card rv tl-card">
              <svg viewBox="0 0 120 80" class="mini"><rect x="18" y="20" width="84" height="42" fill="rgba(34,228,255,.06)" stroke="#9fb2cc" stroke-width="4"/><path d="M28 41 q 8 -12 16 0 t 16 0 t 16 0 t 16 0" stroke="#22e4ff" fill="none" stroke-width="2"/></svg>
              <h3>Guía de ondas</h3><p>Tubo metálico hueco. Modos TE/TM con frecuencia de corte; alta potencia en microondas.</p></div>
            <div class="card rv focus tl-card"><span class="tag" style="float:right">enfoque</span>
              <svg viewBox="0 0 120 80" class="mini"><rect x="10" y="52" width="100" height="8" fill="#c27c2c"/><rect x="10" y="34" width="100" height="18" fill="rgba(60,247,166,.22)"/><rect x="46" y="29" width="28" height="5" fill="#e8b04a"/></svg>
              <h3>Microstrip</h3><p>Pista de cobre sobre un sustrato con plano de tierra. Base de los circuitos de RF en PCB.</p></div>
          </div>
        </div>
        <div class="col">
          <div class="panel rv right" style="padding:10px 14px">
            <div class="panel-label">Microstrip · distribución de campos (sección transversal, esquema)</div>
            <svg class="diagram ms" viewBox="0 0 520 290" width="100%" style="display:block"></svg>
            <div class="legend"><span style="--c:#22e4ff">Campo eléctrico E</span><span style="--c:#a78bfa">Campo magnético H</span></div>
          </div>
          <div class="panel rv right">
            <div class="row" style="gap:18px; flex-wrap:nowrap">
              <div class="eq"><i>Z</i><sub>0</sub> = <span style="font-size:1.1em">√</span><span style="border-top:1.5px solid #fff; padding-top:2px">${frac('<i>L</i>′', '<i>C</i>′')}</span></div>
              <div class="sym-list" style="font-size:15px"><span>L′</span><span>inductancia por unidad de longitud</span><span>C′</span><span>capacitancia por unidad de longitud</span></div>
            </div>
            <p class="small" style="margin:10px 0 0"><b>Impedancia característica</b> (línea sin pérdidas): relación V/I de una onda que viaja en un solo sentido. Depende de la <b>geometría y los materiales</b>, no de la longitud. Valor habitual: <span class="hl">Z₀ = 50 Ω</span>.</p>
          </div>
        </div>
      </div>`,
    notes: `
      <p><strong>Qué es:</strong> una línea de transmisión es cualquier estructura que guía energía electromagnética entre dos puntos. Cuando su longitud es comparable con la longitud de onda (en RF y microondas), la tensión y la corriente ya no son iguales en todos los puntos del conductor: viajan como ondas.</p>
      <p><strong>Tipos:</strong> coaxial (el más usado en laboratorios y conexiones de antenas), par de conductores (bifilar o trenzado), guía de ondas (un único conductor hueco, alta potencia) y microstrip (la base de los circuitos de RF impresos). Nos enfocamos en el coaxial y en la microstrip.</p>
      <p><strong>Impedancia característica Z₀:</strong> es el cociente entre tensión y corriente de una onda que viaja en un único sentido. En una línea sin pérdidas Z₀ = √(L′/C′), donde L′ y C′ son la inductancia y la capacitancia por unidad de longitud. Es una propiedad de la geometría y del dieléctrico, no de la longitud del cable. 50 Ω es un valor estándar de compromiso en RF.</p>
      <p><strong>Campos en la microstrip:</strong> el campo eléctrico va de la pista al plano de tierra, concentrado en el sustrato y con una parte en el aire (líneas de borde). El campo magnético rodea la pista. Como una parte del campo está en el aire y otra en el dieléctrico, se usa una permitividad efectiva ε<sub>eff</sub>, que retomaremos en la diapositiva 18.</p>`,
    init(el) {
      // Esquema fuente → línea → carga con partículas de energía
      const svg = q(el, 'svg.flowsvg');
      const box = (x, label, color) => {
        E('rect', { x, y: 60, width: 120, height: 80, rx: 12, fill: '#0a1a33', stroke: color, 'stroke-width': 2.5 }, svg);
        const t = E('text', { x: x + 60, y: 106, 'text-anchor': 'middle', class: 'lbl lbl-w', style: 'font-size:16px' }, svg); t.textContent = label;
      };
      box(20, 'FUENTE', '#22e4ff');
      box(740, 'CARGA', '#3cf7a6');
      E('line', { x1: 140, y1: 78, x2: 740, y2: 78, class: 'conductor' }, svg);
      E('line', { x1: 140, y1: 122, x2: 740, y2: 122, class: 'conductor' }, svg);
      const t = E('text', { x: 440, y: 40, 'text-anchor': 'middle', class: 'lbl', style: 'fill:#22e4ff;font-size:15px' }, svg); t.textContent = 'LÍNEA DE TRANSMISIÓN · Z₀ = 50 Ω  →  energía electromagnética';
      const t2 = E('text', { x: 440, y: 172, 'text-anchor': 'middle', class: 'lbl' }, svg); t2.textContent = 'V(z, t) e I(z, t) varían a lo largo de la línea';
      this.fw = E('path', { class: 'wave-inc', style: 'stroke-width:2.2' }, svg);
      this.dots = [];
      for (let i = 0; i < 18; i++) this.dots.push(E('circle', { r: 3, fill: '#22e4ff', style: 'filter: drop-shadow(0 0 4px #22e4ff)' }, svg));
      // Sección transversal de la microstrip
      const ms = q(el, 'svg.ms');
      E('rect', { x: 10, y: 180, width: 500, height: 70, fill: 'rgba(60,247,166,.13)', stroke: 'rgba(60,247,166,.4)' }, ms);
      E('rect', { x: 10, y: 250, width: 500, height: 12, fill: '#b8742a' }, ms);
      E('rect', { x: 220, y: 170, width: 80, height: 10, fill: '#e8b04a' }, ms);
      const lab = (x, y, s, c = '#9fb2cc') => { const tt = E('text', { x, y, class: 'lbl', style: `fill:${c};font-size:13px` }, ms); tt.textContent = s; };
      lab(16, 244, 'SUSTRATO FR4 · εr'); lab(20, 282, 'PLANO DE TIERRA'); lab(380, 30, 'PISTA DE COBRE (W)', '#e8b04a'); lab(20, 30, 'AIRE · ε0');
      E('path', { d: 'M 378 34 L 290 166', stroke: '#e8b04a', 'stroke-width': 1, opacity: .7 }, ms);
      // Líneas de campo magnético (bucles alrededor de la pista)
      [[60, 40], [105, 72], [155, 108]].forEach(([rx, ry]) => {
        E('ellipse', { cx: 260, cy: 178, rx, ry, fill: 'none', stroke: '#a78bfa', 'stroke-width': 1.6, 'stroke-dasharray': '4 5', class: 'flow slow', opacity: .75 }, ms);
      });
      // Líneas de campo eléctrico: de la pista al plano de tierra
      const ed = [
        'M232 180 V250', 'M248 180 V250', 'M264 180 V250', 'M280 180 V250', 'M296 180 V250',
        'M222 178 Q 190 190 182 250', 'M298 178 Q 330 190 338 250',
        'M222 172 Q 160 150 128 250', 'M298 172 Q 360 150 392 250',
        'M228 170 Q 150 95 70 250', 'M292 170 Q 370 95 450 250',
      ];
      ed.forEach(d => E('path', { d, fill: 'none', stroke: '#22e4ff', 'stroke-width': 1.8, class: 'flow', opacity: .9 }, ms));
    },
    enter() {
      const k2 = 2 * Math.PI / 150, w = k2 * 160;
      Anim.loop((t) => {
        this.fw.setAttribute('d', Anim.curve(x => 100 - 14 * Math.sin(w * t - k2 * x), 140, 740, 150));
        this.dots.forEach((d, i) => {
          const x = 140 + ((i * 600 / 18 + t * 90) % 600);
          d.setAttribute('cx', x); d.setAttribute('cy', i % 2 ? 78 : 122);
          d.setAttribute('opacity', (0.3 + 0.7 * Math.sin(Math.PI * (x - 140) / 600)).toFixed(2));
        });
      });
    },
  });

  /* ===================================================================
     7. CONSTRUCCIÓN DE LA CARTA
     =================================================================== */
  const BUILD_STEPS = [
    { g: ['plane'], t: 'Plano complejo de Γ', d: 'Cada coeficiente de reflexión Γ = Re{Γ} + j·Im{Γ} es un punto del plano.' },
    { g: ['unit'], t: 'Círculo unitario |Γ| = 1', d: 'Las cargas pasivas cumplen |Γ| ≤ 1: toda la carta cabe dentro de este círculo.' },
    { g: ['center'], t: 'Centro: Γ = 0  ↔  z = 1', d: 'Sin reflexión: la carga es igual a Z₀. Es el punto de adaptación.' },
    { g: ['rcircles'], t: 'Círculos de resistencia constante', d: 'Centro (r/(1+r), 0) y radio 1/(1+r). Todos pasan por Γ = 1.' },
    { g: ['xarcs'], t: 'Arcos de reactancia constante', d: 'Centro (1, 1/x) y radio |1/x|. Solo se dibuja la parte interior.' },
    { g: ['axis', 'labels'], t: 'Eje real y valores', d: 'x = 0: resistencias puras, desde el cortocircuito (izquierda) al abierto (derecha).' },
    { g: ['phase'], t: 'Escala de fase de Γ', d: 'El ángulo de Γ se lee en el borde: 0° a la derecha, ±180° a la izquierda.' },
    { g: ['regions'], t: 'Regiones inductiva y capacitiva', d: 'Mitad superior x > 0 (inductiva); mitad inferior x < 0 (capacitiva).' },
  ];

  SLIDES.push({
    section: 'La Carta de Smith',
    title: 'Construcción de la carta',
    trans: 'zoom',
    html: `
      ${head('03 · La Carta de Smith', 'Construcción de la Carta de Smith')}
      <div class="content" style="grid-template-columns: 560px 1fr">
        <div class="col">
          <div class="row rv left" style="gap:12px">
            <div class="eq">Γ = ${frac('<i>z</i> − 1', '<i>z</i> + 1')}</div>
            <div class="eq"><i>z</i> = ${frac('1 + Γ', '1 − Γ')}</div>
          </div>
          <div class="panel rv left" style="padding:8px 12px">
            <ol class="steps build-steps">${BUILD_STEPS.map(s => `<li>${s.t}</li>`).join('')}</ol>
          </div>
          <div class="status info rv left" data-k="cap" style="min-height:56px">Pulsa <b>Construir Carta</b> o avanza paso a paso.</div>
          <div class="row rv left">
            <button class="btn primary" data-act="build">▶ Construir Carta</button>
            <button class="btn" data-act="step">Paso siguiente</button>
            <button class="btn sm" data-act="reset">↺ Reiniciar</button>
          </div>
        </div>
        <div class="center"><div class="chart-host" style="width:660px;height:660px"></div></div>
      </div>`,
    notes: `
      <p><strong>Objetivo:</strong> mostrar que la carta no es un dibujo arbitrario: se obtiene matemáticamente de la transformación Γ = (z − 1)/(z + 1).</p>
      <p><strong>Paso a paso</strong> (usar "Paso siguiente" para controlar el ritmo):</p>
      <ol>
        <li>Partimos del plano complejo de Γ, con ejes Re{Γ} e Im{Γ}.</li>
        <li>Para cargas pasivas |Γ| ≤ 1, así que solo nos interesa el círculo unitario.</li>
        <li>El centro, Γ = 0, corresponde a z = 1: carga igual a Z₀.</li>
        <li>Si fijamos r y variamos x, la transformación produce un círculo de centro (r/(1+r), 0) y radio 1/(1+r). r = 0 es el borde; r = 1 pasa por el centro; r → ∞ se reduce al punto Γ = 1.</li>
        <li>Si fijamos x y variamos r, obtenemos círculos de centro (1, 1/x) y radio |1/x|; solo la parte interior al círculo unitario tiene sentido para cargas pasivas.</li>
        <li>El eje horizontal (x = 0) contiene las resistencias puras: a la izquierda el cortocircuito (Γ = −1) y a la derecha el circuito abierto (Γ = +1).</li>
        <li>En el borde se lee la fase de Γ.</li>
        <li>Mitad superior: reactancias positivas (inductivas). Mitad inferior: negativas (capacitivas).</li>
      </ol>
      <p><strong>Transformación inversa:</strong> z = (1 + Γ)/(1 − Γ) permite pasar de cualquier punto de la carta a su impedancia. Esta transformación (bilineal o de Möbius) convierte rectas y círculos en círculos; por eso la carta está formada solo por circunferencias.</p>`,
    init(el) {
      this.chart = new SmithChart(q(el, '.chart-host'), { labels: true, phaseScale: true, plane: true, regions: true, hidden: true });
      this.items = qa(el, '.build-steps li');
      this.el = el;
      q(el, '[data-act="build"]').addEventListener('click', () => this.auto());
      q(el, '[data-act="step"]').addEventListener('click', () => { this.stopAuto(); this.step(); });
      q(el, '[data-act="reset"]').addEventListener('click', () => this.reset());
      this.reset();
    },
    reset() {
      this.stopAuto();
      this.n = 0;
      this.chart.hideAll();
      this.chart.L.regions.style.display = 'none';
      this.chart.L.plane.style.display = 'none';
      this.items.forEach(li => li.classList.remove('done', 'current'));
      SL.set(this.el, 'cap', 'Pulsa <b>Construir Carta</b> o avanza paso a paso.');
    },
    step() {
      if (this.n >= BUILD_STEPS.length) return false;
      const s = BUILD_STEPS[this.n];
      s.g.forEach(g => this.chart.reveal(g, g === 'rcircles' || g === 'xarcs' ? 1200 : 900, g === 'rcircles' || g === 'xarcs' ? 45 : 0));
      this.items.forEach((li, i) => { li.classList.toggle('done', i < this.n); li.classList.toggle('current', i === this.n); });
      SL.set(this.el, 'cap', `<b>${s.t}.</b> ${s.d}`);
      this.n++;
      return true;
    },
    auto() {
      this.reset();
      const run = () => { if (this.step()) this.timer = setTimeout(run, Anim.enabled ? 1500 : 0); };
      run();
    },
    stopAuto() { clearTimeout(this.timer); },
    leave() { this.stopAuto(); },
  });

  /* ===================================================================
     8. PARTES Y REGIONES
     =================================================================== */
  const PARTS = [
    { id: 'centro', n: 1, t: 'Centro', pin: { re: 0, im: 0 }, d: '<b>z = 1 + j0</b> → Γ = 0. La carga es igual a Z₀: no hay reflexión.' },
    { id: 'borde', n: 2, t: 'Borde', pin: Cx.polar(1, 2.4), d: '<b>|Γ| = 1</b>: reflexión total. Corresponde a r = 0 (reactancias puras, que no disipan potencia).' },
    { id: 'eje', n: 3, t: 'Eje horizontal', pin: { re: -0.5, im: 0 }, d: '<b>x = 0</b>: impedancias puramente resistivas. A la izquierda r < 1; a la derecha r > 1.' },
    { id: 'sup', n: 4, t: 'Mitad superior', pin: { re: 0.32, im: 0.82 }, d: '<b>Im{Γ} > 0</b>: todos los puntos tienen reactancia normalizada positiva, x > 0.' },
    { id: 'inf', n: 5, t: 'Mitad inferior', pin: { re: 0.32, im: -0.82 }, d: '<b>Im{Γ} < 0</b>: todos los puntos tienen reactancia normalizada negativa, x < 0.' },
    { id: 'rc', n: 6, t: 'Círculos de resistencia', pin: { re: 0.5, im: 0.5 }, d: 'Cada círculo reúne los puntos con la <b>misma r</b>. Centro (r/(1+r), 0), radio 1/(1+r). Todos se tocan en Γ = 1.' },
    { id: 'xa', n: 7, t: 'Arcos de reactancia', pin: RF.zToGamma({ re: 0.35, im: 1 }), d: 'Cada arco reúne los puntos con la <b>misma x</b>. Centro (1, 1/x), radio |1/x|. Arcos superiores x > 0, inferiores x < 0.' },
    { id: 'ind', n: 8, t: 'Región inductiva', pin: { re: -0.62, im: 0.3 }, d: 'x > 0: la carga se comporta como una resistencia en serie con una <b>inductancia</b> (X = ωL).' },
    { id: 'cap', n: 9, t: 'Región capacitiva', pin: { re: -0.62, im: -0.3 }, d: 'x < 0: la carga se comporta como una resistencia en serie con una <b>capacitancia</b> (X = −1/ωC).' },
    { id: 'match', n: 10, t: 'Punto de adaptación', pin: null, d: 'Objetivo del diseño: llevar la impedancia al centro. Equivale a Z<sub>L</sub> = Z₀ (50 Ω solo si Z₀ = 50 Ω).' },
    { id: 'sc', n: 11, t: 'Cortocircuito', pin: { re: -1, im: 0 }, d: '<b>z = 0</b> → Γ = −1 (extremo izquierdo). Reflexión total con inversión de fase.' },
    { id: 'oc', n: 12, t: 'Circuito abierto', pin: { re: 1, im: 0 }, d: '<b>z → ∞</b> → Γ = +1 (extremo derecho). Reflexión total sin inversión de fase.' },
  ];

  SLIDES.push({
    section: 'La Carta de Smith',
    title: 'Partes y regiones de la carta',
    trans: 'rise',
    html: `
      ${head('03 · La Carta de Smith', 'Partes y regiones de la Carta de Smith')}
      <div class="content" style="grid-template-columns: 1fr 600px">
        <div class="center rv zoom"><div class="chart-host" style="width:650px;height:650px"></div></div>
        <div class="col">
          <p class="small muted rv right" style="margin:0">Selecciona una etiqueta (o un número sobre la carta):</p>
          <div class="parts-grid rv right">
            ${PARTS.map(p => `<button class="btn sm part-btn" data-part="${p.id}"><span class="pn">${p.n}</span>${p.t}</button>`).join('')}
          </div>
          <div class="panel glow rv right" style="min-height:150px">
            <div class="panel-label" data-k="pt">Explicación</div>
            <p data-k="pd" style="margin:0;font-size:20px">Cada zona de la carta tiene un significado físico. Selecciona una etiqueta para resaltarla.</p>
          </div>
          <div class="readouts rv right">
            ${ro('Centro', 'c1', 'turq')}${ro('Borde', 'c2', 'orange')}
          </div>
        </div>
      </div>`,
    notes: `
      <p><strong>Objetivo:</strong> que el público aprenda a "leer" la carta. Seleccionar las etiquetas en orden y comentar cada una.</p>
      <ul>
        <li><strong>Centro:</strong> z = 1 + j0, Γ = 0. Adaptación perfecta.</li>
        <li><strong>Borde:</strong> |Γ| = 1, reflexión total. Allí r = 0: solo hay reactancias, que no consumen potencia, así que todo se refleja.</li>
        <li><strong>Eje horizontal:</strong> resistencias puras. Recorrerlo de izquierda a derecha: cortocircuito (z = 0), r = 0,5, centro (r = 1), r = 2, circuito abierto.</li>
        <li><strong>Mitades:</strong> la superior es inductiva (x &gt; 0) y la inferior capacitiva (x &lt; 0). Error típico: invertir los signos.</li>
        <li><strong>Círculos y arcos:</strong> el punto de una carga es la intersección de su círculo r con su arco x.</li>
        <li><strong>Cortocircuito y circuito abierto:</strong> extremos izquierdo y derecho; ambos con reflexión total, pero con fase de 180° y 0° respectivamente.</li>
      </ul>
      <p><strong>Advertencia:</strong> el centro representa Z = Z₀. Si el sistema fuera de 75 Ω, el centro sería 75 Ω, no 50 Ω.</p>`,
    init(el) {
      const ch = this.chart = new SmithChart(q(el, '.chart-host'), { labels: true, regions: true });
      this.el = el;
      // Pines numerados sobre la carta
      const pins = E('g', null, ch.svg);
      PARTS.forEach(p => {
        if (!p.pin) return;
        const xy = SmithChart.toXY(p.pin);
        const g = E('g', { class: 'pin', 'data-part': p.id, transform: `translate(${xy.x} ${xy.y})`, style: 'cursor:pointer' }, pins);
        E('circle', { r: 4.6, fill: '#0a1830', stroke: '#22e4ff', 'stroke-width': .8 }, g);
        const t = E('text', { y: 1.6, 'text-anchor': 'middle', style: 'font: 600 4.4px var(--font-mono); fill:#fff' }, g);
        t.textContent = p.n;
      });
      this.btns = qa(el, '.part-btn');
      this.btns.forEach(b => b.addEventListener('click', () => this.select(b.dataset.part)));
      qa(el, 'g.pin').forEach(g => g.addEventListener('click', (e) => { e.stopPropagation(); this.select(g.dataset.part); }));
      SL.set(el, 'c1', 'z = 1 · Γ = 0');
      SL.set(el, 'c2', '|Γ| = 1 · r = 0');
    },
    select(id) {
      const p = PARTS.find(x => x.id === id);
      const ch = this.chart, ov = ch.L.overlay, S = SmithChart.S;
      SL.activate(this.btns, this.btns.find(b => b.dataset.part === id));
      ch.clearHighlight();
      ov.innerHTML = '';
      const add = (tag, attrs) => E(tag, attrs, ov);
      const halfUp = `M ${-S} 0 A ${S} ${S} 0 0 1 ${S} 0 Z`, halfDn = `M ${-S} 0 A ${S} ${S} 0 0 0 ${S} 0 Z`;
      switch (id) {
        case 'centro': case 'match':
          add('circle', { r: 7, class: 'sc-overlay-region pulse' });
          add('circle', { r: 2.5, fill: '#3cf7a6' });
          break;
        case 'borde': SmithChart.drawIn(add('path', { d: SmithChart.resistancePath(0), fill: 'none', stroke: '#fb923c', 'stroke-width': 2.4 }), 900); break;
        case 'eje': SmithChart.drawIn(add('path', { d: `M ${-S} 0 L ${S} 0`, stroke: '#22e4ff', 'stroke-width': 2.4 }), 800); break;
        case 'sup': case 'ind': add('path', { d: halfUp, fill: 'rgba(167,139,250,.22)', stroke: '#a78bfa', 'stroke-width': 1 }); break;
        case 'inf': case 'cap': add('path', { d: halfDn, fill: 'rgba(45,212,191,.2)', stroke: '#2dd4bf', 'stroke-width': 1 }); break;
        case 'rc': [0.2, 0.5, 1, 2, 5].forEach((r, i) => ch.highlightR(r, 'r' + i)); break;
        case 'xa': [0.5, 1, 2, -0.5, -1, -2].forEach((x, i) => ch.highlightX(x, 'x' + i)); break;
        case 'sc': case 'oc': {
          const x = id === 'sc' ? -S : S;
          add('circle', { cx: x, cy: 0, r: 6, class: 'sc-overlay-region pulse' });
          add('circle', { cx: x, cy: 0, r: 2.6, fill: id === 'sc' ? '#ff4d5e' : '#fbbf24' });
          break;
        }
      }
      SL.set(this.el, 'pt', `${p.n} · ${p.t}`);
      SL.set(this.el, 'pd', p.d);
    },
    enter() { if (!this.started) { this.select('centro'); this.started = true; } },
  });
})();
