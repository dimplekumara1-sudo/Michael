import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { MediaPost, Like, Comment } from '../types';
import { LatestWorkService } from '../services/latestWorkService';

interface UseRealtimeLatestWorkAdminReturn {
  posts: MediaPost[];
  loading: boolean;
  error: string | null;
  refreshPosts: () => Promise<void>;
  getComments: (postId: string) => Promise<Comment[]>;
  getLikes: (postId: string) => Promise<Like[]>;
  deleteComment: (commentId: string) => Promise<boolean>;
  removeLike: (likeId: string) => Promise<boolean>;
}

export const useRealtimeLatestWorkAdmin = (): UseRealtimeLatestWorkAdminReturn => {
  const [posts, setPosts] = useState<MediaPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshPosts = useCallback(async () => {
    try {
      setError(null);
      const latestPosts = await LatestWorkService.getAllLatestWorkPostsForAdmin();
      setPosts(latestPosts);
    } catch (err) {
      console.error('Error refreshing posts:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh posts');
    }
  }, []);

  const getComments = useCallback(async (postId: string): Promise<Comment[]> => {
    try {
      return await LatestWorkService.getComments(postId);
    } catch (err) {
      console.error('Error fetching comments:', err);
      throw err;
    }
  }, []);

  const getLikes = useCallback(async (postId: string): Promise<Like[]> => {
    try {
      return await LatestWorkService.getLikesForAdmin(postId);
    } catch (err) {
      console.error('Error fetching likes:', err);
      throw err;
    }
  }, []);

  const deleteComment = useCallback(async (commentId: string): Promise<boolean> => {
    try {
      const success = await LatestWorkService.deleteCommentAsAdmin(commentId);
      if (success) {
        // Refresh posts to update comment counts
        await refreshPosts();
      }
      return success;
    } catch (err) {
      console.error('Error deleting comment:', err);
      return false;
    }
  }, [refreshPosts]);

  const removeLike = useCallback(async (likeId: string): Promise<boolean> => {
    try {
      const success = await LatestWorkService.removeLikeAsAdmin(likeId);
      if (success) {
        // Refresh posts to update like counts
        await refreshPosts();
      }
      return success;
    } catch (err) {
      console.error('Error removing like:', err);
      return false;
    }
  }, [refreshPosts]);

  // Initial load
  useEffect(() => {
    const loadInitialPosts = async () => {
      setLoading(true);
      await refreshPosts();
      setLoading(false);
    };

    loadInitialPosts();
  }, [refreshPosts]);

  // Set up real-time subscriptions
  useEffect(() => {
    // Subscribe to changes in media_posts table
    const postsSubscription = supabase
      .channel('admin_latest_work_posts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'media_posts',
          filter: 'media_type=eq.latest_work'
        },
        (payload) => {
          console.log('Admin: Posts change received:', payload);
          refreshPosts();
        }
      )
      .subscribe();

    // Subscribe to changes in post_likes table
    const likesSubscription = supabase
      .channel('admin_post_likes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_likes'
        },
        (payload) => {
          console.log('Admin: Likes change received:', payload);
          refreshPosts();
        }
      )
      .subscribe();

    // Subscribe to changes in post_comments table
    const commentsSubscription = supabase
      .channel('admin_post_comments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_comments'
        },
        (payload) => {
          console.log('Admin: Comments change received:', payload);
          refreshPosts();
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(postsSubscription);
      supabase.removeChannel(likesSubscription);
      supabase.removeChannel(commentsSubscription);
    };
  }, [refreshPosts]);

  return {
    posts,
    loading,
    error,
    refreshPosts,
    getComments,
    getLikes,
    deleteComment,
    removeLike
  };
};

export default useRealtimeLatestWorkAdmin;