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
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Team member KPI overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-[#18181b] p-6 rounded-xl border border-[#27272a]">
        <div className="space-y-1">
          <span className="text-[12px] font-bold text-zinc-500 uppercase tracking-widest">My Assigned Tasks</span>
          <h3 className="text-[28px] font-extrabold text-zinc-100 tracking-tight">{stats.myTasksCount}</h3>
        </div>

        <div className="space-y-1 md:border-l md:border-[#27272a] md:pl-6">
          <span className="text-[12px] font-bold text-zinc-500 uppercase tracking-widest">To Do / In Progress</span>
          <h3 className="text-[28px] font-extrabold text-zinc-100 tracking-tight">{stats.todoTasksCount}</h3>
        </div>

        <div className="space-y-1 md:border-l md:border-[#27272a] md:pl-6">
          <span className="text-[12px] font-bold text-zinc-500 uppercase tracking-widest">Submitted (In Review)</span>
          <h3 className="text-[28px] font-extrabold text-amber-400 tracking-tight">{stats.reviewTasksCount}</h3>
        </div>

        <div className="space-y-1 md:border-l md:border-[#27272a] md:pl-6">
          <span className="text-[12px] font-bold text-zinc-500 uppercase tracking-widest">Tasks Approved</span>
          <h3 className="text-[28px] font-extrabold text-emerald-400 tracking-tight">{stats.completedTasksCount}</h3>
        </div>
      </div>

      {/* Task progression list */}
      <div className="space-y-4">
        <div>
          <h3 className="text-[18px] font-bold text-zinc-100 tracking-tight">My Work Deliverables</h3>
          <p className="text-[13px] text-zinc-500">Review specifications and report progressions of assigned workflows</p>
        </div>

        <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#27272a] bg-[#141416]/50">
                  <th className="p-4 text-[14px] font-bold text-zinc-400">Deliverable / Project</th>
                  <th className="p-4 text-[14px] font-bold text-zinc-400">Duration Limits</th>
                  <th className="p-4 text-[14px] font-bold text-zinc-400">Status</th>
                  <th className="p-4 text-[14px] font-bold text-zinc-400">Instructions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-[#202024]/50 transition-colors">
                    <td className="p-4">
                      <span className="block text-[15px] font-semibold text-zinc-200">{task.title}</span>
                      <span className="block text-[12px] text-indigo-400 font-medium">{task.project?.name}</span>
                    </td>
                    <td className="p-4 text-[14px] text-zinc-300">
                      <div>{task.start_date} <span className="text-zinc-500 text-[12px]">to</span> {task.end_date}</div>
                    </td>
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
                    <td className="p-4 text-[13px] text-zinc-400 max-w-sm truncate">
                      {task.description || 'No special requirements.'}
                    </td>
                  </tr>
                ))}
                {tasks.length === 0 && (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-zinc-500 text-[14px]">No deliverables currently assigned. Enjoy the light day!</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
