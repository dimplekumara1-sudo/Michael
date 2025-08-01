# 🔐 Creating Admin User in Supabase

## Problem
Admin login fails because the admin user doesn't exist in Supabase yet.

## Solution Options

### Option 1: Create Admin User via Supabase Dashboard (RECOMMENDED)

1. **Go to Supabase Dashboard**:
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Navigate to Authentication**:
   - Click "Authentication" in the left sidebar
   - Click "Users" tab

3. **Add User Manually**:
   - Click "Add User" button
   - Fill in:
     - **Email**: `admin@photography.com`
     - **Password**: `admin123`
     - **Email Confirm**: ✅ Check this box
     - **Auto Confirm User**: ✅ Check this box
   - Click "Create User"

4. **Verify User Created**:
   - User should appear in the users list
   - Status should be "Confirmed"

### Option 2: Create via Registration Page (ALTERNATIVE)

1. **Go to Register Page**:
   - Visit: `http://localhost:5173/register`
   
2. **Try to Register Admin Email**:
   - **Email**: `admin@photography.com`
   - **Password**: `admin123`
   - **Name**: `Admin`
   - Submit form

3. **Note**: This might fail if admin email is blocked in registration

### Option 3: SQL Method (ADVANCED)

If you have database access, run this SQL in Supabase SQL Editor:

```sql
-- First create the auth user (if not exists)
-- This needs to be done via Supabase Auth, not SQL

-- Then create profile (only if user exists)
INSERT INTO profiles (id, name, email, role, created_at, updated_at)
SELECT 
  auth.uid() as id,
  'Admin' as name,
  'admin@photography.com' as email,
  'admin' as role,
  now() as created_at,
  now() as updated_at
WHERE auth.email() = 'admin@photography.com'
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  updated_at = now();
```

## Verification Steps

### Step 1: Check User Exists
1. Go to Supabase Dashboard > Authentication > Users
2. Verify `admin@photography.com` is listed
3. Status should be "Confirmed"

### Step 2: Test Login
1. Go to `http://localhost:5173/login`
2. Login with:
   - **Email**: `admin@photography.com`
   - **Password**: `admin123`
3. Check browser console for debug logs
4. Should redirect to `/admin`

### Step 3: Verify Admin Access
1. After login, go to `http://localhost:5173/debug`
2. Check:
   - ✅ User exists: Yes
   - ✅ Profile exists: Yes  
   - ✅ Is Admin: Yes
   - ✅ Email Match: Yes

## Troubleshooting

### Issue: "Invalid email or password"
**Cause**: User doesn't exist in Supabase
**Solution**: Create user via Dashboard (Option 1)

### Issue: Login successful but redirects to home
**Cause**: User exists but role is not admin
**Solution**: Check profile role, may need database migration

### Issue: "Access Denied" on admin page
**Cause**: User authenticated but admin check failing
**Solution**: 
1. Check `/debug` page for admin status
2. Verify profile.role = 'admin'

### Issue: User created but can't login
**Cause**: Email not confirmed
**Solution**: 
1. In Supabase Dashboard > Authentication > Users
2. Click on user email
3. Check "Email Confirm" checkbox
4. Save changes

## Expected Result

After creating the admin user:
1. ✅ Can login with admin@photography.com / admin123
2. ✅ Redirects to /admin dashboard
3. ✅ Shows admin interface
4. ✅ Debug page shows admin status

## Quick Test Command

After creating user, test with:
```bash
# Open browser and test these URLs:
http://localhost:5173/debug          # Check auth status
http://localhost:5173/login          # Test login
http://localhost:5173/admin          # Test admin access
```

**Most Important**: Use Option 1 (Supabase Dashboard) as it's the most reliable method!