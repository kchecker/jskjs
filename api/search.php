<?php
// GET /api/search.php?q=anim  → <li> matches from packages.json
require __DIR__ . '/_lib.php'; html_out();
$q = strtolower(input('q', 40) ?? '');
if ($q === '') exit;
$list = json_decode(file_get_contents(__DIR__ . '/packages.json'), true);
$hits = array_values(array_filter($list, fn($p) => str_contains($p, $q)));
if (!$hits) { echo '<li class="muted">No matches for “' . h($q) . '”. Try “a” or “js”.</li>'; exit; }
foreach ($hits as $p) {
  $i = strpos($p, $q);
  echo '<li>' . h(substr($p, 0, $i)) . '<mark>' . h(substr($p, $i, strlen($q))) . '</mark>' . h(substr($p, $i + strlen($q))) . '</li>';
}
