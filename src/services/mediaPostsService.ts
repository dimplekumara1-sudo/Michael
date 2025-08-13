import { supabase } from '../lib/supabase';
import { MediaPost, CreateMediaPost, UpdateMediaPost } from '../types';

export class MediaPostsService {
  // Get all media posts
  static async getAllMediaPosts(): Promise<MediaPost[]> {
    try {
      const { data, error } = await supabase
        .from('media_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching media posts:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllMediaPosts:', error);
      throw error;
    }
  }

  // Get media posts by type
static async getMediaPostsByType(mediaType: 'image' | 'video' | 'slider' | 'homepage' | 'hero' | 'latest_work' | 'about'): Promise<MediaPost[]> {
    try {
      const { data, error } = await supabase
        .from('media_posts')
        .select('*')
        .eq('media_type', mediaType)
        .order('created_at', { ascending: false });

      if (error) {
        console.error(`Error fetching ${mediaType} media posts:`, error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error(`Error in getMediaPostsByType for ${mediaType}:`, error);
      throw error;
    }
  }

  // Get active slider posts
  static async getActiveSliderPosts(): Promise<MediaPost[]> {
    try {
      const { data, error } = await supabase
        .from('media_posts')
        .select('*')
        .eq('media_type', 'slider')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching active slider posts:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getActiveSliderPosts:', error);
      throw error;
    }
  }

  // Create new media post
  static async createMediaPost(mediaPost: CreateMediaPost): Promise<MediaPost> {
    try {
      const { data, error } = await supabase
        .from('media_posts')
        .insert({
          title: mediaPost.title,
          caption: mediaPost.caption,
          media_type: mediaPost.media_type,
          media_url: mediaPost.media_url,
          thumbnail: mediaPost.thumbnail,
          is_active: mediaPost.is_active || false,
          likes: 0
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating media post:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in createMediaPost:', error);
      throw error;
    }
  }

  // Update media post
  static async updateMediaPost(id: string, updates: UpdateMediaPost): Promise<MediaPost> {
    try {
      const { data, error } = await supabase
        .from('media_posts')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating media post:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updateMediaPost:', error);
      throw error;
    }
  }

  // Delete media post
  static async deleteMediaPost(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('media_posts')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting media post:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteMediaPost:', error);
      throw error;
    }
  }

  // Toggle active status
  static async toggleActiveStatus(id: string, isActive: boolean): Promise<MediaPost> {
    try {
      const { data, error } = await supabase
        .from('media_posts')
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error toggling active status:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in toggleActiveStatus:', error);
      throw error;
    }
  }

  // Delete slider post
  static async deleteSliderPost(postId: string): Promise<boolean> {
    try {
      console.log('🗑️ Deleting slider post:', postId);
      const { error } = await supabase
        .from('media_posts')
        .delete()
        .eq('id', postId)
        .eq('media_type', 'slider');

      if (error) {
        console.error('Error deleting slider post:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteSliderPost:', error);
      return false;
    }
  }

  // Initialize slider content - ensures existing slider posts are properly configured
  static async migratePortfolioItems(): Promise<void> {
    try {
      console.log('🔄 Initializing slider content...');
      
      // Check if slider items already exist
      const existingSliders = await this.getMediaPostsByType('slider');
      
      if (existingSliders.length > 0) {
        console.log(`✅ Found ${existingSliders.length} existing slider posts`);
        
        // Check if any are active
        const activeSliders = existingSliders.filter(slider => slider.is_active);
        
        if (activeSliders.length === 0) {
          console.log('🔄 No active slider posts found. Activating existing slider posts...');
          
          // Activate all existing slider posts
          for (const slider of existingSliders) {
            await this.toggleActiveStatus(slider.id, true);
          }
          
          console.log(`✅ Activated ${existingSliders.length} slider posts`);
        } else {
          console.log(`✅ Found ${activeSliders.length} active slider posts`);
        }
        
        return;
      }

      console.log('ℹ️ No slider posts found in database. Please add slider content through the admin dashboard.');
    } catch (error) {
      console.error('❌ Error initializing slider content:', error);
      throw error;
    }
  }

  // Toggle slider post active status
  static async toggleSliderPostActive(postId: string, isActive: boolean): Promise<boolean> {
    try {
      const result = await this.toggleActiveStatus(postId, isActive);
      return !!result;
    } catch (error) {
      console.error('Error in toggleSliderPostActive:', error);
      return false;
    }
  }

  // Create slider post
  static async createSliderPost(mediaData: {
    title: string;
    caption: string;
    media_url: string;
    thumbnail?: string | null;
    is_active?: boolean;
  }): Promise<boolean> {
    try {
      const result = await this.createMediaPost({
        ...mediaData,
        media_type: 'slider'
      });
      return !!result;
    } catch (error) {
      console.error('Error in createSliderPost:', error);
      return false;
    }
  }

  // Update slider post
  static async updateSliderPost(postId: string, updates: {
    title?: string;
    caption?: string;
    media_url?: string;
    thumbnail?: string | null;
    is_active?: boolean;
  }): Promise<boolean> {
    try {
      const result = await this.updateMediaPost(postId, updates);
      return !!result;
    } catch (error) {
      console.error('Error in updateSliderPost:', error);
      return false;
    }
  }

  // Reset all slider content (remove all sliders)
  static async resetSliderContent(): Promise<void> {
    try {
      console.log('🔄 Resetting slider content...');

      // Delete all existing slider posts
      const { error: deleteError } = await supabase
        .from('media_posts')
        .delete()
        .eq('media_type', 'slider');

      if (deleteError) {
        console.error('Error deleting slider posts:', deleteError);
        throw deleteError;
      }

      console.log('✅ Successfully reset slider content - all slider items removed');
      return;
    } catch (error) {
      console.error('Error resetting slider content:', error);
      throw error;
    }
  }
}
