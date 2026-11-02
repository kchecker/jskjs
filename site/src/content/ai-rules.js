/* Single source of truth for every AI-agent rules file shipped in the jsKjs AI kit. */
const C = require('../config');
const CDN = `https://jskjs.org/cdn/${C.VERSION}/jskjs.min.js`;

const RULES = `This project uses **jsKjs** (${C.SITE}) — one script (~${C.KJ_GZ_KB} KB gzipped, zero dependencies) that provides a jQuery-compatible \`$\`, htmx-style declarative requests (\`kj-*\` attributes), Alpine-style reactivity (\`kj-data\`) and GSAP-style animation (\`$.to\`). There is no build step.

## Golden rules

1. Load exactly one script: \`<script src="${CDN}"></script>\` (or the project's local copy). **Never** add jQuery, htmx, Alpine.js or GSAP next to it.
2. Prefer HTML attributes over JavaScript:
   - Talking to the server → \`kj-get\` / \`kj-post\` / \`kj-put\` / \`kj-patch\` / \`kj-delete\` + \`kj-target\` + \`kj-swap\`. The server returns HTML fragments.
   - Local UI state → \`kj-data\` + \`kj-text\` / \`kj-show\` / \`kj-model\` / \`@click\` / \`:attr\`.
   - Write \`$()\` JavaScript only for what attributes cannot express.
3. Units: \`$.to\`, \`$.from\`, \`$.fromTo\`, \`$.timeline\` use **seconds**. \`.fadeIn\`, \`.fadeOut\`, \`.slideUp\`, \`.slideDown\`, \`.animate\` use **milliseconds**.
4. The core is jQuery 3.7 compatible: \`$.ajax\`/\`$.get\`/\`$.post\`/\`$.getJSON\` return a jqXHR (thenable — \`await\` works; \`.done/.fail/.always\`; errors reject with the jqXHR, so read \`xhr.status\`, \`xhr.responseText\`, \`xhr.responseJSON\`). Write jQuery code exactly as you would for jQuery 3.7.
5. Use only the APIs listed below. Scroll, flip, drag, split, UI directives and SSE/WebSockets are optional add-ons: check the page loads the add-on script before using them.
6. Security: put user text in the page with \`.text()\` or \`kj-text\`. When building HTML strings, wrap every user value in \`$.escape()\`. Server endpoints that answer \`kj-*\` requests must escape their output (e.g. PHP \`htmlspecialchars\`).
7. Accessibility: real \`<button>\` and \`<label>\` elements; keep ARIA in sync with \`:aria-*\` bindings; \`aria-live="polite"\` on regions that update; honour \`prefers-reduced-motion\` for decorative animation.
8. Register \`$.component()\` and \`$.store()\` in a script placed right after the jsKjs script tag (before the DOM is ready).
9. Pulse expressions use \`new Function\`: a strict Content-Security-Policy needs \`'unsafe-eval'\` on pages that use \`kj-data\`.

## Decision guide

| Need | Use |
|---|---|
| Load / refresh part of the page from the server | \`kj-get\` + \`kj-target\` (+ \`kj-trigger="load"\`, \`"revealed"\`, \`"every 5s"\`) |
| Submit a form without reloading | \`<form kj-post="/save" kj-target="#msg">\` |
| Search-as-you-type, inline validation | \`kj-trigger="keyup delay:300ms"\` |
| Delete a row | \`kj-delete="/rows/7" kj-target="#row-7" kj-swap="outerHTML"\` (server returns empty body) |
| Infinite scroll | last item: \`kj-get="/page?p=N" kj-trigger="revealed" kj-swap="outerHTML"\` |
| Toggles, tabs, wizards, counters, form-driven UI | \`kj-data\` with \`@click\`, \`kj-show\`, \`kj-model\`, \`kj-text\` |
| Reusable widget | \`$.component('name', (args) => ({ … }))\` + \`kj-data="name(args)"\` |
| State shared by several components | \`$.store('name', { … })\`, read as \`$.store('name')\` |
| Entrance / hover / feedback animation | \`$.from()\` / \`$.to()\` with \`stagger\` and an ease such as \`'power2.out'\` |
| Sequenced animation | \`$.timeline({ paused: true })…\` then \`await tl.play()\`; \`'<'\` = with previous, \`'+=0.3'\` = gap |
| Events, classes, traversal, DOM edits | the jQuery API — it behaves as expected |

## API (complete list)

**Core (jQuery 3.7.1 API — passes {{JQ_PASS}} of jQuery's own unit tests):** everything in jQuery 3.7 works the same: selectors including jQuery extensions (\`:visible\`, \`:eq()\`, \`:first\`, \`:contains()\`, \`:has()\`, custom \`$.expr.pseudos\`), traversal (\`.nextAll .prevUntil .parentsUntil .contents .has .end .addBack\`…), manipulation (\`.wrapAll .wrapInner .unwrap\`…), \`.attr/.prop/.val/.data\`, \`.css\` with cssHooks, dimensions (\`.innerWidth .outerWidth(true)\`), offset getter/setter, events (\`jQuery.Event\`, namespaces, delegation, \`.trigger(type, [args])\` → handler \`(e, ...args)\`, special events), \`$.ajax\` (jqXHR, \`$.ajaxSetup\`, prefilters, transports, JSONP, global events), \`$.Deferred\`, \`$.Callbacks\`, \`$.when\`, queues and effects (\`.animate .stop .finish .delay .queue .fadeTo\`), \`$.fn.extend\` plugins, \`$.noConflict\`. Collections also extend \`Array\` (\`forEach\`, \`includes\`, \`for…of\`).
**jsKjs extras on the core:** \`$.ajax({ json: true })\` sends the data as JSON; \`$(form).serializeObject()\`; \`$.debounce(fn, ms)\`, \`$.throttle(fn, ms)\`, \`$.sleep(ms)\`, \`$.uuid()\`, \`$.escape()\`; a native \`CustomEvent\`'s \`detail\` is passed as an extra handler argument. Aliases: \`window.kj\`, \`window.jsKjs\`. \`$.version\` is the jsKjs version; \`$.fn.jquery\` reports '3.7.1'.
**Hyper (htmx 2 parity; \`hx-*\` spellings also accepted):** \`kj-get|post|put|patch|delete\`, \`kj-target\` (CSS or extended: \`this\`, \`closest tr\`, \`find .x\`, \`next\`, \`previous\`), \`kj-swap\` (\`innerHTML outerHTML textContent beforebegin afterbegin beforeend afterend delete none\` + modifiers \`swap:1s settle:… scroll:top show:… focus-scroll transition:true\`), \`kj-trigger\` (events, \`load\`, \`revealed\`, \`intersect\`, \`every Ns\`; modifiers \`changed once delay: throttle: from: target: consume queue:\`, filters \`click[ctrlKey]\`, \`sse:name\`), \`kj-select\`, \`kj-select-oob\`, \`kj-swap-oob\`, \`kj-boost\`, \`kj-push-url\`, \`kj-replace-url\`, \`kj-confirm\`, \`kj-prompt\`, \`kj-indicator\`, \`kj-disabled-elt\`, \`kj-include\`, \`kj-vals\` (JSON or \`js:{…}\`), \`kj-headers\`, \`kj-params\`, \`kj-encoding\`, \`kj-sync\`, \`kj-validate\`, \`kj-preserve\`, \`kj-on:event\`, \`kj-history\`. HX-* request and response headers (\`HX-Redirect\`, \`HX-Trigger\`, \`HX-Retarget\`, \`HX-Reswap\`…). Events: \`kj:beforeRequest\`, \`kj:afterRequest\`, \`kj:beforeSwap\`, \`kj:afterSwap\`, \`kj:afterSettle\`, \`kj:load\`, \`kj:responseError\` and the rest of the htmx event set. JS: \`$.hyper.ajax()\`, \`$.hyper.swap()\`, \`$.hyper.oob()\`, \`$.hyper.config\`, \`$.process(el)\`.
**Pulse (Alpine 3 parity; \`x-*\` spellings also accepted):** \`kj-data\`, \`kj-init\`, \`kj-show\`, \`kj-if\`, \`kj-for\` (keyed with \`:key\`), \`kj-text\`, \`kj-html\`, \`kj-model\` (+ \`.lazy .number .trim .debounce .fill .boolean\`), \`@event\` / \`kj-on:event\` (all Alpine modifiers: \`.prevent .stop .outside .window .document .once .debounce .throttle .self .passive .capture\`, key modifiers), \`:attr\` / \`kj-bind\` (object syntax for \`:class\`/\`:style\`), \`kj-effect\`, \`kj-ref\`, \`kj-cloak\`, \`kj-ignore\`, \`kj-transition\` (modifiers or phase classes), \`kj-teleport\`, \`kj-id\`. Magics: \`$el $refs $store $watch $dispatch $nextTick $root $data $id\`. JS: \`$.component(name, factory)\`, \`$.store(name, value?)\`, \`$.reactive()\`, \`$.effect()\`, \`$.directive()\`, \`$.magic()\`, \`$.nextTick()\`.
**Motion (GSAP 3 style; seconds):** \`$.to/$.from/$.fromTo/$.set(target, vars)\`, \`$(sel).to(vars)\`. Vars: transforms (\`x y xPercent yPercent rotate scale skewX\`…), any numeric CSS, colours, CSS variables, SVG attributes (\`attr: {}\`), \`duration delay ease stagger\` (number or \`{ each, from, grid, amount }\`), \`repeat repeatDelay yoyo keyframes paused immediateRender\`, callbacks \`onStart onUpdate onComplete onRepeat onReverseComplete\`. Tweens and timelines are controllable and awaitable: \`play pause resume reverse restart seek progress time duration timeScale repeat yoyo kill\`. \`$.timeline({ defaults, repeat, yoyo, paused })\` with \`.to .from .fromTo .set .add .call .addLabel\` and positions (\`'<'\`, \`'>'\`, \`'+=0.3'\`, \`'-=0.2'\`, \`'label+=1'\`, absolute seconds). Eases: \`none power1–4 sine expo circ back elastic bounce steps(n)\` with \`.in .out .inOut\`, plus \`$.parseEase()\`. Utilities: \`$.killTweensOf\`, \`$.getProperty\`, \`$.quickTo\`, \`$.quickSetter\`, \`$.utils\` (\`clamp mapRange interpolate snap wrap random toArray\`).
**Effects (jQuery; milliseconds):** \`.show/.hide/.toggle(ms)\`, \`.fadeIn .fadeOut .fadeToggle .fadeTo .slideDown .slideUp .slideToggle .animate(props, ms, easing, cb)\`, \`.stop .finish .delay .queue\`. GSAP ease names also work as jQuery easings.
**Add-ons (load after jskjs.js from \`/cdn/${C.VERSION}/plugins/\`):** \`jskjs.scroll.js\` (\`scrollTrigger\` option, \`$.scrollTrigger()\`, \`$.scrollTo()\`), \`jskjs.flip.js\` (\`$.Flip.getState/from\`, \`.flip(change)\`), \`jskjs.drag.js\` (\`$.Draggable.create\`, \`.draggable()\`), \`jskjs.split.js\` (\`$.splitText()\`), \`jskjs.ui.js\` (\`$persist kj-collapse kj-trap kj-mask $money kj-intersect kj-resize\`), \`jskjs.live.js\` (\`kj-sse-connect kj-sse-swap kj-ws-connect kj-ws-send\`).

## Not available — do not use

- jQuery internals: \`jQuery.expando\` / \`$.cache\` (data lives in a WeakMap — use \`$.data()\`), Sizzle's \`$.find.compile\` / \`$.find.tokenize\`. Anything removed before jQuery 3.7 (\`.live\`, \`.die\`, \`.size\`, \`$.browser\`).
- htmx: third-party extensions other than SSE/WebSockets (use \`$.hyper\` events instead).
- Alpine: third-party plugins outside the official set (Persist, Focus, Collapse, Mask, Intersect, Resize are in \`jskjs.ui.js\`).
- GSAP: MorphSVG, MotionPath, DrawSVG, Physics and other bonus plugins. If a project truly needs these, say so instead of faking them.

## Canonical snippets

\`\`\`html
<!-- Live search -->
<input name="q" kj-get="/search.php" kj-trigger="keyup delay:300ms" kj-target="#results">
<ul id="results" aria-live="polite"></ul>

<!-- Form without reload -->
<form kj-post="/subscribe.php" kj-target="#msg"><input name="email" type="email" required><button>Join</button></form>
<p id="msg" aria-live="polite"></p>

<!-- Reactive counter -->
<div kj-data="{ n: 0 }"><button @click="n++">+1</button> <span kj-text="n"></span></div>
\`\`\`

\`\`\`js
// Entrance animation (respects reduced motion)
if (!matchMedia('(prefers-reduced-motion: reduce)').matches)
  $.from('.card', { y: 24, opacity: 0, duration: .5, stagger: .08, ease: 'power2.out' });

// Fetch + render safely
const items = await $.getJSON('/api/items.json');
$('#list').html(items.map(i => '<li>' + $.escape(i.name) + '</li>').join(''));

// Delegation survives DOM swaps
$('#list').on('click', '.remove', function () { $(this).closest('li').remove(); });
\`\`\`

Full reference: ${C.SITE}/docs/ · Machine-readable: ${C.SITE}/llms-full.txt`;

