import logo from './logo.svg';
import './App.css';

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import FamilyLanding from './pages/FamilyLanding';
import CreateFamily from './pages/CreateFamily';
import JoinFamily from './pages/JoinFamily';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LoadingScreen from './components/LoadingScreen';
import axiosInstance from './utils/axios';
import './App.css';
import { SocketProvider } from './contexts/SocketContext';
import GroceryList from './components/GroceryList';
import Calendar from './components/Calendar';
import Lists from './components/Lists';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axiosInstance.get('/user')
        .then(() => setIsAuthenticated(true))
        .catch(() => {
          localStorage.clear();
          setIsAuthenticated(false);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      <SocketProvider>
        <Routes>
          <Route path="/" element={!isAuthenticated ? <FamilyLanding /> : <Navigate to="/dashboard" />} />
          <Route path="/create-family" element={!isAuthenticated ? <CreateFamily setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/dashboard" />} />
          <Route path="/join-family" element={!isAuthenticated ? <JoinFamily setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/dashboard" />} />
          <Route path="/login" element={!isAuthenticated ? <Login setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={isAuthenticated ? <Dashboard setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/" />} />
          <Route
            path="/grocery"
            element={
              isAuthenticated ? (
                <GroceryList setIsAuthenticated={setIsAuthenticated} />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/calendar"
            element={
              isAuthenticated ? (
                <Calendar setIsAuthenticated={setIsAuthenticated} />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/lists"
            element={
              isAuthenticated ? (
                <Lists />
              ) : (
                <Navigate to="/" />
              )
            }
          />
        </Routes>
      </SocketProvider>
    </Router>
  );
}

export default App;
