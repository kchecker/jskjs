<?php
// GET /api/time.php → live server clock
require __DIR__ . '/_lib.php'; html_out();
$t = new DateTime('now', new DateTimeZone('UTC'));
echo '<b>' . $t->format('H:i:s') . '</b> <span class="muted">UTC · rendered by PHP</span>';
