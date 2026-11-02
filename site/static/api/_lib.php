<?php
// Shared helpers for jsKjs demo endpoints. Stateless: nothing is stored.
header('X-Robots-Tag: noindex');
header('Cache-Control: no-store');
function h($s) { return htmlspecialchars((string)$s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
function input($key, $max = 200) {
  $v = $_GET[$key] ?? $_POST[$key] ?? null;
  if ($v === null) {
    static $body = null;
    if ($body === null) { parse_str(file_get_contents('php://input', false, null, 0, 8192) ?: '', $body);
      if (!$body) { $j = json_decode(file_get_contents('php://input', false, null, 0, 8192) ?: '', true); $body = is_array($j) ? $j : []; } }
    $v = $body[$key] ?? null;
  }
  return is_string($v) ? mb_substr(trim($v), 0, $max) : $v;
}
// Error demos only misbehave for requests made by the page itself (jsKjs sends X-Requested-With / HX-Request).
// Crawlers and people opening the URL directly get a plain 200 explanation, so search engines never log 4xx/5xx here.
function from_demo() { return !empty($_SERVER['HTTP_X_REQUESTED_WITH']) || !empty($_SERVER['HTTP_HX_REQUEST']); }
function demo_only($what) {
  if (from_demo()) return;
  header('Content-Type: text/plain; charset=utf-8');
  echo "This endpoint powers a live demo on https://jskjs.org ($what). It only returns errors to requests made by the demo itself.";
  exit;
}
function html_out() { header('Content-Type: text/html; charset=utf-8'); }
function json_out($data) { header('Content-Type: application/json; charset=utf-8'); echo json_encode($data); exit; }
