import { supabase } from '../lib/supabase';
import { Booking } from '../types';

export interface EventFilters {
  event_type?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export class EventsService {
  // Get all events (bookings) with optional filters
  static async getEvents(filters?: EventFilters): Promise<Booking[]> {
    try {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          profiles:user_id (
            name,
            email,
            mobile
          )
        `)
        .order('event_date', { ascending: true });

      // Apply filters
      if (filters?.event_type) {
        query = query.eq('event_type', filters.event_type);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.date_from) {
        query = query.gte('event_date', filters.date_from);
      }

      if (filters?.date_to) {
        query = query.lte('event_date', filters.date_to);
      }

      if (filters?.search) {
        query = query.or(`event_type.ilike.%${filters.search}%,location.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching events:', error);
        throw error;
      }

      // Transform the data to match Booking interface
      const transformedBookings: Booking[] = data?.map(booking => ({
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
        updatedAt: booking.updated_at,
        userProfile: booking.profiles ? {
          name: booking.profiles.name || 'User',
          email: booking.profiles.email || '',
          mobile: booking.profiles.mobile || null
        } : undefined
      })) || [];

      return transformedBookings;
    } catch (error) {
      console.error('Error in getEvents:', error);
      throw error;
    }
  }

  // Get events for a specific date range (useful for calendar view)
  static async getEventsByDateRange(startDate: string, endDate: string): Promise<Booking[]> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          profiles:user_id (
            name,
            email,
            mobile
          )
        `)
        .gte('event_date', startDate)
        .lte('event_date', endDate)
        .order('event_date', { ascending: true });

      if (error) {
        console.error('Error fetching events by date range:', error);
        throw error;
      }

      // Transform the data to match Booking interface
      const transformedBookings: Booking[] = data?.map(booking => ({
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
        updatedAt: booking.updated_at,
        userProfile: booking.profiles ? {
          name: booking.profiles.name || 'User',
          email: booking.profiles.email || '',
          mobile: booking.profiles.mobile || null
        } : undefined
      })) || [];

      return transformedBookings;
    } catch (error) {
      console.error('Error in getEventsByDateRange:', error);
      throw error;
    }
  }

  // Get upcoming events (configurable date range and status filter)
  static async getUpcomingEvents(
    limit: number = 10, 
    daysAhead: number = 365, 
    includeAllStatuses: boolean = true
  ): Promise<Booking[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const futureDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      let query = supabase
        .from('bookings')
        .select(`
          *,
          profiles:user_id (
            name,
            email,
            mobile
          )
        `)
        .gte('event_date', today)
        .lte('event_date', futureDate)
        .order('event_date', { ascending: true });

      // Only filter by status if not including all statuses
      if (!includeAllStatuses) {
        query = query.in('status', ['pending', 'confirmed']);
      }

      if (limit > 0) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching upcoming events:', error);
        throw error;
      }

      // Transform the data to match Booking interface
      const transformedBookings: Booking[] = data?.map(booking => ({
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
        updatedAt: booking.updated_at,
        userProfile: booking.profiles ? {
          name: booking.profiles.name || 'User',
          email: booking.profiles.email || '',
          mobile: booking.profiles.mobile || null
        } : undefined
      })) || [];

      return transformedBookings;
    } catch (error) {
      console.error('Error in getUpcomingEvents:', error);
      throw error;
    }
  }

  // Get event by ID
  static async getEventById(id: string): Promise<Booking | null> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          profiles:user_id (
            name,
            email,
            mobile
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching event by ID:', error);
        throw error;
      }

      // Transform the data to match Booking interface
      const transformedBooking: Booking = {
        id: data.id,
        userId: data.user_id,
        eventDate: data.event_date,
        location: data.location,
        eventType: data.event_type,
        status: data.status,
        galleryLink: data.gallery_link,
        megaLink: data.mega_link,
        qrCode: data.qr_code,
        notes: data.notes,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        userProfile: data.profiles ? {
          name: data.profiles.name || 'User',
          email: data.profiles.email || '',
          mobile: data.profiles.mobile || null
        } : undefined
      };

      return transformedBooking;
    } catch (error) {
      console.error('Error in getEventById:', error);
      throw error;
    }
  }

  // Note: Create, update, and delete operations are handled by the existing booking management system

  // Get unique event types
  static async getEventTypes(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('event_type')
        .not('event_type', 'is', null);

      if (error) {
        console.error('Error fetching event types:', error);
        throw error;
      }

      const uniqueTypes = [...new Set(data?.map(item => item.event_type) || [])];
      return uniqueTypes.sort();
    } catch (error) {
      console.error('Error in getEventTypes:', error);
      throw error;
    }
  }

  // Get events count by status
  static async getEventsCountByStatus(): Promise<Record<string, number>> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('status');

      if (error) {
        console.error('Error fetching events count by status:', error);
        throw error;
      }

      const counts: Record<string, number> = {
        pending: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0
      };

      data?.forEach(booking => {
        if (booking.status && counts.hasOwnProperty(booking.status)) {
          counts[booking.status]++;
        }
      });

      return counts;
    } catch (error) {
      console.error('Error in getEventsCountByStatus:', error);
      throw error;
    }
  }
}