<?php
/**
 * PHP Backend Configuration
 * Supports both local development and Render deployment
 */

// Cryptomus Configuration - Use environment variables on Render
define('CRYPTOMUS_MERCHANT_UUID', $_ENV['CRYPTOMUS_MERCHANT_UUID'] ?? '6e6c1018-48f4-49fd-a10d-36d6cd70eefe');
define('CRYPTOMUS_PAYMENT_API_KEY', $_ENV['CRYPTOMUS_PAYMENT_API_KEY'] ?? 'DSk5vMk3RIBhiQ3qGUw1pH1iYJI1hSSN8iTYmHpm3WpyTj9bsTtIlhadpiFKlK5aVUmpjHH8YoLV9dQsxLAPzpQOdiffl2hzJo0378ExFJB3HMSx49LjTfvnm9qHztoP');
define('CRYPTOMUS_PAYOUT_API_KEY', $_ENV['CRYPTOMUS_PAYOUT_API_KEY'] ?? '2nuhleS45ns1WTJDX1ZoRG8UAmDFDdahvMafGhU5knS5P3Ozn1Yx0tgRYCmjJpKvtNx0GVQ0FTLo0SNVw1ZM7Zy97fXSsbHX8SGbgGepEHCqwtxw3gIJ8LKDIMDJ3W4s');
define('CRYPTOMUS_BASE_URL', 'https://api.cryptomus.com/v1');
define('CRYPTOMUS_WEBHOOK_SECRET', $_ENV['CRYPTOMUS_WEBHOOK_SECRET'] ?? 'seltech_webhook_secret_2024');

// Database Configuration - Use environment variables on Render
define('DB_HOST', $_ENV['DB_HOST'] ?? 'db.rtsaarapvlzzinmpjdys.supabase.co');
define('DB_NAME', $_ENV['DB_NAME'] ?? 'postgres');
define('DB_USER', $_ENV['DB_USER'] ?? 'postgres');
define('DB_PASS', $_ENV['DB_PASS'] ?? 'YOUR_SUPABASE_PASSWORD_HERE'); // ⚠️ Set this in Render dashboard
define('DB_PORT', $_ENV['DB_PORT'] ?? '5432');

// Application Configuration
define('APP_URL', $_ENV['APP_URL'] ?? 'https://seltech.online');
define('APP_NAME', $_ENV['APP_NAME'] ?? 'Seltech');

// Revenue Split Configuration
define('PLATFORM_FEE_PERCENT', 0.1); // 10% platform fee
define('SELLER_EARNINGS_PERCENT', 0.9); // 90% to seller

// Security Configuration
define('ENABLE_SIGNATURE_VERIFICATION', true);
define('LOG_WEBHOOK_REQUESTS', true);

// Error Reporting (disable in production)
if ($_ENV['APP_ENV'] ?? 'production' === 'development') {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
}
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error.log');
?>