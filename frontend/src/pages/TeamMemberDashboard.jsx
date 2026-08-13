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
    <div className="space-y-8 animate-fade-in">
      {/* Team member KPI overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 bg-white p-6 rounded-xl border border-slate-400 shadow-md">
        <div className="space-y-1">
          <span className="text-[12px] font-bold text-slate-800 uppercase tracking-widest">My Assigned Tasks</span>
          <h3 className="text-[28px] font-bold text-slate-900 tracking-tight">{stats.myTasksCount}</h3>
        </div>

        <div className="space-y-1 sm:border-l sm:border-slate-400 sm:pl-6">
          <span className="text-[12px] font-bold text-slate-800 uppercase tracking-widest">To Do / In Progress</span>
          <h3 className="text-[28px] font-bold text-slate-900 tracking-tight">{stats.todoTasksCount}</h3>
        </div>

        <div className="space-y-1 md:border-l md:border-slate-400 md:pl-6">
          <span className="text-[12px] font-bold text-slate-800 uppercase tracking-widest">Submitted (In Review)</span>
          <h3 className="text-[28px] font-bold text-blue-700 tracking-tight">{stats.reviewTasksCount}</h3>
        </div>

        <div className="space-y-1 md:border-l md:border-slate-400 md:pl-6">
          <span className="text-[12px] font-bold text-slate-800 uppercase tracking-widest">Tasks Approved</span>
          <h3 className="text-[28px] font-bold text-emerald-700 tracking-tight">{stats.completedTasksCount}</h3>
        </div>
      </div>

      {/* Task progression list */}
      <div className="space-y-4">
        <div>
          <h3 className="text-[18px] font-bold text-slate-950 tracking-tight">My Work Deliverables</h3>
          <p className="text-[13px] text-slate-700 font-medium">Review specifications and report progressions of assigned workflows</p>
        </div>

        <div className="bg-white border border-slate-400 rounded-xl overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-400 bg-slate-100">
                  <th className="border border-slate-300 p-4 text-[13px] font-bold text-slate-950 uppercase tracking-wider w-16 text-center">S.No.</th>
                  <th className="border border-slate-300 p-4 text-[13px] font-bold text-slate-955 uppercase tracking-wider">Deliverable / Project</th>
                  <th className="border border-slate-300 p-4 text-[13px] font-bold text-slate-955 uppercase tracking-wider">Duration Limits</th>
                  <th className="border border-slate-300 p-4 text-[13px] font-bold text-slate-955 uppercase tracking-wider">Status</th>
                  <th className="border border-slate-300 p-4 text-[13px] font-bold text-slate-955 uppercase tracking-wider">Instructions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {currentTasks.map((task, index) => (
                  <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                    <td className="border border-slate-300 p-4 text-[14px] font-bold text-slate-950 text-center">
                      {indexOfFirstItem + index + 1}
                    </td>
                    <td className="border border-slate-300 p-4">
                      <span className="block text-[15px] font-bold text-slate-955">{task.title}</span>
                      <span className="block text-[12px] text-slate-700 font-medium">{task.project?.name}</span>
                    </td>
                    <td className="border border-slate-300 p-4 text-[14px] text-slate-900 font-medium">
                      <div>{task.start_date} <span className="text-slate-600 text-[12px] font-bold">to</span> {task.end_date}</div>
                    </td>
                    <td className="border border-slate-300 p-4">
                      <span className={`inline-block text-[11px] font-bold uppercase px-2.5 py-1 rounded-full ${
                        task.status === 'completed' 
                          ? 'bg-emerald-100 text-emerald-950 border border-emerald-400' 
                          : task.status === 'review'
                          ? 'bg-blue-100 text-blue-950 border border-blue-400'
                          : 'bg-slate-200 text-slate-950 border border-slate-400'
                      }`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="border border-slate-300 p-4 text-[13px] text-slate-800 font-medium max-w-sm whitespace-normal break-words">
                      {task.description || 'No special requirements.'}
                    </td>
                  </tr>
                ))}
                {tasks.length === 0 && (
                  <tr>
                    <td colSpan="5" className="border border-slate-300 p-8 text-center text-slate-700 text-[14px] font-medium">No deliverables currently assigned. Enjoy the light day!</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 bg-slate-100 border-t border-slate-400 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-slate-400 text-sm font-bold rounded-md text-slate-900 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-400 text-sm font-bold rounded-md text-slate-900 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-900 font-bold">
                    Showing <span className="font-extrabold">{indexOfFirstItem + 1}</span> to <span className="font-extrabold">{Math.min(indexOfLastItem, tasks.length)}</span> of <span className="font-extrabold">{tasks.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-3 py-2 rounded-l-md border border-slate-400 bg-white text-sm font-bold text-slate-900 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`relative inline-flex items-center px-4 py-2 border border-slate-400 text-sm font-bold ${
                          currentPage === i + 1
                            ? 'z-10 bg-orange-600 text-white'
                            : 'bg-white text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-3 py-2 rounded-r-md border border-slate-400 bg-white text-sm font-bold text-slate-900 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
