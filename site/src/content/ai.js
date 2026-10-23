/* AI-agent pages: hub advantages, per-tool setup, prompts, recipes. */
const C = require('../config');

const ADVANTAGES = [
  ['One mental model, not four', 'An agent asked to add "live search with a fade-in" to a jQuery + htmx + Alpine + GSAP page must juggle four APIs, load orders and overlapping ideas of state. With jsKjs there is one <code>$</code>, one attribute prefix and one rules file.'],
  ['A closed, written-down API', 'The rules file lists every available method <em>and</em> every common method that is not available. Agents hallucinate less when the boundary is explicit — and when they want something missing, the rules tell them to say so instead of faking it.'],
  ['Changes you can review at a glance', '<code>&lt;form kj-post="/subscribe.php" kj-target="#msg"&gt;</code> says what it does. Declarative diffs are short, local to the HTML they affect, and easy to approve — the opposite of a 40-line handler buried in a script file.'],
  ['Training data that already transfers', 'Models have read an enormous amount of jQuery. jsKjs keeps those names and signatures, so the agent\'s instincts are mostly right from the first prompt; the rules file covers the differences.'],
  ['No build step to break', 'Agents fail most often in toolchains: bundler configs, version conflicts, missing dev servers. A jsKjs page is a file you open in a browser. The agent can verify its own work, and it deploys to any PHP shared host — like the one this site runs on.'],
  ['Small enough to read in full', 'The whole readable library is about 40 KB of source — a few thousand tokens. When an agent is unsure how something behaves, it can read the actual implementation instead of guessing.'],
  ['Server-rendered HTML plays to agent strengths', 'Hyper endpoints return HTML fragments. Agents write small PHP, Python or Node handlers well, and escaping output there is one obvious line.'],
  ['Fast pages by default', 'About 8.1 KB instead of ~90 KB for the four libraries it replaces, with zero dependencies. Performance is part of what you ship, even when an AI wrote it.'],
];

