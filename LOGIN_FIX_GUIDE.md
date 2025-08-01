# 🔧 Login Issue Fix Guide

## 🚨 Problem
- Login fails with "Database error granting user"
- Shows "Invalid email or password" even with correct credentials
- 500 server error during authentication

## 🎯 Root Cause
The issue is likely caused by:
1. **RLS (Row Level Security) policy conflicts**
2. **Missing database permissions**
3. **Incorrect foreign key constraints**
4. **Missing or corrupted database objects**

## 🛠️ Step-by-Step Fix

### Step 1: Run Database Fix Script
1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Copy and paste the entire contents of `FIX_LOGIN_ISSUES.sql`
4. Click **Run** to execute the script

### Step 2: Verify Database Setup
After running the script, check that these were created:
- ✅ `bookings` table with proper structure
- ✅ `user_profiles` view
- ✅ `get_user_display_name()` function
- ✅ `test_user_permissions()` function
- ✅ Proper RLS policies

### Step 3: Test Database Access
1. Add the `DatabaseDiagnostic` component to a page temporarily:
```tsx
import DatabaseDiagnostic from '../components/DatabaseDiagnostic';

// Add to your component
<DatabaseDiagnostic />
```

2. Run the diagnostic to check for issues
3. All tests should pass ✅

### Step 4: Test Login
1. Try logging in with a valid account
2. Check browser console for detailed error messages
3. If still failing, check the diagnostic results

## 🔍 Common Issues & Solutions

### Issue 1: "relation does not exist"
**Solution**: Run the database fix script to create missing tables/views

### Issue 2: "permission denied for table"
**Solution**: The script grants proper permissions to `authenticated` role

### Issue 3: "RLS policy violation"
**Solution**: The script recreates RLS policies with correct logic

### Issue 4: "foreign key constraint fails"
**Solution**: The script fixes foreign key relationships

## 🧪 Testing Your Fix

### Test 1: Database Diagnostic
```bash
# Use the DatabaseDiagnostic component
# All tests should show ✅
```

### Test 2: Manual Login Test
```bash
# Try logging in with:
# - Valid credentials (should work)
# - Invalid credentials (should show "Invalid login credentials")
```

### Test 3: Console Check
```bash
# Open browser console during login
# Should see:
# ✅ "Authentication successful"
# ✅ "Database access confirmed"
# ✅ "Profile loaded from user metadata"
```

## 📋 Verification Checklist

After applying the fix, verify:

- [ ] Database fix script ran without errors
- [ ] `bookings` table exists and is accessible
- [ ] `user_profiles` view returns data
- [ ] RLS policies allow proper access
- [ ] Login with valid credentials works
- [ ] Login with invalid credentials shows proper error
- [ ] User profile data loads correctly
- [ ] Admin dashboard can access booking data

## 🔧 Manual Verification Queries

Run these in Supabase SQL Editor to verify:

```sql
-- Check if bookings table exists
SELECT COUNT(*) FROM bookings;

-- Check if user_profiles view works
SELECT COUNT(*) FROM user_profiles;

-- Test the function
SELECT test_user_permissions();

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'bookings';
```

## 🚨 If Still Not Working

### Check Supabase Project Settings
1. **Authentication** → **Settings**
   - Ensure "Enable email confirmations" matches your setup
   - Check if "Enable custom SMTP" is configured correctly

2. **Database** → **Settings**
   - Verify connection pooling settings
   - Check if there are any connection limits

### Check Environment Variables
Verify your `.env.local` file has:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Check Network/CORS Issues
- Try from different network
- Check browser network tab for 500 errors
- Verify CORS settings in Supabase

## 📞 Emergency Fallback

If the issue persists, you can temporarily disable RLS:

```sql
-- TEMPORARY FIX - NOT RECOMMENDED FOR PRODUCTION
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
```

**⚠️ Remember to re-enable RLS after fixing the root cause!**

## ✅ Success Indicators

You'll know the fix worked when:
- ✅ Login succeeds without 500 errors
- ✅ Console shows "Authentication successful"
- ✅ Console shows "Database access confirmed"
- ✅ User profile loads immediately
- ✅ Dashboard access works
- ✅ No "Database error granting user" messages

## 📝 Prevention

To prevent this issue in the future:
1. Always test database changes in development first
2. Keep RLS policies simple and well-documented
3. Use the diagnostic tool after any database changes
4. Maintain proper foreign key relationships
5. Regular database health checks