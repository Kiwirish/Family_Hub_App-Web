import React, { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import axiosInstance from '../utils/axios';
import { Link } from 'react-router-dom';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek,
  addMonths, 
  subMonths, 
  addDays, 
  isSameMonth, 
  isSameDay,
  isToday
} from 'date-fns';
import { 
  FiPlus, FiChevronLeft, FiChevronRight, FiCalendar, FiX,
  FiClock, FiMapPin, FiUsers, FiBell, FiRepeat,
  FiArrowLeft, FiGrid, FiList, FiEdit2
} from 'react-icons/fi';

const Calendar = () => {
  const { socket } = useSocket();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [view, setView] = useState('month');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    allDay: false,
    location: '',
    category: 'other',
    color: '#3b82f6',
    attendees: [],
    reminders: [{ type: 'notification', minutesBefore: 15 }],
    recurring: false,
    recurringPattern: {
      frequency: 'weekly',
      interval: 1,
      endDate: '',
      daysOfWeek: []
    }
  });

  const categories = [
    { value: 'appointment', label: 'Appointment', icon: '🏥', color: '#ef4444' },
    { value: 'birthday', label: 'Birthday', icon: '🎂', color: '#f59e0b' },
    { value: 'holiday', label: 'Holiday', icon: '🎉', color: '#10b981' },
    { value: 'school', label: 'School', icon: '📚', color: '#8b5cf6' },
    { value: 'work', label: 'Work', icon: '💼', color: '#3b82f6' },
    { value: 'social', label: 'Social', icon: '🎭', color: '#ec4899' },
    { value: 'sports', label: 'Sports', icon: '⚽', color: '#06b6d4' },
    { value: 'other', label: 'Other', icon: '📅', color: '#6b7280' }
  ];

  useEffect(() => {
    fetchEvents();
    fetchFamilyMembers();
  }, [currentMonth]);

  useEffect(() => {
    if (socket) {
      socket.on('event_created', (event) => {
        setEvents(prev => [...prev, event]);
      });

      socket.on('event_updated', (updatedEvent) => {
        setEvents(prev => prev.map(event => 
          event._id === updatedEvent._id ? updatedEvent : event
        ));
        if (selectedEvent?._id === updatedEvent._id) {
          setSelectedEvent(updatedEvent);
        }
      });

      return () => {
        socket.off('event_created');
        socket.off('event_updated');
      };
    }
  }, [socket, selectedEvent]);

  const fetchEvents = async () => {
    try {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      
      const response = await axiosInstance.get('/events', {
        params: {
          startDate: start.toISOString(),
          endDate: end.toISOString()
        }
      });
      
      setEvents(response.data.events || []);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFamilyMembers = async () => {
    try {
      const response = await axiosInstance.get('/family/members');
      setFamilyMembers(response.data.members);
    } catch (error) {
      console.error('Failed to fetch family members:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const dataToSubmit = {
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString()
      };
      
      if (editingEvent) {
        await axiosInstance.put(`/events/${editingEvent._id}`, dataToSubmit);
      } else {
        await axiosInstance.post('/events', dataToSubmit);
      }
      
      resetForm();
      fetchEvents();
    } catch (error) {
      console.error('Failed to save event:', error);
      alert('Failed to save event');
    }
  };

  const handleRSVP = async (eventId, response) => {
    try {
      await axiosInstance.post(`/events/${eventId}/rsvp`, { response });
      fetchEvents();
    } catch (error) {
      console.error('Failed to update RSVP:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      allDay: false,
      location: '',
      category: 'other',
      color: '#3b82f6',
      attendees: [],
      reminders: [{ type: 'notification', minutesBefore: 15 }],
      recurring: false,
      recurringPattern: {
        frequency: 'weekly',
        interval: 1,
        endDate: '',
        daysOfWeek: []
      }
    });
    setEditingEvent(null);
    setShowAddModal(false);
    setSelectedDate(null);
  };

  const openAddModal = (date = null) => {
    if (date) {
      const dateStr = format(date, 'yyyy-MM-dd\'T\'HH:mm');
      setFormData({
        ...formData,
        startDate: dateStr,
        endDate: dateStr
      });
      setSelectedDate(date);
    }
    setShowAddModal(true);
  };

  const getCategoryDetails = (category) => {
    return categories.find(c => c.value === category) || categories[categories.length - 1];
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = 'd';
    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const currentDay = day;
        const dayEvents = events.filter(event => 
          isSameDay(new Date(event.startDate), currentDay)
        );

        days.push(
          <div
            key={day}
            className={`min-h-24 p-2 border-r border-b border-gray-200 cursor-pointer transition-colors ${
              !isSameMonth(day, monthStart) 
                ? 'bg-gray-50 text-gray-400' 
                : isToday(day) 
                  ? 'bg-blue-50' 
                  : 'bg-white hover:bg-gray-50'
            }`}
            onClick={() => openAddModal(currentDay)}
          >
            <div className={`text-sm font-medium mb-1 ${
              isToday(day) ? 'text-blue-600' : ''
            }`}>
              {format(day, dateFormat)}
            </div>
            
            <div className="space-y-1">
              {dayEvents.slice(0, 3).map((event) => {
                const category = getCategoryDetails(event.category);
                return (
                  <div
                    key={event._id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEvent(event);
                    }}
                    className="text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ 
                      backgroundColor: event.color + '15',
                      color: event.color,
                      borderLeft: `2px solid ${event.color}`
                    }}
                  >
                    <span className="font-medium">
                      {format(new Date(event.startDate), 'HH:mm')} {event.title}
                    </span>
                  </div>
                );
              })}
              {dayEvents.length > 3 && (
                <div className="text-xs text-gray-500 text-center">
                  +{dayEvents.length - 3} more
                </div>
              )}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day}>
          {days}
        </div>
      );
      days = [];
    }

    return <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">{rows}</div>;
  };

  const renderListView = () => {
    const sortedEvents = [...events].sort((a, b) => 
      new Date(a.startDate) - new Date(b.startDate)
    );

    const eventsByDate = sortedEvents.reduce((acc, event) => {
      const date = format(new Date(event.startDate), 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(event);
      return acc;
    }, {});

    return (
      <div className="space-y-6">
        {Object.entries(eventsByDate).map(([date, dayEvents]) => (
          <div key={date}>
            <h3 className="font-semibold text-gray-900 mb-3">
              {format(new Date(date), 'EEEE, MMMM d, yyyy')}
            </h3>
            <div className="space-y-3">
              {dayEvents.map((event) => {
                const category = getCategoryDetails(event.category);
                return (
                  <div
                    key={event._id}
                    onClick={() => setSelectedEvent(event)}
                    className="bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                          style={{ backgroundColor: event.color + '15' }}
                        >
                          {category.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{event.title}</h4>
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
                            <span className="flex items-center space-x-1">
                              <FiClock className="w-3.5 h-3.5" />
                              <span>
                                {format(new Date(event.startDate), 'h:mm a')} - 
                                {format(new Date(event.endDate), 'h:mm a')}
                              </span>
                            </span>
                            {event.location && (
                              <span className="flex items-center space-x-1">
                                <FiMapPin className="w-3.5 h-3.5" />
                                <span>{event.location}</span>
                              </span>
                            )}
                            {event.attendees.length > 0 && (
                              <span className="flex items-center space-x-1">
                                <FiUsers className="w-3.5 h-3.5" />
                                <span>{event.attendees.length}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span 
                        className="text-xs px-3 py-1 rounded-full font-medium"
                        style={{ 
                          backgroundColor: event.color + '15',
                          color: event.color
                        }}
                      >
                        {category.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  const currentUserId = localStorage.getItem('userId');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard">
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                  <FiArrowLeft className="w-5 h-5" />
                </button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Family Calendar</h1>
                <p className="text-sm text-gray-500">Keep track of important events</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setView('month')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    view === 'month' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <FiGrid className="w-4 h-4 inline-block mr-1" />
                  Month
                </button>
                <button
                  onClick={() => setView('list')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    view === 'list' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <FiList className="w-4 h-4 inline-block mr-1" />
                  List
                </button>
              </div>

              <button
                onClick={() => openAddModal()}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <FiPlus className="w-4 h-4" />
                <span>Add Event</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Month Navigation */}
        <div className="bg-white rounded-xl p-4 mb-6 border border-gray-100 flex items-center justify-between">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold text-gray-900">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Calendar/List View */}
        {view === 'month' ? (
          <>
            {/* Days of Week */}
            <div className="grid grid-cols-7 bg-white rounded-t-xl border border-b-0 border-gray-200">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-700 py-3 border-r last:border-r-0 border-gray-200">
                  {day}
                </div>
              ))}
            </div>
            {renderMonthView()}
          </>
        ) : (
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            {renderListView()}
          </div>
        )}
      </main>

      {/* Add/Edit Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              {editingEvent ? 'Edit Event' : 'Create New Event'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Family Dinner, Soccer Practice..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Add event details..."
                />
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="allDay"
                  checked={formData.allDay}
                  onChange={(e) => setFormData({ ...formData, allDay: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="allDay" className="text-sm font-medium text-gray-700">
                  All day event
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date & Time
                  </label>
                  <input
                    type={formData.allDay ? "date" : "datetime-local"}
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date & Time
                  </label>
                  <input
                    type={formData.allDay ? "date" : "datetime-local"}
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Add location"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      const category = categories.find(c => c.value === e.target.value);
                      setFormData({ 
                        ...formData, 
                        category: e.target.value,
                        color: category?.color || '#3B82F6'
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {categories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.icon} {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full h-10 px-1 py-1 border border-gray-300 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invite Family Members
                </label>
                <div className="border border-gray-300 rounded-lg p-3 max-h-32 overflow-y-auto">
                  {familyMembers.map(member => (
                    <label key={member._id} className="flex items-center space-x-2 py-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.attendees.includes(member._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ 
                              ...formData, 
                              attendees: [...formData.attendees, member._id] 
                            });
                          } else {
                            setFormData({ 
                              ...formData, 
                              attendees: formData.attendees.filter(id => id !== member._id) 
                            });
                          }
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{member.fullName}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={formData.recurring}
                  onChange={(e) => setFormData({ ...formData, recurring: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="recurring" className="text-sm font-medium text-gray-700">
                  Recurring event
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                  {editingEvent ? 'Save Changes' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                  style={{ backgroundColor: selectedEvent.color + '15' }}
                >
                  {getCategoryDetails(selectedEvent.category).icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedEvent.title}</h3>
                  <p className="text-sm text-gray-500">
                    {getCategoryDetails(selectedEvent.category).label}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {selectedEvent.description && (
              <p className="text-gray-600 mb-4">{selectedEvent.description}</p>
            )}

            <div className="space-y-3 mb-6 text-sm">
              <div className="flex items-center space-x-3 text-gray-600">
                <FiCalendar className="w-4 h-4 flex-shrink-0" />
                <span>{format(new Date(selectedEvent.startDate), 'EEEE, MMMM d, yyyy')}</span>
              </div>

              {!selectedEvent.allDay && (
                <div className="flex items-center space-x-3 text-gray-600">
                  <FiClock className="w-4 h-4 flex-shrink-0" />
                  <span>
                    {format(new Date(selectedEvent.startDate), 'h:mm a')} - 
                    {format(new Date(selectedEvent.endDate), 'h:mm a')}
                  </span>
                </div>
              )}

              {selectedEvent.location && (
                <div className="flex items-center space-x-3 text-gray-600">
                  <FiMapPin className="w-4 h-4 flex-shrink-0" />
                  <span>{selectedEvent.location}</span>
                </div>
              )}

              {selectedEvent.recurring && (
                <div className="flex items-center space-x-3 text-blue-600">
                  <FiRepeat className="w-4 h-4 flex-shrink-0" />
                  <span className="capitalize">
                    Repeats {selectedEvent.recurringPattern.frequency}
                  </span>
                </div>
              )}
            </div>

            {selectedEvent.attendees.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Attendees</h4>
                <div className="space-y-2">
                  {selectedEvent.attendees.map(attendee => {
                    const isCurrentUser = attendee.user._id === currentUserId;
                    return (
                      <div key={attendee.user._id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-xs font-medium text-indigo-600">
                            {attendee.user.fullName[0].toUpperCase()}
                          </div>
                          <span className="text-sm text-gray-700">{attendee.user.fullName}</span>
                        </div>
                        {isCurrentUser ? (
                          <select
                            value={attendee.response}
                            onChange={(e) => handleRSVP(selectedEvent._id, e.target.value)}
                            className="text-sm px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="pending">No response</option>
                            <option value="accepted">Going</option>
                            <option value="declined">Not going</option>
                            <option value="maybe">Maybe</option>
                          </select>
                        ) : (
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            attendee.response === 'accepted' ? 'bg-green-100 text-green-700' :
                            attendee.response === 'declined' ? 'bg-red-100 text-red-700' :
                            attendee.response === 'maybe' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {attendee.response === 'accepted' ? 'Going' :
                             attendee.response === 'declined' ? 'Not going' :
                             attendee.response === 'maybe' ? 'Maybe' :
                             'No response'}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Created by {selectedEvent.createdBy.fullName}</span>
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;