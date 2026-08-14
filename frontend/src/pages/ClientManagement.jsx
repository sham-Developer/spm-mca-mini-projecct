import React, { useEffect, useState } from 'react';
import { 
  UserCheck, 
  Calendar, 
  MessageSquare, 
  Plus, 
  Check, 
  Search, 
  Edit, 
  Trash2, 
  LayoutGrid, 
  Columns, 
  X, 
  Upload, 
  Eye, 
  FileText,
  AlertCircle,
  FilterX,
  Mail,
  Phone,
  Building,
  CheckCircle
} from 'lucide-react';
import API_URL from '../config';
import { useUI } from '../components/UIProvider';

const STATUS_ORDER = ['initiated', 'inprogress', 'budgetary', 'proposal', 'lead', 'onboard'];

const STATUS_THEMES = {
  initiated: {
    bg: 'bg-sky-50 border-sky-300',
    headerBg: 'bg-sky-100 text-sky-950 border-sky-300',
    badge: 'bg-sky-200/80 text-sky-950 border-sky-400'
  },
  inprogress: {
    bg: 'bg-amber-55/60 border-amber-300',
    headerBg: 'bg-amber-100 text-amber-950 border-amber-300',
    badge: 'bg-amber-200/80 text-amber-950 border-amber-400'
  },
  budgetary: {
    bg: 'bg-violet-50 border-violet-300',
    headerBg: 'bg-violet-100 text-violet-955 border-violet-300',
    badge: 'bg-violet-200/80 text-violet-955 border-violet-400'
  },
  proposal: {
    bg: 'bg-rose-50 border-rose-300',
    headerBg: 'bg-rose-100 text-rose-950 border-rose-300',
    badge: 'bg-rose-200/80 text-rose-950 border-rose-400'
  },
  lead: {
    bg: 'bg-teal-50 border-teal-300',
    headerBg: 'bg-teal-100 text-teal-950 border-teal-300',
    badge: 'bg-teal-200/80 text-teal-950 border-teal-400'
  },
  onboard: {
    bg: 'bg-emerald-50 border-emerald-300',
    headerBg: 'bg-emerald-100 text-emerald-950 border-emerald-300',
    badge: 'bg-emerald-200/80 text-emerald-950 border-emerald-400'
  }
};

