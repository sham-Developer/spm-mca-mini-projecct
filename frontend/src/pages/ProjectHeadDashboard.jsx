import React, { useEffect, useState } from 'react';
import { 
  FolderKanban, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Users,
  History
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Tooltip, Cell, Legend } from 'recharts';
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
  const [selectedHistoryTask, setSelectedHistoryTask] = useState(null);

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

  const handleAcknowledgeReport = async (reportId) => {
    try {
      // 1. Approve report (mark status as approved, keeping task status as-is)
      await fetch(`${API_URL}/reports/${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' })
      });
      // Trigger data reload smoothly
      fetchHeadDashboardData();
    } catch (e) {
      console.error(e);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
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

  const todoCount = tasks.filter(t => t.status === 'todo').length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
  const reviewCount = tasks.filter(t => t.status === 'review').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;

  const taskStatusData = [
    { name: 'To Do', value: todoCount, color: '#94a3b8' },
    { name: 'In Progress', value: inProgressCount, color: '#2563eb' },
    { name: 'In Review', value: reviewCount, color: '#9333ea' },
    { name: 'Completed', value: completedCount, color: '#059669' }
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-8 animate-fade-in text-slate-950">
      {/* Page Header */}
      <div>
        <h2 className="text-[22px] font-bold text-slate-950 tracking-tight">Project Management Board</h2>
        <p className="text-[13px] text-slate-900 font-normal">Track task completion workflows, approve progress entries, and review project extensions</p>
      </div>

      {/* Project head overview stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {/* Managed Workspaces */}
        <div className="bg-gradient-to-br from-indigo-100/70 to-indigo-50/40 border border-slate-400 rounded-2xl shadow-md p-5 flex items-start justify-between transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg">
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-widest block">Workspaces Managed</span>
            <h3 className="text-[30px] font-bold text-slate-950 tracking-tight">{stats.managedProjectsCount}</h3>
          </div>
          <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-600/10">
            <FolderKanban size={20} className="stroke-[2.5]" />
          </div>
        </div>

        {/* Tasks Allocated */}
        <div className="bg-gradient-to-br from-violet-100/70 to-violet-50/40 border border-slate-400 rounded-2xl shadow-md p-5 flex items-start justify-between transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg">
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-violet-900 uppercase tracking-widest block">Allocations</span>
            <h3 className="text-[30px] font-bold text-slate-950 tracking-tight">{stats.allocatedTasksCount}</h3>
          </div>
          <div className="p-3 bg-violet-600 rounded-xl text-white shadow-md shadow-violet-600/10">
            <Users size={20} className="stroke-[2.5]" />
          </div>
        </div>

        {/* Pending Extensions */}
        <div className="bg-gradient-to-br from-amber-100/70 to-amber-50/40 border border-slate-400 rounded-2xl shadow-md p-5 flex items-start justify-between transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg">
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-amber-950 uppercase tracking-widest block">Pending Extensions</span>
            <div className="flex items-baseline gap-2">
              <h3 className={`text-[30px] font-bold tracking-tight ${stats.pendingDeadlineRequestsCount > 0 ? 'text-amber-700' : 'text-slate-950'}`}>
                {stats.pendingDeadlineRequestsCount}
              </h3>
              {stats.pendingDeadlineRequestsCount > 0 && (
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded-full border border-amber-300">
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
        <div className="bg-gradient-to-br from-emerald-100/70 to-emerald-50/40 border border-slate-400 rounded-2xl shadow-md p-5 flex items-start justify-between transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg">
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-emerald-950 uppercase tracking-widest block">Approved Closed</span>
            <h3 className="text-[30px] font-bold text-emerald-800 tracking-tight">{stats.completedTasksCount}</h3>
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
            <h3 className="text-[17px] font-bold text-slate-950 tracking-tight">Active Team Allocations</h3>
            <p className="text-[12px] text-slate-900 font-medium">Live operational review of team progress metrics</p>
          </div>

          <div className="bg-white rounded-[20px] overflow-hidden shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#3715ca] text-white">
                    <th className="px-4 py-2.5 text-[12px] font-semibold text-center border border-slate-300 w-16">S.No.</th>
                    <th className="px-4 py-2.5 text-[12px] font-semibold text-left border border-slate-300">Task Title</th>
                    <th className="px-4 py-2.5 text-[12px] font-semibold text-left border border-slate-300">Assignee</th>
                    <th className="px-4 py-2.5 text-[12px] font-semibold text-left border border-slate-300">Progress</th>
                    <th className="px-4 py-2.5 text-[12px] font-semibold text-left border border-slate-300">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {currentTasks.map((task, index) => {
                    const assigneeInitials = task.assigned_user?.full_name ? task.assigned_user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U';
                    return (
                      <tr key={task.id} className="hover:bg-slate-50 transition-colors text-slate-950 font-medium">
                        <td className="px-4 py-3 text-[13px] font-normal text-slate-900 border border-slate-300 text-center">
                          {indexOfFirstItem + index + 1}
                        </td>
                        <td className="px-4 py-3 border border-slate-300">
                          <span className="block text-[14px] font-medium text-slate-950">{task.title}</span>
                          <span className="block text-[11px] text-slate-900 font-medium mt-0.5">{task.project?.name}</span>
                        </td>
                        <td className="px-4 py-3 border border-slate-300">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-300 text-[10px] font-medium flex items-center justify-center text-slate-900">
                              {assigneeInitials}
                            </div>
                            <span className="text-[13px] text-slate-900 font-medium">{task.assigned_user?.full_name || 'Unassigned'}</span>
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
                            <span className="text-[11px] font-medium text-slate-900">{task.progress || 0}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 border border-slate-300">
                          <span className={`inline-block text-[10px] font-medium uppercase px-2 py-0.5 rounded ${
                            task.status === 'completed' 
                              ? 'bg-emerald-100 text-emerald-950 border border-emerald-400' 
                              : task.status === 'review'
                              ? 'bg-purple-100 text-purple-950 border border-purple-400'
                              : task.status === 'in_progress'
                              ? 'bg-blue-100 text-blue-950 border border-blue-400'
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
                      <td colSpan="5" className="px-4 py-8 text-center text-slate-900 text-[13px] font-normal border border-slate-300">No operational allocations found.</td>
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
                    <p className="text-[12px] text-slate-900 font-normal">
                      Showing <span className="font-bold">{indexOfFirstItem + 1}</span> to <span className="font-bold">{Math.min(indexOfLastItem, tasks.length)}</span> of <span className="font-bold">{tasks.length}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-full shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-3 py-1.5 rounded-l-full border border-slate-300 bg-white text-xs font-bold text-slate-900 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Previous
                      </button>
                      {[...Array(totalPages)].map((_, i) => (
                        <button
                          key={i + 1}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`relative inline-flex items-center px-3.5 py-1.5 border-t border-b border-slate-300 text-xs font-bold transition-colors cursor-pointer ${
                            currentPage === i + 1
                              ? 'bg-orange-600 text-white border-orange-600'
                              : 'bg-white text-slate-900 hover:bg-slate-50'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-3 py-1.5 rounded-r-full border border-slate-300 bg-white text-xs font-bold text-slate-900 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
        <div className="space-y-6">
          {/* TASK DISTRIBUTION CHART */}
          <div className="space-y-4">
            <div>
              <h3 className="text-[17px] font-bold text-slate-950 tracking-tight">Task Workload Distribution</h3>
              <p className="text-[12px] text-slate-900 font-medium">Workload division across assigned team tasks</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-400 shadow-md h-[260px] flex flex-col items-center justify-center">
              {tasks.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={taskStatusData}
                      cx="50%"
                      cy="40%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {taskStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', borderWidth: '1px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                      itemStyle={{ fontWeight: '700', fontSize: '11px' }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={40} 
                      iconType="circle" 
                      iconSize={6}
                      formatter={(value) => {
                        const payload = taskStatusData.find(d => d.name === value);
                        return <span className="text-[10.5px] font-bold text-slate-900 mr-1.5">{value} ({payload?.value || 0})</span>;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-900 italic text-[12px] font-semibold">
                  No allocations registered to display analytics.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-[17px] font-bold text-slate-950 tracking-tight">Pending Evaluations</h3>
              <p className="text-[12px] text-slate-900 font-medium">Sign-off reports submitted by team members</p>
            </div>

          <div className="space-y-3">
            {reports.filter(r => r.status === 'submitted').map((report) => {
              const userInitials = report.user?.full_name ? report.user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'D';
              return (
                <div key={report.id} className="bg-white border border-slate-400 rounded-2xl p-4.5 space-y-3 shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-orange-100 border border-orange-200 text-orange-700 font-bold text-[11px] flex items-center justify-center">
                        {userInitials}
                      </div>
                      <div>
                        <h5 className="text-[13.5px] font-bold text-slate-950 leading-tight">{report.task?.title || 'Progress Update'}</h5>
                        <span className="text-[11px] text-slate-900 font-semibold mt-0.5 block">
                          By: {report.user?.full_name || 'Team Member'} • Submitted: {formatDate(report.created_at)}
                        </span>
                      </div>
                    </div>
                    <span className="bg-orange-50 border border-orange-200 text-orange-800 font-bold px-2 py-0.5 rounded-full text-[11px] whitespace-nowrap">
                      {report.progress || 0}% Progress
                    </span>
                  </div>
                  <p className="text-[12.5px] text-slate-900 font-medium italic whitespace-pre-wrap leading-relaxed">
                    " {report.content} "
                  </p>

                  <div className="pt-2.5 border-t border-slate-200 flex justify-between items-center">
                    <button
                      onClick={() => setSelectedHistoryTask({ id: report.task_id, title: report.task?.title || 'Progress Update' })}
                      className="flex items-center gap-1.5 text-[12px] font-bold text-slate-900 hover:text-slate-950 hover:underline cursor-pointer"
                    >
                      <History size={15} className="stroke-[2.5]" />
                      View History
                    </button>

                    {report.progress === 100 ? (
                      <button
                        onClick={() => handleApproveReport(report.id, report.task_id)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-[12px] font-bold transition-all shadow-md shadow-emerald-600/10 cursor-pointer"
                      >
                        Sign Off & Complete Task
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAcknowledgeReport(report.id)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-[12px] font-bold transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                      >
                        Acknowledge Update
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {reports.filter(r => r.status === 'submitted').length === 0 && (
              <div className="p-8 text-center bg-white border border-slate-400 rounded-2xl text-slate-900 text-[13px] font-semibold shadow-md">
                All clear! No pending task completions to review.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

      {/* Task History Modal */}
      {selectedHistoryTask && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white border border-slate-400 rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-400 flex items-center justify-between bg-slate-100 rounded-t-xl">
              <div>
                <h3 className="text-[17px] font-bold text-slate-950">Task Update History</h3>
                <p className="text-[12px] text-slate-900 font-normal mt-0.5">
                  Showing historical updates for: <span className="text-slate-950 font-bold">{selectedHistoryTask.title}</span>
                </p>
              </div>
              <button 
                onClick={() => setSelectedHistoryTask(null)}
                className="text-slate-900 hover:text-slate-950 font-bold text-lg p-1.5 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {reports
                .filter(r => r.task_id === selectedHistoryTask.id)
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .map((historyReport) => (
                  <div 
                    key={historyReport.id} 
                    className="p-4 bg-slate-50 border border-slate-300 rounded-xl space-y-2 shadow-sm"
                  >
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-200 border border-slate-400 text-slate-900 font-bold px-2 py-0.5 rounded text-[11px]">
                          {historyReport.progress}% Progress
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                          historyReport.status === 'approved' 
                            ? 'bg-emerald-100 border-emerald-400 text-emerald-950'
                            : 'bg-amber-100 border-amber-400 text-amber-950'
                        }`}>
                          {historyReport.status === 'approved' ? 'Approved / Acknowledged' : 'Submitted (Pending Review)'}
                        </span>
                      </div>
                      <span className="text-[11.5px] text-slate-900 font-bold">
                        Submitted: {formatDate(historyReport.created_at)}
                      </span>
                    </div>
                    <p className="text-[13px] text-slate-950 font-medium italic whitespace-pre-wrap leading-relaxed">
                      " {historyReport.content} "
                    </p>
                    {historyReport.user?.full_name && (
                      <div className="text-[11px] text-slate-900 font-semibold">
                        By: <span className="font-bold text-slate-900">{historyReport.user.full_name}</span>
                      </div>
                    )}
                  </div>
                ))}
              {reports.filter(r => r.task_id === selectedHistoryTask.id).length === 0 && (
                <p className="text-center text-slate-900 font-normal py-8 text-[13px]">
                  No history logged for this task yet.
                </p>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-300 flex justify-end bg-slate-50 rounded-b-xl">
              <button
                onClick={() => setSelectedHistoryTask(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[12.5px] font-bold transition-all shadow-md cursor-pointer"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
