# Unified Authentication System

This document explains the unified authentication system that keeps Supabase's `auth.users` table in sync with your custom `profiles` table.

## Overview

The unified auth system ensures that:
- Every user in `auth.users` has a corresponding profile in `profiles`
- Profile data stays synchronized with auth user data
- Admin users are properly identified and managed
- Data consistency is maintained automatically

## Components

### 1. Database Layer (`UNIFIED_AUTH_MIGRATION.sql`)

**Triggers:**
- `on_auth_user_created`: Creates profile when user signs up
- `on_auth_user_updated`: Updates profile when auth user changes
- `on_auth_user_deleted`: Removes profile when user is deleted

**Functions:**
- `handle_new_user()`: Creates/updates profile from auth user
- `handle_user_update()`: Syncs profile with auth changes
- `handle_user_delete()`: Cleans up profile on user deletion
- `sync_user_profile(uuid)`: Manually sync specific user
- `check_auth_profile_sync()`: Check sync status

**Security:**
- Row Level Security (RLS) policies
- User can read/update own profile
- Admins can read/update all profiles

### 2. Service Layer (`src/services/profileService.ts`)

**ProfileService Methods:**
- `getProfile(userId)`: Get profile with fallback creation
- `updateProfile(userId, updates)`: Update profile safely
- `syncProfileWithAuth(userId)`: Manual sync with auth
- `fixAdminProfile()`: Fix admin profile specifically
- `checkSyncStatus()`: Check overall sync health

### 3. React Integration

**AuthContext Updates:**
- Uses ProfileService for profile management
- Automatic fallback profile creation
- Consistent admin user handling

**useProfile Hook:**
- Easy profile management in components
- Loading states and error handling
- Profile update and sync methods

**AdminUserSetup Component:**
- Admin profile creation/fixing
- Sync status checking
- Debug utilities

## Setup Instructions

### Option 1: Automated Setup (Recommended)

1. **Set Environment Variables:**
   ```bash
   # In your .env file
   VITE_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_KEY=your_service_key  # Service key, not anon key
   ```

2. **Run Setup Script:**
   ```bash
   node setup-unified-auth.js
   ```

### Option 2: Manual Setup

1. **Run Migration:**
   Execute `UNIFIED_AUTH_MIGRATION.sql` in your Supabase SQL editor

2. **Verify Setup:**
   ```sql
   SELECT * FROM check_auth_profile_sync();
   ```

3. **Fix Admin Profile:**
   Use the "Fix Admin Profile" button in the debug interface

## Usage

### In React Components

```typescript
import { useProfile } from '../hooks/useProfile';

function MyComponent() {
  const { profile, loading, error, updateProfile } = useProfile();
  
  const handleUpdate = async () => {
    const success = await updateProfile({ name: 'New Name' });
    if (success) {
      console.log('Profile updated!');
    }
  };
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <h1>Hello, {profile?.name}</h1>
      <p>Role: {profile?.role}</p>
    </div>
  );
}
```

### Direct Service Usage

```typescript
import ProfileService from '../services/profileService';

// Get profile
const { data: profile, error } = await ProfileService.getProfile(userId);

// Update profile
const { data: updated, error } = await ProfileService.updateProfile(userId, {
  name: 'New Name'
});

// Check sync status
const { data: status } = await ProfileService.checkSyncStatus();
```

## Admin User Management

### Default Admin Credentials
- **Email:** admin@photography.com
- **Password:** admin123
- **Name:** Admin User
- **Role:** admin

### Admin Profile Features
- Automatic admin role assignment
- Consistent "Admin User" name
- Dashboard access control
- Profile management permissions

## Troubleshooting

### Common Issues

1. **Profile Not Found**
   - Use "Fix Admin Profile" button
   - Check sync status
   - Run manual sync: `SELECT sync_user_profile('user-id')`

2. **Admin Access Denied**
   - Verify admin profile exists with role='admin'
   - Check email matches exactly: admin@photography.com
   - Use ProfileService.fixAdminProfile()

3. **Sync Issues**
   - Run: `SELECT * FROM check_auth_profile_sync()`
   - Look for missing_profiles or orphaned_profiles
   - Re-run migration if needed

### Debug Tools

1. **Auth Debug Page** (`/auth-debug`)
   - Shows user, profile, and admin status
   - Provides fix buttons
   - Environment variable check

2. **Admin User Setup Component**
   - Create admin user
   - Fix admin profile
   - Check sync status
   - Test admin login

3. **Database Queries**
   ```sql
   -- Check sync status
   SELECT * FROM check_auth_profile_sync();
   
   -- View admin user
   SELECT au.email, p.name, p.role 
   FROM auth.users au 
   LEFT JOIN profiles p ON au.id = p.id 
   WHERE au.email = 'admin@photography.com';
   
   -- Manual sync
   SELECT sync_user_profile('user-id-here');
   ```

## Security Considerations

1. **Row Level Security (RLS)**
   - Users can only access their own profiles
   - Admins can access all profiles
   - System functions can create profiles

2. **Role Protection**
   - Non-admin users cannot change their role
   - Admin role is protected for admin@photography.com
   - Role changes require admin privileges

3. **Data Validation**
   - Email format validation
   - Required field checks
   - Role value constraints

## Maintenance

### Regular Checks
- Monitor sync status periodically
- Verify admin user functionality
- Check for orphaned profiles

### Updates
- Keep migration script updated
- Update ProfileService as needed
- Test auth flows after changes

## Migration from Old System

If you have existing profiles that are out of sync:

1. **Backup Data:**
   ```sql
   CREATE TABLE profiles_backup AS SELECT * FROM profiles;
   ```

2. **Run Migration:**
   Execute `UNIFIED_AUTH_MIGRATION.sql`

3. **Verify Results:**
   ```sql
   SELECT * FROM check_auth_profile_sync();
   ```

4. **Fix Issues:**
   Use the provided utility functions to resolve any sync problems.

## Support

For issues with the unified auth system:

1. Check the debug interface first
2. Review console logs for errors
3. Use the provided utility functions
4. Check database trigger logs
5. Verify environment variables

The system is designed to be self-healing and should automatically maintain sync between auth users and profiles.