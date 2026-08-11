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
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Project head overview stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-[#18181b] p-6 rounded-xl border border-[#27272a]">
        <div className="space-y-1">
          <span className="text-[12px] font-bold text-zinc-500 uppercase tracking-widest">Managed Workspaces</span>
          <h3 className="text-[28px] font-extrabold text-zinc-100 tracking-tight">{stats.managedProjectsCount}</h3>
        </div>

        <div className="space-y-1 md:border-l md:border-[#27272a] md:pl-6">
          <span className="text-[12px] font-bold text-zinc-500 uppercase tracking-widest">Tasks Allocated</span>
          <h3 className="text-[28px] font-extrabold text-zinc-100 tracking-tight">{stats.allocatedTasksCount}</h3>
        </div>

        <div className="space-y-1 md:border-l md:border-[#27272a] md:pl-6">
          <span className="text-[12px] font-bold text-zinc-500 uppercase tracking-widest">Pending Extensions</span>
          <div className="flex items-baseline gap-2">
            <h3 className={`text-[28px] font-extrabold tracking-tight ${stats.pendingDeadlineRequestsCount > 0 ? 'text-amber-400' : 'text-zinc-100'}`}>
              {stats.pendingDeadlineRequestsCount}
            </h3>
            {stats.pendingDeadlineRequestsCount > 0 && <span className="text-[12px] text-amber-500 font-semibold">Action Required</span>}
          </div>
        </div>

        <div className="space-y-1 md:border-l md:border-[#27272a] md:pl-6">
          <span className="text-[12px] font-bold text-zinc-500 uppercase tracking-widest">Tasks Completed</span>
          <h3 className="text-[28px] font-extrabold text-emerald-400 tracking-tight">{stats.completedTasksCount}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active project head task allocation board */}
        <div className="lg:col-span-2 space-y-4">
          <div>
            <h3 className="text-[18px] font-bold text-zinc-100 tracking-tight">Active Work Allocations</h3>
            <p className="text-[13px] text-zinc-500">Live operational review of team progress metrics</p>
          </div>

          <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#27272a] bg-[#141416]/50">
                    <th className="p-4 text-[14px] font-bold text-zinc-400">Task Title</th>
                    <th className="p-4 text-[14px] font-bold text-zinc-400">Assignee</th>
                    <th className="p-4 text-[14px] font-bold text-zinc-400">Deadline</th>
                    <th className="p-4 text-[14px] font-bold text-zinc-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a]">
                  {tasks.map((task) => (
                    <tr key={task.id} className="hover:bg-[#202024]/50 transition-colors">
                      <td className="p-4">
                        <span className="block text-[15px] font-semibold text-zinc-200">{task.title}</span>
                        <span className="block text-[12px] text-zinc-500">{task.project?.name}</span>
                      </td>
                      <td className="p-4 text-[14px] text-zinc-300">
                        {task.assigned_user?.full_name || 'Unallocated'}
                      </td>
                      <td className="p-4 text-[14px] text-zinc-400">{task.end_date}</td>
                      <td className="p-4">
                        <span className={`inline-block text-[11px] font-bold uppercase px-2.5 py-1 rounded-full ${
                          task.status === 'completed' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : task.status === 'review'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-zinc-700/30 text-zinc-400'
                        }`}>
                          {task.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {tasks.length === 0 && (
                    <tr>
                      <td colSpan="4" className="p-8 text-center text-zinc-500 text-[14px]">No operational allocations found.</td>
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
            <h3 className="text-[18px] font-bold text-zinc-100 tracking-tight">Pending Report Evaluations</h3>
            <p className="text-[13px] text-zinc-500">Sign-off reports submitted by team members</p>
          </div>

          <div className="space-y-3">
            {reports.filter(r => r.status === 'submitted').map((report) => (
              <div key={report.id} className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="text-[14px] font-bold text-zinc-200">{report.task?.title}</h5>
                    <span className="text-[12px] text-zinc-500">Submitted by: {report.user?.full_name}</span>
                  </div>
                  <span className="text-[13px] font-semibold text-indigo-400">{report.hours_spent} Hrs</span>
                </div>
                <p className="text-[13px] text-zinc-400 italic">" {report.content} "</p>

                <div className="pt-2 border-t border-[#27272a] flex justify-end">
                  <button
                    onClick={() => handleApproveReport(report.id, report.task_id)}
                    className="px-3 py-1.5 bg-emerald-600/15 text-emerald-400 hover:bg-emerald-600/25 rounded-lg text-[12px] font-bold transition-all"
                  >
                    Sign Off & Complete Task
                  </button>
                </div>
              </div>
            ))}
            {reports.filter(r => r.status === 'submitted').length === 0 && (
              <div className="p-8 text-center bg-[#18181b] border border-[#27272a] rounded-xl text-zinc-500 text-[14px]">
                All clear! No pending task completions to review.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
