import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UserCheck, 
  Users, 
  FolderKanban, 
  Clock, 
  ClipboardList,
  X
} from './Iconify';

export default function Sidebar({ user, onLogout, isOpen, setIsOpen }) {
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
          { name: 'Leaves & Permissions', path: '/head/leaves', icon: Clock },
        ];
      case 'team_member':
        return [
          { name: 'My Dashboard', path: '/member', icon: LayoutDashboard },
          { name: 'Project Space', path: '/member/projects', icon: ClipboardList },
          { name: 'Leaves & Permissions', path: '/member/leaves', icon: Clock },
        ];
      default:
        return [];
    }
  };

  const links = getLinksByRole();

  return (
    <aside className={`w-64 bg-white border-r-2 border-slate-300 flex flex-col h-screen fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto ${
      isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
    }`}>
      {/* Brand Header */}
      <div className="p-5 border-b-2 border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-700 to-indigo-700 rounded-xl flex items-center justify-center font-semibold text-lg text-white shadow-md shadow-blue-600/30">
            N
          </div>
          <div>
            <h1 className="font-semibold text-[17px] text-slate-950 tracking-tight leading-none">NexTask</h1>
            <span className="text-[10px] font-semibold text-blue-800 uppercase tracking-wider bg-blue-100 border border-blue-300 px-1.5 py-0.5 rounded-md inline-block mt-1">Enterprise Suite</span>
          </div>
        </div>
        <button 
          className="lg:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-200 hover:text-slate-950 transition-colors cursor-pointer" 
          onClick={() => setIsOpen(false)}
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Navigation</div>
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            end
            onClick={() => setIsOpen(false)}
            className={({ isActive }) => 
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] font-medium transition-all duration-150 cursor-pointer ${
                isActive 
                  ? 'bg-blue-100 text-blue-900 font-semibold border-2 border-blue-400 shadow-sm' 
                  : 'text-slate-800 hover:bg-slate-100 hover:text-slate-950 border border-transparent'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <link.icon 
                  size={19} 
                  className={`shrink-0 transition-colors ${
                    isActive ? 'text-blue-700 stroke-[2.4]' : 'text-slate-600 group-hover:text-slate-900 stroke-[2]'
                  }`} 
                />
                <span>{link.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