const GLOBS = '**/*.{html,htm,js,php}';
const DESC = 'Frontend code in this project uses jsKjs (jQuery-compatible $ + kj-* declarative requests + kj-data reactivity + $.to animation). Follow these rules for any HTML/JS/PHP UI work.';

/* Each file: path inside a project, content, and which tools read it */
const FILES = [
  { path: 'AGENTS.md', tools: 'Codex · GitHub Copilot · Cursor · Cline · Roo Code · Windsurf/Devin · Gemini (via setting) · many others',
    content: `# AGENTS.md — jsKjs project rules\n\n${RULES}\n` },
  { path: 'CLAUDE.md', tools: 'Claude Code',
    content: `# CLAUDE.md\n\nFrontend work in this repository uses jsKjs. The full rules live in AGENTS.md:\n\n@AGENTS.md\n\nWhen writing UI code, also use the \`jskjs\` skill in .claude/skills/jskjs/.\n` },
  { path: '.claude/skills/jskjs/SKILL.md', tools: 'Claude Code (project skill) · Claude.ai (upload as a skill)',
    content: `---\nname: jskjs\ndescription: Write frontend code with jsKjs — a single-file jQuery-compatible library with htmx-style kj-* requests, Alpine-style kj-data reactivity and GSAP-style $.to animation. Use whenever the project loads jskjs.js or jskjs.min.js, whenever the user mentions jsKjs, or when asked for interactive pages, AJAX forms, live search, reactive widgets or animation in a no-build HTML/PHP project.\n---\n\n# jsKjs\n\n${RULES}\n` },
  { path: '.github/copilot-instructions.md', tools: 'GitHub Copilot (repository-wide instructions)',
    content: `# Copilot instructions — jsKjs\n\n${RULES}\n` },
  { path: '.github/instructions/jskjs.instructions.md', tools: 'GitHub Copilot in VS Code (file-scoped instructions)',
    content: `---\nname: jsKjs\ndescription: ${DESC}\napplyTo: "${GLOBS}"\n---\n\n# jsKjs\n\n${RULES}\n` },
  { path: '.cursor/rules/jskjs.mdc', tools: 'Cursor',
    content: `---\ndescription: ${DESC}\nglobs: ${GLOBS}\nalwaysApply: false\n---\n\n# jsKjs\n\n${RULES}\n` },
  { path: '.clinerules/jskjs.md', tools: 'Cline (any model, including via OpenRouter)',
    content: `# jsKjs\n\n${RULES}\n` },
  { path: '.roo/rules/jskjs.md', tools: 'Roo Code (any model, including via OpenRouter)',
    content: `# jsKjs\n\n${RULES}\n` },
  { path: '.continue/rules/jskjs.md', tools: 'Continue (any model, including via OpenRouter)',
    content: `---\nname: jsKjs\ndescription: ${DESC}\nglobs: "${GLOBS}"\n---\n\n# jsKjs\n\n${RULES}\n` },
  { path: '.windsurf/rules/jskjs.md', tools: 'Windsurf / Devin Desktop',
    content: `---\ntrigger: glob\nglobs: "${GLOBS}"\n---\n\n# jsKjs\n\n${RULES}\n` },
  { path: 'GEMINI.md', tools: 'Gemini CLI',
    content: `# GEMINI.md — jsKjs project rules\n\n${RULES}\n` },
];

