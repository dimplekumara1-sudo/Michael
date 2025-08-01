# Complete Auth Reintegration Setup Guide

## Overview
This guide will help you completely reintegrate your authentication system by:
1. **Dropping** the current profiles table
2. **Recreating** it with proper structure and triggers
3. **Creating** the admin user "Michael" with correct credentials
4. **Ensuring** automatic sync between auth.users and profiles

## Step-by-Step Setup

### Step 1: Run the Database Migration (Required)

1. **Go to Supabase Dashboard**
   - Navigate to your Supabase project
   - Go to **SQL Editor**

2. **Execute the Migration Script**
   - Copy the entire contents of `COMPLETE_AUTH_REINTEGRATION.sql`
   - Paste it into the SQL Editor
   - Click **"Run"** to execute

3. **Verify Success**
   - Look for success messages in the output
   - Should see: "SUCCESS: Auth reintegration completed!"
   - Check that profiles table is recreated with triggers

### Step 2: Create Michael Admin User

**Option A: Using Node.js Script (Recommended)**
```bash
# Set environment variables
export VITE_SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SERVICE_KEY=your-service-key-here

# Run the script
node create-michael-admin.js
```

**Option B: Manual Creation in Supabase Dashboard**
1. Go to **Authentication → Users**
2. Click **"Add User"**
3. Fill in:
   - **Email**: admin@photography.com
   - **Password**: admin123
   - **Confirm Password**: admin123
   - **Auto Confirm User**: ✅ (checked)
4. Click **"Create User"**
5. The profile will be automatically created by triggers

### Step 3: Verify the Setup

1. **Check Database Tables**
   - Go to **Table Editor → profiles**
   - Should see admin user with:
     - Name: "Michael"
     - Email: "admin@photography.com"
     - Role: "admin"

2. **Test Login**
   - Go to your application login page
   - Use credentials:
     - Email: admin@photography.com
     - Password: admin123
   - Should login successfully

3. **Verify Profile Display**
   - After login, profile should show "Michael" as the name
   - Admin dashboard should be accessible

## What the New System Does

### Automatic Profile Creation
- **Trigger**: `on_auth_user_created` automatically creates profile when user registers
- **Admin Detection**: Automatically sets name to "Michael" for admin@photography.com
- **Role Assignment**: Automatically assigns "admin" role to admin@photography.com

### Automatic Profile Updates
- **Trigger**: `on_auth_user_updated` keeps profile in sync with auth changes
- **Name Preservation**: Admin name "Michael" is preserved during updates
- **Email Sync**: Profile email stays in sync with auth email

### Automatic Profile Cleanup
- **Trigger**: `on_auth_user_deleted` removes profile when user is deleted
- **Data Integrity**: Prevents orphaned profiles

### Utility Functions
- **`sync_user_profile(uuid)`**: Manually sync specific user
- **`check_auth_profile_sync()`**: Check overall sync health

## Expected Results

### Before Reintegration:
- ❌ Login fails with "Database error granting user"
- ❌ Profile missing or incorrect
- ❌ Manual profile management required

### After Reintegration:
- ✅ Login works automatically
- ✅ Profile shows "Michael" for admin user
- ✅ Admin role assigned correctly
- ✅ All future users get profiles automatically
- ✅ No manual profile management needed

## Admin User Details

After setup, you'll have:
- **Name**: Michael
- **Email**: admin@photography.com
- **Password**: admin123
- **Role**: admin
- **Profile**: Automatically created and maintained

## Troubleshooting

### Issue 1: SQL Script Fails
**Solution**: Check that you have proper permissions and the database is accessible

### Issue 2: Admin User Creation Fails
**Possible Causes**:
- User already exists (check Authentication → Users)
- Invalid service key
- Network connectivity issues

**Solution**: Use the debug interface or create manually in Supabase Dashboard

### Issue 3: Profile Not Created
**Possible Causes**:
- Triggers not installed properly
- RLS policies blocking creation

**Solution**: 
- Re-run the SQL migration script
- Check trigger installation with: `SELECT * FROM information_schema.triggers WHERE trigger_name LIKE 'on_auth_user%';`

### Issue 4: Login Still Fails
**Debugging Steps**:
1. Check browser console for specific errors
2. Verify user exists in Authentication → Users
3. Verify profile exists in Table Editor → profiles
4. Use the debug interface to test direct login

## Maintenance

### Regular Checks
- Monitor sync status: `SELECT * FROM check_auth_profile_sync();`
- Verify admin profile: `SELECT * FROM profiles WHERE email = 'admin@photography.com';`

### Future User Registration
- New users will automatically get profiles via triggers
- No manual intervention required
- Admin users (admin@photography.com) will always get name "Michael"

## Migration from Old System

If you have existing data:
1. **Backup**: The script drops the old profiles table, so existing data will be lost
2. **Migration**: All existing auth.users will get new profiles created automatically
3. **Verification**: Check that all users have corresponding profiles after migration

## Support

If you encounter issues:
1. Check the SQL script output for error messages
2. Use the debug interface for detailed diagnostics
3. Verify environment variables are set correctly
4. Ensure Supabase project has proper permissions

The new system is designed to be completely automatic and maintenance-free once set up properly.