const SELECTOR = 'span[data-test-id="conversation-title"]';

let bodyObs = null;
let titleObs = null;
let currentTitle = null;

new MutationObserver(() => {
  if (currentTitle) {
    const desired = `${currentTitle} - Google Gemini`;
    if (document.title !== desired) document.title = desired;
  }
}).observe(document.querySelector('title'), { childList: true, characterData: true, subtree: true });

function applyTitle(el) {
  const title = el.innerText.trim();
  if (title) {
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

for (const method of ['pushState', 'replaceState']) {
  const orig = history[method].bind(history);
  history[method] = (...args) => { orig(...args); watchTitle(); };
}

window.addEventListener('popstate', watchTitle);
watchTitle();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') watchTitle();
});
