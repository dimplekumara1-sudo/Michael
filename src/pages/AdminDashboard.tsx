import React, { useState, useEffect, useCallback } from 'react';
import { Gallery } from '../types/Gallery';
import { ContactMessage } from '../types/ContactMessage';
import { Calendar, MapPin, Clock, Camera, Download, QrCode, Plus, Filter, Search, ExternalLink, Edit3, Trash2, Users, Link, Copy, Check, X, AlertCircle, Phone, Mail, MessageCircle, FileImage, IndianRupee, TrendingUp } from 'lucide-react';
// Removed mock data imports - using real database data
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Booking } from '../types';
import Notification from '../components/Notification';
import QRCode from 'qrcode.react';
import LatestWorkManager from '../components/admin/LatestWorkManager';

const AdminDashboard = () => {
  const { user, profile, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('bookings');
  const [showQR, setShowQR] = useState<string | null>(null);
  const [editingBooking, setEditingBooking] = useState<string | null>(null);
  const [megaLinkInput, setMegaLinkInput] = useState('');
  const [editingProjectValue, setEditingProjectValue] = useState<string | null>(null);
  const [projectValueInput, setProjectValueInput] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
const [galleries, setGalleries] = useState<Gallery[]>([]);
const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);

  const [loadingBookings, setLoadingBookings] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
  } | null>(null);

  
  // Gallery management states
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [editingGallery, setEditingGallery] = useState<Gallery | null>(null);
  const [loadingGalleries, setLoadingGalleries] = useState(false);

  // Optimized input handler to prevent re-render issues
  const handleMegaLinkChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setMegaLinkInput(e.target.value);
  }, []);

  // Handle project value input change
  const handleProjectValueChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setProjectValueInput(e.target.value);
  }, []);

  // Calculate total earnings from completed bookings
  const calculateTotalEarnings = useCallback(() => {
    return bookings
      .filter(booking => booking.status === 'completed' && booking.projectValue)
      .reduce((total, booking) => total + (booking.projectValue || 0), 0);
  }, [bookings]);

  // Calculate monthly earnings (current month)
  const calculateMonthlyEarnings = useCallback(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return bookings
      .filter(booking => {
        if (booking.status !== 'completed' || !booking.projectValue) return false;
        const eventDate = new Date(booking.eventDate);
        return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
      })
      .reduce((total, booking) => total + (booking.projectValue || 0), 0);
  }, [bookings]);

  // Format currency in Indian Rupees
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Utility function to extract phone number from message content
  const extractPhoneNumber = (message: string): string | null => {
    // Look for phone number patterns in the message
    const phonePatterns = [
      /Phone:\s*([+]?[\d\s\-\(\)]+)/i,  // "Phone: +1234567890" or "Phone: (555) 123-4567"
      /Mobile:\s*([+]?[\d\s\-\(\)]+)/i, // "Mobile: +1234567890"
      /Contact:\s*([+]?[\d\s\-\(\)]+)/i, // "Contact: +1234567890"
      /Tel:\s*([+]?[\d\s\-\(\)]+)/i,    // "Tel: +1234567890"
      /Call:\s*([+]?[\d\s\-\(\)]+)/i,   // "Call: +1234567890"
    ];

    for (const pattern of phonePatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        // Clean up the phone number - remove spaces, dashes, parentheses
        const cleanNumber = match[1].replace(/[\s\-\(\)]/g, '');
        // Ensure it has reasonable length for a phone number
        if (cleanNumber.length >= 10) {
          return cleanNumber;
        }
      }
    }
    return null;
  };

  // Format phone number for WhatsApp (ensure it starts with country code)
  const formatWhatsAppNumber = (phoneNumber: string): string => {
    // Remove any non-digit characters except +
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // If it doesn't start with +, assume it's an Indian number and add +91
    if (!cleaned.startsWith('+')) {
      // If it starts with 91, don't add another 91
      if (cleaned.startsWith('91') && cleaned.length > 10) {
        cleaned = '+' + cleaned;
      } else {
        cleaned = '+91' + cleaned;
      }
    }
    
    return cleaned;
  };

  // Handle WhatsApp click
  const handleWhatsAppClick = (message: ContactMessage) => {
    const phoneNumber = extractPhoneNumber(message.message);
    if (phoneNumber) {
      const whatsappNumber = formatWhatsAppNumber(phoneNumber);
      const whatsappMessage = `Hi ${message.name}, thank you for contacting Micheal photographs. We received your inquiry and would like to discuss your photography needs.`;
      const whatsappUrl = `https://wa.me/${whatsappNumber.replace('+', '')}?text=${encodeURIComponent(whatsappMessage)}`;
      window.open(whatsappUrl, '_blank');
    } else {
      setNotification({
        type: 'warning',
        title: 'No Phone Number Found',
        message: 'No phone number found in this message to initiate WhatsApp chat.'
      });
    }
  };

  // Handle call click
  const handleCallClick = (message: ContactMessage) => {
    const phoneNumber = extractPhoneNumber(message.message);
    if (phoneNumber) {
      const callUrl = `tel:${phoneNumber}`;
      window.location.href = callUrl;
    } else {
      setNotification({
        type: 'warning',
        title: 'No Phone Number Found',
        message: 'No phone number found in this message to initiate call.'
      });
    }
  };

  // Fetch bookings from database with user information using JOIN
  const fetchBookings = async () => {
    setLoadingBookings(true);
    try {
      console.log('🔍 Fetching bookings with user profiles...');
      
      // Use JOIN to get bookings with user profile data in one query
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          profiles:user_id (
            name,
            email,
            mobile
          )
        `)
        .order('created_at', { ascending: false });

      if (bookingsError) {
        console.error('Error fetching bookings with profiles:', bookingsError);
        setBookings([]);
        setNotification({
          type: 'error',
          title: 'Error Loading Bookings',
          message: 'Failed to load bookings with customer information. Please try again.'
        });
        return;
      }

      // Transform the joined data
      const transformedBookings = bookingsData.map(booking => ({
        id: booking.id,
        userId: booking.user_id,
        eventDate: booking.event_date,
        location: booking.location,
        eventType: booking.event_type,
        status: booking.status,
        galleryLink: booking.gallery_link,
        megaLink: booking.mega_link,
        qrCode: booking.qr_code,
        notes: booking.notes,
        projectValue: booking.project_value || 0,
        createdAt: booking.created_at,
        userProfile: booking.profiles ? {
          name: booking.profiles.name || 'User',
          email: booking.profiles.email || '',
          mobile: booking.profiles.mobile || null
        } : {
          name: 'User',
          email: '',
          mobile: null
        }
      }));

      console.log('✅ Bookings fetched successfully:', transformedBookings.length, 'bookings');
      setBookings(transformedBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  };

  // Update booking status
  const updateBookingStatus = async (bookingId: string, newStatus: 'pending' | 'confirmed' | 'completed' | 'cancelled') => {
    setUpdatingStatus(bookingId);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) {
        console.error('Error updating booking status:', error);
        setNotification({
          type: 'error',
          title: 'Update Failed',
          message: 'Failed to update booking status. Please try again.'
        });
      } else {
        // Update local state
        setBookings(prev => prev.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: newStatus }
            : booking
        ));
        setNotification({
          type: 'success',
          title: 'Status Updated',
          message: `Booking status updated to ${newStatus}`
        });
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      setNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update booking status. Please try again.'
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Quick accept booking
  const acceptBooking = (bookingId: string) => {
    updateBookingStatus(bookingId, 'confirmed');
  };

  // Quick reject booking
  const rejectBooking = (bookingId: string) => {
    updateBookingStatus(bookingId, 'cancelled');
  };

  // Update booking project value
  const updateProjectValue = async (bookingId: string, projectValue: number) => {
    setUpdatingStatus(bookingId);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          project_value: projectValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) {
        console.error('Error updating project value:', error);
        setNotification({
          type: 'error',
          title: 'Update Failed',
          message: 'Failed to update project value. Please try again.'
        });
      } else {
        // Update local state
        setBookings(prev => prev.map(booking => 
          booking.id === bookingId 
            ? { ...booking, projectValue: projectValue }
            : booking
        ));
        setEditingProjectValue(null);
        setProjectValueInput('');
        setNotification({
          type: 'success',
          title: 'Project Value Updated',
          message: `Project value updated to ${formatCurrency(projectValue)}`
        });
      }
    } catch (error) {
      console.error('Error updating project value:', error);
      setNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update project value. Please try again.'
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Handle project value save
  const handleSaveProjectValue = (bookingId: string) => {
    const value = parseFloat(projectValueInput);
    if (isNaN(value) || value < 0) {
      setNotification({
        type: 'error',
        title: 'Invalid Value',
        message: 'Please enter a valid positive number for project value.'
      });
      return;
    }
    updateProjectValue(bookingId, value);
  };

  // Fetch galleries from database with booking information
  const fetchGalleries = async () => {
    setLoadingGalleries(true);
    try {
      console.log('🔍 Fetching galleries with booking information...');
      
      // Fetch galleries with booking details using JOIN
      const { data: galleriesData, error: galleriesError } = await supabase
        .from('galleries')
        .select(`
          *,
          bookings:booking_id (
            event_date,
            location,
            event_type,
            status,
            profiles:user_id (
              name,
              email
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (galleriesError) {
        console.error('Error fetching galleries:', galleriesError);
        setNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to load galleries'
        });
        return;
      }

      // Transform the data to match Gallery interface
      const transformedGalleries: Gallery[] = galleriesData.map(gallery => ({
        id: gallery.id,
        bookingId: gallery.booking_id,
        title: gallery.title,
        mediaURLs: gallery.media_urls || [],
        isPublic: gallery.is_public,
        megaLink: gallery.mega_link,
        qrCodeData: gallery.qr_code_data,
        // Add booking information for display
        booking: gallery.bookings ? {
          eventDate: gallery.bookings.event_date,
          location: gallery.bookings.location,
          eventType: gallery.bookings.event_type,
          status: gallery.bookings.status,
          customerName: gallery.bookings.profiles?.name || 'Unknown',
          customerEmail: gallery.bookings.profiles?.email || ''
        } : undefined
      }));

      console.log('✅ Galleries fetched successfully:', transformedGalleries.length, 'galleries');
      setGalleries(transformedGalleries);
    } catch (error) {
      console.error('Unexpected error fetching galleries:', error);
      setNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load galleries'
      });
    } finally {
      setLoadingGalleries(false);
    }
  };

  // Fetch contact messages from database
  const fetchContactMessages = async () => {
    setLoadingMessages(true);
    try {
      console.log('🔍 Fetching contact messages from database...');
      const { data: messagesData, error: messagesError } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (messagesError) {
        console.error('Error fetching contact messages:', messagesError);
        setNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to load contact messages'
        });
        return;
      }

      // Transform database data to match ContactMessage interface
      const transformedMessages: ContactMessage[] = messagesData.map(message => ({
        id: message.id,
        name: message.name,
        email: message.email,
        message: message.message,
        createdAt: message.created_at,
        status: message.status
      }));

      console.log('✅ Contact messages fetched successfully:', transformedMessages.length, 'messages');
      setContactMessages(transformedMessages);
    } catch (error) {
      console.error('Unexpected error fetching contact messages:', error);
      setNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load contact messages'
      });
    } finally {
      setLoadingMessages(false);
    }
  };

  // Update contact message status
  const updateMessageStatus = async (messageId: string, newStatus: 'unread' | 'read' | 'replied') => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (error) {
        console.error('Error updating message status:', error);
        setNotification({
          type: 'error',
          title: 'Update Failed',
          message: 'Failed to update message status. Please try again.'
        });
      } else {
        // Update local state
        setContactMessages(prev => prev.map(message => 
          message.id === messageId 
            ? { ...message, status: newStatus }
            : message
        ));
        setNotification({
          type: 'success',
          title: 'Status Updated',
          message: `Message marked as ${newStatus}`
        });
      }
    } catch (error) {
      console.error('Error updating message status:', error);
      setNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update message status. Please try again.'
      });
    }
  };

  // Create gallery from booking
  const createGalleryFromBooking = async (bookingId: string, megaLink: string, title?: string) => {
    try {
      console.log('🎨 Creating gallery for booking:', bookingId);
      
      // Get booking details for gallery title
      const booking = bookings.find(b => b.id === bookingId);
      const galleryTitle = title || `${booking?.eventType || 'Event'} - ${booking?.location || 'Gallery'}`;
      
      const { data, error } = await supabase
        .from('galleries')
        .insert({
          booking_id: bookingId,
          title: galleryTitle,
          mega_link: megaLink,
          is_public: false,
          media_urls: [],
          qr_code_data: megaLink // Use MEGA link as QR code data
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating gallery:', error);
        setNotification({
          type: 'error',
          title: 'Gallery Creation Failed',
          message: 'Failed to create gallery. Please try again.'
        });
        return false;
      }

      console.log('✅ Gallery created successfully:', data);
      setNotification({
        type: 'success',
        title: 'Gallery Created',
        message: 'Gallery created successfully!'
      });
      
      // Refresh galleries
      await fetchGalleries();
      return true;
    } catch (error) {
      console.error('Error creating gallery:', error);
      setNotification({
        type: 'error',
        title: 'Gallery Creation Failed',
        message: 'Failed to create gallery. Please try again.'
      });
      return false;
    }
  };

  // Update gallery
  const updateGallery = async (galleryId: string, updates: Partial<Gallery>) => {
    try {
      const { error } = await supabase
        .from('galleries')
        .update({
          title: updates.title,
          mega_link: updates.megaLink,
          is_public: updates.isPublic,
          media_urls: updates.mediaURLs,
          qr_code_data: updates.qrCodeData,
          updated_at: new Date().toISOString()
        })
        .eq('id', galleryId);

      if (error) {
        console.error('Error updating gallery:', error);
        setNotification({
          type: 'error',
          title: 'Update Failed',
          message: 'Failed to update gallery. Please try again.'
        });
        return false;
      }

      setNotification({
        type: 'success',
        title: 'Gallery Updated',
        message: 'Gallery updated successfully!'
      });
      
      await fetchGalleries();
      return true;
    } catch (error) {
      console.error('Error updating gallery:', error);
      setNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update gallery. Please try again.'
      });
      return false;
    }
  };

  // Delete gallery
  const deleteGallery = async (galleryId: string) => {
    if (!confirm('Are you sure you want to delete this gallery? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('galleries')
        .delete()
        .eq('id', galleryId);

      if (error) {
        console.error('Error deleting gallery:', error);
        setNotification({
          type: 'error',
          title: 'Delete Failed',
          message: 'Failed to delete gallery. Please try again.'
        });
        return;
      }

      setNotification({
        type: 'success',
        title: 'Gallery Deleted',
        message: 'Gallery deleted successfully!'
      });
      
      await fetchGalleries();
    } catch (error) {
      console.error('Error deleting gallery:', error);
      setNotification({
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete gallery. Please try again.'
      });
    }
  };





  // Load bookings, galleries, and contact messages on component mount
  useEffect(() => {
    if (user && profile?.role === 'admin') {
      console.log('🔄 Admin dashboard loading data...');
      fetchBookings();
      fetchGalleries();
      fetchContactMessages();
    }
  }, [user, profile]);

  // Show loading screen while authentication is being checked
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error if not authenticated or not admin
  if (!user || !profile || profile.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">You need admin privileges to access this page.</p>
          <a 
            href="/" 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Home
          </a>
        </div>
      </div>
    );
  }

  // Handle adding MEGA link to booking
  const handleAddMegaLink = async (bookingId: string, megaLink: string) => {
    if (!megaLink.trim()) {
      alert('Please enter a valid MEGA link');
      return;
    }

    setUpdatingStatus(bookingId);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          mega_link: megaLink,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) {
        console.error('Error updating MEGA link:', error);
        setNotification({
          type: 'error',
          title: 'Update Failed',
          message: 'Failed to update MEGA link. Please try again.'
        });
      } else {
        // Update local state
        setBookings(prev => prev.map(booking => 
          booking.id === bookingId 
            ? { ...booking, megaLink: megaLink }
            : booking
        ));

        // Create gallery for this booking
        const galleryCreated = await createGalleryFromBooking(bookingId, megaLink);
        
        setEditingBooking(null);
        setMegaLinkInput('');
        
        if (galleryCreated) {
          setNotification({
            type: 'success',
            title: 'Success',
            message: 'MEGA link added and gallery created successfully!'
          });
        } else {
          setNotification({
            type: 'warning',
            title: 'Partial Success',
            message: 'MEGA link added but gallery creation failed. You can create it manually from the Galleries tab.'
          });
        }
      }
    } catch (error) {
      console.error('Error updating MEGA link:', error);
      setNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update MEGA link. Please try again.'
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Generate QR code for gallery access
  const generateQRCode = (link: string) => {
    setShowQR(link);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage bookings, galleries, and user access</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Welcome back,</p>
                <p className="font-semibold text-gray-900">{profile?.name || user?.email?.split('@')[0]}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                {(profile?.name || user?.email || 'A').charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4 lg:gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 lg:p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-2 sm:mb-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{bookings.length}</p>
              </div>
              <Calendar className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-blue-600 self-end sm:self-auto" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 lg:p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-2 sm:mb-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Pending Bookings</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-yellow-600">
                  {bookings.filter(b => b.status === 'pending').length}
                </p>
              </div>
              <AlertCircle className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-yellow-600 self-end sm:self-auto" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 lg:p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-2 sm:mb-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Completed Events</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">
                  {bookings.filter(b => b.status === 'completed').length}
                </p>
              </div>
              <Camera className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-green-600 self-end sm:self-auto" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 lg:p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-2 sm:mb-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Active Galleries</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600">{galleries.length}</p>
              </div>
              <FileImage className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-purple-600 self-end sm:self-auto" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 lg:p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-2 sm:mb-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Unread Messages</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-600">
                  {contactMessages.filter(msg => msg.status === 'unread').length}
                </p>
              </div>
              <MessageCircle className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-orange-600 self-end sm:self-auto" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 lg:p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-2 sm:mb-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Monthly Earnings</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-emerald-600">
                  {formatCurrency(calculateMonthlyEarnings())}
                </p>
              </div>
              <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-emerald-600 self-end sm:self-auto" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 lg:p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-2 sm:mb-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-indigo-600">
                  {formatCurrency(calculateTotalEarnings())}
                </p>
              </div>
              <IndianRupee className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-indigo-600 self-end sm:self-auto" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('bookings')}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'bookings'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Bookings
              </button>
              <button
                onClick={() => setActiveTab('galleries')}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'galleries'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Event Galleries
              </button>
              <button
                onClick={() => setActiveTab('latest-work')}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'latest-work'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Latest Work
              </button>

              <button
                onClick={() => setActiveTab('messages')}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'messages'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Messages
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'bookings' && (
              <div className="space-y-4">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Bookings</h2>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search bookings..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                      <Filter className="h-4 w-4" />
                      <span>Filter</span>
                    </button>
                    <button 
                      onClick={fetchBookings}
                      disabled={loadingBookings}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loadingBookings ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Calendar className="h-4 w-4" />
                      )}
                      <span>Refresh</span>
                    </button>
                  </div>
                </div>

                {loadingBookings ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading bookings...</p>
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No bookings found</p>
                  </div>
                ) : (
                  bookings.map((booking) => (
                  <div key={booking.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    {/* Event Header */}
                    <div className="mb-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className={`w-3 h-3 rounded-full ${
                          booking.status === 'completed' ? 'bg-green-500' :
                          booking.status === 'confirmed' ? 'bg-blue-500' :
                          booking.status === 'pending' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}></div>
                        <h3 className="text-lg font-semibold text-gray-900">{booking.eventType}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                          booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </div>
                      
                      {/* Action Controls */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Quick Actions for Pending Bookings */}
                        {booking.status === 'pending' && (
                          <>
                            <button
                              onClick={() => acceptBooking(booking.id)}
                              disabled={updatingStatus === booking.id}
                              className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm"
                            >
                              {updatingStatus === booking.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                              <span>Accept</span>
                            </button>
                            <button
                              onClick={() => rejectBooking(booking.id)}
                              disabled={updatingStatus === booking.id}
                              className="flex items-center space-x-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm"
                            >
                              {updatingStatus === booking.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                              <span>Reject</span>
                            </button>
                          </>
                        )}
                        
                        {/* Status Dropdown */}
                        <select
                          value={booking.status}
                          onChange={(e) => updateBookingStatus(booking.id, e.target.value as any)}
                          disabled={updatingStatus === booking.id}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-sm"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        
                        <button
                          onClick={() => setEditingBooking(booking.id)}
                          className="flex items-center space-x-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                        >
                          <Edit3 className="h-4 w-4" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(booking.eventDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4" />
                        <span>{booking.location}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span>Booked {new Date(booking.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>{booking.userProfile?.name || booking.userProfile?.email || 'Unknown User'}</span>
                      </div>
                    </div>

                    {/* Customer Contact Information */}
                    {booking.userProfile && (
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">Customer Information</h4>
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span>{booking.userProfile.email}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span>{booking.userProfile.mobile || 'Not provided'}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {booking.notes && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">{booking.notes}</p>
                      </div>
                    )}

                    {/* Project Value Section - Admin Only */}
                    <div className="bg-emerald-50 rounded-lg p-4 mb-4">
                      <h4 className="font-medium text-emerald-900 mb-3 flex items-center space-x-2">
                        <IndianRupee className="h-4 w-4" />
                        <span>Project Value</span>
                      </h4>
                      
                      {editingProjectValue === booking.id ? (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Project Value (₹)
                            </label>
                            <div className="flex space-x-2">
                              <input
                                type="number"
                                min="0"
                                step="100"
                                value={projectValueInput}
                                onChange={handleProjectValueChange}
                                placeholder="Enter project value in rupees"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                              />
                              <button
                                onClick={() => handleSaveProjectValue(booking.id)}
                                disabled={updatingStatus === booking.id}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                              >
                                {updatingStatus === booking.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                ) : (
                                  'Save'
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  setEditingProjectValue(null);
                                  setProjectValueInput('');
                                }}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-emerald-700">
                            💡 Set the project value to track earnings and revenue
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-semibold text-emerald-800">
                              {booking.projectValue ? formatCurrency(booking.projectValue) : 'Not set'}
                            </span>
                            {booking.status === 'completed' && booking.projectValue && (
                              <span className="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-800 rounded-full">
                                Earned
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              setEditingProjectValue(booking.id);
                              setProjectValueInput(booking.projectValue?.toString() || '');
                            }}
                            className="flex items-center space-x-1 px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors"
                          >
                            <Edit3 className="h-4 w-4" />
                            <span>Edit Value</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Gallery Links Section */}
                    {(booking.galleryLink || booking.megaLink || editingBooking === booking.id) && (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-3">Gallery Access</h4>
                        
                        {editingBooking === booking.id ? (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                MEGA Folder Link
                              </label>
                              <div className="flex space-x-2">
                                <input
                                  type="url"
                                  value={megaLinkInput}
                                  onChange={handleMegaLinkChange}
                                  placeholder="https://mega.nz/folder/..."
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                  onClick={() => handleAddMegaLink(booking.id, megaLinkInput)}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingBooking(null)}
                                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                                >
                                  X
                                </button>
                              </div>
                            </div>
                            <p className="text-xs text-blue-700">
                              💡 Upload photos/videos to MEGA, generate a shared link, and paste it here
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {booking.galleryLink && (
                              <div className="flex items-center justify-between p-2 bg-white rounded border">
                                <div className="flex items-center space-x-2">
                                  <ExternalLink className="h-4 w-4 text-green-600" />
                                  <span className="text-sm">Web Gallery</span>
                                </div>
                                <a
                                  href={booking.galleryLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-green-600 hover:text-green-700 text-sm"
                                >
                                  View →
                                </a>
                              </div>
                            )}
                            {booking.megaLink && (
                              <div className="flex items-center justify-between p-2 bg-white rounded border">
                                <div className="flex items-center space-x-2">
                                  <Download className="h-4 w-4 text-purple-600" />
                                  <span className="text-sm">Download</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => navigator.clipboard.writeText(booking.megaLink!)}
                                    className="text-purple-600 hover:text-purple-700 text-sm"
                                  >
                                    <Copy className="h-4 w-4" />
                                  </button>
                                  <a
                                    href={booking.megaLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-purple-600 hover:text-purple-700 text-sm"
                                  >
                                    Open →
                                  </a>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  ))
                )}
              </div>
            )}



            {activeTab === 'galleries' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Gallery Management</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {galleries.length} {galleries.length === 1 ? 'gallery' : 'galleries'} total
                    </p>
                  </div>
                  <button
                    onClick={fetchGalleries}
                    className="flex items-center w-32 space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Search className="h-4 w-4" />
                    <span>Refresh</span>
                  </button>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">MEGA Integration Workflow</h3>
                  <ol className="text-sm text-blue-800 space-y-1">
                    <li>1. Upload event photos/videos to your MEGA account</li>
                    <li>2. Create a shared folder link in MEGA</li>
                    <li>3. Add the MEGA link to a booking (this automatically creates a gallery)</li>
                    <li>4. Generate QR code for easy mobile access</li>
                    <li>5. Share QR code or direct link with clients</li>
                  </ol>
                </div>

                {loadingGalleries ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading galleries...</p>
                  </div>
                ) : galleries.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <FileImage className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Galleries Yet</h3>
                    <p className="text-gray-600 mb-4">
                      Galleries will appear here once you add MEGA links to your bookings. Go to the Bookings tab and add MEGA links to create galleries automatically.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {galleries.map((gallery) => (
                      <div key={gallery.id} className="border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden">
                        {/* Header Section */}
                        <div className="p-4 sm:p-6">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-3">
                                <h3 className="text-lg font-semibold text-gray-900 truncate">{gallery.title}</h3>
                                <div className="flex items-center gap-2">
                                  <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                                    gallery.isPublic 
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                      : 'bg-gray-50 text-gray-700 border border-gray-200'
                                  }`}>
                                    {gallery.isPublic ? (
                                      <>
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                        Public
                                      </>
                                    ) : (
                                      <>
                                        <div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
                                        Private
                                      </>
                                    )}
                                  </span>
                                </div>
                              </div>
                              
                              {gallery.booking && (
                                <div className="space-y-2">
                                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600">
                                    <span className="flex items-center gap-1" title="Event Date">
                                      <Calendar className="h-4 w-4" />
                                      <span>{new Date(gallery.booking.eventDate).toLocaleDateString()}</span>
                                    </span>
                                    <span className="flex items-center gap-1" title="Location">
                                      <MapPin className="h-4 w-4" />
                                      <span className="truncate max-w-32">{gallery.booking.location}</span>
                                    </span>
                                    <span className="flex items-center gap-1" title="Event Type">
                                      <Camera className="h-4 w-4" />
                                      <span>{gallery.booking.eventType}</span>
                                    </span>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-1" title="Customer">
                                      <Users className="h-4 w-4 flex-shrink-0" />
                                      <span className="text-sm text-gray-900 font-medium">{gallery.booking.customerName}</span>
                                    </div>
                                    <div className="flex items-center gap-1" title="Email">
                                      <Mail className="h-4 w-4 flex-shrink-0" />
                                      <span className="text-sm text-gray-600 break-all">{gallery.booking.customerEmail}</span>
                                    </div>
                                    <div className="flex items-center">
                                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                                        gallery.booking.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                        gallery.booking.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                        gallery.booking.status === 'completed' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                        'bg-gray-50 text-gray-700 border border-gray-200'
                                      }`}>
                                        {gallery.booking.status === 'confirmed' && <Check className="h-3 w-3" />}
                                        {gallery.booking.status === 'pending' && <Clock className="h-3 w-3" />}
                                        {gallery.booking.status === 'completed' && <Check className="h-3 w-3" />}
                                        {gallery.booking.status.charAt(0).toUpperCase() + gallery.booking.status.slice(1)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => deleteGallery(gallery.id)}
                                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Gallery"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* MEGA Link Section */}
                        <div className="border-t border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50">
                          <div className="p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex items-center gap-2">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                  <Download className="h-4 w-4 text-purple-600" />
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-purple-900">MEGA Folder</h4>
                                  <p className="text-xs text-purple-700 font-mono bg-white px-2 py-1 rounded border truncate max-w-xs sm:max-w-md">
                                    {gallery.megaLink.length > 50 ? `${gallery.megaLink.substring(0, 50)}...` : gallery.megaLink}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => navigator.clipboard.writeText(gallery.megaLink)}
                                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-purple-700 bg-white border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
                                  title="Copy MEGA link"
                                >
                                  <Copy className="h-4 w-4" />
                                  <span className="hidden sm:inline">Copy Link</span>
                                </button>
                                <button
                                  onClick={() => generateQRCode(gallery.megaLink)}
                                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                                  title="Generate QR Code"
                                >
                                  <QrCode className="h-4 w-4" />
                                  <span className="hidden sm:inline">QR Code</span>
                                </button>
                                <a
                                  href={gallery.megaLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
                                  title="Open MEGA folder"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  <span className="hidden sm:inline">Open in MEGA</span>
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Footer Stats */}
                        <div className="border-t border-gray-100 px-4 sm:px-6 py-3 bg-gray-50">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-gray-500">
                            <span>
                              Created {new Date(gallery.booking?.eventDate || '').toLocaleDateString()}
                            </span>
                            <span>
                              Gallery ID: {gallery.id.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'latest-work' && (
              <div className="space-y-6">
                <LatestWorkManager />
              </div>
            )}



            {activeTab === 'messages' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Contact Messages</h2>
                  <button
                    onClick={fetchContactMessages}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Search className="h-4 w-4" />
                    <span>Refresh</span>
                  </button>
                </div>

                {loadingMessages ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading contact messages...</p>
                  </div>
                ) : contactMessages.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No contact messages found</p>
                  </div>
                ) : (
                  contactMessages.map((message) => (
                    <div key={message.id} className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{message.name}</h3>
                          <div className="space-y-1">
                            <p className="text-sm text-gray-600 flex items-center space-x-1">
                              <Mail className="h-4 w-4" />
                              <span>{message.email}</span>
                            </p>
                            {extractPhoneNumber(message.message) && (
                              <p className="text-sm text-gray-600 flex items-center space-x-1">
                                <Phone className="h-4 w-4" />
                                <span>{extractPhoneNumber(message.message)}</span>
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                  Available
                                </span>
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {extractPhoneNumber(message.message) && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 flex items-center space-x-1">
                              <Phone className="h-3 w-3" />
                              <span></span>
                            </span>
                          )}
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                            message.status === 'unread' ? 'bg-red-100 text-red-800' :
                            message.status === 'read' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
                          </span>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <p className="text-gray-700 whitespace-pre-wrap">{message.message}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{new Date(message.createdAt).toLocaleDateString()} at {new Date(message.createdAt).toLocaleTimeString()}</span>
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {/* WhatsApp Button */}
                          {extractPhoneNumber(message.message) && (
                            <button
                              onClick={() => handleWhatsAppClick(message)}
                              className="px-3 py-1.5 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 transition-all duration-200 flex items-center space-x-1 shadow-sm hover:shadow-md transform hover:scale-105"
                              title={`WhatsApp ${message.name} at ${extractPhoneNumber(message.message)}`}
                            >
                              <MessageCircle className="h-3 w-3" />
                              <span className="hidden sm:inline">WhatsApp</span>
                              <span className="sm:hidden">Whatsapp</span>
                            </button>
                          )}
                          
                          {/* Call Button */}
                          {extractPhoneNumber(message.message) && (
                            <button
                              onClick={() => handleCallClick(message)}
                              className="px-3 py-1.5 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-all duration-200 flex items-center space-x-1 shadow-sm hover:shadow-md transform hover:scale-105"
                              title={`Call ${message.name} at ${extractPhoneNumber(message.message)}`}
                            >
                              <Phone className="h-3 w-3" />
                              <span className="hidden sm:inline">Call</span>
                            </button>
                          )}
                          
                          {/* Email Reply Button */}
                          <a
                            href={`mailto:${message.email}?subject=Re: Your inquiry&body=Hi ${message.name},%0D%0A%0D%0AThank you for your message. `}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-all duration-200 flex items-center space-x-1 shadow-sm hover:shadow-md transform hover:scale-105"
                            onClick={() => updateMessageStatus(message.id, 'replied')}
                            title={`Email ${message.name} at ${message.email}`}
                          >
                            <Mail className="h-3 w-3" />
                            <span className="hidden sm:inline">Email</span>
                          </a>
                          
                          {/* Mark as Read Button */}
                          {message.status === 'unread' && (
                            <button 
                              onClick={() => updateMessageStatus(message.id, 'read')}
                              className="px-3 py-1.5 bg-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-400 transition-all duration-200 flex items-center space-x-1 shadow-sm hover:shadow-md"
                              title="Mark message as read"
                            >
                              <Check className="h-3 w-3" />
                              <span className="hidden sm:inline">Read</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 text-center max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Gallery Access QR Code</h3>
            <p className="text-sm text-gray-600 mb-6">
              Share this QR code with your client for easy gallery access
            </p>
            
            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <QRCode 
                value={showQR} 
                size={200} 
                level="M"
                includeMargin={true}
                className="mx-auto"
              />
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                <strong>Link:</strong><br />
                <span className="break-all">{showQR}</span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(showQR);
                }}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Copy Link
              </button>
              <button
                onClick={() => setShowQR(null)}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}





      {/* Notification */}
      {notification && (
        <Notification
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
