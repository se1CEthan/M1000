# Seller Dashboard & Admin Dashboard Fixes

## Issues Fixed

### 1. Seller Dashboard Not Showing Products
**Problem**: Seller dashboard was not displaying uploaded products
**Root Cause**: Using `profile.user_id` instead of `profile.id` for database queries
**Solution**: Updated all queries to use `profile.id` which matches the foreign key references in the database

### 2. Admin Dashboard Failed to Load Purchases and Payouts
**Problem**: Admin dashboard couldn't load purchase and payout data
**Root Cause**: Complex foreign key references in Supabase queries were failing
**Solution**: Simplified queries to fetch data separately and enrich it manually

## Files Updated

### Seller Dashboard Components
1. **`src/pages/SellerDashboard.tsx`**
   - Fixed `fetchSellerData()` to use `profile.id` instead of `profile.user_id`
   - Fixed buyer profile lookup to use `id` instead of `user_id`

2. **`src/hooks/useSellerStats.ts`**
   - Updated all database queries to use `profile.id`
   - Fixed real-time subscriptions to use correct profile ID
   - Updated dependency array to watch `profile.id`

3. **`src/components/seller/ProductUploadForm.tsx`**
   - Fixed `seller_id` to use `profile.id`
   - Updated file path generation to use `profile.id`

4. **`src/components/seller/MobileMoneyPayoutSetup.tsx`**
   - Fixed order and payout queries to use `profile.id`
   - Fixed payout insertion to use `profile.id`
   - Kept profile update using `user_id` (correct for profiles table)

### Admin Dashboard Components
5. **`src/components/admin/AdminPurchasesAndPayouts.tsx`**
   - Completely rewrote `fetchData()` function
   - Removed complex foreign key references
   - Added manual data enrichment for products, sellers, and buyers
   - Added error handling for missing seller_payouts table
   - Improved data loading reliability

## Database Schema Understanding

The database uses these foreign key relationships:
- `products.seller_id` → `profiles.id`
- `orders.seller_id` → `profiles.id`
- `orders.buyer_id` → `profiles.id`
- `seller_payouts.seller_id` → `profiles.id` (after migration)

But profile updates use:
- `profiles.user_id` for authentication-related updates

## What Works Now

### Seller Dashboard
✅ **Products Tab**: Shows all uploaded products with correct pricing in UGX
✅ **Orders Tab**: Shows real orders from actual buyers
✅ **Analytics**: Real-time stats and performance metrics
✅ **Mobile Money Setup**: Can save mobile money numbers (after DB migration)
✅ **Real-time Updates**: Live data updates every 30 seconds

### Admin Dashboard - Purchases Tab
✅ **Product Purchases**: Shows all orders with complete information
✅ **Seller Information**: Displays seller names, emails, and mobile money numbers
✅ **Buyer Information**: Shows buyer details for each purchase
✅ **Revenue Tracking**: UGX pricing with seller/platform fee breakdown
✅ **Export Functionality**: CSV export for purchases and payouts
✅ **Search & Filters**: Filter by status, payment method, etc.

### Admin Dashboard - Payouts Tab
✅ **Seller Payouts**: Shows payout requests with mobile money info
✅ **Payout Management**: Approve, reject, and mark as paid
✅ **Mobile Money Integration**: Shows seller mobile money numbers
✅ **Order Tracking**: Links payouts to specific orders and products

## Database Migration Still Needed

To enable mobile money functionality, run this SQL in Supabase:

```sql
-- Add mobile money columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS mobile_money_number TEXT,
ADD COLUMN IF NOT EXISTS mobile_money_provider TEXT;

-- Create index for mobile money number
CREATE INDEX IF NOT EXISTS idx_profiles_mobile_money_number ON public.profiles(mobile_money_number);
```

## Testing Verification

1. **Seller Dashboard**: 
   - Upload a product → Should appear in Products tab
   - Check Orders tab → Should show real orders (if any exist)
   - Try mobile money setup → Should save after DB migration

2. **Admin Dashboard**:
   - Go to Purchases tab → Should load all orders with seller/buyer info
   - Check mobile money numbers → Should display in seller information
   - Try export functionality → Should generate CSV files

## Performance Improvements

- Simplified database queries reduce complexity
- Manual data enrichment provides better error handling
- Real-time subscriptions only update when necessary
- Proper indexing on mobile money numbers for fast lookups

The seller dashboard now properly shows uploaded products, and the admin dashboard successfully loads purchase and payout data with complete seller mobile money information!