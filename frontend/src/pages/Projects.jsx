import React, { useEffect, useState } from 'react';
import { 
  FolderKanban, 
  Plus, 
  Calendar, 
  User, 
  IndianRupee, 
  CheckCircle, 
  TrendingUp, 
  ClipboardList 
} from 'lucide-react';
import API_URL from '../config';

export default function Projects({ userRole, currentUserId }) {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [projectHeads, setProjectHeads] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal control states
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isReviewRequestsModalOpen, setIsReviewRequestsModalOpen] = useState(false);

  // Focus targets
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  // Form states - Project
  const [projectName, setProjectName] = useState('');
  const [client_id, setClientId] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');
  const [projectHeadId, setProjectHeadId] = useState('');

  // Form states - Task
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [taskStart, setTaskStart] = useState('');
  const [taskEnd, setTaskEnd] = useState('');

  // Form states - Deadline Extension Request
  const [requestedEndDate, setRequestedEndDate] = useState('');
  const [extensionReason, setExtensionReason] = useState('');
  const [deadlineRequests, setDeadlineRequests] = useState([]);

  // Form states - Task Progress Report
  const [reportContent, setReportContent] = useState('');
  const [hoursSpent, setHoursSpent] = useState('');

  // Indian Rupee formatting
  const formatRupee = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const loadAllData = async () => {
    try {
      const [projRes, clientRes, userRes, taskRes, reqRes] = await Promise.all([
        fetch(`${API_URL}/projects`),
        fetch(`${API_URL}/clients`),
        fetch(`${API_URL}/users`),
        fetch(`${API_URL}/tasks`),
        fetch(`${API_URL}/deadline-requests`)
      ]);

      const projData = await projRes.json();
      const clientData = await clientRes.json();
      const userData = await userRes.json();
      const taskData = await taskRes.json();
      const reqData = await reqRes.json();

      setProjects(projData);
      setClients(clientData.filter(c => c.status === 'onboarded'));
      setProjectHeads(userData.filter(u => u.role === 'project_head'));
      setTeamMembers(userData.filter(u => u.role === 'team_member'));
      setTasks(taskData);
      setDeadlineRequests(reqData);
    } catch (e) {
      console.error('Error fetching project information:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName,
          client_id,
          description,
          start_date: startDate,
          end_date: endDate,
          budget: Number(budget),
          project_head_id: projectHeadId || currentUserId
        })
      });
      if (response.ok) {
        setIsProjectModalOpen(false);
        setProjectName('');
        setClientId('');
        setDescription('');
        setStartDate('');
        setEndDate('');
        setBudget('');
        setProjectHeadId('');
        loadAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: selectedProject.id,
          title: taskTitle,
          description: taskDescription,
          assigned_to: assignedTo,
          start_date: taskStart,
          end_date: taskEnd,
          status: 'todo'
        })
      });
      if (response.ok) {
        setIsTaskModalOpen(false);
        setTaskTitle('');
        setTaskDescription('');
        setAssignedTo('');
        setTaskStart('');
        setTaskEnd('');
        loadAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRequestDeadline = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/deadline-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: selectedTask.id,
          requested_by: currentUserId,
          current_end_date: selectedTask.end_date,
          requested_end_date: requestedEndDate,
          reason: extensionReason,
          status: 'pending'
        })
      });
      if (response.ok) {
        setIsRequestModalOpen(false);
        setRequestedEndDate('');
        setExtensionReason('');
        loadAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleApproveDeadline = async (reqId, taskId, approvedDate) => {
    try {
      // 1. Approve the request
      await fetch(`${API_URL}/deadline-requests/${reqId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' })
      });
      // 2. Modify task deadline
      await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ end_date: approvedDate })
      });
      loadAllData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRejectDeadline = async (reqId) => {
    try {
      await fetch(`${API_URL}/deadline-requests/${reqId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' })
      });
      loadAllData();
    } catch (e) {
      console.error(e);
    }
  };

  const handlePostReport = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: selectedTask.id,
          submitted_by: currentUserId,
          content: reportContent,
          hours_spent: Number(hoursSpent),
          status: 'submitted'
        })
      });
      if (response.ok) {
        // Update task status to Review
        await fetch(`${API_URL}/tasks/${selectedTask.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'review' })
        });

        setIsReportModalOpen(false);
        setReportContent('');
        setHoursSpent('');
        loadAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filter projects depending on roles
  const displayedProjects = projects.filter(p => {
    if (userRole === 'admin') return true;
    if (userRole === 'project_head') return p.project_head_id === currentUserId;
    // For team member, check if they have a task in the project
    if (userRole === 'team_member') {
      const projectTaskAssigned = tasks.some(t => t.project_id === p.id && t.assigned_to === currentUserId);
      return projectTaskAssigned;
    }
    return false;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-[20px] font-bold text-slate-950 tracking-tight">Project Workspaces</h2>
          <p className="text-[13px] text-slate-700 font-medium">Track deadlines, allocate workforce, and review progression metrics</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {userRole === 'project_head' && (
            <button
              onClick={() => setIsReviewRequestsModalOpen(true)}
              className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-400 px-4 py-2.5 rounded-xl text-[14px] font-bold transition-all shadow-sm cursor-pointer"
            >
              <span>Review Extension Requests</span>
              {deadlineRequests.filter(r => r.status === 'pending').length > 0 && (
                <span className="w-5 h-5 bg-orange-600 rounded-full flex items-center justify-center text-[11px] font-bold text-white">
                  {deadlineRequests.filter(r => r.status === 'pending').length}
                </span>
              )}
            </button>
          )}

          {(userRole === 'admin' || userRole === 'project_head') && (
            <button
              onClick={() => setIsProjectModalOpen(true)}
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-4 py-2.5 rounded-xl text-[14px] font-semibold transition-all shadow-md shadow-orange-600/15 cursor-pointer"
            >
              <Plus size={16} className="stroke-[2]" />
              <span>Onboard Project</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-500"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Projects grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayedProjects.map((project) => {
              const projectTasks = tasks.filter(t => t.project_id === project.id);
              const completedTasksCount = projectTasks.filter(t => t.status === 'completed').length;
              const completionRate = projectTasks.length > 0 ? Math.round((completedTasksCount / projectTasks.length) * 100) : 0;

              return (
                <div key={project.id} className="bg-white border border-slate-400 rounded-xl p-5 flex flex-col justify-between shadow-md">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[11px] uppercase tracking-wider text-slate-800 font-bold bg-slate-100 px-2.5 py-0.5 rounded border border-slate-400">
                          {project.status}
                        </span>
                        <h3 className="text-[17px] font-bold text-slate-950 mt-2">{project.name}</h3>
                      </div>
                      <span className="text-[15px] font-bold text-emerald-700">{formatRupee(project.budget)}</span>
                    </div>

                    <p className="text-[13px] text-slate-800 leading-relaxed font-semibold">{project.description || 'No description provided.'}</p>

                    <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-[12px] text-slate-700 font-semibold">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-slate-800 stroke-[2]" />
                        <span>Ends: {project.end_date}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User size={13} className="text-slate-800 stroke-[2]" />
                        <span>Head: {project.project_head?.full_name || 'Admin'}</span>
                      </div>
                    </div>

                    {/* Progress tracking */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-[12px]">
                        <span className="text-slate-800 font-semibold">Task Completion Rate</span>
                        <span className="text-slate-900 font-bold">{completionRate}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden border border-slate-350">
                        <div 
                          className="bg-orange-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${completionRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-300 mt-5 pt-4 flex justify-between items-center">
                    <span className="text-[12px] text-slate-750 font-bold">{projectTasks.length} Allocated Tasks</span>
                    <div className="flex gap-2">
                      {(userRole === 'admin' || userRole === 'project_head') && (
                        <button
                          onClick={() => {
                            setSelectedProject(project);
                            setIsTaskModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-850 border border-slate-400 rounded-lg text-[13px] font-bold transition-colors shadow-sm cursor-pointer"
                        >
                          Allocate Task
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedProject(selectedProject?.id === project.id ? null : project)}
                        className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-850 border border-slate-400 rounded-lg text-[13px] font-bold transition-colors shadow-sm cursor-pointer"
                      >
                        {selectedProject?.id === project.id ? 'Hide Space' : 'Open Space'}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Task list for Selected Project */}
                  {selectedProject?.id === project.id && (
                    <div className="mt-6 border-t border-slate-305 pt-4 space-y-3">
                      <h4 className="text-[13px] font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                        <ClipboardList size={14} className="text-slate-800 stroke-[2]" /> Project Task Board
                      </h4>

                      <div className="space-y-2">
                        {projectTasks.map((task) => (
                          <div key={task.id} className="bg-slate-50 border border-slate-400 rounded-lg p-3 flex flex-col justify-between gap-3 shadow-sm">
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="text-[14px] font-bold text-slate-950">{task.title}</h5>
                                <p className="text-[12px] text-slate-705 font-medium mt-0.5">{task.description}</p>
                              </div>
                              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                task.status === 'completed' 
                                  ? 'bg-emerald-100 text-emerald-950 border border-emerald-400'
                                  : task.status === 'review'
                                  ? 'bg-blue-100 text-blue-955 border border-blue-400'
                                  : 'bg-slate-200 text-slate-950 border border-slate-400'
                              }`}>
                                {task.status}
                              </span>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-[12px] text-slate-900 font-semibold border-t border-slate-200 pt-2.5">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-slate-700 font-bold">Assignee:</span>
                                <span className="font-bold text-slate-950">{task.assigned_user?.full_name || 'Unassigned'}</span>
                              </div>
                              <div className="flex justify-between sm:justify-end items-center gap-3">
                                <span className="text-slate-705 font-bold">Deadline: {task.end_date}</span>
                                {userRole === 'team_member' && task.assigned_to === currentUserId && task.status !== 'completed' && (
                                  <div className="flex gap-1.5">
                                    <button
                                      onClick={() => {
                                        setSelectedTask(task);
                                        setIsRequestModalOpen(true);
                                      }}
                                      className="px-2 py-1 bg-white hover:bg-slate-50 text-slate-850 border border-slate-400 rounded text-[11px] font-bold shadow-sm cursor-pointer"
                                    >
                                      Extend Date
                                    </button>
                                    <button
                                      onClick={() => {
                                        setSelectedTask(task);
                                        setIsReportModalOpen(true);
                                      }}
                                      className="px-2 py-1 bg-orange-600 hover:bg-orange-500 text-white rounded text-[11px] font-semibold cursor-pointer"
                                    >
                                      Submit Report
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        {projectTasks.length === 0 && (
                          <div className="text-center p-6 text-slate-700 font-medium text-[13px]">No tasks allocated inside this workspace.</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {displayedProjects.length === 0 && (
              <div className="md:col-span-2 text-center p-12 bg-white border border-slate-400 rounded-xl text-slate-800 font-semibold text-[14px] shadow-md">
                No workspace boards found.
              </div>
            )}
          </div>
        </div>
      )}

      {/* NEW PROJECT ONBOARD MODAL */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-400 rounded-2xl p-6 space-y-6 shadow-xl">
            <div>
              <h3 className="text-[18px] font-bold text-slate-950">Onboard New Project</h3>
              <p className="text-[13px] text-slate-700 font-medium">Setup project specifications, budget, and leads</p>
            </div>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-[13px] font-bold text-slate-805 mb-1.5">Project Name</label>
                <input
                  type="text"
                  required
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full bg-white border border-slate-400 rounded-xl px-3.5 py-2.5 text-slate-900 text-[16px] font-semibold focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-slate-805 mb-1.5">Client Partner</label>
                  <select
                    required
                    value={client_id}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full bg-white border border-slate-400 rounded-xl px-3.5 py-2.5 text-slate-900 text-[16px] font-semibold focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="">Select Onboarded Client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.company || c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-slate-805 mb-1.5">Project Budget (₹)</label>
                  <input
                    type="number"
                    required
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full bg-white border border-slate-400 rounded-xl px-3.5 py-2.5 text-slate-900 text-[16px] font-semibold focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    placeholder="e.g. 500000"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-bold text-slate-805 mb-1.5">Brief description</label>
                <textarea
                  rows="2"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white border border-slate-400 rounded-xl px-3.5 py-2.5 text-slate-900 text-[16px] font-semibold focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                ></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-slate-805 mb-1.5">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-white border border-slate-400 rounded-xl px-3.5 py-2.5 text-slate-900 text-[16px] font-semibold focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-slate-805 mb-1.5">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-white border border-slate-400 rounded-xl px-3.5 py-2.5 text-slate-900 text-[16px] font-semibold focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>
              {userRole === 'admin' && (
                <div>
                  <label className="block text-[13px] font-bold text-slate-805 mb-1.5">Assign Project Head</label>
                  <select
                    value={projectHeadId}
                    onChange={(e) => setProjectHeadId(e.target.value)}
                    className="w-full bg-white border border-slate-400 rounded-xl px-3.5 py-2.5 text-slate-900 text-[16px] font-semibold focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="">Select Project Head</option>
                    {projectHeads.map(ph => <option key={ph.id} value={ph.id}>{ph.full_name}</option>)}
                  </select>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsProjectModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-850 rounded-xl text-[14px] font-bold border border-slate-400 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-[14px] font-semibold shadow-md shadow-orange-600/15 cursor-pointer"
                >
                  Save Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ALLOCATE TASK MODAL */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-400 rounded-2xl p-6 space-y-6 shadow-xl">
            <div>
              <h3 className="text-[18px] font-bold text-slate-950">Allocate Project Task</h3>
              <p className="text-[13px] text-slate-700 font-medium">Create & delegate task for {selectedProject?.name}</p>
            </div>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-[13px] font-bold text-slate-805 mb-1.5">Task Title</label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full bg-white border border-slate-400 rounded-xl px-3.5 py-2.5 text-slate-900 text-[16px] font-semibold focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-slate-805 mb-1.5">Task Details</label>
                <textarea
                  rows="2"
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  className="w-full bg-white border border-slate-400 rounded-xl px-3.5 py-2.5 text-slate-900 text-[16px] font-semibold focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                ></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-slate-805 mb-1.5">Start Date</label>
                  <input
                    type="date"
                    required
                    value={taskStart}
                    onChange={(e) => setTaskStart(e.target.value)}
                    className="w-full bg-white border border-slate-400 rounded-xl px-3.5 py-2.5 text-slate-900 text-[16px] font-semibold focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-slate-805 mb-1.5">End Date</label>
                  <input
                    type="date"
                    required
                    value={taskEnd}
                    onChange={(e) => setTaskEnd(e.target.value)}
                    className="w-full bg-white border border-slate-400 rounded-xl px-3.5 py-2.5 text-slate-900 text-[16px] font-semibold focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-bold text-slate-805 mb-1.5">Assign Team Member</label>
                <select
                  required
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full bg-white border border-slate-400 rounded-xl px-3.5 py-2.5 text-slate-900 text-[16px] font-semibold focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                >
                  <option value="">Select Developer</option>
                  {teamMembers.map(tm => <option key={tm.id} value={tm.id}>{tm.full_name}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-850 rounded-xl text-[14px] font-bold border border-slate-400 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-[14px] font-semibold shadow-md shadow-orange-600/15 cursor-pointer"
                >
                  Allocate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXTEND TASK DEADLINE MODAL */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-400 rounded-2xl p-6 space-y-6 shadow-xl">
            <div>
              <h3 className="text-[18px] font-bold text-slate-955">Request Deadline Change</h3>
              <p className="text-[13px] text-slate-700 font-medium">Provide rationale for extension requests</p>
            </div>
            <form onSubmit={handleRequestDeadline} className="space-y-4">
              <div>
                <label className="block text-[13px] font-bold text-slate-805 mb-1.5">Current Deadline</label>
                <input
                  type="text"
                  disabled
                  value={selectedTask?.end_date}
                  className="w-full bg-slate-50 border border-slate-400 rounded-xl px-3.5 py-2.5 text-slate-700 text-[16px] font-semibold cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-slate-855 mb-1.5">Proposed Extension Date</label>
                <input
                  type="date"
                  required
                  value={requestedEndDate}
                  onChange={(e) => setRequestedEndDate(e.target.value)}
                  className="w-full bg-white border border-slate-400 rounded-xl px-3.5 py-2.5 text-slate-900 text-[16px] font-semibold focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-slate-855 mb-1.5">Reason for Request</label>
                <textarea
                  required
                  rows="3"
                  value={extensionReason}
                  onChange={(e) => setExtensionReason(e.target.value)}
                  placeholder="e.g. Scope extensions require additional debugging cycles."
                  className="w-full bg-white border border-slate-400 rounded-xl px-3.5 py-2.5 text-slate-900 text-[16px] font-semibold focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                ></textarea>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-850 rounded-xl text-[14px] font-bold border border-slate-400 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-[14px] font-semibold shadow-md shadow-orange-600/15 cursor-pointer"
                >
                  Send Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBMIT PROGRESS REPORT MODAL */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-400 rounded-2xl p-6 space-y-6 shadow-xl">
            <div>
              <h3 className="text-[18px] font-bold text-slate-950">Submit Task Progress Report</h3>
              <p className="text-[13px] text-slate-700 font-medium">Provide details on hours logged & task completion status</p>
            </div>
            <form onSubmit={handlePostReport} className="space-y-4">
              <div>
                <label className="block text-[13px] font-bold text-slate-805 mb-1.5">Hours Spent</label>
                <input
                  type="number"
                  required
                  step="0.5"
                  value={hoursSpent}
                  onChange={(e) => setHoursSpent(e.target.value)}
                  className="w-full bg-white border border-slate-400 rounded-xl px-3.5 py-2.5 text-slate-900 text-[16px] font-semibold focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  placeholder="e.g. 4.5"
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-slate-805 mb-1.5">Progress/Report description</label>
                <textarea
                  required
                  rows="3"
                  value={reportContent}
                  onChange={(e) => setReportContent(e.target.value)}
                  placeholder="e.g. Finished Tailwind base configuration, updated index.css stylesheets."
                  className="w-full bg-white border border-slate-400 rounded-xl px-3.5 py-2.5 text-slate-900 text-[16px] font-semibold focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                ></textarea>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-850 rounded-xl text-[14px] font-bold border border-slate-400 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-[14px] font-semibold shadow-md shadow-orange-600/15 cursor-pointer"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REVIEW EXTENSION REQUESTS MODAL (Project Head only) */}
      {isReviewRequestsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white border border-slate-400 rounded-2xl p-6 space-y-6 shadow-xl">
            <div>
              <h3 className="text-[18px] font-bold text-slate-950">Evaluate Extension Requests</h3>
              <p className="text-[13px] text-slate-700 font-medium">Approve or decline timeline change requests</p>
            </div>
            <div className="max-h-96 overflow-y-auto space-y-3">
              {deadlineRequests.filter(r => r.status === 'pending').map((req) => (
                <div key={req.id} className="p-4 bg-slate-50 rounded-xl border border-slate-400 flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="space-y-1 max-w-md">
                    <span className="text-[12px] font-bold text-slate-800">Task ID: {req.task_id}</span>
                    <h5 className="text-[14px] font-bold text-slate-950">Task: {req.task?.title}</h5>
                    <p className="text-[13px] text-slate-900 font-medium italic">"Reason: {req.reason}"</p>
                    <div className="flex gap-4 text-[12px] text-slate-700 font-semibold pt-1">
                      <span>Current: {req.current_end_date}</span>
                      <span>Requested: {req.requested_end_date}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 self-end sm:self-start">
                    <button
                      onClick={() => handleRejectDeadline(req.id)}
                      className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-lg text-[12px] font-bold cursor-pointer"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleApproveDeadline(req.id, req.task_id, req.requested_end_date)}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[12px] font-bold border border-emerald-300 shadow-sm cursor-pointer"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              ))}
              {deadlineRequests.filter(r => r.status === 'pending').length === 0 && (
                <div className="text-center p-8 text-slate-800 text-[14px] font-semibold">No pending extension requests.</div>
              )}
            </div>
            <div className="flex justify-end pt-4">
              <button
                onClick={() => setIsReviewRequestsModalOpen(false)}
                className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-850 rounded-xl text-[14px] font-bold border border-slate-400 cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
