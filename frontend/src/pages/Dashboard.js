import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axios';
import { Link } from 'react-router-dom';
import { 
  FiHome, FiUsers, FiCamera, FiShoppingCart, FiMessageCircle, 
  FiCalendar, FiCoffee, FiCheckCircle, FiPlus, FiLogOut,
  FiSettings, FiBell, FiActivity, FiClock, FiList
} from 'react-icons/fi';

const Dashboard = ({setIsAuthenticated}) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [activeGroceryItems, setActiveGroceryItems] = useState([]);
  const [todayEvents, setTodayEvents] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchUserAndFamily();
    fetchActiveGroceryItems();
    fetchTodayEvents();
    
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchActiveGroceryItems = async () => {
    try {
      const response = await axiosInstance.get('/grocery?completed=false');
      setActiveGroceryItems(response.data.items);
    } catch (error) {
      console.error('Failed to fetch grocery items:', error);
    }
  };

  const fetchTodayEvents = async () => {
    try {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const response = await axiosInstance.get('/events', {
        params: {
          startDate: today.toISOString(),
          endDate: tomorrow.toISOString()
        }
      });
      setTodayEvents(response.data.events || []);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    }
  };

  const fetchUserAndFamily = async () => {
    try {
      const userResponse = await axiosInstance.get('/user');
      setUser(userResponse.data.user);

      const familyResponse = await axiosInstance.get('/family/members');
      setFamilyMembers(familyResponse.data.members);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setIsAuthenticated(false);
    navigate('/');
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your family hub...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                <FiHome className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {user?.family?.name || 'Family Hub'}
                </h1>
                <p className="text-sm text-gray-500">
                  {getGreeting()}, {user?.fullName}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <FiBell className="w-5 h-5" />
              </button>
              
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <FiSettings className="w-5 h-5" />
              </button>
              
              {user?.role === 'admin' && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
                >
                  <FiPlus className="w-4 h-4" />
                  <span>Invite</span>
                </button>
              )}
              
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-2"
              >
                <FiLogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-2xl p-8 mb-8 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome to Your Family Hub
              </h2>
              <p className="text-gray-600">
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="hidden sm:block">
              <div className="flex space-x-8">
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900">{familyMembers.length}</p>
                  <p className="text-sm text-gray-500">Members</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900">{todayEvents.length}</p>
                  <p className="text-sm text-gray-500">Events Today</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900">{activeGroceryItems.length}</p>
                  <p className="text-sm text-gray-500">Shopping Items</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link to="/grocery" className="block">
            <div className="bg-white rounded-xl p-6 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                    <FiShoppingCart className="text-emerald-600 text-xl" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Add Grocery Item</h3>
                    <p className="text-sm text-gray-500">Quick add to shopping list</p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
          
          <Link to="/calendar" className="block">
            <div className="bg-white rounded-xl p-6 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <FiCalendar className="text-blue-600 text-xl" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Schedule Event</h3>
                    <p className="text-sm text-gray-500">Add to family calendar</p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        </div>

        {/* Features Grid */}
        <h2 className="text-xl font-bold text-gray-900 mb-6">Family Features</h2>
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <FeatureCard
            title="Photo Album"
            description="Share and cherish family memories"
            icon={<FiCamera />}
            accentColor="purple"
            comingSoon={true}
          />
          <Link to="/grocery" className="block">
            <FeatureCard
              title="Shopping List"
              description="Keep track of what the family needs"
              icon={<FiShoppingCart />}
              accentColor="emerald"
              comingSoon={false}
            />
          </Link>
          <FeatureCard
            title="Family Chat"
            description="Stay connected with messaging"
            icon={<FiMessageCircle />}
            accentColor="amber"
            comingSoon={true}
          />
          <Link to="/calendar" className="block">
            <FeatureCard
              title="Calendar"
              description="Track family events together"
              icon={<FiCalendar />}
              accentColor="blue"
              comingSoon={false}
            />
          </Link>
          <Link to="/lists" className="block">
            <FeatureCard
              title="Lists"
              description="Create custom lists for anything"
              icon={<FiList />}
              accentColor="orange"
              comingSoon={false}
            />
          </Link>
          <FeatureCard
            title="Meal Planner"
            description="Plan weekly meals together"
            icon={<FiCoffee />}
            accentColor="rose"
            comingSoon={true}
          />
        </div>

        {/* Family Members Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Family Members</h2>
            <span className="text-sm text-gray-500">
              {familyMembers.length} member{familyMembers.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {familyMembers.map((member) => (
              <MemberCard key={member._id} member={member} />
            ))}
          </div>
        </div>
      </main>

      {/* Invite Modal */}
      {showInviteModal && user?.role === 'admin' && (
        <InviteModal 
          joinCode={user.family.joinCode}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </div>
  );
};

// Feature Card Component
const FeatureCard = ({ title, description, icon, accentColor, comingSoon }) => {
  const colorMap = {
    purple: 'bg-purple-50 text-purple-600 group-hover:bg-purple-100',
    emerald: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100',
    amber: 'bg-amber-50 text-amber-600 group-hover:bg-amber-100',
    blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-100',
    orange: 'bg-orange-50 text-orange-600 group-hover:bg-orange-100',
    rose: 'bg-rose-50 text-rose-600 group-hover:bg-rose-100',
    cyan: 'bg-cyan-50 text-cyan-600 group-hover:bg-cyan-100'
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all cursor-pointer group">
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-colors ${colorMap[accentColor]}`}>
        <span className="text-2xl">{icon}</span>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-3">{description}</p>
      {comingSoon && (
        <span className="inline-block text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium">
          Coming Soon
        </span>
      )}
    </div>
  );
};

// Member Card Component
const MemberCard = ({ member }) => {
  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getLastActive = (date) => {
    const diff = new Date() - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
      <div className="flex items-start space-x-4">
        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-indigo-600 font-semibold">
            {getInitials(member.fullName)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h3 className="font-medium text-gray-900 truncate">
              {member.fullName}
            </h3>
            {member.role === 'admin' && (
              <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-md font-medium">
                Admin
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 truncate">{member.email}</p>
          <div className="flex items-center space-x-1 mt-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <p className="text-xs text-gray-500">
              Active {getLastActive(member.lastActive)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Invite Modal Component
const InviteModal = ({ joinCode, onClose }) => (
  <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full animate-fadeIn">
      <div className="text-center">
        <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FiUsers className="w-8 h-8 text-indigo-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Invite Family Members
        </h3>
        <p className="text-gray-600 mb-6">
          Share this code with your family members
        </p>
        
        <div className="bg-gray-50 rounded-xl p-6 mb-6 relative">
          <p className="text-3xl font-mono font-bold text-gray-900 tracking-wider">
            {joinCode}
          </p>
          <button
            onClick={() => {
              navigator.clipboard.writeText(joinCode);
              alert('Code copied to clipboard!');
            }}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
        
        <p className="text-sm text-gray-500 mb-6">
          This code allows new members to join your family hub
        </p>
        
        <button
          onClick={onClose}
          className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  </div>
);

export default Dashboard;