# Login Error Troubleshooting Guide

## Error: "Database error granting user" (500 Internal Server Error)

This error occurs when the authentication is successful but there's an issue with the database profile creation or access.

## Quick Fix (Recommended)

### Option 1: Run SQL Script in Supabase
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `QUICK_FIX_DATABASE.sql`
4. **Important**: Replace `'f9bd45af-0ab3-4f35-b096-bdff6f69bd66'` with your actual admin user ID
5. Click "Run" to execute the script
6. Try logging in again

### Option 2: Use the Debug Interface
1. Go to `/auth-debug` in your application
2. Click "Run Health Check" to identify the issue
3. If profiles table doesn't exist, click "Create Profiles Table"
4. Click "Create Admin Profile" to fix the admin profile
5. Try logging in again

## Root Causes and Solutions

### 1. Profiles Table Doesn't Exist
**Symptoms:**
- Error mentions "relation does not exist"
- Health check shows "Profiles Table Exists: ❌"

**Solution:**
Run the `QUICK_FIX_DATABASE.sql` script or use the "Create Profiles Table" button in the debug interface.

### 2. Row Level Security (RLS) Issues
**Symptoms:**
- Error mentions "permission denied"
- Can't read or write to profiles table

**Solution:**
The SQL script includes proper RLS policies. Make sure to run the complete script.

### 3. Missing Admin Profile
**Symptoms:**
- Login succeeds but admin status is false
- Profile shows as null or with wrong role

**Solution:**
Use the "Create Admin Profile" button or run the SQL script which includes admin profile creation.

### 4. User ID Mismatch
**Symptoms:**
- Profile exists but doesn't match the authenticated user

**Solution:**
Check that the user ID in the SQL script matches your actual admin user ID from Supabase Auth.

## Step-by-Step Diagnosis

### Step 1: Check Browser Console
1. Open browser developer tools (F12)
2. Go to Console tab
3. Try to login and look for error messages
4. Look for specific database errors

### Step 2: Use Debug Interface
1. Navigate to `/auth-debug`
2. Check the status of:
   - User exists
   - Profile exists
   - Admin status
   - Environment variables

### Step 3: Run Health Check
1. In the debug interface, click "Run Health Check"
2. Review the results:
   - Profiles Table Exists
   - Can Read Profiles
   - Can Write Profiles
   - RLS Policies Active

### Step 4: Check Supabase Dashboard
1. Go to Supabase Dashboard → Authentication → Users
2. Verify the admin user exists with correct email
3. Note the user ID for the SQL script

### Step 5: Check Database Tables
1. Go to Supabase Dashboard → Table Editor
2. Check if `profiles` table exists
3. If it exists, check if admin profile is there

## Manual Database Setup

If the automated solutions don't work, you can set up the database manually:

### 1. Create the Enum Type
```sql
CREATE TYPE user_role AS ENUM ('user', 'admin');
```

### 2. Create the Profiles Table
```sql
CREATE TABLE public.profiles (
    id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name text NOT NULL,
    email text NOT NULL,
    mobile text,
    role user_role DEFAULT 'user'::user_role,
    avatar text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
```

### 3. Enable RLS and Create Policies
```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);
```

### 4. Create Admin Profile
```sql
INSERT INTO public.profiles (id, name, email, role)
VALUES (
    'YOUR_ADMIN_USER_ID_HERE',
    'Admin User',
    'admin@photography.com',
    'admin'
);
```

## Verification

After applying the fix, verify everything works:

1. **Login Test**: Try logging in with admin@photography.com
2. **Profile Check**: Go to `/auth-debug` and verify:
   - ✅ User exists: Yes
   - ✅ Profile exists: Yes
   - ✅ Is Admin: Yes
   - ✅ Profile name: "Admin User"
3. **Dashboard Access**: Try accessing `/admin` dashboard
4. **Health Check**: Run health check and ensure all items are ✅

## Prevention

To prevent this issue in the future:

1. **Database Triggers**: Consider implementing the unified auth system with triggers
2. **Error Handling**: The updated AuthContext now has better error handling
3. **Health Monitoring**: Use the health check utility regularly
4. **Backup**: Always backup your database before making changes

## Common Mistakes

1. **Wrong User ID**: Make sure to use the correct UUID from Supabase Auth
2. **Case Sensitivity**: Email must be exactly `admin@photography.com`
3. **RLS Policies**: Don't forget to enable RLS and create proper policies
4. **Enum Type**: Make sure the `user_role` enum is created before the table

## Support

If you're still experiencing issues:

1. Check the browser console for specific error messages
2. Verify your Supabase environment variables
3. Ensure your Supabase project has the correct permissions
4. Try the health check utility to get detailed diagnostics

The error should be resolved after running the SQL script and creating the proper database structure.