const TOOLS = [
  {
    slug: 'claude', name: 'Claude Code & Claude.ai', vendor: 'Anthropic',
    seo: 'Use jsKjs with Claude Code: CLAUDE.md and a Project Skill',
    desc: 'Set up Claude Code and Claude.ai to write jsKjs: a CLAUDE.md that imports the shared rules, and a jskjs skill for .claude/skills/ or upload to Claude.ai.',
    files: ['CLAUDE.md', 'AGENTS.md', '.claude/skills/jskjs/SKILL.md'],
    steps: [
      'Copy <code>AGENTS.md</code> and <code>CLAUDE.md</code> to your project root. <code>CLAUDE.md</code> imports the shared rules with <code>@AGENTS.md</code>, so there is only one file to keep current.',
      'Copy the skill to <code>.claude/skills/jskjs/SKILL.md</code> (project-wide, commit it so your team gets it) — or to <code>~/.claude/skills/jskjs/SKILL.md</code> to use it in every project on your machine.',
      'For Claude.ai and cloud sessions, upload the skill to your account from the skills settings (or <em>Customize</em> in the desktop app). Use the <a href="/ai/kit/jskjs-skill.zip">ready-made skill zip</a>; its frontmatter only uses <code>name</code> and <code>description</code>, which uploads accept.',
      'Start a session and ask: <em>"Using jsKjs, add a live search box to index.html that queries search.php."</em> Claude should load the skill and reach for <code>kj-get</code> with <code>kj-trigger="keyup delay:300ms"</code>.',
    ],
    docs: [['Claude Code — Skills', 'https://code.claude.com/docs/en/skills'], ['Claude Code — Memory and CLAUDE.md', 'https://code.claude.com/docs/en/memory']],
  },
  {
    slug: 'codex', name: 'OpenAI Codex', vendor: 'OpenAI',
    seo: 'Use jsKjs with OpenAI Codex: AGENTS.md Project Instructions',
    desc: 'Teach OpenAI Codex to build with jsKjs using a single AGENTS.md at your repository root. Merge order, size limits and a starter prompt.',
    files: ['AGENTS.md'],
    steps: [
      'Copy <code>AGENTS.md</code> to the root of your repository. Codex reads it from the project root down to your working directory, joining files root-first so deeper ones take precedence.',
      'Keep it lean: Codex stops adding instruction files once their combined size reaches <code>project_doc_max_bytes</code> (32 KiB by default). The jsKjs rules are well under that.',
      'Need jsKjs rules only in your front-end folder? Put an <code>AGENTS.md</code> there instead; Codex picks it up when working in that directory.',
      'Ask: <em>"Build a contact form with jsKjs that posts to contact.php without a page reload and shows the server\'s message."</em>',
    ],
    docs: [['Codex — Custom instructions with AGENTS.md', 'https://developers.openai.com/codex/guides/agents-md']],
  },
  {
    slug: 'copilot', name: 'GitHub Copilot', vendor: 'GitHub',
    seo: 'Use jsKjs with GitHub Copilot: copilot-instructions.md and .instructions.md',
    desc: 'Configure GitHub Copilot for jsKjs with .github/copilot-instructions.md for the whole repo and a file-scoped .github/instructions/jskjs.instructions.md using applyTo.',
    files: ['.github/copilot-instructions.md', '.github/instructions/jskjs.instructions.md', 'AGENTS.md'],
    steps: [
      'Copy <code>.github/copilot-instructions.md</code> into your repository for repository-wide instructions.',
      'Prefer instructions only for front-end files? Use <code>.github/instructions/jskjs.instructions.md</code> instead. Its <code>applyTo: "**/*.{html,htm,js,php}"</code> frontmatter attaches it to matching files, and <code>description</code> lets the agent load it on demand.',
      'VS Code\'s Copilot also understands <code>AGENTS.md</code> at the repository root, so the shared file works here too.',
      'In Copilot Chat (agent mode), ask: <em>"Add an infinite-scroll feed to posts.html with jsKjs, loading /api/posts.php?page=N."</em>',
    ],
    docs: [['VS Code — Use custom instructions', 'https://code.visualstudio.com/docs/agent-customization/custom-instructions']],
  },
  {
    slug: 'cursor', name: 'Cursor', vendor: 'Anysphere',
    seo: 'Use jsKjs with Cursor: a .cursor/rules/jskjs.mdc Project Rule',
    desc: 'Add a Cursor project rule for jsKjs in .cursor/rules/jskjs.mdc with description and globs frontmatter — or rely on AGENTS.md, which Cursor also reads.',
    files: ['.cursor/rules/jskjs.mdc', 'AGENTS.md'],
    steps: [
      'Copy <code>jskjs.mdc</code> to <code>.cursor/rules/</code>. Cursor rules must use the <code>.mdc</code> extension with frontmatter — plain <code>.md</code> files in that folder are ignored.',
      'The rule uses <code>globs</code> to attach itself to HTML, JS and PHP files and a <code>description</code> so the agent can pull it in when relevant. Set <code>alwaysApply: true</code> if you want it in every chat.',
      'Alternatively, keep just <code>AGENTS.md</code> at the root: Cursor reads it in the project root and subdirectories.',
      'Ask the agent: <em>"Turn the pricing toggle in pricing.html into a jsKjs kj-data component with monthly/yearly prices."</em>',
    ],
    docs: [['Cursor — Rules', 'https://cursor.com/docs/context/rules']],
  },
  {
    slug: 'vscode-openrouter', name: 'VS Code agents with OpenRouter', vendor: 'Cline · Roo Code · Continue',
    seo: 'jsKjs with Cline, Roo Code and Continue (OpenRouter models) in VS Code',
    desc: 'OpenRouter routes your requests to hundreds of models — the rules live in your VS Code agent. Set up jsKjs rules for Cline (.clinerules), Roo Code (.roo/rules) and Continue (.continue/rules).',
    intro: String.raw`<p><strong>A quick correction worth making:</strong> OpenRouter is not a coding agent and has no rules file of its own. It is an API that routes your requests to many models (Claude, GPT, Gemini, Llama, Qwen…). You use it <em>through</em> a VS Code agent extension, and that extension is what reads project rules. The three most common ones are below — pick the file for yours. All three also read <code>AGENTS.md</code> or accept it alongside their own folder.</p>`,
    files: ['.clinerules/jskjs.md', '.roo/rules/jskjs.md', '.continue/rules/jskjs.md', 'AGENTS.md'],
    steps: [
      '<strong>Cline:</strong> copy <code>jskjs.md</code> to <code>.clinerules/</code> (Cline also searches <code>.cline/rules/</code>). Cline reads <code>AGENTS.md</code>, <code>.cursorrules</code> and <code>.windsurfrules</code> too, and lists everything it found in its Rules panel.',
      '<strong>Roo Code:</strong> copy <code>jskjs.md</code> to <code>.roo/rules/</code>. Roo also loads <code>AGENTS.md</code> from the workspace root by default.',
      '<strong>Continue:</strong> copy <code>jskjs.md</code> to <code>.continue/rules/</code>. Its frontmatter <code>globs</code> include the rule whenever HTML, JS or PHP files are in context.',
      'In the extension\'s settings, choose OpenRouter as the provider and pick a model. Smaller or cheaper models benefit most from explicit rules — the "Not available" list in particular.',
      'Ask: <em>"Using jsKjs, add a delete button to each row in orders.php that calls DELETE /api/orders.php?id= and removes the row."</em>',
    ],
    docs: [['Cline — Rules', 'https://docs.cline.bot/features/cline-rules'], ['Roo Code — Custom instructions', 'https://roocodeinc.github.io/Roo-Code/features/custom-instructions/'], ['Continue — Rules', 'https://docs.continue.dev/customize/deep-dives/rules']],
  },
  {
    slug: 'windsurf', name: 'Windsurf / Devin Desktop', vendor: 'Cognition',
    seo: 'Use jsKjs with Windsurf (Devin Desktop): .windsurf/rules Workspace Rule',
    desc: 'Add a jsKjs workspace rule for Windsurf — now Devin Desktop — in .windsurf/rules/ with a glob trigger, or rely on AGENTS.md, which it processes as a rule.',
    files: ['.windsurf/rules/jskjs.md', 'AGENTS.md'],
    steps: [
      'Copy <code>jskjs.md</code> to <code>.windsurf/rules/</code>. Windsurf has been renamed Devin Desktop, whose preferred folder is <code>.devin/rules/</code>; <code>.windsurf/rules/</code> is still read as a fallback, so this one file works for both.',
      'The rule\'s frontmatter uses <code>trigger: glob</code> with <code>globs</code> for HTML, JS and PHP. Change it to <code>trigger: always_on</code> if you want it in every conversation.',
      'A root <code>AGENTS.md</code> is also processed by the same rules engine and is always on.',
      'Ask Cascade: <em>"Add a jsKjs polling widget to dashboard.html that refreshes /api/stats.php every 10 seconds."</em>',
    ],
    docs: [['Devin Desktop (Windsurf) — Memories & rules', 'https://docs.devin.ai/desktop/cascade/memories']],
  },
  {
    slug: 'gemini', name: 'Gemini CLI', vendor: 'Google',
    seo: 'Use jsKjs with Gemini CLI: GEMINI.md Context or AGENTS.md',
    desc: 'Give Gemini CLI the jsKjs rules with a GEMINI.md in your project, or point context.fileName at AGENTS.md so every agent shares one file.',
    files: ['GEMINI.md', 'AGENTS.md'],
    steps: [
      'Copy <code>GEMINI.md</code> to your project. Gemini CLI looks for <code>GEMINI.md</code> in your workspace directories and their parents, and concatenates what it finds.',
      'Prefer one shared file? Add <code>{"context": {"fileName": ["AGENTS.md", "GEMINI.md"]}}</code> to <code>.gemini/settings.json</code> so Gemini also reads <code>AGENTS.md</code>.',
      'Ask: <em>"Using jsKjs, animate the feature cards on index.html in with a stagger, respecting prefers-reduced-motion."</em>',
    ],
    docs: [['Gemini CLI — GEMINI.md', 'https://www.geminicli.com/docs/cli/gemini-md']],
  },
];

