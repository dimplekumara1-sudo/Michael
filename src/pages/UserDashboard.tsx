import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, MapPin, Clock, Camera, Download, QrCode, Plus, Filter, Search, Smartphone, User, Settings } from 'lucide-react';
import { mockBookings } from '../data/mockData';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Booking, Gallery } from '../types';
import Notification from '../components/Notification';
import ProfileManager from '../components/ProfileManager';
import QRCode from 'qrcode.react';

// Separate BookingForm component to prevent re-renders and focus loss
interface BookingFormProps {
  bookingForm: {
    eventType: string;
    eventDate: string;
    location: string;
    notes: string;
    mobile: string;
  };
  handleFormChange: (field: string, value: string) => void;
  handleSubmitBooking: (e: React.FormEvent) => void;
  submittingBooking: boolean;
  onClose: () => void;
}

const BookingForm: React.FC<BookingFormProps> = React.memo(({ 
  bookingForm, 
  handleFormChange, 
  handleSubmitBooking, 
  submittingBooking, 
  onClose 
}) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-xl max-w-2xl w-full p-6">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">Book New Event</h3>
      <form onSubmit={handleSubmitBooking} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Type *</label>
            <select 
              value={bookingForm.eventType}
              onChange={(e) => handleFormChange('eventType', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select event type</option>
              <option value="Wedding">Wedding</option>
              <option value="Corporate Event">Corporate Event</option>
              <option value="Portrait Session">Portrait Session</option>
              <option value="Birthday Party">Birthday Party</option>
              <option value="Engagement">Engagement</option>
              <option value="Family Portrait">Family Portrait</option>
              <option value="Maternity">Maternity</option>
              <option value="Product Photography">Product Photography</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Date *</label>
            <input 
              type="date" 
              value={bookingForm.eventDate}
              onChange={(e) => handleFormChange('eventDate', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
            <input 
              type="text" 
              value={bookingForm.location}
              onChange={(e) => handleFormChange('location', e.target.value)}
              placeholder="Enter event location"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Mobile 
              <span className="text-sm text-gray-500">(Optional - for booking updates)</span>
            </label>
            <input 
              type="tel" 
              value={bookingForm.mobile}
              onChange={(e) => handleFormChange('mobile', e.target.value)}
              placeholder="Enter your mobile number for updates"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              We'll use this to send you booking updates and confirmations
            </p>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
          <textarea 
            rows={4}
            value={bookingForm.notes}
            onChange={(e) => handleFormChange('notes', e.target.value)}
            placeholder="Any special requirements, preferred time, number of guests, or other details..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
          ></textarea>
        </div>
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={submittingBooking}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center"
          >
            {submittingBooking ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              'Submit Booking Request'
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={submittingBooking}
            className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
));

const UserDashboard = React.memo(() => {
  const { user, profile, isLoading, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('bookings');
  const [showQR, setShowQR] = useState<string | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [userGalleries, setUserGalleries] = useState<Gallery[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [loadingGalleries, setLoadingGalleries] = useState(false);
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [showProfileManager, setShowProfileManager] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    eventType: '',
    eventDate: '',
    location: '',
    notes: '',
    mobile: ''
  });
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
  } | null>(null);

  // Single optimized form handler to prevent re-render issues
  const handleFormChange = useCallback((field: string, value: string) => {
    setBookingForm(prev => ({ ...prev, [field]: value }));
  }, []);

  // Update mobile when profile loads (only when profile changes, not when form changes)
  useEffect(() => {
    if (profile?.mobile && !bookingForm.mobile) {
      setBookingForm(prev => ({ ...prev, mobile: profile.mobile || '' }));
    }
  }, [profile?.mobile]); // Removed bookingForm.mobile from dependencies to prevent re-renders

  // Fetch user's bookings
  const fetchUserBookings = async () => {
    if (!user?.id) return;
    
    setLoadingBookings(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user bookings:', error);
        // Fallback to mock data filtered by user
        setUserBookings(mockBookings.filter(booking => booking.userId === user.id));
      } else {
        // Transform database data to match our Booking interface
        const transformedBookings: Booking[] = data.map(booking => ({
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
          updatedAt: booking.updated_at
        }));
        setUserBookings(transformedBookings);
      }
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      setUserBookings(mockBookings.filter(booking => booking.userId === user.id));
    } finally {
      setLoadingBookings(false);
    }
  };

  // Fetch user's galleries
  const fetchUserGalleries = async () => {
    if (!user?.id) return;
    
    setLoadingGalleries(true);
    try {
      console.log('🔍 Fetching user galleries...');
      
      // Fetch galleries for user's bookings with booking details
      const { data: galleriesData, error: galleriesError } = await supabase
        .from('galleries')
        .select(`
          *,
          bookings:booking_id (
            event_date,
            location,
            event_type,
            status,
            user_id
          )
        `)
        .eq('bookings.user_id', user.id)
        .order('created_at', { ascending: false });

      if (galleriesError) {
        console.error('Error fetching user galleries:', galleriesError);
        setUserGalleries([]);
        return;
      }

      // Transform the data to match Gallery interface
      const transformedGalleries: Gallery[] = galleriesData
        .filter(gallery => gallery.bookings) // Only include galleries with valid bookings
        .map(gallery => ({
          id: gallery.id,
          bookingId: gallery.booking_id,
          title: gallery.title,
          mediaURLs: gallery.media_urls || [],
          isPublic: gallery.is_public,
          megaLink: gallery.mega_link,
          qrCodeData: gallery.qr_code_data,
          // Add booking information for display
          booking: {
            eventDate: gallery.bookings.event_date,
            location: gallery.bookings.location,
            eventType: gallery.bookings.event_type,
            status: gallery.bookings.status,
            customerName: '', // Not needed for user view
            customerEmail: ''  // Not needed for user view
          }
        }));

      console.log('✅ User galleries fetched successfully:', transformedGalleries.length, 'galleries');
      setUserGalleries(transformedGalleries);
    } catch (error) {
      console.error('Unexpected error fetching user galleries:', error);
      setUserGalleries([]);
    } finally {
      setLoadingGalleries(false);
    }
  };

  // Submit new booking
  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    if (!bookingForm.eventType || !bookingForm.eventDate || !bookingForm.location) {
      setNotification({
        type: 'error',
        title: 'Missing Information',
        message: 'Please fill in all required fields (Event Type, Date, and Location).'
      });
      return;
    }

    setSubmittingBooking(true);
    try {
      // Update user profile with mobile if provided and different
      if (bookingForm.mobile && bookingForm.mobile !== profile?.mobile) {
        await updateProfile({ mobile: bookingForm.mobile });
      }

      const { error } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          event_type: bookingForm.eventType,
          event_date: bookingForm.eventDate,
          location: bookingForm.location,
          notes: bookingForm.notes || null,
          status: 'pending'
        });

      if (error) {
        console.error('Error submitting booking:', error);
        setNotification({
          type: 'error',
          title: 'Booking Failed',
          message: 'Failed to submit booking. Please try again.'
        });
      } else {
        setNotification({
          type: 'success',
          title: 'Booking Submitted',
          message: 'Booking submitted successfully! We will review and get back to you soon.'
        });
        setShowBookingForm(false);
        setBookingForm({
          eventType: '',
          eventDate: '',
          location: '',
          notes: '',
          mobile: profile?.mobile || ''
        });
        // Refresh bookings
        fetchUserBookings();
      }
    } catch (error) {
      console.error('Error submitting booking:', error);
      setNotification({
        type: 'error',
        title: 'Booking Failed',
        message: 'Failed to submit booking. Please try again.'
      });
    } finally {
      setSubmittingBooking(false);
    }
  };

  // Load user bookings and galleries on component mount
  useEffect(() => {
    if (user?.id) {
      fetchUserBookings();
      fetchUserGalleries();
    }
  }, [user?.id]);

  // Show loading while authentication is being checked
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">Please login to access your dashboard.</p>
          <a 
            href="/login" 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          {/* User Info Section */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-semibold">
              {(profile?.name || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome back, {profile?.name || user?.email?.split('@')[0]}!</h1>
              <p className="text-gray-600">Manage your bookings and view your galleries</p>
            </div>
          </div>
          
          {/* Action Buttons Section */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowProfileManager(true)}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
            >
              <Settings className="h-4 w-4" />
              <span>Profile</span>
            </button>
            <button
              onClick={() => setShowBookingForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Book Event</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{userBookings.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {userBookings.filter(b => b.status === 'pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Confirmed</p>
                <p className="text-2xl font-bold text-blue-600">
                  {userBookings.filter(b => b.status === 'confirmed').length}
                </p>
              </div>
              <Camera className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {userBookings.filter(b => b.status === 'completed').length}
                </p>
              </div>
              <Download className="h-8 w-8 text-green-600" />
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
                My Bookings
              </button>
              <button
                onClick={() => setActiveTab('galleries')}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'galleries'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                My Galleries
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'bookings' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">My Bookings</h2>
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
                      onClick={fetchUserBookings}
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
                    <p className="text-gray-600">Loading your bookings...</p>
                  </div>
                ) : userBookings.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No bookings found</p>
                    <button
                      onClick={() => setShowBookingForm(true)}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Book Your First Event
                    </button>
                  </div>
                ) : (
                  userBookings.map((booking) => (
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
                        {booking.megaLink && (
                          <button
                            onClick={() => setShowQR(booking.megaLink!)}
                            className="flex items-center space-x-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            <QrCode className="h-4 w-4" />
                            <span>View QR</span>
                          </button>
                        )}
                      </div>
                      <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
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
                      </div>
                      {booking.notes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">{booking.notes}</p>
                        </div>
                      )}
                      {booking.megaLink && (
                        <div className="mt-4 p-4 bg-green-50 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <Camera className="h-4 w-4 text-green-600" />
                              <span className="text-sm text-green-800 font-medium">Event Gallery Available</span>
                            </div>
                            <button
                              onClick={() => setShowQR(booking.megaLink!)}
                              className="flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-xs"
                            >
                              <QrCode className="h-3 w-3" />
                              <span>QR</span>
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <a
                              href={booking.megaLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center space-x-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                            >
                              <Download className="h-4 w-4" />
                              <span>Download Photos</span>
                            </a>
                          </div>
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
                  <h2 className="text-xl font-bold text-gray-900">My Galleries</h2>
                  <button
                    onClick={fetchUserGalleries}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Search className="h-4 w-4" />
                    <span>Refresh</span>
                  </button>
                </div>

                {loadingGalleries ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your galleries...</p>
                  </div>
                ) : userGalleries.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Galleries Yet</h3>
                    <p className="text-gray-600 mb-4">
                      Your photo galleries will appear here once your events are completed and photos are uploaded.
                    </p>
                    <p className="text-sm text-gray-500">
                      Have a confirmed booking? Your photographer will add photos after your event.
                    </p>
                  </div>
                ) : (
                  userGalleries.map((gallery) => (
                    <div key={gallery.id} className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{gallery.title}</h3>
                          {gallery.booking && (
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                              <span className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(gallery.booking.eventDate).toLocaleDateString()}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <MapPin className="h-4 w-4" />
                                <span>{gallery.booking.location}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Camera className="h-4 w-4" />
                                <span>{gallery.booking.eventType}</span>
                              </span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => setShowQR(gallery.megaLink)}
                          className="flex items-center space-x-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <QrCode className="h-4 w-4" />
                          <span>QR Code</span>
                        </button>
                      </div>

                      {/* Gallery Preview */}
                      {gallery.mediaURLs && gallery.mediaURLs.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          {gallery.mediaURLs.slice(0, 4).map((url, index) => (
                            <img
                              key={index}
                              src={url}
                              alt={`Gallery item ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                          ))}
                          {gallery.mediaURLs.length > 4 && (
                            <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                              <span className="text-gray-500 text-sm">+{gallery.mediaURLs.length - 4} more</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded-lg p-8 mb-4 text-center">
                          <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-600 text-sm">Photos will be added here after your event</p>
                        </div>
                      )}

                      {/* Gallery Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <span className="text-sm text-gray-600">
                          {gallery.mediaURLs?.length || 0} photos available
                        </span>
                        <div className="flex items-center space-x-2">
                          <a
                            href={gallery.megaLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                          >
                            <Download className="h-4 w-4" />
                            <span>Download All</span>
                          </a>
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
              Scan this QR code with your phone to access the gallery
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
                  setNotification({
                    type: 'success',
                    title: 'Link Copied',
                    message: 'Gallery link copied to clipboard!'
                  });
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

      {/* Booking Form Modal */}
      {showBookingForm && (
        <BookingForm 
          bookingForm={bookingForm}
          handleFormChange={handleFormChange}
          handleSubmitBooking={handleSubmitBooking}
          submittingBooking={submittingBooking}
          onClose={() => setShowBookingForm(false)}
        />
      )}

      {/* Profile Manager Modal */}
      {showProfileManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <ProfileManager onClose={() => setShowProfileManager(false)} />
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
});

export default UserDashboard;