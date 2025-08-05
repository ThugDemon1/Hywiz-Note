import React, { useEffect, useState, useCallback } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Check, 
  MoreHorizontal,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Star,
  ExternalLink,
  Settings
} from 'lucide-react';
import { useCalendarStore, CalendarEvent } from '../stores/useCalendarStore';
import { useNotesStore } from '../stores/useNotesStore';
import GoogleCalendarAuth from '../components/GoogleCalendarAuth';

export const Calendar: React.FC = () => {
  const {
    events,
    loading,
    selectedDate,
    viewMode,
    showCreateModal,
    fetchDayEvents,
    setSelectedDate,
    setViewMode,
    setShowCreateModal
  } = useCalendarStore();

  const { notes } = useNotesStore();
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showMiniCalendar, setShowMiniCalendar] = useState(true);

  useEffect(() => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    fetchDayEvents(dateStr);
  }, [selectedDate, fetchDayEvents]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getHoursArray = () => {
    const hours = [];
    for (let i = 0; i < 24; i++) {
      hours.push(i);
    }
    return hours;
  };

  const getEventsForHour = (hour: number) => {
    return events.filter(event => {
      const eventHour = new Date(event.startTime).getHours();
      return eventHour === hour;
    });
  };

  const getMiniCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth();
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() - 1);
      return newMonth;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + 1);
      return newMonth;
    });
  };

  const handlePrevDay = () => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() - 1);
      return newDate;
    });
  };

  const handleNextDay = () => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + 1);
      return newDate;
    });
  };

  const handleToday = () => {
    setSelectedDate(new Date());
    setCurrentMonth(new Date());
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-yellow-500';
      case 'low':
        return 'text-green-500';
      default:
        return 'text-gray-400';
    }
  };

  const getEventColor = (event: CalendarEvent) => {
    return event.color || '#4285f4';
  };

  return (
    <div className="h-full flex bg-gray-900 text-white">
      {/* Left Sidebar */}
      <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
        {/* Mini Calendar */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              {currentMonth.toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </h3>
            <div className="flex space-x-1">
              <button
                onClick={handlePrevMonth}
                className="p-1 hover:bg-gray-700 rounded"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1 hover:bg-gray-700 rounded"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of Week */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs text-gray-400 p-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {getMiniCalendarDays().map((date, index) => (
              <button
                key={index}
                onClick={() => handleDateClick(date)}
                className={`
                  p-2 text-sm rounded hover:bg-gray-700 transition-colors
                  ${!isCurrentMonth(date) ? 'text-gray-600' : 'text-white'}
                  ${isToday(date) ? 'bg-blue-600 text-white' : ''}
                  ${isSelected(date) ? 'bg-blue-500 text-white' : ''}
                `}
              >
                {date.getDate()}
              </button>
            ))}
          </div>
        </div>

        {/* MY CALENDARS Section */}
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">MY CALENDARS</h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm">Evernote Calendar</span>
              <Check className="w-4 h-4 text-green-500 ml-auto" />
            </div>
            <div className="ml-6 space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-xs text-gray-400">Events</span>
                <Check className="w-3 h-3 text-green-500 ml-auto" />
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded"></div>
                <span className="text-xs text-gray-400">Tasks</span>
                <Check className="w-3 h-3 text-green-500 ml-auto" />
              </div>
            </div>
          </div>
        </div>

        {/* CONNECT A CALENDAR Section */}
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">CONNECT A CALENDAR</h3>
          <div className="space-y-2">
            <GoogleCalendarAuth 
              onSuccess={() => console.log('Google Calendar connected successfully')}
              onError={(error) => console.error('Google Calendar connection failed:', error)}
            />
            
            <button className="w-full p-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors flex items-center justify-center space-x-2">
              <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">O</span>
              </div>
              <span className="text-sm font-medium">Outlook</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Calendar View */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Calendar</h1>
              <p className="text-gray-400">{formatDate(selectedDate)}</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
              >
                <CalendarIcon className="w-4 h-4" />
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">New Event</span>
              </button>
              
              <button className="p-2 hover:bg-gray-700 rounded">
                <Check className="w-4 h-4" />
              </button>
              
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as 'day' | 'week' | 'month')}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm"
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
              
              <button className="p-2 hover:bg-gray-700 rounded">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Header */}
        <div className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{formatDate(selectedDate)}</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleToday}
                className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded transition-colors"
              >
                Today
              </button>
              <button
                onClick={handlePrevDay}
                className="p-1 hover:bg-gray-700 rounded"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextDay}
                className="p-1 hover:bg-gray-700 rounded"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-auto">
          <div className="relative">
            {/* Hourly Timeline */}
            {getHoursArray().map(hour => {
              const hourEvents = getEventsForHour(hour);
              const timeLabel = hour === 0 ? '12 AM' : 
                               hour === 12 ? '12 PM' : 
                               hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
              
              return (
                <div key={hour} className="flex border-b border-gray-700 min-h-[60px]">
                  {/* Time Label */}
                  <div className="w-20 p-2 text-sm text-gray-400 border-r border-gray-700 flex-shrink-0">
                    {timeLabel}
                  </div>
                  
                  {/* Events Area */}
                  <div className="flex-1 relative p-2">
                    {hourEvents.map((event, index) => (
                      <div
                        key={event._id}
                        className="absolute left-2 right-2 p-2 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity"
                        style={{
                          backgroundColor: getEventColor(event),
                          top: `${index * 25}px`,
                          zIndex: index + 1
                        }}
                        onClick={() => setSelectedEvent(event)}
                      >
                        <div className="flex items-center space-x-1 mb-1">
                          <Clock className="w-3 h-3" />
                          <span className="font-medium">{formatTime(event.startTime)}</span>
                          {event.priority !== 'medium' && (
                            <Star className={`w-3 h-3 ${getPriorityColor(event.priority)}`} />
                          )}
                        </div>
                        <div className="font-semibold truncate">{event.title}</div>
                        {event.location && (
                          <div className="flex items-center space-x-1 text-xs opacity-80">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}
                        {event.attendees && event.attendees.length > 0 && (
                          <div className="flex items-center space-x-1 text-xs opacity-80">
                            <Users className="w-3 h-3" />
                            <span>{event.attendees.length} attendees</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <CreateEventModal
          onClose={() => setShowCreateModal(false)}
          selectedDate={selectedDate}
          notes={notes}
        />
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onEdit={() => {
            setSelectedEvent(null);
            setShowCreateModal(true);
          }}
          onDelete={async () => {
            // Handle delete
            setSelectedEvent(null);
          }}
        />
      )}
    </div>
  );
};

// Create Event Modal Component
const CreateEventModal: React.FC<{
  onClose: () => void;
  selectedDate: Date;
  notes: any[];
}> = ({ onClose, selectedDate, notes }) => {
  const { createEvent } = useCalendarStore();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: `${selectedDate.toISOString().split('T')[0]}T09:00`,
    endTime: `${selectedDate.toISOString().split('T')[0]}T10:00`,
    allDay: false,
    location: '',
    type: 'event' as 'event' | 'task',
    priority: 'medium' as 'low' | 'medium' | 'high',
    color: '#4285f4',
    noteId: '',
    attendees: [] as Array<{ email: string; name: string }>
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createEvent(formData);
      onClose();
    } catch (error) {
      console.error('Failed to create event:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Create New Event</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Start Time
              </label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                End Time
              </label>
              <input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'event' | 'task' })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="event">Event</option>
                <option value="task">Task</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 border border-gray-600 rounded-md hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Create Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Event Details Modal Component
const EventDetailsModal: React.FC<{
  event: CalendarEvent;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ event, onClose, onEdit, onDelete }) => {
  const { syncEventToGoogleCalendar, isGoogleCalendarConnected } = useCalendarStore();

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{event.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ×
          </button>
        </div>
        
        <div className="space-y-4">
          {event.description && (
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-1">Description</h3>
              <p className="text-gray-400">{event.description}</p>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-1">Time</h3>
            <p className="text-gray-400">
              {formatDateTime(event.startTime)} - {formatTime(event.endTime)}
            </p>
          </div>

          {event.location && (
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-1">Location</h3>
              <p className="text-gray-400">{event.location}</p>
            </div>
          )}

          <div className="flex items-center space-x-4">
            <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(event.priority)}`}>
              {event.priority} priority
            </span>
            <span className="px-2 py-1 rounded text-xs bg-gray-700">
              {event.type}
            </span>
          </div>

          {event.attendees && event.attendees.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-1">Attendees</h3>
              <div className="space-y-1">
                {event.attendees.map((attendee, index) => (
                  <div key={index} className="text-gray-400 text-sm">
                    {attendee.name} ({attendee.email})
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            {isGoogleCalendarConnected && !event.isSynced && (
              <button
                onClick={() => syncEventToGoogleCalendar(event._id)}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 rounded"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Sync to Google</span>
              </button>
            )}
            
            <button
              onClick={onEdit}
              className="px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded"
            >
              Edit
            </button>
            
            <button
              onClick={onDelete}
              className="px-3 py-2 text-sm bg-red-600 hover:bg-red-700 rounded"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar; 