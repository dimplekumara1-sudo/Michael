import { supabase } from '../lib/supabase';
import { BlogPost } from '../types/Blog';

export interface CreateBlogData {
  title: string;
  description: string;
  thumbnailUrl: string;
  contentHtml: string;
  conclusion: string;
  slug?: string;
  isPublished?: boolean;
}

export interface UpdateBlogData extends Partial<CreateBlogData> {
  id: string;
}

// Generate slug from title
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim()
    .substring(0, 100); // Limit length
};

// Ensure slug is unique
const ensureUniqueSlug = async (baseSlug: string, excludeId?: string): Promise<string> => {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    let query = supabase
      .from('blogs')
      .select('id')
      .eq('slug', slug);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query.single();

    if (error && error.code === 'PGRST116') {
      // No rows found, slug is unique
      break;
    }

    if (error) {
      throw error;
    }

    // Slug exists, try with counter
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

export const blogService = {
  // Get all published blogs for public viewing
  async getPublishedBlogs(): Promise<BlogPost[]> {
    const { data, error } = await supabase
      .from('blogs')
      .select(`
        id,
        slug,
        title,
        description,
        thumbnail_url,
        content_html,
        conclusion,
        published_at
      `)
      .eq('is_published', true)
      .order('published_at', { ascending: false });

    if (error) throw error;

    return data.map(blog => ({
      id: blog.id,
      slug: blog.slug,
      title: blog.title,
      description: blog.description,
      thumbnailUrl: blog.thumbnail_url,
      contentHtml: blog.content_html,
      conclusion: blog.conclusion,
      publishedAt: blog.published_at
    }));
  },

  // Get all blogs for admin management (published and unpublished)
  async getAllBlogs(): Promise<(BlogPost & { isPublished: boolean; authorId: string; createdAt: string; updatedAt: string })[]> {
    const { data, error } = await supabase
      .from('blogs')
      .select(`
        id,
        slug,
        title,
        description,
        thumbnail_url,
        content_html,
        conclusion,
        published_at,
        created_at,
        updated_at,
        author_id,
        is_published
      `)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return data.map(blog => ({
      id: blog.id,
      slug: blog.slug,
      title: blog.title,
      description: blog.description,
      thumbnailUrl: blog.thumbnail_url,
      contentHtml: blog.content_html,
      conclusion: blog.conclusion,
      publishedAt: blog.published_at,
      createdAt: blog.created_at,
      updatedAt: blog.updated_at,
      authorId: blog.author_id,
      isPublished: blog.is_published
    }));
  },

  // Get single blog by slug
  async getBlogBySlug(slug: string): Promise<BlogPost | null> {
    const { data, error } = await supabase
      .from('blogs')
      .select(`
        id,
        slug,
        title,
        description,
        thumbnail_url,
        content_html,
        conclusion,
        published_at
      `)
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return {
      id: data.id,
      slug: data.slug,
      title: data.title,
      description: data.description,
      thumbnailUrl: data.thumbnail_url,
      contentHtml: data.content_html,
      conclusion: data.conclusion,
      publishedAt: data.published_at
    };
  },

  // Get single blog by ID (for admin editing)
  async getBlogById(id: string): Promise<(BlogPost & { isPublished: boolean; authorId: string; createdAt: string; updatedAt: string }) | null> {
    const { data, error } = await supabase
      .from('blogs')
      .select(`
        id,
        slug,
        title,
        description,
        thumbnail_url,
        content_html,
        conclusion,
        published_at,
        created_at,
        updated_at,
        author_id,
        is_published
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return {
      id: data.id,
      slug: data.slug,
      title: data.title,
      description: data.description,
      thumbnailUrl: data.thumbnail_url,
      contentHtml: data.content_html,
      conclusion: data.conclusion,
      publishedAt: data.published_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      authorId: data.author_id,
      isPublished: data.is_published
    };
  },

  // Create new blog
  async createBlog(blogData: CreateBlogData): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Generate slug if not provided
    const baseSlug = blogData.slug || generateSlug(blogData.title);
    const uniqueSlug = await ensureUniqueSlug(baseSlug);

    const { data, error } = await supabase
      .from('blogs')
      .insert({
        title: blogData.title,
        description: blogData.description,
        thumbnail_url: blogData.thumbnailUrl,
        content_html: blogData.contentHtml,
        conclusion: blogData.conclusion,
        slug: uniqueSlug,
        is_published: blogData.isPublished || false,
        author_id: user.id
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  },

  // Update existing blog
  async updateBlog(blogData: UpdateBlogData): Promise<void> {
    const updateData: any = {};

    if (blogData.title !== undefined) updateData.title = blogData.title;
    if (blogData.description !== undefined) updateData.description = blogData.description;
    if (blogData.thumbnailUrl !== undefined) updateData.thumbnail_url = blogData.thumbnailUrl;
    if (blogData.contentHtml !== undefined) updateData.content_html = blogData.contentHtml;
    if (blogData.conclusion !== undefined) updateData.conclusion = blogData.conclusion;
    if (blogData.isPublished !== undefined) updateData.is_published = blogData.isPublished;

    // Handle slug update
    if (blogData.slug !== undefined || blogData.title !== undefined) {
      const baseSlug = blogData.slug || (blogData.title ? generateSlug(blogData.title) : '');
      if (baseSlug) {
        updateData.slug = await ensureUniqueSlug(baseSlug, blogData.id);
      }
    }

    const { error } = await supabase
      .from('blogs')
      .update(updateData)
      .eq('id', blogData.id);

    if (error) throw error;
  },

  // Delete blog
  async deleteBlog(id: string): Promise<void> {
    const { error } = await supabase
      .from('blogs')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Toggle publish status
  async togglePublishStatus(id: string): Promise<boolean> {
    // First get current status
    const { data: currentBlog, error: fetchError } = await supabase
      .from('blogs')
      .select('is_published')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const newStatus = !currentBlog.is_published;

    const { error } = await supabase
      .from('blogs')
      .update({ is_published: newStatus })
      .eq('id', id);

    if (error) throw error;
    return newStatus;
  }
};