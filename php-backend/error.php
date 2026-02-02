<?php
/**
 * PHP Backend Error Handler
 */

header('Content-Type: application/json');
http_response_code(500);

echo json_encode([
    'success' => false,
    'error' => 'PHP Backend Error',
    'message' => 'An error occurred processing your request',
    'timestamp' => date('Y-m-d H:i:s')
]);
?>