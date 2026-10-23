<?php
// GET /api/flaky.php → fails ~60% of the time (503), at random, on the server
require __DIR__ . '/_lib.php'; html_out();
if (random_int(1, 100) <= 60) { http_response_code(503); echo 'Service temporarily unavailable (random)'; exit; }
echo '✓ Data from a flaky server at ' . gmdate('H:i:s') . ' UTC';
