// frontend/src/components/Calendar.js
import React, { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import axiosInstance from '../utils/axios';

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
  FiClock, FiMapPin, FiUsers, FiBell, FiRepeat
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
  const [view, setView] = useState('month'); // month, week, list
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    allDay: false,
    location: '',
    category: 'other',
    color: '#3B82F6',
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
    { value: 'appointment', label: 'Appointment', color: '#EF4444' },
    { value: 'birthday', label: 'Birthday', color: '#F59E0B' },
    { value: 'holiday', label: 'Holiday', color: '#10B981' },
    { value: 'school', label: 'School', color: '#8B5CF6' },
    { value: 'work', label: 'Work', color: '#3B82F6' },
    { value: 'social', label: 'Social', color: '#EC4899' },
    { value: 'sports', label: 'Sports', color: '#06B6D4' },
    { value: 'travel', label: 'Travel', color: '#F97316' },
    { value: 'other', label: 'Other', color: '#6B7280' }
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
      
      setEvents(response.data.events);
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
      color: '#3B82F6',
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
            className={`min-h-24 p-2 border border-gray-200 ${
              !isSameMonth(day, monthStart) ? 'bg-gray-50' : 'bg-white'
            } ${isToday(day) ? 'bg-blue-50' : ''} hover:bg-gray-50 cursor-pointer`}
            onClick={() => openAddModal(currentDay)}
          >
            <div className={`text-sm font-medium ${
              !isSameMonth(day, monthStart) ? 'text-gray-400' : 'text-gray-900'
            } ${isToday(day) ? 'text-blue-600' : ''}`}>
              {format(day, dateFormat)}
            </div>
            
            <div className="mt-1 space-y-1">
              {dayEvents.slice(0, 3).map((event, index) => {
                const category = categories.find(c => c.value === event.category);
                return (
                  <div
                    key={event._id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEvent(event);
                    }}
                    className="text-xs p-1 rounded truncate cursor-pointer hover:opacity-80"
                    style={{ backgroundColor: event.color + '20', color: event.color }}
                  >
                    {format(new Date(event.startDate), 'h:mm a')} - {event.title}
                  </div>
                );
              })}
              {dayEvents.length > 3 && (
                <div className="text-xs text-gray-500">
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

    return <div>{rows}</div>;
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
      <div className="space-y-4">
        {Object.entries(eventsByDate).map(([date, dayEvents]) => (
          <div key={date}>
            <h3 className="font-semibold text-gray-900 mb-2">
              {format(new Date(date), 'EEEE, MMMM d, yyyy')}
            </h3>
            <div className="space-y-2">
              {dayEvents.map(event => {
                const category = categories.find(c => c.value === event.category);
                return (
                  <div
                    key={event._id}
                    onClick={() => setSelectedEvent(event)}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div
                          className="w-3 h-3 rounded-full mt-1.5"
                          style={{ backgroundColor: event.color }}
                        />
                        <div>
                          <h4 className="font-medium text-gray-900">{event.title}</h4>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                            <span className="flex items-center space-x-1">
                              <FiClock className="w-4 h-4" />
                              <span>
                                {format(new Date(event.startDate), 'h:mm a')} - 
                                {format(new Date(event.endDate), 'h:mm a')}
                              </span>
                            </span>
                            {event.location && (
                              <span className="flex items-center space-x-1">
                                <FiMapPin className="w-4 h-4" />
                                <span>{event.location}</span>
                              </span>
                            )}
                            {event.attendees.length > 0 && (
                              <span className="flex items-center space-x-1">
                                <FiUsers className="w-4 h-4" />
                                <span>{event.attendees.length}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                        {category?.label}
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
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const currentUserId = localStorage.getItem('userId');

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-900">Family Calendar</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <FiChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold text-gray-900 min-w-[150px] text-center">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <FiChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1 rounded ${
                view === 'month' ? 'bg-white shadow-sm' : ''
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1 rounded ${
                view === 'list' ? 'bg-white shadow-sm' : ''
              }`}
            >
              List
            </button>
          </div>

          <button
            onClick={() => openAddModal()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <FiPlus className="w-5 h-5" />
            <span>Add Event</span>
          </button>
        </div>
      </div>

      {/* Calendar/List View */}
      {view === 'month' ? (
        <>
          {/* Days of Week */}
          <div className="grid grid-cols-7 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-semibold text-gray-700 py-2">
                {day}
              </div>
            ))}
          </div>
          {renderMonthView()}
        </>
      ) : (
        renderListView()
      )}

      {/* Add/Edit Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {editingEvent ? 'Edit Event' : 'Add Event'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center space-x-3 mb-4">
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
                    Start Date & Time *
                  </label>
                  <input
                    type={formData.allDay ? "date" : "datetime-local"}
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date & Time *
                  </label>
                  <input
                    type={formData.allDay ? "date" : "datetime-local"}
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
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
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {familyMembers.map(member => (
                    <label key={member._id} className="flex items-center space-x-2">
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
                      <span className="text-sm">{member.fullName}</span>
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
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingEvent ? 'Save Changes' : 'Add Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-3">
                <div
                  className="w-4 h-4 rounded-full mt-1"
                  style={{ backgroundColor: selectedEvent.color }}
                />
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedEvent.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {categories.find(c => c.value === selectedEvent.category)?.label}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {selectedEvent.description && (
              <p className="text-gray-700 mb-4">{selectedEvent.description}</p>
            )}

            <div className="space-y-3 mb-6">
              <div className="flex items-center space-x-3 text-gray-600">
                <FiCalendar className="w-5 h-5" />
                <span>
                  {format(new Date(selectedEvent.startDate), 'EEEE, MMMM d, yyyy')}
                </span>
              </div>

              {!selectedEvent.allDay && (
                <div className="flex items-center space-x-3 text-gray-600">
                  <FiClock className="w-5 h-5" />
                  <span>
                    {format(new Date(selectedEvent.startDate), 'h:mm a')} - 
                    {format(new Date(selectedEvent.endDate), 'h:mm a')}
                  </span>
                </div>
              )}

              {selectedEvent.location && (
                <div className="flex items-center space-x-3 text-gray-600">
                  <FiMapPin className="w-5 h-5" />
                  <span>{selectedEvent.location}</span>
                </div>
              )}

              {selectedEvent.recurring && (
                <div className="flex items-center space-x-3 text-blue-600">
                  <FiRepeat className="w-5 h-5" />
                  <span className="capitalize">
                    Repeats {selectedEvent.recurringPattern.frequency}
                  </span>
                </div>
              )}
            </div>

            {selectedEvent.attendees.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">Attendees</h4>
                <div className="space-y-2">
                  {selectedEvent.attendees.map(attendee => {
                    const isCurrentUser = attendee.user._id === currentUserId;
                    return (
                      <div key={attendee.user._id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                            {attendee.user.fullName[0].toUpperCase()}
                          </div>
                          <span className="text-sm">{attendee.user.fullName}</span>
                        </div>
                        {isCurrentUser ? (
                          <select
                            value={attendee.response}
                            onChange={(e) => handleRSVP(selectedEvent._id, e.target.value)}
                            className="text-sm px-2 py-1 border border-gray-300 rounded focus:outline-none"
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

            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Created by {selectedEvent.createdBy.fullName}</span>
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
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