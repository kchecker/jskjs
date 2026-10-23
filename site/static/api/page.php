<?php
// GET /api/page.php?p=N → a page of posts + a sentinel that loads page N+1 when revealed
require __DIR__ . '/_lib.php'; html_out();
$p = max(1, min(6, (int)($_GET['p'] ?? 1)));
$topics = ['selectors', 'delegation', 'timelines', 'stores', 'swaps', 'easings', 'triggers', 'components', 'stagger'];
for ($i = 1; $i <= 4; $i++) {
  $n = ($p - 1) * 4 + $i;
  echo '<li><b>Post ' . $n . '</b> <span class="muted">— notes on ' . $topics[$n % count($topics)] . ', served by page.php?p=' . $p . '</span></li>';
}
if ($p < 6) echo '<li class="muted" kj-get="/api/page.php?p=' . ($p + 1) . '" kj-trigger="revealed" kj-swap="outerHTML">Loading page ' . ($p + 1) . '…</li>';
else echo '<li class="muted">— end of feed (6 pages) —</li>';
