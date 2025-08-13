# Supabase Setup Guide for Micheal photographs

This guide will help you set up Supabase for your photography business application.

## Prerequisites

- A Supabase account (https://supabase.com)
- Your Supabase project credentials

## Step 1: Install Supabase Dependencies

Run the following command to install the required packages:

```bash
npm install @supabase/supabase-js
```

## Step 2: Run the Database Migration

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase_migration.sql` 
4. Paste it into the SQL Editor and click **Run**

This will create:
- ✅ Custom user profiles table linked to Supabase auth
- ✅ Bookings table for event management
- ✅ Media posts table for portfolio
- ✅ Galleries table for client photo collections
- ✅ Contact messages table
- ✅ Row Level Security (RLS) policies
- ✅ Indexes for performance
- ✅ Automatic triggers for user creation and timestamps

## Step 3: Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your Supabase credentials in `.env.local`:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

   You can find these in your Supabase project settings under **API**.

## Step 4: Update Your Application Code

### AuthContext Integration

Update your `src/contexts/AuthContext.tsx` to use Supabase:

```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { auth, db } from '../lib/supabase';
import { Database } from '../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, name: string) => Promise<any>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    const { data, error } = await db.getProfile(userId);
    if (data) setProfile(data);
  };

  const signIn = async (email: string, password: string) => {
    const result = await auth.signIn(email, password);
    return result;
  };

  const signUp = async (email: string, password: string, name: string) => {
    const result = await auth.signUp(email, password, { name });
    return result;
  };

  const signOut = async () => {
    await auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      signIn,
      signUp,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

## Step 5: Database Security

The migration includes these security features:

### Row Level Security (RLS) Policies:

1. **Profiles**: Users can only view/edit their own profile; admins can view all
2. **Bookings**: Users can manage their own bookings; admins can manage all
3. **Media Posts**: Public read access; admin-only write access
4. **Galleries**: Users can view their own and public galleries; admin-only management
5. **Contact Messages**: Anyone can create; admin-only viewing

### Automatic Features:

- ✅ User profiles are automatically created when users sign up
- ✅ Timestamps are automatically updated
- ✅ UUIDs are automatically generated
- ✅ Data validation through database constraints

## Step 6: Usage Examples

### Creating a Booking:
```typescript
import { db } from '../lib/supabase';

const createBooking = async (bookingData) => {
  const { data, error } = await db.createBooking({
    user_id: user.id,
    event_date: '2024-06-15',
    location: 'Central Park',
    event_type: 'Wedding',
    notes: 'Beach ceremony at sunset'
  });
};
```

### Fetching User Bookings:
```typescript
const { data: bookings, error } = await db.getUserBookings(user.id);
```

### Creating Contact Message:
```typescript
const { data, error } = await db.createContactMessage({
  name: 'John Doe',
  email: 'john@example.com',
  message: 'Interested in wedding photography'
});
```

## Step 7: Admin Dashboard Integration

For admin features, check the user's role:

```typescript
const isAdmin = profile?.role === 'admin';

if (isAdmin) {
  // Show admin features
  const { data: allBookings } = await db.getAllBookings();
  const { data: contactMessages } = await db.getContactMessages();
}
```

## Step 8: File Storage (Optional)

For photo uploads, you can use Supabase Storage:

1. Create a storage bucket in your Supabase dashboard
2. Set up upload policies
3. Use the Supabase client to upload files

## Troubleshooting

### Common Issues:

1. **RLS Policy Errors**: Make sure users are authenticated and have proper roles
2. **Missing Environment Variables**: Double-check your `.env.local` file
3. **Migration Errors**: Ensure you're running the SQL as a superuser in Supabase

### Testing RLS Policies:

You can test policies in the Supabase SQL editor:
```sql
-- Test as a specific user
SELECT auth.uid(); -- Should return the user's ID
SELECT * FROM profiles; -- Should only return the user's profile
```

## Next Steps

1. ✅ Run the migration
2. ✅ Set up environment variables  
3. ✅ Update your AuthContext
4. ✅ Test user registration and login
5. ✅ Implement booking creation
6. ✅ Test admin functionality
7. ✅ Set up file storage for photos (optional)

Your Micheal photographs app is now ready with a fully secure, scalable Supabase backend!