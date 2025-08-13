import { supabase } from '../lib/supabase';
import { AboutWorkSection, CreateAboutWorkSection, UpdateAboutWorkSection } from '../types/AboutWork';

export class AboutWorkService {
  // Get active about work section
  static async getActiveAboutWork(): Promise<AboutWorkSection | null> {
    try {
      const { data, error } = await supabase
        .from('about_work_section')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned, return null
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching active about work section:', error);
      throw error;
    }
  }

  // Get all about work sections (for admin)
  static async getAllAboutWork(): Promise<AboutWorkSection[]> {
    try {
      const { data, error } = await supabase
        .from('about_work_section')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all about work sections:', error);
      throw error;
    }
  }

  // Create new about work section
  static async createAboutWork(aboutWork: CreateAboutWorkSection): Promise<AboutWorkSection> {
    try {
      const { data, error } = await supabase
        .from('about_work_section')
        .insert([{
          ...aboutWork,
          is_active: true // New entries are active by default
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating about work section:', error);
      throw error;
    }
  }

  // Update about work section
  static async updateAboutWork(id: string, updates: UpdateAboutWorkSection): Promise<AboutWorkSection> {
    try {
      const { data, error } = await supabase
        .from('about_work_section')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating about work section:', error);
      throw error;
    }
  }

  // Update active about work section (most common use case)
  static async updateActiveAboutWork(updates: UpdateAboutWorkSection): Promise<AboutWorkSection> {
    try {
      // First get the active section
      const activeSection = await this.getActiveAboutWork();
      
      if (!activeSection) {
        // If no active section exists, create one
        return await this.createAboutWork({
          title: updates.title || 'See My Work in Action',
          description: updates.description || 'Discover the passion and artistry behind every shot.',
          youtube_video_id: updates.youtube_video_id || 'cn6V_7I4U0g',
          video_title: updates.video_title || 'Behind the Scenes: Wedding Photography',
          video_description: updates.video_description || 'Watch how I capture the magic of your special day'
        });
      }

      // Update the active section
      return await this.updateAboutWork(activeSection.id, updates);
    } catch (error) {
      console.error('Error updating active about work section:', error);
      throw error;
    }
  }

  // Delete about work section
  static async deleteAboutWork(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('about_work_section')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting about work section:', error);
      throw error;
    }
  }

  // Set active about work section
  static async setActiveAboutWork(id: string): Promise<AboutWorkSection> {
    try {
      // The trigger will automatically deactivate other sections
      const { data, error } = await supabase
        .from('about_work_section')
        .update({ is_active: true })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error setting active about work section:', error);
      throw error;
    }
  }

  // Validate YouTube video ID
  static validateYouTubeVideoId(videoId: string): boolean {
    // YouTube video IDs are typically 11 characters long
    const youtubeRegex = /^[a-zA-Z0-9_-]{11}$/;
    return youtubeRegex.test(videoId);
  }

  // Extract YouTube video ID from URL
  static extractYouTubeVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }
}