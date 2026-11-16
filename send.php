<?php
/**
 * Form handler for the Contact and Privacy Request forms.
 *
 * Receives a POST, validates it, and emails it to TO_ADDRESS.
 * Nothing is stored on the server except a short-lived anti-spam throttle
 * record (a hash of the visitor's IP address and recent timestamps) in the
 * system temp folder, deleted automatically after 2 hours.
 *
 * Requires PHP 8+ with mail() available (standard on Namecheap shared hosting).
 */
declare(strict_types=1);

const TO_ADDRESS   = 'contact@nightshot.media';   // where messages are delivered
const FROM_ADDRESS = 'website@nightshot.media';   // sender shown on the email; must be on this domain
const MIN_FILL_MS  = 2500;                         // forms submitted faster than this are treated as bots
const MAX_PER_HOUR = 5;                            // per visitor
const MIN_GAP_SEC  = 15;                           // between submissions from one visitor

header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

$wantsJson = isset($_SERVER['HTTP_ACCEPT']) && str_contains($_SERVER['HTTP_ACCEPT'], 'application/json');

function respond(bool $ok, string $message, int $status = 200): never
{
    global $wantsJson;
    http_response_code($status);
    if ($wantsJson) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => $ok, 'message' => $message], JSON_UNESCAPED_UNICODE);
        exit;
    }
    // Fallback page for browsers without JavaScript
    header('Content-Type: text/html; charset=utf-8');
    $title = $ok ? 'Message submitted' : 'Message not sent';
    $msg = htmlspecialchars($message, ENT_QUOTES, 'UTF-8');
    echo '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">'
       . '<meta name="viewport" content="width=device-width, initial-scale=1">'
       . '<meta name="robots" content="noindex"><title>' . $title . ' — Nightshot Media</title>'
       . '<link rel="stylesheet" href="style.css"></head><body>'
       . '<main class="page"><h1>' . $title . '</h1><p>' . $msg . '</p>'
       . '<a class="btn" href="index.html">Back to site</a></main></body></html>';
    exit;
}

/** Trim, drop control characters (keeping newlines), and cap length. */
function clean(mixed $value, int $max, bool $multiline = false): string
{
    $v = is_string($value) ? $value : '';
    $v = str_replace("\r\n", "\n", $v);
    $pattern = $multiline ? '/[^\P{C}\n]/u' : '/\p{C}/u';
    $v = preg_replace($pattern, '', $v) ?? '';
    return mb_substr(trim($v), 0, $max);
}

/** Remove anything that could break an email header. */
function headerSafe(string $v): string
{
    return trim(preg_replace('/[\r\n\t<>"]+/', ' ', $v) ?? '');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(false, 'This page only accepts form submissions.', 405);
}

// Honeypot: real visitors never see or fill this field. Pretend success to bots.
if (!empty($_POST['website'])) {
    respond(true, 'Message submitted.');
}

// Bots submit instantly; people take a few seconds.
if ((int)($_POST['elapsed'] ?? 0) < MIN_FILL_MS) {
    respond(false, 'Please take a moment to fill in the form, then try again.', 400);
}

$form  = ($_POST['form'] ?? 'contact') === 'privacy' ? 'privacy' : 'contact';
$name  = clean($_POST['name'] ?? '', 100);
$email = clean($_POST['email'] ?? '', 254);

if ($name === '' || $email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(false, 'Please enter your name and a valid email address.', 422);
}

if ($form === 'privacy') {
    $allowed = ['Access my data', 'Correct my data', 'Delete my data', 'Marketing opt-out', 'Other privacy question'];
    $type = clean($_POST['type'] ?? '', 60);
    if (!in_array($type, $allowed, true)) {
        respond(false, 'Please choose a request type.', 422);
    }
    $details = clean($_POST['details'] ?? '', 3000, true);
    $subject = 'Privacy request: ' . $type;
    $body = "Privacy request from the website\n\n"
          . "Request type: {$type}\nName: {$name}\nEmail: {$email}\n"
          . ($details !== '' ? "\nDetails:\n{$details}\n" : '');
} else {
    $message = clean($_POST['message'] ?? '', 5000, true);
    if ($message === '') {
        respond(false, 'Please enter a message.', 422);
    }
    $subject = 'Website inquiry from ' . headerSafe($name);
    $body = "New inquiry from the website\n\nName: {$name}\nEmail: {$email}\n\nMessage:\n{$message}\n";
}

// Anti-spam throttle (hash of IP + recent timestamps, kept in the temp folder)
$dir = sys_get_temp_dir() . '/nightshot_rl';
if (!is_dir($dir)) {
    @mkdir($dir, 0700, true);
}
foreach (glob($dir . '/*.json') ?: [] as $old) {
    if (@filemtime($old) < time() - 7200) {
        @unlink($old);
    }
}
$file = $dir . '/' . hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . '|nightshot') . '.json';
$now  = time();
$hits = is_file($file) ? (json_decode((string)@file_get_contents($file), true) ?: []) : [];
$hits = array_values(array_filter($hits, fn($t) => is_int($t) && $t > $now - 3600));
if (count($hits) >= MAX_PER_HOUR || ($hits && max($hits) > $now - MIN_GAP_SEC)) {
    respond(false, 'You are sending messages too quickly. Please wait a moment and try again.', 429);
}

$headers = [
    'From: Nightshot Media Website <' . FROM_ADDRESS . '>',
    'Reply-To: ' . headerSafe($name) . ' <' . $email . '>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'X-Form-Source: nightshot.media/' . $form,
];
$encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';

$sent = mail(TO_ADDRESS, $encodedSubject, $body, implode("\r\n", $headers), '-f' . FROM_ADDRESS);

if (!$sent) {
    error_log('nightshot form: mail() failed'); // no personal data in the log
    respond(false, 'Sorry, your message could not be sent. Please email ' . TO_ADDRESS . ' directly.', 500);
}

$hits[] = $now;
@file_put_contents($file, json_encode($hits), LOCK_EX);

respond(true, $form === 'privacy'
    ? 'Request submitted. We will reply to the email address you provided.'
    : 'Message submitted. Thank you, we will get back to you soon.');
