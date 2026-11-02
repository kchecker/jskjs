<?php
// POST /api/notes.php text=… → rendered <li> with its own kj-delete button
// DELETE /api/notes.php?id=… → empty body (the row swaps itself out)
require __DIR__ . '/_lib.php'; html_out();
$m = $_SERVER['REQUEST_METHOD'];
if ($m === 'DELETE') { exit; }
if ($m === 'PATCH') { $t = input('text', 140); echo h($t) . ' <span class="chip">edited</span>'; exit; }
if ($m !== 'POST') { http_response_code(405); exit; }
$text = input('text', 140);
if ($text === '' || $text === null) { http_response_code(422); echo '<li class="no">Write something first.</li>'; exit; }
$id = bin2hex(random_bytes(4));
echo '<li id="note-' . $id . '" class="note-row"><span>' . h($text) . '</span> '
   . '<button type="button" kj-delete="/api/notes.php?id=' . $id . '" kj-target="#note-' . $id . '" kj-swap="outerHTML" aria-label="Delete note">✕</button></li>';
