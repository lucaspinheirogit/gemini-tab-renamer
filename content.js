const SELECTOR = 'span[data-test-id="conversation-title"]';

function applyTitle(el) {
  const title = el.innerText.trim();
  if (title) document.title = `${title} - Google Gemini`;
}

function trackTitle(el) {
  applyTitle(el);
  new MutationObserver(() => applyTitle(el))
    .observe(el, { childList: true, subtree: true, characterData: true });
}

function watchTitle() {
  const el = document.querySelector(SELECTOR);
  if (el) return trackTitle(el);

  new MutationObserver((_, obs) => {
    const el = document.querySelector(SELECTOR);
    if (!el) return;
    obs.disconnect();
    trackTitle(el);
  }).observe(document.body, { childList: true, subtree: true });
}

watchTitle();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') watchTitle();
});
