import React from 'react';
import { Bell, Calendar, User, Menu } from 'lucide-react';

export default function Header({ user, title, onMenuClick }) {
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <header className="bg-white/80 border-b border-slate-400 h-16 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 rounded-lg text-slate-800 hover:bg-slate-100 hover:text-black focus:outline-none cursor-pointer"
        >
          <Menu size={20} />
        </button>
        <h2 className="text-[18px] sm:text-[20px] font-bold text-slate-950 tracking-tight truncate">{title || 'Dashboard'}</h2>
      </div>

      <div className="flex items-center gap-4 sm:gap-6">
        <div className="hidden md:flex items-center gap-2 text-slate-800 text-[13px] bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-400 font-semibold">
          <Calendar size={14} className="stroke-[2]" />
          <span>{today}</span>
        </div>

        <button className="relative w-9 h-9 flex items-center justify-center text-slate-700 hover:text-black bg-slate-50 rounded-lg border border-slate-400 hover:bg-slate-100 transition-colors cursor-pointer">
          <Bell size={18} className="stroke-[2]" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-600 rounded-full"></span>
        </button>

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
