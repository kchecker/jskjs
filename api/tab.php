<?php
// GET /api/tab.php?tab=… → tab panel content
require __DIR__ . '/_lib.php'; html_out();
$tabs = [
  'core'   => ['Core', 'Selectors, traversal, events, AJAX — the jQuery API on native browser features.'],
  'hyper'  => ['Hyper', 'Requests described in HTML attributes: kj-get, kj-target, kj-swap, kj-trigger.'],
  'pulse'  => ['Pulse', 'Reactive state on the element: kj-data, kj-text, kj-model, @click.'],
  'motion' => ['Motion', 'Tweens, easings, stagger and timelines on requestAnimationFrame.'],
];
$k = $_GET['tab'] ?? 'core';
if (!isset($tabs[$k])) { http_response_code(404); echo 'Unknown tab'; exit; }
echo '<h4 style="margin:0 0 6px">' . h($tabs[$k][0]) . '</h4><p style="margin:0">' . h($tabs[$k][1]) . '</p><p class="muted" style="margin:6px 0 0;font-size:13px">Fetched from /api/tab.php?tab=' . h($k) . ' at ' . gmdate('H:i:s') . ' UTC</p>';
