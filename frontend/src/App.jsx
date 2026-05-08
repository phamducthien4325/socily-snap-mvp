import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import TopNav from './components/TopNav';
import LeftSidebar from './components/LeftSidebar';
import RightSidebar from './components/RightSidebar';
import PageTransition from './components/PageTransition';

import Login from './pages/Login';
import Register from './pages/Register';
import Feed from './pages/Feed';
import Discover from './pages/Discover';
import Profile from './pages/Profile';
import CreatePost from './pages/CreatePost';
import Group from './pages/Group';
import GraphDashboard from './pages/GraphDashboard';
import Notifications from './pages/Notifications';
import AdminManagement from './pages/AdminManagement';

function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user } = useAuth();
  const location = useLocation();

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  // Group page has its own sidebar
  const isGroupPage = location.pathname.startsWith('/group/');

  return (
    <>
      <TopNav toggleSidebar={toggleSidebar} />
      <main className="main-content">
        <LeftSidebar isOpen={isSidebarOpen} />
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
        {!isGroupPage && <RightSidebar />}
      </main>
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="app-container">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes (Dashboard) */}
            <Route element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route path="/feed" element={<Feed />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/notifications" element={<Notifications />} />

              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:username" element={<Profile />} />
              <Route path="/submit" element={<CreatePost />} />
              <Route path="/group/:id" element={<Group />} />
            </Route>

            {/* Admin Routes — cùng Layout */}
            <Route element={
              <ProtectedRoute adminOnly={true}>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route path="/graph-admin" element={<GraphDashboard />} />
              <Route path="/admin-management" element={<AdminManagement />} />
            </Route>

            {/* Default redirect */}
            <Route path="*" element={<Navigate to="/feed" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;


