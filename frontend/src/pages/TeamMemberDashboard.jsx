import React, { useEffect, useState } from 'react';
import { 
  ClipboardList, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  CalendarCheck 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, PieChart, Pie, Tooltip, Cell, Legend } from 'recharts';
import API_URL from '../config';

export default function TeamMemberDashboard({ currentUserId }) {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({
    myTasksCount: 0,
    inProgressTasksCount: 0,
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
          inProgressTasksCount: myTasks.filter(t => t.status === 'in_progress' || t.status === 'todo').length,
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
    <div className="space-y-8 animate-fade-in text-slate-950 font-sans">
      {/* Team member KPI overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {/* My Assigned Tasks */}
        <div className="bg-gradient-to-br from-slate-100/70 to-slate-50/40 border border-slate-400 rounded-2xl shadow-md p-5 flex items-start justify-between transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg">
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-900 uppercase tracking-widest block">Total Assigned</span>
            <h3 className="text-[30px] font-bold text-slate-950 tracking-tight">{stats.myTasksCount}</h3>
          </div>
          <div className="p-3 bg-slate-700 rounded-xl text-white shadow-md shadow-slate-700/10">
            <ClipboardList size={20} className="stroke-[2.5]" />
          </div>
        </div>

        {/* To Do / In Progress */}
        <div className="bg-gradient-to-br from-orange-100/70 to-orange-50/40 border border-slate-400 rounded-2xl shadow-md p-5 flex items-start justify-between transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg">
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-orange-950 uppercase tracking-widest block">In Progress / Todo</span>
            <h3 className="text-[30px] font-bold text-slate-950 tracking-tight">{stats.inProgressTasksCount}</h3>
          </div>
          <div className="p-3 bg-orange-600 rounded-xl text-white shadow-md shadow-orange-600/10">
            <Clock size={20} className="stroke-[2.5]" />
          </div>
        </div>

        {/* Submitted (In Review) */}
        <div className="bg-gradient-to-br from-blue-100/70 to-blue-50/40 border border-slate-400 rounded-2xl shadow-md p-5 flex items-start justify-between transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg">
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-blue-900 uppercase tracking-widest block">Pending Review</span>
            <h3 className="text-[30px] font-bold text-blue-900 tracking-tight">{stats.reviewTasksCount}</h3>
          </div>
          <div className="p-3 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-600/10">
            <Calendar size={20} className="stroke-[2.5]" />
          </div>
        </div>

        {/* Tasks Approved */}
        <div className="bg-gradient-to-br from-emerald-100/70 to-emerald-50/40 border border-slate-400 rounded-2xl shadow-md p-5 flex items-start justify-between transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg">
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-emerald-950 uppercase tracking-widest block">Tasks Completed</span>
            <h3 className="text-[30px] font-bold text-emerald-800 tracking-tight">{stats.completedTasksCount}</h3>
          </div>
          <div className="p-3 bg-emerald-600 rounded-xl text-white shadow-md shadow-emerald-600/10">
            <CheckCircle2 size={20} className="stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* Task progression list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h3 className="text-[17px] font-bold text-slate-950 tracking-tight">My Deliverables</h3>
              <p className="text-[12px] text-slate-900 font-medium">Review specifications and report progressions of assigned workflows</p>
            </div>
            <button
              onClick={() => navigate('/member/leaves')}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-400 hover:bg-slate-100 text-slate-950 rounded-xl text-[12.5px] font-semibold transition-all shadow-sm cursor-pointer"
            >
              <CalendarCheck size={15} className="text-orange-600 stroke-[2.5]" />
              <span>Leaves & Permissions</span>
            </button>
          </div>

        <div className="bg-white rounded-[20px] overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#3715ca] text-white">
                  <th className="px-4 py-2.5 text-[12px] font-semibold text-center border border-slate-300 w-16">S.No.</th>
                  <th className="px-4 py-2.5 text-[12px] font-semibold text-left border border-slate-300">Deliverable / Project</th>
                  <th className="px-4 py-2.5 text-[12px] font-semibold text-left border border-slate-300">Duration limits</th>
                  <th className="px-4 py-2.5 text-[12px] font-semibold text-left border border-slate-300">Progress</th>
                  <th className="px-4 py-2.5 text-[12px] font-semibold text-left border border-slate-300">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {currentTasks.map((task, index) => (
                  <tr key={task.id} className="hover:bg-slate-50 transition-colors text-slate-950 font-medium">
                    <td className="px-4 py-3 text-[13px] font-normal text-slate-900 border border-slate-300 text-center">
                      {indexOfFirstItem + index + 1}
                    </td>
                    <td className="px-4 py-3 border border-slate-300">
                      <span className="block text-[14px] font-medium text-slate-950">{task.title}</span>
                      <span className="block text-[11px] text-slate-900 font-medium mt-0.5">{task.project?.name}</span>
                    </td>
                    <td className="px-4 py-3 border border-slate-300 text-[13px] text-slate-900 font-normal whitespace-nowrap">
                      <div>{formatDate(task.start_date)} <span className="text-slate-900 font-medium text-[10px] uppercase">to</span> {formatDate(task.end_date)}</div>
                    </td>
                    <td className="px-4 py-3 border border-slate-300">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden border border-slate-300">
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
                ))}
                {tasks.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-slate-900 text-[13px] font-normal border border-slate-300">No deliverables currently assigned. Enjoy the light day!</td>
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
                  <p className="text-[12px] text-slate-900 font-normal">
                    Showing <span className="font-bold">{indexOfFirstItem + 1}</span> to <span className="font-bold">{Math.min(indexOfLastItem, tasks.length)}</span> of <span className="font-bold">{tasks.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-full shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
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
                            ? 'z-10 bg-orange-600 text-white'
                            : 'bg-white text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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
         
         {/* Right Column: Workload Distribution Chart */}
        <div className="space-y-4">
          <div>
            <h3 className="text-[17px] font-bold text-slate-950 tracking-tight">Workload Distribution</h3>
            <p className="text-[12px] text-slate-900 font-medium">Status breakdown of your assigned tasks</p>
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
                No allocations assigned to analyze workload.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
