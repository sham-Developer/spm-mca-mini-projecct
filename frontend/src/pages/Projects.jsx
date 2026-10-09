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
  BookOpen,
  X,
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import API_URL from '../config';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';
import { useUI } from '../components/UIProvider';

export default function Projects({ userRole, currentUserId }) {
  const { showToast } = useUI();
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [projectHeads, setProjectHeads] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [reports, setReports] = useState([]);
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
  const [projectViewTab, setProjectViewTab] = useState('list'); // 'list', 'reports'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'planning', 'on_hold', 'completed'

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

  const [editingProject, setEditingProject] = useState(null);

  const handleEditProjectClick = (proj) => {
    setEditingProject(proj);
    setProjectName(proj.name || '');
    setClientId(proj.client_id || '');
    const matchedClient = clients.find(c => c.id === proj.client_id);
    setClientPartnerInput(matchedClient ? (matchedClient.company || matchedClient.name) : '');
    setIsClientDropdownOpen(false);
    setDescription(proj.description || '');
    setStartDate(proj.start_date ? proj.start_date.split('T')[0] : '');
    setEndDate(proj.end_date ? proj.end_date.split('T')[0] : '');
    setBudget(proj.budget || '');
    setProjectHeadId(proj.project_head_id || '');
    setProjectCategory(proj.category || '');
    setProjectDepartment(proj.department || '');
    setProjectPriority(proj.priority || 'Medium');
    setProjectStatus(proj.status || 'planning');
    setIsProjectModalOpen(true);
  };

  const resetProjectForm = () => {
    setIsProjectModalOpen(false);
    setProjectName('');
    setClientId('');
    setClientPartnerInput('');
    setIsClientDropdownOpen(false);
    setNewClientCompany('');
    setDescription('');
    setStartDate('');
    setEndDate('');
    setBudget('');
    setProjectHeadId('');
    setProjectCategory('');
    setProjectDepartment('');
    setProjectPriority('Medium');
    setProjectStatus('planning');
    setEditingProject(null);
  };

  // Form states - Project (Detailed creation fields)
  const [projectName, setProjectName] = useState('');
  const [companyMode, setCompanyMode] = useState('existing'); // 'existing' or 'new'
  const [newClientCompany, setNewClientCompany] = useState('');
  const [client_id, setClientId] = useState('');
  const [clientPartnerInput, setClientPartnerInput] = useState('');
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');
  const [projectHeadId, setProjectHeadId] = useState('');
  const [projectCategory, setProjectCategory] = useState('');
  const [projectDepartment, setProjectDepartment] = useState('');
  const [projectPriority, setProjectPriority] = useState('Medium');
  const [projectStatus, setProjectStatus] = useState('planning');

  const handleUpdateProjectStatus = async (projectId, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          performed_by: userRole === 'admin' ? 'Admin' : 'Project Head'
        })
      });
      if (response.ok) {
        loadAllData();
      }
    } catch (e) {
      console.error('Error updating project status:', e);
    }
  };

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
  const [reportProgress, setReportProgress] = useState(0);
  const [minProgress, setMinProgress] = useState(0);
  const [reportStatus, setReportStatus] = useState('in_progress');
  const [reportModalTab, setReportModalTab] = useState('form');

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
      const [projRes, clientRes, userRes, taskRes, reqRes, reportRes] = await Promise.all([
        fetch(`${API_URL}/projects`),
        fetch(`${API_URL}/clients`),
        fetch(`${API_URL}/users`),
        fetch(`${API_URL}/tasks`),
        fetch(`${API_URL}/deadline-requests`),
        fetch(`${API_URL}/reports`)
      ]);

      const projData = await projRes.json();
      const clientData = await clientRes.json();
      const userData = await userRes.json();
      const taskData = await taskRes.json();
      const reqData = await reqRes.json();
      const reportData = await reportRes.json();

      setProjects(projData);
      setClients(clientData.filter(c => c.status === 'onboarded' || c.status === 'onboard'));
      setProjectHeads(userData.filter(u => u.role === 'project_head'));
      setTeamMembers(userData.filter(u => u.role === 'team_member'));
      setTasks(taskData);
      setDeadlineRequests(reqData);
      setReports(reportData);

      // Sync selected project details with updated info
      setSelectedProject(prevSelected => {
        if (!prevSelected) return null;
        const updated = projData.find(p => p.id === prevSelected.id);
        if (updated) {
          // If updated project has client/project head relation data, merge them
          const client = clientData.find(c => c.id === updated.client_id);
          const projectHead = userData.find(u => u.id === updated.project_head_id);
          return {
            ...updated,
            client,
            project_head: projectHead
          };
        }
        return prevSelected;
      });
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

      // Check if user entered a custom client partner name that doesn't match current client_id
      const trimmedInput = (clientPartnerInput || '').trim();
      if (trimmedInput) {
        const matched = clients.find(c => 
          (c.company && c.company.toLowerCase() === trimmedInput.toLowerCase()) ||
          (c.name && c.name.toLowerCase() === trimmedInput.toLowerCase())
        );
        if (matched) {
          activeClientId = matched.id;
        } else if (!activeClientId) {
          // User typed a brand new custom client partner: automatically onboard client
          const clientRes = await fetch(`${API_URL}/clients`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: trimmedInput,
              company: trimmedInput,
              email: `${trimmedInput.toLowerCase().replace(/[^a-z0-9]/g, '')}@partner.com`,
              phone: '9876543210',
              status: 'onboarded'
            })
          });
          if (clientRes.ok) {
            const clientData = await clientRes.json();
            activeClientId = clientData.id;
          }
        }
      }

      const url = editingProject ? `${API_URL}/projects/${editingProject.id}` : `${API_URL}/projects`;
      const method = editingProject ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
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
          status: projectStatus,
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
        setEditingProject(null);
        loadAllData();

        if (editingProject && selectedProject?.id === editingProject.id) {
          const updatedRes = await fetch(`${API_URL}/projects/${editingProject.id}`);
          if (updatedRes.ok) {
            const updatedProj = await updatedRes.json();
            setSelectedProject(updatedProj);
          }
        }
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
    if (!selectedTask) return;
    const currentProg = Number(selectedTask?.progress || 0);
    const targetProg = Number(reportProgress);
    if (targetProg < currentProg) {
      showToast(`Progress cannot be decreased below previously logged level (${currentProg}%).`, 'error');
      return;
    }
    try {
      const reportRes = await fetch(`${API_URL}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: selectedTask.id,
          submitted_by: currentUserId || null,
          content: reportContent,
          hours_spent: Number(hoursSpent || 0),
          progress: targetProg,
          status: 'submitted'
        })
      });

      const taskRes = await fetch(`${API_URL}/tasks/${selectedTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: reportStatus,
          progress: targetProg
        })
      });

      if (reportRes.ok || taskRes.ok) {
        showToast('Daily progress report submitted successfully!', 'success');
        setIsReportModalOpen(false);
        setReportContent('');
        setHoursSpent('');
        await loadAllData();
      } else {
        showToast('Server returned an error. Please try again.', 'error');
      }
    } catch (e) {
      console.error("Failed to submit progress report:", e);
      showToast('Error submitting report: ' + (e.message || 'Network error'), 'error');
    }
  };

  // Role-accessible projects
  const roleProjects = projects.filter(p => {
    if (userRole === 'admin') return true;
    if (userRole === 'project_head') return p.project_head_id === currentUserId;
    if (userRole === 'team_member') {
      return tasks.some(t => t.project_id === p.id && t.assigned_to === currentUserId);
    }
    return false;
  });

  // Filter projects depending on roles & active status tab + sort active first
  const displayedProjects = roleProjects
    .filter(p => {
      if (statusFilter === 'all') return true;
      return (p.status || 'planning').toLowerCase() === statusFilter.toLowerCase();
    })
    .sort((a, b) => {
      // Status priority order: active (1) -> planning (2) -> on_hold (3) -> completed (4)
      const priorityOrder = { active: 1, planning: 2, on_hold: 3, completed: 4 };
      const statusA = (a.status || 'planning').toLowerCase();
      const statusB = (b.status || 'planning').toLowerCase();
      const rankA = priorityOrder[statusA] || 99;
      const rankB = priorityOrder[statusB] || 99;
      if (rankA !== rankB) return rankA - rankB;
      // Secondary sort: most recently created / updated first
      return new Date(b.created_at || b.start_date || 0) - new Date(a.created_at || a.start_date || 0);
    });

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const cleanStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const parts = cleanStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  };

  return (
    <>
      <div className="space-y-6 animate-fade-in h-[calc(100vh-180px)] overflow-y-auto pr-2">
      {/* STATUS FILTER TABS WITH ONBOARD ACTION INLINE (Tabs on left, Action on right) */}
      {viewMode === 'list' && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-300 pb-2">
          <div className="flex items-center gap-2 overflow-x-auto min-w-0 flex-1">
            {[
              { id: 'all', label: 'All Projects', count: roleProjects.length },
              { id: 'active', label: 'Active', count: roleProjects.filter(p => (p.status || '').toLowerCase() === 'active').length },
              { id: 'planning', label: 'Planning', count: roleProjects.filter(p => (p.status || '').toLowerCase() === 'planning').length },
              { id: 'on_hold', label: 'On Hold', count: roleProjects.filter(p => (p.status || '').toLowerCase() === 'on_hold').length },
              { id: 'completed', label: 'Completed', count: roleProjects.filter(p => (p.status || '').toLowerCase() === 'completed').length },
            ].map((tab) => {
              const isSelected = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setStatusFilter(tab.id);
                    setProjectsCurrentPage(1);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-[13px] font-medium transition-all cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-900 hover:bg-slate-100 border border-slate-300'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                    isSelected 
                      ? 'bg-slate-700 text-white' 
                      : tab.id === 'active' && tab.count > 0 
                      ? 'bg-emerald-100 text-emerald-950 font-bold' 
                      : 'bg-slate-100 text-slate-900'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {(userRole === 'admin' || userRole === 'project_head') && (
            <button
              onClick={() => { resetProjectForm(); setIsProjectModalOpen(true); }}
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-xl text-[13px] font-semibold transition-all shadow-md shadow-orange-600/15 cursor-pointer shrink-0 self-start sm:self-auto"
            >
              <Plus size={16} className="stroke-[2]" />
              <span>Onboard Project</span>
            </button>
          )}
        </div>
      )}

      {isProjectModalOpen && (
        <div className="fixed top-0 left-0 h-full inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-4xl bg-white border border-slate-400 rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-[18px] font-bold text-slate-950">
                  {editingProject ? `Edit Workspace Parameters: ${editingProject.name}` : 'Onboard Corporate Workspace'}
                </h3>
                <p className="text-[13px] text-slate-900 font-medium">
                  {editingProject ? 'Modify client scope agreements & parameter limits' : 'Create client scope agreements & parameter limits'}
                </p>
              </div>
              <button
                type="button"
                onClick={resetProjectForm}
                className="text-slate-900 hover:text-slate-900 transition-colors p-1 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="space-y-3.5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-900 mb-1">Project Workspace Name</label>
                  <input
                    type="text"
                    required
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-full px-3.5 py-1.5 text-slate-950 text-[13px] font-medium focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-medium text-slate-900">Client Partner</label>
                    <span className="text-[10px] text-slate-900 font-normal">Select or type custom</span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Acme Corp or type custom partner..."
                      value={clientPartnerInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setClientPartnerInput(val);
                        setIsClientDropdownOpen(true);
                        // Check if exact match
                        const match = clients.find(c => 
                          (c.company && c.company.toLowerCase() === val.toLowerCase()) ||
                          (c.name && c.name.toLowerCase() === val.toLowerCase())
                        );
                        setClientId(match ? match.id : '');
                      }}
                      onFocus={() => setIsClientDropdownOpen(true)}
                      onBlur={() => {
                        // Delay closing so clicks on dropdown items register
                        setTimeout(() => setIsClientDropdownOpen(false), 200);
                      }}
                      className="w-full bg-white border border-slate-300 rounded-full px-3.5 py-1.5 text-slate-950 text-[13px] font-medium focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 pr-8"
                    />
                    <button
                      type="button"
                      tabIndex="-1"
                      onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-900 hover:text-black cursor-pointer p-0.5"
                    >
                      <ChevronDown size={14} className={`transition-transform duration-200 ${isClientDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {/* AUTOCOMPLETE SUGGESTIONS POPUP */}
                  {isClientDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-300 rounded-2xl shadow-xl z-50 max-h-48 overflow-y-auto animate-fade-in divide-y divide-slate-100">
                      {/* Filtered Onboarded Clients */}
                      {clients
                        .filter(c => {
                          const query = (clientPartnerInput || '').toLowerCase().trim();
                          if (!query) return true;
                          const name = (c.name || '').toLowerCase();
                          const comp = (c.company || '').toLowerCase();
                          return name.includes(query) || comp.includes(query);
                        })
                        .map(c => (
                          <div
                            key={c.id}
                            onMouseDown={() => {
                              const displayName = c.company || c.name;
                              setClientPartnerInput(displayName);
                              setClientId(c.id);
                              setIsClientDropdownOpen(false);
                            }}
                            className="px-3.5 py-2 hover:bg-orange-50 cursor-pointer flex items-center justify-between text-left transition-colors"
                          >
                            <div>
                              <span className="block text-[13px] font-medium text-slate-950">{c.company || c.name}</span>
                              {c.company && c.name && c.company !== c.name && (
                                <span className="block text-[11px] text-slate-900 font-normal">Contact: {c.name}</span>
                              )}
                            </div>
                            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-900 border border-slate-200 font-medium shrink-0 ml-2">
                              Onboarded
                            </span>
                          </div>
                        ))}

                      {/* If typed something that isn't already in list, allow custom onboard */}
                      {clientPartnerInput.trim() && !clients.some(c => (c.company || c.name || '').toLowerCase() === clientPartnerInput.trim().toLowerCase()) && (
                        <div
                          onMouseDown={() => {
                            setClientId('');
                            setIsClientDropdownOpen(false);
                          }}
                          className="px-3.5 py-2.5 bg-orange-50 hover:bg-orange-100 cursor-pointer flex items-center justify-between transition-colors border-t border-orange-200"
                        >
                          <div>
                            <span className="block text-[12.5px] font-medium text-orange-950">
                              Use custom: <span className="underline decoration-orange-400 font-semibold">{clientPartnerInput.trim()}</span>
                            </span>
                            <span className="block text-[10.5px] text-slate-900 font-normal">Will create a new client partner profile automatically</span>
                          </div>
                          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-600 text-white font-medium shrink-0 ml-2">
                            + Custom
                          </span>
                        </div>
                      )}

                      {clients.length === 0 && !clientPartnerInput.trim() && (
                        <div className="px-3.5 py-3 text-center text-slate-900 text-[12px] font-normal">
                          Type any custom partner name above
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {userRole === 'admin' ? (
                  <div>
                    <label className="block text-[11px] font-medium text-slate-900 mb-1">Project Budget (₹)</label>
                    <input
                      type="number"
                      required
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-full px-3.5 py-1.5 text-slate-950 text-[13px] font-medium focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                      placeholder="e.g. 500000"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-medium text-slate-900 mb-1">Project Budget (₹)</label>
                    <input
                      type="text"
                      disabled
                      value="Managed by Admin"
                      className="w-full bg-slate-100 border border-slate-300 rounded-full px-3.5 py-1.5 text-slate-900 text-[13px] font-medium cursor-not-allowed"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-900 mb-1">Project Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Engineering"
                    value={projectCategory}
                    onChange={(e) => setProjectCategory(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-full px-3.5 py-1.5 text-slate-950 text-[13px] font-medium focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-900 mb-1">Project Department</label>
                  <input
                    type="text"
                    placeholder="e.g. R&D"
                    value={projectDepartment}
                    onChange={(e) => setProjectDepartment(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-full px-3.5 py-1.5 text-slate-950 text-[13px] font-medium focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-900 mb-1">Project Priority</label>
                  <select
                    value={projectPriority}
                    onChange={(e) => setProjectPriority(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-full px-3.5 py-1.5 text-slate-950 text-[13px] font-medium focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-900 mb-1">Project Status</label>
                  <select
                    value={projectStatus}
                    onChange={(e) => setProjectStatus(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-full px-3.5 py-1.5 text-slate-950 text-[12px] font-bold focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="on_hold">On Hold</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-900 mb-1">Brief Description</label>
                <textarea
                  rows="2"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter scope parameters & parameters..."
                  className="w-full bg-white border border-slate-300 rounded-2xl px-3.5 py-2 text-slate-950 text-[13px] font-medium focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-900 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-full px-3.5 py-1.5 text-slate-950 text-[12px] font-medium focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-900 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-full px-3.5 py-1.5 text-slate-950 text-[12px] font-medium focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                {userRole === 'admin' ? (
                  <div>
                    <label className="block text-[11px] font-medium text-slate-850 mb-1">Assign Project Head</label>
                    <select
                      value={projectHeadId}
                      onChange={(e) => setProjectHeadId(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-full px-3.5 py-1.5 text-slate-950 text-[13px] font-medium focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    >
                      <option value="">Select Project Head</option>
                      {projectHeads.map(ph => <option key={ph.id} value={ph.id}>{ph.full_name}</option>)}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-medium text-slate-850 mb-1">Project Head</label>
                    <input
                      type="text"
                      disabled
                      value="Self (Project Head)"
                      className="w-full bg-slate-100 border border-slate-300 rounded-full px-3.5 py-1.5 text-slate-900 text-[13px] font-medium cursor-not-allowed"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetProjectForm}
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-900 rounded-full text-[13px] font-bold border border-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-full text-[13px] font-semibold shadow-md shadow-orange-600/15 cursor-pointer"
                >
                  {editingProject ? 'Save Changes' : 'Save Project'}
                </button>
              </div>
            </form>
          </div>
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
            <div className="bg-white rounded-[20px] shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#3715ca] text-white">
                      <th className="px-4 py-3 text-[12px] font-semibold text-left border border-slate-300 w-16">S.No.</th>
                      <th className="px-4 py-3 text-[12px] font-semibold text-left border border-slate-300">Workspace Name</th>
                      <th className="px-4 py-3 text-[12px] font-semibold text-left border border-slate-300">Client Partner</th>
                      <th className="px-4 py-3 text-[12px] font-semibold text-left border border-slate-300">Start Date</th>
                      <th className="px-4 py-3 text-[12px] font-semibold text-left border border-slate-300">End Date</th>
                      <th className="px-4 py-3 text-[12px] font-semibold text-left border border-slate-300">Project Head</th>
                      <th className="px-4 py-3 text-[12px] font-semibold text-left border border-slate-300">Status</th>
                      <th className="px-4 py-3 text-[12px] font-semibold text-center border border-slate-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {displayedProjects
                      .slice((projectsCurrentPage - 1) * projectsItemsPerPage, projectsCurrentPage * projectsItemsPerPage)
                      .map((proj, idx) => {
                        const serialNum = (projectsCurrentPage - 1) * projectsItemsPerPage + idx + 1;
                        return (
                          <tr key={proj.id} className="hover:bg-slate-50 transition-colors text-slate-950 font-medium">
                            <td className="px-4 py-3.5 text-[13px] font-normal text-slate-900 border border-slate-300">{serialNum}</td>
                            <td className="px-4 py-3.5 text-[14px] font-normal text-slate-950 border border-slate-300">
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
                            <td className="px-4 py-3.5 text-[13px] font-medium text-slate-900 border border-slate-300 whitespace-nowrap">
                              {formatDate(proj.start_date)}
                            </td>
                            <td className="px-4 py-3.5 text-[13px] font-medium text-slate-900 border border-slate-300 whitespace-nowrap">
                              {formatDate(proj.end_date)}
                            </td>
                            <td className="px-4 py-3.5 text-[13px] font-medium text-slate-900 border border-slate-300">
                              {proj.project_head?.full_name || 'Admin'}
                            </td>
                            <td className="px-4 py-3.5 border border-slate-300">
                              {userRole === 'admin' || userRole === 'project_head' ? (
                                <select
                                  value={proj.status || 'planning'}
                                  onChange={(e) => handleUpdateProjectStatus(proj.id, e.target.value)}
                                  className={`text-[11px] uppercase tracking-wider font-medium px-2.5 py-1 rounded-md cursor-pointer outline-none focus:outline-none transition-colors ${
                                    proj.status === 'active'
                                      ? 'bg-blue-100 text-blue-950'
                                      : proj.status === 'completed'
                                      ? 'bg-emerald-100 text-emerald-950'
                                      : proj.status === 'on_hold'
                                      ? 'bg-amber-100 text-amber-950'
                                      : 'bg-orange-100 text-orange-950'
                                  }`}
                                >
                                  <option value="planning">Planning</option>
                                  <option value="active">Active</option>
                                  <option value="on_hold">On Hold</option>
                                  <option value="completed">Completed</option>
                                </select>
                              ) : (
                                <span className={`text-[11px] uppercase tracking-wider font-medium px-2.5 py-0.5 rounded-md border ${
                                  proj.status === 'active'
                                    ? 'bg-blue-100 text-blue-950 border-blue-400'
                                    : proj.status === 'completed'
                                    ? 'bg-emerald-100 text-emerald-950 border-emerald-400'
                                    : proj.status === 'on_hold'
                                    ? 'bg-amber-100 text-amber-950 border-amber-400'
                                    : 'bg-orange-100 text-orange-950 border-orange-400'
                                }`}>
                                  {proj.status || 'planning'}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-center border border-slate-300">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => { setSelectedProject(proj); setViewMode('detail'); }}
                                  className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-[12px] font-medium shadow-md cursor-pointer transition-colors whitespace-nowrap"
                                >
                                  View Workspace
                                </button>
                                {(userRole === 'admin' || userRole === 'project_head') && (
                                  <>
                                    <button
                                      onClick={() => handleEditProjectClick(proj)}
                                      className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-755 border border-blue-300 rounded-lg cursor-pointer transition-colors"
                                      title="Edit Project Workspace"
                                    >
                                      <Edit size={14} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteProjectClick(proj)}
                                      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 rounded-lg cursor-pointer transition-colors"
                                      title="Delete Project Workspace"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    {displayedProjects.length === 0 && (
                      <tr>
                        <td colSpan={8} className="text-center p-8 text-slate-900 font-normal text-[14px]">
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
                  <span className="text-[12px] text-slate-900 font-bold">
                    Showing Page {projectsCurrentPage} of {Math.ceil(displayedProjects.length / projectsItemsPerPage)}
                  </span>
                  <div className="flex gap-2">
                    <button
                      disabled={projectsCurrentPage === 1}
                      onClick={() => setProjectsCurrentPage(projectsCurrentPage - 1)}
                      className="px-3 py-1 bg-white border border-slate-400 rounded text-[12px] font-bold text-slate-900 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                    >
                      Prev
                    </button>
                    <button
                      disabled={projectsCurrentPage >= Math.ceil(displayedProjects.length / projectsItemsPerPage)}
                      onClick={() => setProjectsCurrentPage(projectsCurrentPage + 1)}
                      className="px-3 py-1 bg-white border border-slate-400 rounded text-[12px] font-bold text-slate-900 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
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
            <div className="space-y-4 transition-all animate-fade-in">
              
              {/* TOP INNER PAGE HEADER NAVIGATION */}
              <div className="flex items-center gap-2 bg-white px-3 py-2 border border-slate-300 rounded-xl shadow-xs">
                <button
                  onClick={() => { setViewMode('list'); setSelectedProject(null); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg text-[12px] font-medium text-slate-900 transition-colors cursor-pointer"
                >
                  <ArrowLeft size={13} />
                  <span>Back to Workspaces</span>
                </button>
              </div>

              {/* OVERVIEW CONTENT VIEW */}
              <>
                  {/* KPI ANALYTICS STATS ROW (6 detailed counters) */}
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-2.5">
                    {/* Status Card */}
                    <div className="bg-white border border-slate-300 rounded-xl p-3 flex flex-col justify-between shadow-xs">
                      <div className="text-[11px] text-slate-900 font-medium uppercase tracking-wider">Project Status</div>
                      <div className="mt-1">
                        {userRole === 'admin' || userRole === 'project_head' ? (
                          <select
                            value={selectedProject.status || 'planning'}
                            onChange={(e) => handleUpdateProjectStatus(selectedProject.id, e.target.value)}
                            className={`text-[11px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-md border cursor-pointer focus:outline-none transition-colors w-full ${
                              selectedProject.status === 'active'
                                ? 'bg-blue-100 text-blue-950 border-blue-400'
                                : selectedProject.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-950 border-emerald-400'
                                : selectedProject.status === 'on_hold'
                                ? 'bg-amber-100 text-amber-950 border-amber-400'
                                : 'bg-orange-100 text-orange-950 border-orange-400'
                            }`}
                          >
                            <option value="planning">Planning</option>
                            <option value="active">Active</option>
                            <option value="on_hold">On Hold</option>
                            <option value="completed">Completed</option>
                          </select>
                        ) : (
                          <span className={`text-[11px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-md border inline-block ${
                            selectedProject.status === 'active'
                              ? 'bg-blue-100 text-blue-950 border-blue-400'
                              : selectedProject.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-950 border-emerald-400'
                              : selectedProject.status === 'on_hold'
                              ? 'bg-amber-100 text-amber-950 border-amber-400'
                              : 'bg-orange-100 text-orange-950 border-orange-400'
                          }`}>
                            {selectedProject.status || 'planning'}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Total Tasks Card */}
                    <div className="bg-white border border-slate-300 rounded-xl p-3 flex flex-col justify-between shadow-xs">
                      <div className="text-[11px] text-slate-900 font-medium uppercase tracking-wider">Total Tasks</div>
                      <div className="text-[22px] font-semibold text-slate-950 mt-1">
                        {tasks.filter(t => t.project_id === selectedProject.id).length}
                      </div>
                    </div>
                    {/* Completed Tasks Card */}
                    <div className="bg-white border border-slate-300 rounded-xl p-3 flex flex-col justify-between shadow-xs">
                      <div className="text-[11px] text-slate-900 font-medium uppercase tracking-wider">Completed</div>
                      <div className="text-[22px] font-semibold text-emerald-800 mt-1">
                        {tasks.filter(t => t.project_id === selectedProject.id && t.status === 'completed').length}
                      </div>
                    </div>
                    {/* Ongoing Tasks Card */}
                    <div className="bg-white border border-slate-300 rounded-xl p-3 flex flex-col justify-between shadow-xs">
                      <div className="text-[11px] text-slate-900 font-medium uppercase tracking-wider">Ongoing</div>
                      <div className="text-[22px] font-semibold text-blue-800 mt-1">
                        {tasks.filter(t => t.project_id === selectedProject.id && t.status !== 'completed').length}
                      </div>
                    </div>
                    {/* Delayed Completed Card */}
                    <div className="bg-white border border-slate-300 rounded-xl p-3 flex flex-col justify-between shadow-xs">
                      <div className="text-[11px] text-slate-900 font-medium uppercase tracking-wider">Delayed</div>
                      <div className="text-[22px] font-semibold text-amber-800 mt-1">
                        {tasks.filter(t => t.project_id === selectedProject.id && t.status === 'completed' && new Date(t.end_date) > new Date(selectedProject.end_date)).length}
                      </div>
                    </div>
                    {/* Overdue Card */}
                    <div className="bg-white border border-slate-300 rounded-xl p-3 flex flex-col justify-between shadow-xs">
                      <div className="text-[11px] text-slate-900 font-medium uppercase tracking-wider">Overdue</div>
                      <div className="text-[22px] font-semibold text-red-800 mt-1">
                        {tasks.filter(t => t.project_id === selectedProject.id && t.status !== 'completed' && new Date() > new Date(t.end_date)).length}
                      </div>
                    </div>
                  </div>

                  {/* PROJECT META CARD */}
                  <div className="bg-white border border-slate-300 rounded-2xl p-4 shadow-sm space-y-3">
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-3">
                      {/* Name & Priority badge */}
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h3 className="text-[18px] font-bold text-slate-950">{selectedProject.name}</h3>
                          <span className="text-[10px] uppercase tracking-wider text-orange-950 font-medium bg-orange-100 border border-orange-300 px-2 py-0.5 rounded">
                            {selectedProject.priority || 'Medium'}
                          </span>
                        </div>
                        <p className="text-[12.5px] text-slate-900 font-normal">{selectedProject.description || 'No description workspace parameters specified.'}</p>
                      </div>

                      {/* Initiated By & Project Head details */}
                      <div className="flex flex-wrap gap-2.5 text-[12px]">
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                          <Users size={15} className="text-orange-600" />
                          <div>
                            <span className="text-[10px] text-slate-900 font-medium block uppercase">Initiated By</span>
                            <span className="font-medium text-slate-950 text-[12px]">{selectedProject.client?.name || 'Client Lead'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                          <User size={15} className="text-orange-600" />
                          <div>
                            <span className="text-[10px] text-slate-900 font-medium block uppercase">Team Head</span>
                            <span className="font-medium text-slate-950 text-[12px]">{selectedProject.project_head?.full_name || 'Software Admin'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom detailed parameters section */}
                    <div className="border-t border-slate-200 pt-3 grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                      <div>
                        <span className="font-medium text-slate-900 block text-[10px] uppercase">Starting Date</span>
                        <span className="text-[13px] font-medium text-slate-950">{formatDate(selectedProject.start_date)}</span>
                      </div>
                      <div>
                        <span className="font-medium text-slate-900 block text-[10px] uppercase">Duration Deadline</span>
                        <span className="text-[13px] font-medium text-red-800">{formatDate(selectedProject.end_date)}</span>
                      </div>
                      <div className="flex justify-end gap-2">
                        {(userRole === 'admin' || userRole === 'project_head') && (
                          <button
                            onClick={() => {
                              setEditingTask(null);
                              setTaskTitle('');
                              setTaskDescription('');
                              setAssignedTo('');
                              setTaskStart('');
                              setTaskEnd('');
                              setShowTaskForm(true);
                            }}
                            className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white px-3.5 py-1.5 rounded-xl text-[12px] font-medium cursor-pointer transition-colors shadow-xs"
                          >
                            <Plus size={13} />
                            <span>Add / Edit Task</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* SUB-TABS ACTIONS SELECTORS */}
                  <div className="flex items-center gap-2 border-b border-slate-300 pb-0.5">
                    {['list', 'reports'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setProjectViewTab(tab)}
                        className={`px-4 py-2 text-[13px] font-medium border-b-2 transition-colors cursor-pointer ${projectViewTab === tab ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-900 hover:text-slate-950'}`}
                      >
                        {tab === 'list' ? 'Tasks List' : 'Reports'}
                      </button>
                    ))}
                  </div>

                  {/* ========================================== */}
                  {/* TAB 2: TASKS LIST VIEW WITH CRUD CONTROLS */}
                  {/* ========================================== */}
                  {projectViewTab === 'list' && (
                    <div className="space-y-4">


                      {/* Tasks Listing table */}
                      <div className="bg-white rounded-[20px] shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-[#3715ca] text-white">
                                <th className="px-4 py-2.5 text-[12px] font-semibold text-left border border-slate-300 w-16">S.No.</th>
                                <th className="px-4 py-2.5 text-[12px] font-semibold text-left border border-slate-300">Task Title</th>
                                <th className="px-4 py-2.5 text-[12px] font-semibold text-left border border-slate-300">Assigned Developer</th>
                                <th className="px-4 py-2.5 text-[12px] font-semibold text-left border border-slate-300">Start</th>
                                <th className="px-4 py-2.5 text-[12px] font-semibold text-left border border-slate-300">Deadline</th>
                                <th className="px-4 py-2.5 text-[12px] font-semibold text-left border border-slate-300">Progress</th>
                                <th className="px-4 py-2.5 text-[12px] font-semibold text-left border border-slate-300">Status</th>
                                <th className="px-4 py-2.5 text-[12px] font-semibold text-center border border-slate-300">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-300">
                              {tasks
                                .filter(t => t.project_id === selectedProject.id)
                                .map((task, idx) => (
                                  <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 text-[13px] font-normal text-slate-900 border border-slate-300">{idx + 1}</td>
                                    <td className="px-4 py-3 text-[14px] font-normal text-slate-950 border border-slate-300">
                                      <div>{task.title}</div>
                                      <div className="text-[11px] text-slate-900 font-medium mt-0.5">{task.description}</div>
                                    </td>
                                    <td className="px-4 py-3 text-[13px] font-normal text-slate-900 border border-slate-300">
                                      {task.assigned_user?.full_name || 'Unassigned'}
                                    </td>
                                    <td className="px-4 py-3 text-[12px] font-normal text-slate-900 border border-slate-300">{formatDate(task.start_date)}</td>
                                    <td className="px-4 py-3 text-[12px] font-normal text-slate-900 border border-slate-300">{formatDate(task.end_date)}</td>
                                    <td className="px-4 py-3 border border-slate-300">
                                      <div className="flex items-center gap-2">
                                        <div className="w-16 bg-slate-200 rounded-full h-2 overflow-hidden border border-slate-300">
                                          <div 
                                            className="bg-orange-600 h-full rounded-full transition-all duration-300"
                                            style={{ width: `${task.progress || 0}%` }}
                                          ></div>
                                        </div>
                                        <span className="text-[11px] font-medium text-slate-900">{task.progress || 0}%</span>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 border border-slate-300">
                                      <span className={`text-[10px] font-medium uppercase px-2 py-0.5 rounded ${
                                        task.status === 'completed' 
                                          ? 'bg-emerald-100 text-emerald-950 border border-emerald-400'
                                          : task.status === 'in_progress'
                                          ? 'bg-blue-100 text-blue-950 border border-blue-400'
                                          : 'bg-slate-200 text-slate-950 border border-slate-400'
                                      }`}>
                                        {task.status === 'in_progress' ? 'In Progress' : task.status === 'todo' ? 'To Do' : task.status}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-center border border-slate-300">
                                      <div className="flex items-center justify-center gap-1.5">
                                        {/* Only assigned developer can Put Report */}
                                        {String(task.assigned_to) === String(currentUserId) && (
                                          <button
                                            onClick={() => {
                                              setSelectedTask(task);
                                              setReportContent('');
                                              setHoursSpent('');
                                              const currentProg = task.progress || 0;
                                              setReportProgress(currentProg);
                                              setMinProgress(currentProg);
                                              setReportStatus(task.status || (currentProg === 100 ? 'completed' : currentProg > 0 ? 'in_progress' : 'todo'));
                                              setReportModalTab('form');
                                              setIsReportModalOpen(true);
                                            }}
                                            className="px-2.5 py-1 bg-orange-600 hover:bg-orange-500 text-white rounded-full text-[10.5px] font-medium shadow-sm cursor-pointer transition-colors whitespace-nowrap"
                                            title="Put Progress Report"
                                          >
                                            Put Report
                                          </button>
                                        )}

                                        {/* Higher-ups (admin / project_head) or non-assignees can view report history */}
                                        {String(task.assigned_to) !== String(currentUserId) && (userRole === 'admin' || userRole === 'project_head') && (
                                          <button
                                            onClick={() => {
                                              setSelectedTask(task);
                                              setReportModalTab('history');
                                              setIsReportModalOpen(true);
                                            }}
                                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 rounded-full text-[10.5px] font-semibold cursor-pointer transition-colors whitespace-nowrap"
                                            title="View Task Reports"
                                          >
                                            View Reports
                                          </button>
                                        )}
                                        {(userRole === 'admin' || userRole === 'project_head') && (
                                          <>
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
                                              className="p-1 hover:bg-slate-100 text-blue-700 border border-slate-300 rounded cursor-pointer animate-fade-in-fast"
                                              title="Edit Task"
                                            >
                                              <Edit size={14} />
                                            </button>
                                            <button
                                              onClick={() => handleDeleteTask(task.id)}
                                              className="p-1 hover:bg-red-50 text-red-700 border border-slate-300 rounded cursor-pointer animate-fade-in-fast"
                                              title="Delete Task"
                                            >
                                              <Trash2 size={14} />
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              {tasks.filter(t => t.project_id === selectedProject.id).length === 0 && (
                                  <tr>
                                    <td colSpan={8} className="text-center p-6 text-slate-900 font-normal text-[13px]">
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
                  {/* TAB 3: WORKSPACE DEVELOPER PROGRESS REPORTS */}
                  {/* ========================================== */}
                  {projectViewTab === 'reports' && (
                    <div className="animate-fade-in">
                      {/* Developer Progress Reports logs */}
                      <div className="bg-white rounded-[20px] p-5 shadow-md space-y-4 overflow-hidden border border-slate-300">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                          <div>
                            <h4 className="text-[14px] font-bold text-slate-950 uppercase tracking-wider flex items-center gap-1.5">
                              <ClipboardList size={16} className="text-orange-600" /> Developer Progress Reports
                            </h4>
                            <p className="text-[12px] text-slate-600 font-medium mt-0.5">
                              Audit history of submitted progression notes for {selectedProject?.name}
                            </p>
                          </div>
                          
                          {/* ROBUST EXPORT AS CSV & PDF ACTION BUTTONS */}
                          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                            <button
                              type="button"
                              onClick={() => {
                                const projectReports = reports.filter(r => {
                                  const task = tasks.find(t => t.id === r.task_id);
                                  return task && task.project_id === selectedProject?.id;
                                });
                                const headers = [
                                  { label: 'S.No', key: 'sno' },
                                  { label: 'Developer', key: 'developer' },
                                  { label: 'Task Title', key: 'task_title' },
                                  { label: 'Progress (%)', key: 'progress' },
                                  { label: 'Date Submitted (dd-mm-yyyy)', key: 'date_submitted' },
                                  { label: 'Status', key: 'status' },
                                  { label: 'Remarks / Notes', key: 'remarks' }
                                ];
                                const rows = projectReports.map((r, i) => ({
                                  sno: i + 1,
                                  developer: r.user?.full_name || teamMembers.find(m => m.id === r.submitted_by)?.full_name || 'Developer',
                                  task_title: r.task?.title || tasks.find(t => t.id === r.task_id)?.title || 'Task',
                                  progress: `${r.progress ?? 0}%`,
                                  date_submitted: formatDate(r.created_at),
                                  status: r.status === 'approved' ? 'Approved' : 'Pending Review',
                                  remarks: r.content || ''
                                }));
                                exportToCSV({
                                  filename: `${(selectedProject?.name || 'project').toLowerCase().replace(/\s+/g, '_')}_reports.csv`,
                                  headers,
                                  rows
                                });
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-900 hover:text-slate-950 border border-slate-300 hover:border-slate-400 rounded-xl text-[12px] font-semibold transition-all shadow-xs cursor-pointer active:scale-95"
                              title="Export reports as CSV file"
                            >
                              <FileSpreadsheet size={14} className="text-emerald-600" />
                              <span>Export CSV</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const projectReports = reports.filter(r => {
                                  const task = tasks.find(t => t.id === r.task_id);
                                  return task && task.project_id === selectedProject?.id;
                                });
                                const headers = [
                                  { label: '#', align: 'center' },
                                  { label: 'Developer', align: 'left' },
                                  { label: 'Task Title', align: 'left' },
                                  { label: 'Progress', align: 'center' },
                                  { label: 'Date Submitted', align: 'center' },
                                  { label: 'Status', align: 'center' },
                                  { label: 'Remarks / Content', align: 'left' }
                                ];
                                const rows = projectReports.map((r, i) => [
                                  i + 1,
                                  r.user?.full_name || teamMembers.find(m => m.id === r.submitted_by)?.full_name || 'Developer',
                                  r.task?.title || tasks.find(t => t.id === r.task_id)?.title || 'Task',
                                  `${r.progress ?? 0}%`,
                                  formatDate(r.created_at),
                                  r.status === 'approved' ? 'Approved' : 'Pending Review',
                                  r.content || '--'
                                ]);
                                const approvedCount = projectReports.filter(r => r.status === 'approved').length;
                                exportToPDF({
                                  title: `${selectedProject?.name || 'Workspace'} - Progress Reports`,
                                  subtitle: `Detailed progression log submitted by workforce allocations`,
                                  metadata: [
                                    { label: 'Workspace', value: selectedProject?.name || 'N/A' },
                                    { label: 'Client', value: clients.find(c => c.id === selectedProject?.client_id)?.company_name || 'Internal' },
                                    { label: 'Status', value: selectedProject?.status?.toUpperCase() || 'ACTIVE' }
                                  ],
                                  summaryStats: [
                                    { label: 'Total Reports', value: projectReports.length },
                                    { label: 'Approved Sign-offs', value: approvedCount },
                                    { label: 'Pending Evaluations', value: projectReports.length - approvedCount },
                                    { label: 'Total Tasks', value: tasks.filter(t => t.project_id === selectedProject?.id).length }
                                  ],
                                  headers,
                                  rows
                                });
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-[12px] font-semibold transition-all shadow-sm shadow-orange-600/20 cursor-pointer active:scale-95"
                              title="Generate and print/save formatted PDF"
                            >
                              <FileText size={14} />
                              <span>Export PDF</span>
                            </button>
                          </div>
                        </div>

                        <div className="max-h-96 overflow-y-auto border border-slate-300 rounded-[20px]">
                          <table className="w-full border-separate border-spacing-0">
                            <thead>
                              <tr className="bg-slate-700 text-white text-[11px] uppercase">
                                <th className="px-3 py-2 text-left border-r border-b border-slate-400 rounded-tl-[19px]">S.No</th>
                                <th className="px-3 py-2 text-left border-r border-b border-slate-400">Developer</th>
                                <th className="px-3 py-2 text-left border-r border-b border-slate-400">Task Title</th>
                                <th className="px-3 py-2 text-left border-r border-b border-slate-400">Progress</th>
                                <th className="px-3 py-2 text-left border-r border-b border-slate-400">Date Submitted</th>
                                <th className="px-3 py-2 text-left border-r border-b border-slate-400">Status</th>
                                <th className="px-3 py-2 text-left border-b border-slate-400 rounded-tr-[19px]">Remarks</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-[12px] font-medium">
                              {reports
                                .filter(r => {
                                  const task = tasks.find(t => t.id === r.task_id);
                                  return task && task.project_id === selectedProject.id;
                                })
                                .map((rep, index) => (
                                  <tr key={rep.id} className="hover:bg-slate-50">
                                    <td className="px-3 py-2 font-normal text-slate-900 border-r border-slate-200">{index + 1}</td>
                                    <td className="px-3 py-2 font-normal text-slate-900 border-r border-slate-200">
                                      {rep.user?.full_name || teamMembers.find(m => m.id === rep.submitted_by)?.full_name || 'Developer'}
                                    </td>
                                    <td className="px-3 py-2 text-slate-900 border-r border-slate-200">
                                      {rep.task?.title || tasks.find(t => t.id === rep.task_id)?.title || 'Task'}
                                    </td>
                                    <td className="px-3 py-2 font-normal text-slate-900 border-r border-slate-200">
                                      <span className="bg-orange-50 border border-orange-200 text-orange-800 px-2 py-0.5 rounded-md text-[11px]">
                                        {rep.progress ?? (tasks.find(t => t.id === rep.task_id)?.progress || 0)}%
                                      </span>
                                    </td>
                                    <td className="px-3 py-2 text-slate-900 border-r border-slate-200 font-normal">
                                      {formatDate(rep.created_at)}
                                    </td>
                                    <td className="px-3 py-2 border-r border-slate-200">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium border uppercase ${
                                        rep.status === 'approved' 
                                          ? 'bg-emerald-100 border-emerald-400 text-emerald-950'
                                          : 'bg-amber-100 border-amber-400 text-amber-950'
                                      }`}>
                                        {rep.status === 'approved' ? 'Approved' : 'Pending Review'}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2 text-slate-900" title={rep.content}>
                                      {rep.content}
                                    </td>
                                  </tr>
                                ))}
                              {reports.filter(r => {
                                const task = tasks.find(t => t.id === r.task_id);
                                return task && task.project_id === selectedProject.id;
                              }).length === 0 && (
                                <tr>
                                  <td colSpan={7} className="text-center p-6 text-slate-705 font-normal text-[13px]">
                                    No progress reports submitted yet.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </>


              {/* ADD / EDIT TASK POPUP MODAL */}
              {showTaskForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm animate-fade-in-fast">
                  <div className="w-full max-w-lg bg-white border border-slate-400 rounded-2xl shadow-2xl p-6 relative animate-scale-up text-slate-950">
                    
                    {/* CLOSE BUTTON TOP RIGHT */}
                    <button 
                      onClick={() => { setShowTaskForm(false); setEditingTask(null); }}
                      className="absolute top-4 right-4 z-10 text-slate-900 hover:text-black bg-slate-50 hover:bg-slate-100 p-1.5 rounded-lg border border-slate-300 transition-colors cursor-pointer"
                    >
                      <X size={18} />
                    </button>

                    <div className="mb-4 pr-8">
                      <h3 className="text-[18px] font-bold text-slate-950">
                        {editingTask ? 'Modify Task Details' : 'Add / Edit Task'}
                      </h3>
                      <p className="text-[12px] text-slate-900">Fill in task parameters and developer assignments</p>
                    </div>

                    <form onSubmit={handleCreateTask} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-900 mb-1">Task Title *</label>
                          <input
                            type="text"
                            required
                            value={taskTitle}
                            onChange={(e) => setTaskTitle(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-full px-4 py-1.5 text-slate-950 text-[13px] font-medium focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-900 mb-1">Assign Developer *</label>
                          <select
                            required
                            value={assignedTo}
                            onChange={(e) => setAssignedTo(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-full px-4 py-1.5 text-slate-950 text-[13px] font-bold focus:outline-none"
                          >
                            <option value="">Select Team Member</option>
                            {teamMembers.map(tm => <option key={tm.id} value={tm.id}>{tm.full_name}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-900 mb-1">Details / Description</label>
                        <textarea
                          rows="3"
                          value={taskDescription}
                          onChange={(e) => setTaskDescription(e.target.value)}
                          placeholder="Describe deliverables..."
                          className="w-full bg-white border border-slate-300 rounded-2xl px-4 py-2 text-slate-950 text-[13px] font-medium focus:outline-none"
                        ></textarea>
                      </div>
                      <div className="grid grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-900 mb-1">Start Date</label>
                          <input
                            type="date"
                            required
                            value={taskStart}
                            onChange={(e) => setTaskStart(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-full px-4 py-1.5 text-slate-950 text-[12px] font-medium focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-900 mb-1">End Date</label>
                          <input
                            type="date"
                            required
                            value={taskEnd}
                            onChange={(e) => setTaskEnd(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-full px-4 py-1.5 text-slate-950 text-[12px] font-medium focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => { setShowTaskForm(false); setEditingTask(null); }}
                          className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-900 rounded-full text-[13px] font-bold border border-slate-300 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-full text-[13px] font-semibold shadow-md cursor-pointer"
                        >
                          {editingTask ? 'Save Changes' : 'Add Task'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
      </div>

      {/* EXTEND TASK DEADLINE MODAL */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-400 rounded-2xl p-6 space-y-6 shadow-xl">
            <div>
              <h3 className="text-[18px] font-bold text-slate-950">Request Deadline Change</h3>
              <p className="text-[13px] text-slate-900 font-medium">Provide rationale for extension requests</p>
            </div>
            <form onSubmit={handleRequestDeadline} className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-slate-900 mb-1.5">Current Deadline</label>
                <input
                  type="text"
                  disabled
                  value={selectedTask?.end_date}
                  className="w-full bg-slate-50 border border-slate-400 rounded-xl px-3.5 py-2.5 text-slate-900 text-[16px] font-normal cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-slate-855 mb-1.5">Proposed Extension Date</label>
                <input
                  type="date"
                  required
                  value={requestedEndDate}
                  onChange={(e) => setRequestedEndDate(e.target.value)}
                  className="w-full bg-white border border-slate-400 rounded-xl px-3.5 py-2.5 text-slate-900 text-[16px] font-semibold focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-slate-855 mb-1.5">Reason for Request</label>
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
                  className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-855 rounded-xl text-[14px] font-bold border border-slate-400 cursor-pointer"
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

      {/* SUBMIT PROGRESS REPORT & HISTORY MODAL */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-white border border-slate-400 rounded-2xl p-6 space-y-5 shadow-2xl animate-scale-up text-slate-950">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3.5">
              <div>
                <h3 className="text-[17px] font-bold text-slate-950">
                  {selectedTask ? `Progress Report: ${selectedTask.title}` : 'Submit Task Progress Report'}
                </h3>
                <p className="text-[12px] text-slate-900 font-medium">Log new progression updates or inspect previous report logs</p>
              </div>

              {/* Sub-tabs toggle */}
              <div className="flex bg-slate-100 p-1 rounded-full border border-slate-300 self-start sm:self-auto">
                {String(selectedTask?.assigned_to) === String(currentUserId) && (
                  <button
                    type="button"
                    onClick={() => setReportModalTab('form')}
                    className={`px-3 py-1 text-[11px] font-bold rounded-full transition-all cursor-pointer ${
                      reportModalTab === 'form' 
                        ? 'bg-orange-600 text-white shadow-sm' 
                        : 'text-slate-900 hover:text-slate-950'
                    }`}
                  >
                    Update Report
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setReportModalTab('history')}
                  className={`px-3 py-1 text-[11px] font-bold rounded-full transition-all cursor-pointer ${
                    reportModalTab === 'history' || String(selectedTask?.assigned_to) !== String(currentUserId)
                      ? 'bg-orange-600 text-white shadow-sm' 
                      : 'text-slate-900 hover:text-slate-950'
                  }`}
                >
                  Report History ({reports.filter(r => r.task_id === selectedTask?.id).length})
                </button>
              </div>
            </div>

            {reportModalTab === 'form' && String(selectedTask?.assigned_to) === String(currentUserId) ? (
              <form onSubmit={handlePostReport} className="space-y-4">
                {/* Progress Slider + Numeric Input and Status Dropdown Grid */}
                <div className="space-y-3 bg-slate-50 border border-slate-300 rounded-2xl p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <label className="text-[12px] font-bold text-slate-950">
                      Completion Progress (%)
                    </label>

                    {/* Numeric Input & Badge */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-white border border-slate-300 rounded-xl px-2.5 py-1 focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500 shadow-xs transition-all">
                        <input
                          type="number"
                          min={minProgress}
                          max={100}
                          value={reportProgress}
                          onChange={(e) => {
                            let val = Number(e.target.value);
                            if (isNaN(val)) val = minProgress;
                            if (val > 100) val = 100;
                            if (val < 0) val = 0;
                            setReportProgress(val);
                            if (val === 100) {
                              setReportStatus('completed');
                            } else if (val > 0) {
                              setReportStatus('in_progress');
                            } else {
                              setReportStatus('todo');
                            }
                          }}
                          className="w-10 text-center font-bold text-[14px] text-slate-950 bg-transparent border-0 outline-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="text-[12px] font-bold text-slate-500 select-none pl-0.5">%</span>
                      </div>
                      <span className="bg-orange-100 text-orange-800 border border-orange-300 px-2.5 py-1 rounded-xl text-[11px] font-bold">
                        {reportProgress === 100 ? 'Completed' : `${reportProgress}% Logged`}
                      </span>
                    </div>
                  </div>

                  {/* Dual Control Slider */}
                  <div className="space-y-1.5 pt-1">
                    <input
                      type="range"
                      min={minProgress}
                      max={100}
                      value={reportProgress}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (val < minProgress) return;
                        setReportProgress(val);
                        if (val === 100) {
                          setReportStatus('completed');
                        } else if (val > 0) {
                          setReportStatus('in_progress');
                        } else {
                          setReportStatus('todo');
                        }
                      }}
                      className="w-full h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-orange-600"
                    />
                    <div className="flex justify-between items-center text-[10.5px] text-slate-600 font-medium">
                      <span>Min: {minProgress}%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* Status & Hours Spent Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-900 mb-1">Task Status</label>
                      <select
                        value={reportStatus}
                        onChange={(e) => {
                          const newStatus = e.target.value;
                          setReportStatus(newStatus);
                          if (newStatus === 'completed') {
                            setReportProgress(100);
                          } else if (newStatus === 'in_progress') {
                            if (reportProgress === 100 || reportProgress === 0) {
                              setReportProgress(Math.max(minProgress, 50));
                            }
                          } else if (newStatus === 'todo') {
                            if (minProgress === 0) {
                              setReportProgress(0);
                            }
                          }
                        }}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-950 text-[12.5px] font-semibold focus:outline-none focus:border-orange-500 shadow-xs"
                      >
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-900 mb-1">Hours Worked Today (Optional)</label>
                      <input
                        type="number"
                        min="0"
                        max="24"
                        step="0.5"
                        placeholder="e.g. 6.5"
                        value={hoursSpent}
                        onChange={(e) => setHoursSpent(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-950 text-[12.5px] font-medium focus:outline-none focus:border-orange-500 shadow-xs"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-950 mb-1">New Progress/Report Remarks *</label>
                  <textarea
                    required
                    rows="3"
                    value={reportContent}
                    onChange={(e) => setReportContent(e.target.value)}
                    placeholder="Describe new progress, completed sub-tasks & remarks..."
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-950 text-[13px] font-medium focus:outline-none focus:border-orange-500"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsReportModalOpen(false)}
                    className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-900 rounded-full text-[13px] font-bold border border-slate-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-full text-[13px] font-semibold shadow-md shadow-orange-600/15 cursor-pointer"
                  >
                    Submit Report
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                {reports.filter(r => r.task_id === selectedTask?.id).length > 0 && (
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-300 p-2.5 rounded-xl">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                      Export Task Progress Log
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const taskReps = reports
                            .filter(r => r.task_id === selectedTask?.id)
                            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                          const headers = [
                            { label: 'S.No', key: 'sno' },
                            { label: 'Developer', key: 'developer' },
                            { label: 'Task Title', key: 'task_title' },
                            { label: 'Progress (%)', key: 'progress' },
                            { label: 'Date Submitted (dd-mm-yyyy)', key: 'date' },
                            { label: 'Status', key: 'status' },
                            { label: 'Notes', key: 'notes' }
                          ];
                          const rows = taskReps.map((r, i) => ({
                            sno: i + 1,
                            developer: r.user?.full_name || teamMembers.find(m => m.id === r.submitted_by)?.full_name || 'Developer',
                            task_title: selectedTask?.title || 'Task',
                            progress: `${r.progress ?? 0}%`,
                            date: formatDate(r.created_at),
                            status: r.status === 'approved' ? 'Approved' : 'Pending Review',
                            notes: r.content || ''
                          }));
                          exportToCSV({
                            filename: `${(selectedTask?.title || 'task').toLowerCase().replace(/\s+/g, '_')}_history.csv`,
                            headers,
                            rows
                          });
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 rounded-lg text-[11px] font-semibold flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                      >
                        <FileSpreadsheet size={12} className="text-emerald-600" /> CSV
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const taskReps = reports
                            .filter(r => r.task_id === selectedTask?.id)
                            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                          const headers = [
                            { label: '#', align: 'center' },
                            { label: 'Developer', align: 'left' },
                            { label: 'Task Title', align: 'left' },
                            { label: 'Progress', align: 'center' },
                            { label: 'Submitted Date', align: 'center' },
                            { label: 'Status', align: 'center' },
                            { label: 'Notes / Remarks', align: 'left' }
                          ];
                          const rows = taskReps.map((r, i) => [
                            i + 1,
                            r.user?.full_name || teamMembers.find(m => m.id === r.submitted_by)?.full_name || 'Developer',
                            selectedTask?.title || 'Task',
                            `${r.progress ?? 0}%`,
                            formatDate(r.created_at),
                            r.status === 'approved' ? 'Approved' : 'Pending Review',
                            r.content || '--'
                          ]);
                          exportToPDF({
                            title: `Task Report History: ${selectedTask?.title || ''}`,
                            subtitle: `Progression milestones submitted by developer team`,
                            metadata: [
                              { label: 'Task', value: selectedTask?.title || 'N/A' },
                              { label: 'Current Progress', value: `${selectedTask?.progress || 0}%` },
                              { label: 'Project', value: selectedProject?.name || 'N/A' }
                            ],
                            summaryStats: [
                              { label: 'Total Updates', value: taskReps.length },
                              { label: 'Current Status', value: (selectedTask?.status || 'Active').toUpperCase() }
                            ],
                            headers,
                            rows
                          });
                        }}
                        className="px-2.5 py-1 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                      >
                        <FileText size={12} /> PDF
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {reports
                    .filter(r => r.task_id === selectedTask?.id)
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                    .map((rep, idx) => (
                      <div key={rep.id || idx} className="bg-slate-50 border border-slate-300 rounded-2xl p-4 space-y-2 shadow-sm">
                        <div className="flex justify-between items-center flex-wrap gap-2 text-[12px]">
                          <span className="font-bold text-slate-950">
                            {rep.user?.full_name || teamMembers.find(m => m.id === rep.submitted_by)?.full_name || 'Developer'}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="bg-orange-100 text-orange-850 font-bold px-2.5 py-0.5 rounded-full text-[11px] border border-orange-300">
                              {rep.progress ?? (selectedTask?.progress || 0)}% Progress
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                              rep.status === 'approved' 
                                ? 'bg-emerald-100 border-emerald-400 text-emerald-950'
                                : 'bg-amber-100 border-amber-400 text-amber-950'
                            }`}>
                              {rep.status === 'approved' ? 'Approved / Acknowledged' : 'Pending Review'}
                            </span>
                          </div>
                        </div>
                        <p className="text-[12.5px] text-slate-900 font-medium italic whitespace-pre-wrap leading-relaxed">
                          " {rep.content} "
                        </p>
                        <div className="text-[10px] text-slate-900 font-semibold pt-1 border-t border-slate-200">
                          Submitted: {formatDate(rep.created_at)}
                        </div>
                      </div>
                    ))}

                  {reports.filter(r => r.task_id === selectedTask?.id).length === 0 && (
                    <div className="text-center py-10 text-slate-650 font-semibold text-[13px]">
                      No report history logged for this task yet.
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsReportModalOpen(false)}
                    className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-full text-[13px] font-bold border border-slate-300 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REVIEW EXTENSION REQUESTS MODAL (Project Head only) */}
      {isReviewRequestsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white border border-slate-400 rounded-2xl p-6 space-y-6 shadow-xl">
            <div>
              <h3 className="text-[18px] font-bold text-slate-950">Evaluate Extension Requests</h3>
              <p className="text-[13px] text-slate-900 font-medium">Approve or decline timeline change requests</p>
            </div>
            <div className="max-h-96 overflow-y-auto space-y-3">
              {deadlineRequests.filter(r => r.status === 'pending').map((req) => (
                <div key={req.id} className="p-4 bg-slate-50 rounded-xl border border-slate-400 flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="space-y-1 max-w-md">
                    <span className="text-[12px] font-bold text-slate-900">Task ID: {req.task_id}</span>
                    <h5 className="text-[14px] font-bold text-slate-950">Task: {req.task?.title}</h5>
                    <p className="text-[13px] text-slate-900 font-medium italic">"Reason: {req.reason}"</p>
                    <div className="flex gap-4 text-[12px] text-slate-900 font-semibold pt-1">
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
                <div className="text-center p-8 text-slate-900 text-[14px] font-semibold">No pending extension requests.</div>
              )}
            </div>
            <div className="flex justify-end pt-4">
              <button
                onClick={() => setIsReviewRequestsModalOpen(false)}
                className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-855 rounded-xl text-[14px] font-bold border border-slate-400 cursor-pointer"
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
                <p className="text-[13px] text-slate-900 font-normal mt-1">
                  You are about to delete <strong>{projectToDelete.name}</strong>. This will delete all tasks and reports associated with this workspace permanently.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-[12px] font-medium text-slate-900">
                To confirm, type <span className="font-bold text-red-700">I confirm to delete this project</span> in the input below:
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
    </>
  );
};
