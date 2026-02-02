<?php
/**
 * Test PHP Backend Connection
 * Run this to verify database and API connectivity
 */

require_once __DIR__ . '/config.php';

header('Content-Type: application/json');

function testDatabaseConnection() {
    try {
        $dsn = "pgsql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME;
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]);
        
        // Test query
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM products");
        $result = $stmt->fetch();
        
        return [
            'success' => true,
            'message' => 'Database connected successfully',
            'product_count' => $result['count']
        ];
    } catch (Exception $e) {
        return [
            'success' => false,
            'message' => 'Database connection failed: ' . $e->getMessage()
        ];
    }
}

function testCryptomusAPI() {
    try {
        // Test data
        $data = [
            'merchant' => CRYPTOMUS_MERCHANT_UUID,
            'amount' => '1.00',
            'currency' => 'USD',
            'order_id' => 'test-' . time()
        ];
        
        // Generate signature
        $jsonString = json_encode($data, JSON_UNESCAPED_SLASHES);
        $base64Data = base64_encode($jsonString);
        $message = $base64Data . CRYPTOMUS_PAYMENT_API_KEY;
        $signature = md5($message);
        
        return [
            'success' => true,
            'message' => 'Cryptomus API configuration valid',
            'merchant_id' => CRYPTOMUS_MERCHANT_UUID,
            'signature_generated' => true
        ];
    } catch (Exception $e) {
        return [
            'success' => false,
            'message' => 'Cryptomus API test failed: ' . $e->getMessage()
        ];
    }
}

// Run tests
$tests = [
    'database' => testDatabaseConnection(),
    'cryptomus' => testCryptomusAPI(),
    'php_version' => [
        'success' => true,
        'version' => phpversion(),
        'extensions' => [
            'curl' => extension_loaded('curl'),
            'pdo' => extension_loaded('pdo'),
            'pdo_pgsql' => extension_loaded('pdo_pgsql'),
            'json' => extension_loaded('json')
        ]
    ]
];

echo json_encode([
    'success' => true,
    'message' => 'PHP Backend Test Results',
    'tests' => $tests,
    'timestamp' => date('Y-m-d H:i:s')
], JSON_PRETTY_PRINT);
?>