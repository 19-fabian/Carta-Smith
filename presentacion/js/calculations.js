/* =====================================================================
   calculations.js — Núcleo matemático de RF (independiente de la interfaz)

   Convenciones:
   - Números complejos como objetos { re, im }.
   - z = Z / Z0 es la impedancia normalizada.
   - Γ = (z − 1) / (z + 1)   ;   z = (1 + Γ) / (1 − Γ)
   - d (distancia desde la carga hacia la fuente) se expresa en longitudes
     de onda: d/λ. Para línea ideal: Γ(d) = ΓL · e^(−j2βd), con β = 2π/λ.
   ===================================================================== */
(function (global) {
  'use strict';

  const EPS = 1e-12;
  const C0 = 299792458; // velocidad de la luz en el vacío (m/s)

  /* ------------------------------------------------------------------
     Aritmética compleja
     ------------------------------------------------------------------ */
  const Cx = {
    of: (re, im = 0) => ({ re, im }),
    add: (a, b) => ({ re: a.re + b.re, im: a.im + b.im }),
    sub: (a, b) => ({ re: a.re - b.re, im: a.im - b.im }),
    mul: (a, b) => ({ re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re }),
    scale: (a, k) => ({ re: a.re * k, im: a.im * k }),
    conj: (a) => ({ re: a.re, im: -a.im }),
    abs: (a) => Math.hypot(a.re, a.im),
    arg: (a) => Math.atan2(a.im, a.re),
    polar: (m, th) => ({ re: m * Math.cos(th), im: m * Math.sin(th) }),
    div(a, b) {
      const d = b.re * b.re + b.im * b.im;
      if (d < EPS * EPS) return { re: Infinity, im: Infinity };
      return { re: (a.re * b.re + a.im * b.im) / d, im: (a.im * b.re - a.re * b.im) / d };
    },
    inv(a) { return Cx.div({ re: 1, im: 0 }, a); },
    isFinite: (a) => Number.isFinite(a.re) && Number.isFinite(a.im),
    lerp: (a, b, t) => ({ re: a.re + (b.re - a.re) * t, im: a.im + (b.im - a.im) * t }),
  };

  /* ------------------------------------------------------------------
     Impedancias y coeficiente de reflexión
     ------------------------------------------------------------------ */

  /** Normaliza Z (Ω) respecto a Z0 (Ω). Devuelve null si Z0 no es válida. */
  function normalizeImpedance(Z, Z0) {
    if (!(Z0 > 0) || !Number.isFinite(Z0)) return null;
    return { re: Z.re / Z0, im: Z.im / Z0 };
  }

  /** Convierte una impedancia normalizada a ohmios. */
  function denormalizeImpedance(z, Z0) {
    if (!Cx.isFinite(z)) return { re: Infinity, im: Infinity };
    return { re: z.re * Z0, im: z.im * Z0 };
  }

  /** Γ = (z − 1)/(z + 1). Casos especiales: z → ∞ ⇒ Γ = 1 (circuito abierto). */
  function zToGamma(z) {
    if (!Cx.isFinite(z)) return { re: 1, im: 0 };
    const den = { re: z.re + 1, im: z.im };
    if (Cx.abs(den) < 1e-12) return { re: Infinity, im: 0 }; // z = −1: caso activo singular
    return Cx.div({ re: z.re - 1, im: z.im }, den);
  }

  /** z = (1 + Γ)/(1 − Γ). Caso especial: Γ = 1 ⇒ z → ∞ (circuito abierto). */
  function gammaToZ(g) {
    const den = { re: 1 - g.re, im: -g.im };
    if (Cx.abs(den) < 1e-9) return { re: Infinity, im: Infinity };
    return Cx.div({ re: 1 + g.re, im: g.im }, den);
  }

  /** Γ = (ZL − Z0)/(ZL + Z0), con impedancias en ohmios. */
  function reflectionCoefficient(ZL, Z0) {
    const z = normalizeImpedance(ZL, Z0);
    return z ? zToGamma(z) : null;
  }

  /** VSWR = (1 + |Γ|)/(1 − |Γ|). Para |Γ| ≥ 1 devuelve Infinity (sin dividir por cero). */
  function vswr(mag) {
    if (!Number.isFinite(mag) || mag >= 1 - 1e-9) return Infinity;
    return (1 + mag) / (1 - mag);
  }

  /** |Γ| a partir del VSWR (inversa). */
  function gammaFromVswr(s) {
    if (!Number.isFinite(s)) return 1;
    return (s - 1) / (s + 1);
  }

  /** Potencia reflejada (%) = |Γ|² × 100 (respecto a la potencia incidente). */
  function reflectedPowerPct(mag) { return mag * mag * 100; }

  /** Potencia entregada a la carga (%) en una línea sin pérdidas = (1 − |Γ|²) × 100. */
  function deliveredPowerPct(mag) { return Math.max(0, (1 - mag * mag) * 100); }

  /** |S11| en dB = 20·log10(|S11|). Para |S11| = 0 devuelve −Infinity. */
  function magToDb(mag) { return mag <= 0 ? -Infinity : 20 * Math.log10(mag); }
  function dbToMag(db) { return Math.pow(10, db / 20); }

  /** Pérdida de retorno RL = −20·log10|Γ| (dB, positiva para cargas pasivas). */
  function returnLossDb(mag) { return mag <= 0 ? Infinity : -20 * Math.log10(mag); }

  /** Fase de Γ en grados, normalizada a (−180°, 180°]. Si |Γ| = 0 la fase no está definida → 0. */
  function phaseDeg(g) {
    if (Cx.abs(g) < 1e-12) return 0;
    let d = Math.atan2(g.im, g.re) * 180 / Math.PI;
    if (d <= -180) d += 360;
    if (Object.is(d, -0)) d = 0;
    return d;
  }

  /** Normaliza un ángulo en grados a (−180, 180]. */
  function wrapDeg(d) {
    let x = ((d + 180) % 360 + 360) % 360 - 180;
    if (x === -180) x = 180;
    return x;
  }

  /* ------------------------------------------------------------------
     Línea de transmisión ideal (sin pérdidas)
     ------------------------------------------------------------------ */

  /** Γ(d) = ΓL · e^(−j2βd), con 2βd = 4π·(d/λ). */
  function gammaAtDistance(gL, dLambda) {
    return Cx.mul(gL, Cx.polar(1, -4 * Math.PI * dLambda));
  }

  /** Impedancia de entrada normalizada a una distancia d/λ de la carga. */
  function inputImpedanceNormalized(zL, dLambda) {
    return gammaToZ(gammaAtDistance(zToGamma(zL), dLambda));
  }

  /**
   * Impedancia de entrada de una línea de impedancia característica Zc y
   * longitud eléctrica θ = βℓ (rad), terminada en ZL (Ω):
   *   Zin = Zc · (ZL cosθ + j Zc sinθ) / (Zc cosθ + j ZL sinθ)
   * (forma sin tan() para evitar la singularidad en θ = π/2).
   */
  function lineInputImpedance(ZL, Zc, theta) {
    const c = Math.cos(theta), s = Math.sin(theta);
    const num = { re: ZL.re * c, im: ZL.im * c + Zc * s };
    const den = { re: Zc * c - ZL.im * s, im: ZL.re * s };
    return Cx.scale(Cx.div(num, den), Zc);
  }

  /* ------------------------------------------------------------------
     Geometría de la carta (plano Γ)
     ------------------------------------------------------------------ */

  /** Círculo de resistencia constante r: centro (r/(1+r), 0), radio 1/(1+r). */
  function resistanceCircle(r) {
    return { cx: r / (1 + r), cy: 0, radius: 1 / (1 + r) };
  }

  /** Círculo de reactancia constante x ≠ 0: centro (1, 1/x), radio |1/x|. */
  function reactanceCircle(x) {
    if (x === 0) return null; // x = 0 corresponde al eje real (recta)
    return { cx: 1, cy: 1 / x, radius: Math.abs(1 / x) };
  }

  /** Círculo de conductancia constante g (carta de admitancias): centro (−g/(1+g), 0), radio 1/(1+g). */
  function conductanceCircle(g) {
    return { cx: -g / (1 + g), cy: 0, radius: 1 / (1 + g) };
  }

  /* ------------------------------------------------------------------
     Adaptación
     ------------------------------------------------------------------ */

  /** Suma una reactancia normalizada en serie: z' = z + j·xs. */
  function addSeriesReactance(z, xs) { return { re: z.re, im: z.im + xs }; }

  /** Suma una susceptancia normalizada en paralelo: y' = y + j·b. */
  function addShuntSusceptance(z, b) {
    const y = Cx.inv(z);
    return Cx.inv({ re: y.re, im: y.im + b });
  }

  /**
   * Red L (elemento serie junto a la carga + elemento paralelo hacia la línea),
   * válida para cargas con 0 < r < 1:
   *   1) serie: llevar z al círculo g = 1  →  X = +√(r(1−r)),  xs = X − x
   *   2) paralelo: cancelar la susceptancia → b = X / r
   */
  function lNetworkSeriesFirst(z) {
    if (!(z.re > 0 && z.re < 1)) return null;
    const X = Math.sqrt(z.re * (1 - z.re));
    return { xs: X - z.im, b: X / z.re, z1: { re: z.re, im: X } };
  }

  /** Impedancia del transformador de λ/4 para una carga resistiva RL: Z1 = √(Z0·RL). */
  function quarterWaveImpedance(Z0, RL) { return Math.sqrt(Z0 * RL); }

  /** Convierte una reactancia X (Ω) a frecuencia f (Hz) en el componente equivalente. */
  function reactanceToComponent(X, f) {
    if (!(f > 0) || Math.abs(X) < 1e-9) return { type: 'none', value: 0 };
    const w = 2 * Math.PI * f;
    return X > 0 ? { type: 'L', value: X / w } : { type: 'C', value: -1 / (w * X) };
  }

  /** Susceptancia B (S) → componente en paralelo. B > 0 capacitor, B < 0 inductor. */
  function susceptanceToComponent(B, f) {
    if (!(f > 0) || Math.abs(B) < 1e-15) return { type: 'none', value: 0 };
    const w = 2 * Math.PI * f;
    return B > 0 ? { type: 'C', value: B / w } : { type: 'L', value: -1 / (w * B) };
  }

  /* ------------------------------------------------------------------
     Modelos
     ------------------------------------------------------------------ */

  /** Impedancia de un RLC serie: Z = R + j(ωL − 1/(ωC)). */
  function seriesRLC(R, L, C, f) {
    const w = 2 * Math.PI * f;
    return { re: R, im: w * L - 1 / (w * C) };
  }

  /**
   * Microstrip — aproximación cuasiestática de Hammerstad (misma usada en CARTA.PY).
   * W y h en las mismas unidades. Devuelve εeff y Z0 (Ω). Desprecia espesor del cobre y dispersión.
   */
  function microstrip(W, h, er) {
    const u = W / h;
    let eeff = (er + 1) / 2 + (er - 1) / 2 / Math.sqrt(1 + 12 / u);
    if (u < 1) eeff += 0.04 * (1 - u) * (1 - u);
    let Z0;
    if (u <= 1) Z0 = (60 / Math.sqrt(eeff)) * Math.log(8 / u + 0.25 * u);
    else Z0 = (120 * Math.PI / Math.sqrt(eeff)) / (u + 1.393 + 0.667 * Math.log(u + 1.444));
    return { eeff, Z0 };
  }

  /* ------------------------------------------------------------------
     Análisis completo de un punto
     ------------------------------------------------------------------ */

  /** Devuelve todas las magnitudes de interés a partir de Γ y Z0. */
  function analyzeGamma(g, Z0 = 50) {
    const mag = Cx.abs(g);
    const z = gammaToZ(g);
    return {
      gamma: g,
      mag,
      phase: phaseDeg(g),
      z,
      Z: denormalizeImpedance(z, Z0),
      vswr: vswr(mag),
      pRefl: reflectedPowerPct(mag),
      pDeliv: deliveredPowerPct(mag),
      rl: returnLossDb(mag),
      s11db: magToDb(mag),
      active: mag > 1 + 1e-9,
      open: !Cx.isFinite(z),
    };
  }

  /** Igual que analyzeGamma, pero a partir de la impedancia de carga en ohmios. */
  function analyzeLoad(ZL, Z0 = 50) {
    const z = normalizeImpedance(ZL, Z0);
    if (!z) return null;
    const g = zToGamma(z);
    const a = analyzeGamma(g, Z0);
    a.z = z;
    a.Z = { re: ZL.re, im: ZL.im };
    return a;
  }

  /** Descripción textual de la región de la carta. */
  function classify(z, mag) {
    if (!Cx.isFinite(z)) return 'Circuito abierto (Γ = 1)';
    if (z.re < -1e-9) return 'R < 0: carga activa (fuera de la carta pasiva)';
    if (mag < 0.02) return 'Prácticamente adaptada (centro de la carta)';
    if (Math.abs(z.re) < 1e-6 && Math.abs(z.im) < 1e-6) return 'Cortocircuito (Γ = −1)';
    if (Math.abs(z.re) < 1e-3) return z.im > 0 ? 'Reactancia pura inductiva (borde)' : 'Reactancia pura capacitiva (borde)';
    if (Math.abs(z.im) < 0.01) return z.re > 1 ? 'Resistiva, mayor que Z0' : 'Resistiva, menor que Z0';
    return z.im > 0 ? 'Inductiva (mitad superior)' : 'Capacitiva (mitad inferior)';
  }

  /* ------------------------------------------------------------------
     Formato numérico
     ------------------------------------------------------------------ */
  function fmt(n, d = 3) {
    if (n === Infinity) return '∞';
    if (n === -Infinity) return '−∞';
    if (!Number.isFinite(n)) return '—';
    const s = (Math.abs(n) < 0.5 * Math.pow(10, -d) ? 0 : n).toFixed(d);
    return s.replace('-', '−');
  }

  /** Formato "a + jb" / "a − jb". */
  function fmtC(c, d = 3, unit = '') {
    if (!Cx.isFinite(c)) return '∞';
    const im = Math.abs(c.im) < 0.5 * Math.pow(10, -d) ? 0 : c.im;
    const sign = im < 0 ? '−' : '+';
    return `${fmt(c.re, d)} ${sign} j${fmt(Math.abs(im), d)}${unit ? ' ' + unit : ''}`;
  }

  /** Formato con prefijos de ingeniería (p, n, µ, m, k, M, G). */
  function fmtEng(v, unit, d = 3) {
    if (!Number.isFinite(v) || v === 0) return `0 ${unit}`;
    const pre = [[1e9, 'G'], [1e6, 'M'], [1e3, 'k'], [1, ''], [1e-3, 'm'], [1e-6, 'µ'], [1e-9, 'n'], [1e-12, 'p'], [1e-15, 'f']];
    const a = Math.abs(v);
    for (const [k, p] of pre) {
      if (a >= k * 0.9995) return `${(v / k).toPrecision(d)} ${p}${unit}`;
    }
    return `${v.toExponential(2)} ${unit}`;
  }

  /** Color del punto en la carta según |Γ|. */
  function colorForMag(m) {
    if (m < 0.1) return '#3cf7a6';
    if (m < 0.33) return '#22e4ff';
    if (m < 0.6) return '#fbbf24';
    if (m < 0.9) return '#fb923c';
    return '#ff4d5e';
  }

  /* ------------------------------------------------------------------
     Autoverificación (se ejecuta al cargar; los resultados van a consola)
     ------------------------------------------------------------------ */
  function selfTest() {
    const close = (a, b, tol = 1e-3) => Math.abs(a - b) <= tol;
    const results = [];
    const check = (name, ok) => results.push({ name, ok });

    // Ejemplo de la exposición: ZL = 75 + j25 Ω, Z0 = 50 Ω
    const a = analyzeLoad({ re: 75, im: 25 }, 50);
    check('zL = 1.5 + j0.5', close(a.z.re, 1.5) && close(a.z.im, 0.5));
    check('Γ ≈ 0.2308 + j0.1538', close(a.gamma.re, 0.230769, 1e-5) && close(a.gamma.im, 0.153846, 1e-5));
    check('|Γ| ≈ 0.277', close(a.mag, 0.27735, 1e-4));
    check('∠Γ ≈ 33.69°', close(a.phase, 33.69, 0.01));
    check('VSWR ≈ 1.77', close(a.vswr, 1.7676, 1e-3));
    check('P refl ≈ 7.69 %', close(a.pRefl, 7.692, 1e-2));
    // Ida y vuelta z → Γ → z
    const z2 = gammaToZ(a.gamma);
    check('z → Γ → z', close(z2.re, 1.5, 1e-9) && close(z2.im, 0.5, 1e-9));
    // Casos especiales
    check('Adaptación: Γ = 0', Cx.abs(zToGamma({ re: 1, im: 0 })) < 1e-12);
    check('Cortocircuito: Γ = −1', close(zToGamma({ re: 0, im: 0 }).re, -1));
    check('Abierto: z → ∞', !Cx.isFinite(gammaToZ({ re: 1, im: 0 })));
    check('VSWR(|Γ|=1) = ∞', vswr(1) === Infinity);
    // λ/2 repite la impedancia; λ/4 invierte
    const zh = inputImpedanceNormalized({ re: 1.5, im: 0.5 }, 0.5);
    check('Periodo λ/2', close(zh.re, 1.5, 1e-9) && close(zh.im, 0.5, 1e-9));
    const zq = inputImpedanceNormalized({ re: 2, im: 0 }, 0.25);
    check('λ/4: z → 1/z', close(zq.re, 0.5, 1e-9) && close(zq.im, 0, 1e-9));
    // Coherencia de las dos fórmulas de Zin
    const Zin1 = lineInputImpedance({ re: 75, im: 25 }, 50, 2 * Math.PI * 0.1);
    const zin2 = inputImpedanceNormalized({ re: 1.5, im: 0.5 }, 0.1);
    check('Zin (fórmula) = Zin (Γ rotado)', close(Zin1.re / 50, zin2.re, 1e-9) && close(Zin1.im / 50, zin2.im, 1e-9));
    // Red L
    const L = lNetworkSeriesFirst({ re: 0.4, im: 0 });
    const zm = addShuntSusceptance(addSeriesReactance({ re: 0.4, im: 0 }, L.xs), L.b);
    check('Red L → z = 1', close(zm.re, 1, 1e-9) && close(zm.im, 0, 1e-9));
    // Punto de r = 1.5 pertenece a su círculo
    const rc = resistanceCircle(1.5), xc = reactanceCircle(0.5);
    check('Γ sobre círculo r', close(Math.hypot(a.gamma.re - rc.cx, a.gamma.im - rc.cy), rc.radius, 1e-9));
    check('Γ sobre círculo x', close(Math.hypot(a.gamma.re - xc.cx, a.gamma.im - xc.cy), xc.radius, 1e-9));

    const failed = results.filter(r => !r.ok);
    if (global.console) {
      if (failed.length) console.error('[RF] Autoverificación: fallos', failed);
      else console.info(`[RF] Autoverificación correcta (${results.length} pruebas).`);
    }
    return results;
  }

  global.Cx = Cx;
  global.RF = {
    C0,
    normalizeImpedance, denormalizeImpedance, zToGamma, gammaToZ, reflectionCoefficient,
    vswr, gammaFromVswr, reflectedPowerPct, deliveredPowerPct, magToDb, dbToMag, returnLossDb,
    phaseDeg, wrapDeg, gammaAtDistance, inputImpedanceNormalized, lineInputImpedance,
    resistanceCircle, reactanceCircle, conductanceCircle,
    addSeriesReactance, addShuntSusceptance, lNetworkSeriesFirst, quarterWaveImpedance,
    reactanceToComponent, susceptanceToComponent, seriesRLC, microstrip,
    analyzeGamma, analyzeLoad, classify,
    fmt, fmtC, fmtEng, colorForMag, selfTest,
  };
})(typeof window !== 'undefined' ? window : globalThis);
