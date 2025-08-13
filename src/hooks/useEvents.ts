import { useState, useEffect, useCallback } from 'react';
import { Booking } from '../types';
import { EventsService, EventFilters } from '../services/eventsService';

export const useEvents = (filters?: EventFilters) => {
  const [events, setEvents] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await EventsService.getEvents(filters);
      setEvents(data);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const refreshEvents = () => {
    fetchEvents();
  };

  return {
    events,
    loading,
    error,
    refreshEvents
  };
};

export const useUpcomingEvents = (
  limit: number = 10, 
  daysAhead: number = 365, 
  includeAllStatuses: boolean = true
) => {
  const [upcomingEvents, setUpcomingEvents] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUpcomingEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await EventsService.getUpcomingEvents(limit, daysAhead, includeAllStatuses);
      setUpcomingEvents(data);
    } catch (err) {
      console.error('Error fetching upcoming events:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch upcoming events');
    } finally {
      setLoading(false);
    }
  }, [limit, daysAhead, includeAllStatuses]);

  useEffect(() => {
    fetchUpcomingEvents();
  }, [fetchUpcomingEvents]);

  return {
    upcomingEvents,
    loading,
    error,
    refreshUpcomingEvents: fetchUpcomingEvents
  };
};

export const useEventTypes = () => {
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEventTypes = async () => {
      try {
        setLoading(true);
        setError(null);
        const types = await EventsService.getEventTypes();
        setEventTypes(types);
      } catch (err) {
        console.error('Error fetching event types:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch event types');
      } finally {
        setLoading(false);
      }
    };

    fetchEventTypes();
  }, []);

  return {
    eventTypes,
    loading,
    error
  };
};