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
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-500"></div>
      </div>
    );
  }

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
                  <th className="p-4 text-[13px] font-bold text-slate-955 uppercase tracking-wider">Deliverable / Project</th>
                  <th className="p-4 text-[13px] font-bold text-slate-955 uppercase tracking-wider">Duration Limits</th>
                  <th className="p-4 text-[13px] font-bold text-slate-955 uppercase tracking-wider">Status</th>
                  <th className="p-4 text-[13px] font-bold text-slate-955 uppercase tracking-wider">Instructions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <span className="block text-[15px] font-bold text-slate-955">{task.title}</span>
                      <span className="block text-[12px] text-slate-700 font-medium">{task.project?.name}</span>
                    </td>
                    <td className="p-4 text-[14px] text-slate-900 font-medium">
                      <div>{task.start_date} <span className="text-slate-600 text-[12px] font-bold">to</span> {task.end_date}</div>
                    </td>
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
                    <td className="p-4 text-[13px] text-slate-800 font-medium max-w-sm truncate">
                      {task.description || 'No special requirements.'}
                    </td>
                  </tr>
                ))}
                {tasks.length === 0 && (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-slate-700 text-[14px] font-medium">No deliverables currently assigned. Enjoy the light day!</td>
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
