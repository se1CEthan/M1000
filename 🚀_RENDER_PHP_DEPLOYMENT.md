# 🚀 Deploy PHP Backend on Render

## ✅ Why Render is Perfect

- ✅ Native PHP support
- ✅ Free tier available
- ✅ Automatic HTTPS
- ✅ Easy deployment from Git
- ✅ Environment variables support

## 📁 Render Deployment Setup

### Step 1: Prepare for Render
Create these files in your project root:

**`render.yaml`** (update your existing one):
```yaml
services:
  # Frontend (existing)
  - type: web
    name: seltech-frontend
    env: static
    buildCommand: npm run build
    staticPublishPath: ./dist
    
  # PHP Backend (new)
  - type: web
    name: seltech-php-backend
    env: php
    plan: free
    buildCommand: echo "No build needed"
    startCommand: php -S 0.0.0.0:$PORT -t php-backend
    envVars:
      - key: DB_HOST
        value: db.rtsaarapvlzzinmpjdys.supabase.co
      - key: DB_NAME
        value: postgres
      - key: DB_USER
        value: postgres
      - key: DB_PASS
        fromService:
          type: web
          name: seltech-php-backend
          envVarKey: SUPABASE_PASSWORD
      - key: CRYPTOMUS_MERCHANT_UUID
        value: 6e6c1018-48f4-49fd-a10d-36d6cd70eefe
      - key: CRYPTOMUS_PAYMENT_API_KEY
        fromService:
          type: web
          name: seltech-php-backend
          envVarKey: CRYPTOMUS_PAYMENT_KEY
```

### Step 2: Update PHP Config for Render
Update `php-backend/config.php`:
```php
<?php
// Render Environment Configuration
define('CRYPTOMUS_MERCHANT_UUID', $_ENV['CRYPTOMUS_MERCHANT_UUID'] ?? '6e6c1018-48f4-49fd-a10d-36d6cd70eefe');
define('CRYPTOMUS_PAYMENT_API_KEY', $_ENV['CRYPTOMUS_PAYMENT_API_KEY'] ?? 'DSk5vMk3RIBhiQ3qGUw1pH1iYJI1hSSN8iTYmHpm3WpyTj9bsTtIlhadpiFKlK5aVUmpjHH8YoLV9dQsxLAPzpQOdiffl2hzJo0378ExFJB3HMSx49LjTfvnm9qHztoP');
define('CRYPTOMUS_PAYOUT_API_KEY', $_ENV['CRYPTOMUS_PAYOUT_API_KEY'] ?? '2nuhleS45ns1WTJDX1ZoRG8UAmDFDdahvMafGhU5knS5P3Ozn1Yx0tgRYCmjJpKvtNx0GVQ0FTLo0SNVw1ZM7Zy97fXSsbHX8SGbgGepEHCqwtxw3gIJ8LKDIMDJ3W4s');
define('CRYPTOMUS_BASE_URL', 'https://api.cryptomus.com/v1');
define('CRYPTOMUS_WEBHOOK_SECRET', 'seltech_webhook_secret_2024');

// Database from environment
define('DB_HOST', $_ENV['DB_HOST'] ?? 'db.rtsaarapvlzzinmpjdys.supabase.co');
define('DB_NAME', $_ENV['DB_NAME'] ?? 'postgres');
define('DB_USER', $_ENV['DB_USER'] ?? 'postgres');
define('DB_PASS', $_ENV['DB_PASS'] ?? 'your-password-here');
define('DB_PORT', $_ENV['DB_PORT'] ?? '5432');

// Application Configuration
define('APP_URL', 'https://seltech.online');
define('APP_NAME', 'Seltech');
?>
```

### Step 3: Deploy to Render
1. **Push to GitHub**: Commit all files to your repository
2. **Connect to Render**: 
   - Go to [render.com](https://render.com)
   - Connect your GitHub repository
   - Render will auto-detect the `render.yaml`
3. **Set Environment Variables**:
   - `SUPABASE_PASSWORD`: Your actual Supabase password
   - `CRYPTOMUS_PAYMENT_KEY`: Your Cryptomus payment API key
4. **Deploy**: Render will deploy both frontend and PHP backend

### Step 4: Update Frontend URLs
Your PHP backend will be at: `https://seltech-php-backend.onrender.com`

Update `src/lib/simple-cryptomus-payment.ts`:
```typescript
// Call PHP backend on Render
const response = await fetch('https://seltech-php-backend.onrender.com/create-payment.php', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    productId: data.productId,
    buyerId: data.buyerId,
    currency: data.currency
  })
});
```

### Step 5: Configure Cryptomus Webhook
Set webhook URL in Cryptomus dashboard:
```
https://seltech-php-backend.onrender.com/webhook.php
```

## 🎯 Benefits of Render Deployment

✅ **Free tier available**
✅ **Automatic HTTPS**
✅ **Git-based deployment**
✅ **Environment variables**
✅ **PHP 8+ support**
✅ **Zero configuration**

## 🧪 Testing Render Deployment

Once deployed, test:
```
https://seltech-php-backend.onrender.com/test-connection.php
```

This should return successful database and API connections.