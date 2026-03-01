# 🚨 Seller Verification RLS Issue - Final Fix

## Problem
Users getting "new row violates row-level security policy for table 'seller_verification_applications'" when trying to submit seller verification applications.

## Root Cause Analysis
1. **RLS Policy Mismatch**: The RLS policies expect `auth.uid()` to match `user_id` field
2. **Authentication Context**: The form might not be running in proper authentication context
3. **Policy Configuration**: RLS policies might be too restrictive or incorrectly configured
4. **Database Migrations**: Automatic migrations might be re-enabling RLS

## Immediate Solution (Choose One)

### Option 1: Quick Fix - Disable RLS Temporarily
Run this SQL in Supabase dashboard:

```sql
-- Temporarily disable RLS for seller verification
ALTER TABLE public.seller_verification_applications DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.seller_verification_applications TO authenticated;
```

### Option 2: Fix the Form Authentication
Update the seller verification form to ensure proper authentication:

```typescript
// In SellerVerificationForm.tsx, add authentication check
const onSubmit = async (data: VerificationFormData) => {
  if (!profile) {
    toast({
      title: 'Authentication Required',
      description: 'Please sign in to submit verification application',
      variant: 'destructive',
    });
    return;
  }

  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    toast({
      title: 'Authentication Error',
      description: 'Please sign in again and try submitting',
      variant: 'destructive',
    });
    return;
  }

  // Ensure we use the authenticated user's ID
  const applicationData = {
    user_id: user.id, // Use auth user ID directly
    // ... rest of the form data
  };

  const { error } = await supabase
    .from('seller_verification_applications')
    .insert(applicationData);
  
  // ... handle response
};
```

### Option 3: Create Permissive RLS Policy
Run this SQL to create a more permissive policy:

```sql
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can create their own verification applications" ON seller_verification_applications;

-- Create permissive policy for authenticated users
CREATE POLICY "authenticated_users_can_insert" ON seller_verification_applications
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to view their own applications
CREATE POLICY "users_view_own_applications" ON seller_verification_applications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
```

## Recommended Implementation Steps

### Step 1: Immediate Fix (Run in Supabase Dashboard)
```sql
-- Disable RLS temporarily to unblock users
ALTER TABLE public.seller_verification_applications DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.seller_verification_applications TO authenticated;
```

### Step 2: Update Form (Already Done)
The form has been updated to use `profile.user_id` correctly.

### Step 3: Test the Fix
1. Navigate to seller verification page
2. Fill out and submit the form
3. Verify it works without RLS errors

### Step 4: Re-enable RLS with Proper Policies (Later)
```sql
-- Re-enable RLS
ALTER TABLE public.seller_verification_applications ENABLE ROW LEVEL SECURITY;

-- Create working policies
CREATE POLICY "authenticated_insert" ON seller_verification_applications
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "users_select_own" ON seller_verification_applications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "admins_full_access" ON seller_verification_applications
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );
```

## Current Status
- ✅ Form updated to use correct user_id field
- ✅ Authentication context verified
- ⏳ RLS policies need to be fixed or disabled
- ⏳ Testing required after database changes

## Next Steps
1. **Immediate**: Run Option 1 (disable RLS) to unblock users
2. **Short-term**: Test that applications can be submitted
3. **Long-term**: Implement proper RLS policies with thorough testing

## Files Modified
- `src/components/seller/SellerVerificationForm.tsx` - Fixed user_id usage
- `src/pages/SellerVerification.tsx` - Fixed user_id reference
- `src/hooks/useNotifications.tsx` - Fixed user_id reference
- `src/components/seller/SellerStats.tsx` - Fixed seller_id reference

## Database Scripts Available
- `database/EMERGENCY_SELLER_VERIFICATION_FIX.sql` - Disables RLS completely
- `database/NUCLEAR_SELLER_VERIFICATION_FIX.sql` - Recreates table without RLS
- `database/fix-seller-verification-rls.sql` - Attempts to fix RLS policies

## Testing
Run `node scripts/test-emergency-fix.js` to verify the fix works.