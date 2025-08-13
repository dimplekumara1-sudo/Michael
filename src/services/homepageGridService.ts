import { supabase } from '../lib/supabase';

export type HomepageSection = 'grid' | 'slider';

export interface HomepageGridImage {
  id: string;
  image_url: string;
  title: string | null;
  section: HomepageSection;
  sort_order: number;
  created_at: string;
}

export const HomepageGridService = {
  async list(section?: HomepageSection): Promise<HomepageGridImage[]> {
    let query = supabase.from('homepage_grid_images').select('*').order('sort_order', { ascending: true });
    if (section) query = query.eq('section', section);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as HomepageGridImage[];
  },

  async create(payload: { image_url: string; title?: string | null; section: HomepageSection; sort_order?: number }) {
    const { data, error } = await supabase
      .from('homepage_grid_images')
      .insert({
        image_url: payload.image_url,
        title: payload.title ?? null,
        section: payload.section,
        sort_order: payload.sort_order ?? 0,
      })
      .select()
      .single();
    if (error) throw error;
    return data as HomepageGridImage;
  },

  async update(id: string, updates: Partial<Omit<HomepageGridImage, 'id' | 'created_at'>>) {
    const { data, error } = await supabase
      .from('homepage_grid_images')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as HomepageGridImage;
  },

  async remove(id: string) {
    const { error } = await supabase
      .from('homepage_grid_images')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }
};