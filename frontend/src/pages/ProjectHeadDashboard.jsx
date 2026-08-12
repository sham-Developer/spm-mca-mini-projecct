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

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Project head overview stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 bg-white p-6 rounded-xl border border-slate-400 shadow-md">
        <div className="space-y-1">
          <span className="text-[12px] font-bold text-slate-800 uppercase tracking-widest">Managed Workspaces</span>
          <h3 className="text-[28px] font-bold text-slate-900 tracking-tight">{stats.managedProjectsCount}</h3>
        </div>

        <div className="space-y-1 sm:border-l sm:border-slate-400 sm:pl-6">
          <span className="text-[12px] font-bold text-slate-800 uppercase tracking-widest">Tasks Allocated</span>
          <h3 className="text-[28px] font-bold text-slate-900 tracking-tight">{stats.allocatedTasksCount}</h3>
        </div>

        <div className="space-y-1 md:border-l md:border-slate-400 md:pl-6">
          <span className="text-[12px] font-bold text-slate-800 uppercase tracking-widest">Pending Extensions</span>
          <div className="flex items-baseline gap-2">
            <h3 className={`text-[28px] font-bold tracking-tight ${stats.pendingDeadlineRequestsCount > 0 ? 'text-amber-700' : 'text-slate-950'}`}>
              {stats.pendingDeadlineRequestsCount}
            </h3>
            {stats.pendingDeadlineRequestsCount > 0 && <span className="text-[12px] text-amber-700 font-semibold">Action Required</span>}
          </div>
        </div>

        <div className="space-y-1 md:border-l md:border-slate-400 md:pl-6">
          <span className="text-[12px] font-bold text-slate-800 tracking-tight uppercase tracking-widest">Tasks Completed</span>
          <h3 className="text-[28px] font-bold text-emerald-700 tracking-tight">{stats.completedTasksCount}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active project head task allocation board */}
        <div className="lg:col-span-2 space-y-4">
          <div>
            <h3 className="text-[18px] font-bold text-slate-950 tracking-tight">Active Work Allocations</h3>
            <p className="text-[13px] text-slate-700 font-medium">Live operational review of team progress metrics</p>
          </div>

          <div className="bg-white border border-slate-400 rounded-xl overflow-hidden shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-400 bg-slate-100">
                    <th className="p-4 text-[13px] font-bold text-slate-950 uppercase tracking-wider">Task Title</th>
                    <th className="p-4 text-[13px] font-bold text-slate-900 uppercase tracking-wider">Assignee</th>
                    <th className="p-4 text-[13px] font-bold text-slate-900 uppercase tracking-wider">Deadline</th>
                    <th className="p-4 text-[13px] font-bold text-slate-900 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {tasks.map((task) => (
                    <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <span className="block text-[15px] font-bold text-slate-950">{task.title}</span>
                        <span className="block text-[12px] text-slate-705 font-semibold">{task.project?.name}</span>
                      </td>
                      <td className="p-4 text-[14px] text-slate-900 font-medium">
                        {task.assigned_user?.full_name || 'Unallocated'}
                      </td>
                      <td className="p-4 text-[14px] text-slate-900 font-medium">{task.end_date}</td>
                      <td className="p-4">
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
                    </tr>
                  ))}
                  {tasks.length === 0 && (
                    <tr>
                      <td colSpan="4" className="p-8 text-center text-slate-700 text-[14px] font-medium">No operational allocations found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pending task reviews and progression reports */}
        <div className="space-y-4">
          <div>
            <h3 className="text-[18px] font-bold text-slate-955 tracking-tight">Pending Report Evaluations</h3>
            <p className="text-[13px] text-slate-700 font-medium">Sign-off reports submitted by team members</p>
          </div>

          <div className="space-y-3">
            {reports.filter(r => r.status === 'submitted').map((report) => (
              <div key={report.id} className="bg-white border border-slate-400 rounded-xl p-4 space-y-3 shadow-md">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="text-[14px] font-bold text-slate-950">{report.task?.title}</h5>
                    <span className="text-[12px] text-slate-700 font-semibold">Submitted by: {report.user?.full_name}</span>
                  </div>
                  <span className="text-[13px] font-bold text-slate-950">{report.hours_spent} Hrs</span>
                </div>
                <p className="text-[13px] text-slate-900 font-medium italic">" {report.content} "</p>

                <div className="pt-2 border-t border-slate-200 flex justify-end">
                  <button
                    onClick={() => handleApproveReport(report.id, report.task_id)}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-lg text-[12px] font-bold border border-emerald-400 transition-all shadow-sm cursor-pointer"
                  >
                    Sign Off & Complete Task
                  </button>
                </div>
              </div>
            ))}
            {reports.filter(r => r.status === 'submitted').length === 0 && (
              <div className="p-8 text-center bg-white border border-slate-400 rounded-xl text-slate-700 text-[14px] font-semibold shadow-md">
                All clear! No pending task completions to review.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
