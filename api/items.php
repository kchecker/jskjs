<?php
// DELETE /api/items.php?id=… → empty 200 (used with kj-swap="outerHTML")
require __DIR__ . '/_lib.php'; html_out();
if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') { http_response_code(405); echo 'Use DELETE'; exit; }
exit;
