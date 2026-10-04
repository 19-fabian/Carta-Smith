/* =====================================================================
   animations.js — Motor de animación controlable

   - Un único bucle requestAnimationFrame para toda la presentación.
   - Cada bucle se registra en el "ámbito" de la diapositiva activa y se
     elimina automáticamente al salir de ella.
   - Pausa: congela el tiempo de simulación (las ondas se detienen) pero
     sigue redibujando, de modo que los controles responden.
   - Animaciones desactivadas: igual que pausa + transiciones instantáneas.
   ===================================================================== */
(function (global) {
  'use strict';

  const loops = new Set();
  const tweens = new Set();
  let last = performance.now();

  const Anim = {
    enabled: true,
    paused: false,
    time: 0,          // tiempo de simulación (s)
    scope: null,      // ámbito actual (índice de diapositiva)

    get frozen() { return this.paused || !this.enabled; },

    /** Registra fn(t, dt) para ejecutarse en cada fotograma. */
    loop(fn) {
      const h = { fn, scope: this.scope };
      loops.add(h);
      return h;
    },
    remove(h) { loops.delete(h); },

    /** Elimina los bucles y tweens de un ámbito. */
    clearScope(scope) {
      for (const h of loops) if (h.scope === scope) loops.delete(h);
      for (const t of tweens) if (t.scope === scope) tweens.delete(t);
    },

    /**
     * Interpola de 0 a 1 en `ms` milisegundos. Si las animaciones están
     * desactivadas, salta directamente al final.
     * Devuelve una función para cancelar.
     */
    tween(ms, onUpdate, onDone, ease = Anim.ease.inOut) {
      if (!this.enabled || ms <= 0) {
        onUpdate(1);
        if (onDone) onDone();
        return () => {};
      }
      const t = { start: performance.now(), ms, onUpdate, onDone, ease, scope: this.scope };
      tweens.add(t);
      return () => tweens.delete(t);
    },

    /** Espera (respetando el modo sin animaciones). */
    wait(ms) {
      return new Promise(res => this.enabled ? setTimeout(res, ms) : res());
    },

    ease: {
      linear: t => t,
      inOut: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
      out: t => 1 - Math.pow(1 - t, 3),
      back: t => { const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
    },

    /** Construye el atributo d de una curva y = fn(x) muestreada. */
    curve(fn, x0, x1, n = 200) {
      let d = '';
      for (let i = 0; i <= n; i++) {
        const x = x0 + (x1 - x0) * (i / n);
        const y = fn(x);
        d += (i ? 'L' : 'M') + x.toFixed(2) + ' ' + y.toFixed(2);
      }
      return d;
    },

    /** Lista de puntos [[x,y],...] → atributo d. */
    poly(points) {
      let d = '';
      points.forEach((p, i) => { d += (i ? 'L' : 'M') + p[0].toFixed(2) + ' ' + p[1].toFixed(2); });
      return d;
    },
  };

  function frame(now) {
    const realDt = Math.min(0.1, (now - last) / 1000);
    last = now;
    const dt = Anim.frozen ? 0 : realDt;
    Anim.time += dt;

    for (const t of tweens) {
      const p = Math.min(1, (now - t.start) / t.ms);
      try { t.onUpdate(t.ease(p)); } catch (e) { console.error(e); tweens.delete(t); continue; }
      if (p >= 1) { tweens.delete(t); if (t.onDone) t.onDone(); }
    }
    for (const h of loops) {
      try { h.fn(Anim.time, dt); } catch (e) { console.error(e); loops.delete(h); }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  global.Anim = Anim;
})(window);
