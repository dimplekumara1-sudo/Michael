# Multi-Image Posts Feature

This feature enables administrators to create posts with up to 3 images that display as an interactive slider on the frontend.

## 🚀 Features

### Admin Interface
- **Multiple Image Upload**: Upload up to 3 images per post via file upload
- **Multiple URL Input**: Enter up to 3 image URLs manually with validation
- **Thumbnail Support**: Optional thumbnails for each image (auto-generated or custom)
- **Live Preview**: See image previews as you add them
- **Validation**: URL format validation and error handling
- **Backward Compatibility**: Existing single-image posts continue to work

### Frontend Display
- **Interactive Slider**: Smooth transitions between images
- **Auto-slide**: Configurable auto-advance with pause on hover
- **Navigation Controls**: 
  - Dot indicators for direct navigation
  - Left/right arrow buttons
  - Keyboard support (arrow keys, spacebar)
  - Touch/swipe support for mobile
- **Progress Indicator**: Visual progress bar for auto-slide
- **Image Counter**: Shows current image position (e.g., "2/3")
- **Responsive Design**: Works on all screen sizes

## 📊 Database Schema

### New Columns Added to `media_posts`
```sql
-- Array of image URLs (up to 3)
media_urls TEXT[] DEFAULT NULL

-- Array of thumbnail URLs (up to 3) 
thumbnails TEXT[] DEFAULT NULL
```

### Constraints
- Maximum 3 images per post
- Arrays cannot be empty when provided
- Backward compatibility with existing `media_url` and `thumbnail` columns

## 🛠️ Implementation Details

### Components
1. **MultiImageSlider** (`src/components/MultiImageSlider.tsx`)
   - Main slider component with all interactive features
   - Handles single images gracefully (no slider UI)
   - Configurable auto-slide, navigation, and styling

2. **LatestWorkManager** (`src/components/admin/LatestWorkManager.tsx`)
   - Updated admin interface for multi-image management
   - File upload and URL input support
   - Form validation and preview

3. **LatestWork** (`src/components/LatestWork.tsx`)
   - Updated to use MultiImageSlider for posts with multiple images
   - Maintains single-image display for legacy posts

### Services
- **LatestWorkService** updated to handle array fields
- Helper functions for primary image/thumbnail extraction
- Computed fields for frontend compatibility

### Types
- Updated `MediaPost`, `CreateMediaPost`, and `UpdateMediaPost` interfaces
- Added support for `media_urls[]` and `thumbnails[]` arrays
- Helper fields: `primary_media_url`, `primary_thumbnail`, `image_count`

## 📋 Usage Instructions

### For Administrators

#### Creating Multi-Image Posts
1. Go to Admin → Latest Work Manager
2. Click "Add" to create a new post
3. Choose one of these methods:

**Method 1: File Upload**
- Use "Multiple Images (Up to 3)" section
- Click to select multiple image files
- Images will be uploaded to Supabase storage

**Method 2: URL Input**
- Use "Multiple Image URLs (Up to 3)" section
- Enter image URLs in the provided fields
- Click "Add URL" to add more fields (up to 3)
- URLs are validated in real-time

**Method 3: Mixed Approach**
- Upload some images and enter some URLs
- System will combine them (up to 3 total)

#### Adding Thumbnails (Optional)
- For uploaded images: Use "Upload Thumbnail Files"
- For URL images: Enter thumbnail URLs in corresponding fields
- Thumbnails improve loading performance

#### Form Features
- **Live Preview**: See thumbnails of added images
- **Validation**: Invalid URLs are highlighted in red
- **Summary**: Review your post configuration before saving
- **Remove Images**: Click the × button on any image to remove it

### For Developers

#### Testing the Feature
1. Run the database migration:
   ```bash
   node run-multi-image-migration.js
   ```

2. Test the slider component:
   ```tsx
   import MultiImageTest from './components/MultiImageTest';
   // Add to your routing for testing
   ```

3. Verify admin functionality:
   - Create posts with 1, 2, and 3 images
   - Test file upload and URL input
   - Check form validation

#### Customizing the Slider
```tsx
<MultiImageSlider
  images={post.media_urls}
  thumbnails={post.thumbnails}
  title={post.title}
  autoSlide={true}              // Enable auto-advance
  autoSlideInterval={5000}      // 5 seconds between slides
  showDots={true}               // Show dot navigation
  showArrows={true}             // Show arrow buttons
  className="h-64"              // Custom styling
  onImageChange={(index) => {}} // Callback for image changes
/>
```

## 🔄 Migration Process

### Automatic Migration
The migration script automatically:
1. Adds new array columns to `media_posts` table
2. Converts existing single images to array format
3. Adds database constraints and indexes
4. Creates helper functions for compatibility

### Manual Steps Required
1. Run the migration script
2. Test the admin interface
3. Verify frontend display
4. Update any custom queries that use `media_url` directly

## 🐛 Troubleshooting

### Common Issues

**Images not displaying in slider:**
- Check that `media_urls` array is properly populated
- Verify image URLs are accessible
- Check browser console for loading errors

**Admin form not saving:**
- Ensure at least one image URL or file is provided
- Check for URL validation errors
- Verify Supabase storage permissions

**Slider not working on mobile:**
- Ensure touch events are enabled
- Check for CSS conflicts with touch-action
- Test swipe gestures in different browsers

### Debug Information
- Check browser console for JavaScript errors
- Verify database schema with: `\d media_posts` in psql
- Test API responses in Network tab

## 🔮 Future Enhancements

### Planned Features
- **Image Reordering**: Drag-and-drop to reorder images
- **Bulk Upload**: Upload multiple posts at once
- **Image Editing**: Basic crop/resize functionality
- **Video Support**: Mixed image/video sliders
- **Advanced Transitions**: More slide transition effects

### Performance Optimizations
- **Lazy Loading**: Load images as needed
- **Image Optimization**: Automatic resizing and compression
- **CDN Integration**: Serve images from CDN
- **Preloading**: Smart preloading of next images

## 📞 Support

For issues or questions:
1. Check this README first
2. Review the test component (`MultiImageTest.tsx`)
3. Check browser console for errors
4. Verify database migration completed successfully

## 🎯 Best Practices

### For Content Creators
- Use high-quality images (minimum 800px width)
- Keep file sizes reasonable (< 2MB per image)
- Provide descriptive titles and captions
- Use thumbnails for faster loading
- Test on mobile devices

### For Developers
- Always validate user input
- Handle loading states gracefully
- Provide fallbacks for failed image loads
- Test with various image sizes and formats
- Consider accessibility (alt text, keyboard navigation)

---

**Version**: 1.0.0  
**Last Updated**: December 2024  
**Compatibility**: React 18+, Supabase, TypeScript