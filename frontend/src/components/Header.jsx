import React from 'react';
import { Bell, Calendar, User } from 'lucide-react';

export default function Header({ user, title }) {
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <header className="bg-[#121214] border-b border-[#27272a] h-16 px-8 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md bg-opacity-90">
      <div>
        <h2 className="text-[20px] font-bold text-zinc-100 tracking-tight">{title || 'Dashboard'}</h2>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-zinc-400 text-[13px] bg-[#18181b] px-3 py-1.5 rounded-lg border border-[#27272a]">
          <Calendar size={14} />
          <span>{today}</span>
        </div>

        <button className="relative w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-zinc-200 bg-[#18181b] rounded-lg border border-[#27272a] hover:bg-[#202024] transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full"></span>
        </button>

        <div className="h-6 w-px bg-[#27272a]"></div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="block text-[14px] font-semibold text-zinc-200">{user?.full_name}</span>
            <span className="block text-[11px] text-zinc-500 uppercase tracking-wider">{user?.designation || user?.role?.replace('_', ' ')}</span>
          </div>
          <div className="w-9 h-9 bg-indigo-600/20 text-indigo-400 rounded-full flex items-center justify-center font-semibold text-[14px] border border-indigo-500/30">
            {user?.full_name?.substring(0, 2).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
