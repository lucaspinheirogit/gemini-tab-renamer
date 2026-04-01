const SELECTOR = 'span[data-test-id="conversation-title"]';

let bodyObs = null;
let titleObs = null;
let titleTagObs = null;
let currentTitle = null;
let abortController = null;

const _origPushState = history.pushState.bind(history);
const _origReplaceState = history.replaceState.bind(history);

function getText(el) {
  return (el.innerText ?? el.textContent).trim();
}

function applyTitle(el) {
  const title = getText(el);
  if (title && title.length <= 500) {
    currentTitle = title;
    document.title = `${title} - Google Gemini`;
  }
}

function trackTitle(el) {
  if (titleObs) titleObs.disconnect();
  applyTitle(el);
  titleObs = new MutationObserver(() => applyTitle(el));
  titleObs.observe(el, { childList: true, subtree: true, characterData: true });
}

function waitForTitle(staleText) {
  if (bodyObs) bodyObs.disconnect();

  // Angular may have already updated the DOM before pushState fired — check immediately.
  const el = document.querySelector(SELECTOR);
  if (el) {
    const text = getText(el);
    if (text && text !== staleText) {
      trackTitle(el);
      return;
    }
  }

  bodyObs = new MutationObserver((_, obs) => {
    const el = document.querySelector(SELECTOR);
    if (!el) return;
    const text = getText(el);
    if (!text || text === staleText) return;
    obs.disconnect();
    bodyObs = null;
    trackTitle(el);
  });
  bodyObs.observe(document.body, { childList: true, subtree: true, characterData: true });
}

function watchTitle(immediate = true) {
  // Use currentTitle (what we last set) as the reference point — not the live DOM,
  // which Angular may have already mutated before our pushState intercept fires.
  const staleText = currentTitle;

  currentTitle = null;
  if (bodyObs) { bodyObs.disconnect(); bodyObs = null; }
  if (titleObs) { titleObs.disconnect(); titleObs = null; }

  if (immediate) {
    const el = document.querySelector(SELECTOR);
    if (el) return trackTitle(el);
  }

  waitForTitle(staleText);
}

function init() {
  if (abortController) abortController.abort();
  abortController = new AbortController();
  const { signal } = abortController;

  if (titleTagObs) { titleTagObs.disconnect(); titleTagObs = null; }

  const titleEl = document.querySelector('title');
  if (titleEl) {
    titleTagObs = new MutationObserver(() => {
      if (currentTitle) {
        const desired = `${currentTitle} - Google Gemini`;
        if (document.title !== desired) document.title = desired;
      }
    });
    titleTagObs.observe(titleEl, { childList: true, characterData: true, subtree: true });
  }

  history.pushState = _origPushState;
  history.replaceState = _origReplaceState;
  history.pushState = (...args) => { _origPushState(...args); watchTitle(false); };
  history.replaceState = (...args) => { _origReplaceState(...args); watchTitle(false); };

  // Navigation API (Chrome 102+) — complements pushState interception.
  if (window.navigation) {
    window.navigation.addEventListener('navigate', () => watchTitle(false), { signal });
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') watchTitle();
  }, { signal });

  watchTitle();
}

init();

if (typeof module !== 'undefined') module.exports = { init };
