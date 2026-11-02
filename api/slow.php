<?php
// GET /api/slow.php?ms=1500 → waits, then answers (max 4 s)
require __DIR__ . '/_lib.php'; html_out();
$ms = max(0, min(4000, (int)($_GET['ms'] ?? 3000)));
usleep($ms * 1000);
echo '<span class="yes">✓ Answered after ' . $ms . ' ms</span>';
