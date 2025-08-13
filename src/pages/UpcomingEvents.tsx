import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Phone, User, Grid3X3, List, CalendarDays, Filter, Search, ChevronLeft, ChevronRight, RefreshCw, MessageCircle } from 'lucide-react';
import { useUpcomingEvents } from '../hooks/useEvents';
import { Booking } from '../types';

type ViewMode = 'grid' | 'list' | 'calendar';

const UpcomingEvents: React.FC = () => {
  const { upcomingEvents, loading, error, refreshUpcomingEvents } = useUpcomingEvents(100, 365, true); // Get more events for the dedicated page, 1 year ahead, all statuses
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Filter events based on search and filters
  const filteredEvents = upcomingEvents.filter(event => {
    const matchesSearch = searchTerm === '' || 
      event.eventType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (event.userProfile?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    const matchesEventType = eventTypeFilter === 'all' || event.eventType === eventTypeFilter;
    
    return matchesSearch && matchesStatus && matchesEventType;
  });

  // Get unique event types for filter
  const eventTypes = Array.from(new Set(upcomingEvents.map(event => event.eventType))).sort();

  // Phone and WhatsApp utility functions
  const formatPhoneForDisplay = (phone: string): string => {
    // Remove any non-digit characters except +
    const cleaned = phone.replace(/[^\d+]/g, '');
    
    // Format for display (Indian format)
    if (cleaned.startsWith('+91')) {
      const number = cleaned.substring(3);
      if (number.length === 10) {
        return `+91 ${number.substring(0, 5)} ${number.substring(5)}`;
      }
    }
    return cleaned;
  };

  const formatPhoneForWhatsApp = (phone: string): string => {
    // Remove any non-digit characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    // If it doesn't start with +, assume it's an Indian number and add +91
    if (!cleaned.startsWith('+')) {
      // If it starts with 91, don't add another 91
      if (cleaned.startsWith('91') && cleaned.length > 10) {
        cleaned = '+' + cleaned;
      } else {
        cleaned = '+91' + cleaned;
      }
    }
    
    return cleaned.replace('+', '');
  };

  const handlePhoneCall = (phone: string) => {
    const callUrl = `tel:${phone}`;
    window.location.href = callUrl;
  };

  const handleWhatsAppMessage = (phone: string, clientName: string, eventType: string, eventDate: string) => {
    const whatsappNumber = formatPhoneForWhatsApp(phone);
    const message = `Hi ${clientName}, this is from Micheal photographs regarding your ${eventType} event scheduled for ${formatDate(eventDate)}. How can I assist you?`;
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const isToday = (dateString: string) => {
    const today = new Date();
    const eventDate = new Date(dateString);
    return today.toDateString() === eventDate.toDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEventTypeColor = (eventType: string) => {
    const colors = {
      'Wedding': 'border-l-pink-500 bg-pink-50',
      'Corporate Event': 'border-l-blue-500 bg-blue-50',
      'Birthday Party': 'border-l-purple-500 bg-purple-50',
      'Engagement': 'border-l-red-500 bg-red-50',
      'Portrait Session': 'border-l-green-500 bg-green-50',
      'Fashion': 'border-l-indigo-500 bg-indigo-50',
      'Product': 'border-l-orange-500 bg-orange-50',
      'Event': 'border-l-teal-500 bg-teal-50'
    };
    return colors[eventType as keyof typeof colors] || 'border-l-gray-500 bg-gray-50';
  };

  // Calendar view helpers
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getEventsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return filteredEvents.filter(event => {
      // Handle both date formats that might come from the database
      const eventDateString = event.eventDate.split('T')[0];
      return eventDateString === dateString;
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('UpcomingEvents error:', error);
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="text-red-600 text-xl mb-4">Error loading events</div>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Debug logging
  console.log('UpcomingEvents - Total events loaded:', upcomingEvents.length);
  console.log('UpcomingEvents - Filtered events:', filteredEvents.length);
  console.log('UpcomingEvents - Sample event:', upcomingEvents[0]);

  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {filteredEvents.map((event) => (
        <div
          key={event.id}
          className={`border-l-4 ${getEventTypeColor(event.eventType)} bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 sm:p-6`}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-2">
              {event.eventType}
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(event.status)}`}>
              {event.status}
            </span>
          </div>

          {/* Event Details */}
          <div className="space-y-2 text-sm">
            {/* Client */}
            <div className="flex items-center text-gray-600">
              <User className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">{event.userProfile?.name || 'Client'}</span>
            </div>

            {/* Date */}
            <div className="flex items-center text-gray-600">
              <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">
                {formatDate(event.eventDate)}
                {isToday(event.eventDate) && (
                  <span className="ml-1 text-blue-600 font-medium">(Today)</span>
                )}
              </span>
            </div>

            {/* Location */}
            <div className="flex items-center text-gray-600">
              <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>

            {/* Phone & WhatsApp */}
            {event.userProfile?.mobile && (
              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-600 flex-1 min-w-0">
                  <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate text-xs">{formatPhoneForDisplay(event.userProfile.mobile)}</span>
                </div>
                <div className="flex items-center space-x-1 ml-2">
                  <button
                    onClick={() => handlePhoneCall(event.userProfile!.mobile!)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Call"
                  >
                    <Phone className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleWhatsAppMessage(
                      event.userProfile!.mobile!, 
                      event.userProfile?.name || 'Client',
                      event.eventType,
                      event.eventDate
                    )}
                    className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                    title="WhatsApp"
                  >
                    <MessageCircle className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="divide-y divide-gray-200">
        {filteredEvents.map((event) => (
          <div
            key={event.id}
            className={`border-l-4 ${getEventTypeColor(event.eventType)} p-4 sm:p-6 hover:bg-gray-50 transition-colors`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              {/* Main Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="font-semibold text-gray-900 text-base sm:text-lg">
                    {event.eventType}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(event.status)}`}>
                    {event.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 text-sm text-gray-600">
                  {/* Client */}
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{event.userProfile?.name || 'Client'}</span>
                  </div>

                  {/* Date */}
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">
                      {formatDate(event.eventDate)}
                      {isToday(event.eventDate) && (
                        <span className="ml-1 text-blue-600 font-medium">(Today)</span>
                      )}
                    </span>
                  </div>

                  {/* Location */}
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{event.location}</span>
                  </div>

                  {/* Phone & WhatsApp */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1 min-w-0">
                      <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">
                        {event.userProfile?.mobile ? formatPhoneForDisplay(event.userProfile.mobile) : 'N/A'}
                      </span>
                    </div>
                    {event.userProfile?.mobile && (
                      <div className="flex items-center space-x-1 ml-2">
                        <button
                          onClick={() => handlePhoneCall(event.userProfile!.mobile!)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Call"
                        >
                          <Phone className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleWhatsAppMessage(
                            event.userProfile!.mobile!, 
                            event.userProfile?.name || 'Client',
                            event.eventType,
                            event.eventDate
                          )}
                          className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="WhatsApp"
                        >
                          <MessageCircle className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCalendarView = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 sm:h-32"></div>);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const eventsForDay = getEventsForDate(date);
      const isCurrentDay = isToday(date.toISOString().split('T')[0]);

      days.push(
        <div
          key={day}
          className={`h-24 sm:h-32 border border-gray-200 p-1 sm:p-2 overflow-hidden ${
            isCurrentDay ? 'bg-blue-50 border-blue-300' : 'bg-white hover:bg-gray-50'
          }`}
        >
          <div className={`text-sm font-medium mb-1 ${isCurrentDay ? 'text-blue-600' : 'text-gray-900'}`}>
            {day}
          </div>
          <div className="space-y-1">
            {eventsForDay.slice(0, 2).map((event) => (
              <div
                key={event.id}
                className={`text-xs p-1 rounded border-l-2 ${getEventTypeColor(event.eventType)} truncate group relative`}
                title={`${event.eventType} - ${event.userProfile?.name || 'Client'}${event.userProfile?.mobile ? ` - ${formatPhoneForDisplay(event.userProfile.mobile)}` : ''}`}
              >
                <div className="font-medium truncate">{event.eventType}</div>
                <div className="flex items-center justify-between">
                  <div className="text-gray-600 truncate flex-1">{event.userProfile?.name || 'Client'}</div>
                  {event.userProfile?.mobile && (
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePhoneCall(event.userProfile!.mobile!);
                        }}
                        className="p-0.5 text-blue-600 hover:bg-blue-100 rounded"
                        title="Call"
                      >
                        <Phone className="h-2 w-2" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWhatsAppMessage(
                            event.userProfile!.mobile!, 
                            event.userProfile?.name || 'Client',
                            event.eventType,
                            event.eventDate
                          );
                        }}
                        className="p-0.5 text-green-600 hover:bg-green-100 rounded"
                        title="WhatsApp"
                      >
                        <MessageCircle className="h-2 w-2" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {eventsForDay.length > 2 && (
              <div className="text-xs text-gray-500 font-medium">
                +{eventsForDay.length - 2} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Calendar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="p-2 sm:p-3 text-center text-sm font-medium text-gray-700 bg-gray-50">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {days}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Upcoming Events
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600">
            View and manage your upcoming photography events ({filteredEvents.length} events)
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search events, clients, locations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-2 sm:gap-4">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <select
                  value={eventTypeFilter}
                  onChange={(e) => setEventTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="all">All Types</option>
                  {eventTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Refresh Button and View Mode Toggle */}
            <div className="flex items-center space-x-3">
              <button
                onClick={refreshUpcomingEvents}
                disabled={loading}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid3X3 className="h-4 w-4" />
                <span className="hidden sm:inline">Grid</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">List</span>
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'calendar'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <CalendarDays className="h-4 w-4" />
                <span className="hidden sm:inline">Calendar</span>
              </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' || eventTypeFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No upcoming events scheduled'}
            </p>
          </div>
        ) : (
          <>
            {viewMode === 'grid' && renderGridView()}
            {viewMode === 'list' && renderListView()}
            {viewMode === 'calendar' && renderCalendarView()}
          </>
        )}
      </div>
    </div>
  );
};

export default UpcomingEvents;