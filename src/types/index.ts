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
  createdAt: string;
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
  mediaType: 'image' | 'video';
  mediaURL: string;
  thumbnail?: string;
  createdAt: string;
  likes: number;
}

export interface Gallery {
  id: string;
  bookingId: string;
  title: string;
  mediaURLs: string[];
  isPublic: boolean;
  megaLink: string;
  qrCodeData?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
  status: 'unread' | 'read' | 'replied';
}