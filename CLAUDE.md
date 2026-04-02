# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm test                        # run all tests
npx jest --testNamePattern="<name>"  # run a single test by name
```

No build step — the extension is loaded directly as an unpacked extension in Chrome (`chrome://extensions/` → "Load unpacked").

## Architecture

This is a Manifest V3 Chrome extension with a single content script (`content.js`) that runs on `https://gemini.google.com/app/*`.

**Core problem**: Gemini is a single-page app (Angular). The page title resets to a generic value on every navigation and during Gemini's own title-generation phase. The extension must handle three competing forces:
1. The SPA framework (likely Angular, based on `ng-` prefixed attributes in the DOM) updating the DOM before firing `pushState`
2. Gemini asynchronously generating and then mutating the conversation title element
3. Chrome and Gemini both overwriting `document.title` at unpredictable times

**How it works**:
- `init()` intercepts `history.pushState`/`replaceState` and listens to the Navigation API and `visibilitychange` to detect navigations
- `watchTitle()` resets state and delegates to `waitForTitle()` or `trackTitle()`
- `waitForTitle(staleText)` attaches a `MutationObserver` to `document.body` until the target element (`span[data-test-id="conversation-title"]`) appears with non-stale text
- `trackTitle(el)` attaches a `MutationObserver` directly to that element to follow live renames
- A third observer (`titleTagObs`) on `<title>` re-asserts the custom title whenever Gemini tries to overwrite it

**Tests** (`content.test.js`) use Jest + jsdom. `content.js` exports `{ init }` via `module.exports` only when `module` is defined, so the same file runs in both browser and Node environments without modification.
