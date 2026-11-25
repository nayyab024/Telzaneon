/* ==========================================================================
   Telza: WhatsApp Automation product page (mirrors inbound.js; the hero chat illustration replaces the inbound image)
   1. Waveform bars (hero glass cards + call card)
   2. Live voice ribbon between the two speakers (only while the hero is visible)
   3. Scroll motion (GSAP + ScrollTrigger):
      - every device with motion allowed: intro lines + highlighter, reveals, CTA (homepage values)
      - mouse/trackpad screens (window.TELZA_STORY_MQ, same as the homepage and Fillo):
        hero entrance + drift, pinned call journey, scroll-driven handoff token, CTA tilt
   Shared behaviour (nav, accordion, reveals, CTA form) comes from script.js.
   ========================================================================== */
(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const STORY_MQ = window.TELZA_STORY_MQ
    || '(min-width: 768px) and (min-height: 420px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)';

  /* ---------- 1. Waveform bars ---------- */
  function initBars() {
    // deterministic pseudo-random so the shapes look natural but stay the same on every load
    let seed = 7;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    $$('[data-wa-bars]').forEach((box) => {
      const n = parseInt(box.dataset.waBars, 10) || 30;
      const frag = document.createDocumentFragment();
      for (let i = 0; i < n; i++) {
        const bar = document.createElement('i');
        const env = Math.sin(((i + 0.5) / n) * Math.PI); // taller in the middle
        bar.style.setProperty('--h', `${Math.round(22 + env * 70 * (0.45 + rnd() * 0.55))}%`);
        bar.style.setProperty('--t', `${(0.45 + rnd() * 0.7).toFixed(2)}s`);
        bar.style.setProperty('--dl', `${(-rnd() * 1.2).toFixed(2)}s`);
        frag.appendChild(bar);
      }
      box.appendChild(frag);
    });
  }

  /* ---------- Use cases: accessible tabs (click, arrow keys, Home / End) ---------- */
  function initUses() {
    const box = $('[data-wa-uses]');
    if (!box) return;
    const tabs = $$('[role="tab"]', box);
    const select = (i, focus) => {
      tabs.forEach((t, k) => {
        const on = k === i;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
      if (focus) tabs[i].focus();
      tabs[i].scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(i, false));
      t.addEventListener('keydown', (e) => {
        const n = tabs.length;
        const map = { ArrowDown: i + 1, ArrowRight: i + 1, ArrowUp: i - 1, ArrowLeft: i - 1, Home: 0, End: n - 1 };
        if (!(e.key in map)) return;
        e.preventDefault();
        select((map[e.key] + n) % n, true);
      });
    });
  }

  /* ---------- Why it matters: notifications flip to the Telza outcome ---------- */
  function initWhy() {
    const items = $$('[data-wa-why]');
    const notes = $$('[data-wa-note]');
    if (!items.length) return;
    const gsap = window.gsap;
    const ST = window.ScrollTrigger;
    if (reduceMotion || !gsap || !ST) { notes.forEach((n) => n.classList.add('is-resolved')); return; }
    const passed = new Set();
    const paint = (hover) => {
      items.forEach((li, i) => li.classList.toggle('is-on', hover === i));
      notes.forEach((n, i) => n.classList.toggle('is-resolved', passed.has(i) || hover === i));
    };
    let active = -1;
    items.forEach((li, i) => {
      ST.create({
        trigger: li, start: 'top 60%', end: 'bottom 40%',
        onEnter: () => { passed.add(i); active = i; paint(active); },
        onEnterBack: () => { active = i; paint(active); },
        onLeave: () => { active = -1; paint(-1); },
        onLeaveBack: () => { passed.delete(i); active = -1; paint(-1); },
      });
      li.addEventListener('mouseenter', () => paint(i));
      li.addEventListener('mouseleave', () => paint(active));
    });
  }

  /* ---------- Masked words (same technique as the homepage's headings) ---------- */
  function splitWords(h) {
    h.classList.add('ed');
    const words = h.textContent.trim().split(/\s+/);
    h.textContent = '';
    words.forEach((word, i) => {
      const w = document.createElement('span');
      const inner = document.createElement('span');
      w.className = 'w';
      inner.textContent = word;
      w.appendChild(inner);
      h.appendChild(w);
      if (i < words.length - 1) h.appendChild(document.createTextNode(' '));
    });
    return $$('.w > span', h);
  }
  function toLines(words) {
    const lines = [];
    let top = null;
    words.forEach((w) => {
      const t = Math.round(w.parentNode.getBoundingClientRect().top);
      if (top === null || Math.abs(t - top) > 6) { lines.push([]); top = t; }
      lines[lines.length - 1].push(w);
    });
    return lines;
  }

  /* ---------- 3. Scroll motion ---------- */
  function initMotion() {
    const gsap = window.gsap;
    const ST = window.ScrollTrigger;
    if (!gsap || !ST || reduceMotion) return;
    gsap.registerPlugin(ST);
    const mm = gsap.matchMedia();

    // 3a. Every device with motion allowed (no pinning)
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      // Intro: lines rise out of their masks, the highlighter sweeps, chips follow
      const intro = $('.wa-intro');
      if (intro) {
        gsap.timeline({ scrollTrigger: { trigger: intro, start: 'top 85%', end: 'top 25%', scrub: 0.8 } })
          .fromTo($$('.wa-line__in', intro), { yPercent: 110 }, { yPercent: 0, stagger: 0.15, duration: 0.6, ease: 'power3.out' })
          .fromTo($('.wa-intro__lead', intro), { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.4 }, 0.4)
          .fromTo($('.wa-mark', intro), { '--mk': '0%' }, { '--mk': '100%', duration: 0.5, ease: 'power2.inOut' }, 0.5)
          .fromTo($$('.wa-chips li', intro), { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.06, duration: 0.3 }, 0.6);
      }

      // Benefits and features arrive one by one
      [['.wa-benefits__grid', '.wa-benefit'], ['.wa-features__grid', '.wa-feature']].forEach(([grid, item]) => {
        const g = $(grid);
        if (!g) return;
        gsap.fromTo($$(item, g), { y: 60, autoAlpha: 0 }, {
          y: 0, autoAlpha: 1, stagger: 0.12, ease: 'power2.out',
          scrollTrigger: { trigger: g, start: 'top 88%', end: 'top 40%', scrub: 0.8 },
        });
      });

      // AI + your team: highlighter, then the two lanes slide in from their sides
      const ho = $('.wa-handoff');
      if (ho) {
        gsap.fromTo($('.wa-mark', ho), { '--mk': '0%' }, { '--mk': '100%', ease: 'power2.inOut', scrollTrigger: { trigger: ho, start: 'top 70%', end: 'top 35%', scrub: 0.8 } });
        gsap.fromTo('.wa-lane--ai', { x: -60, autoAlpha: 0 }, { x: 0, autoAlpha: 1, ease: 'power2.out', scrollTrigger: { trigger: '.wa-relay', start: 'top 85%', end: 'top 50%', scrub: 0.8 } });
        gsap.fromTo('.wa-lane--team', { x: 60, autoAlpha: 0 }, { x: 0, autoAlpha: 1, ease: 'power2.out', scrollTrigger: { trigger: '.wa-relay', start: 'top 85%', end: 'top 50%', scrub: 0.8 } });
      }

      // Integrations: the orbit grows in
      const orbit = $('.wa-orbit');
      if (orbit) {
        gsap.fromTo(orbit, { scale: 0.82, autoAlpha: 0, rotate: -20 }, { scale: 1, autoAlpha: 1, rotate: 0, ease: 'power2.out', scrollTrigger: { trigger: orbit, start: 'top 90%', end: 'top 45%', scrub: 0.8 } });
      }

      // CTA: the homepage's "Get started" motion (same values as on the homepage)
      const cta = $('#cta .cta');
      const ctaTitle = cta && $('h2', cta);
      if (ctaTitle) {
        const words = splitWords(ctaTitle);
        const eyebrow = $('.eyebrow', cta);
        const lead = $(':scope > p:not(.form-msg)', cta);
        gsap.set(words, { y: 0, yPercent: 120, rotation: 3 });
        if (eyebrow) gsap.set(eyebrow, { autoAlpha: 0, y: 14 });
        if (lead) gsap.set(lead, { autoAlpha: 0, y: 26 });
        ST.create({
          trigger: cta, start: 'top 82%', once: true,
          onEnter: () => {
            const tl = gsap.timeline();
            if (eyebrow) tl.to(eyebrow, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 0);
            toLines(words).forEach((line, i) => tl.to(line, { y: 0, yPercent: 0, rotation: 0, duration: 1.15, ease: 'expo.out', stagger: 0.035 }, 0.08 + i * 0.14));
            if (lead) tl.to(lead, { autoAlpha: 1, y: 0, duration: 1.1, ease: 'power3.out' }, 0.45);
          },
        });
      }
    });

    // 3b. Mouse/trackpad screens: hero entrance + drift, pinned call journey, handoff token, CTA tilt
    mm.add(STORY_MQ, () => {
      const root = document.documentElement;
      root.classList.add('wa-story-on');

      // Hero: headline rises, the blinds lift, the phone rises and the automation cards appear
      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .from('.wa-hero__title .wa-line__in', { yPercent: 110, duration: 1.1, stagger: 0.12 }, 0.1)
        .from('.wa-hero__lead, .wa-hero__cta', { y: 24, autoAlpha: 0, duration: 0.9, stagger: 0.1 }, 0.45)
        .from('.wa-hero__stripes', { scaleY: 0.4, autoAlpha: 0, duration: 1.4, ease: 'expo.out' }, 0.2)
        .from('.wa-hphone', { y: 80, autoAlpha: 0, duration: 1.3, ease: 'expo.out' }, 0.5)
        .from('.wa-thread > *', { y: 14, autoAlpha: 0, duration: 0.5, stagger: 0.18 }, 1)
        .from('.wa-card', { y: 24, scale: 0.92, autoAlpha: 0, duration: 0.7, stagger: 0.12, ease: 'back.out(1.6)' }, 1.1)
        .from('.wa-link', { scaleX: 0, autoAlpha: 0, duration: 0.6 }, 1.3);
      gsap.timeline({ scrollTrigger: { trigger: '.wa-hero', start: 'top top', end: 'bottom top', scrub: 0.8 } })
        .to('.wa-hero__copy', { y: -60, ease: 'none' }, 0); // the phone stays planted on the panel edge

      // Call journey: pinned stage; steps light up while the call card plays the matching part of the call
      const journey = $('.wa-journey');
      const steps = $$('[data-wa-step]');
      const msgs = $$('[data-wa-msg]');
      const call = $('.wa-call');
      const status = $('[data-wa-status]');
      const timer = $('[data-wa-timer]');
      const STATUS = ['New message', 'Replied instantly', 'Collecting details', 'Updating the order', 'Resolved · CRM updated'];
      const TIME = ['10:02', '10:02', '10:03', '10:03', '10:04'];
      let shown = -1;
      const show = (i) => {
        if (i === shown) return;
        shown = i;
        steps.forEach((s, k) => { s.classList.toggle('is-on', k === i); s.classList.toggle('is-past', k < i); });
        msgs.forEach((m) => m.classList.toggle('is-in', parseInt(m.dataset.waMsg, 10) <= i + 1));
        if (status) status.textContent = STATUS[i];
        if (timer) timer.textContent = TIME[i];
        if (call) call.dataset.stage = String(i);
        $$('[data-wa-tag]').forEach((t) => t.classList.toggle('is-on', parseInt(t.dataset.waTag, 10) <= i + 1));
      };
      show(0);
      ST.create({
        trigger: journey, start: 'top top', end: 'bottom bottom',
        onUpdate: (self) => show(Math.min(steps.length - 1, Math.floor(self.progress * steps.length * 0.999 + 0.0001))),
      });
      gsap.fromTo('.wa-call', { y: 60, rotationX: 10, autoAlpha: 0 }, { y: 0, rotationX: 0, autoAlpha: 1, ease: 'power2.out', scrollTrigger: { trigger: journey, start: 'top 80%', end: 'top 20%', scrub: 0.8 } });

      // AI + your team: the chat travels from Telza AI to your team with the scroll
      const token = $('[data-wa-token]');
      if (token) {
        gsap.fromTo(token, { left: '0%' }, { left: '100%', ease: 'none', scrollTrigger: { trigger: '.wa-relay', start: 'top 70%', end: 'bottom 40%', scrub: 0.8 } });
      }

      // CTA box tilts into place (same values as the homepage)
      const ctaBox = $('#cta .cta');
      if (ctaBox) {
        ctaBox.classList.add('wa-dz');
        gsap.fromTo(ctaBox, { '--dy': '80px', '--drx': '16deg', '--ds': 0.92 }, {
          '--dy': '0px', '--drx': '0deg', '--ds': 1, ease: 'power2.out',
          scrollTrigger: { trigger: '#cta', start: 'top bottom', end: 'top 35%', scrub: 1.2 },
        });
      }

      const refresh = () => ST.refresh();
      window.addEventListener('load', refresh);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
      return () => {
        root.classList.remove('wa-story-on');
        steps.forEach((s) => s.classList.remove('is-on', 'is-past'));
        msgs.forEach((m) => m.classList.remove('is-in'));
        if (ctaBox) { ctaBox.classList.remove('wa-dz'); ['--dy', '--drx', '--ds'].forEach((v) => ctaBox.style.removeProperty(v)); }
        window.removeEventListener('load', refresh);
      };
    });
  }

  function boot() {
    initBars();
    initUses();
    initMotion();
    initWhy();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
