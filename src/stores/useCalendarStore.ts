import { create } from 'zustand';
import api from '../lib/api';
import { googleCalendarService, getGoogleCalendarConfig } from '../lib/googleCalendar';

export interface CalendarEvent {
  _id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  location?: string;
  type: 'event' | 'task';
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  color: string;
  userId: string;
  noteId?: {
    _id: string;
    title: string;
  };

  recurring?: {
    frequency: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: string;
    daysOfWeek?: number[];
  };
  attendees?: Array<{
    email: string;
    name: string;
    responseStatus: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }>;
  googleCalendarEventId?: string;
  isSynced: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CalendarState {
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
  selectedDate: Date;
  viewMode: 'day' | 'week' | 'month';
  selectedEvent: CalendarEvent | null;
  showEventModal: boolean;
  showCreateModal: boolean;
  isGoogleCalendarConnected: boolean;
  googleCalendarEvents: any[];

  // Actions
  fetchEvents: (startDate?: string, endDate?: string, type?: string) => Promise<void>;
  fetchDayEvents: (date: string) => Promise<void>;
  fetchWeekEvents: (startDate: string) => Promise<void>;
  fetchMonthEvents: (year: number, month: number) => Promise<void>;
  createEvent: (eventData: Partial<CalendarEvent>) => Promise<CalendarEvent>;
  updateEvent: (id: string, eventData: Partial<CalendarEvent>) => Promise<CalendarEvent>;
  deleteEvent: (id: string) => Promise<void>;
  setSelectedDate: (date: Date) => void;
  setViewMode: (mode: 'day' | 'week' | 'month') => void;
  setSelectedEvent: (event: CalendarEvent | null) => void;
  setShowEventModal: (show: boolean) => void;
  setShowCreateModal: (show: boolean) => void;
  connectGoogleCalendar: () => Promise<void>;
  disconnectGoogleCalendar: () => void;
  syncEventToGoogleCalendar: (eventId: string) => Promise<void>;
  fetchGoogleCalendarEvents: () => Promise<void>;
  getEventStats: (startDate?: string, endDate?: string) => Promise<any>;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  events: [],
  loading: false,
  error: null,
  selectedDate: new Date(),
  viewMode: 'day',
  selectedEvent: null,
  showEventModal: false,
  showCreateModal: false,
  isGoogleCalendarConnected: false,
  googleCalendarEvents: [],

  fetchEvents: async (startDate, endDate, type) => {
    try {
      set({ loading: true, error: null });
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (type) params.append('type', type);
      
      const response = await api.get(`/calendar?${params.toString()}`);
      set({ events: response.data, loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch events', 
        loading: false 
      });
    }
  },

  fetchDayEvents: async (date) => {
    try {
      set({ loading: true, error: null });
      const response = await api.get(`/calendar/day/${date}`);
      set({ events: response.data, loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch day events', 
        loading: false 
      });
    }
  },

  fetchWeekEvents: async (startDate) => {
    try {
      set({ loading: true, error: null });
      const response = await api.get(`/calendar/week/${startDate}`);
      set({ events: response.data, loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch week events', 
        loading: false 
      });
    }
  },

  fetchMonthEvents: async (year, month) => {
    try {
      set({ loading: true, error: null });
      const response = await api.get(`/calendar/month/${year}/${month}`);
      set({ events: response.data, loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch month events', 
        loading: false 
      });
    }
  },

  createEvent: async (eventData) => {
    try {
      set({ loading: true, error: null });
      const response = await api.post('/calendar', eventData);
      const newEvent = response.data;
      
      set(state => ({
        events: [...state.events, newEvent],
        loading: false,
        showCreateModal: false
      }));

      return newEvent;
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to create event', 
        loading: false 
      });
      throw error;
    }
  },

  updateEvent: async (id, eventData) => {
    try {
      set({ loading: true, error: null });
      const response = await api.put(`/calendar/${id}`, eventData);
      const updatedEvent = response.data;
      
      set(state => ({
        events: state.events.map(event => 
          event._id === id ? updatedEvent : event
        ),
        loading: false,
        selectedEvent: null,
        showEventModal: false
      }));

      return updatedEvent;
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to update event', 
        loading: false 
      });
      throw error;
    }
  },

  deleteEvent: async (id) => {
    try {
      set({ loading: true, error: null });
      await api.delete(`/calendar/${id}`);
      
      set(state => ({
        events: state.events.filter(event => event._id !== id),
        loading: false,
        selectedEvent: null,
        showEventModal: false
      }));
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to delete event', 
        loading: false 
      });
      throw error;
    }
  },

  setSelectedDate: (date) => {
    set({ selectedDate: date });
  },

  setViewMode: (mode) => {
    set({ viewMode: mode });
  },

  setSelectedEvent: (event) => {
    set({ selectedEvent: event });
  },

  setShowEventModal: (show) => {
    set({ showEventModal: show });
  },

  setShowCreateModal: (show) => {
    set({ showCreateModal: show });
  },

    connectGoogleCalendar: async () => {
    try {
      const config = getGoogleCalendarConfig();
      await googleCalendarService.initialize(config);
      await googleCalendarService.signIn();
      
      set({ isGoogleCalendarConnected: true });
      get().fetchGoogleCalendarEvents();
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to connect to Google Calendar',
        isGoogleCalendarConnected: false 
      });
    }
  },

  disconnectGoogleCalendar: async () => {
    try {
      await googleCalendarService.signOut();
    } catch (error) {
      console.error('Failed to sign out from Google Calendar:', error);
    }
    set({ 
      isGoogleCalendarConnected: false, 
      googleCalendarEvents: [] 
    });
  },

  syncEventToGoogleCalendar: async (eventId) => {
    try {
      const event = get().events.find(e => e._id === eventId);
      if (!event) throw new Error('Event not found');

      if (!get().isGoogleCalendarConnected) {
        throw new Error('Google Calendar not connected');
      }

      const googleEvent = {
        summary: event.title,
        description: event.description || '',
        start: {
          dateTime: event.startTime,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: event.endTime,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        location: event.location,
        attendees: event.attendees?.map(a => ({ email: a.email }))
      };

      const response = await googleCalendarService.createEvent(googleEvent);

      // Update the event with Google Calendar ID
      await get().updateEvent(eventId, {
        googleCalendarEventId: response.id,
        isSynced: true
      });

    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to sync event to Google Calendar' 
      });
      throw error;
    }
  },

  fetchGoogleCalendarEvents: async () => {
    try {
      if (!get().isGoogleCalendarConnected) return;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      const events = await googleCalendarService.listEvents(
        startDate.toISOString(),
        endDate.toISOString()
      );

      set({ googleCalendarEvents: events });
    } catch (error: any) {
      console.error('Failed to fetch Google Calendar events:', error);
    }
  },

  getEventStats: async (startDate, endDate) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await api.get(`/calendar/stats?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch event stats' 
      });
      throw error;
    }
  }
})); 