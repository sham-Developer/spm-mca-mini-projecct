import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  UserCheck, 
  LogOut, 
  FolderKanban, 
  Clock, 
  ClipboardList 
} from 'lucide-react';

export default function Sidebar({ user, onLogout }) {
  const navigate = useNavigate();

  const getLinksByRole = () => {
    switch (user?.role) {
      case 'admin':
        return [
          { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
          { name: 'Clients & Leads', path: '/admin/clients', icon: UserCheck },
          { name: 'HR Management', path: '/admin/hr', icon: Users },
          { name: 'Projects View', path: '/admin/projects', icon: FolderKanban },
        ];
      case 'project_head':
        return [
          { name: 'Dashboard', path: '/head', icon: LayoutDashboard },
          { name: 'Project Module', path: '/head/projects', icon: FolderKanban },
        ];
      case 'team_member':
        return [
          { name: 'My Dashboard', path: '/member', icon: LayoutDashboard },
          { name: 'Project Space', path: '/member/projects', icon: ClipboardList },
        ];
      default:
        return [];
    }
  };

  const links = getLinksByRole();

  return (
    <aside className="w-64 bg-[#18181b] border-r border-[#27272a] flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-[#27272a]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-lg text-white">
            N
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-zinc-100 tracking-tight leading-none">NexTask</h1>
            <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-widest">Enterprise</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1.5">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            end
            className={({ isActive }) => 
              `flex items-center gap-3 px-3.5 py-3 rounded-lg text-[14px] font-medium transition-all duration-200 ${
                isActive 
                  ? 'bg-indigo-600/10 text-indigo-400 border-l-2 border-indigo-500 pl-2.5' 
                  : 'text-zinc-400 hover:bg-[#202024] hover:text-zinc-200'
              }`
            }
          >
            <link.icon size={18} className="shrink-0" />
            <span>{link.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-[#27272a] bg-[#141416]/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-[#27272a] rounded-full flex items-center justify-center text-zinc-300 font-bold uppercase text-[14px]">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="overflow-hidden">
            <h4 className="text-[14px] font-semibold text-zinc-200 truncate">{user?.full_name}</h4>
            <p className="text-[12px] text-zinc-500 capitalize truncate">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2.5 px-3 py-2.5 bg-[#202024] hover:bg-red-950/20 hover:text-red-400 text-zinc-400 rounded-lg text-[14px] font-medium transition-all duration-200"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
