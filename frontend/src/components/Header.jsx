import React, { useState, useEffect } from 'react';
import { Bell, Calendar, User, Menu } from 'lucide-react';
import API_URL from '../config';

export default function Header({ user, title, onMenuClick }) {
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${API_URL}/notifications/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) {
      console.error('Error fetching notifications:', e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 8000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const handleMarkAsRead = async (id) => {
    try {
      await fetch(`${API_URL}/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;
    try {
      await fetch(`${API_URL}/notifications/user/${user.id}/read-all`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getShortTitle = (fullTitle) => {
    if (!fullTitle) return 'Dashboard';
    const mappings = {
      'Executive Admin Dashboard': 'Dashboard',
      'Client Relationship Pipelines': 'Clients',
      'Personnel & HR Management': 'HR Management',
      'Corporate Projects Analytics': 'Projects',
      'Operational Project Head Dashboard': 'Projects Board',
      'Workspace Boards & Allocations': 'Workspaces',
      'Team Member Performance Workspace': 'Workspace',
      'My Tasks & Activity Board': 'My Tasks'
    };
    return mappings[fullTitle] || fullTitle;
  };

  return (
    <header className="bg-white/80 border-b border-slate-400 h-16 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md min-h-[60px]">
      <div className="flex items-center gap-3 min-w-0 flex-1 pr-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 rounded-lg text-slate-800 hover:bg-slate-100 hover:text-black focus:outline-none cursor-pointer shrink-0"
        >
          <Menu size={20} />
        </button>
        <h2 className="text-[16px] sm:text-[18px] md:text-[20px] font-bold text-slate-950 tracking-tight truncate min-w-0" title={title}>
          <span className="sm:hidden">{getShortTitle(title)}</span>
          <span className="hidden sm:inline">{title || 'Dashboard'}</span>
        </h2>
      </div>

      <div className="flex items-center gap-4 sm:gap-6">
        <div className="hidden md:flex items-center gap-2 text-slate-800 text-[13px] bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-400 font-semibold">
          <Calendar size={14} className="stroke-[2]" />
          <span>{today}</span>
        </div>

        <div className="relative">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="relative w-9 h-9 flex items-center justify-center text-slate-700 hover:text-black bg-slate-50 rounded-lg border border-slate-400 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Bell size={18} className="stroke-[2]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-orange-600 text-white rounded-full text-[9px] w-4 h-4 flex items-center justify-center font-bold font-sans">
                {unreadCount}
              </span>
            )}
          </button>

          {isOpen && (
            <>
              <div 
                className="fixed inset-0 z-40 bg-transparent" 
                onClick={() => setIsOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-400 rounded-xl shadow-2xl z-50 text-slate-950 flex flex-col font-sans animate-fade-in">
                <div className="px-4 py-3 border-b border-slate-400 flex items-center justify-between bg-slate-50 rounded-t-xl">
                  <span className="text-[13px] font-bold text-slate-900 uppercase tracking-wider">Notifications</span>
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleMarkAllAsRead}
                      className="text-[11px] font-bold text-orange-600 hover:text-orange-500 cursor-pointer hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-200">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      onClick={() => {
                        if (!notif.is_read) handleMarkAsRead(notif.id);
                      }}
                      className={`p-3 text-left transition-colors cursor-pointer ${
                        notif.is_read ? 'hover:bg-slate-50 bg-white' : 'bg-slate-50/80 hover:bg-slate-100/90'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-1.5">
                        <h5 className={`text-[12.5px] leading-tight ${notif.is_read ? 'font-semibold text-slate-800' : 'font-bold text-slate-950'}`}>
                          {notif.title}
                        </h5>
                        <span className="text-[10px] text-slate-700 font-bold whitespace-nowrap">
                          {formatTimeAgo(notif.created_at)}
                        </span>
                      </div>
                      <p className="text-[11.5px] text-slate-700 font-medium mt-1 leading-normal">
                        {notif.message}
                      </p>
                    </div>
                  ))}

                  {notifications.length === 0 && (
                    <div className="p-6 text-center text-slate-600 font-semibold text-[12px]">
                      All caught up! No notifications.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="h-6 w-px bg-slate-400"></div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="block text-[14px] font-bold text-slate-950">{user?.full_name}</span>
            <span className="block text-[11px] text-slate-700 font-semibold uppercase tracking-widest">{user?.designation || user?.role?.replace('_', ' ')}</span>
          </div>
          <div className="w-9 h-9 bg-slate-200 text-slate-800 rounded-full flex items-center justify-center font-bold text-[14px] border border-slate-400">
            {user?.full_name?.substring(0, 2).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
