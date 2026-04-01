const SELECTOR = 'span[data-test-id="conversation-title"]';

let bodyObs = null;
let titleObs = null;
let titleTagObs = null;
let currentTitle = null;

function applyTitle(el) {
  const title = el.innerText.trim();
  if (title) {
    currentTitle = title;
    document.title = `${title} - Google Gemini`;
  }
}

function watchTitleTag() {
  if (titleTagObs) return;
  const titleEl = document.querySelector('title');
  if (!titleEl) return;
  titleTagObs = new MutationObserver(() => {
    if (currentTitle) {
      const desired = `${currentTitle} - Google Gemini`;
      if (document.title !== desired) document.title = desired;
    }
  });
  titleTagObs.observe(titleEl, { childList: true, characterData: true, subtree: true });
}

function trackTitle(el) {
  if (titleObs) titleObs.disconnect();
  applyTitle(el);
  watchTitleTag();
  titleObs = new MutationObserver(() => applyTitle(el));
  titleObs.observe(el, { childList: true, subtree: true, characterData: true });
}

function watchTitle() {
  currentTitle = null;
  if (bodyObs) { bodyObs.disconnect(); bodyObs = null; }
  if (titleObs) { titleObs.disconnect(); titleObs = null; }

  const el = document.querySelector(SELECTOR);
  if (el) return trackTitle(el);

  bodyObs = new MutationObserver((_, obs) => {
    const el = document.querySelector(SELECTOR);
    if (!el) return;
    obs.disconnect();
    bodyObs = null;
    trackTitle(el);
  });
  bodyObs.observe(document.body, { childList: true, subtree: true });
}

// Detect SPA navigation via History API
const _push = history.pushState.bind(history);
history.pushState = function (...args) { _push(...args); watchTitle(); };

const _replace = history.replaceState.bind(history);
history.replaceState = function (...args) { _replace(...args); watchTitle(); };

window.addEventListener('popstate', watchTitle);

// Initial run + tab-switch fallback
watchTitle();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') watchTitle();
});
