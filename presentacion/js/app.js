/* =====================================================================
   app.js — Navegación, escalado, menú, notas, modo exposición
   ===================================================================== */
(function () {
  'use strict';

  const W = 1600, H = 900;
  const $ = (s, r = document) => r.querySelector(s);

  const App = {
    idx: -1,
    slides: [],
    els: [],
    inited: [],
    presenterWin: null,
    startTime: Date.now(),

    init() {
      this.slides = window.SLIDES;
      const stage = $('#stage');
      this.slides.forEach((s, i) => {
        const sec = document.createElement('section');
        sec.className = 'slide ' + (s.cls || '');
        sec.dataset.trans = s.trans || 'slide';
        sec.dataset.index = i;
        sec.setAttribute('aria-label', `Diapositiva ${i + 1}: ${s.title}`);
        sec.innerHTML = s.html;
        // Índices de aparición progresiva
        sec.querySelectorAll('.rv').forEach((e, k) => { if (!e.style.getPropertyValue('--i')) e.style.setProperty('--i', k); });
        stage.appendChild(sec);
        this.els.push(sec);
        this.inited.push(false);
      });

      this.restoreEditable();
      this.buildMenu();
      this.bindUI();
      this.fit();
      window.addEventListener('resize', () => this.fit());

      // ?noanim → empezar con las animaciones desactivadas; ?present → modo exposición
      if (/[?&]noanim\b/.test(location.search)) { Anim.enabled = false; document.body.classList.add('no-anim'); $('#btnAnim').classList.add('off'); }
      if (/[?&]present\b/.test(location.search)) { document.body.classList.add('present'); $('#btnPresent').classList.add('on'); }

      const m = /#(\d+)/.exec(location.hash);
      const start = m ? Math.min(this.slides.length, Math.max(1, +m[1])) - 1 : 0;
      this.go(start, true);

      if (window.RF) RF.selfTest();
      if (/[?&]test\b/.test(location.search)) {
        const sc = document.createElement('script');
        sc.src = 'js/selftest.js?v=' + Date.now();
        document.body.appendChild(sc);
      }
    },

    /* --------------- Escalado del escenario 16:9 --------------- */
    fit() {
      const s = Math.min(window.innerWidth / W, window.innerHeight / H);
      const st = $('#stage');
      st.style.left = '0px';
      st.style.top = '0px';
      st.style.transform = `translate(${(window.innerWidth - W * s) / 2}px, ${(window.innerHeight - H * s) / 2}px) scale(${s})`;
    },

    /* --------------- Navegación --------------- */
    go(n, instant = false) {
      n = Math.max(0, Math.min(this.slides.length - 1, n));
      if (n === this.idx) return;
      const prev = this.idx;
      const stage = $('#stage');
      stage.classList.toggle('dir-back', n < prev);

      if (prev >= 0) {
        const oldEl = this.els[prev];
        const oldS = this.slides[prev];
        Anim.clearScope(prev);
        try { oldS.leave && oldS.leave(oldEl); } catch (e) { console.error(e); }
        oldEl.classList.remove('active', 'enter');
        if (!instant && Anim.enabled) {
          oldEl.classList.add('leaving');
          setTimeout(() => oldEl.classList.remove('leaving'), 560);
        }
      }

      this.idx = n;
      Anim.scope = n;
      const el = this.els[n];
      const s = this.slides[n];
      el.classList.remove('leaving');
      el.classList.add('active', 'enter');
      setTimeout(() => el.classList.remove('enter'), 750);
      try {
        if (!this.inited[n]) { s.init && s.init(el); this.inited[n] = true; }
        s.enter && s.enter(el);
      } catch (e) { console.error('Error en la diapositiva', n + 1, e); }

      this.updateChrome();
    },
    next() { this.go(this.idx + 1); },
    prev() { this.go(this.idx - 1); },

    updateChrome() {
      const n = this.idx, total = this.slides.length, s = this.slides[n];
      $('#counter').innerHTML = `${String(n + 1).padStart(2, '0')} <span class="tot">/ ${total}</span>`;
      $('#progress').style.width = ((n + 1) / total * 100) + '%';
      $('#sectionLabel').textContent = s.section;
      $('#btnPrev').disabled = n === 0;
      $('#btnNext').disabled = n === total - 1;
      try { history.replaceState(null, '', '#' + (n + 1)); } catch (_) {}
      this.renderNotes();
      document.querySelectorAll('#menu .sec button').forEach(b => b.classList.toggle('current', +b.dataset.go === n));
    },

    /* --------------- Interfaz --------------- */
    bindUI() {
      const on = (id, fn) => $(id).addEventListener('click', fn);
      on('#btnPrev', () => this.prev());
      on('#btnNext', () => this.next());
      on('#btnMenu', () => this.toggleMenu());
      on('#btnNotes', () => this.toggleNotes());
      on('#btnPresenter', () => this.openPresenter());
      on('#btnAnim', () => this.toggleAnim());
      on('#btnPause', () => this.togglePause());
      on('#btnPresent', () => this.togglePresent());
      on('#btnFull', () => this.toggleFullscreen());
      on('#notesClose', () => this.toggleNotes(false));
      $('#menu').addEventListener('click', (e) => { if (e.target.id === 'menu') this.toggleMenu(false); });

      document.addEventListener('keydown', (e) => this.onKey(e));

      // En modo exposición la barra aparece solo al acercar el ratón al borde inferior
      let t;
      document.addEventListener('mousemove', (e) => {
        if (!document.body.classList.contains('present')) return;
        if (e.clientY > window.innerHeight - 110) {
          document.body.classList.add('show-ui');
          clearTimeout(t);
          t = setTimeout(() => document.body.classList.remove('show-ui'), 2200);
        }
      });
      document.addEventListener('fullscreenchange', () => $('#btnFull').classList.toggle('on', !!document.fullscreenElement));
    },

    onKey(e) {
      const t = e.target;
      const tag = (t.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'select' || tag === 'textarea' || t.isContentEditable) {
        if (e.key === 'Escape') t.blur();
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key;
      if (k === 'ArrowRight' || k === 'PageDown' || (k === ' ' && tag !== 'button')) { e.preventDefault(); this.next(); }
      else if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); this.prev(); }
      else if (k === 'Home') { e.preventDefault(); this.go(0); }
      else if (k === 'End') { e.preventDefault(); this.go(this.slides.length - 1); }
      else if (k === 'f' || k === 'F') this.toggleFullscreen();
      else if (k === 'n' || k === 'N') this.toggleNotes();
      else if (k === 'v' || k === 'V') this.openPresenter();
      else if (k === 'm' || k === 'M' || k === '?') this.toggleMenu();
      else if (k === 'a' || k === 'A') this.toggleAnim();
      else if (k === 'p' || k === 'P') this.togglePause();
      else if (k === 'h' || k === 'H') this.togglePresent();
      else if (k === 'Escape') { this.toggleMenu(false); this.toggleNotes(false); }
    },

    toast(msg) {
      const el = $('#toast');
      el.textContent = msg;
      el.classList.add('show');
      clearTimeout(this._tt);
      this._tt = setTimeout(() => el.classList.remove('show'), 1600);
    },

    toggleMenu(force) {
      const m = $('#menu');
      const open = force === undefined ? !m.classList.contains('open') : force;
      m.classList.toggle('open', open);
      $('#btnMenu').classList.toggle('on', open);
    },

    toggleNotes(force) {
      const nEl = $('#notes');
      const open = force === undefined ? !nEl.classList.contains('open') : force;
      nEl.classList.toggle('open', open);
      $('#btnNotes').classList.toggle('on', open);
    },

    toggleAnim() {
      Anim.enabled = !Anim.enabled;
      document.body.classList.toggle('no-anim', !Anim.enabled);
      $('#btnAnim').classList.toggle('off', !Anim.enabled);
      $('#btnAnim').dataset.tip = Anim.enabled ? 'Desactivar animaciones (A)' : 'Activar animaciones (A)';
      this.toast(Anim.enabled ? 'Animaciones activadas' : 'Animaciones desactivadas');
    },

    togglePause() {
      Anim.paused = !Anim.paused;
      $('#btnPause').classList.toggle('on', Anim.paused);
      $('#btnPause').innerHTML = Anim.paused ? ICONS.play : ICONS.pause;
      document.body.classList.toggle('paused', Anim.paused);
      this.toast(Anim.paused ? 'Animaciones en pausa (P para continuar)' : 'Animaciones en marcha');
    },

    togglePresent() {
      const on = document.body.classList.toggle('present');
      $('#btnPresent').classList.toggle('on', on);
      this.toast(on ? 'Modo exposición: H para salir · la barra aparece abajo' : 'Modo edición');
    },

    toggleFullscreen() {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => this.toast('Pantalla completa no disponible'));
      else document.exitFullscreen();
    },

    /* --------------- Menú de secciones --------------- */
    buildMenu() {
      const box = $('#menuSections');
      const groups = [];
      this.slides.forEach((s, i) => {
        let g = groups.find(x => x.name === s.section);
        if (!g) { g = { name: s.section, items: [] }; groups.push(g); }
        g.items.push({ i, title: s.title });
      });
      box.innerHTML = groups.map(g => `
        <div class="sec"><h4>${g.name}</h4>
          ${g.items.map(it => `<button data-go="${it.i}"><span class="n">${String(it.i + 1).padStart(2, '0')}</span>${it.title}</button>`).join('')}
        </div>`).join('');
      box.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-go]');
        if (b) { this.go(+b.dataset.go); this.toggleMenu(false); }
      });
    },

    /* --------------- Notas del expositor --------------- */
    renderNotes() {
      const s = this.slides[this.idx];
      $('#notesNum').textContent = `DIAPOSITIVA ${this.idx + 1} / ${this.slides.length} · ${s.section}`;
      $('#notesTitle').textContent = s.title;
      $('#notesBody').innerHTML = s.notes || '<p>(Sin notas)</p>';
      this.updatePresenter();
    },

    openPresenter() {
      if (this.presenterWin && !this.presenterWin.closed) { this.presenterWin.focus(); return; }
      const w = window.open('', 'smith-notas', 'width=760,height=860');
      if (!w) { this.toast('El navegador bloqueó la ventana emergente'); return; }
      this.presenterWin = w;
      w.document.open();
      w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Notas del expositor — Carta de Smith</title>
<style>
  body{margin:0;background:#050c1a;color:#e3eefc;font-family:"Segoe UI",Arial,sans-serif;}
  header{display:flex;justify-content:space-between;align-items:center;padding:14px 20px;border-bottom:1px solid rgba(34,228,255,.25);background:#081429;position:sticky;top:0}
  .n{font-family:Consolas,monospace;color:#22e4ff;letter-spacing:.12em;font-size:13px}
  h1{font-size:24px;margin:4px 0 0}
  .timer{font-family:Consolas,monospace;font-size:28px;color:#22e4ff}
  .body{padding:16px 22px 40px;font-size:18px;line-height:1.6}
  .next{margin:0 22px 20px;padding:10px 14px;border:1px dashed rgba(34,228,255,.3);border-radius:10px;color:#9fb2cc;font-size:15px}
  button{background:rgba(34,228,255,.1);border:1px solid rgba(34,228,255,.5);color:#fff;padding:8px 14px;border-radius:8px;font-size:15px;cursor:pointer;margin-left:6px}
  b,strong{color:#fff} em{color:#c4b5fd;font-style:normal}
</style></head><body>
<header><div><div class="n" id="pn"></div><h1 id="pt"></h1></div>
<div style="text-align:right"><div class="timer" id="tm">00:00</div>
<button id="pp">◀ Anterior</button><button id="pnx">Siguiente ▶</button><button id="pr">Reiniciar reloj</button></div></header>
<div class="body" id="pb"></div><div class="next" id="nx"></div></body></html>`);
      w.document.close();
      w.document.getElementById('pp').onclick = () => this.prev();
      w.document.getElementById('pnx').onclick = () => this.next();
      w.document.getElementById('pr').onclick = () => { this.startTime = Date.now(); };
      w.document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); this.next(); }
        if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); this.prev(); }
      });
      this.startTime = Date.now();
      clearInterval(this._timer);
      this._timer = setInterval(() => {
        if (!this.presenterWin || this.presenterWin.closed) { clearInterval(this._timer); return; }
        const s = Math.floor((Date.now() - this.startTime) / 1000);
        this.presenterWin.document.getElementById('tm').textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
      }, 500);
      this.updatePresenter();
      this.toast('Ventana de notas abierta: arrástrala al monitor del expositor');
    },

    updatePresenter() {
      const w = this.presenterWin;
      if (!w || w.closed) return;
      const d = w.document, s = this.slides[this.idx], nx = this.slides[this.idx + 1];
      d.getElementById('pn').textContent = `DIAPOSITIVA ${this.idx + 1} / ${this.slides.length} · ${s.section}`;
      d.getElementById('pt').textContent = s.title;
      d.getElementById('pb').innerHTML = s.notes || '';
      d.getElementById('nx').textContent = nx ? `Siguiente: ${this.idx + 2}. ${nx.title}` : 'Última diapositiva';
    },

    /* --------------- Campos editables de la portada --------------- */
    restoreEditable() {
      document.querySelectorAll('[data-store]').forEach(el => {
        const key = 'smith-pres-' + el.dataset.store;
        try { const v = localStorage.getItem(key); if (v) el.textContent = v; } catch (_) {}
        el.addEventListener('input', () => {
          try { localStorage.setItem(key, el.textContent.trim()); } catch (_) {}
        });
        el.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); el.blur(); } });
      });
    },
  };

  const ICONS = {
    pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5l12 7-12 7z"/></svg>',
  };

  window.App = App;
  window.addEventListener('DOMContentLoaded', () => App.init());
})();
