/* =====================================================================
   selftest.js — Prueba automática de la interfaz (solo con index.html?test)
   Recorre todas las diapositivas, pulsa todos los botones, mueve todos los
   deslizadores y muestra los errores de JavaScript encontrados.
   ===================================================================== */
(async function () {
  'use strict';
  const errs = window.__errs || [];
  const ce = console.error;
  console.error = (...a) => { errs.push('console.error: ' + a.map(x => (x && x.stack) || String(x)).join(' ')); ce.apply(console, a); };
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const rf = RF.selfTest();
  rf.filter(r => !r.ok).forEach(r => errs.push('RF: ' + r.name));

  for (let i = 0; i < App.slides.length; i++) {
    App.go(i);
    await sleep(900);
    const el = App.els[i];
    for (const b of el.querySelectorAll('button')) {
      try { b.click(); } catch (e) { errs.push(`slide ${i + 1} botón "${b.textContent.trim()}": ${e.message}`); }
      await sleep(120);
    }
    for (const r of el.querySelectorAll('input[type=range]')) {
      for (const v of [r.max, r.min, (+r.min + +r.max) / 2]) { r.value = v; r.dispatchEvent(new Event('input')); }
    }
    for (const n of el.querySelectorAll('input[type=number]')) {
      const old = n.value;
      for (const v of ['-5', '0', '', old]) { n.value = v; n.dispatchEvent(new Event('input')); }
    }
    for (const s of el.querySelectorAll('select')) {
      for (const o of s.options) { s.value = o.value; s.dispatchEvent(new Event('change')); }
    }
    // Interacción con la carta: clic simulado en el centro de cada SVG interactivo
    for (const svg of el.querySelectorAll('.smith-wrap.interactive svg')) {
      const r = svg.getBoundingClientRect();
      const ev = (type, x, y) => svg.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, pointerId: 1, bubbles: true }));
      ev('pointerdown', r.left + r.width * 0.7, r.top + r.height * 0.3);
      ev('pointermove', r.left + r.width * 0.2, r.top + r.height * 0.8);
      ev('pointerup', r.left + r.width * 0.2, r.top + r.height * 0.8);
      svg.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    }
    await sleep(400);
  }
  ['toggleAnim', 'toggleAnim', 'togglePause', 'togglePause', 'toggleMenu', 'toggleMenu', 'toggleNotes', 'toggleNotes', 'togglePresent', 'togglePresent']
    .forEach(f => { try { App[f](); } catch (e) { errs.push(f + ': ' + e.message); } });
  App.go(0);
  const pre = document.createElement('pre');
  pre.id = 'testlog';
  pre.textContent = `TESTDONE slides=${App.slides.length} errors=${errs.length}\n` + errs.join('\n');
  pre.style.cssText = 'position:fixed;left:10px;top:10px;z-index:999;background:#000;color:#0f0;padding:10px;max-width:90vw;white-space:pre-wrap';
  document.body.appendChild(pre);
  console.log(pre.textContent);
})();
