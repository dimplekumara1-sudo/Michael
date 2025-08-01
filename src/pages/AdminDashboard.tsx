import React, { useState, useEffect } from 'react';
import { Gallery } from '../types/Gallery';
import { ContactMessage } from '../types/ContactMessage';
import { Calendar, MapPin, Clock, Camera, Download, QrCode, Plus, Filter, Search, ExternalLink, Upload, Edit3, Trash2, Users, FileImage, Link, Copy, Check, X, AlertCircle, Phone, Mail } from 'lucide-react';
// Removed mock data imports - using real database data
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Booking } from '../types';
import Notification from '../components/Notification';
import QRCode from 'qrcode.react';

const AdminDashboard = () => {
  const { user, profile, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('bookings');
  const [showQR, setShowQR] = useState<string | null>(null);
  const [editingBooking, setEditingBooking] = useState<string | null>(null);
  const [megaLinkInput, setMegaLinkInput] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
const [galleries, setGalleries] = useState<Gallery[]>([]);
const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
  } | null>(null);

  // Fetch bookings from database with user information
  const fetchBookings = async () => {
    setLoadingBookings(true);
    try {
      // First get all bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        setBookings([]);
        return;
      }

      // Then get user information for each booking using the user_profiles view
      const bookingsWithUserData = await Promise.all(
        bookingsData.map(async (booking) => {
          try {
            // Try to get user profile from the user_profiles view
            const { data: userProfile, error: userError } = await supabase
              .from('user_profiles')
              .select('name, email, mobile')
              .eq('id', booking.user_id)
              .single();

            let finalUserProfile = {
              name: 'User',
              email: '',
              mobile: booking.mobile || null
            };

            if (!userError && userProfile) {
              finalUserProfile = {
                name: userProfile.name || 'User',
                email: userProfile.email || '',
                mobile: userProfile.mobile || booking.mobile || null
              };
            }

            return {
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
              createdAt: booking.created_at,
              userProfile: finalUserProfile
            };
          } catch (userFetchError) {
            console.error('Error fetching user data for booking:', booking.id, userFetchError);
            // Fallback with booking mobile data
            return {
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
              createdAt: booking.created_at,
              userProfile: {
                name: 'User',
                email: '',
                mobile: booking.mobile || null
              }
            };
          }
        })
      );

      setBookings(bookingsWithUserData);
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

  // Load bookings on component mount
  useEffect(() => {
    if (user && profile?.role === 'admin') {
      fetchBookings();
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
        setEditingBooking(null);
        setMegaLinkInput('');
        setNotification({
          type: 'success',
          title: 'MEGA Link Updated',
          message: 'MEGA link updated successfully!'
        });
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Bookings</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {bookings.filter(b => b.status === 'pending').length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed Events</p>
                <p className="text-2xl font-bold text-green-600">
                  {bookings.filter(b => b.status === 'completed').length}
                </p>
              </div>
              <Camera className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Galleries</p>
                <p className="text-2xl font-bold text-purple-600">{galleries.length}</p>
              </div>
              <FileImage className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Messages</p>
                <p className="text-2xl font-bold text-orange-600">{contactMessages.length}</p>
              </div>
              <Users className="h-8 w-8 text-orange-600" />
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
                Event Bookings
              </button>
              <button
                onClick={() => setActiveTab('galleries')}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'galleries'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Gallery Management
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
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Event Bookings</h2>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search bookings..."
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
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
                      <div className="flex items-center space-x-2">
                        {/* Quick Actions for Pending Bookings */}
                        {booking.status === 'pending' && (
                          <>
                            <button
                              onClick={() => acceptBooking(booking.id)}
                              disabled={updatingStatus === booking.id}
                              className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
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
                              className="flex items-center space-x-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
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
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        
                        <button
                          onClick={() => setEditingBooking(booking.id)}
                          className="flex items-center space-x-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
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
                                  onChange={(e) => setMegaLinkInput(e.target.value)}
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
                                  Cancel
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
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Gallery Management</h2>
                  <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Upload className="h-4 w-4" />
                    <span>Upload to MEGA</span>
                  </button>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">MEGA Integration Workflow</h3>
                  <ol className="text-sm text-blue-800 space-y-1">
                    <li>1. Upload event photos/videos to your MEGA account</li>
                    <li>2. Create a shared folder link in MEGA</li>
                    <li>3. Paste the link in the booking's gallery section</li>
                    <li>4. Generate QR code for easy mobile access</li>
                    <li>5. Share QR code or direct link with clients</li>
                  </ol>
                </div>

                {mockGalleries.map((gallery) => (
                  <div key={gallery.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{gallery.title}</h3>
                      <div className="flex items-center space-x-2">
                        <button className="flex items-center space-x-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                          <Edit3 className="h-4 w-4" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      {gallery.mediaURLs.slice(0, 4).map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Gallery item ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                      ))}
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-gray-600">
                        {gallery.mediaURLs.length} items • Event ID: {gallery.bookingId}
                      </span>
                    </div>

                    {gallery.megaLink && (
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Download className="h-4 w-4 text-purple-600" />
                            <span className="text-sm font-medium text-purple-800">Download Available</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => navigator.clipboard.writeText(gallery.megaLink!)}
                              className="text-purple-600 hover:text-purple-700"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                            <a
                              href={gallery.megaLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-600 hover:text-purple-700 text-sm"
                            >
                              Open MEGA →
                            </a>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'messages' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Contact Messages</h2>
                {mockContactMessages.map((message) => (
                  <div key={message.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{message.name}</h3>
                        <p className="text-sm text-gray-600">{message.email}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        message.status === 'unread' ? 'bg-red-100 text-red-800' :
                        message.status === 'read' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-4">{message.message}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {new Date(message.createdAt).toLocaleDateString()}
                      </span>
                      <div className="flex space-x-2">
                        <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors">
                          Reply
                        </button>
                        <button className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400 transition-colors">
                          Mark as Read
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
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
