<?php
// POST /api/like.php count=N → returns the button for N+1 (stateless round-trip)
require __DIR__ . '/_lib.php'; html_out();
$n = max(0, min(999999, (int)input('count', 8))) + 1;
echo '<button type="button" kj-post="/api/like.php" kj-vals=\'{"count": ' . $n . '}\' kj-swap="outerHTML" aria-label="Like (' . $n . ' likes)">♥ ' . $n . '</button>';
