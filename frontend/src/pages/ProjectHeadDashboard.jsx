import React, { useEffect, useState } from 'react';
import { 
  FolderKanban, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Users 
} from 'lucide-react';
import API_URL from '../config';

export default function ProjectHeadDashboard({ currentUserId }) {
  const [stats, setStats] = useState({
    managedProjectsCount: 0,
    allocatedTasksCount: 0,
    pendingDeadlineRequestsCount: 0,
    completedTasksCount: 0
  });
  const [tasks, setTasks] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchHeadDashboardData = async () => {
    setLoading(true);
    try {
      const [projRes, taskRes, reqRes, repRes] = await Promise.all([
        fetch(`${API_URL}/projects`),
        fetch(`${API_URL}/tasks`),
        fetch(`${API_URL}/deadline-requests`),
        fetch(`${API_URL}/reports`)
      ]);
      const projects = await projRes.json();
      const allTasks = await taskRes.json();
      const requests = await reqRes.json();
      const allReports = await repRes.json();

      const headProjects = projects.filter(p => p.project_head_id === currentUserId);
      const headProjectIds = headProjects.map(p => p.id);

      const headTasks = allTasks.filter(t => headProjectIds.includes(t.project_id));
      const headRequests = requests.filter(r => headTasks.map(t => t.id).includes(r.task_id) && r.status === 'pending');
      const headReports = allReports.filter(rep => headTasks.map(t => t.id).includes(rep.task_id));

      setTasks(headTasks);
      setReports(headReports);

      setStats({
        managedProjectsCount: headProjects.length,
        allocatedTasksCount: headTasks.length,
        pendingDeadlineRequestsCount: headRequests.length,
        completedTasksCount: headTasks.filter(t => t.status === 'completed').length
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHeadDashboardData();
  }, [currentUserId]);

  const handleApproveReport = async (reportId, taskId) => {
    try {
      // 1. Approve report
      await fetch(`${API_URL}/reports/${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' })
      });
      // 2. Mark task as Completed
      await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });
      // Trigger data reload smoothly
      fetchHeadDashboardData();
    } catch (e) {
      console.error(e);
    }
  };


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
    <div className="space-y-8 animate-fade-in text-slate-955">
      {/* Page Header */}
      <div>
        <h2 className="text-[22px] font-black text-slate-950 tracking-tight">Project Management Board</h2>
        <p className="text-[13px] text-slate-700 font-semibold">Track task completion workflows, approve progress entries, and review project extensions</p>
      </div>

      {/* Project head overview stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {/* Managed Workspaces */}
        <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-2xl shadow-md p-5 flex items-start justify-between transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg">
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-widest block">Workspaces Managed</span>
            <h3 className="text-[30px] font-black text-slate-950 tracking-tight">{stats.managedProjectsCount}</h3>
          </div>
          <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-600/10">
            <FolderKanban size={20} className="stroke-[2.5]" />
          </div>
        </div>

        {/* Tasks Allocated */}
        <div className="bg-gradient-to-br from-violet-50 to-white border border-violet-100 rounded-2xl shadow-md p-5 flex items-start justify-between transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg">
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-violet-900 uppercase tracking-widest block">Allocations</span>
            <h3 className="text-[30px] font-black text-slate-950 tracking-tight">{stats.allocatedTasksCount}</h3>
          </div>
          <div className="p-3 bg-violet-600 rounded-xl text-white shadow-md shadow-violet-600/10">
            <Users size={20} className="stroke-[2.5]" />
          </div>
        </div>

        {/* Pending Extensions */}
        <div className="bg-gradient-to-br from-amber-50 to-white border border-amber-100 rounded-2xl shadow-md p-5 flex items-start justify-between transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg">
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-amber-955 uppercase tracking-widest block">Pending Extensions</span>
            <div className="flex items-baseline gap-2">
              <h3 className={`text-[30px] font-black tracking-tight ${stats.pendingDeadlineRequestsCount > 0 ? 'text-amber-700' : 'text-slate-950'}`}>
                {stats.pendingDeadlineRequestsCount}
              </h3>
              {stats.pendingDeadlineRequestsCount > 0 && (
                <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded-full border border-amber-300">
                  Action Required
                </span>
              )}
            </div>
          </div>
          <div className="p-3 bg-amber-600 rounded-xl text-white shadow-md shadow-amber-600/10">
            <Clock size={20} className="stroke-[2.5]" />
          </div>
        </div>

        {/* Tasks Completed */}
        <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-2xl shadow-md p-5 flex items-start justify-between transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg">
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-emerald-950 uppercase tracking-widest block">Approved Closed</span>
            <h3 className="text-[30px] font-black text-emerald-800 tracking-tight">{stats.completedTasksCount}</h3>
          </div>
          <div className="p-3 bg-emerald-600 rounded-xl text-white shadow-md shadow-emerald-600/10">
            <CheckCircle size={20} className="stroke-[2.5]" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active project head task allocation board */}
        <div className="lg:col-span-2 space-y-4">
          <div>
            <h3 className="text-[17px] font-extrabold text-slate-955 tracking-tight">Active Team Allocations</h3>
            <p className="text-[12px] text-slate-600 font-medium">Live operational review of team progress metrics</p>
          </div>

          <div className="bg-white border border-slate-300 rounded-2xl overflow-hidden shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#334155] text-white">
                    <th className="px-4 py-2.5 text-[12px] font-bold text-center border border-[#5f5f5f] w-16">S.No.</th>
                    <th className="px-4 py-2.5 text-[12px] font-bold text-left border border-[#5f5f5f]">Task Title</th>
                    <th className="px-4 py-2.5 text-[12px] font-bold text-left border border-[#5f5f5f]">Assignee</th>
                    <th className="px-4 py-2.5 text-[12px] font-bold text-left border border-[#5f5f5f]">Progress</th>
                    <th className="px-4 py-2.5 text-[12px] font-bold text-left border border-[#5f5f5f]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {currentTasks.map((task, index) => {
                    const assigneeInitials = task.assigned_user?.full_name ? task.assigned_user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U';
                    return (
                      <tr key={task.id} className="hover:bg-slate-50 transition-colors text-slate-955 font-medium">
                        <td className="px-4 py-3 text-[13px] font-bold text-slate-900 border border-slate-300 text-center">
                          {indexOfFirstItem + index + 1}
                        </td>
                        <td className="px-4 py-3 border border-slate-300">
                          <span className="block text-[14px] font-bold text-slate-950">{task.title}</span>
                          <span className="block text-[11px] text-slate-600 font-bold mt-0.5">{task.project?.name}</span>
                        </td>
                        <td className="px-4 py-3 border border-slate-300">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-300 text-[10px] font-bold flex items-center justify-center text-slate-700">
                              {assigneeInitials}
                            </div>
                            <span className="text-[13px] text-slate-900 font-bold">{task.assigned_user?.full_name || 'Unassigned'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 border border-slate-300">
                          <div className="flex items-center gap-2">
                            <div className="w-14 bg-slate-200 rounded-full h-1.5 overflow-hidden border border-slate-300">
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
                    );
                  })}
                  {tasks.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-slate-700 text-[13px] font-semibold border border-slate-300">No operational allocations found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-300 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-xs font-bold rounded-xl text-slate-900 bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
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
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
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
                              ? 'bg-orange-600 text-white border-orange-600'
                              : 'bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
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

        {/* Pending task reviews and progression reports */}
        <div className="space-y-4">
          <div>
            <h3 className="text-[17px] font-extrabold text-slate-955 tracking-tight">Pending Evaluations</h3>
            <p className="text-[12px] text-slate-600 font-medium">Sign-off reports submitted by team members</p>
          </div>

          <div className="space-y-3">
            {reports.filter(r => r.status === 'submitted').map((report) => {
              const userInitials = report.user?.full_name ? report.user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'D';
              return (
                <div key={report.id} className="bg-white border border-slate-300 rounded-2xl p-4.5 space-y-3 shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-orange-100 border border-orange-200 text-orange-700 font-extrabold text-[11px] flex items-center justify-center">
                        {userInitials}
                      </div>
                      <div>
                        <h5 className="text-[13.5px] font-bold text-slate-950 leading-tight">{report.task?.title || 'Progress Update'}</h5>
                        <span className="text-[11px] text-slate-600 font-semibold mt-0.5 block">By: {report.user?.full_name || 'Team Member'}</span>
                      </div>
                    </div>
                    <span className="bg-orange-50 border border-orange-200 text-orange-800 font-extrabold px-2 py-0.5 rounded-full text-[11px] whitespace-nowrap">
                      {report.progress || 0}% Progress
                    </span>
                  </div>
                  <p className="text-[12.5px] text-slate-800 font-medium italic whitespace-pre-wrap leading-relaxed">
                    " {report.content} "
                  </p>

                  <div className="pt-2.5 border-t border-slate-200 flex justify-end">
                    <button
                      onClick={() => handleApproveReport(report.id, report.task_id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-[12px] font-semibold transition-all shadow-md shadow-emerald-600/10 cursor-pointer"
                    >
                      Sign Off & Complete Task
                    </button>
                  </div>
                </div>
              );
            })}
            {reports.filter(r => r.status === 'submitted').length === 0 && (
              <div className="p-8 text-center bg-white border border-slate-300 rounded-2xl text-slate-700 text-[13px] font-semibold shadow-md">
                All clear! No pending task completions to review.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
