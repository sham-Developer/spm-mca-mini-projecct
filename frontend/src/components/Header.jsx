import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Calendar, 
  User, 
  Menu, 
  X, 
  Mail, 
  Phone, 
  Briefcase, 
  Shield, 
  MapPin, 
  Building, 
  LogOut, 
  Edit3, 
  Check, 
  Copy, 
  FileText, 
  Lock
} from 'lucide-react';
import API_URL from '../config';
import { useUI } from './UIProvider';

export default function Header({ user, title, onMenuClick, onLogout, onUserUpdate }) {
  const { showToast } = useUI();
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  // Profile Popup State
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileData, setProfileData] = useState(user);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFullName, setEditFullName] = useState(user?.full_name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editAddress, setEditAddress] = useState(user?.address || '');
  const [editPassword, setEditPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Sync profile data when prop changes
  useEffect(() => {
    if (user) {
      setProfileData(user);
      setEditFullName(user.full_name || '');
      setEditPhone(user.phone || '');
      setEditAddress(user.address || '');
    }
  }, [user]);

  // Fetch fresh profile data whenever popup is opened
  const fetchFreshProfile = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${API_URL}/users/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setProfileData(data);
        setEditFullName(data.full_name || '');
        setEditPhone(data.phone || '');
        setEditAddress(data.address || '');
      }
    } catch (e) {
      console.error('Error fetching profile:', e);
    }
  };

  const handleOpenProfile = () => {
    fetchFreshProfile();
    setIsProfileOpen(true);
    setIsEditingProfile(false);
  };

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

  const formatDateToDMY = (dateStr) => {
    if (!dateStr) return '--';
    try {
      const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
      const parts = cleanDate.split('-');
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return cleanDate;
      }
      return dateStr;
    } catch (e) {
      return dateStr;
    }
  };

  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast(`Copied ${label} to clipboard`, 'success');
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!user?.id) return;
    setSavingProfile(true);

    const payload = {
      ...profileData,
      full_name: editFullName,
      phone: editPhone,
      address: editAddress
    };

    if (editPassword.trim()) {
      payload.password_hash = editPassword.trim();
    }

    try {
      const res = await fetch(`${API_URL}/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const updated = await res.json();
        setProfileData(updated);
        onUserUpdate?.(updated);
        showToast('Profile updated successfully', 'success');
        setIsEditingProfile(false);
        setEditPassword('');
      } else {
        showToast('Failed to update profile', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error saving profile changes', 'error');
    } finally {
      setSavingProfile(false);
    }
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

  const initials = (profileData?.full_name || user?.full_name || 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <>
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
          <div className="hidden md:flex items-center gap-2 text-slate-900 text-[13px] bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-400 font-medium">
            <Calendar size={14} className="stroke-[2]" />
            <span>{today}</span>
          </div>

          <div className="relative">
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="relative w-9 h-9 flex items-center justify-center text-slate-900 hover:text-black bg-slate-50 rounded-lg border border-slate-400 hover:bg-slate-100 transition-colors cursor-pointer"
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
                    <span className="text-[13px] font-medium text-slate-950 uppercase tracking-wider">Notifications</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={handleMarkAllAsRead}
                        className="text-[11px] font-medium text-orange-600 hover:text-orange-500 cursor-pointer hover:underline"
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
                          <h5 className={`text-[12.5px] leading-tight ${notif.is_read ? 'font-medium text-slate-900' : 'font-bold text-slate-950'}`}>
                            {notif.title}
                          </h5>
                          <span className="text-[10px] text-slate-900 font-medium whitespace-nowrap">
                            {formatTimeAgo(notif.created_at)}
                          </span>
                        </div>
                        <p className="text-[11.5px] text-slate-900 font-normal mt-1 leading-normal">
                          {notif.message}
                        </p>
                      </div>
                    ))}

                    {notifications.length === 0 && (
                      <div className="p-6 text-center text-slate-900 font-medium text-[12px]">
                        All caught up! No notifications.
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="h-6 w-px bg-slate-400"></div>

          {/* INTERACTIVE USER PROFILE TRIGGER */}
          <button
            type="button"
            onClick={handleOpenProfile}
            className="flex items-center gap-3 p-1 rounded-xl hover:bg-slate-100 transition-all cursor-pointer border border-transparent hover:border-slate-300 group text-left focus:outline-none"
            title="Click to view detailed profile"
          >
            <div className="text-right hidden sm:block">
              <span className="block text-[14px] font-bold text-slate-950 group-hover:text-orange-600 transition-colors">
                {profileData?.full_name || user?.full_name}
              </span>
              <span className="block text-[11px] text-slate-900 font-medium uppercase tracking-widest">
                {profileData?.designation || user?.designation || (user?.role?.replace('_', ' '))}
              </span>
            </div>
            <div className="w-9 h-9 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center font-bold text-[13px] border border-orange-300 shadow-xs group-hover:scale-105 transition-transform">
              {initials}
            </div>
          </button>
        </div>
      </header>

      {/* DETAILED USER PROFILE POPUP MODAL */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in-fast font-sans">
          <div className="w-full max-w-lg bg-white border border-slate-400 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-950 animate-scale-up relative">
            
            {/* CLEAN MODAL TOP BAR (NO GRADIENTS) */}
            <div className="bg-slate-50 border-b border-slate-300 px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="text-[17px] font-bold text-slate-950 leading-tight">
                    User Profile
                  </h3>
                  <p className="text-[12px] font-normal text-slate-900 mt-0.5">
                    Account credentials & employee records
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => { setIsProfileOpen(false); setIsEditingProfile(false); }}
                className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-200 text-slate-950 hover:text-black cursor-pointer transition-colors"
                title="Close profile"
              >
                <X size={18} />
              </button>
            </div>

            {/* IDENTITY SPOTLIGHT SECTION (CLEAN & NON-OVERLAPPING) */}
            <div className="px-6 py-4 bg-white border-b border-slate-200 shrink-0">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-14 h-14 rounded-full bg-orange-100 text-orange-700 border-2 border-orange-300 shadow-xs flex items-center justify-center text-[18px] font-bold shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-[17px] font-bold text-slate-950 truncate leading-tight">
                        {profileData?.full_name || user?.full_name}
                      </h4>
                      <span className="px-2 py-0.5 bg-orange-100 text-orange-950 border border-orange-200 rounded-full text-[10.5px] font-medium uppercase tracking-wide shrink-0">
                        {profileData?.role?.replace('_', ' ') || user?.role}
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-950 border border-emerald-200 rounded-full text-[10.5px] font-medium uppercase tracking-wide flex items-center gap-1 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                        {profileData?.status || 'active'}
                      </span>
                    </div>
                    <p className="text-[12px] font-normal text-slate-900 mt-0.5 truncate">
                      {profileData?.designation || 'Staff Member'} &bull; {profileData?.department || 'Operations'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* SCROLLABLE BODY */}
            <div className="px-6 py-5 overflow-y-auto max-h-[62vh] space-y-4 bg-slate-50/60">
              {isEditingProfile ? (
                /* INLINE EDIT FORM */
                <form onSubmit={handleSaveProfile} className="space-y-3.5 bg-white border border-slate-300 rounded-xl p-4 shadow-xs">
                  <div className="border-b border-slate-200 pb-2">
                    <h4 className="text-[14px] font-bold text-slate-950">Edit Profile Details</h4>
                    <p className="text-[11.5px] font-normal text-slate-900">Update your name, contact phone, or credentials</p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-900 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-950 text-[13px] font-normal focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-900 mb-1">Contact Phone</label>
                    <input
                      type="text"
                      placeholder="e.g. +91 9876543210"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-950 text-[13px] font-normal focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-900 mb-1">Residential Address</label>
                    <textarea
                      rows="2"
                      placeholder="Enter street, city, postal code"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-950 text-[13px] font-normal focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-900 mb-1">Change Password (optional)</label>
                    <input
                      type="password"
                      placeholder="Leave blank to keep current password"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-950 text-[13px] font-normal focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl text-[12px] font-medium border border-slate-300 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="px-4 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-[12px] font-medium shadow-xs cursor-pointer transition-all hover:scale-[1.02] flex items-center gap-1.5"
                    >
                      {savingProfile && <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-white"></div>}
                      <span>Save Changes</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* PROFILE INFORMATION CARDS */
                <>
                  {/* WORK & ORGANIZATION DETAILS */}
                  <div className="bg-white border border-slate-300 rounded-xl p-4 shadow-xs space-y-3">
                    <span className="text-[12px] font-medium text-slate-950 uppercase tracking-wider block">
                      Work & Position
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 text-left">
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0 mt-0.5">
                          <Building size={14} />
                        </div>
                        <div>
                          <span className="block text-[11px] font-medium text-slate-900 uppercase">Department</span>
                          <span className="block text-[13px] font-normal text-slate-950">{profileData?.department || 'Executive'}</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0 mt-0.5">
                          <Briefcase size={14} />
                        </div>
                        <div>
                          <span className="block text-[11px] font-medium text-slate-900 uppercase">Designation</span>
                          <span className="block text-[13px] font-normal text-slate-950">{profileData?.designation || 'Staff'}</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0 mt-0.5">
                          <Calendar size={14} />
                        </div>
                        <div>
                          <span className="block text-[11px] font-medium text-slate-900 uppercase">Date of Joining</span>
                          <span className="block text-[13px] font-normal text-slate-950">{formatDateToDMY(profileData?.joins_date)}</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0 mt-0.5">
                          <Shield size={14} />
                        </div>
                        <div>
                          <span className="block text-[11px] font-medium text-slate-900 uppercase">Employment Type</span>
                          <span className="block text-[13px] font-normal text-slate-950 uppercase">{profileData?.employment_type || 'on role'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CONTACT DETAILS */}
                  <div className="bg-white border border-slate-300 rounded-xl p-4 shadow-xs space-y-3">
                    <span className="text-[12px] font-medium text-slate-950 uppercase tracking-wider block">
                      Contact Information
                    </span>
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Mail size={15} className="text-slate-800 shrink-0" />
                          <div className="min-w-0">
                            <span className="block text-[11px] font-medium text-slate-900 uppercase">Email Address</span>
                            <span className="block text-[13px] font-normal text-slate-950 truncate">{profileData?.email}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(profileData?.email, 'Email')}
                          className="p-1.5 hover:bg-slate-200 text-slate-900 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="Copy email"
                        >
                          <Copy size={13} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Phone size={15} className="text-slate-800 shrink-0" />
                          <div className="min-w-0">
                            <span className="block text-[11px] font-medium text-slate-900 uppercase">Phone Number</span>
                            <span className="block text-[13px] font-normal text-slate-950">{profileData?.phone || 'Not provided'}</span>
                          </div>
                        </div>
                        {profileData?.phone && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(profileData?.phone, 'Phone')}
                            className="p-1.5 hover:bg-slate-200 text-slate-900 rounded-lg transition-colors cursor-pointer shrink-0"
                            title="Copy phone"
                          >
                            <Copy size={13} />
                          </button>
                        )}
                      </div>

                      {profileData?.address && (
                        <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                          <MapPin size={15} className="text-slate-800 shrink-0 mt-0.5" />
                          <div>
                            <span className="block text-[11px] font-medium text-slate-900 uppercase">Residential Address</span>
                            <span className="block text-[13px] font-normal text-slate-950 leading-relaxed">{profileData.address}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* PERSONAL & RECORD DETAILS */}
                  <div className="bg-white border border-slate-300 rounded-xl p-4 shadow-xs space-y-3">
                    <span className="text-[12px] font-medium text-slate-950 uppercase tracking-wider block">
                      Personal & Documents
                    </span>
                    <div className="grid grid-cols-2 gap-3 text-left">
                      <div>
                        <span className="block text-[11px] font-medium text-slate-900 uppercase">Date of Birth</span>
                        <span className="block text-[13px] font-normal text-slate-950">{formatDateToDMY(profileData?.dob)}</span>
                      </div>
                      <div>
                        <span className="block text-[11px] font-medium text-slate-900 uppercase">Gender</span>
                        <span className="block text-[13px] font-normal text-slate-950 capitalize">{profileData?.gender || 'Not specified'}</span>
                      </div>
                      <div className="col-span-2 pt-2 border-t border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText size={14} className="text-orange-600" />
                          <span className="text-[12px] font-medium text-slate-950">Deposited Documents</span>
                        </div>
                        <span className="px-2 py-0.5 bg-orange-50 border border-orange-200 text-orange-950 rounded-full text-[11px] font-medium">
                          {Array.isArray(profileData?.documents) ? profileData.documents.length : 0} Files
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* POPUP FOOTER */}
            <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
              {onLogout ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    onLogout();
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 rounded-xl text-[12px] font-medium transition-colors cursor-pointer"
                  title="Sign out of account"
                >
                  <LogOut size={14} />
                  <span>Logout</span>
                </button>
              ) : (
                <div></div>
              )}

              <div className="flex items-center gap-2">
                {!isEditingProfile ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-950 border border-slate-300 rounded-xl text-[12px] font-medium transition-colors cursor-pointer"
                  >
                    <Edit3 size={13} />
                    <span>Edit Profile</span>
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => { setIsProfileOpen(false); setIsEditingProfile(false); }}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-[12px] font-medium shadow-xs cursor-pointer transition-all hover:scale-[1.02]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
