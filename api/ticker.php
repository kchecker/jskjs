<?php
// GET /api/ticker.php → deterministic fake "KJS" price that drifts every second (stateless)
require __DIR__ . '/_lib.php'; html_out();
$t = time();
$price = 77.0 + 6 * sin($t / 17) + 2.5 * sin($t / 5.3) + 0.8 * sin($t * 1.7);
$prev = 77.0 + 6 * sin(($t - 2) / 17) + 2.5 * sin(($t - 2) / 5.3) + 0.8 * sin(($t - 2) * 1.7);
$up = $price >= $prev;
echo '<span style="font:800 28px/1 var(--mono)">$' . number_format($price, 2) . '</span> '
   . '<span class="' . ($up ? 'yes' : 'no') . '">' . ($up ? '▲' : '▼') . ' ' . number_format(abs($price - $prev), 2) . '</span>';
