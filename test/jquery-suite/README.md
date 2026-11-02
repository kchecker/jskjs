# jQuery's own test suite, run against jsKjs

`run.js` serves jQuery 3.7.1's QUnit suite twice — with real jQuery and with `dist/jskjs.js` standing in as
`jQuery` — and counts how many of the tests that pass with jQuery also pass with jsKjs. The result is
written to `results.json` and published on https://jskjs.org/compare/jquery/.

```bash
git clone --depth 1 --branch 3.7.1 https://github.com/jquery/jquery.git test/jquery-suite/jquery
npm i --no-save jquery@3.7.1 raw-body
npm run build && node test/jquery-suite/run.js
```

The remaining differences are listed in `results.json` → `failing`. They fall into three groups:

- **Data storage** — jQuery stores data in an expando property on each node; jsKjs uses WeakMaps,
  so tests that inspect that property have nothing to look at.
- **Sizzle internals** — `jQuery.find.compile`, `jQuery.find.tokenize` and custom `attrHandle` getters belong to
  jQuery's old selector engine; jsKjs uses the browser's.
- **Sizzle-only edge cases** — namespaced selectors inside XML documents and a few exotic positional selectors.
- **Browser changes** — `:nth-child` on an element without a parent now matches in modern browsers.