export default function ClientManagement() {
  const { showToast, confirmAction } = useUI();
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('kanban'); // 'table' or 'kanban'
  
  // Saving states for spinners
  const [isSavingClient, setIsSavingClient] = useState(false);
  const [isSavingFollowup, setIsSavingFollowup] = useState(false);

  // Modals
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isFollowupModalOpen, setIsFollowupModalOpen] = useState(false);
  const [isEditingClient, setIsEditingClient] = useState(false);
  
  // Selection
  const [selectedClient, setSelectedClient] = useState(null);
  
  // Client Form
  const [clientId, setClientId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [newProjectsText, setNewProjectsText] = useState('');
  const [initialStatus, setInitialStatus] = useState('initiated');

  // Follow-up Form
  const [newNote, setNewNote] = useState('');
  const [nextStatus, setNextStatus] = useState('');
  const [nextFollowupDate, setNextFollowupDate] = useState('');
  const [budgetFileName, setBudgetFileName] = useState('');
  const [budgetBase64, setBudgetBase64] = useState('');
  const [proposalFileName, setProposalFileName] = useState('');
  const [proposalBase64, setProposalBase64] = useState('');

  // Drag and Drop files active states
  const [isDragActiveBudget, setIsDragActiveBudget] = useState(false);
  const [isDragActiveProposal, setIsDragActiveProposal] = useState(false);

  // Inline Note Editing
  const [editingNoteIndex, setEditingNoteIndex] = useState(null);
  const [editingNoteText, setEditingNoteText] = useState('');
  const [editingFollowupDate, setEditingFollowupDate] = useState('');
  const [editingFileName, setEditingFileName] = useState('');
  const [editingFileBase64, setEditingFileBase64] = useState('');

  // Search & Date Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Pagination (Table view)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [projectHeads, setProjectHeads] = useState([]);
  const [originalProjects, setOriginalProjects] = useState([]);

  const loadData = async () => {
    try {
      const [clientsRes, projectsRes, usersRes] = await Promise.all([
        fetch(`${API_URL}/clients`),
        fetch(`${API_URL}/projects`),
        fetch(`${API_URL}/users`)
      ]);
      const clientsData = await clientsRes.json();
      const projectsData = await projectsRes.json();
      const usersData = await usersRes.json();
      
      setClients(clientsData);
      setProjects(projectsData);
      setProjectHeads(usersData.filter(u => u.role === 'project_head'));
    } catch (e) {
      console.error('Error fetching client pipeline data:', e);
      showToast('Failed to load database records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Format YYYY-MM-DD -> DD-MM-YYYY
  const formatDateToDMY = (dateStr) => {
    if (!dateStr) return '--';
    try {
      const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
      const parts = cleanDate.split('-');
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return cleanDate;
      }
      return dateStr;
    } catch (e) {
      return dateStr;
    }
  };

  // Helper to handle base64 encoding for uploads
  const processFile = (file, target) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (target === 'budget') {
        setBudgetFileName(file.name);
        setBudgetBase64(reader.result);
      } else if (target === 'proposal') {
        setProposalFileName(file.name);
        setProposalBase64(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e, target) => {
    const file = e.target.files[0];
    if (file) processFile(file, target);
  };

  // HTML5 Drag and Drop File Handlers
  const handleFileDrag = (e, target, active) => {
    e.preventDefault();
    e.stopPropagation();
    if (target === 'budget') {
      setIsDragActiveBudget(active);
    } else {
      setIsDragActiveProposal(active);
    }
  };

  const handleFileDrop = (e, target) => {
    e.preventDefault();
    e.stopPropagation();
    if (target === 'budget') {
      setIsDragActiveBudget(false);
    } else {
      setIsDragActiveProposal(false);
    }
    const file = e.dataTransfer.files[0];
    if (file) processFile(file, target);
  };

  const handleCreateOrUpdateClient = async (e) => {
    e.preventDefault();
    setIsSavingClient(true);
    try {
      let savedClient = null;
      if (isEditingClient) {
        const response = await fetch(`${API_URL}/clients/${clientId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, phone, company })
        });
        if (response.ok) {
          savedClient = await response.json();
          showToast('Client details updated successfully', 'success');
        }

        if (savedClient) {
          const projectNames = newProjectsText.split(',').map(p => p.trim()).filter(Boolean);
          const maxLen = Math.max(originalProjects.length, projectNames.length);
          const defaultHeadId = projectHeads[0]?.id || null;

          for (let i = 0; i < maxLen; i++) {
            const original = originalProjects[i];
            const currentName = projectNames[i];

            if (original && currentName) {
              if (original.name !== currentName) {
                await fetch(`${API_URL}/projects/${original.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name: currentName })
                });
              }
            } else if (!original && currentName) {
              await fetch(`${API_URL}/projects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: currentName,
                  client_id: savedClient.id,
                  description: `Created automatically for client ${savedClient.name}`,
                  start_date: new Date().toISOString().split('T')[0],
                  end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  budget: 0,
                  project_head_id: defaultHeadId
                })
              });
            } else if (original && !currentName) {
              await fetch(`${API_URL}/projects/${original.id}`, {
                method: 'DELETE'
              });
            }
          }
        }
      } else {
        const response = await fetch(`${API_URL}/clients`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, phone, company, status: 'initiated' })
        });
        if (response.ok) {
          savedClient = await response.json();
          showToast('New client lead created', 'success');
        }

        if (savedClient && newProjectsText.trim()) {
          const projectNames = newProjectsText.split(',').map(p => p.trim()).filter(Boolean);
          const defaultHeadId = projectHeads[0]?.id || null;

          for (const projName of projectNames) {
            await fetch(`${API_URL}/projects`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: projName,
                client_id: savedClient.id,
                description: `Created automatically for client ${savedClient.name}`,
                start_date: new Date().toISOString().split('T')[0],
                end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                budget: 0,
                project_head_id: defaultHeadId
              })
            });
          }
          showToast(`Provisioned ${projectNames.length} project workspace(s)`, 'success');
        }
      }

      setIsClientModalOpen(false);
      resetClientForm();
      loadData();
    } catch (err) {
      console.error(err);
      showToast('Error saving client records', 'error');
    } finally {
      setIsSavingClient(false);
    }
  };

  const handleDeleteClient = (id) => {
    confirmAction({
      title: "Delete Client Workspace",
      message: "Are you sure you want to delete this client? All sales pipeline log history and workspaces associated will be permanently removed.",
      onConfirm: async () => {
        try {
          const res = await fetch(`${API_URL}/clients/${id}`, { method: 'DELETE' });
          if (res.ok) {
            showToast('Client profile permanently deleted', 'success');
            loadData();
          } else {
            showToast('Failed to delete client', 'error');
          }
        } catch (e) {
          console.error(e);
          showToast('Error connecting to database', 'error');
        }
      }
    });
  };

  const handleAddFollowup = async (e) => {
    e.preventDefault();
    if (!newNote.trim() && !nextStatus && !nextFollowupDate) return;
    setIsSavingFollowup(true);

    const activeNextStatus = nextStatus || selectedClient.status;

    const newHistoryEntry = {
      date: new Date().toISOString().split('T')[0],
      note: newNote,
      status_from: selectedClient.status,
      status_to: activeNextStatus,
      budget_filename: activeNextStatus === 'budgetary' ? (budgetFileName || null) : null,
      budget_file: activeNextStatus === 'budgetary' ? (budgetBase64 || null) : null,
      proposal_filename: activeNextStatus === 'proposal' ? (proposalFileName || null) : null,
      proposal_file: activeNextStatus === 'proposal' ? (proposalBase64 || null) : null,
      next_followup_date: nextFollowupDate || null
    };

    const updatedNotes = [
      ...(selectedClient.follow_up_notes || []),
      newHistoryEntry
    ];

    try {
      const response = await fetch(`${API_URL}/clients/${selectedClient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          follow_up_notes: updatedNotes, 
          status: activeNextStatus,
          onboarded_at: (activeNextStatus === 'onboard' || activeNextStatus === 'onboarded') ? new Date().toISOString() : selectedClient.onboarded_at,
          next_followup_date: nextFollowupDate || selectedClient.next_followup_date
        })
      });
      if (response.ok) {
        showToast('Interaction entry logged successfully', 'success');
        setIsFollowupModalOpen(false);
        setNewNote('');
        setNextStatus('');
        setNextFollowupDate('');
        setBudgetFileName('');
        setBudgetBase64('');
        setProposalFileName('');
        setProposalBase64('');
        loadData();
      }
    } catch (e) {
      console.error(e);
      showToast('Error saving interaction entry', 'error');
    } finally {
      setIsSavingFollowup(false);
    }
  };

  const handleSaveEditedNote = async (index) => {
    if (!editingNoteText.trim()) return;
    
    const updatedNotes = [...(selectedClient.follow_up_notes || [])];
    const targetEntry = updatedNotes[index];

    const updatedEntry = {
      ...targetEntry,
      note: editingNoteText,
      next_followup_date: editingFollowupDate || null
    };

    if (editingFileBase64) {
      if (targetEntry.status_to === 'budgetary') {
        updatedEntry.budget_filename = editingFileName;
        updatedEntry.budget_file = editingFileBase64;
      } else if (targetEntry.status_to === 'proposal') {
        updatedEntry.proposal_filename = editingFileName;
        updatedEntry.proposal_file = editingFileBase64;
      }
    }

    updatedNotes[index] = updatedEntry;

    const isLatest = index === (selectedClient.follow_up_notes.length - 1);
    const updatePayload = {
      follow_up_notes: updatedNotes
    };
    if (isLatest) {
      updatePayload.next_followup_date = editingFollowupDate || null;
    }

    try {
      const response = await fetch(`${API_URL}/clients/${selectedClient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload)
      });
      if (response.ok) {
        const updatedClient = await response.json();
        setSelectedClient(updatedClient);
        setEditingNoteIndex(null);
        setEditingNoteText('');
        setEditingFollowupDate('');
        setEditingFileName('');
        setEditingFileBase64('');
        showToast('Interaction archive note updated', 'success');
        loadData();
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to update interaction note', 'error');
    }
  };

  const handleDragStart = (e, client) => {
    e.dataTransfer.setData('text/plain', client.id);
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    const client = clients.find(c => c.id === draggedId);
    if (!client) return;

    const currentIndex = STATUS_ORDER.indexOf(client.status);
    const targetIndex = STATUS_ORDER.indexOf(targetStatus);

    if (targetIndex < currentIndex) {
      showToast(`Cannot move client backwards from ${client.status.toUpperCase()} to ${targetStatus.toUpperCase()}`, 'error');
      return;
    }

    if (targetIndex === currentIndex) return;

    setSelectedClient(client);
    setNextStatus(targetStatus);
    setIsFollowupModalOpen(true);
  };

  const resetClientForm = () => {
    setClientId('');
    setName('');
    setEmail('');
    setPhone('');
    setCompany('');
    setNewProjectsText('');
    setOriginalProjects([]);
    setInitialStatus('initiated');
    setIsEditingClient(false);
  };

  const openEditClientModal = (client) => {
    setClientId(client.id);
    setName(client.name);
    setEmail(client.email);
    setPhone(client.phone || '');
    setCompany(client.company || '');
    setInitialStatus(client.status || 'initiated');
    
    const linked = projects.filter(p => p.client_id === client.id);
    setOriginalProjects(linked.map(p => ({ id: p.id, name: p.name })));
    setNewProjectsText(linked.map(p => p.name).join(', '));
    
    setIsEditingClient(true);
    setIsClientModalOpen(true);
  };

  const openBase64File = (base64Data, filename) => {
    const win = window.open();
    if (win) {
      win.document.write(
        `<iframe src="${base64Data}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
      );
      win.document.title = filename || "Uploaded Document";
    } else {
      showToast("Popup blocked! Allow popups to view attachments", "error");
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStartDate('');
    setFilterEndDate('');
    showToast('Filters cleared successfully', 'info');
  };

  // Sorting & Filtering
  const getSortedClients = (clientList) => {
    const todayStr = new Date().toISOString().split('T')[0];
    return [...clientList].sort((a, b) => {
      const isDueA = a.next_followup_date && a.next_followup_date <= todayStr;
      const isDueB = b.next_followup_date && b.next_followup_date <= todayStr;
      if (isDueA && !isDueB) return -1;
      if (!isDueA && isDueB) return 1;
      return 0;
    });
  };

  const filteredClients = clients.filter(client => {
    // Search keyword match
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Get last activity date
    const lastNote = client.follow_up_notes?.length > 0 
      ? client.follow_up_notes[client.follow_up_notes.length - 1] 
      : null;
    const lastActivityDate = lastNote ? lastNote.date : (client.created_at?.split('T')[0] || '');

    // Date range match
    if (filterStartDate && lastActivityDate < filterStartDate) return false;
    if (filterEndDate && lastActivityDate > filterEndDate) return false;

    return true;
  });

  const finalSortedClients = getSortedClients(filteredClients);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentClients = finalSortedClients.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(finalSortedClients.length / itemsPerPage);

  const todayString = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6 animate-fade-in text-slate-900">
      <style>{`
        @keyframes scaleUp {
          from { transform: scale(0.96); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-scale-up {
          animation: scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-fade-in-fast {
          animation: fadeIn 0.15s ease-out forwards;
        }
      `}</style>

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-[20px] font-bold text-orange-600 tracking-tight">Clients & Leads Pipeline</h2>
          <p className="text-[13px] text-slate-800 font-medium">Manage corporate accounts, drag stages, log budgets and track projects</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-400 rounded-xl p-1 flex items-center shadow-sm">
            <button 
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-lg flex items-center gap-1.5 text-[13px] font-medium cursor-pointer transition-colors ${viewMode === 'kanban' ? 'bg-orange-100 text-orange-700 font-bold' : 'text-slate-800 hover:bg-slate-50'}`}
            >
              <Columns size={16} />
              <span>Kanban Board</span>
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg flex items-center gap-1.5 text-[13px] font-medium cursor-pointer transition-colors ${viewMode === 'table' ? 'bg-orange-100 text-orange-700 font-bold' : 'text-slate-800 hover:bg-slate-50'}`}
            >
              <LayoutGrid size={16} />
              <span>Table View</span>
            </button>
          </div>

          <button
            onClick={() => { resetClientForm(); setIsClientModalOpen(true); }}
            className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-4 py-2.5 rounded-xl text-[14px] font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md cursor-pointer"
          >
            <Plus size={16} className="stroke-[2.5]" />
            <span>New Lead</span>
          </button>
        </div>
      </div>

      {/* SEARCH AND FILTERS BAR */}
      <div className="space-y-3 md:space-y-0 md:flex md:items-center md:justify-between gap-4 pb-4">
        
        {/* Left Side: Search Keyword */}
        <div className="flex items-center bg-white border border-slate-400 rounded-xl px-3.5 py-1.5 shadow-inner flex-1 max-w-md">
          <Search size={16} className="text-slate-600 mr-2" />
          <input 
            type="text" 
            placeholder="Search by name, company or email..." 
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full bg-transparent text-[13px] text-slate-950 focus:outline-none placeholder:text-slate-500 font-medium py-1 border-none"
          />
        </div>

        {/* Right Side: Date Range Filters & Clear Button */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-400 rounded-xl px-3 py-1 text-[12px] font-bold text-slate-950">
            <span className="text-slate-800 font-medium">Activity From:</span>
            <input 
              type="date"
              value={filterStartDate}
              onChange={(e) => { setFilterStartDate(e.target.value); setCurrentPage(1); }}
              className="bg-transparent border-none text-[12px] font-bold text-slate-950 focus:outline-none cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2 bg-white border border-slate-400 rounded-xl px-3 py-1 text-[12px] font-bold text-slate-955">
            <span className="text-slate-800 font-medium">To:</span>
            <input 
              type="date"
              value={filterEndDate}
              onChange={(e) => { setFilterEndDate(e.target.value); setCurrentPage(1); }}
              className="bg-transparent border-none text-[12px] font-bold text-slate-955 focus:outline-none cursor-pointer"
            />
          </div>

          {(searchTerm || filterStartDate || filterEndDate) && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-950 border border-slate-400 rounded-xl text-[12px] font-bold transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <FilterX size={14} />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* LOADING */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-500"></div>
        </div>
      ) : (
        <>
          {/* ==================== KANBAN BOARD VIEW ==================== */}
          {viewMode === 'kanban' && (
            <div className="flex gap-4 overflow-x-auto pb-4 items-start w-full min-h-[600px]">
              {STATUS_ORDER.map(status => {
                const columnClients = finalSortedClients.filter(c => c.status === status);
                const theme = STATUS_THEMES[status] || STATUS_THEMES.initiated;
                return (
                  <div 
                    key={status} 
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, status)}
                    className={`border rounded-xl p-4 w-[280px] shrink-0 flex flex-col min-h-[500px] shadow-sm transition-all duration-300 ${theme.bg}`}
                  >
                    {/* Column Header */}
                    <div className={`flex items-center justify-between pb-3 mb-4 border-b border-slate-350 ${theme.headerBg} -mx-4 -mt-4 p-3 rounded-t-xl`}>
                      <span className="text-[12px] font-bold uppercase tracking-wider capitalize">
                        {status === 'inprogress' ? 'In Progress' : status}
                      </span>
                      <span className={`px-2 py-0.5 border rounded-md text-[11px] font-bold ${theme.badge}`}>
                        {columnClients.length}
                      </span>
                    </div>

                    {/* Cards List */}
                    <div className="flex-1 space-y-3">
                      {columnClients.map(client => {
                        const clientProjects = projects.filter(p => p.client_id === client.id);
                        const isActionDue = client.next_followup_date && client.next_followup_date <= todayString;
                        
                        // Calculate last edited date
                        const lastNote = client.follow_up_notes?.length > 0 
                          ? client.follow_up_notes[client.follow_up_notes.length - 1] 
                          : null;
                        const lastEditedRaw = lastNote ? lastNote.date : client.created_at?.split('T')[0];

                        return (
                          <div
                            key={client.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, client)}
                            className={`bg-white border rounded-xl p-4 shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-slate-500 hover:ring-4 hover:ring-orange-500/5 transition-all duration-300 cursor-grab active:cursor-grabbing text-slate-955 ${
                              isActionDue ? 'border-red-500 bg-red-50/50 shadow-red-200/50 shadow-sm' : 'border-slate-400'
                            }`}
                          >
                            <div className="flex justify-between items-start gap-1 mb-1">
                              <h4 className="text-[14px] font-bold text-slate-955 leading-tight">{client.name}</h4>
                              {isActionDue && (
                                <span className="bg-red-650 text-white text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0">
                                  Action Due
                                </span>
                              )}
                            </div>
                            <span className="block text-[12px] font-medium text-slate-800 mb-2">{client.company || 'Private Client'}</span>
                            
                            <div className="space-y-1 text-[11px] text-slate-850 font-medium mb-3">
                              <div className="truncate">{client.email}</div>
                              <div>{client.phone || '--'}</div>
                              <div className="text-[10px] text-slate-700 pt-1 font-semibold">
                                Last Activity: {formatDateToDMY(lastEditedRaw)}
                              </div>
                              {client.next_followup_date && (
                                <div className={`text-[10px] font-bold pt-1 ${isActionDue ? 'text-red-700' : 'text-slate-705'}`}>
                                  Next Followup: {formatDateToDMY(client.next_followup_date)}
                                </div>
                              )}
                              {clientProjects.length > 0 && (
                                <div className="mt-2 text-[10px] text-slate-955 font-medium bg-emerald-50/55 border border-emerald-350 rounded px-1.5 py-0.5 inline-block">
                                  {clientProjects.length} Projects linked
                                </div>
                              )}
                            </div>

                            <div className="flex justify-between items-center gap-1.5 border-t border-slate-305 pt-3">
                              <button 
                                onClick={() => { setSelectedClient(client); setIsFollowupModalOpen(true); }}
                                className="w-full py-1.5 bg-slate-50 border border-slate-400 hover:bg-slate-100 text-slate-955 rounded-lg text-[11px] font-semibold transition-all cursor-pointer flex items-center justify-center gap-1"
                              >
                                <MessageSquare size={12} />
                                <span>Log Action</span>
                              </button>
                              <button 
                                onClick={() => openEditClientModal(client)}
                                className="p-1.5 bg-slate-50 border border-slate-400 hover:bg-slate-100 text-slate-800 rounded-lg cursor-pointer transition-colors"
                                title="Edit Client"
                              >
                                <Edit size={12} />
                              </button>
                              <button 
                                onClick={() => handleDeleteClient(client.id)}
                                className="p-1.5 bg-red-50 border border-red-300 hover:bg-red-100 text-red-700 rounded-lg cursor-pointer transition-colors"
                                title="Delete Client"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      {columnClients.length === 0 && (
                        <div className="border border-dashed border-slate-400 rounded-xl flex items-center justify-center p-4 text-center text-[12px] font-medium text-slate-700 min-h-[100px] bg-slate-50/20">
                          Drag leads here
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ==================== STANDARD TABLE VIEW ==================== */}
          {viewMode === 'table' && (
            <div className="bg-white border border-slate-400 rounded-xl overflow-hidden shadow-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#3715ca] text-white">
                      <th className="border border-slate-300 p-4 text-[12px] font-bold uppercase tracking-wider w-16 text-center">S.No.</th>
                      <th className="border border-slate-300 p-4 text-[12px] font-bold uppercase tracking-wider">Client / Company</th>
                      <th className="border border-slate-300 p-4 text-[12px] font-bold uppercase tracking-wider">Contact</th>
                      <th className="border border-slate-300 p-4 text-[12px] font-bold uppercase tracking-wider">Pipeline Stage</th>
                      <th className="border border-slate-300 p-4 text-[12px] font-bold uppercase tracking-wider">Linked Workspaces</th>
                      <th className="border border-slate-300 p-4 text-[12px] font-bold uppercase tracking-wider">Followup Limits</th>
                      <th className="border border-slate-300 p-4 text-[12px] font-bold uppercase tracking-wider">Last Interaction</th>
                      <th className="border border-slate-300 p-4 text-[12px] font-bold uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 text-slate-950 font-medium">
                    {currentClients.map((client, index) => {
                      const lastNote = client.follow_up_notes?.length > 0 
                        ? client.follow_up_notes[client.follow_up_notes.length - 1] 
                        : null;
                      const clientProjects = projects.filter(p => p.client_id === client.id);
                      const isActionDue = client.next_followup_date && client.next_followup_date <= todayString;

                      // Map status order index to a color index to rotate circle avatars
                      const colorIndex = STATUS_ORDER.indexOf(client.status);
                      const avatarColors = [
                        'bg-orange-150 text-orange-800 border-orange-200',
                        'bg-yellow-150 text-yellow-800 border-yellow-250',
                        'bg-purple-150 text-purple-800 border-purple-200',
                        'bg-pink-150 text-pink-800 border-pink-200',
                        'bg-blue-150 text-blue-800 border-blue-200',
                        'bg-emerald-150 text-emerald-805 border-emerald-250'
                      ];
                      const avatarColorClass = avatarColors[colorIndex >= 0 ? colorIndex : 0];

                      return (
                        <tr 
                          key={client.id} 
                          className={`hover:bg-slate-50/80 transition-colors ${isActionDue ? 'bg-red-50/50 hover:bg-red-100/50' : ''}`}
                        >
                          <td className={`border border-slate-300 p-4 text-[13px] font-bold text-center ${isActionDue ? 'border-l-4 border-l-red-500' : ''}`}>
                            {indexOfFirstItem + index + 1}
                          </td>
                          <td className="border border-slate-300 p-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full border flex items-center justify-center font-bold text-[14px] shrink-0 ${avatarColorClass}`}>
                                <Building size={18} className="stroke-[2.5]" />
                              </div>
                              <div>
                                <span className="block text-[14px] font-extrabold text-slate-950 leading-tight">{client.name}</span>
                                <span className="block text-[12px] text-slate-700 font-medium mt-0.5">{client.company || 'Private Client'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="border border-slate-300 p-4">
                            <div className="space-y-1 text-[13px] font-medium text-slate-900">
                              <div className="flex items-center gap-1.5">
                                <Mail size={13} className="text-slate-700 shrink-0" />
                                <span className="truncate max-w-[160px]" title={client.email}>{client.email}</span>
                              </div>
                              {client.phone && (
                                <div className="flex items-center gap-1.5">
                                  <Phone size={13} className="text-slate-700 shrink-0" />
                                  <span>{client.phone}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="border border-slate-300 p-4 text-center">
                            <span className={`inline-block text-[10px] font-extrabold uppercase px-3 py-1 rounded-full border ${
                              client.status === 'initiated' 
                                ? 'bg-[#f9570c] text-white border-[#c2410c]' 
                                : client.status === 'inprogress'
                                ? 'bg-[#f1b418] text-slate-950 border-[#ca8a04]'
                                : client.status === 'budgetary'
                                ? 'bg-[#f59e0b] text-white border-[#d97706]'
                                : client.status === 'proposal'
                                ? 'bg-[#d946ef] text-white border-[#c026d3]'
                                : client.status === 'lead'
                                ? 'bg-[#2563eb] text-white border-[#1d4ed8]'
                                : 'bg-[#10b981] text-white border-[#059669]'
                            }`}>
                              {client.status === 'inprogress' ? 'In Progress' : client.status}
                            </span>
                          </td>
                          <td className="border border-slate-300 p-4">
                            {clientProjects.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5 max-w-[180px]">
                                {clientProjects.map(proj => (
                                  <span key={proj.id} className="text-[11px] font-extrabold text-blue-755 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded whitespace-nowrap">
                                    {proj.name}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[12px] text-slate-700 font-medium">No projects linked</span>
                            )}
                          </td>
                          <td className="border border-slate-300 p-4">
                            <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-900">
                              <CheckCircle size={15} className="text-emerald-600 shrink-0 stroke-[2.5]" />
                              <span>{client.next_followup_date ? formatDateToDMY(client.next_followup_date) : "No limits set"}</span>
                            </div>
                          </td>
                          <td className="border border-slate-300 p-4 max-w-xs whitespace-normal break-words">
                            <div className="flex items-start gap-1.5 text-[12px] font-medium text-slate-900">
                              {lastNote ? (
                                <>
                                  <Calendar size={14} className="text-slate-700 mt-0.5 shrink-0" />
                                  <div>
                                    <span className="block text-[11px] text-black font-extrabold">{formatDateToDMY(lastNote.date)}</span>
                                    <span className="italic">"{lastNote.note}"</span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <MessageSquare size={14} className="text-slate-700 mt-0.5 shrink-0" />
                                  <span className="text-slate-700">No interaction logged</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="border border-slate-300 p-4 text-right">
                            <div className="flex gap-2 justify-end">
                              <button
                                 onClick={() => { setSelectedClient(client); setIsFollowupModalOpen(true); }}
                                 className="inline-flex items-center justify-center p-1.5 border border-blue-300 hover:bg-blue-50 text-blue-700 rounded-lg cursor-pointer transition-colors"
                                 title="Logs & Action"
                              >
                                <MessageSquare size={13} />
                              </button>
                              <button 
                                onClick={() => openEditClientModal(client)}
                                className="inline-flex items-center justify-center p-1.5 border border-amber-300 hover:bg-amber-50 text-amber-700 rounded-lg cursor-pointer transition-colors"
                                title="Edit Lead"
                              >
                                <Edit size={13} />
                              </button>
                              <button 
                                onClick={() => handleDeleteClient(client.id)}
                                className="inline-flex items-center justify-center p-1.5 border border-red-300 hover:bg-red-50 text-red-700 rounded-lg cursor-pointer transition-colors"
                                title="Delete Lead"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredClients.length === 0 && (
                      <tr>
                        <td colSpan="8" className="border border-slate-300 p-8 text-center text-slate-750 text-[13px] font-bold">No matching client records found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 bg-slate-100 border-t border-slate-400 sm:px-6">
                  <div>
                    <p className="text-xs text-slate-955 font-medium">
                      Showing <span className="font-bold">{indexOfFirstItem + 1}</span> to <span className="font-bold">{Math.min(indexOfLastItem, filteredClients.length)}</span> of <span className="font-bold">{filteredClients.length}</span> results
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 bg-white border border-slate-400 rounded text-xs font-bold text-slate-955 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 bg-white border border-slate-400 rounded text-xs font-bold text-slate-955 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* CREATE & EDIT CLIENT MODAL */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm animate-fade-in-fast">
          <div className="w-full max-w-lg bg-white border border-slate-450 rounded-2xl p-6 space-y-6 shadow-2xl animate-scale-up text-slate-955">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-[17px] font-bold text-orange-600">
                {isEditingClient ? 'Edit Lead/Client Details' : 'Add New Sales Lead'}
              </h3>
              <button onClick={() => setIsClientModalOpen(false)} className="text-slate-700 hover:text-black transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateOrUpdateClient} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-slate-800 mb-1.5">Client Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white border border-slate-355 rounded-full px-4.5 py-2 text-slate-955 text-[14px] font-medium focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-slate-800 mb-1.5">Company Name</label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full bg-white border border-slate-355 rounded-full px-4.5 py-2 text-slate-955 text-[14px] font-medium focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-slate-800 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-slate-355 rounded-full px-4.5 py-2 text-slate-955 text-[14px] font-medium focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-slate-800 mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white border border-slate-355 rounded-full px-4.5 py-2 text-slate-955 text-[14px] font-medium focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-slate-800 mb-1.5">
                  Associate Project Workspace(s) <span className="font-normal text-slate-700">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Website Overhaul, Marketing Campaign"
                  value={newProjectsText}
                  onChange={(e) => setNewProjectsText(e.target.value)}
                  className="w-full bg-white border border-slate-355 rounded-full px-4.5 py-2 text-slate-955 text-[14px] font-medium focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
                <span className="text-[11px] text-slate-700 font-medium mt-1 block">Specify comma-separated project names to auto-provision associated workspaces.</span>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-300">
                <button
                  type="button"
                  onClick={() => { resetClientForm(); setIsClientModalOpen(false); }}
                  className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-900 rounded-xl text-[13px] font-bold border border-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingClient}
                  className="px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-[13px] font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSavingClient && <div className="animate-spin rounded-full h-3.5 w-3.5 border-t-2 border-white"></div>}
                  <span>{isEditingClient ? 'Save Changes' : 'Create Client Lead'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RICH FOLLOW UP AND CONTEXT POPUP */}
      {isFollowupModalOpen && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm animate-fade-in-fast">
          <div className="w-full max-w-4xl bg-white border border-slate-450 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-[80vh] text-slate-955 relative animate-scale-up">
            
            {/* CLOSE BUTTON TOP RIGHT */}
            <button 
              onClick={() => setIsFollowupModalOpen(false)}
              className="absolute top-4 right-4 z-10 text-slate-700 hover:text-black bg-slate-50 hover:bg-slate-100 p-1.5 rounded-lg border border-slate-300 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* LEFT SIDE: CLIENT PROFILE SUMMARY */}
            <div className="md:w-1/3 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-400 p-5 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <span className="block text-[11px] font-bold text-slate-800 uppercase tracking-widest mb-1.5">Pipeline Stage</span>
                  <span className="inline-block text-[10px] font-bold uppercase px-2.5 py-0.5 bg-orange-100 border border-orange-400 text-orange-950 rounded-full font-bold tracking-wide">
                    {selectedClient.status}
                  </span>
                </div>

                <div className="space-y-3 border-t border-slate-300 pt-3">
                  <div>
                    <span className="block text-[11px] font-bold text-black uppercase tracking-widest mb-1">Client Name</span>
                    <input 
                      type="text" 
                      readOnly 
                      value={selectedClient.name} 
                      className="w-full bg-slate-100 border border-slate-300 rounded-full px-3.5 py-1.5 text-slate-950 text-[13px] font-normal focus:outline-none cursor-default"
                    />
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-black uppercase tracking-widest mb-1">Company</span>
                    <input 
                      type="text" 
                      readOnly 
                      value={selectedClient.company || 'Private Lead Client'} 
                      className="w-full bg-slate-100 border border-slate-300 rounded-full px-3.5 py-1.5 text-slate-950 text-[13px] font-normal focus:outline-none cursor-default"
                    />
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-black uppercase tracking-widest mb-1">Email</span>
                    <input 
                      type="text" 
                      readOnly 
                      value={selectedClient.email} 
                      className="w-full bg-slate-100 border border-slate-300 rounded-full px-3.5 py-1.5 text-slate-950 text-[13px] font-normal focus:outline-none cursor-default"
                    />
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-black uppercase tracking-widest mb-1">Phone</span>
                    <input 
                      type="text" 
                      readOnly 
                      value={selectedClient.phone || '--'} 
                      className="w-full bg-slate-100 border border-slate-300 rounded-full px-3.5 py-1.5 text-slate-955 text-[13px] font-normal focus:outline-none cursor-default"
                    />
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-black uppercase tracking-widest mb-1">Linked Workspaces</span>
                    <div className="mt-1.5 space-y-1">
                      {projects.filter(p => p.client_id === selectedClient.id).map(proj => (
                        <div key={proj.id} className="text-[12px] font-bold text-slate-955 bg-white border border-slate-350 rounded px-2.5 py-1">
                          {proj.name}
                        </div>
                      ))}
                      {projects.filter(p => p.client_id === selectedClient.id).length === 0 && (
                        <span className="text-[12px] text-slate-700 italic font-semibold">No workspaces linked yet.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE: ACTIONS AND INTERACTION ARCHIVE */}
            <div className="flex-1 p-6 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-6">
                
                {/* NEW LOG ACTION FORM */}
                <div>
                  <h4 className="text-[15px] font-bold text-slate-955 mb-3.5">Log Discussion & Update Stage</h4>
                  <form onSubmit={handleAddFollowup} className="space-y-3.5 bg-slate-50 border border-slate-400 rounded-xl p-4">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-900 mb-1">Advance Stage To</label>
                        <select
                          value={nextStatus}
                          onChange={(e) => { setNextStatus(e.target.value); setBudgetFileName(''); setBudgetBase64(''); setProposalFileName(''); setProposalBase64(''); }}
                          className="w-full bg-white border border-slate-350 rounded-lg px-2.5 py-2 text-slate-955 text-[13px] font-medium focus:outline-none"
                        >
                          <option value="">Keep current ({selectedClient.status})</option>
                          {STATUS_ORDER.map((stage) => {
                            const currentIdx = STATUS_ORDER.indexOf(selectedClient.status);
                            const stageIdx = STATUS_ORDER.indexOf(stage);
                            const isBackward = stageIdx < currentIdx;
                            return (
                              <option 
                                key={stage} 
                                value={stage} 
                                disabled={isBackward}
                                className="capitalize"
                              >
                                {stage === 'inprogress' ? 'In Progress' : stage} {isBackward ? '(Disabled)' : ''}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-slate-900 mb-1">Next Followup Date</label>
                        <input
                          type="date"
                          value={nextFollowupDate}
                          onChange={(e) => setNextFollowupDate(e.target.value)}
                          className="w-full bg-white border border-slate-350 rounded-lg px-2.5 py-1.5 text-slate-955 text-[13px] font-medium focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Conditional drop upload inputs based on budgetary or proposal stage */}
                    {((nextStatus === 'budgetary') || (!nextStatus && selectedClient.status === 'budgetary')) && (
                      <div className="space-y-1">
                        <label className="block text-[11px] font-medium text-slate-900">Upload Budget Document</label>
                        <div 
                          onDragEnter={(e) => handleFileDrag(e, 'budget', true)}
                          onDragOver={(e) => handleFileDrag(e, 'budget', true)}
                          onDragLeave={(e) => handleFileDrag(e, 'budget', false)}
                          onDrop={(e) => handleFileDrop(e, 'budget')}
                          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                            isDragActiveBudget ? 'border-orange-500 bg-orange-50/50 shadow-md' : 'border-slate-300 bg-white'
                          }`}
                        >
                          <FileText className={`mx-auto mb-1.5 ${isDragActiveBudget ? 'text-orange-500 animate-bounce' : 'text-slate-500'}`} size={24} />
                          <span className="text-[12px] font-medium text-slate-955">
                            {budgetFileName ? `Selected: ${budgetFileName}` : "Drag and drop Budget PDF here or click to browse"}
                          </span>
                          <input 
                            type="file" 
                            onChange={(e) => handleFileChange(e, 'budget')} 
                            className="hidden" 
                            id="budget-file-picker" 
                            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                          />
                          <label htmlFor="budget-file-picker" className="mt-2 px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-[11px] font-bold cursor-pointer inline-block transition-colors">
                            Browse File
                          </label>
                        </div>
                      </div>
                    )}

                    {((nextStatus === 'proposal') || (!nextStatus && selectedClient.status === 'proposal')) && (
                      <div className="space-y-1">
                        <label className="block text-[11px] font-medium text-slate-900">Upload Proposal Document</label>
                        <div 
                          onDragEnter={(e) => handleFileDrag(e, 'proposal', true)}
                          onDragOver={(e) => handleFileDrag(e, 'proposal', true)}
                          onDragLeave={(e) => handleFileDrag(e, 'proposal', false)}
                          onDrop={(e) => handleFileDrop(e, 'proposal')}
                          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                            isDragActiveProposal ? 'border-orange-500 bg-orange-50/50 shadow-md' : 'border-slate-300 bg-white'
                          }`}
                        >
                          <FileText className={`mx-auto mb-1.5 ${isDragActiveProposal ? 'text-orange-500 animate-bounce' : 'text-slate-500'}`} size={24} />
                          <span className="text-[12px] font-medium text-slate-955">
                            {proposalFileName ? `Selected: ${proposalFileName}` : "Drag and drop Proposal PDF here or click to browse"}
                          </span>
                          <input 
                            type="file" 
                            onChange={(e) => handleFileChange(e, 'proposal')} 
                            className="hidden" 
                            id="proposal-file-picker" 
                            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                          />
                          <label htmlFor="proposal-file-picker" className="mt-2 px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-[11px] font-bold cursor-pointer inline-block transition-colors">
                            Browse File
                          </label>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-medium text-slate-900 mb-1">Meeting/Interaction Summary</label>
                      <textarea
                        required
                        rows="2"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Type summary details of follow-up call..."
                        className="w-full bg-white border border-slate-355 rounded-lg px-3 py-2 text-slate-955 text-[13px] font-medium focus:outline-none"
                      ></textarea>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        disabled={isSavingFollowup}
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-[12px] font-bold hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-sm flex items-center gap-2"
                      >
                        {isSavingFollowup && <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-white"></div>}
                        <span>Submit Action Entry</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* ARCHIVED FOLLOWUPS LIST */}
                <div className="space-y-3.5">
                  <h4 className="text-[15px] font-bold text-slate-955 border-b border-slate-300 pb-2 font-bold">Interaction Log & Files History</h4>
                  <div className="flex flex-col-reverse gap-3 max-h-[250px] overflow-y-auto pr-1">
                    {selectedClient.follow_up_notes?.map((entry, index) => {
                      const isEditing = editingNoteIndex === index;

                      return (
                        <div key={index} className="p-3 bg-white border border-slate-300 rounded-xl space-y-2 shadow-sm text-slate-955 hover:border-slate-400 transition-all">
                          <div className="flex items-center justify-between text-[11px] font-medium text-slate-800">
                            <div className="flex items-center gap-1.5">
                              <Calendar size={12} />
                              <span>{formatDateToDMY(entry.date)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {entry.next_followup_date && (
                                <span className="text-[10px] text-red-700 font-bold bg-red-50 border border-red-200 px-1.5 py-0.5 rounded font-bold">
                                  Followup: {formatDateToDMY(entry.next_followup_date)}
                                </span>
                              )}
                              {entry.status_from && entry.status_to && (
                                <span className="bg-slate-100 border border-slate-350 px-1.5 py-0.5 rounded text-[10px] text-slate-950 font-semibold uppercase">
                                  {entry.status_from} → {entry.status_to}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Editable Note Form Block */}
                          {isEditing ? (
                            <div className="space-y-3 p-3 bg-slate-50 border border-slate-300 rounded-xl mt-2 text-slate-955">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-800 uppercase mb-1">Meeting/Interaction Summary</label>
                                <textarea
                                  value={editingNoteText}
                                  onChange={(e) => setEditingNoteText(e.target.value)}
                                  className="w-full bg-white border border-slate-350 rounded-lg p-2 text-[12px] text-slate-955 font-medium focus:outline-none"
                                  rows="2"
                                />
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[11px] font-bold text-black uppercase mb-1">Next Followup Date</label>
                                  <input
                                    type="date"
                                    value={editingFollowupDate}
                                    onChange={(e) => setEditingFollowupDate(e.target.value)}
                                    className="w-full bg-white border border-slate-350 rounded-lg px-2 py-1 text-slate-955 text-[12px] font-medium focus:outline-none"
                                  />
                                </div>

                                {(entry.status_to === 'budgetary' || entry.status_to === 'proposal') && (
                                  <div>
                                    <label className="block text-[11px] font-bold text-black uppercase mb-1">
                                      Replace {entry.status_to === 'budgetary' ? 'Budget' : 'Proposal'} Document
                                    </label>
                                    <div className="flex items-center justify-between bg-white border border-slate-350 rounded-lg px-2 py-1 text-slate-955 text-[12px]">
                                      <span className="truncate max-w-[120px] font-medium">
                                        {editingFileName || 'No file selected'}
                                      </span>
                                      <label className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-900 px-2 py-0.5 rounded cursor-pointer text-[10px] font-bold flex items-center gap-1">
                                        <Upload size={10} />
                                        <span>Browse</span>
                                        <input
                                          type="file"
                                          className="hidden"
                                          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                                          onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                              setEditingFileName(file.name);
                                              const reader = new FileReader();
                                              reader.onloadend = () => {
                                                setEditingFileBase64(reader.result);
                                              };
                                              reader.readAsDataURL(file);
                                            }
                                          }}
                                        />
                                      </label>
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="flex gap-2 justify-end pt-2 border-t border-slate-200">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingNoteIndex(null);
                                    setEditingFileName('');
                                    setEditingFileBase64('');
                                  }}
                                  className="px-2.5 py-1 bg-white border border-slate-300 rounded text-[11px] font-bold text-slate-900 hover:bg-slate-50 cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditedNote(index)}
                                  className="px-2.5 py-1 bg-orange-600 text-white rounded text-[11px] font-bold hover:bg-orange-500 cursor-pointer"
                                >
                                  Save Edit
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between gap-4">
                              <p className="text-[13px] font-medium text-slate-955 italic">"{entry.note}"</p>
                              <button
                                onClick={() => {
                                  setEditingNoteIndex(index);
                                  setEditingNoteText(entry.note);
                                  setEditingFollowupDate(entry.next_followup_date || '');
                                  setEditingFileName(entry.status_to === 'budgetary' ? (entry.budget_filename || '') : (entry.proposal_filename || ''));
                                  setEditingFileBase64('');
                                }}
                                className="text-black hover:text-black hover:underline text-[11px] font-bold shrink-0 cursor-pointer"
                              >
                                Edit Log
                              </button>
                            </div>
                          )}

                          {/* Attachment Budget Link */}
                          {entry.budget_file && (
                            <div className="border-t border-slate-300 pt-2 flex items-center justify-between">
                              <div className="flex items-center gap-1 text-[11px] font-medium text-slate-850">
                                <FileText size={12} className="text-emerald-700" />
                                <span className="truncate max-w-[150px] font-medium">{entry.budget_filename || 'budget.pdf'}</span>
                              </div>
                              <button
                                onClick={() => openBase64File(entry.budget_file, entry.budget_filename)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 rounded border border-emerald-400 text-[11px] font-bold cursor-pointer transition-colors"
                              >
                                <Eye size={12} />
                                <span>View Budget</span>
                              </button>
                            </div>
                          )}

                          {/* Attachment Proposal Link */}
                          {entry.proposal_file && (
                            <div className="border-t border-slate-300 pt-2 flex items-center justify-between">
                              <div className="flex items-center gap-1 text-[11px] font-medium text-slate-850">
                                <FileText size={12} className="text-blue-700" />
                                <span className="truncate max-w-[150px] font-medium">{entry.proposal_filename || 'proposal.pdf'}</span>
                              </div>
                              <button
                                onClick={() => openBase64File(entry.proposal_file, entry.proposal_filename)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-950 rounded border border-blue-400 text-[11px] font-bold cursor-pointer transition-colors"
                              >
                                <Eye size={12} />
                                <span>View Proposal</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {(!selectedClient.follow_up_notes || selectedClient.follow_up_notes.length === 0) && (
                      <div className="p-8 text-center text-slate-700 italic text-[12px] font-medium">No interaction history registered yet.</div>
                    )}
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
