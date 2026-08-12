import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ProjectHeadDashboard from './pages/ProjectHeadDashboard';
import TeamMemberDashboard from './pages/TeamMemberDashboard';
import ClientManagement from './pages/ClientManagement';
import HRManagement from './pages/HRManagement';
import Projects from './pages/Projects';

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('saas_user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('saas_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('saas_user');
  };

  // Helper route wrapper for layouts
  const ProtectedLayout = ({ children, allowedRoles, title }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    if (!user) {
      return <Navigate to="/login" replace />;
    }
    if (!allowedRoles.includes(user.role)) {
      // Redirect to correct workspace
      const redirectPath = user.role === 'admin' ? '/admin' : user.role === 'project_head' ? '/head' : '/member';
      return <Navigate to={redirectPath} replace />;
    }

    return (
      <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans">
        <Sidebar user={user} onLogout={handleLogout} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <div className="flex-1 flex flex-col min-w-0">
          <Header user={user} title={title} onMenuClick={() => setSidebarOpen(true)} />
          <main className="p-4 sm:p-8 flex-grow">
            {children}
          </main>
        </div>
      </div>
    );
  };

  return (
    <Router>
      <Routes>
        {/* Public Login Route */}
        <Route 
          path="/login" 
          element={user ? <Navigate to={user.role === 'admin' ? '/admin' : user.role === 'project_head' ? '/head' : '/member'} replace /> : <Login onLoginSuccess={handleLoginSuccess} />} 
        />

        {/* ADMIN WORKSPACE */}
        <Route 
          path="/admin" 
          element={
            <ProtectedLayout allowedRoles={['admin']} title="Executive Admin Dashboard">
              <AdminDashboard />
            </ProtectedLayout>
          } 
        />
        <Route 
          path="/admin/clients" 
          element={
            <ProtectedLayout allowedRoles={['admin']} title="Client Relationship Pipelines">
              <ClientManagement />
            </ProtectedLayout>
          } 
        />
        <Route 
          path="/admin/hr" 
          element={
            <ProtectedLayout allowedRoles={['admin']} title="Personnel & HR Management">
              <HRManagement />
            </ProtectedLayout>
          } 
        />
        <Route 
          path="/admin/projects" 
          element={
            <ProtectedLayout allowedRoles={['admin']} title="Corporate Projects Analytics">
              <Projects userRole="admin" currentUserId={user?.id} />
            </ProtectedLayout>
          } 
        />

        {/* PROJECT HEAD WORKSPACE */}
        <Route 
          path="/head" 
          element={
            <ProtectedLayout allowedRoles={['project_head']} title="Operational Project Head Dashboard">
              <ProjectHeadDashboard currentUserId={user?.id} />
            </ProtectedLayout>
          } 
        />
        <Route 
          path="/head/projects" 
          element={
            <ProtectedLayout allowedRoles={['project_head']} title="Workspace Boards & Allocations">
              <Projects userRole="project_head" currentUserId={user?.id} />
            </ProtectedLayout>
          } 
        />

        {/* TEAM MEMBER WORKSPACE */}
        <Route 
          path="/member" 
          element={
            <ProtectedLayout allowedRoles={['team_member']} title="Team Member Performance Workspace">
              <TeamMemberDashboard currentUserId={user?.id} />
            </ProtectedLayout>
          } 
        />
        <Route 
          path="/member/projects" 
          element={
            <ProtectedLayout allowedRoles={['team_member']} title="My Tasks & Activity Board">
              <Projects userRole="team_member" currentUserId={user?.id} />
            </ProtectedLayout>
          } 
        />

        {/* Catch-all Redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
