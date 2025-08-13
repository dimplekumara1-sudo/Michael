import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Phone, ChevronLeft, ChevronRight, Plus, Filter, User } from 'lucide-react';
import { useUpcomingEvents } from '../hooks/useEvents';
import { Booking } from '../types';

interface EventCalendarProps {
  onEventClick?: (event: Booking) => void;
  onAddEvent?: () => void;
  compact?: boolean;
}

const EventCalendar: React.FC<EventCalendarProps> = ({ 
  onEventClick, 
  onAddEvent, 
  compact = false 
}) => {
  const { upcomingEvents, loading, error, refreshUpcomingEvents } = useUpcomingEvents(compact ? 5 : 10);
  const [currentDate, setCurrentDate] = useState(new Date());

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventTypeColor = (eventType: string) => {
    const colors = {
      'Wedding': 'border-l-pink-500',
      'Corporate Event': 'border-l-blue-500',
      'Birthday Party': 'border-l-purple-500',
      'Engagement': 'border-l-red-500',
      'Portrait Session': 'border-l-green-500',
      'Fashion': 'border-l-indigo-500',
      'Product': 'border-l-orange-500',
      'Event': 'border-l-teal-500'
    };
    return colors[eventType as keyof typeof colors] || 'border-l-gray-500';
  };

  const isToday = (dateString: string) => {
    const eventDate = new Date(dateString);
    const today = new Date();
    return eventDate.toDateString() === today.toDateString();
  };

  const isUpcoming = (dateString: string) => {
    const eventDate = new Date(dateString);
    const today = new Date();
    return eventDate > today;
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm ${compact ? 'p-4' : 'p-6'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`font-semibold text-gray-900 ${compact ? 'text-sm' : 'text-lg'}`}>
            Upcoming Events
          </h3>
          <Calendar className={`text-gray-400 ${compact ? 'h-4 w-4' : 'h-5 w-5'}`} />
        </div>
        <div className="space-y-3">
          {Array.from({ length: compact ? 3 : 5 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm ${compact ? 'p-4' : 'p-6'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`font-semibold text-gray-900 ${compact ? 'text-sm' : 'text-lg'}`}>
            Upcoming Events
          </h3>
          <Calendar className={`text-gray-400 ${compact ? 'h-4 w-4' : 'h-5 w-5'}`} />
        </div>
        <div className="text-center py-4">
          <p className="text-red-600 text-sm">Failed to load events</p>
          <button
            onClick={refreshUpcomingEvents}
            className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm ${compact ? 'p-4' : 'p-6'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className={`font-semibold text-gray-900 ${compact ? 'text-sm' : 'text-lg'}`}>
          Upcoming Events
        </h3>
        <div className="flex items-center space-x-2">
          {onAddEvent && (
            <button
              onClick={onAddEvent}
              className={`text-blue-600 hover:text-blue-700 ${compact ? 'p-1' : 'p-2'}`}
              title="Add Event"
            >
              <Plus className={compact ? 'h-3 w-3' : 'h-4 w-4'} />
            </button>
          )}
          <Calendar className={`text-gray-400 ${compact ? 'h-4 w-4' : 'h-5 w-5'}`} />
        </div>
      </div>

      {/* Events List */}
      {upcomingEvents.length === 0 ? (
        <div className="text-center py-6">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No upcoming events</p>
          {onAddEvent && (
            <button
              onClick={onAddEvent}
              className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
            >
              Add your first event
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {upcomingEvents.map((event) => (
            <div
              key={event.id}
              onClick={() => onEventClick?.(event)}
              className={`border-l-4 ${getEventTypeColor(event.eventType)} bg-gray-50 p-3 rounded-r-lg cursor-pointer hover:bg-gray-100 transition-colors ${
                compact ? 'text-xs' : 'text-sm'
              }`}
            >
              {/* Event Title and Status */}
              <div className="flex items-start justify-between mb-2">
                <h4 className={`font-medium text-gray-900 ${compact ? 'text-xs' : 'text-sm'} line-clamp-2`}>
                  {event.eventType} - {event.userProfile?.name || 'Client'}
                </h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                  {event.status}
                </span>
              </div>

              {/* Event Details */}
              <div className="space-y-1">
                {/* Date */}
                <div className="flex items-center text-gray-600">
                  <Calendar className={`mr-2 ${compact ? 'h-3 w-3' : 'h-4 w-4'}`} />
                  <span className={`${compact ? 'text-xs' : 'text-sm'}`}>
                    {formatDate(event.eventDate)}
                    {isToday(event.eventDate) && (
                      <span className="ml-1 text-blue-600 font-medium">(Today)</span>
                    )}
                  </span>
                </div>

                {/* Location */}
                <div className="flex items-center text-gray-600">
                  <MapPin className={`mr-2 ${compact ? 'h-3 w-3' : 'h-4 w-4'}`} />
                  <span className={`${compact ? 'text-xs' : 'text-sm'} line-clamp-1`}>
                    {event.location}
                  </span>
                </div>

                {/* Client Info */}
                {event.userProfile && (
                  <div className="flex items-center text-gray-600">
                    <User className={`mr-2 ${compact ? 'h-3 w-3' : 'h-4 w-4'}`} />
                    <span className={`${compact ? 'text-xs' : 'text-sm'}`}>
                      {event.userProfile.name || event.userProfile.email}
                    </span>
                  </div>
                )}

                {/* Phone */}
                {event.userProfile?.mobile && (
                  <div className="flex items-center text-gray-600">
                    <Phone className={`mr-2 ${compact ? 'h-3 w-3' : 'h-4 w-4'}`} />
                    <span className={`${compact ? 'text-xs' : 'text-sm'}`}>
                      {event.userProfile.mobile}
                    </span>
                  </div>
                )}

                {/* Event Type */}
                <div className="flex items-center justify-between mt-2">
                  <span className={`px-2 py-1 bg-white rounded text-gray-700 font-medium ${compact ? 'text-xs' : 'text-sm'}`}>
                    {event.eventType}
                  </span>
                  {isUpcoming(event.eventDate) && (
                    <span className="text-green-600 text-xs font-medium">
                      Upcoming
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View All Link */}
      {upcomingEvents.length > 0 && compact && (
        <div className="mt-4 text-center">
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            View All Events
          </button>
        </div>
      )}
    </div>
  );
};

export default EventCalendar;