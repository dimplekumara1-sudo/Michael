# Latest Work Feature Setup Guide

This guide will help you set up the new "Latest Work" feature that allows dynamic display of recent projects with user interactions (likes, comments, sharing).

## 🚀 Features Implemented

### Frontend Features
- ✅ Dynamic Latest Work section on homepage
- ✅ Like/Unlike functionality (one per user per post)
- ✅ Comment system with real-time display
- ✅ Share functionality (copy link to clipboard)
- ✅ YouTube video support
- ✅ Location display
- ✅ Authentication gates (login prompts)
- ✅ Skeleton loading states
- ✅ Responsive design
- ✅ Admin dashboard management
- ✅ Dedicated gallery page (/latest-work)
- ✅ Search and filtering functionality
- ✅ Grid/List view toggle
- ✅ Pagination with navigation
- ✅ Toast notifications for user feedback
- ✅ Real-time updates via Supabase subscriptions

### Backend Features
- ✅ Database tables for posts, likes, and comments
- ✅ Row Level Security (RLS) policies
- ✅ Media storage integration
- ✅ RESTful API services
- ✅ Real-time data updates
- ✅ Search API with filtering
- ✅ Pagination support
- ✅ Direct post linking

## 📋 Setup Instructions

### Step 1: Database Setup

1. **Run the SQL script** in your Supabase SQL editor:
   ```bash
   # Navigate to the database folder and copy the contents of:
   database/latest_work_setup.sql
   ```

2. **Execute the script** in Supabase Dashboard → SQL Editor → New Query
   - This will create all necessary tables, indexes, and policies
   - Sets up RLS (Row Level Security)
   - Creates storage bucket for media files
   - Adds sample data (optional)

### Step 2: Storage Configuration

The setup script automatically creates a `media` storage bucket. Verify in Supabase Dashboard:
- Go to Storage → Buckets
- Ensure `media` bucket exists and is public
- Storage policies are automatically configured

### Step 3: Admin Access

1. **Access Admin Dashboard**:
   - Log in as admin user
   - Navigate to `/admin-dashboard`
   - Click on "Latest Work" tab

2. **Create Your First Post**:
   - Click "Add New Post"
   - Fill in title, caption, location
   - Upload media file OR add YouTube URL
   - Set as active
   - Save

### Step 4: Test User Interactions

1. **Test as Regular User**:
   - Log out of admin account
   - Visit homepage
   - Try to like/comment (should show login prompt)
   - Register/login and test interactions

2. **Test Sharing**:
   - Click share button (works without login)
   - URL should be copied to clipboard

## 🎯 Usage Guide

### For Admins

#### Adding New Posts
1. Go to Admin Dashboard → Latest Work
2. Click "Add New Post"
3. Fill in required fields:
   - **Title**: Post title
   - **Caption**: Description/story
   - **Location**: Where the photo/video was taken
   - **Media**: Upload file OR add YouTube URL
   - **Thumbnail**: Optional custom thumbnail
   - **Active**: Whether post is visible to users

#### Managing Posts
- **Edit**: Click edit icon to modify post
- **Toggle Active**: Eye icon to show/hide post
- **Delete**: Trash icon to permanently remove
- **View Stats**: See like and comment counts

#### Media Options
- **Images**: Upload JPG, PNG, WebP files
- **Videos**: Upload MP4 files or use YouTube URLs
- **YouTube**: Paste full YouTube URL (auto-converts to embed)
- **Thumbnails**: Auto-generated or custom upload

### For Users

#### Viewing Latest Work
- Latest work appears on homepage
- Shows 6 most recent posts by default
- "View All Work" button links to gallery

#### Interactions
- **Like**: Heart icon (requires login)
- **Comment**: Message icon (requires login)
- **Share**: Share icon (works without login)
- **Location**: Map pin shows where photo was taken

#### Comments
- Click comment icon to open modal
- View all comments with user avatars
- Add new comments (requires login)
- Real-time comment display

## 🔧 Technical Details

### Database Schema

#### Tables Created
- `media_posts` (extended with new columns)
  - `location` (TEXT): Photo/video location
  - `youtube_url` (TEXT): YouTube video URL

- `post_likes` (new)
  - `user_id`, `media_post_id`, `created_at`
  - Unique constraint prevents duplicate likes

- `post_comments` (new)
  - `user_id`, `media_post_id`, `content`, `created_at`, `updated_at`

#### Storage
- `media` bucket for uploaded files
- Public read access
- Authenticated write access

### API Services

#### LatestWorkService
- `getLatestWorkPosts()`: Fetch posts with stats
- `createLatestWorkPost()`: Add new post
- `updateLatestWorkPost()`: Edit existing post
- `deleteLatestWorkPost()`: Remove post
- `toggleLike()`: Like/unlike post
- `addComment()`: Add comment
- `getComments()`: Fetch post comments

### Components

#### Frontend Components
- `LatestWork`: Main display component
- `LatestWorkManager`: Admin management interface
- `LoginPrompt`: Authentication gate
- `SkeletonLoader`: Loading states

#### Hooks
- `useLatestWork`: Data management and interactions
- `useAuth`: Authentication context

## 🎨 Customization

### Styling
- Uses Tailwind CSS classes
- Responsive design (mobile-first)
- Consistent with existing design system
- Dark/light mode compatible

### Configuration
- Adjust `limit` prop to show more/fewer posts
- Modify `showViewAll` to hide/show "View All" button
- Customize skeleton loader appearance
- Update color schemes in component files

## 🔒 Security Features

### Authentication
- Login required for likes and comments
- Share functionality works without login
- Admin-only access to management interface

### Data Protection
- Row Level Security (RLS) on all tables
- Users can only modify their own likes/comments
- Admins have full access to all content
- SQL injection protection via Supabase

### File Upload Security
- Authenticated uploads only
- File type validation
- Automatic file naming (prevents conflicts)
- Public read access for display

## 🚨 Troubleshooting

### Common Issues

1. **Posts not showing**:
   - Check if posts are marked as `is_active = true`
   - Verify `media_type = 'latest_work'`
   - Check browser console for errors

2. **Upload failures**:
   - Ensure storage bucket exists and is public
   - Check file size limits
   - Verify authentication

3. **Like/Comment not working**:
   - Check if user is logged in
   - Verify RLS policies are active
   - Check network requests in browser dev tools

4. **YouTube videos not displaying**:
   - Ensure URL is valid YouTube link
   - Check if video is public/embeddable
   - Verify iframe permissions

### Debug Steps
1. Check browser console for JavaScript errors
2. Verify Supabase connection in Network tab
3. Test database queries in Supabase SQL editor
4. Check authentication state in React DevTools

## 📈 Future Enhancements

### Planned Features
- [ ] Pagination for older posts
- [ ] Real-time notifications for new likes/comments
- [ ] Image optimization and lazy loading
- [ ] Advanced filtering (by location, date, type)
- [ ] Social media sharing integration
- [ ] Comment replies/threading
- [ ] Post analytics dashboard

### Performance Optimizations
- [ ] Image CDN integration
- [ ] Caching strategies
- [ ] Infinite scroll loading
- [ ] Search functionality
- [ ] SEO optimization

## 📞 Support

If you encounter any issues:
1. Check this setup guide first
2. Review the troubleshooting section
3. Check browser console for errors
4. Verify database setup in Supabase
5. Test with sample data first

The Latest Work feature is now fully integrated and ready for use! 🎉