import { Booking, MediaPost, Gallery, ContactMessage } from '../types';

export const mockBookings: Booking[] = [
  {
    id: '1',
    userId: '1',
    eventDate: '2024-02-15',
    location: 'Central Park, New York',
    eventType: 'Wedding',
    status: 'confirmed',
    galleryLink: 'https://mega.nz/folder/GAcEhCyA#-eQ5Jx1xxnWsBS7a0FE7og',
    megaLink: 'https://mega.nz/folder/GAcEhCyA#-eQ5Jx1xxnWsBS7a0FE7og',
    qrCode: 'QR_WED_001',
    notes: 'Beach ceremony at sunset',
    createdAt: '2024-01-15T10:00:00Z',
    userProfile: {
      name: 'John Smith',
      email: 'john.smith@email.com',
      mobile: '+1-555-0123'
    }
  },
  {
    id: '2',
    userId: '1',
    eventDate: '2024-03-20',
    location: 'Downtown Conference Center',
    eventType: 'Corporate Event',
    status: 'pending',
    notes: 'Annual company meeting',
    createdAt: '2024-01-20T14:30:00Z',
    userProfile: {
      name: 'Sarah Johnson',
      email: 'sarah.johnson@company.com',
      mobile: '+1-555-0456'
    }
  },
  {
    id: '3',
    userId: '1',
    eventDate: '2024-01-05',
    location: 'Home Studio',
    eventType: 'Portrait',
    status: 'completed',
    galleryLink: 'https://eventsnap.com/gallery/port-003',
    megaLink: 'https://mega.nz/folder/XYZ789ABC#123def456ghi789jkl012mno345pqr',
    qrCode: 'QR_PORT_003',
    createdAt: '2023-12-20T09:15:00Z',
    userProfile: {
      name: 'Micheal Chen',
      email: 'michael.chen@email.com',
      mobile: '+1-555-0789'
    }
  }
];

export const mockMediaPosts: MediaPost[] = [
  {
    id: '1',
    title: 'Magical Wedding Moments',
    caption: 'Captured the perfect sunset ceremony at Malibu Beach. Every moment was pure magic! ✨',
    mediaType: 'image',
    mediaURL: 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800',
    createdAt: '2024-01-10T18:00:00Z',
    likes: 127
  },
  {
    id: '2',
    title: 'Corporate Excellence',
    caption: 'Professional headshots that make an impact. Ready to elevate your business presence?',
    mediaType: 'image',
    mediaURL: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=800',
    createdAt: '2024-01-08T12:30:00Z',
    likes: 89
  },
  {
    id: '3',
    title: 'Event Highlights Reel',
    caption: 'Behind the scenes of our latest corporate event. The energy was incredible!',
    mediaType: 'video',
    mediaURL: 'https://images.pexels.com/photos/3171837/pexels-photo-3171837.jpeg?auto=compress&cs=tinysrgb&w=800',
    createdAt: '2024-01-05T16:45:00Z',
    likes: 203
  },
  {
    id: '4',
    title: 'Portrait Perfection',
    caption: 'Natural light portraits that capture authentic emotions. Book your session today!',
    mediaType: 'image',
    mediaURL: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=800',
    createdAt: '2024-01-03T11:20:00Z',
    likes: 156
  }
];

export const mockGalleries: Gallery[] = [
  {
    id: '1',
    bookingId: '1',
    title: 'Wedding - Central Park',
    mediaURLs: [
      'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/1043902/pexels-photo-1043902.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/1043470/pexels-photo-1043470.jpeg?auto=compress&cs=tinysrgb&w=400',
    ],
    isPublic: false,
    megaLink: 'https://mega.nz/folder/GAcEhCyA#-eQ5Jx1xxnWsBS7a0FE7og',
    qrCodeData: 'https://mega.nz/folder/GAcEhCyA#-eQ5Jx1xxnWsBS7a0FE7og'
  },
  {
    id: '2',
    bookingId: '3',
    title: 'Portrait Session - Home Studio',
    mediaURLs: [
      'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=400',
    ],
    isPublic: false,
    megaLink: 'https://mega.nz/folder/XYZ789ABC#123def456ghi789jkl012mno345pqr',
    qrCodeData: 'https://mega.nz/folder/XYZ789ABC#123def456ghi789jkl012mno345pqr'
  }
];

export const mockContactMessages: ContactMessage[] = [
  {
    id: '1',
    name: 'Emily Johnson',
    email: 'emily@example.com',
    message: 'Hi! I\'m interested in booking a wedding photography package for June 2024. Could you please send me more details about your pricing and availability?',
    createdAt: '2024-01-12T14:30:00Z',
    status: 'unread'
  },
  {
    id: '2',
    name: 'Micheal Chen',
    email: 'mchen@company.com',
    message: 'We need a photographer for our corporate retreat next month. Looking for someone who can capture both formal presentations and casual team activities.',
    createdAt: '2024-01-11T09:15:00Z',
    status: 'read'
  }
];