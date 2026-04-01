# Gemini Tab Renamer

A minimal Chrome extension that renames Gemini chat tabs to the conversation title, instead of the generic "Gemini" default.

Tab titles follow the format: `{Conversation Title} - Google Gemini`

## Installation

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** and select the project folder

## How it works

The extension injects a content script into `https://gemini.google.com/app/*` that:

1. Watches for the conversation title element (`[data-test-id="conversation-title"]`) to appear in the DOM
2. Sets `document.title` as soon as it's found
3. Continues watching that element for changes (e.g. when Gemini auto-renames a new chat)
4. Re-runs when switching back to the tab via the `visibilitychange` event

## Files

```
├── manifest.json   # Chrome extension manifest (MV3)
└── content.js      # Content script with MutationObserver logic
```
