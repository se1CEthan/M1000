# 🔧 Supabase Dashboard Storage Fix

## The Issue
The `storage.objects` table cannot be modified via SQL even with owner privileges. We need to use the Supabase Dashboard interface.

## Step 1: Run SQL Fix First
Run the `database/dashboard-storage-fix.sql` script to fix all the tables we can control via SQL.

## Step 2: Fix Storage via Dashboard

### Go to Storage Policies
1. **Open your Supabase Dashboard**
2. **Navigate to Storage > Policies**
3. **You'll see policies for `objects` table**

### Option A: Disable RLS Completely (Recommended)
1. **Click on the `objects` table**
2. **Look for "Enable RLS" toggle**
3. **Turn OFF the RLS toggle** 
4. **This disables all storage restrictions**

### Option B: Create Permissive Policies (If RLS can't be disabled)
If you can't disable RLS, create these policies:

#### Policy 1: Allow All Uploads
- **Policy Name**: `allow_all_uploads`
- **Allowed Operation**: `INSERT`
- **Target Roles**: `authenticated`
- **USING Expression**: `true`
- **WITH CHECK Expression**: `true`

#### Policy 2: Allow All Downloads  
- **Policy Name**: `allow_all_downloads`
- **Allowed Operation**: `SELECT`
- **Target Roles**: `authenticated`, `anon`
- **USING Expression**: `true`

#### Policy 3: Allow All Updates
- **Policy Name**: `allow_all_updates`
- **Allowed Operation**: `UPDATE`
- **Target Roles**: `authenticated`
- **USING Expression**: `true`
- **WITH CHECK Expression**: `true`

#### Policy 4: Allow All Deletes
- **Policy Name**: `allow_all_deletes`
- **Allowed Operation**: `DELETE`
- **Target Roles**: `authenticated`
- **USING Expression**: `true`

## Step 3: Verify Storage Buckets
1. **Go to Storage > Buckets**
2. **Ensure these buckets exist:**
   - `product-files` (Private)
   - `product-images` (Public)
   - `user-avatars` (Public)
3. **If missing, create them with these settings:**
   - **product-files**: Private, 500MB limit
   - **product-images**: Public, 5MB limit, Images only
   - **user-avatars**: Public, 5MB limit, Images only

## Step 4: Test Upload
After completing the dashboard changes:
1. **Try uploading a product**
2. **Should work without RLS errors**

## Alternative: Use Supabase CLI (Advanced)
If dashboard doesn't work, you can use Supabase CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Login to your project
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run storage policy commands
supabase db reset --linked
```

## Expected Result
✅ **No more "row-level security policy" errors**  
✅ **Product uploads work immediately**  
✅ **File uploads to storage work**  
✅ **All users can upload products**

## If Still Not Working
The issue might be:
1. **Browser cache** - Clear browser cache and try again
2. **API keys** - Check if using correct Supabase keys
3. **Network issues** - Try from different network
4. **File size limits** - Ensure files are under limits

Contact me if you need help with any of these steps!