const PROMPTS = [
  { group: 'Start a project', items: [
    ['Kick-off', `Build this page with jsKjs (${C.SITE}). Load only https://jskjs.org/cdn/${C.VERSION}/jskjs.min.js — no jQuery, htmx, Alpine.js or GSAP. Prefer kj-* attributes for server requests and kj-data for UI state; use $() only when attributes can't express it. Read ${C.SITE}/llms-full.txt first if you can.`],
    ['Backend pairing', 'Use plain PHP endpoints that return HTML fragments for every kj-* request. Escape all output with htmlspecialchars. No database unless I ask; keep each endpoint under 40 lines.'],
  ]},
  { group: 'Add features', items: [
    ['Live search', 'Add a search input that queries search.php?q= as the user types (kj-trigger="keyup delay:300ms") and renders results into a list with aria-live="polite".'],
    ['Form without reload', 'Make the contact form post with kj-post to contact.php, show the server\'s message under the form, and disable the button while the request runs (kj-indicator + aria-busy).'],
    ['Reactive widget', 'Turn the pricing section into a kj-data component with a monthly/yearly toggle; bind prices with kj-text and the active toggle with :aria-pressed.'],
    ['Motion polish', 'Add entrance animation to the cards with $.from and stagger (seconds, ease power2.out). Skip it when prefers-reduced-motion is set.'],
  ]},
  { group: 'Migrate & review', items: [
    ['Migrate from jQuery', 'Replace jQuery with jsKjs in this project. Keep behaviour identical. Flag every use of APIs jsKjs does not include (.stop, .delay, $.Deferred, .nextAll, $.ajaxSetup, JSONP) and propose replacements. Note: .val() on checkboxes returns a boolean in jsKjs.'],
    ['Collapse four libraries', 'This page loads jQuery, htmx, Alpine.js and GSAP. Rewrite it to use only jsKjs. List anything that has no jsKjs equivalent instead of approximating it silently.'],
    ['Review against the rules', 'Review this file against the jsKjs rules in AGENTS.md: unescaped user data, invented APIs, missing labels or aria-live, seconds vs milliseconds mix-ups, and JavaScript that could be a kj-* attribute.'],
  ]},
];

module.exports = { ADVANTAGES, TOOLS, PROMPTS };
