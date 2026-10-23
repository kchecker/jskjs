<?php
// POST /api/subscribe.php  email=…  → confirmation (demo only: nothing is stored or sent)
require __DIR__ . '/_lib.php'; html_out();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo 'Use POST'; exit; }
$email = input('email', 120);
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) { http_response_code(422); echo '<span class="no">✗ “' . h($email) . '” is not a valid email.</span>'; exit; }
echo '<span class="yes">✓ Subscribed ' . h($email) . '</span> <span class="muted">(demo endpoint — nothing was stored or sent)</span>';
