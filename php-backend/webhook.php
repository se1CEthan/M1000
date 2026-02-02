<?php
/**
 * Cryptomus Webhook Handler - PHP Backend
 * Handles payment confirmations from Cryptomus
 */

require_once __DIR__ . '/config.php';

header('Content-Type: application/json');

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

/**
 * Verify webhook signature
 */
function verifyWebhookSignature($payload, $signature) {
    $message = $payload . CRYPTOMUS_WEBHOOK_SECRET;
    $expectedSignature = md5($message);
    return hash_equals($expectedSignature, $signature);
}

/**
 * Connect to database
 */
function connectDatabase() {
    try {
        $dsn = "pgsql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME;
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]);
        return $pdo;
    } catch (PDOException $e) {
        throw new Exception('Database connection failed: ' . $e->getMessage());
    }
}

/**
 * Process payout to seller
 */
function processPayout($pdo, $orderId, $sellerEarnings, $currency) {
    try {
        // Get seller wallet info
        $stmt = $pdo->prepare("
            SELECT u.id, u.email, sw.wallet_address, sw.network, sw.currency
            FROM orders o
            JOIN users u ON u.id = o.seller_id
            LEFT JOIN seller_wallets sw ON sw.seller_id = u.id AND sw.currency = ?
            WHERE o.id = ?
        ");
        $stmt->execute([$currency, $orderId]);
        $seller = $stmt->fetch();
        
        if (!$seller || !$seller['wallet_address']) {
            error_log("No wallet configured for seller in order: $orderId");
            return false;
        }
        
        // Create payout record
        $stmt = $pdo->prepare("
            INSERT INTO payouts (
                seller_id, order_id, amount, currency, network, 
                wallet_address, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())
            RETURNING id
        ");
        
        $stmt->execute([
            $seller['id'],
            $orderId,
            $sellerEarnings,
            $currency,
            $seller['network'],
            $seller['wallet_address']
        ]);
        
        $payout = $stmt->fetch();
        if ($payout) {
            error_log("Payout created for seller: {$seller['id']}, amount: $sellerEarnings $currency");
            return true;
        }
        
        return false;
        
    } catch (Exception $e) {
        error_log("Payout processing error: " . $e->getMessage());
        return false;
    }
}

try {
    // Get raw POST data
    $payload = file_get_contents('php://input');
    $signature = $_SERVER['HTTP_SIGN'] ?? '';
    
    error_log("Webhook received - Signature: $signature");
    error_log("Webhook payload: $payload");
    
    // Verify signature
    if (!verifyWebhookSignature($payload, $signature)) {
        error_log("Invalid webhook signature");
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Invalid signature']);
        exit();
    }
    
    // Parse webhook data
    $webhookData = json_decode($payload, true);
    
    if (!$webhookData) {
        error_log("Invalid webhook JSON");
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid JSON']);
        exit();
    }
    
    error_log("Webhook data parsed: " . json_encode($webhookData));
    
    // Extract payment information
    $paymentId = $webhookData['uuid'] ?? null;
    $orderId = $webhookData['order_id'] ?? null;
    $status = $webhookData['status'] ?? null;
    $paymentStatus = $webhookData['payment_status'] ?? null;
    $txid = $webhookData['txid'] ?? null;
    $amount = $webhookData['amount'] ?? null;
    $payerAmount = $webhookData['payer_amount'] ?? null;
    $currency = $webhookData['payer_currency'] ?? null;
    
    if (!$paymentId || !$orderId) {
        error_log("Missing required webhook fields");
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing required fields']);
        exit();
    }
    
    // Connect to database
    $pdo = connectDatabase();
    
    // Get order details
    $stmt = $pdo->prepare("SELECT * FROM orders WHERE id = ? AND payment_id = ?");
    $stmt->execute([$orderId, $paymentId]);
    $order = $stmt->fetch();
    
    if (!$order) {
        error_log("Order not found: $orderId with payment ID: $paymentId");
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Order not found']);
        exit();
    }
    
    error_log("Processing webhook for order: $orderId, status: $status, payment_status: $paymentStatus");
    
    // Update order based on payment status
    $newStatus = 'pending';
    $updateFields = [
        'payment_status' => $paymentStatus,
        'updated_at' => 'NOW()'
    ];
    
    if ($txid) {
        $updateFields['transaction_id'] = $txid;
    }
    
    if ($payerAmount) {
        $updateFields['crypto_amount'] = floatval($payerAmount);
    }
    
    // Determine order status based on Cryptomus status
    switch ($status) {
        case 'paid':
        case 'paid_over':
            $newStatus = 'paid';
            $updateFields['paid_at'] = 'NOW()';
            break;
        case 'fail':
        case 'cancel':
        case 'system_fail':
            $newStatus = 'refunded';
            break;
        case 'process':
        case 'confirm_check':
            $newStatus = 'processing';
            break;
        default:
            $newStatus = 'pending';
    }
    
    $updateFields['status'] = $newStatus;
    
    // Build update query
    $setClause = [];
    $values = [];
    
    foreach ($updateFields as $field => $value) {
        if ($value === 'NOW()') {
            $setClause[] = "$field = NOW()";
        } else {
            $setClause[] = "$field = ?";
            $values[] = $value;
        }
    }
    
    $values[] = $orderId;
    
    $updateQuery = "UPDATE orders SET " . implode(', ', $setClause) . " WHERE id = ?";
    $stmt = $pdo->prepare($updateQuery);
    $stmt->execute($values);
    
    error_log("Order $orderId updated to status: $newStatus");
    
    // If payment is successful, process seller payout
    if ($newStatus === 'paid' && $order['seller_earnings'] > 0) {
        $payoutSuccess = processPayout($pdo, $orderId, $order['seller_earnings'], $currency);
        if ($payoutSuccess) {
            error_log("Payout initiated for order: $orderId");
        }
    }
    
    // Log webhook processing
    $stmt = $pdo->prepare("
        INSERT INTO webhook_logs (
            webhook_type, payment_id, order_id, status, 
            payload, processed_at
        ) VALUES ('cryptomus_payment', ?, ?, ?, ?, NOW())
    ");
    
    $stmt->execute([$paymentId, $orderId, $newStatus, $payload]);
    
    // Return success response
    echo json_encode([
        'success' => true,
        'orderId' => $orderId,
        'status' => $newStatus,
        'message' => 'Webhook processed successfully'
    ]);
    
} catch (Exception $e) {
    error_log("Webhook processing error: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Webhook processing failed'
    ]);
}
?>