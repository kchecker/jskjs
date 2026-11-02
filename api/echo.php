<?php
// ANY /api/echo.php → shows exactly what the server received
require __DIR__ . '/_lib.php';
$raw = file_get_contents('php://input', false, null, 0, 8192) ?: '';
$body = []; parse_str($raw, $body);
if (!$body && $raw) { $j = json_decode($raw, true); if (is_array($j)) $body = $j; }
$data = ['method' => $_SERVER['REQUEST_METHOD'], 'query' => $_GET, 'body' => $_POST ?: $body,
  'content_type' => $_SERVER['CONTENT_TYPE'] ?? null, 'x_requested_with' => $_SERVER['HTTP_X_REQUESTED_WITH'] ?? null];
if (($_GET['format'] ?? '') === 'json') json_out($data);
html_out();
echo '<pre class="out" style="margin:0">' . h(json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)) . '</pre>';
