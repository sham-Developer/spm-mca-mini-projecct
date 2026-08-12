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
  ClipboardList,
  X
} from 'lucide-react';

export default function Sidebar({ user, onLogout, isOpen, setIsOpen }) {
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
    <aside className={`w-64 bg-white border-r border-slate-400 flex flex-col h-screen fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      <div className="p-6 border-b border-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-orange-600 rounded-lg flex items-center justify-center font-bold text-lg text-white">
            N
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-950 tracking-tight leading-none">NexTask</h1>
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-widest">Enterprise</span>
          </div>
        </div>
        <button 
          className="lg:hidden p-1.5 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-black cursor-pointer" 
          onClick={() => setIsOpen(false)}
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            end
            onClick={() => setIsOpen(false)}
            className={({ isActive }) => 
              `flex items-center gap-3 px-3.5 py-3 rounded-lg text-[14px] font-semibold transition-all duration-200 cursor-pointer ${
                isActive 
                  ? 'bg-orange-100 text-orange-700 border-l-2 border-orange-600 pl-2.5' 
                  : 'text-slate-800 hover:bg-slate-100 hover:text-black'
              }`
            }
          >
            <link.icon size={18} className="shrink-0 text-slate-700 stroke-[2]" />
            <span>{link.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-400 bg-slate-50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-slate-200 rounded-full flex items-center justify-center text-slate-800 font-bold uppercase text-[14px] border border-slate-400">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="overflow-hidden">
            <h4 className="text-[14px] font-bold text-slate-950 truncate">{user?.full_name}</h4>
            <p className="text-[12px] text-slate-700 font-medium capitalize truncate">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2.5 px-3 py-2.5 bg-white border border-slate-400 hover:bg-red-50 hover:text-red-700 text-slate-800 rounded-lg text-[14px] font-semibold transition-all duration-200 shadow-sm cursor-pointer"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
