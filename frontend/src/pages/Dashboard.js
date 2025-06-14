
// frontend/src/pages/Dashboard.js - Enhanced Dashboard
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axios';
import { Link } from 'react-router-dom';
import Calendar from '../components/Calendar';


const Dashboard = ({setIsAuthenticated}) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [activeGroceryItems, setActiveGroceryItems] = useState([]);


  useEffect(() => {
    fetchUserAndFamily();
    fetchActiveGroceryItems();
  }, []);

  const fetchActiveGroceryItems = async () => {
    try {
      const response = await axiosInstance.get('/grocery?completed=false');
      setActiveGroceryItems(response.data.items);
    } catch (error) {
      console.error('Failed to fetch grocery items:', error);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your family hub...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">🏠</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {user?.family?.name || 'Family Hub'}
                </h1>
                <p className="text-sm text-gray-600">
                  Welcome back, {user?.fullName}!
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {user?.role === 'admin' && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Invite Members</span>
                </button>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Family Members" 
            value={familyMembers.length} 
            icon="👥" 
            color="from-blue-500 to-blue-600" 
          />
          <StatCard 
            title="Photos Shared" 
            value="0" 
            icon="📸" 
            color="from-purple-500 to-purple-600" 
          />
          <StatCard 
            title="Shopping Items" 
            value={activeGroceryItems.length}
            icon="🛒" 
            color="from-green-500 to-green-600" 
          />
          <StatCard 
            title="Messages" 
            value="0" 
            icon="💬" 
            color="from-orange-500 to-orange-600" 
          />
        </div>

        {/* Features Grid */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Family Features</h2>
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <FeatureCard
            title="Photo Album"
            description="Share and cherish family memories together"
            icon="📸"
            color="from-blue-500 to-blue-600"
            comingSoon={true}
          />
          <Link to="/grocery">
          <FeatureCard
            
            title="Shopping List"
            description="Keep track of what the family needs"
            icon="🛒"
            color="from-green-500 to-green-600"
            comingSoon={false}
          />
          </Link>
          <FeatureCard
            title="Family Chat"
            description="Stay connected with real-time messaging"
            icon="💬"
            color="from-purple-500 to-purple-600"
            comingSoon={true}
          />
          <Link to="/calendar">
          <FeatureCard
            title="Calendar"
            description="Track family events and appointments"
            icon="📅"
            color="from-orange-500 to-orange-600"
            comingSoon={false}
          />
          </Link>
          <FeatureCard
            title="Meal Planner"
            description="Plan weekly meals together"
            icon="🍽️"
            color="from-pink-500 to-pink-600"
            comingSoon={true}
          />
          <FeatureCard
            title="Chore Tracker"
            description="Manage household tasks fairly"
            icon="✅"
            color="from-teal-500 to-teal-600"
            comingSoon={true}
          />
        </div>

        {/* Family Members Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Family Members
            </h2>
            <span className="text-sm text-gray-600">
              {familyMembers.length} member{familyMembers.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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

// Stat Card Component
const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
    <div className="flex items-center justify-between mb-4">
      <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center`}>
        <span className="text-xl">{icon}</span>
      </div>
      <span className="text-3xl font-bold text-gray-900">{value}</span>
    </div>
    <p className="text-gray-600 text-sm">{title}</p>
  </div>
);

// Feature Card Component
const FeatureCard = ({ title, description, icon, color, comingSoon }) => (
  <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 hover:shadow-lg transition-all cursor-pointer group">
    <div className={`w-16 h-16 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
      <span className="text-2xl">{icon}</span>
    </div>
    <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 text-sm mb-4">{description}</p>
    {comingSoon && (
      <span className="inline-block text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
        Coming Soon
      </span>
    )}
  </div>
);

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

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-lg transition-all">
      <div className="flex items-start space-x-4">
        <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0">
          <span className="text-white font-semibold text-lg">
            {getInitials(member.fullName)}
          </span>
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-gray-900">
              {member.fullName}
            </h3>
            {member.role === 'admin' && (
              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                Admin
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">{member.email}</p>
          <p className="text-xs text-gray-500 mt-2">
            Active {getLastActive(member.lastActive)}
          </p>
        </div>
      </div>
    </div>
  );
};

// Invite Modal Component
const InviteModal = ({ joinCode, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
    <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-6">
          <span className="text-2xl">🎉</span>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          Invite Family Members
        </h3>
        <p className="text-gray-600 mb-6">
          Share this code with your family members so they can join your hub
        </p>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 mb-6 relative">
          <p className="text-4xl font-mono font-bold text-blue-600 tracking-wider">
            {joinCode}
          </p>
          <button
            onClick={() => {
              navigator.clipboard.writeText(joinCode);
              alert('Code copied to clipboard!');
            }}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          This code will allow new members to create accounts in your family hub
        </p>
        <button
          onClick={onClose}
          className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  </div>
);

export default Dashboard;