import { supabase } from '../lib/supabase';
import { LatestWorkService } from '../services/latestWorkService';

// Function to add a sample comment for testing
export const addSampleComment = async () => {
  try {
    console.log('🔍 Starting sample comment test...');

    // First, get a media post to comment on
    const { data: posts, error: postsError } = await supabase
      .from('media_posts')
      .select('id, title')
      .eq('media_type', 'latest_work')
      .eq('is_active', true)
      .limit(1);

    if (postsError) {
      console.error('❌ Error fetching posts:', postsError);
      return;
    }

    if (!posts || posts.length === 0) {
      console.log('⚠️ No posts found to comment on');
      return;
    }

    const post = posts[0];
    console.log('✅ Found post to comment on:', post.title, 'ID:', post.id);

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ User not authenticated:', userError);
      return;
    }

    console.log('✅ Current user:', user.email, 'ID:', user.id);

    // Check if user has a profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.log('⚠️ No profile found, creating one...');
      // Create a profile for the user
      const { data: newProfile, error: createProfileError } = await supabase
        .from('profiles')
        .insert([{
          id: user.id,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'Anonymous User',
          avatar: user.user_metadata?.avatar || null
        }])
        .select('*')
        .single();

      if (createProfileError) {
        console.error('❌ Error creating profile:', createProfileError);
        return;
      }
      console.log('✅ Profile created:', newProfile);
    } else {
      console.log('✅ User profile found:', profile);
    }

    // Add a sample comment using the service
    console.log('📝 Adding comment using LatestWorkService...');
    const comment = await LatestWorkService.addComment({
      media_post_id: post.id,
      content: `This is a sample comment to test the comment functionality! 🎉 Added at ${new Date().toLocaleTimeString()}`
    }, user.id);

    if (!comment) {
      console.error('❌ Failed to add comment');
      return;
    }

    console.log('✅ Sample comment added successfully:', comment);

    // Now fetch all comments for this post using the service
    console.log('📖 Fetching all comments using LatestWorkService...');
    const allComments = await LatestWorkService.getComments(post.id);
    console.log('✅ All comments for this post:', allComments);

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
};

// Function to check if profiles table exists and has data
export const checkProfilesTable = async () => {
  try {
    console.log('🔍 Checking profiles table...');
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);

    if (error) {
      console.error('❌ Error checking profiles table:', error);
      return;
    }

    console.log('✅ Profiles table data:', data);
    
    // Also check current user's profile
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: userProfile, error: userProfileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (userProfileError) {
        console.log('⚠️ Current user has no profile');
      } else {
        console.log('✅ Current user profile:', userProfile);
      }
    }
  } catch (error) {
    console.error('💥 Unexpected error checking profiles:', error);
  }
};

// Function to test the complete comment flow
export const testCommentFlow = async () => {
  console.log('🚀 Starting complete comment flow test...');
  
  await checkProfilesTable();
  await addSampleComment();
  
  console.log('✅ Comment flow test completed!');
};