function llmsTxt(pages) {
  const by = (prefix) => pages.filter(p => p.path.startsWith(prefix) && p.path !== prefix);
  const line = p => `- [${p.title}](${C.SITE}${p.path}): ${p.desc}`;
  return `# jsKjs

> jsKjs is a single-file, zero-dependency JavaScript library (~${C.KJ_GZ_KB} KB gzipped) with a jQuery-compatible $ API plus htmx-style declarative requests (kj-* attributes), Alpine-style reactivity (kj-data) and GSAP-style animation ($.to). MIT licensed. Source: ${C.GITHUB}

Use one script tag: <script src="${CDN}"></script>. Never combine it with jQuery, htmx, Alpine.js or GSAP. Prefer kj-* attributes over JavaScript. $.to uses seconds; fadeIn/slideDown use milliseconds.

## Essentials
- [Complete rules and API for AI agents](${C.SITE}/llms-full.txt): everything an agent needs in one file
- [Getting started](${C.SITE}/start/): install and first page
- [API reference](${C.SITE}/docs/): every function with examples
- [Migrate from jQuery](${C.SITE}/migrate/): differences and checklist

## Features
${by('/features/').map(line).join('\n')}

## AI agents
${by('/ai/').map(line).join('\n')}

## Comparisons
${by('/compare/').map(line).join('\n')}

## Optional
${by('/jquery/').map(line).join('\n')}
- [CDN](${C.SITE}/cdn/): pinned URLs and SRI hashes
- [Release notes](${C.SITE}/releases/)
`;
}

function llmsFull() {
  return `# jsKjs — complete reference for AI coding agents (v${C.VERSION})\n\n${RULES}\n`;
}

module.exports = { RULES, FILES, llmsTxt, llmsFull, CDN };
