<?php
// GET /api/validate.php?username=…  → inline validation message
require __DIR__ . '/_lib.php'; html_out();
$u = input('username', 40) ?? '';
$taken = ['admin', 'root', 'jquery', 'karan', 'claude'];
if ($u === '') { echo '<span class="muted">Pick a username (3–20 letters, numbers, _).</span>'; exit; }
if (!preg_match('/^[a-zA-Z0-9_]{3,20}$/', $u)) { echo '<span class="no">✗ 3–20 characters: letters, numbers or _</span>'; exit; }
if (in_array(strtolower($u), $taken, true)) { echo '<span class="no">✗ “' . h($u) . '” is taken</span>'; exit; }
echo '<span class="yes">✓ “' . h($u) . '” is available</span>';
