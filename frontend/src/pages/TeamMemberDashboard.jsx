import React, { useEffect, useState } from 'react';
import { 
  ClipboardList, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import API_URL from '../config';

export default function TeamMemberDashboard({ currentUserId }) {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({
    myTasksCount: 0,
    todoTasksCount: 0,
    reviewTasksCount: 0,
    completedTasksCount: 0
  });
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchMemberDashboardData = async () => {
      try {
        const response = await fetch(`${API_URL}/tasks`);
        const allTasks = await response.json();

        // Filter tasks assigned to this team member
        const myTasks = allTasks.filter(t => t.assigned_to === currentUserId);

        setTasks(myTasks);
        setStats({
          myTasksCount: myTasks.length,
          todoTasksCount: myTasks.filter(t => t.status === 'todo').length,
          reviewTasksCount: myTasks.filter(t => t.status === 'review').length,
          completedTasksCount: myTasks.filter(t => t.status === 'completed').length
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchMemberDashboardData();
  }, [currentUserId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-500"></div>
      </div>
    );
  }

  // Calculate total pages and slice current items
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTasks = tasks.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(tasks.length / itemsPerPage);

  return (
    <div className="space-y-8 animate-fade-in text-slate-955 font-sans">
      {/* Page Header */}
      <div>
        <h2 className="text-[22px] font-black text-slate-955 tracking-tight">Developer Workspace</h2>
        <p className="text-[13px] text-slate-700 font-semibold">Track your active allocations, submit progress reports, and review completed deliverables</p>
      </div>

      {/* Team member KPI overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {/* My Assigned Tasks */}
        <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl shadow-md p-5 flex items-start justify-between transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg">
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-widest block">Total Assigned</span>
            <h3 className="text-[30px] font-black text-slate-950 tracking-tight">{stats.myTasksCount}</h3>
          </div>
          <div className="p-3 bg-slate-700 rounded-xl text-white shadow-md shadow-slate-700/10">
            <ClipboardList size={20} className="stroke-[2.5]" />
          </div>
        </div>

        {/* To Do / In Progress */}
        <div className="bg-gradient-to-br from-orange-50 to-white border border-orange-100 rounded-2xl shadow-md p-5 flex items-start justify-between transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg">
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-orange-950 uppercase tracking-widest block">In Progress</span>
            <h3 className="text-[30px] font-black text-slate-950 tracking-tight">{stats.todoTasksCount}</h3>
          </div>
          <div className="p-3 bg-orange-600 rounded-xl text-white shadow-md shadow-orange-600/10">
            <Clock size={20} className="stroke-[2.5]" />
          </div>
        </div>

        {/* Submitted (In Review) */}
        <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-2xl shadow-md p-5 flex items-start justify-between transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg">
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-blue-900 uppercase tracking-widest block">Pending Review</span>
            <h3 className="text-[30px] font-black text-blue-900 tracking-tight">{stats.reviewTasksCount}</h3>
          </div>
          <div className="p-3 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-600/10">
            <Calendar size={20} className="stroke-[2.5]" />
          </div>
        </div>

        {/* Tasks Approved */}
        <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-2xl shadow-md p-5 flex items-start justify-between transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg">
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-emerald-950 uppercase tracking-widest block">Tasks Completed</span>
            <h3 className="text-[30px] font-black text-emerald-800 tracking-tight">{stats.completedTasksCount}</h3>
          </div>
          <div className="p-3 bg-emerald-600 rounded-xl text-white shadow-md shadow-emerald-600/10">
            <CheckCircle2 size={20} className="stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* Task progression list */}
      <div className="space-y-4">
        <div>
          <h3 className="text-[17px] font-extrabold text-slate-955 tracking-tight">My Deliverables</h3>
          <p className="text-[12px] text-slate-600 font-medium">Review specifications and report progressions of assigned workflows</p>
        </div>

        <div className="bg-white border border-slate-300 rounded-2xl overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#334155] text-white">
                  <th className="px-4 py-2.5 text-[12px] font-bold text-center border border-[#5f5f5f] w-16">S.No.</th>
                  <th className="px-4 py-2.5 text-[12px] font-bold text-left border border-[#5f5f5f]">Deliverable / Project</th>
                  <th className="px-4 py-2.5 text-[12px] font-bold text-left border border-[#5f5f5f]">Duration limits</th>
                  <th className="px-4 py-2.5 text-[12px] font-bold text-left border border-[#5f5f5f]">Progress</th>
                  <th className="px-4 py-2.5 text-[12px] font-bold text-left border border-[#5f5f5f]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {currentTasks.map((task, index) => (
                  <tr key={task.id} className="hover:bg-slate-50 transition-colors text-slate-955 font-medium">
                    <td className="px-4 py-3 text-[13px] font-bold text-slate-900 border border-slate-300 text-center">
                      {indexOfFirstItem + index + 1}
                    </td>
                    <td className="px-4 py-3 border border-slate-300">
                      <span className="block text-[14px] font-bold text-slate-955">{task.title}</span>
                      <span className="block text-[11px] text-slate-600 font-bold mt-0.5">{task.project?.name}</span>
                    </td>
                    <td className="px-4 py-3 border border-slate-300 text-[13px] text-slate-900 font-bold whitespace-nowrap">
                      <div>{task.start_date} <span className="text-slate-500 font-bold text-[10px] uppercase">to</span> {task.end_date}</div>
                    </td>
                    <td className="px-4 py-3 border border-slate-300">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden border border-slate-300">
                          <div 
                            className="bg-orange-600 h-full rounded-full transition-all duration-300"
                            style={{ width: `${task.progress || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-[11px] font-extrabold text-slate-800">{task.progress || 0}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 border border-slate-300">
                      <span className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        task.status === 'completed' 
                          ? 'bg-emerald-100 text-emerald-955 border border-emerald-400' 
                          : task.status === 'review'
                          ? 'bg-purple-100 text-purple-955 border border-purple-400'
                          : task.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-955 border border-blue-400'
                          : 'bg-slate-200 text-slate-950 border border-slate-400'
                      }`}>
                        {task.status === 'in_progress' ? 'In Progress' : task.status === 'todo' ? 'To Do' : task.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {tasks.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-slate-700 text-[13px] font-semibold border border-slate-300">No deliverables currently assigned. Enjoy the light day!</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-300 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-xs font-bold rounded-xl text-slate-900 bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-300 text-xs font-bold rounded-xl text-slate-900 bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-[12px] text-slate-800 font-bold">
                    Showing <span className="font-extrabold">{indexOfFirstItem + 1}</span> to <span className="font-extrabold">{Math.min(indexOfLastItem, tasks.length)}</span> of <span className="font-extrabold">{tasks.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-full shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      className="relative inline-flex items-center px-3 py-1.5 rounded-l-full border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Previous
                    </button>
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`relative inline-flex items-center px-3.5 py-1.5 border-t border-b border-slate-300 text-xs font-extrabold transition-colors cursor-pointer ${
                          currentPage === i + 1
                            ? 'z-10 bg-orange-600 text-white'
                            : 'bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      className="relative inline-flex items-center px-3 py-1.5 rounded-r-full border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
