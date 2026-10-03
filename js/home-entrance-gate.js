/* Inlined in <head>: decide before the first paint, and fail open if playback fails. */
(() => {
  'use strict';
  if (window.EurekaEntrance) return;

  const state = { active: false, onFinish: null };
  window.EurekaEntrance = state;
  const html = document.documentElement;
  let timer;

  state.finish = () => {
    if (!state.active) return;
    state.active = false;
    clearTimeout(timer);
    html.removeAttribute('data-home-entrance');
    try {
      state.onFinish?.();
    } finally {
      document.getElementById('home-entrance')?.remove();
      document.dispatchEvent(new CustomEvent('home-entrance:complete'));
    }
  };

  // Record visits to every page, so article → home is never treated as first entry.
  let firstVisit = true;
  try {
    firstVisit = !sessionStorage.getItem('eurekayu:site-visited');
    sessionStorage.setItem('eurekayu:site-visited', '1');
  } catch {
    // Storage can be unavailable. The entrance must still be skippable and bounded.
  }
  const home = document.currentScript?.dataset.homeEntranceEntry === 'home';
  const configuredMaxDuration = Number(document.currentScript?.dataset.homeEntranceMaxDuration);
  const maxDuration = Number.isFinite(configuredMaxDuration)
    ? Math.min(Math.max(configuredMaxDuration, 3000), 10000)
    : 5500;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const navigation = performance.getEntriesByType('navigation')[0];
  const restoredNavigation = navigation && ['reload', 'back_forward'].includes(navigation.type);
  if (!home || !firstVisit || reducedMotion || restoredNavigation || location.hash) return;

  state.active = true;
  html.setAttribute('data-home-entrance', 'active');
  timer = setTimeout(state.finish, maxDuration);
  window.addEventListener('pagehide', state.finish, { once: true });
  document.addEventListener('pjax:send', state.finish, { once: true });
})();
