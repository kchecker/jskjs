<?php
// GET /api/stream.php → a short Server-Sent Events stream (5 events, then closes and asks the browser to wait before reconnecting).
// Kept short on purpose: shared hosting limits long-running PHP requests.
require __DIR__ . '/_lib.php';
header('Content-Type: text/event-stream; charset=utf-8');
header('X-Accel-Buffering: no');
@ini_set('zlib.output_compression', '0');
@ini_set('output_buffering', 'off');
while (ob_get_level() > 0) ob_end_flush();
$quotes = ['Deploy finished in 41s', 'New signup from Lisbon', 'Cache hit rate 97%', 'Order #1042 shipped', 'Build passed on main', 'Backup completed', 'p95 latency 112 ms'];
echo "retry: 15000\n\n"; flush();
for ($i = 1; $i <= 5; $i++) {
  $q = $quotes[array_rand($quotes)];
  echo "event: message\n";
  echo 'data: <li><b>' . gmdate('H:i:s') . '</b> ' . h($q) . "</li>\n\n";
  echo "event: count\n";
  echo "data: <span>$i</span>\n\n";
  flush();
  if ($i < 5) sleep(1);
}
echo "event: done\ndata: <span>stream closed — reconnecting in 15 s</span>\n\n"; flush();
