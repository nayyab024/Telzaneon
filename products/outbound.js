/* ==========================================================================
   Telza: Outbound Calling product page (mirrors inbound.js; the hero illustration replaces the inbound image)
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
    $$('[data-ob-bars]').forEach((box) => {
      const n = parseInt(box.dataset.obBars, 10) || 30;
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

  /* ---------- 2. Hero illustration: lead cards cycle dialing → talking → outcome (illustrative) ---------- */
  function initLeads() {
    const leads = $$('[data-ob-lead]');
    if (!leads.length) return;
    const OUTCOMES = ['Qualified', 'Callback requested', 'Qualified', 'Appointment confirmed'];
    const OFFSET = [2, 0, 4, 5];
    let tick = 0;
    const paint = () => leads.forEach((lead, i) => {
      const phase = (tick + OFFSET[i]) % 6; // 0-1 dialing · 2-3 talking · 4-5 outcome
      const state = phase < 2 ? 'dialing' : phase < 4 ? 'talking' : 'done';
      lead.dataset.state = state;
      $('em', lead).textContent = state === 'dialing' ? 'Dialing' : state === 'talking' ? 'Talking' : OUTCOMES[i];
    });
    paint();
    if (reduceMotion) return;
    const scene = $('.ob-scene');
    let timer = 0;
    let on = true;
    const sync = () => {
      const run = on && !document.hidden;
      if (run && !timer) timer = setInterval(() => { tick += 1; paint(); }, 1500);
      if (!run && timer) { clearInterval(timer); timer = 0; }
    };
    if (scene && 'IntersectionObserver' in window) new IntersectionObserver(([e]) => { on = e.isIntersecting; sync(); }).observe(scene);
    document.addEventListener('visibilitychange', sync);
    sync();
  }
  /* ---------- Use cases: accessible tabs (click, arrow keys, Home / End) ---------- */
  function initUses() {
    const box = $('[data-ob-uses]');
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
    const items = $$('[data-ob-why]');
    const notes = $$('[data-ob-note]');
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
      const intro = $('.ob-intro');
      if (intro) {
        gsap.timeline({ scrollTrigger: { trigger: intro, start: 'top 85%', end: 'top 25%', scrub: 0.8 } })
          .fromTo($$('.ob-line__in', intro), { yPercent: 110 }, { yPercent: 0, stagger: 0.15, duration: 0.6, ease: 'power3.out' })
          .fromTo($('.ob-intro__lead', intro), { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.4 }, 0.4)
          .fromTo($('.ob-mark', intro), { '--mk': '0%' }, { '--mk': '100%', duration: 0.5, ease: 'power2.inOut' }, 0.5)
          .fromTo($$('.ob-chips li', intro), { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.06, duration: 0.3 }, 0.6);
      }

      // Benefits and features arrive one by one
      [['.ob-benefits__grid', '.ob-benefit'], ['.ob-features__grid', '.ob-feature']].forEach(([grid, item]) => {
        const g = $(grid);
        if (!g) return;
        gsap.fromTo($$(item, g), { y: 60, autoAlpha: 0 }, {
          y: 0, autoAlpha: 1, stagger: 0.12, ease: 'power2.out',
          scrollTrigger: { trigger: g, start: 'top 88%', end: 'top 40%', scrub: 0.8 },
        });
      });

      // AI + your team: highlighter, then the two lanes slide in from their sides
      const ho = $('.ob-handoff');
      if (ho) {
        gsap.fromTo($('.ob-mark', ho), { '--mk': '0%' }, { '--mk': '100%', ease: 'power2.inOut', scrollTrigger: { trigger: ho, start: 'top 70%', end: 'top 35%', scrub: 0.8 } });
        gsap.fromTo('.ob-lane--ai', { x: -60, autoAlpha: 0 }, { x: 0, autoAlpha: 1, ease: 'power2.out', scrollTrigger: { trigger: '.ob-relay', start: 'top 85%', end: 'top 50%', scrub: 0.8 } });
        gsap.fromTo('.ob-lane--team', { x: 60, autoAlpha: 0 }, { x: 0, autoAlpha: 1, ease: 'power2.out', scrollTrigger: { trigger: '.ob-relay', start: 'top 85%', end: 'top 50%', scrub: 0.8 } });
      }

      // Integrations: the orbit grows in
      const orbit = $('.ob-orbit');
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
      root.classList.add('ob-story-on');

      // Hero: headline rises, the blinds lift, the agent appears and the calls fan out to the leads
      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .from('.ob-hero__title .ob-line__in', { yPercent: 110, duration: 1.1, stagger: 0.12 }, 0.1)
        .from('.ob-hero__lead, .ob-hero__cta', { y: 24, autoAlpha: 0, duration: 0.9, stagger: 0.1 }, 0.45)
        .from('.ob-hero__stripes', { scaleY: 0.4, autoAlpha: 0, duration: 1.4, ease: 'expo.out' }, 0.2)
        .from('.ob-desk', { y: 60, autoAlpha: 0, duration: 1.2, ease: 'expo.out' }, 0.5)
        .from('.ob-agent', { scale: 0.6, autoAlpha: 0, duration: 1.1, ease: 'expo.out' }, 0.7)
        .from('.ob-calls__lines path', { autoAlpha: 0, duration: 0.6, stagger: 0.1 }, 1)
        .from('.ob-lead', { y: 24, scale: 0.9, autoAlpha: 0, duration: 0.7, stagger: 0.1, ease: 'back.out(1.6)' }, 1.05)
        .from('.ob-bubble', { y: 20, autoAlpha: 0, duration: 0.7, stagger: 0.15 }, 1.4);
      gsap.timeline({ scrollTrigger: { trigger: '.ob-hero', start: 'top top', end: 'bottom top', scrub: 0.8 } })
        .to('.ob-hero__copy', { y: -60, ease: 'none' }, 0); // the illustration stays planted on the panel edge

      // Call journey: pinned stage; steps light up while the call card plays the matching part of the call
      const journey = $('.ob-journey');
      const steps = $$('[data-ob-step]');
      const msgs = $$('[data-ob-msg]');
      const call = $('.ob-call');
      const status = $('[data-ob-status]');
      const timer = $('[data-ob-timer]');
      const STATUS = ['Campaign starting · inside calling window', 'Dialing…', 'Connected · personalised from CRM', 'Qualifying · handling an objection', 'Booked · outcome logged'];
      const TIME = ['--:--', '00:00', '00:08', '00:41', '01:24'];
      let shown = -1;
      const show = (i) => {
        if (i === shown) return;
        shown = i;
        steps.forEach((s, k) => { s.classList.toggle('is-on', k === i); s.classList.toggle('is-past', k < i); });
        msgs.forEach((m) => m.classList.toggle('is-in', parseInt(m.dataset.obMsg, 10) <= i + 1));
        if (status) status.textContent = STATUS[i];
        if (timer) timer.textContent = TIME[i];
        if (call) call.dataset.stage = String(i);
      };
      show(0);
      ST.create({
        trigger: journey, start: 'top top', end: 'bottom bottom',
        onUpdate: (self) => show(Math.min(steps.length - 1, Math.floor(self.progress * steps.length * 0.999 + 0.0001))),
      });
      gsap.fromTo('.ob-call', { y: 60, rotationX: 10, autoAlpha: 0 }, { y: 0, rotationX: 0, autoAlpha: 1, ease: 'power2.out', scrollTrigger: { trigger: journey, start: 'top 80%', end: 'top 20%', scrub: 0.8 } });

      // AI + your team: the qualified lead travels from Telza AI to your team with the scroll
      const token = $('[data-ob-token]');
      if (token) {
        gsap.fromTo(token, { left: '0%' }, { left: '100%', ease: 'none', scrollTrigger: { trigger: '.ob-relay', start: 'top 70%', end: 'bottom 40%', scrub: 0.8 } });
      }

      // CTA box tilts into place (same values as the homepage)
      const ctaBox = $('#cta .cta');
      if (ctaBox) {
        ctaBox.classList.add('ob-dz');
        gsap.fromTo(ctaBox, { '--dy': '80px', '--drx': '16deg', '--ds': 0.92 }, {
          '--dy': '0px', '--drx': '0deg', '--ds': 1, ease: 'power2.out',
          scrollTrigger: { trigger: '#cta', start: 'top bottom', end: 'top 35%', scrub: 1.2 },
        });
      }

      const refresh = () => ST.refresh();
      window.addEventListener('load', refresh);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
      return () => {
        root.classList.remove('ob-story-on');
        steps.forEach((s) => s.classList.remove('is-on', 'is-past'));
        msgs.forEach((m) => m.classList.remove('is-in'));
        if (ctaBox) { ctaBox.classList.remove('ob-dz'); ['--dy', '--drx', '--ds'].forEach((v) => ctaBox.style.removeProperty(v)); }
        window.removeEventListener('load', refresh);
      };
    });
  }

  function boot() {
    initBars();
    initLeads();
    initUses();
    initMotion();
    initWhy();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
