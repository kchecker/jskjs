# Changelog

## 1.0.0 — October 2026

First public release.

- **Core** (jQuery-compatible): native selectors, Array collections, DOM/attributes/data (WeakMap), CSS incl. custom properties, traversal, events with delegation and namespaces, fetch-based AJAX.
- **Hyper** (htmx-style): kj-get/post/put/patch/delete, kj-target, kj-swap (8 strategies), kj-trigger (events, delay, load, revealed, every), kj-confirm, kj-indicator, kj-include, kj-vals, kj-push-url, lifecycle events.
- **Pulse** (Alpine-style): kj-data, kj-text, kj-html, kj-show, kj-model, @event, :attr, $.component (with arguments), $.store, $.reactive.
- **Motion** (GSAP-style): $.to/$.from/$.fromTo, transforms, 10 easings, stagger, $.timeline, classic fade/slide/animate.
- Hardening before launch: prototype-pollution-safe deep $.extend; urlencoded Hyper bodies; polling stops on removal; kj-model radios; no unhandled-rejection noise; .not/.is with functions; correct timeline '<'; safe zero-duration tweens.
