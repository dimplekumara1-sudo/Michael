-- First, let's check if we have any latest_work posts
SELECT id, title FROM media_posts WHERE media_type = 'latest_work' AND is_active = true LIMIT 1;

-- Check if we have any users
SELECT id, email FROM auth.users LIMIT 1;

-- Check if profiles table exists and has data
SELECT * FROM profiles LIMIT 5;

-- Insert a sample comment (replace the UUIDs with actual values from above queries)
-- You'll need to replace 'POST_ID_HERE' with an actual post ID and 'USER_ID_HERE' with an actual user ID
/*
INSERT INTO post_comments (media_post_id, user_id, content)
VALUES (
  'POST_ID_HERE',  -- Replace with actual post ID
  'USER_ID_HERE',  -- Replace with actual user ID
  'This is a sample comment to test the comment functionality! 🎉 The photos look amazing!'
);
*/

-- After inserting, you can verify with:
-- SELECT pc.*, p.name, p.avatar 
-- FROM post_comments pc 
-- LEFT JOIN profiles p ON pc.user_id = p.id 
-- ORDER BY pc.created_at DESC 
-- LIMIT 5;