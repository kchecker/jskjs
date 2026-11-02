# jsKjs

**Four libraries. One `$`.** jsKjs is the jQuery API you already know — plus htmx-style requests, Alpine-style reactivity and GSAP-style animation — in one **53.8 KB** (gzipped) script, against 90.2 KB for the four official builds. No build step, no dependencies, made for humans and their AI agents.

Website, docs and 49 live demos: **https://jskjs.org**

```html
<script src="https://jskjs.org/cdn/1.0.0/jskjs.min.js"
        integrity="sha384-RAPdwGto8HbdNSv2+1QToJzAy19GmU5390hxU7QTE6/o62UBBrC81ZqKcf3IOMWW"
        crossorigin="anonymous"></script>
```

## Four modules

| Module | Inspired by | Example |
|---|---|---|
| **Core** | jQuery | `$('#list').on('click', 'li', function () { $(this).toggleClass('done'); });` |
| **Hyper** | htmx | `<input name="q" kj-get="/search.php" kj-trigger="keyup delay:300ms" kj-target="#results">` |
| **Pulse** | Alpine.js | `<div kj-data="{ n: 0 }"><button @click="n++">+1</button><span kj-text="n"></span></div>` |
| **Motion** | GSAP | `$.from('.card', { y: 24, opacity: 0, duration: .5, stagger: .08 });` |

How complete is it?

- **jQuery:** a modernised port of jQuery 3.7.1. It passes **1,119 of 1,131 tests (98.9%)** and 99.8% of the assertions in jQuery's own QUnit suite. The failures test jQuery internals, such as `jQuery.expando` storage and Sizzle's compiler. To reproduce, run `node test/jquery-suite/run.js`.
- **htmx / Alpine / GSAP:** feature parity for everything still useful, accepting `hx-*` and `x-*` spellings too.
- The heavy pieces are optional add-ons in `dist/plugins/`: scroll-linked animation, Flip, Draggable, SplitText, the Alpine UI plugins, and SSE/WebSockets.

Line-by-line comparison: https://jskjs.org/compare/

Evergreen browsers only: Chrome/Edge/Firefox 90+, Safari 15+.

## Build with AI agents

`ai-kit/` holds ready-made rules for Claude Code (CLAUDE.md + skill), OpenAI Codex (AGENTS.md), GitHub Copilot, Cursor, Cline, Roo Code, Continue, Windsurf/Devin Desktop and Gemini CLI — all generated from one source. Copy the file for your tool into your project. Guide: https://jskjs.org/ai/

## Repository layout

```
src/parts/*.js      the library source, concatenated by scripts/build-lib.js into src/jskjs.js
src/plugins/        optional add-ons (scroll, flip, drag, split, ui, live)
dist/               jskjs.js, jskjs.min.js and dist/plugins/
test/               unit + parity tests (jsdom), add-on and site tests (Playwright), jQuery's QUnit suite runner
ai-kit/             rules files for AI coding agents
site/src/           website generator, content and config
site/static/        CSS, fonts, PHP demo endpoints (site/static/api)
.github/workflows/  CI + Hostinger deploy branch
DEPLOY.md           how to publish jskjs.org
```

## Develop

```bash
npm install
npm test                 # unit + parity tests
node test/jquery-suite/run.js   # jQuery 3.7.1's own test suite (see test/jquery-suite/README.md)
node test/browser/plugins.test.js   # add-ons in Chromium
npm run build:site       # builds site/public (needs: pip install fonttools brotli pillow)
npm run serve            # PHP dev server on http://127.0.0.1:8099
npm run test:e2e         # crawls every page in Chromium + clicks through the demos
```

## License

MIT © 2026 Karan Checker. Authored by Karan Checker and Claude Fable5/Opus 4.8. The core is derived from jQuery 3.7.1 (MIT, © OpenJS Foundation and other contributors).
