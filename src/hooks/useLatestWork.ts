import { useState, useEffect, useCallback } from 'react';
import { MediaPost, Comment, CreateComment, UpdateComment } from '../types';
import { LatestWorkService } from '../services/latestWorkService';
import { useAuth } from '../contexts/AuthContext';

interface UseLatestWorkReturn {
  posts: MediaPost[];
  loading: boolean;
  error: string | null;
  refreshPosts: () => Promise<void>;
  toggleLike: (postId: string) => Promise<void>;
  addComment: (postId: string, content: string) => Promise<void>;
  updateComment: (commentId: string, content: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  getComments: (postId: string) => Promise<Comment[]>;
  copyShareUrl: (postId: string) => Promise<boolean>;
}

export const useLatestWork = (limit?: number): UseLatestWorkReturn => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<MediaPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // If no limit is specified, get all posts
      const latestPosts = await LatestWorkService.getLatestWorkPosts(limit, user?.id);
      setPosts(latestPosts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load latest work');
      console.error('Error refreshing posts:', err);
    } finally {
      setLoading(false);
    }
  }, [limit, user?.id]);

  const toggleLike = useCallback(async (postId: string) => {
    if (!user) {
      setError('Please log in to like posts');
      return;
    }

    try {
      const result = await LatestWorkService.toggleLike(postId, user.id);
      
      // Update the post in the local state
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                like_count: result.likeCount,
                user_has_liked: result.liked 
              }
            : post
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle like');
      console.error('Error toggling like:', err);
    }
  }, [user]);

  const addComment = useCallback(async (postId: string, content: string) => {
    if (!user) {
      setError('Please log in to comment');
      return;
    }

    try {
      const commentData: CreateComment = {
        media_post_id: postId,
        content
      };
      
      await LatestWorkService.addComment(commentData, user.id);
      
      // Update comment count in local state
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                comment_count: (post.comment_count || 0) + 1
              }
            : post
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment');
      console.error('Error adding comment:', err);
    }
  }, [user]);

  const updateComment = useCallback(async (commentId: string, content: string) => {
    if (!user) {
      setError('Please log in to update comments');
      return;
    }

    try {
      const updates: UpdateComment = { content };
      await LatestWorkService.updateComment(commentId, updates, user.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update comment');
      console.error('Error updating comment:', err);
    }
  }, [user]);

  const deleteComment = useCallback(async (commentId: string) => {
    if (!user) {
      setError('Please log in to delete comments');
      return;
    }

    try {
      await LatestWorkService.deleteComment(commentId, user.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete comment');
      console.error('Error deleting comment:', err);
    }
  }, [user]);

  const getComments = useCallback(async (postId: string): Promise<Comment[]> => {
    try {
      return await LatestWorkService.getComments(postId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comments');
      console.error('Error getting comments:', err);
      return [];
    }
  }, []);

  const copyShareUrl = useCallback(async (postId: string): Promise<boolean> => {
    try {
      return await LatestWorkService.copyShareUrl(postId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to copy share URL');
      console.error('Error copying share URL:', err);
      return false;
    }
  }, []);

  // Load posts on mount and when dependencies change
  useEffect(() => {
    refreshPosts();
  }, [refreshPosts]);

  return {
    posts,
    loading,
    error,
    refreshPosts,
    toggleLike,
    addComment,
    updateComment,
    deleteComment,
    getComments,
    copyShareUrl
  };
};