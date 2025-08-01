# Quick Setup Guide - Michael Photography Supabase Integration

## 🚀 Step-by-Step Setup

### 1. Run the Database Migration
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor** in the left sidebar
4. Copy the entire content of `supabase_migration.sql`
5. Paste it in the SQL Editor and click **Run**

### 2. Create the Admin User
1. **IMPORTANT**: Create the admin user first through the authentication system
2. In your Supabase dashboard, go to **Authentication** > **Users**
3. Click **Add User** manually, or use the signup flow:
   - Email: `admin@photography.com`
   - Password: `admin123`
   - Confirm Email: ✅ (mark as confirmed)

### 3. Test the Application
Now you can test both user types:

#### Admin Login:
- Email: `admin@photography.com`
- Password: `admin123`
- Redirects to: `/admin` (Admin Dashboard)

#### New User Registration:
- Any other email address
- Creates regular user account
- Redirects to: `/dashboard` (User Dashboard)

### 4. Start the Development Server
```bash
npm run dev
```

## 🔐 Authentication Flow

### Admin User:
- **Email**: `admin@photography.com`
- **Password**: `admin123`
- **Role**: `admin` (automatic)
- **Access**: Full admin dashboard, manage all bookings, media posts, etc.

### Regular Users:
- **Registration**: Any email except admin email
- **Role**: `user` (automatic)
- **Access**: Personal dashboard, own bookings only

## 📊 Database Features

### Row Level Security (RLS):
- ✅ Users can only see their own data
- ✅ Admins can see all data
- ✅ Public media posts for portfolio
- ✅ Private galleries per booking

### Automatic Features:
- ✅ User profiles created on signup
- ✅ Admin role assigned to admin@photography.com
- ✅ Timestamps automatically managed
- ✅ UUIDs generated automatically

## 🛠️ Available API Functions

The `src/lib/supabase.ts` file provides helper functions:

```typescript
// Authentication
auth.signIn(email, password)
auth.signUp(email, password, userData)
auth.signOut()

// Database operations
db.getProfile(userId)
db.getUserBookings(userId)
db.createBooking(bookingData)
db.getMediaPosts()
db.createContactMessage(messageData)
// ... and many more
```

## ✅ Verification Steps

After setup, verify:

1. **Database Migration**: Check tables exist in Supabase dashboard
2. **Admin User**: Can login with admin@photography.com
3. **User Registration**: New users can register and get 'user' role
4. **RLS Policies**: Users can only see their own bookings
5. **Role-based Navigation**: Admin goes to /admin, users go to /dashboard

## 🚨 Troubleshooting

### Common Issues:

1. **"relation does not exist" error**:
   - Make sure you ran the entire migration SQL script
   - Check if all tables were created in Supabase dashboard

2. **"row-level security policy violation" error**:
   - Ensure user is properly authenticated
   - Check if user profile was created correctly

3. **Admin user not working**:
   - Make sure to create admin@photography.com in Supabase Auth first
   - The trigger will automatically assign admin role

4. **Environment variables not working**:
   - Check `.env.local` file exists with correct credentials
   - Restart the development server after adding .env.local

### Debug Steps:

1. Check Supabase logs in dashboard
2. Open browser developer tools for console errors
3. Verify user session in AuthContext
4. Check if profile is loaded correctly

## 🎯 Next Steps

Once everything is working:
1. Customize the UI/UX
2. Add file upload for photos
3. Implement email notifications
4. Add payment integration
5. Deploy to production

Your Michael Photography app is now ready with full authentication and database integration! 🎉