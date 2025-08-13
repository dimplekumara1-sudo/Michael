import { supabase } from '../lib/supabase';
import { MediaPost, CreateMediaPost, UpdateMediaPost, Like, Comment, CreateComment, UpdateComment } from '../types';

export class LatestWorkService {
  // Get latest work posts with like and comment counts (public - only active posts)
  static async getLatestWorkPosts(limit?: number, userId?: string, offset?: number): Promise<MediaPost[]> {
    try {
      let query = supabase
        .from('media_posts')
        .select(`
          *,
          likes:post_likes(count),
          comments:post_comments(count)
        `)
        .eq('media_type', 'latest_work')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      if (offset) {
        query = query.range(offset, offset + (limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching latest work posts:', error);
        throw error;
      }

      // Process the data to include computed fields
      const processedData = await Promise.all((data || []).map(async (post) => {
        const likeCount = Array.isArray(post.likes) ? post.likes.length : (post.likes?.count || 0);
        const commentCount = Array.isArray(post.comments) ? post.comments.length : (post.comments?.count || 0);
        
        let userHasLiked = false;
        if (userId) {
          const { data: userLike } = await supabase
            .from('post_likes')
            .select('id')
            .eq('media_post_id', post.id)
            .eq('user_id', userId)
            .single();
          userHasLiked = !!userLike;
        }

        // Helper function to get primary media URL
        const getPrimaryMediaUrl = (post: any) => {
          if (post.media_urls && post.media_urls.length > 0) {
            return post.media_urls[0];
          }
          return post.media_url;
        };

        // Helper function to get primary thumbnail
        const getPrimaryThumbnail = (post: any) => {
          if (post.thumbnails && post.thumbnails.length > 0) {
            return post.thumbnails[0];
          }
          return post.thumbnail;
        };

        return {
          ...post,
          like_count: likeCount,
          comment_count: commentCount,
          user_has_liked: userHasLiked,
          primary_media_url: getPrimaryMediaUrl(post),
          primary_thumbnail: getPrimaryThumbnail(post),
          image_count: post.media_urls ? post.media_urls.length : 1
        };
      }));

      return processedData;
    } catch (error) {
      console.error('Error in getLatestWorkPosts:', error);
      throw error;
    }
  }

  // Get ALL latest work posts for admin (including inactive posts)
  static async getAllLatestWorkPostsForAdmin(limit?: number, userId?: string, offset?: number): Promise<MediaPost[]> {
    try {
      let query = supabase
        .from('media_posts')
        .select(`
          *,
          likes:post_likes(count),
          comments:post_comments(count)
        `)
        .eq('media_type', 'latest_work')
        // Remove the is_active filter to show all posts
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      if (offset) {
        query = query.range(offset, offset + (limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching all latest work posts for admin:', error);
        throw error;
      }

      // Process the data to include computed fields
      const processedData = await Promise.all((data || []).map(async (post) => {
        const likeCount = Array.isArray(post.likes) ? post.likes.length : (post.likes?.count || 0);
        const commentCount = Array.isArray(post.comments) ? post.comments.length : (post.comments?.count || 0);
        
        let userHasLiked = false;
        if (userId) {
          const { data: userLike } = await supabase
            .from('post_likes')
            .select('id')
            .eq('media_post_id', post.id)
            .eq('user_id', userId)
            .single();
          userHasLiked = !!userLike;
        }

        // Helper function to get primary media URL
        const getPrimaryMediaUrl = (post: any) => {
          if (post.media_urls && post.media_urls.length > 0) {
            return post.media_urls[0];
          }
          return post.media_url;
        };

        // Helper function to get primary thumbnail
        const getPrimaryThumbnail = (post: any) => {
          if (post.thumbnails && post.thumbnails.length > 0) {
            return post.thumbnails[0];
          }
          return post.thumbnail;
        };

        return {
          ...post,
          like_count: likeCount,
          comment_count: commentCount,
          user_has_liked: userHasLiked,
          primary_media_url: getPrimaryMediaUrl(post),
          primary_thumbnail: getPrimaryThumbnail(post),
          image_count: post.media_urls ? post.media_urls.length : 1
        };
      }));

      return processedData;
    } catch (error) {
      console.error('Error in getAllLatestWorkPostsForAdmin:', error);
      throw error;
    }
  }

  // Create new latest work post
  static async createLatestWorkPost(mediaData: CreateMediaPost): Promise<MediaPost | null> {
    try {
      const { data, error } = await supabase
        .from('media_posts')
        .insert([{
          ...mediaData,
          media_type: 'latest_work',
          likes: 0,
          is_active: mediaData.is_active !== false // Default to true
        }])
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error creating latest work post:', error);
      return null;
    }
  }

  // Update latest work post
  static async updateLatestWorkPost(mediaId: string, updates: UpdateMediaPost): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('media_posts')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', mediaId)
        .eq('media_type', 'latest_work');

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error updating latest work post:', error);
      return false;
    }
  }

  // Delete latest work post
  static async deleteLatestWorkPost(mediaId: string): Promise<boolean> {
    try {
      // Delete associated likes and comments first
      await supabase.from('post_likes').delete().eq('media_post_id', mediaId);
      await supabase.from('post_comments').delete().eq('media_post_id', mediaId);

      // Delete the post
      const { error } = await supabase
        .from('media_posts')
        .delete()
        .eq('id', mediaId)
        .eq('media_type', 'latest_work');

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error deleting latest work post:', error);
      return false;
    }
  }

  // Like/Unlike a post
  static async toggleLike(mediaPostId: string, userId: string): Promise<{ liked: boolean; likeCount: number }> {
    try {
      // Check if user already liked this post
      const { data: existingLike, error: checkError } = await supabase
        .from('post_likes')
        .select('id')
        .eq('media_post_id', mediaPostId)
        .eq('user_id', userId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingLike) {
        // Unlike the post
        const { error: deleteError } = await supabase
          .from('post_likes')
          .delete()
          .eq('id', existingLike.id);

        if (deleteError) throw deleteError;

        // Get updated like count
        const { count } = await supabase
          .from('post_likes')
          .select('*', { count: 'exact', head: true })
          .eq('media_post_id', mediaPostId);

        return { liked: false, likeCount: count || 0 };
      } else {
        // Like the post
        const { error: insertError } = await supabase
          .from('post_likes')
          .insert([{
            media_post_id: mediaPostId,
            user_id: userId
          }]);

        if (insertError) throw insertError;

        // Get updated like count
        const { count } = await supabase
          .from('post_likes')
          .select('*', { count: 'exact', head: true })
          .eq('media_post_id', mediaPostId);

        return { liked: true, likeCount: count || 0 };
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  }

  // Get comments for a post
  static async getComments(mediaPostId: string): Promise<Comment[]> {
    try {
      // First, let's try a manual join approach
      const { data: comments, error } = await supabase
        .from('post_comments')
        .select('*')
        .eq('media_post_id', mediaPostId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (!comments || comments.length === 0) {
        return [];
      }

      // Get user profiles for all comment authors
      const userIds = comments.map(comment => comment.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, avatar')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        // Return comments without profile data if profiles fetch fails
        return comments.map(comment => ({
          ...comment,
          user_profile: null
        }));
      }

      // Combine comments with profile data
      const commentsWithProfiles = comments.map(comment => {
        const profile = profiles?.find(p => p.id === comment.user_id);
        return {
          ...comment,
          user_profile: profile ? {
            name: profile.name,
            avatar: profile.avatar
          } : null
        };
      });

      return commentsWithProfiles;
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  }

  // Add a comment
  static async addComment(commentData: CreateComment, userId: string): Promise<Comment | null> {
    try {
      const { data: comment, error } = await supabase
        .from('post_comments')
        .insert([{
          ...commentData,
          user_id: userId
        }])
        .select('*')
        .single();

      if (error) throw error;

      if (!comment) return null;

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('name, avatar')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        // Return comment without profile data if profile fetch fails
        return {
          ...comment,
          user_profile: null
        };
      }

      return {
        ...comment,
        user_profile: profile ? {
          name: profile.name,
          avatar: profile.avatar
        } : null
      };
    } catch (error) {
      console.error('Error adding comment:', error);
      return null;
    }
  }

  // Update a comment
  static async updateComment(commentId: string, updates: UpdateComment, userId: string): Promise<Comment | null> {
    try {
      const { data: comment, error } = await supabase
        .from('post_comments')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .eq('user_id', userId) // Ensure user can only update their own comments
        .select('*')
        .single();

      if (error) throw error;

      if (!comment) return null;

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('name, avatar')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        // Return comment without profile data if profile fetch fails
        return {
          ...comment,
          user_profile: null
        };
      }

      return {
        ...comment,
        user_profile: profile ? {
          name: profile.name,
          avatar: profile.avatar
        } : null
      };
    } catch (error) {
      console.error('Error updating comment:', error);
      return null;
    }
  }

  // Delete a comment
  static async deleteComment(commentId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', userId); // Ensure user can only delete their own comments

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error deleting comment:', error);
      return false;
    }
  }

  // Admin: Delete any comment (admin privilege)
  static async deleteCommentAsAdmin(commentId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error deleting comment as admin:', error);
      return false;
    }
  }

  // Admin: Get detailed likes for a post with user information
  static async getLikesForAdmin(mediaPostId: string): Promise<Like[]> {
    try {
      const { data: likes, error } = await supabase
        .from('post_likes')
        .select('*')
        .eq('media_post_id', mediaPostId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!likes || likes.length === 0) {
        return [];
      }

      // Get user profiles for all likes
      const userIds = likes.map(like => like.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, avatar')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles for likes:', profilesError);
        // Return likes without profile data if profiles fetch fails
        return likes.map(like => ({
          ...like,
          user_profile: null
        }));
      }

      // Combine likes with profile data
      const likesWithProfiles = likes.map(like => {
        const profile = profiles?.find(p => p.id === like.user_id);
        return {
          ...like,
          user_profile: profile ? {
            name: profile.name,
            avatar: profile.avatar
          } : null
        };
      });

      return likesWithProfiles;
    } catch (error) {
      console.error('Error fetching likes for admin:', error);
      throw error;
    }
  }

  // Admin: Remove a like (admin privilege)
  static async removeLikeAsAdmin(likeId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('id', likeId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error removing like as admin:', error);
      return false;
    }
  }

  // Get share URL for a post
  static getShareUrl(mediaPostId: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/gallery?post=${mediaPostId}`;
  }

  // Copy share URL to clipboard
  static async copyShareUrl(mediaPostId: string): Promise<boolean> {
    try {
      const shareUrl = this.getShareUrl(mediaPostId);
      await navigator.clipboard.writeText(shareUrl);
      return true;
    } catch (error) {
      console.error('Error copying share URL:', error);
      return false;
    }
  }

  // Get total count of latest work posts (public - only active)
  static async getLatestWorkPostsCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('media_posts')
        .select('*', { count: 'exact', head: true })
        .eq('media_type', 'latest_work')
        .eq('is_active', true);

      if (error) throw error;

      return count || 0;
    } catch (error) {
      console.error('Error getting posts count:', error);
      return 0;
    }
  }

  // Get total count of ALL latest work posts for admin (including inactive)
  static async getAllLatestWorkPostsCountForAdmin(): Promise<{ total: number; active: number; inactive: number }> {
    try {
      // Get total count
      const { count: totalCount, error: totalError } = await supabase
        .from('media_posts')
        .select('*', { count: 'exact', head: true })
        .eq('media_type', 'latest_work');

      if (totalError) throw totalError;

      // Get active count
      const { count: activeCount, error: activeError } = await supabase
        .from('media_posts')
        .select('*', { count: 'exact', head: true })
        .eq('media_type', 'latest_work')
        .eq('is_active', true);

      if (activeError) throw activeError;

      const total = totalCount || 0;
      const active = activeCount || 0;
      const inactive = total - active;

      return { total, active, inactive };
    } catch (error) {
      console.error('Error getting admin posts count:', error);
      return { total: 0, active: 0, inactive: 0 };
    }
  }

  // Search posts by title, caption, or location
  static async searchLatestWorkPosts(
    searchTerm: string, 
    locationFilter?: string,
    limit?: number,
    offset?: number,
    userId?: string
  ): Promise<MediaPost[]> {
    try {
      let query = supabase
        .from('media_posts')
        .select(`
          *,
          likes:post_likes(count),
          comments:post_comments(count)
        `)
        .eq('media_type', 'latest_work')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      // Add search filters
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,caption.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`);
      }

      if (locationFilter) {
        query = query.ilike('location', `%${locationFilter}%`);
      }

      if (limit) {
        query = query.limit(limit);
      }

      if (offset) {
        query = query.range(offset, offset + (limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error searching latest work posts:', error);
        throw error;
      }

      // Process the data to include computed fields
      const processedData = await Promise.all((data || []).map(async (post) => {
        const likeCount = Array.isArray(post.likes) ? post.likes.length : (post.likes?.count || 0);
        const commentCount = Array.isArray(post.comments) ? post.comments.length : (post.comments?.count || 0);
        
        let userHasLiked = false;
        if (userId) {
          const { data: userLike } = await supabase
            .from('post_likes')
            .select('id')
            .eq('media_post_id', post.id)
            .eq('user_id', userId)
            .single();
          userHasLiked = !!userLike;
        }

        return {
          ...post,
          like_count: likeCount,
          comment_count: commentCount,
          user_has_liked: userHasLiked
        };
      }));

      return processedData;
    } catch (error) {
      console.error('Error in searchLatestWorkPosts:', error);
      throw error;
    }
  }
}