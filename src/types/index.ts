export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  avatar?: string;
}

export interface Booking {
  id: string;
  userId: string;
  eventDate: string;
  location: string;
  eventType: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  galleryLink?: string;
  megaLink?: string;
  qrCode?: string;
  notes?: string;
  projectValue?: number; // Project value/revenue in rupees (admin only)
  createdAt: string;
  updatedAt?: string;
  userProfile?: {
    name?: string;
    email?: string;
    mobile?: string;
  };
}

export interface MediaPost {
  id: string;
  title: string;
  caption: string;
  media_type: 'image' | 'video' | 'slider' | 'homepage' | 'hero' | 'latest_work' | 'about';
  media_url: string;
  thumbnail?: string | null;
  // New multi-image support
  media_urls?: string[] | null;
  thumbnails?: string[] | null;
  likes: number;
  location?: string | null;
  youtube_url?: string | null;
  category?: string | null;
  created_at: string;
  updated_at: string;
  is_active?: boolean;
  // Computed fields for frontend
  like_count?: number;
  comment_count?: number;
  user_has_liked?: boolean;
  // Helper computed fields
  primary_media_url?: string;
  primary_thumbnail?: string;
  image_count?: number;
}

export interface CreateMediaPost {
  title: string;
  caption: string;
  media_type: 'image' | 'video' | 'slider' | 'homepage' | 'hero' | 'latest_work' | 'about';
  media_url: string;
  thumbnail?: string | null;
  // New multi-image support
  media_urls?: string[] | null;
  thumbnails?: string[] | null;
  location?: string | null;
  youtube_url?: string | null;
  category?: string | null;
  is_active?: boolean;
}

export interface UpdateMediaPost {
  title?: string;
  caption?: string;
  media_type?: 'image' | 'video' | 'slider' | 'homepage' | 'hero' | 'latest_work' | 'about';
  media_url?: string;
  thumbnail?: string | null;
  // New multi-image support
  media_urls?: string[] | null;
  thumbnails?: string[] | null;
  location?: string | null;
  youtube_url?: string | null;
  category?: string | null;
  is_active?: boolean;
}

export interface Gallery {
  id: string;
  bookingId: string;
  title: string;
  media_urls: string[];
  is_public: boolean;
  mega_link: string;
  qr_code_data?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
  status: 'unread' | 'read' | 'replied';
}

export interface Like {
  id: string;
  user_id: string;
  media_post_id: string;
  created_at: string;
  user_profile?: {
    name: string;
    avatar?: string;
  };
}

export interface Comment {
  id: string;
  user_id: string;
  media_post_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_profile?: {
    name: string;
    avatar?: string;
  };
}

export interface CreateComment {
  media_post_id: string;
  content: string;
}

export interface UpdateComment {
  content: string;
}

// Export Event types
export * from './Event';
