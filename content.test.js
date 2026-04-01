const { init } = require('./content');

const flush = () => new Promise(r => setTimeout(r, 0));

function makeTitleSpan(text) {
  const el = document.createElement('span');
  el.setAttribute('data-test-id', 'conversation-title');
  el.textContent = text;
  return el;
}

beforeEach(() => {
  document.head.innerHTML = '<title>Google Gemini</title>';
  document.body.innerHTML = '';
  init();
});

// ─── 1. Page Load ─────────────────────────────────────────────────────────────

describe('page load', () => {
  test('sets title when opening a chat URL directly (bookmark or reload)', () => {
    document.body.appendChild(makeTitleSpan('My Chat'));
    init();
    expect(document.title).toBe('My Chat - Google Gemini');
  });
});

// ─── 2. Tab Focus ─────────────────────────────────────────────────────────────

describe('tab focus', () => {
  test('restores title when switching back to the tab', async () => {
    document.body.appendChild(makeTitleSpan('My Chat'));
    init();

    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    await flush();
    expect(document.title).toBe('My Chat - Google Gemini');
  });
});

// ─── 3. Navigation ────────────────────────────────────────────────────────────

describe('navigation', () => {
  test('sets title when starting a new chat (/app → /app/{id})', async () => {
    history.pushState({}, '', '/app/abc123');
    document.body.appendChild(makeTitleSpan('New Chat'));
    await flush();
    expect(document.title).toBe('New Chat - Google Gemini');
  });

  test('clears title when returning to /app', async () => {
    const span = makeTitleSpan('My Chat');
    document.body.appendChild(span);
    init();

    history.pushState({}, '', '/app');
    document.body.removeChild(span);
    document.title = 'Google Gemini';
    await flush();
    expect(document.title).toBe('Google Gemini');
  });

  test('updates title when switching to another chat', async () => {
    const oldSpan = makeTitleSpan('First Chat');
    document.body.appendChild(oldSpan);
    init();

    history.pushState({}, '', '/app/chat2');
    document.body.removeChild(oldSpan);
    document.body.appendChild(makeTitleSpan('Second Chat'));
    await flush();
    expect(document.title).toBe('Second Chat - Google Gemini');
  });
});

// ─── 4. Title Mutation ────────────────────────────────────────────────────────

describe('title mutation', () => {
  test('sets title when Gemini generates it after the first message', async () => {
    const span = makeTitleSpan('');
    document.body.appendChild(span);
    init();
    expect(document.title).toBe('Google Gemini');

    span.textContent = 'Generated Title';
    await flush();
    expect(document.title).toBe('Generated Title - Google Gemini');
  });

  test('updates title when Gemini renames the conversation', async () => {
    const span = makeTitleSpan('Initial Title');
    document.body.appendChild(span);
    init();

    span.textContent = 'Updated Title';
    await flush();
    expect(document.title).toBe('Updated Title - Google Gemini');
  });

  test('ignores empty title during loading state', async () => {
    const span = makeTitleSpan('My Chat');
    document.body.appendChild(span);
    init();

    span.textContent = '';
    await flush();
    expect(document.title).toBe('My Chat - Google Gemini');
  });

  test('prevents Gemini from resetting the title mid-session', async () => {
    const span = makeTitleSpan('My Chat');
    document.body.appendChild(span);
    init();
    expect(document.title).toBe('My Chat - Google Gemini');

    document.title = 'Google Gemini';
    await flush();
    expect(document.title).toBe('My Chat - Google Gemini');
  });
});
