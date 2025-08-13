import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { MediaPost } from '../types';
import { useLatestWork } from './useLatestWork';

interface UseRealtimeLatestWorkReturn {
  posts: MediaPost[];
  loading: boolean;
  error: string | null;
  refreshPosts: () => Promise<void>;
  toggleLike: (postId: string) => Promise<void>;
  addComment: (postId: string, content: string) => Promise<void>;
  updateComment: (commentId: string, content: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  getComments: (postId: string) => Promise<any[]>;
  copyShareUrl: (postId: string) => Promise<boolean>;
}

export const useRealtimeLatestWork = (limit?: number): UseRealtimeLatestWorkReturn => {
  const baseHook = useLatestWork(limit);
  const [realtimeError, setRealtimeError] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to changes in media_posts table
    const postsSubscription = supabase
      .channel('latest_work_posts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'media_posts',
          filter: 'media_type=eq.latest_work'
        },
        (payload) => {
          console.log('Posts change received:', payload);
          // Refresh posts when there's a change
          baseHook.refreshPosts();
        }
      )
      .subscribe();

    // Subscribe to changes in post_likes table
    const likesSubscription = supabase
      .channel('post_likes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_likes'
        },
        (payload) => {
          console.log('Likes change received:', payload);
          // Refresh posts to update like counts
          baseHook.refreshPosts();
        }
      )
      .subscribe();

    // Subscribe to changes in post_comments table
    const commentsSubscription = supabase
      .channel('post_comments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_comments'
        },
        (payload) => {
          console.log('Comments change received:', payload);
          // Refresh posts to update comment counts
          baseHook.refreshPosts();
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(postsSubscription);
      supabase.removeChannel(likesSubscription);
      supabase.removeChannel(commentsSubscription);
    };
  }, [baseHook.refreshPosts]);

  return {
    ...baseHook,
    error: baseHook.error || realtimeError
  };
};

export default useRealtimeLatestWork;