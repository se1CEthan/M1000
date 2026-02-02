<?php
/**
 * Cryptomus Payment Creation - PHP Backend
 * Handles secure server-side payment processing
 */

require_once __DIR__ . '/config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

/**
 * Generate Cryptomus API signature
 */
function generateCryptomusSignature($data, $apiKey) {
    $jsonString = json_encode($data, JSON_UNESCAPED_SLASHES);
    $base64Data = base64_encode($jsonString);
    $message = $base64Data . $apiKey;
    return md5($message);
}

/**
 * Make Cryptomus API request
 */
function callCryptomusAPI($endpoint, $data) {
    $data['merchant'] = CRYPTOMUS_MERCHANT_UUID;
    $signature = generateCryptomusSignature($data, CRYPTOMUS_PAYMENT_API_KEY);
    
    $headers = [
        'Content-Type: application/json',
        'merchant: ' . CRYPTOMUS_MERCHANT_UUID,
        'sign: ' . $signature
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, CRYPTOMUS_BASE_URL . $endpoint);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    if (curl_error($ch)) {
        curl_close($ch);
        throw new Exception('Curl error: ' . curl_error($ch));
    }
    
    curl_close($ch);
    
    if ($httpCode !== 200) {
        throw new Exception('HTTP error: ' . $httpCode);
    }
    
    return json_decode($response, true);
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

try {
    // Get request data
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('Invalid JSON input');
    }
    
    $productId = $input['productId'] ?? null;
    $buyerId = $input['buyerId'] ?? null;
    $currency = $input['currency'] ?? null;
    
    // Validate required fields
    if (!$productId || !$buyerId || !$currency) {
        throw new Exception('Missing required fields: productId, buyerId, currency');
    }
    
    error_log("Creating payment for product: $productId, buyer: $buyerId, currency: $currency");
    
    // Connect to database
    $pdo = connectDatabase();
    
    // Get product details
    $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ? AND status = 'approved'");
    $stmt->execute([$productId]);
    $product = $stmt->fetch();
    
    if (!$product) {
        throw new Exception('Product not found or not available');
    }
    
    // Check if user already owns this product
    $stmt = $pdo->prepare("SELECT id FROM orders WHERE buyer_id = ? AND product_id = ? AND status = 'paid'");
    $stmt->execute([$buyerId, $productId]);
    $existingOrder = $stmt->fetch();
    
    if ($existingOrder) {
        throw new Exception('You already own this product');
    }
    
    // Calculate revenue split
    $price = floatval($product['price']);
    $platformFee = $price * 0.1;
    $sellerEarnings = $price * 0.9;
    
    // Create order in database
    $orderNumber = 'ORD-' . time() . '-' . substr(md5(uniqid()), 0, 8);
    
    $stmt = $pdo->prepare("
        INSERT INTO orders (
            buyer_id, seller_id, product_id, order_number, status, 
            price, platform_fee, seller_earnings, payment_method, 
            currency, crypto_currency, created_at
        ) VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, 'cryptocurrency', 'USD', ?, NOW())
        RETURNING id
    ");
    
    $stmt->execute([
        $buyerId,
        $product['seller_id'],
        $productId,
        $orderNumber,
        $price,
        $platformFee,
        $sellerEarnings,
        $currency
    ]);
    
    $order = $stmt->fetch();
    if (!$order) {
        throw new Exception('Failed to create order');
    }
    
    $orderId = $order['id'];
    error_log("Order created successfully: $orderId");
    
    // Prepare Cryptomus payment data
    $baseUrl = (isset($_SERVER['HTTPS']) ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'];
    
    $paymentData = [
        'amount' => strval($price),
        'currency' => 'USD',
        'order_id' => $orderId,
        'url_return' => $baseUrl . '/order-success?order=' . $orderId,
        'url_success' => $baseUrl . '/order-success?order=' . $orderId,
        'url_callback' => $baseUrl . '/php-backend/webhook.php',
        'to_currency' => $currency,
        'lifetime' => 3600, // 1 hour
        'is_payment_multiple' => false
    ];
    
    error_log("Creating Cryptomus invoice: " . json_encode($paymentData));
    
    // Call Cryptomus API
    $response = callCryptomusAPI('/payment', $paymentData);
    
    if ($response['state'] !== 0 || !isset($response['result'])) {
        error_log("Cryptomus API error: " . json_encode($response));
        
        // Update order status to failed
        $stmt = $pdo->prepare("UPDATE orders SET status = 'refunded' WHERE id = ?");
        $stmt->execute([$orderId]);
        
        throw new Exception('Failed to create payment invoice');
    }
    
    $paymentResult = $response['result'];
    
    // Update order with payment details
    $stmt = $pdo->prepare("
        UPDATE orders SET 
            payment_id = ?, 
            crypto_amount = ?, 
            payment_address = ?, 
            payment_network = ?,
            updated_at = NOW()
        WHERE id = ?
    ");
    
    $stmt->execute([
        $paymentResult['uuid'],
        floatval($paymentResult['payer_amount'] ?? 0),
        $paymentResult['address'] ?? null,
        $paymentResult['network'] ?? null,
        $orderId
    ]);
    
    error_log("Payment created successfully for order: $orderId");
    
    // Return success response
    echo json_encode([
        'success' => true,
        'orderId' => $orderId,
        'paymentUrl' => $paymentResult['url'],
        'paymentId' => $paymentResult['uuid'],
        'amount' => $paymentResult['amount'],
        'currency' => $paymentResult['currency'],
        'toCurrency' => $paymentResult['payer_currency'],
        'expiresAt' => $paymentResult['expired_at']
    ]);
    
} catch (Exception $e) {
    error_log("Payment creation error: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>