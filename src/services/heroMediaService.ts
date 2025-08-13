import { supabase } from '../lib/supabase';
import { MediaPost } from '../types';

export class HeroMediaService {
  // Get the active hero media (image or video)
  static async getActiveHeroMedia(): Promise<MediaPost | null> {
    try {
      const { data, error } = await supabase
        .from('media_posts')
        .select('*')
        .eq('media_type', 'hero')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - no active hero media
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching active hero media:', error);
      return null;
    }
  }

  // Get all hero media items
  static async getAllHeroMedia(): Promise<MediaPost[]> {
    try {
      const { data, error } = await supabase
        .from('media_posts')
        .select('*')
        .eq('media_type', 'hero')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching hero media:', error);
      return [];
    }
  }

  // Set a hero media item as active (and deactivate others)
  static async setActiveHeroMedia(mediaId: string): Promise<boolean> {
    try {
      // First, deactivate all hero media
      const { error: deactivateError } = await supabase
        .from('media_posts')
        .update({ is_active: false })
        .eq('media_type', 'hero');

      if (deactivateError) throw deactivateError;

      // Then activate the selected one
      const { error: activateError } = await supabase
        .from('media_posts')
        .update({ is_active: true })
        .eq('id', mediaId)
        .eq('media_type', 'hero');

      if (activateError) throw activateError;

      return true;
    } catch (error) {
      console.error('Error setting active hero media:', error);
      return false;
    }
  }

  // Create new hero media
  static async createHeroMedia(mediaData: {
    title: string;
    caption: string;
    media_url: string;
    thumbnail?: string | null;
    is_active?: boolean;
  }): Promise<boolean> {
    try {
      // If this is being set as active, deactivate others first
      if (mediaData.is_active) {
        await supabase
          .from('media_posts')
          .update({ is_active: false })
          .eq('media_type', 'hero');
      }

      const { data, error } = await supabase
        .from('media_posts')
        .insert([{
          ...mediaData,
          media_type: 'hero',
          likes: 0
        }])
        .select()
        .single();

      if (error) throw error;

      return !!data;
    } catch (error) {
      console.error('Error creating hero media:', error);
      return false;
    }
  }

  // Update hero media
  static async updateHeroMedia(mediaId: string, updates: {
    title?: string;
    caption?: string;
    media_url?: string;
    thumbnail?: string | null;
    is_active?: boolean;
  }): Promise<boolean> {
    try {
      // If this is being set as active, deactivate others first
      if (updates.is_active) {
        await supabase
          .from('media_posts')
          .update({ is_active: false })
          .eq('media_type', 'hero')
          .neq('id', mediaId);
      }

      const { error } = await supabase
        .from('media_posts')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', mediaId)
        .eq('media_type', 'hero');

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error updating hero media:', error);
      return false;
    }
  }

  // Delete hero media
  static async deleteHeroMedia(mediaId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('media_posts')
        .delete()
        .eq('id', mediaId)
        .eq('media_type', 'hero');

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error deleting hero media:', error);
      return false;
    }
  }

  // Get a specific hero media item by ID
  static async getHeroMedia(mediaId: string): Promise<MediaPost | null> {
    try {
      const { data, error } = await supabase
        .from('media_posts')
        .select('*')
        .eq('id', mediaId)
        .eq('media_type', 'hero')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - no active hero media
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching hero media:', error);
      return null;
    }
  }

  // Get default fallback hero media (in case no active hero is set)
  static getDefaultHeroMedia(): { media_url: string; title: string; caption: string } {
    return {
      media_url: 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=1920',
      title: 'Capture Every Perfect Moment',
      caption: 'Professional photography services for weddings, events, and portraits. Creating memories that last a lifetime.'
    };
  }
}
