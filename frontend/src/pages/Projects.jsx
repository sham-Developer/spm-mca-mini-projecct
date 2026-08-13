import React, { useEffect, useState } from 'react';
import { 
  FolderKanban, 
  Plus, 
  Calendar, 
  User, 
  IndianRupee, 
  CheckCircle, 
  TrendingUp, 
  ClipboardList,
  ArrowLeft,
  Clock,
  Trash2,
  Edit,
  AlertCircle,
  Users,
  CheckSquare,
  RefreshCw,
  BarChart2,
  CalendarRange,
  Sliders,
  PieChart,
  Info,
  BookOpen
} from 'lucide-react';
import API_URL from '../config';

export default function Projects({ userRole, currentUserId }) {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [projectHeads, setProjectHeads] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // New features state
  const [projectHistory, setProjectHistory] = useState([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Pagination states
  const [projectsCurrentPage, setProjectsCurrentPage] = useState(1);
  const [projectsItemsPerPage] = useState(5);

  // Inner-page full view navigation states
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'detail'
  const [projectInnerTab, setProjectInnerTab] = useState('overview'); // 'overview' or 'resources'
  const [projectViewTab, setProjectViewTab] = useState('timeline'); // 'timeline', 'list', 'reports'

  // Modal control states
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isReviewRequestsModalOpen, setIsReviewRequestsModalOpen] = useState(false);

  // Focus targets
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  // Safe Project Deletion States
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleDeleteProjectClick = (project) => {
    setProjectToDelete(project);
    setDeleteConfirmText('');
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeleteProject = async () => {
    if (deleteConfirmText !== "I confirm to delete this project") return;
    try {
      const response = await fetch(`${API_URL}/projects/${projectToDelete.id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setIsDeleteModalOpen(false);
        setProjectToDelete(null);
        setDeleteConfirmText('');
        loadAllData();
        if (selectedProject?.id === projectToDelete.id) {
          setViewMode('list');
          setSelectedProject(null);
        }
      }
    } catch (e) {
      console.error("Error deleting project:", e);
    }
  };

  // Form states - Project (Detailed creation fields)
  const [projectName, setProjectName] = useState('');
  const [companyMode, setCompanyMode] = useState('existing'); // 'existing' or 'new'
  const [newClientCompany, setNewClientCompany] = useState('');
  const [client_id, setClientId] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');
  const [projectHeadId, setProjectHeadId] = useState('');
  const [projectCategory, setProjectCategory] = useState('');
  const [projectDepartment, setProjectDepartment] = useState('');
  const [projectPriority, setProjectPriority] = useState('Medium');

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
      setClients(clientData.filter(c => c.status === 'onboarded' || c.status === 'onboard'));
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

  useEffect(() => {
    if (selectedProject) {
      const fetchHistory = async () => {
        try {
          const res = await fetch(`${API_URL}/projects/${selectedProject.id}/history`);
          const data = await res.json();
          setProjectHistory(data);
        } catch (e) {
          console.error("Error fetching project history:", e);
        }
      };
      fetchHistory();
    } else {
      setProjectHistory([]);
    }
  }, [selectedProject]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      let activeClientId = client_id;

      if (companyMode === 'new' && newClientCompany) {
        // Create new client onboarded dynamically
        const clientRes = await fetch(`${API_URL}/clients`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newClientCompany,
            company: newClientCompany,
            email: `${newClientCompany.toLowerCase().replace(/\s+/g, '')}@example.com`,
            phone: '9876543210',
            status: 'onboarded'
          })
        });
        if (clientRes.ok) {
          const clientData = await clientRes.json();
          activeClientId = clientData.id;
        }
      }

      const response = await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName,
          client_id: activeClientId,
          description,
          start_date: startDate,
          end_date: endDate,
          budget: userRole === 'admin' ? Number(budget) : 0,
          project_head_id: userRole === 'admin' ? (projectHeadId || currentUserId) : currentUserId,
          category: projectCategory,
          department: projectDepartment,
          priority: projectPriority,
          performed_by: userRole === 'admin' ? 'Admin' : 'Project Head'
        })
      });
      if (response.ok) {
        setIsProjectModalOpen(false);
        setProjectName('');
        setClientId('');
        setNewClientCompany('');
        setDescription('');
        setStartDate('');
        setEndDate('');
        setBudget('');
        setProjectHeadId('');
        setProjectCategory('');
        setProjectDepartment('');
        setProjectPriority('Medium');
        loadAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const url = editingTask ? `${API_URL}/tasks/${editingTask.id}` : `${API_URL}/tasks`;
      const method = editingTask ? 'PUT' : 'POST';
      const body = {
        project_id: selectedProject.id,
        title: taskTitle,
        description: taskDescription,
        assigned_to: assignedTo,
        start_date: taskStart,
        end_date: taskEnd
      };
      if (!editingTask) {
        body.status = 'todo';
      }
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (response.ok) {
        setIsTaskModalOpen(false);
        setTaskTitle('');
        setTaskDescription('');
        setAssignedTo('');
        setTaskStart('');
        setTaskEnd('');
        setShowTaskForm(false);
        setEditingTask(null);
        loadAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
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
              onClick={() => setIsProjectModalOpen(!isProjectModalOpen)}
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-4 py-2.5 rounded-xl text-[14px] font-semibold transition-all shadow-md shadow-orange-600/15 cursor-pointer"
            >
              <Plus size={16} className="stroke-[2]" />
              <span>{isProjectModalOpen ? 'Hide Onboarding Form' : 'Onboard Project'}</span>
            </button>
          )}
        </div>
      </div>

      {isProjectModalOpen && (
        <div className="bg-white border border-slate-400 rounded-xl p-6 shadow-md transition-all animate-fade-in space-y-6">
          <div>
            <h3 className="text-[18px] font-bold text-slate-950">Onboard Corporate Workspace</h3>
            <p className="text-[13px] text-slate-700 font-medium">Create client scope agreements & parameter limits</p>
          </div>
          <form onSubmit={handleCreateProject} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-bold text-slate-800 mb-1.5">Project Workspace Name</label>
                <input
                  type="text"
                  required
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full bg-white border border-slate-350 rounded-xl px-3.5 py-2.5 text-slate-900 text-[16px] font-semibold focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-slate-800 mb-1.5">Client Partner</label>
                  <select
                    required
                    value={client_id}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full bg-white border border-slate-350 rounded-xl px-3.5 py-2.5 text-slate-900 text-[16px] font-semibold focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="">Select Onboarded Client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.company || c.name}</option>)}
                  </select>
                </div>
                {userRole === 'admin' ? (
                  <div>
                    <label className="block text-[13px] font-bold text-slate-800 mb-1.5">Project Budget (₹)</label>
                    <input
                      type="number"
                      required
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="w-full bg-white border border-slate-350 rounded-xl px-3.5 py-2.5 text-slate-900 text-[16px] font-semibold focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                      placeholder="e.g. 500000"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-[13px] font-bold text-slate-800 mb-1.5">Project Budget (₹)</label>
                    <input
                      type="text"
                      disabled
                      value="Managed by Admin"
                      className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-700 text-[16px] font-semibold cursor-not-allowed"
                    />
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-bold text-slate-800 mb-1.5">Brief description</label>
              <textarea
                rows="2"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white border border-slate-350 rounded-xl px-3.5 py-2.5 text-slate-900 text-[16px] font-semibold focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              ></textarea>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-slate-800 mb-1.5">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-white border border-slate-350 rounded-xl px-3.5 py-2.5 text-slate-900 text-[16px] font-semibold focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-slate-800 mb-1.5">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-white border border-slate-350 rounded-xl px-3.5 py-2.5 text-slate-900 text-[16px] font-semibold focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>
              {userRole === 'admin' ? (
                <div>
                  <label className="block text-[13px] font-bold text-slate-805 mb-1.5">Assign Project Head</label>
                  <select
                    value={projectHeadId}
                    onChange={(e) => setProjectHeadId(e.target.value)}
                    className="w-full bg-white border border-slate-350 rounded-xl px-3.5 py-2.5 text-slate-900 text-[16px] font-semibold focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="">Select Project Head</option>
                    {projectHeads.map(ph => <option key={ph.id} value={ph.id}>{ph.full_name}</option>)}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-[13px] font-bold text-slate-805 mb-1.5">Project Head</label>
                  <input
                    type="text"
                    disabled
                    value="Self (Project Head)"
                    className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-700 text-[16px] font-semibold cursor-not-allowed"
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsProjectModalOpen(false)}
                className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-xl text-[14px] font-bold border border-slate-300 cursor-pointer"
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
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-500"></div>
        </div>
      ) : (
        <>
          {/* ========================================================= */}
          {/* 2. MAIN TABLE VIEW OF ALL PROJECTS (List view mode) */}
          {/* ========================================================= */}
          {viewMode === 'list' && (
            <div className="bg-white border border-slate-400 rounded-2xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#334155] text-white">
                      <th className="px-4 py-3 text-[12px] font-bold text-left border border-[#5f5f5f]">S.No.</th>
                      <th className="px-4 py-3 text-[12px] font-bold text-left border border-[#5f5f5f]">Workspace Name</th>
                      <th className="px-4 py-3 text-[12px] font-bold text-left border border-[#5f5f5f]">Client Partner</th>
                      <th className="px-4 py-3 text-[12px] font-bold text-left border border-[#5f5f5f]">Category / Dept</th>
                      <th className="px-4 py-3 text-[12px] font-bold text-left border border-[#5f5f5f]">Duration Dates</th>
                      {userRole === 'admin' && (
                        <th className="px-4 py-3 text-[12px] font-bold text-left border border-[#5f5f5f]">Budget (₹)</th>
                      )}
                      <th className="px-4 py-3 text-[12px] font-bold text-left border border-[#5f5f5f]">Project Head</th>
                      <th className="px-4 py-3 text-[12px] font-bold text-left border border-[#5f5f5f]">Status</th>
                      <th className="px-4 py-3 text-[12px] font-bold text-center border border-[#5f5f5f]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {displayedProjects
                      .slice((projectsCurrentPage - 1) * projectsItemsPerPage, projectsCurrentPage * projectsItemsPerPage)
                      .map((proj, idx) => {
                        const serialNum = (projectsCurrentPage - 1) * projectsItemsPerPage + idx + 1;
                        return (
                          <tr key={proj.id} className="hover:bg-slate-50 transition-colors text-slate-950 font-medium">
                            <td className="px-4 py-3.5 text-[13px] font-medium text-slate-900 border border-slate-300">{serialNum}</td>
                            <td className="px-4 py-3.5 text-[14px] font-semibold text-slate-950 border border-slate-300">
                              <span className="cursor-pointer hover:text-orange-600 block" onClick={() => { setSelectedProject(proj); setViewMode('detail'); }}>
                                {proj.name}
                              </span>
                              <span className="text-[10px] text-slate-900 font-medium bg-slate-100 border border-slate-300 px-1.5 py-0.5 rounded uppercase mt-1 inline-block">
                                {proj.priority || 'Medium'}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-[13px] font-medium text-slate-900 border border-slate-300">
                              {proj.client?.company || proj.client?.name || 'Onboarding Lead'}
                            </td>
                            <td className="px-4 py-3.5 text-[13px] font-medium text-slate-900 border border-slate-300">
                              <div className="font-semibold text-slate-950">{proj.category || 'N/A'}</div>
                              <div className="text-[11px] text-slate-900">{proj.department || 'N/A'}</div>
                            </td>
                            <td className="px-4 py-3.5 text-[12px] font-medium text-slate-900 border border-slate-300 whitespace-nowrap">
                              <div>Start: {proj.start_date}</div>
                              <div>End: {proj.end_date}</div>
                            </td>
                            {userRole === 'admin' && (
                              <td className="px-4 py-3.5 text-[13px] font-semibold text-emerald-900 border border-slate-300 whitespace-nowrap">
                                {formatRupee(proj.budget)}
                              </td>
                            )}
                            <td className="px-4 py-3.5 text-[13px] font-medium text-slate-900 border border-slate-300">
                              {proj.project_head?.full_name || 'Admin'}
                            </td>
                            <td className="px-4 py-3.5 border border-slate-300">
                              <span className="text-[11px] uppercase tracking-wider text-slate-950 font-semibold bg-orange-100 border border-orange-400 px-2.5 py-0.5 rounded">
                                {proj.status}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-center border border-slate-300">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => { setSelectedProject(proj); setViewMode('detail'); }}
                                  className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-[12px] font-bold shadow-md cursor-pointer transition-colors whitespace-nowrap"
                                >
                                  View Workspace
                                </button>
                                {(userRole === 'admin' || userRole === 'project_head') && (
                                  <button
                                    onClick={() => handleDeleteProjectClick(proj)}
                                    className="p-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 rounded-lg cursor-pointer transition-colors"
                                    title="Delete Project Workspace"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    {displayedProjects.length === 0 && (
                      <tr>
                        <td colSpan={userRole === 'admin' ? 9 : 8} className="text-center p-8 text-slate-805 font-bold text-[14px]">
                          No projects workspace boards found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION PANEL */}
              {displayedProjects.length > 5 && (
                <div className="p-4 border-t border-slate-300 bg-slate-50 flex items-center justify-between">
                  <span className="text-[12px] text-slate-800 font-bold">
                    Showing Page {projectsCurrentPage} of {Math.ceil(displayedProjects.length / projectsItemsPerPage)}
                  </span>
                  <div className="flex gap-2">
                    <button
                      disabled={projectsCurrentPage === 1}
                      onClick={() => setProjectsCurrentPage(projectsCurrentPage - 1)}
                      className="px-3 py-1 bg-white border border-slate-400 rounded text-[12px] font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                    >
                      Prev
                    </button>
                    <button
                      disabled={projectsCurrentPage >= Math.ceil(displayedProjects.length / projectsItemsPerPage)}
                      onClick={() => setProjectsCurrentPage(projectsCurrentPage + 1)}
                      className="px-3 py-1 bg-white border border-slate-400 rounded text-[12px] font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* 3. GO TO PAGE INNER VIEW PANEL (Matching Mockup 1 style) */}
          {/* ========================================================= */}
          {viewMode === 'detail' && selectedProject && (
            <div className="space-y-6 transition-all animate-fade-in">
              
              {/* TOP INNER PAGE TABS NAVIGATION */}
              <div className="flex items-center gap-3 bg-white p-2 border border-slate-400 rounded-xl shadow-sm">
                <button
                  onClick={() => setProjectInnerTab('overview')}
                  className={`px-4 py-2 text-[13px] font-bold rounded-lg transition-colors ${projectInnerTab === 'overview' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-800 hover:bg-slate-100'}`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setProjectInnerTab('resources')}
                  className={`px-4 py-2 text-[13px] font-bold rounded-lg transition-colors ${projectInnerTab === 'resources' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-800 hover:bg-slate-100'}`}
                >
                  Resources
                </button>
              </div>

              {/* OVERVIEW CONTENT VIEW */}
              {projectInnerTab === 'overview' && (
                <>
                  {/* KPI ANALYTICS STATS ROW (6 detailed counters) */}
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    {/* Status Card */}
                    <div className="bg-white border border-slate-400 rounded-xl p-4 flex flex-col justify-between shadow-sm">
                      <div className="text-[12px] text-slate-700 font-bold uppercase tracking-wider">Project Status</div>
                      <div className="text-[16px] font-bold text-orange-600 mt-2 block truncate">
                        {selectedProject.status}
                      </div>
                    </div>
                    {/* Total Tasks Card */}
                    <div className="bg-white border border-slate-400 rounded-xl p-4 flex flex-col justify-between shadow-sm">
                      <div className="text-[12px] text-slate-700 font-bold uppercase tracking-wider">Total Tasks</div>
                      <div className="text-[26px] font-extrabold text-slate-950 mt-1">
                        {tasks.filter(t => t.project_id === selectedProject.id).length}
                      </div>
                    </div>
                    {/* Completed Tasks Card */}
                    <div className="bg-white border border-slate-400 rounded-xl p-4 flex flex-col justify-between shadow-sm">
                      <div className="text-[12px] text-slate-700 font-bold uppercase tracking-wider">Completed</div>
                      <div className="text-[26px] font-extrabold text-emerald-700 mt-1">
                        {tasks.filter(t => t.project_id === selectedProject.id && t.status === 'completed').length}
                      </div>
                    </div>
                    {/* Ongoing Tasks Card */}
                    <div className="bg-white border border-slate-400 rounded-xl p-4 flex flex-col justify-between shadow-sm">
                      <div className="text-[12px] text-slate-700 font-bold uppercase tracking-wider">Ongoing</div>
                      <div className="text-[26px] font-extrabold text-blue-700 mt-1">
                        {tasks.filter(t => t.project_id === selectedProject.id && t.status !== 'completed').length}
                      </div>
                    </div>
                    {/* Delayed Completed Card */}
                    <div className="bg-white border border-slate-400 rounded-xl p-4 flex flex-col justify-between shadow-sm">
                      <div className="text-[12px] text-slate-700 font-bold uppercase tracking-wider">Delayed</div>
                      <div className="text-[26px] font-extrabold text-yellow-700 mt-1">
                        {tasks.filter(t => t.project_id === selectedProject.id && t.status === 'completed' && new Date(t.end_date) > new Date(selectedProject.end_date)).length}
                      </div>
                    </div>
                    {/* Overdue Card */}
                    <div className="bg-white border border-slate-400 rounded-xl p-4 flex flex-col justify-between shadow-sm">
                      <div className="text-[12px] text-slate-700 font-bold uppercase tracking-wider">Overdue</div>
                      <div className="text-[26px] font-extrabold text-red-700 mt-1">
                        {tasks.filter(t => t.project_id === selectedProject.id && t.status !== 'completed' && new Date() > new Date(t.end_date)).length}
                      </div>
                    </div>
                  </div>

                  {/* PROJECT META CARD (Image 1 top middle section style) */}
                  <div className="bg-white border border-slate-400 rounded-2xl p-5 shadow-md space-y-5">
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                      {/* Name & Priority badge */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-[20px] font-extrabold text-slate-950">{selectedProject.name}</h3>
                          <span className="text-[11px] uppercase tracking-wider text-orange-950 font-bold bg-orange-100 border border-orange-400 px-2 py-0.5 rounded">
                            {selectedProject.priority || 'Medium'}
                          </span>
                        </div>
                        <p className="text-[13px] text-slate-800 font-medium">{selectedProject.description || 'No description workspace parameters specified.'}</p>
                      </div>

                      {/* Initiated By & Project Head details */}
                      <div className="flex flex-wrap gap-4 text-[13px]">
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl p-2.5">
                          <Users size={16} className="text-orange-600" />
                          <div>
                            <span className="text-[10px] text-slate-800 font-bold block uppercase">Initiated By</span>
                            <span className="font-extrabold text-slate-950">{selectedProject.client?.name || 'Client Lead'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl p-2.5">
                          <User size={16} className="text-orange-600" />
                          <div>
                            <span className="text-[10px] text-slate-800 font-bold block uppercase">Team Head</span>
                            <span className="font-extrabold text-slate-950">{selectedProject.project_head?.full_name || 'Software Admin'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom detailed parameters section */}
                    <div className="border-t border-slate-200 pt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <div className="text-[13px] font-semibold text-slate-800">
                        <span className="font-bold text-slate-700 block text-[10px] uppercase">Starting Date</span>
                        <span className="text-[14px] font-bold text-slate-900">{selectedProject.start_date}</span>
                      </div>
                      <div className="text-[13px] font-semibold text-slate-805">
                        <span className="font-bold text-slate-700 block text-[10px] uppercase">Duration Deadline</span>
                        <span className="text-[14px] font-bold text-red-700">{selectedProject.end_date}</span>
                      </div>
                      <div className="flex justify-end gap-2">
                        {(userRole === 'admin' || userRole === 'project_head') && (
                          <button
                            onClick={() => { setEditingTask(null); setShowTaskForm(!showTaskForm); }}
                            className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white px-3.5 py-2 rounded-xl text-[12px] font-bold cursor-pointer transition-colors"
                          >
                            <Plus size={14} />
                            <span>{showTaskForm ? 'Cancel Form' : 'Allocate Task'}</span>
                          </button>
                        )}
                        <button className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-400 text-slate-800 rounded-xl text-[12px] font-bold cursor-pointer transition-colors">
                          Add Correction
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* SUB-TABS ACTIONS SELECTORS */}
                  <div className="flex items-center gap-2 border-b border-slate-300 pb-0.5">
                    {['timeline', 'list', 'reports'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setProjectViewTab(tab)}
                        className={`px-4 py-2 text-[13px] font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${projectViewTab === tab ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-800 hover:text-slate-950'}`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {/* ========================================== */}
                  {/* TAB 1: TIMELINE WEEKLY GRID SCHEDULER VIEW */}
                  {/* ========================================== */}
                  {projectViewTab === 'timeline' && (
                    <div className="bg-white border border-slate-400 rounded-2xl p-5 shadow-md space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-[15px] font-extrabold text-slate-950">Workspace Timeline Calendar</span>
                          <span className="text-[11px] font-bold bg-slate-100 border border-slate-350 text-slate-800 px-2 py-0.5 rounded-full">August 2026 Today</span>
                        </div>
                        <div className="text-[11px] text-slate-800 font-bold bg-orange-50 border border-orange-200 text-orange-800 px-3 py-1 rounded">
                          Work Hours: 9:30 AM - 6:30 PM
                        </div>
                      </div>

                      {/* Timeline Day columns & Work Hours Grid */}
                      <div className="overflow-x-auto border border-[#5f5f5f] rounded-xl">
                        <div className="min-w-[800px] divide-y divide-[#5f5f5f]">
                          {/* Day Columns Headings */}
                          <div className="grid grid-cols-8 bg-[#334155] text-white">
                            <div className="p-3 border-r border-[#5f5f5f] text-[12px] font-bold">Timeline Hour</div>
                            {['10 Mon', '11 Tue', '12 Wed', '13 Thu', '14 Fri', '15 Sat', '16 Sun'].map((day) => (
                              <div key={day} className="p-3 text-center border-r border-[#5f5f5f] text-[12px] font-bold">
                                {day}
                              </div>
                            ))}
                          </div>

                          {/* Hours slots rows */}
                          {['9:30 AM', '11:00 AM', '12:30 PM', '2:00 PM', '3:30 PM', '5:00 PM', '6:30 PM'].map((hourSlot) => (
                            <div key={hourSlot} className="grid grid-cols-8 hover:bg-slate-50 transition-colors">
                              <div className="p-3 border-r border-[#5f5f5f] text-[12px] font-bold text-slate-800 bg-slate-50">{hourSlot}</div>
                              {/* Render tasks that match scheduler */}
                              {[1, 2, 3, 4, 5, 6, 7].map((dayIdx) => {
                                const projectTasks = tasks.filter(t => t.project_id === selectedProject.id);
                                return (
                                  <div key={dayIdx} className="p-2 border-r border-[#5f5f5f] min-h-[50px] flex flex-col gap-1 justify-center">
                                    {projectTasks.slice(0, 1).map((t) => (
                                      <div key={t.id} className="text-[10px] p-1.5 rounded-lg bg-orange-50 border border-orange-300 text-orange-950 font-bold block truncate">
                                        {t.title}
                                      </div>
                                    ))}
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ========================================== */}
                  {/* TAB 2: TASKS LIST VIEW WITH CRUD CONTROLS */}
                  {/* ========================================== */}
                  {projectViewTab === 'list' && (
                    <div className="space-y-4">
                      {/* Inline Task Form */}
                      {showTaskForm && (
                        <div className="bg-slate-50 border border-slate-400 rounded-xl p-5 shadow-sm space-y-4 animate-fade-in">
                          <div>
                            <h4 className="text-[14px] font-extrabold text-slate-950 uppercase tracking-wide">
                              {editingTask ? 'Modify Allocated Task parameters' : 'Allocate New task block'}
                            </h4>
                          </div>
                          <form onSubmit={handleCreateTask} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[13px] font-bold text-slate-800 mb-1">Task Title *</label>
                                <input
                                  type="text"
                                  required
                                  value={taskTitle}
                                  onChange={(e) => setTaskTitle(e.target.value)}
                                  className="w-full bg-white border border-slate-400 rounded-lg px-3 py-2 text-slate-900 text-[14px] font-semibold focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[13px] font-bold text-slate-800 mb-1">Assign Developer *</label>
                                <select
                                  required
                                  value={assignedTo}
                                  onChange={(e) => setAssignedTo(e.target.value)}
                                  className="w-full bg-white border border-slate-400 rounded-lg px-3 py-2 text-slate-900 text-[14px] font-bold focus:outline-none"
                                >
                                  <option value="">Select Team Member</option>
                                  {teamMembers.map(tm => <option key={tm.id} value={tm.id}>{tm.full_name}</option>)}
                                </select>
                              </div>
                            </div>
                            <div>
                              <label className="block text-[13px] font-bold text-slate-800 mb-1">Details / Description</label>
                              <textarea
                                rows="2"
                                value={taskDescription}
                                onChange={(e) => setTaskDescription(e.target.value)}
                                className="w-full bg-white border border-slate-400 rounded-lg px-3 py-2 text-slate-900 text-[14px] font-semibold focus:outline-none"
                              ></textarea>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[13px] font-bold text-slate-800 mb-1">Start Date</label>
                                <input
                                  type="date"
                                  required
                                  value={taskStart}
                                  onChange={(e) => setTaskStart(e.target.value)}
                                  className="w-full bg-white border border-slate-400 rounded-lg px-3 py-2 text-slate-900 text-[14px] font-semibold focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[13px] font-bold text-slate-800 mb-1">End Date</label>
                                <input
                                  type="date"
                                  required
                                  value={taskEnd}
                                  onChange={(e) => setTaskEnd(e.target.value)}
                                  className="w-full bg-white border border-slate-400 rounded-lg px-3 py-2 text-slate-900 text-[14px] font-semibold focus:outline-none"
                                />
                              </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                              <button
                                type="button"
                                onClick={() => { setShowTaskForm(false); setEditingTask(null); }}
                                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 rounded-lg text-[12px] font-bold border border-slate-300 cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-[12px] font-bold shadow-md cursor-pointer"
                              >
                                {editingTask ? 'Update Task' : 'Allocate Task'}
                              </button>
                            </div>
                          </form>
                        </div>
                      )}

                      {/* Tasks Listing table */}
                      <div className="bg-white border border-slate-400 rounded-2xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-[#334155] text-white">
                                <th className="px-4 py-2.5 text-[12px] font-bold text-left border border-[#5f5f5f]">S.No.</th>
                                <th className="px-4 py-2.5 text-[12px] font-bold text-left border border-[#5f5f5f]">Task Title</th>
                                <th className="px-4 py-2.5 text-[12px] font-bold text-left border border-[#5f5f5f]">Assigned Developer</th>
                                <th className="px-4 py-2.5 text-[12px] font-bold text-left border border-[#5f5f5f]">Start</th>
                                <th className="px-4 py-2.5 text-[12px] font-bold text-left border border-[#5f5f5f]">Deadline</th>
                                <th className="px-4 py-2.5 text-[12px] font-bold text-left border border-[#5f5f5f]">Status</th>
                                <th className="px-4 py-2.5 text-[12px] font-bold text-center border border-[#5f5f5f]">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-300">
                              {tasks
                                .filter(t => t.project_id === selectedProject.id)
                                .map((task, idx) => (
                                  <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 text-[13px] font-bold text-slate-800 border border-slate-300">{idx + 1}</td>
                                    <td className="px-4 py-3 text-[14px] font-bold text-slate-950 border border-slate-300">
                                      <div>{task.title}</div>
                                      <div className="text-[11px] text-slate-800 font-medium mt-0.5">{task.description}</div>
                                    </td>
                                    <td className="px-4 py-3 text-[13px] font-semibold text-slate-800 border border-slate-300">
                                      {task.assigned_user?.full_name || 'Unassigned'}
                                    </td>
                                    <td className="px-4 py-3 text-[12px] font-semibold text-slate-800 border border-slate-300">{task.start_date}</td>
                                    <td className="px-4 py-3 text-[12px] font-semibold text-slate-800 border border-slate-300">{task.end_date}</td>
                                    <td className="px-4 py-3 border border-slate-300">
                                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                        task.status === 'completed' 
                                          ? 'bg-emerald-100 text-emerald-950 border border-emerald-400'
                                          : task.status === 'review'
                                          ? 'bg-blue-100 text-blue-955 border border-blue-400'
                                          : 'bg-slate-200 text-slate-950 border border-slate-400'
                                      }`}>
                                        {task.status}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-center border border-slate-300">
                                      <div className="flex items-center justify-center gap-1.5">
                                        <button
                                          onClick={() => {
                                            setEditingTask(task);
                                            setTaskTitle(task.title);
                                            setTaskDescription(task.description || '');
                                            setAssignedTo(task.assigned_to || '');
                                            setTaskStart(task.start_date || '');
                                            setTaskEnd(task.end_date || '');
                                            setShowTaskForm(true);
                                          }}
                                          className="p-1 hover:bg-slate-100 text-blue-700 border border-slate-300 rounded cursor-pointer"
                                          title="Edit Task"
                                        >
                                          <Edit size={14} />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteTask(task.id)}
                                          className="p-1 hover:bg-red-50 text-red-700 border border-slate-300 rounded cursor-pointer"
                                          title="Delete Task"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              {tasks.filter(t => t.project_id === selectedProject.id).length === 0 && (
                                  <tr>
                                    <td colSpan={7} className="text-center p-6 text-slate-800 font-semibold text-[13px]">
                                      No tasks assigned inside this project workspace.
                                    </td>
                                  </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ========================================== */}
                  {/* TAB 3: WORKSPACE AUDIT LOGS TIMELINE VIEW */}
                  {/* ========================================== */}
                  {projectViewTab === 'reports' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                      {/* Audit history logs */}
                      <div className="bg-white border border-slate-400 rounded-2xl p-5 shadow-md space-y-4">
                        <h4 className="text-[13px] font-bold text-slate-950 uppercase tracking-widest flex items-center gap-1.5">
                          <Clock size={14} /> System Audit Logs
                        </h4>
                        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                          {projectHistory.map((log) => (
                            <div key={log.id} className="relative pl-5 pb-3 border-l border-slate-400 last:border-l-0">
                              <div className="absolute -left-[5.5px] top-1.5 w-2.5 h-2.5 bg-orange-600 rounded-full border border-white"></div>
                              <div className="text-[11px] font-bold text-slate-700">{new Date(log.created_at).toLocaleString()}</div>
                              <div className="text-[13px] font-bold text-slate-950 mt-0.5">{log.description}</div>
                              <div className="text-[11px] text-slate-800 font-semibold mt-0.5">By: <span className="font-bold text-orange-600">{log.performed_by}</span></div>
                            </div>
                          ))}
                          {projectHistory.length === 0 && (
                            <div className="text-center p-6 text-slate-705 font-semibold text-[13px]">No audit logs recorded yet.</div>
                          )}
                        </div>
                      </div>

                      {/* Developer Progress Reports logs */}
                      <div className="bg-white border border-slate-400 rounded-2xl p-5 shadow-md space-y-4">
                        <h4 className="text-[13px] font-bold text-slate-950 uppercase tracking-widest flex items-center gap-1.5">
                          <ClipboardList size={14} /> Developer Progress Reports
                        </h4>
                        {/* Render reports if any */}
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          <div className="text-center p-6 text-slate-705 font-semibold text-[13px]">No report logs submitted yet.</div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* RESOURCES CONTENT VIEW */}
              {projectInnerTab === 'resources' && (
                <div className="bg-white border border-slate-400 rounded-2xl p-6 shadow-md space-y-6">
                  <div>
                    <h3 className="text-[16px] font-bold text-slate-950 uppercase tracking-widest">Workspace Allocated Resources</h3>
                    <p className="text-[13px] text-slate-700 font-semibold">Active team assets, documents, and credentials</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Employees */}
                    <div className="border border-slate-350 p-4 rounded-xl space-y-3 bg-slate-50">
                      <h4 className="text-[13px] font-bold text-slate-950 uppercase tracking-wide">Developer Profiles</h4>
                      <div className="space-y-2">
                        {teamMembers.map(tm => (
                          <div key={tm.id} className="flex justify-between items-center p-2 bg-white border border-slate-300 rounded-lg">
                            <span className="text-[13px] font-bold text-slate-900">{tm.full_name}</span>
                            <span className="text-[11px] text-slate-800 font-semibold bg-slate-100 border border-slate-300 px-2 py-0.5 rounded">Developer</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Files / credentials place */}
                    <div className="border border-slate-350 p-4 rounded-xl space-y-3 bg-slate-50">
                      <h4 className="text-[13px] font-bold text-slate-950 uppercase tracking-wide">Workspace Documents</h4>
                      <div className="text-center p-6 text-slate-700 font-semibold text-[13px]">No documents deposited.</div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
        </>
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

      {/* SECURE PROJECT DELETION MODAL */}
      {isDeleteModalOpen && projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-400 rounded-xl p-6 space-y-6 shadow-xl animate-fade-in">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-red-650 shrink-0 mt-0.5" size={24} />
              <div>
                <h3 className="text-[18px] font-bold text-slate-950">Confirm Project Deletion</h3>
                <p className="text-[13px] text-slate-800 font-semibold mt-1">
                  You are about to delete <strong>{projectToDelete.name}</strong>. This will delete all tasks and reports associated with this workspace permanently.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-[12px] font-extrabold text-slate-900">
                To confirm, type <span className="font-extrabold text-red-700">I confirm to delete this project</span> in the input below:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="I confirm to delete this project"
                className="w-full bg-white border border-slate-350 rounded-xl px-3.5 py-2.5 text-slate-900 text-[14px] font-semibold focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setIsDeleteModalOpen(false); setProjectToDelete(null); setDeleteConfirmText(''); }}
                className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-900 rounded-xl text-[13px] font-bold border border-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteProject}
                disabled={deleteConfirmText !== "I confirm to delete this project"}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-[13px] font-bold shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Permanently Delete Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
