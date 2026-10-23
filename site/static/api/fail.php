<?php
// GET /api/fail.php?code=500 → deliberate error for error-handling demos
require __DIR__ . '/_lib.php'; html_out();
$code = (int)($_GET['code'] ?? 500);
if (!in_array($code, [400, 401, 403, 404, 422, 429, 500, 503], true)) $code = 500;
http_response_code($code);
echo 'Deliberate ' . $code . ' from /api/fail.php';
