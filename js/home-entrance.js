/* First-entry overlay only. The Butterfly homepage underneath is never replaced. */
(() => {
  'use strict';
  const state = window.EurekaEntrance;
  const root = document.getElementById('home-entrance');
  if (!root) return;
  if (!state?.active) { root.remove(); return; }

  let frame = 0;
  let resizeObserver;
  let keyboardDismissal = false;
  const events = new AbortController();
  const previousFocus = document.activeElement;
  const background = [...document.body.children]
    .filter(el => el !== root && !['SCRIPT', 'STYLE', 'LINK'].includes(el.tagName))
    .map(el => ({ el, inert: el.inert }));

  state.onFinish = () => {
    cancelAnimationFrame(frame);
    resizeObserver?.disconnect();
    events.abort();
    background.forEach(({ el, inert }) => { el.inert = inert; });
    if (root.contains(document.activeElement)) {
      const focusTarget = previousFocus !== document.body && previousFocus?.isConnected
        ? previousFocus : keyboardDismissal ? document.querySelector('#nav .nav-site-title') : null;
      if (focusTarget) focusTarget.focus({ preventScroll: true });
      else document.activeElement.blur();
    }
  };

  try {
    const $ = selector => root.querySelector(selector);
    const sphere = $('.he-sphere');
    const rings = $('.he-rings');
    const tunnel = $('.he-tunnel');
    const greet = $('.he-greet');
    const word = $('.he-word');
    const face = $('.he-face');
    const avatar = $('.he-avatar');
    const rain = $('.he-rain');
    const rainCtx = rain.getContext('2d');
    const pixels = $('.he-pixels');
    const pixelCtx = pixels.getContext('2d');
    const source = document.createElement('canvas');
    const sourceCtx = source.getContext('2d');
    const tiny = document.createElement('canvas');
    const tinyCtx = tiny.getContext('2d');
    if (!rainCtx || !pixelCtx || !sourceCtx || !tinyCtx) { state.finish(); return; }

    const ns = 'http://www.w3.org/2000/svg';
    const title = $('.he-ghost').textContent;
    const configuredDuration = Number(root.dataset.homeEntranceDuration);
    const duration = Number.isFinite(configuredDuration)
      ? Math.min(Math.max(configuredDuration, 3000), 8000)
      : 4200;
    // Scale every stage together: the last band must settle before pixelation.
    const greetAt = duration * .18;
    const bandStagger = duration * .025;
    const bandDuration = duration * .16;
    const formedAt = greetAt + 4 * bandStagger + bandDuration;
    const openAt = formedAt + duration * .20;
    const openDuration = duration - openAt;
    const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
    const mix = (a, b, t) => a + (b - a) * t;
    const out = x => 1 - Math.pow(1 - clamp(x), 3);
    const quint = x => { x = clamp(x); return x < .5 ? 16 * x ** 5 : 1 - (-2 * x + 2) ** 5 / 2; };
    const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };
    const fract = x => x - Math.floor(x);
    const hash = n => fract(Math.sin(n * 127.1 + 311.7) * 43758.5453);
    let width = 1, height = 1, snapshotReady = false;
    const css = getComputedStyle(root);
    const ink = css.getPropertyValue('--he-ink').trim();
    const rainInk = css.getPropertyValue('--he-rain').trim();

    const ellipses = Array.from({ length: 15 }, () => {
      const el = document.createElementNS(ns, 'ellipse');
      el.setAttribute('cy', '50');
      rings.append(el);
      return el;
    });
    const shutters = Array.from({ length: 16 }, (_, i) => {
      const el = document.createElement('div');
      el.className = 'he-shutter';
      el.style.left = `${i * 6.25}%`;
      $('.he-shutters').append(el);
      return el;
    });
    for (let i = 0; i < 18; i++) {
      const line = document.createElementNS(ns, 'line');
      const angle = i / 18 * Math.PI * 2;
      line.setAttribute('x1', 500 + Math.cos(angle) * 92);
      line.setAttribute('y1', 325 + Math.sin(angle) * 68);
      line.setAttribute('x2', 500 + Math.cos(angle) * 1100);
      line.setAttribute('y2', 325 + Math.sin(angle) * 850);
      line.setAttribute('vector-effect', 'non-scaling-stroke');
      tunnel.append(line);
    }
    const bands = [];
    for (let i = 0; i < 5; i++) {
      const x0 = i * 31.6, x1 = (i + 1) * 31.6;
      for (const container of [word, face]) {
        const band = document.createElement('span');
        band.className = 'he-band';
        band.style.clipPath = `polygon(${x0 - 58}% 0,${x1 - 58}% 0,${x1}% 100%,${x0}% 100%)`;
        if (container === word) band.textContent = title;
        else {
          const img = document.createElement('img');
          img.src = avatar.src;
          img.alt = '';
          band.append(img);
        }
        container.append(band);
        bands.push({ el: band, index: i });
      }
    }

    function resize() {
      width = root.clientWidth;
      height = root.clientHeight;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      rain.width = Math.ceil(width * dpr);
      rain.height = Math.ceil(height * dpr);
      rainCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const size = parseFloat(getComputedStyle(sphere).width);
      sphere.style.strokeWidth = `${100 / Math.max(size, 1)}px`;
      snapshotReady = false;
    }

    function buildSnapshot() {
      if (!avatar.complete || !avatar.naturalWidth) return false;
      const g = greet.getBoundingClientRect();
      const f = face.getBoundingClientRect();
      const w = word.getBoundingClientRect();
      source.width = pixels.width = Math.ceil(g.width);
      source.height = pixels.height = Math.ceil(g.height);
      const crop = Math.min(avatar.naturalWidth, avatar.naturalHeight);
      sourceCtx.filter = 'grayscale(.65)';
      sourceCtx.drawImage(avatar, (avatar.naturalWidth - crop) / 2,
        (avatar.naturalHeight - crop) * .72, crop, crop,
        f.left - g.left, f.top - g.top, f.width, f.height);
      sourceCtx.filter = 'none';
      const textStyle = getComputedStyle(word);
      sourceCtx.font = `${textStyle.fontWeight} ${textStyle.fontSize} ${textStyle.fontFamily}`;
      sourceCtx.letterSpacing = textStyle.letterSpacing;
      sourceCtx.textBaseline = 'middle';
      sourceCtx.fillStyle = ink;
      sourceCtx.fillText(title, w.left - g.left, w.top - g.top + w.height / 2);
      snapshotReady = true;
      return true;
    }

    function pixelate(p) {
      if (!snapshotReady && !buildSnapshot()) return;
      pixels.hidden = false;
      word.style.visibility = face.style.visibility = 'hidden';
      const cell = 1 + Math.floor(clamp(p) * 15);
      tiny.width = Math.max(1, Math.ceil(source.width / cell));
      tiny.height = Math.max(1, Math.ceil(source.height / cell));
      tinyCtx.drawImage(source, 0, 0, tiny.width, tiny.height);
      pixelCtx.clearRect(0, 0, pixels.width, pixels.height);
      pixelCtx.imageSmoothingEnabled = false;
      pixelCtx.drawImage(tiny, 0, 0, pixels.width, pixels.height);
      const threshold = clamp((p - .2) / .8);
      for (let y = 0; y < pixels.height; y += 10) {
        for (let x = 0; x < pixels.width; x += 10) {
          if (hash(x / 10 + y / 10 * 71) < threshold) pixelCtx.clearRect(x, y, 10, 10);
        }
      }
    }

    function drawRain(t, alpha) {
      rainCtx.clearRect(0, 0, width, height);
      rainCtx.strokeStyle = rainInk;
      const count = width < 500 ? 58 : 100;
      for (let i = 0; i < count; i++) {
        const phase = fract(t / (2400 + hash(i + 44) * 3000) + hash(i + 3));
        const len = 8 + hash(i + 9) * 27;
        const x = hash(i + 17) * width + Math.sin(t / 2300 + i) * 2 - phase * 7;
        const y = phase * (height + len * 2) - len;
        rainCtx.globalAlpha = Math.sin(phase * Math.PI) * (.14 + hash(i + 1) * .5) * .42 * alpha;
        rainCtx.lineWidth = i % 9 === 0 ? .9 : .55;
        rainCtx.beginPath();
        rainCtx.moveTo(x, y);
        rainCtx.bezierCurveTo(x + 1, y + len * .35, x - 1.7, y + len * .7, x + .4, y + len);
        rainCtx.stroke();
      }
      rainCtx.globalAlpha = 1;
    }

    function draw(t) {
      const opening = clamp((t - openAt) / openDuration);
      root.toggleAttribute('data-opening', t >= openAt);
      root.style.opacity = String(1 - clamp((opening - .9) / .1));
      shutters.forEach((el, i) => {
        const side = i < 8 ? -1 : 1;
        const p = smooth((opening - .34 - Math.abs(i - 7.5) * .012) / .56);
        el.style.transform = `translate3d(${side * width * .72 * p}px,0,${Math.min(width, height) * .28 * p}px) rotateY(${side * -24 * p}deg)`;
      });
      rings.setAttribute('transform', `rotate(${-30 * (1 - out(opening / .33))} 50 50)`);
      const time = Math.min(t, openAt);
      ellipses.forEach((el, i) => {
        const phase = fract(1 - i / 14 - time * .0001);
        const depth = (.5 - .5 * Math.pow(Math.abs(phase - .5) * 2, 1.5)) * 55;
        const radius = Math.sqrt(Math.max(0, 110 * depth - depth * depth));
        const form = quint((time - i * 20) / 1200);
        const birth = out((time - i * 26.5) / 702);
        const pinch = 1 - .98 * out((opening - i / 180) / .33);
        el.setAttribute('cx', mix(50, 11 + 78 * phase, form));
        el.setAttribute('rx', Math.max(0, mix(48, radius * .5, form) * birth * pinch));
        el.setAttribute('ry', Math.max(0, mix(48, radius, form) * birth));
        el.style.opacity = String(birth * (i % 3 === 1 ? .42 : .83));
      });
      let sx, sy;
      if (opening < .34) {
        const p = out(opening / .34); sx = mix(1, 1.45, p); sy = mix(1, 1.6, p);
      } else if (opening < .65) {
        const p = smooth((opening - .34) / .31); sx = mix(1.45, 4, p); sy = mix(1.6, 5, p);
      } else {
        const p = smooth((opening - .65) / .35); sx = mix(4, 10, p); sy = mix(5, 12, p);
      }
      sphere.style.transform = `scale(${sx},${sy})`;
      sphere.style.opacity = String(1 - clamp((opening - .45) / .55));
      const tunnelAlpha = opening < .45 ? mix(0, .45, clamp((opening - .3) / .15))
        : opening < .72 ? mix(.45, .6, (opening - .45) / .27) : mix(.6, 0, (opening - .72) / .28);
      tunnel.style.opacity = String(Math.max(0, tunnelAlpha));
      const tunnelScale = opening < .72 ? mix(.35, 1.3, clamp(opening / .72)) : mix(1.3, 3, (opening - .72) / .28);
      tunnel.style.transform = `scale(${tunnelScale})`;
      greet.style.opacity = t >= greetAt ? '1' : '0';
      bands.forEach(({ el, index }) => {
        const p = out((t - greetAt - index * bandStagger) / bandDuration);
        el.style.opacity = String(p);
        el.style.transform = `translate(${(1 - p) * 22}%,${(1 - p) * -14}%)`;
      });
      if (t >= openAt && t < openAt + openDuration * .42) pixelate((t - openAt) / (openDuration * .42));
      if (t >= openAt + openDuration * .42) greet.style.visibility = 'hidden';
      drawRain(t, 1 - clamp((opening - .3) / .7));
    }

    root.removeAttribute('aria-hidden');
    background.forEach(({ el }) => { el.inert = true; });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        keyboardDismissal = true;
        event.preventDefault();
        state.finish();
      }
    }, { signal: events.signal });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) state.finish();
    }, { signal: events.signal });
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    motion.addEventListener('change', event => { if (event.matches) state.finish(); }, { signal: events.signal });
    avatar.addEventListener('load', () => { snapshotReady = false; }, { signal: events.signal });
    resize();
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(root);
    root.focus({ preventScroll: true });
    const started = performance.now();
    draw(0);
    function tick(now) {
      if (!state.active) return;
      try {
        const t = now - started;
        if (t >= duration) { state.finish(); return; }
        draw(t);
        frame = requestAnimationFrame(tick);
      } catch (error) {
        console.warn('Homepage entrance skipped:', error);
        state.finish();
      }
    }
    frame = requestAnimationFrame(tick);
  } catch (error) {
    console.warn('Homepage entrance unavailable:', error);
    state.finish();
  }
})();
