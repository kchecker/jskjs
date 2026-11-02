<?php
// POST /api/oob.php?item=… → a line for the cart list, plus out-of-band updates for the cart badge and the status bar.
require __DIR__ . '/_lib.php'; html_out();
$items = ['mug' => ['Mug', 12], 'tee' => ['T-shirt', 24], 'cap' => ['Cap', 18]];
$k = input('item', 10);
if (!isset($items[$k])) $k = 'mug';
$n = max(0, min(99, (int)input('n', 3))) + 1;
[$name, $price] = $items[$k];
echo '<li>' . h($name) . ' — $' . $price . '</li>';
echo '<span id="oob-count" kj-swap-oob="true" class="badge">' . $n . '</span>';
echo '<p id="oob-status" kj-swap-oob="true">Added ' . h($name) . ' at ' . gmdate('H:i:s') . ' UTC — the badge and this line came back out-of-band in the same response.</p>';
