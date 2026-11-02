# Changelog

## 1.0.0 — October 2026

First public release.

- **Core**: a modernised port of jQuery 3.7.1. It passes 1,119 of 1,131 tests (98.9%) in jQuery's own QUnit suite.
  - Selectors with jQuery extensions on top of `querySelectorAll`.
  - The full event system, `$.ajax` with jqXHR/prefilters/transports/JSONP, `$.Deferred`/`$.Callbacks`/`$.when`, and queues and effects.
- **Hyper** (htmx 2 parity, `hx-*` accepted):
  - Every swap style and modifier, extended targets, and trigger modifiers and filters.
  - `kj-select`, out-of-band swaps, `kj-boost`, history and `kj-sync`.
  - Headers and the htmx event set.
- **Pulse** (Alpine 3 parity, `x-*` accepted):
  - `kj-for`/`kj-if`/`kj-transition`/`kj-teleport`/`kj-effect`/`kj-ref` and the model and event modifiers.
  - All magics, `$.directive`, `$.magic`.
- **Motion** (GSAP 3 style):
  - Controllable, awaitable tweens and timelines, labels and positions.
  - The full ease set, stagger grids, keyframes, colour/SVG tweens, `quickTo` and `$.utils`.
- **Add-ons**: `jskjs.scroll.js`, `jskjs.flip.js`, `jskjs.drag.js`, `jskjs.split.js`, `jskjs.ui.js`, `jskjs.live.js`.
- **CSP**: built-in styles use constructable stylesheets, so a strict `style-src` policy works.
- **Hardening before launch**:
  - Deep `$.extend` is prototype-pollution-safe.
  - Element data lives in WeakMaps.
  - Tweens and listeners are cleaned up when content is removed.
