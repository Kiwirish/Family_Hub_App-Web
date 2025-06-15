
// frontend/src/pages/FamilyLanding.js - Enhanced Landing Page
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FiHome, FiUsers, FiCamera, FiShoppingCart, FiMessageCircle, 
  FiCalendar, FiShield, FiClock, FiSmartphone, FiCheck
} from 'react-icons/fi';

const FamilyLanding = () => {
  const features = [
    { icon: <FiCamera />, title: 'Photo Sharing', desc: 'Capture and share precious moments' },
    { icon: <FiShoppingCart />, title: 'Shopping Lists', desc: 'Collaborate on family needs' },
    { icon: <FiMessageCircle />, title: 'Family Chat', desc: 'Stay connected instantly' },
    { icon: <FiCalendar />, title: 'Shared Calendar', desc: 'Never miss important events' }
  ];

  const benefits = [
    { icon: <FiShield />, title: 'Private & Secure', desc: 'Your data is encrypted' },
    { icon: <FiClock />, title: 'Real-time Sync', desc: 'Updates for everyone' },
    { icon: <FiSmartphone />, title: 'Works Everywhere', desc: 'Access on any device' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                <FiHome className="text-white text-xl" />
              </div>
              <span className="text-xl font-bold text-gray-900">Family Hub</span>
            </div>
            <Link to="/login">
              <button className="text-gray-600 hover:text-gray-900 font-medium text-sm">
                Sign In
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Your Family's Digital Home
          </h1>
          <p className="text-xl text-gray-600 mb-10 leading-relaxed">
            Connect, share, and stay organized with the people who matter most. 
            Create your private family space in seconds.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/create-family">
              <button className="px-8 py-4 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors">
                Start Your Family Hub
              </button>
            </Link>
            <Link to="/join-family">
              <button className="px-8 py-4 bg-white text-gray-700 font-medium rounded-xl border border-gray-300 hover:bg-gray-50 transition-colors">
                Join with Code
              </button>
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
            <span className="flex items-center space-x-2">
              <FiCheck className="text-green-500" />
              <span>Free to use</span>
            </span>
            <span className="flex items-center space-x-2">
              <FiCheck className="text-green-500" />
              <span>No credit card required</span>
            </span>
            <span className="flex items-center space-x-2">
              <FiCheck className="text-green-500" />
              <span>Set up in 60 seconds</span>
            </span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Everything your family needs
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600">
                  <span className="text-2xl">{feature.icon}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Built for modern families
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Whether you're managing a busy household or staying connected across distances, 
                Family Hub gives you the tools to bring everyone together.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 text-gray-600">
                      {benefit.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{benefit.title}</h4>
                      <p className="text-gray-600">{benefit.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-8 border border-gray-200">
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">👨‍👩‍👧‍👦</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">10,000+ Families</p>
                    <p className="text-sm text-gray-600">Trust Family Hub daily</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">📸</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">1M+ Memories</p>
                    <p className="text-sm text-gray-600">Shared and cherished</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">99.9% Uptime</p>
                    <p className="text-sm text-gray-600">Always there for you</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to bring your family together?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Join thousands of families already using Family Hub
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/create-family">
              <button className="px-8 py-4 bg-white text-indigo-600 font-medium rounded-xl hover:bg-gray-100 transition-colors">
                Get Started Free
              </button>
            </Link>
            <Link to="/join-family">
              <button className="px-8 py-4 bg-indigo-700 text-white font-medium rounded-xl hover:bg-indigo-800 transition-colors">
                I Have a Code
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FamilyLanding;