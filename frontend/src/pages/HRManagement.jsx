import React, { useEffect, useState } from 'react';
import { 
  Users, 
  UserPlus, 
  FileText, 
  Upload, 
  Edit, 
  Search, 
  Briefcase,
  Eye,
  Calendar,
  X,
  FilterX,
  Lock,
  Mail,
  Phone,
  User,
  Shield,
  Trash2,
  MapPin,
  Heart
} from 'lucide-react';
import API_URL from '../config';
import { useUI } from '../components/UIProvider';

export default function HRManagement() {
  const { showToast, confirmAction } = useUI();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  
  // Selection / Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Form states
  const [employeeId, setEmployeeId] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [passwordHash, setPasswordHash] = useState('');
  const [role, setRole] = useState('team_member');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [phone, setPhone] = useState('');
  const [joinsDate, setJoinsDate] = useState('');
  const [status, setStatus] = useState('active');
  const [employmentType, setEmploymentType] = useState('on role');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');
  
  // Guard logic states
  const [originalEmpType, setOriginalEmpType] = useState('on role');
  
  // Form Documents list
  const [formDocuments, setFormDocuments] = useState([]);
  const [newDocLabel, setNewDocLabel] = useState('');
  const [newDocBase64, setNewDocBase64] = useState('');
  const [uploadingDocName, setUploadingDocName] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${API_URL}/users`);
      const data = await response.json();
      setEmployees(data);
    } catch (e) {
      console.error(e);
      showToast('Error loading employee directory', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
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

  const resetForm = () => {
    setEmployeeId('');
    setFullName('');
    setEmail('');
    setPasswordHash('');
    setRole('team_member');
    setDepartment('');
    setDesignation('');
    setPhone('');
    setJoinsDate(new Date().toISOString().split('T')[0]);
    setStatus('active');
    setEmploymentType('on role');
    setDob('');
    setGender('male');
    setAddress('');
    setOriginalEmpType('on role');
    setFormDocuments([]);
    setNewDocLabel('');
    setNewDocBase64('');
    setUploadingDocName('');
    setIsEditing(false);
  };

  const openAddModal = () => {
    resetForm();
    setIsFormModalOpen(true);
  };

  const openEditModal = (emp) => {
    setEmployeeId(emp.id);
    setFullName(emp.full_name || '');
    setEmail(emp.email || '');
    setPasswordHash(''); // Blank indicates no change
    setRole(emp.role || 'team_member');
    setDepartment(emp.department || '');
    setDesignation(emp.designation || '');
    setPhone(emp.phone || '');
    setJoinsDate(emp.joins_date ? emp.joins_date.split('T')[0] : new Date().toISOString().split('T')[0]);
    setStatus(emp.status || 'active');
    setEmploymentType(emp.employment_type || 'on role');
    setDob(emp.dob ? emp.dob.split('T')[0] : '');
    setGender(emp.gender || 'male');
    setAddress(emp.address || '');
    setOriginalEmpType(emp.employment_type || 'on role');
    setFormDocuments(emp.documents || []);
    setNewDocLabel('');
    setNewDocBase64('');
    setUploadingDocName('');
    setIsEditing(true);
    setIsFormModalOpen(true);
  };

  const handleCreateOrUpdateEmployee = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      full_name: fullName,
      email,
      role,
      department,
      designation,
      phone,
      joins_date: joinsDate,
      status,
      employment_type: employmentType,
      dob: dob || null,
      gender: gender || 'male',
      address: address || null,
      documents: formDocuments
    };

    if (passwordHash.trim()) {
      payload.password_hash = passwordHash;
    }

    try {
      if (isEditing) {
        const response = await fetch(`${API_URL}/users/${employeeId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (response.ok) {
          showToast('Employee profile updated successfully', 'success');
          setIsFormModalOpen(false);
          resetForm();
          fetchEmployees();
        } else {
          showToast('Failed to update employee profile', 'error');
        }
      } else {
        const response = await fetch(`${API_URL}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (response.ok) {
          showToast('New employee profile created', 'success');
          setIsFormModalOpen(false);
          resetForm();
          fetchEmployees();
        } else {
          showToast('Failed to create employee profile', 'error');
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Error connecting to backend database', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEmployee = (id) => {
    confirmAction({
      title: "Delete Employee Account",
      message: "Are you sure you want to permanently delete this employee account? This action cannot be undone.",
      onConfirm: async () => {
        try {
          const res = await fetch(`${API_URL}/users/${id}`, { method: 'DELETE' });
          if (res.ok) {
            showToast('Employee profile deleted', 'success');
            fetchEmployees();
          } else {
            showToast('Failed to delete employee account', 'error');
          }
        } catch (e) {
          console.error(e);
          showToast('Error contacting backend database', 'error');
        }
      }
    });
  };

  // Local document management inside the form
  const handleUploadNewDoc = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingDocName(file.name);
    if (!newDocLabel.trim()) {
      setNewDocLabel(file.name.split('.')[0].replace(/_/g, ' '));
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setNewDocBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDepositNewDoc = () => {
    if (!newDocBase64) {
      showToast('Please select a file to upload first', 'error');
      return;
    }
    const label = newDocLabel.trim() || uploadingDocName || 'Credential';
    const updatedDocs = [...formDocuments, { name: label, file: newDocBase64 }];
    setFormDocuments(updatedDocs);
    
    // Reset temp upload inputs
    setNewDocLabel('');
    setNewDocBase64('');
    setUploadingDocName('');
    showToast(`Document "${label}" added locally. Click "Save Changes" to persist.`, 'success');
  };

  const handleDeleteFormDoc = (index) => {
    const updated = formDocuments.filter((_, idx) => idx !== index);
    setFormDocuments(updated);
    showToast('Document removed. Click "Save Changes" to persist.', 'info');
  };

  const openBase64File = (base64Data, filename) => {
    const win = window.open();
    if (win) {
      win.document.write(
        `<iframe src="${base64Data}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
      );
      win.document.title = filename || "Credential Document";
    } else {
      showToast("Popup blocked! Allow popups to view attachments", "error");
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStartDate('');
    setFilterEndDate('');
    showToast('Filters cleared', 'info');
  };

  // Filter & Search Logic
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.role?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Date range filters against joins_date
    const joinsDateRaw = emp.joins_date ? emp.joins_date.split('T')[0] : '';
    if (filterStartDate && joinsDateRaw < filterStartDate) return false;
    if (filterEndDate && joinsDateRaw > filterEndDate) return false;

    return true;
  });

  // Calculate total pages and slice current items
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentEmployees = filteredEmployees.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

  // Transition validation guard
  // If original employment type was 'on role', they cannot change back to 'internship'
  const isInternshipDisabled = isEditing && originalEmpType === 'on role';

  return (
    <>
      <div className="space-y-6 animate-fade-in text-slate-900 font-medium">
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
          <h2 className="text-[22px] font-bold text-slate-955 tracking-tight">Personnel & HR Management</h2>
          <p className="text-[13px] text-slate-700 font-semibold">Manage employee profile details, credentials, and document deposits</p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-4 py-2.5 rounded-xl text-[14px] font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md cursor-pointer self-start sm:self-auto"
        >
          <UserPlus size={16} className="stroke-[2.5]" />
          <span>Add Employee</span>
        </button>
      </div>

      {/* HR ANALYTICS STATS ROW (4 detailed counters) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-fast">
        {/* Total Directory Count */}
        <div className="bg-gradient-to-br from-blue-200 to-white border border-indigo-100 rounded-2xl shadow-md py-3 px-5 flex items-start justify-between transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg">
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-widest block">Total Directory</span>
            <h3 className="text-[30px] font-bold text-slate-950 tracking-tight">
              {employees.length}
            </h3>
          </div>
          <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-600/10">
            <Users size={20} className="stroke-[2.5]" />
          </div>
        </div>

        {/* On-Role Staff */}
        <div className="bg-gradient-to-br from-orange-200 to-white border border-orange-100 rounded-2xl shadow-md py-3 px-5 flex items-start justify-between transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg">
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-orange-955 uppercase tracking-widest block">On Role Staff</span>
            <h3 className="text-[30px] font-bold text-slate-950 tracking-tight">
              {employees.filter(e => e.employment_type === 'on role' || e.employment_type === 'on_role' || !e.employment_type).length}
            </h3>
          </div>
          <div className="p-3 bg-orange-600 rounded-xl text-white shadow-md shadow-orange-600/10">
            <Briefcase size={20} className="stroke-[2.5]" />
          </div>
        </div>

        {/* Active Engineers */}
        <div className="bg-gradient-to-br from-emerald-100 to-white border border-emerald-100 rounded-2xl shadow-md py-3 px-5 flex items-start justify-between transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg">
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-emerald-955 uppercase tracking-widest block">Active Engineers</span>
            <h3 className="text-[30px] font-bold text-slate-950 tracking-tight">
              {employees.filter(e => e.role === 'team_member' && e.status === 'active').length}
            </h3>
          </div>
          <div className="p-3 bg-emerald-600 rounded-xl text-white shadow-md shadow-emerald-600/10">
            <UserPlus size={20} className="stroke-[2.5]" />
          </div>
        </div>

        {/* Leadership & Admins */}
        <div className="bg-gradient-to-br from-violet-200 to-white border border-violet-100 rounded-2xl shadow-md py-3 px-5 flex items-start justify-between transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg">
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-violet-900 uppercase tracking-widest block">Admins & Heads</span>
            <h3 className="text-[30px] font-bold text-slate-955 tracking-tight">
              {employees.filter(e => e.role === 'admin' || e.role === 'project_head').length}
            </h3>
          </div>
          <div className="p-3 bg-violet-600 rounded-xl text-white shadow-md shadow-violet-600/10">
            <Shield size={20} className="stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTERS BAR */}
      <div className="rounded-2xl space-y-3 md:space-y-0 md:flex md:items-center md:justify-between gap-4 animate-fade-in-fast">
        
        {/* Left Side: Search Keyword */}
        <div className="flex items-center bg-white border border-slate-400 rounded-xl px-3.5 py-1.5 shadow-inner flex-1 max-w-md">
          <Search size={16} className="text-slate-600 mr-2" />
          <input 
            type="text" 
            placeholder="Search by name, email, designation..." 
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full bg-transparent text-[13px] text-slate-950 focus:outline-none placeholder:text-slate-500 font-medium py-1 border-none"
          />
        </div>

        {/* Right Side: Joining Date Range Filters & Clear Button */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-400 rounded-xl px-3 py-1 text-[12px] font-bold text-slate-950">
            <span className="text-slate-800 font-medium">Joined From:</span>
            <input 
              type="date"
              value={filterStartDate}
              onChange={(e) => { setFilterStartDate(e.target.value); setCurrentPage(1); }}
              className="bg-transparent border-none text-[12px] font-bold text-slate-955 focus:outline-none cursor-pointer"
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
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-955 border border-slate-400 rounded-xl text-[12px] font-bold transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <FilterX size={14} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* TABLE VIEW */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-500"></div>
        </div>
      ) : (
        <div className="bg-white rounded-[20px] overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#3715ca] text-white">
                  <th className="px-4 py-3 text-[12px] font-bold text-center border border-slate-300 w-16">S.No.</th>
                  <th className="px-4 py-3 text-[12px] font-bold text-left border border-slate-300">Employee Name</th>
                  <th className="px-4 py-3 text-[12px] font-bold text-left border border-slate-300">Email ID</th>
                  <th className="px-4 py-3 text-[12px] font-bold text-left border border-slate-300">Designation</th>
                  <th className="px-4 py-3 text-[12px] font-bold text-left border border-slate-300">Date of Joining</th>
                  <th className="px-4 py-3 text-[12px] font-bold text-center border border-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 text-slate-950 font-medium">
                {currentEmployees.map((employee, index) => {
                  const empInitials = employee.full_name ? employee.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'E';
                  return (
                    <tr key={employee.id} className="hover:bg-slate-50 transition-colors text-slate-955">
                      <td className="px-4 py-3.5 text-[13px] font-bold text-slate-900 border border-slate-300 text-center">
                        {indexOfFirstItem + index + 1}
                      </td>
                      <td className="px-4 py-3.5 border border-slate-300">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-700 border border-orange-200 flex items-center justify-center font-bold text-[12px]">
                            {empInitials}
                          </div>
                          <div>
                            <span className="block text-[14px] font-bold text-slate-955 leading-tight">{employee.full_name}</span>
                            <span className="inline-block text-[10px] font-bold uppercase px-2 py-0.5 bg-slate-100 border border-slate-300 rounded mt-1.5 text-slate-800">
                              {employee.employment_type || 'on role'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-[13px] text-slate-900 border border-slate-300">
                        {employee.email}
                      </td>
                      <td className="px-4 py-3.5 text-[13px] text-slate-900 border border-slate-300">
                        {employee.designation || 'Unspecified'}
                      </td>
                      <td className="px-4 py-3.5 text-[13px] text-slate-900 border border-slate-300 whitespace-nowrap">
                        {formatDateToDMY(employee.joins_date)}
                      </td>
                      <td className="px-4 py-3.5 border border-slate-300">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => openEditModal(employee)}
                            className="inline-flex items-center justify-center p-1.5 border border-amber-300 hover:bg-amber-50 text-amber-700 rounded-lg cursor-pointer transition-colors"
                            title="View / Edit Profile"
                          >
                            <Edit size={13} />
                          </button>
                          {employee.email !== 'admin@saas.com' && (
                            <button
                              onClick={() => handleDeleteEmployee(employee.id)}
                              className="inline-flex items-center justify-center p-1.5 border border-red-300 hover:bg-red-50 text-red-700 rounded-lg cursor-pointer transition-colors"
                              title="Delete Employee"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan="6" className="border border-slate-300 p-8 text-center text-slate-700 italic text-[13px] font-medium">No matching employee records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 bg-slate-100 border-t border-slate-400 sm:px-6">
              <div>
                <p className="text-xs text-slate-955 font-medium">
                  Showing <span className="font-bold">{indexOfFirstItem + 1}</span> to <span className="font-bold">{Math.min(indexOfLastItem, filteredEmployees.length)}</span> of <span className="font-bold">{filteredEmployees.length}</span> results
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
      </div>

      {/* COMBINED VIEW / EDIT & DOCUMENT MANAGEMENT MODAL */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm animate-fade-in-fast">
          <div className="w-full max-w-3xl bg-white border border-slate-450 rounded-2xl shadow-2xl flex flex-col h-[90vh] text-slate-955 relative overflow-hidden animate-scale-up">
            
            {/* CLOSE BUTTON TOP RIGHT */}
            <button 
              onClick={() => { setIsFormModalOpen(false); resetForm(); }}
              className="absolute top-4 right-4 z-10 text-slate-700 hover:text-black bg-slate-50 hover:bg-slate-100 p-1.5 rounded-lg border border-slate-300 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <form onSubmit={handleCreateOrUpdateEmployee} className="flex flex-col h-full overflow-hidden">
              {/* SCROLLABLE CONTENT AREA */}
              <div className="flex-1 overflow-y-auto">
                {/* PROFILE & ORGANIZATIONAL DETAILS */}
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-[18px] font-bold text-orange-600">
                      {isEditing ? 'Manage Employee Profile' : 'Add New Organization Employee'}
                    </h3>
                    <p className="text-[12px] text-slate-800">Fill in background profile, role controls and credentials</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-800 mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-white border border-slate-355 rounded-full px-4 py-2 text-slate-955 text-[13px] font-medium focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-800 mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white border border-slate-355 rounded-full px-4 py-2 text-slate-955 text-[13px] font-medium focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-800 mb-1">
                        {isEditing ? 'Change Password (optional)' : 'Password'}
                      </label>
                      <input
                        type="password"
                        required={!isEditing}
                        placeholder={isEditing ? 'Leave blank to keep same' : 'e.g. member123'}
                        value={passwordHash}
                        onChange={(e) => setPasswordHash(e.target.value)}
                        className="w-full bg-white border border-slate-355 rounded-full px-4 py-2 text-slate-955 text-[13px] font-medium focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-800 mb-1">Platform Role</label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full bg-white border border-slate-355 rounded-full px-4 py-2 text-slate-955 text-[13px] font-medium focus:outline-none"
                      >
                        <option value="admin">Admin</option>
                        <option value="project_head">Project Head</option>
                        <option value="team_member">Team Member</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-800 mb-1">Department</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Engineering"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full bg-white border border-slate-355 rounded-full px-4 py-2 text-slate-955 text-[13px] font-medium focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-800 mb-1">Designation</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Developer"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        className="w-full bg-white border border-slate-355 rounded-full px-4 py-2 text-slate-955 text-[13px] font-medium focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-800 mb-1">Phone Number</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-white border border-slate-355 rounded-full px-4 py-2 text-slate-955 text-[13px] font-medium focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-800 mb-1">Date of Birth</label>
                      <input
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="w-full bg-white border border-slate-355 rounded-full px-4 py-1.5 text-slate-955 text-[12px] font-medium focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-800 mb-1">Gender</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full bg-white border border-slate-355 rounded-full px-4 py-2 text-slate-955 text-[13px] font-medium focus:outline-none"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-800 mb-1">Status</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full bg-white border border-slate-355 rounded-full px-4 py-2 text-slate-955 text-[13px] font-medium focus:outline-none"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-800 mb-1">Date of Joining</label>
                      <input
                        type="date"
                        required
                        value={joinsDate}
                        onChange={(e) => setJoinsDate(e.target.value)}
                        className="w-full bg-white border border-slate-355 rounded-full px-4 py-1.5 text-slate-955 text-[12px] font-medium focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-800 mb-1">Employment Type</label>
                      <select
                        value={employmentType}
                        onChange={(e) => setEmploymentType(e.target.value)}
                        className="w-full bg-white border border-slate-355 rounded-full px-4 py-2 text-slate-955 text-[13px] font-medium focus:outline-none"
                      >
                        <option value="internship" disabled={isInternshipDisabled}>Internship {isInternshipDisabled ? '(Disabled - Staff Guard)' : ''}</option>
                        <option value="on role">On Role</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">Residential Address</label>
                    <textarea
                      rows="2"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-white border border-slate-355 rounded-2xl px-4 py-2 text-slate-955 text-[13px] font-medium focus:outline-none"
                    />
                  </div>

                  {/* DOCUMENT DEPOSIT BOX */}
                  <div className="border-t border-slate-300 pt-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-[13px] font-bold text-orange-600 uppercase tracking-wider">Deposited Documents</h4>
                    </div>

                    {/* NEW DOCUMENT INPUT */}
                    <div className="bg-slate-50 border border-slate-300 rounded-2xl p-4 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase">Document Label</label>
                          <input
                            type="text"
                            placeholder="e.g. Pan Card, Offer Letter"
                            value={newDocLabel}
                            onChange={(e) => setNewDocLabel(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-full px-3.5 py-1.5 text-slate-950 text-[12px] font-medium focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase">Deposit File (.pdf, images)</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="file"
                              accept=".pdf,.png,.jpg,.jpeg"
                              id="hr-doc-picker"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  setUploadingDocName(file.name);
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setNewDocBase64(reader.result);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="hidden"
                            />
                            <label htmlFor="hr-doc-picker" className="bg-white border border-slate-300 text-slate-950 hover:bg-slate-50 px-3.5 py-1.5 rounded-full cursor-pointer text-[12px] font-bold shadow-sm inline-flex items-center gap-1.5 transition-colors">
                              <Upload size={14} />
                              <span>{uploadingDocName ? 'Replace File' : 'Choose File'}</span>
                            </label>
                            {uploadingDocName && (
                              <span className="text-[11px] text-slate-700 truncate max-w-[120px] font-semibold" title={uploadingDocName}>
                                {uploadingDocName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddDocument}
                        className="w-full bg-slate-200 hover:bg-slate-300 text-slate-900 border border-slate-300 py-1.5 rounded-full text-[12px] font-bold shadow-sm cursor-pointer transition-colors"
                      >
                        Add to Profile Documents
                      </button>
                    </div>

                    {/* DOCUMENTS LIST */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {formDocuments.map((doc, idx) => (
                        <div key={idx} className="bg-white border border-slate-300 rounded-xl p-3 flex justify-between items-center shadow-sm">
                          <div className="flex items-center gap-2 overflow-hidden mr-2">
                            <FileText size={16} className="text-orange-600 shrink-0" />
                            <div className="overflow-hidden">
                              <span className="block text-[12.5px] font-bold text-slate-955 truncate leading-tight">{doc.label}</span>
                              <span className="block text-[9.5px] text-slate-700 font-semibold truncate mt-0.5">{doc.filename}</span>
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => openBase64File(doc.file_data, doc.filename)}
                              className="p-1.5 bg-slate-50 border border-slate-300 hover:bg-slate-100 rounded text-slate-800 cursor-pointer"
                              title="View Document"
                            >
                              <Eye size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveDocument(idx)}
                              className="p-1.5 bg-red-50 border border-red-300 hover:bg-red-100 rounded text-red-700 cursor-pointer"
                              title="Delete Document"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTION FOOTER */}
              <div className="flex justify-end gap-3 p-4 bg-white border-t border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => { setIsFormModalOpen(false); resetForm(); }}
                  className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-900 rounded-xl text-[13px] font-bold border border-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-[13px] font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {saving && <div className="animate-spin rounded-full h-3.5 w-3.5 border-t-2 border-white"></div>}
                  <span>{isEditing ? 'Save Changes' : 'Create Profile'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
