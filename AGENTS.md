# AGENTS.md — working on the jsKjs repository

This file is for agents editing **this repository**. (Rules for projects that *use* jsKjs live in `ai-kit/`.)

- Library source: `src/parts/*.js` (concatenated by `scripts/build-lib.js` into `src/jskjs.js` — never edit that file directly) and add-ons in `src/plugins/`. Keep it dependency-free, ES2020, evergreen browsers only.
- After changing the library: `npm test`, `node test/jquery-suite/run.js` (jQuery compatibility must not drop), `node test/browser/plugins.test.js`, then `npm run build:site` and `npm run test:e2e` (needs `npm run serve` running).
- Website content lives in `site/src/content/*.js`; layout in `site/src/lib/layout.js`; styles in `site/static/assets/site.css`.
- Demo code inside content files must not contain backticks or `${` (it is embedded in template literals).
- Every page needs a working demo; PHP endpoints in `site/static/api/` must escape output and store nothing.
- AI rules files are generated from `site/src/content/ai-rules.js` — edit there, never in `ai-kit/` directly.
