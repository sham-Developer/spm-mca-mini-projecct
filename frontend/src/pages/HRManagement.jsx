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
  Heart,
  Download,
  ArrowLeft,
  ExternalLink,
  Plus,
  Check,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CalendarDays,
  Timer,
  CheckSquare
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

  // Documents Grid View & Detailed Modal States
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [docsModalEmployee, setDocsModalEmployee] = useState(null);
  const [selectedDetailDoc, setSelectedDetailDoc] = useState(null);
  const [selectedDetailDocIndex, setSelectedDetailDocIndex] = useState(null);
  const [isEditingDoc, setIsEditingDoc] = useState(false);
  const [docEditIndex, setDocEditIndex] = useState(null);
  const [docEditLabel, setDocEditLabel] = useState('');
  const [docEditFileBase64, setDocEditFileBase64] = useState('');
  const [docEditFilename, setDocEditFilename] = useState('');
  const [isAddingDocInModal, setIsAddingDocInModal] = useState(false);
  const [modalNewDocLabel, setModalNewDocLabel] = useState('');
  const [modalNewDocBase64, setModalNewDocBase64] = useState('');
  const [modalNewDocFilename, setModalNewDocFilename] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${API_URL}/users`);
      const data = await response.json();
      const normalizedData = (data || []).map(emp => {
        let docs = [];
        if (Array.isArray(emp.documents)) {
          docs = emp.documents;
        } else if (typeof emp.documents === 'string') {
          try {
            docs = JSON.parse(emp.documents);
            if (typeof docs === 'string') docs = JSON.parse(docs);
          } catch (e) {
            docs = [];
          }
        }
        return {
          ...emp,
          documents: Array.isArray(docs) ? docs : []
        };
      });
      setEmployees(normalizedData);
    } catch (e) {
      console.error(e);
      showToast('Error loading employee directory', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Tabs State: 'directory', 'attendance', 'leaves', 'timesheets'
  const [activeTab, setActiveTab] = useState('directory');

  // Attendance State
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [selectedAttDate, setSelectedAttDate] = useState(new Date().toISOString().split('T')[0]);
  const [attStatusForm, setAttStatusForm] = useState({});
  const [attWorkModeForm, setAttWorkModeForm] = useState({});
  const [attNotesForm, setAttNotesForm] = useState({});
  const [attSavingUserId, setAttSavingUserId] = useState(null);

  // Leaves State
  const [leaveRecords, setLeaveRecords] = useState([]);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveUserId, setLeaveUserId] = useState('');
  const [leaveType, setLeaveType] = useState('casual');
  const [leaveStartDate, setLeaveStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [leaveEndDate, setLeaveEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [leaveDays, setLeaveDays] = useState(1);
  const [leaveReason, setLeaveReason] = useState('');
  const [submittingLeave, setSubmittingLeave] = useState(false);

  // Timesheets Summary State
  const [timesheetSummaries, setTimesheetSummaries] = useState([]);
  const [timesheetLoading, setTimesheetLoading] = useState(false);

  const fetchAttendance = async (date) => {
    try {
      const targetDate = date || selectedAttDate;
      const res = await fetch(`${API_URL}/attendance?date=${targetDate}`);
      if (res.ok) {
        const data = await res.json();
        setAttendanceRecords(data || []);
        
        // Initialize quick form states for each record
        const statusMap = {};
        const modeMap = {};
        const notesMap = {};
        (data || []).forEach(r => {
          statusMap[r.user_id] = r.status;
          modeMap[r.user_id] = r.work_mode || 'office';
          notesMap[r.user_id] = r.notes || '';
        });
        setAttStatusForm(prev => ({ ...statusMap, ...prev }));
        setAttWorkModeForm(prev => ({ ...modeMap, ...prev }));
        setAttNotesForm(prev => ({ ...notesMap, ...prev }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLeaves = async () => {
    try {
      const res = await fetch(`${API_URL}/leaves`);
      if (res.ok) {
        const data = await res.json();
        setLeaveRecords(data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTimesheets = async () => {
    setTimesheetLoading(true);
    try {
      const res = await fetch(`${API_URL}/timesheets/summary`);
      if (res.ok) {
        const data = await res.json();
        setTimesheetSummaries(data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTimesheetLoading(false);
    }
  };

  const handleSaveAttendance = async (userId) => {
    setAttSavingUserId(userId);
    try {
      const payload = {
        user_id: userId,
        date: selectedAttDate,
        status: attStatusForm[userId] || 'present',
        work_mode: attWorkModeForm[userId] || 'office',
        notes: attNotesForm[userId] || '',
        check_in: '09:00 AM',
        check_out: '06:00 PM'
      };
      const res = await fetch(`${API_URL}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showToast('Attendance recorded successfully', 'success');
        fetchAttendance(selectedAttDate);
      } else {
        showToast('Failed to record attendance', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Error saving attendance', 'error');
    } finally {
      setAttSavingUserId(null);
    }
  };

  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    if (!leaveUserId) {
      showToast('Please select an employee', 'error');
      return;
    }
    setSubmittingLeave(true);
    try {
      const res = await fetch(`${API_URL}/leaves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: leaveUserId,
          leave_type: leaveType,
          start_date: leaveStartDate,
          end_date: leaveEndDate,
          days: Number(leaveDays || 1),
          reason: leaveReason
        })
      });
      if (res.ok) {
        showToast('Leave request submitted successfully', 'success');
        setIsLeaveModalOpen(false);
        setLeaveReason('');
        fetchLeaves();
      } else {
        showToast('Failed to submit leave request', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Error submitting leave request', 'error');
    } finally {
      setSubmittingLeave(false);
    }
  };

  const handleUpdateLeaveStatus = async (leaveId, status) => {
    confirmAction(
      `${status === 'approved' ? 'Approve' : 'Reject'} Leave Request`,
      `Are you sure you want to mark this leave application as ${status}?`,
      async () => {
        try {
          const res = await fetch(`${API_URL}/leaves/${leaveId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
          });
          if (res.ok) {
            showToast(`Leave application marked as ${status}`, 'success');
            fetchLeaves();
          } else {
            showToast('Failed to update leave status', 'error');
          }
        } catch (e) {
          console.error(e);
          showToast('Error updating leave', 'error');
        }
      }
    );
  };

  useEffect(() => {
    fetchEmployees();
    fetchAttendance();
    fetchLeaves();
    fetchTimesheets();
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
    let docs = [];
    if (Array.isArray(emp.documents)) {
      docs = emp.documents;
    } else if (typeof emp.documents === 'string') {
      try {
        docs = JSON.parse(emp.documents);
        if (typeof docs === 'string') docs = JSON.parse(docs);
      } catch (e) {
        docs = [];
      }
    }
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
    setFormDocuments(Array.isArray(docs) ? docs : []);
    setNewDocLabel('');
    setNewDocBase64('');
    setUploadingDocName('');
    setIsEditing(true);
    setIsFormModalOpen(true);
  };

  const handleCreateOrUpdateEmployee = async (e) => {
    e.preventDefault();
    setSaving(true);

    // Auto-commit any currently selected document file if user didn't click "Add to Profile Documents"
    let finalDocuments = [...formDocuments];
    if (newDocBase64) {
      const label = newDocLabel.trim() || uploadingDocName || 'Document';
      finalDocuments.push({
        name: label,
        filename: uploadingDocName || label,
        file: newDocBase64
      });
    }

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
      documents: finalDocuments
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
    const label = newDocLabel.trim() || uploadingDocName || 'Document';
    const updatedDocs = [
      ...formDocuments, 
      { 
        name: label, 
        filename: uploadingDocName || label,
        file: newDocBase64 
      }
    ];
    setFormDocuments(updatedDocs);
    
    // Reset temp upload inputs
    setNewDocLabel('');
    setNewDocBase64('');
    setUploadingDocName('');
    showToast(`Document "${label}" added to profile documents list.`, 'success');
  };

  const handleDeleteFormDoc = (index) => {
    const updated = formDocuments.filter((_, idx) => idx !== index);
    setFormDocuments(updated);
    showToast('Document removed from list.', 'info');
  };

  const openBase64File = (base64Data, filename) => {
    try {
      if (!base64Data) {
        showToast('No document data available to preview', 'error');
        return;
      }
      
      if (base64Data.startsWith('data:')) {
        const arr = base64Data.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        const win = window.open(blobUrl, '_blank');
        if (!win) {
          // If popup is blocked by browser, trigger download directly
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = filename || 'document';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      } else {
        window.open(base64Data, '_blank');
      }
    } catch (e) {
      console.error('Error opening document:', e);
      showToast('Could not open document preview', 'error');
    }
  };

  const downloadFile = (base64Data, filename) => {
    try {
      if (!base64Data) {
        showToast('No file data available to download', 'error');
        return;
      }
      if (base64Data.startsWith('data:')) {
        const arr = base64Data.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename || 'document';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      } else {
        const a = document.createElement('a');
        a.href = base64Data;
        a.download = filename || 'document';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      showToast('Download started', 'success');
    } catch (e) {
      console.error(e);
      showToast('Failed to download document', 'error');
    }
  };

  // Dedicated Documents Modal & Management Handlers
  const openDocsModal = (emp) => {
    setDocsModalEmployee(emp);
    setIsDocsModalOpen(true);
    setSelectedDetailDoc(null);
    setSelectedDetailDocIndex(null);
    setIsEditingDoc(false);
    setIsAddingDocInModal(false);
  };

  const closeDocsModal = () => {
    setIsDocsModalOpen(false);
    setDocsModalEmployee(null);
    setSelectedDetailDoc(null);
    setSelectedDetailDocIndex(null);
    setIsEditingDoc(false);
    setIsAddingDocInModal(false);
  };

  const openDetailDoc = (doc, index) => {
    setSelectedDetailDoc(doc);
    setSelectedDetailDocIndex(index);
  };

  const saveEmployeeDocs = async (empId, updatedDocs) => {
    const targetEmp = employees.find(e => e.id === empId) || docsModalEmployee;
    if (!targetEmp) return false;

    const payload = {
      full_name: targetEmp.full_name,
      email: targetEmp.email,
      role: targetEmp.role,
      department: targetEmp.department,
      designation: targetEmp.designation,
      phone: targetEmp.phone,
      joins_date: targetEmp.joins_date ? targetEmp.joins_date.split('T')[0] : undefined,
      status: targetEmp.status,
      employment_type: targetEmp.employment_type,
      dob: targetEmp.dob ? targetEmp.dob.split('T')[0] : null,
      gender: targetEmp.gender,
      address: targetEmp.address,
      documents: updatedDocs
    };

    try {
      const res = await fetch(`${API_URL}/users/${empId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setEmployees(prev => prev.map(e => e.id === empId ? { ...e, documents: updatedDocs } : e));
        setDocsModalEmployee(prev => prev ? { ...prev, documents: updatedDocs } : null);
        return true;
      } else {
        showToast('Failed to save document changes', 'error');
        return false;
      }
    } catch (err) {
      console.error(err);
      showToast('Error saving document changes', 'error');
      return false;
    }
  };

  const handleDeleteDoc = (index) => {
    if (!docsModalEmployee || !docsModalEmployee.documents || !docsModalEmployee.documents[index]) return;
    const docToDelete = docsModalEmployee.documents[index];
    const docName = docToDelete?.name || docToDelete?.filename || 'Document';

    confirmAction({
      title: "Delete Document",
      message: `Are you sure you want to permanently delete "${docName}"? This action cannot be undone.`,
      onConfirm: async () => {
        const updatedDocs = docsModalEmployee.documents.filter((_, i) => i !== index);
        const ok = await saveEmployeeDocs(docsModalEmployee.id, updatedDocs);
        if (ok) {
          showToast(`Document "${docName}" deleted successfully`, 'success');
          if (selectedDetailDocIndex === index) {
            setSelectedDetailDoc(null);
            setSelectedDetailDocIndex(null);
          } else if (selectedDetailDocIndex !== null && selectedDetailDocIndex > index) {
            setSelectedDetailDocIndex(prev => prev - 1);
          }
        }
      }
    });
  };

  const startEditDoc = (index) => {
    if (!docsModalEmployee || !docsModalEmployee.documents || !docsModalEmployee.documents[index]) return;
    const doc = docsModalEmployee.documents[index];
    setDocEditIndex(index);
    setDocEditLabel(doc.name || doc.label || '');
    setDocEditFileBase64('');
    setDocEditFilename('');
    setIsEditingDoc(true);
  };

  const handleSaveEditedDoc = async (e) => {
    e?.preventDefault();
    if (!docsModalEmployee || docEditIndex === null) return;
    if (!docEditLabel.trim()) {
      showToast('Please enter a document label', 'error');
      return;
    }

    const existingDoc = docsModalEmployee.documents[docEditIndex];
    const updatedDoc = {
      ...existingDoc,
      name: docEditLabel.trim(),
      filename: docEditFilename || existingDoc.filename || docEditLabel.trim(),
      file: docEditFileBase64 || existingDoc.file || existingDoc.file_data
    };

    const updatedDocs = [...docsModalEmployee.documents];
    updatedDocs[docEditIndex] = updatedDoc;

    const ok = await saveEmployeeDocs(docsModalEmployee.id, updatedDocs);
    if (ok) {
      showToast('Document updated successfully', 'success');
      if (selectedDetailDocIndex === docEditIndex) {
        setSelectedDetailDoc(updatedDoc);
      }
      setIsEditingDoc(false);
      setDocEditIndex(null);
      setDocEditLabel('');
      setDocEditFileBase64('');
      setDocEditFilename('');
    }
  };

  const handleModalAddNewDoc = async (e) => {
    e?.preventDefault();
    if (!docsModalEmployee) return;
    if (!modalNewDocBase64) {
      showToast('Please select a file to upload first', 'error');
      return;
    }
    const label = modalNewDocLabel.trim() || modalNewDocFilename || 'Document';
    const newDoc = {
      name: label,
      filename: modalNewDocFilename || label,
      file: modalNewDocBase64
    };
    const updatedDocs = [...(docsModalEmployee.documents || []), newDoc];
    const ok = await saveEmployeeDocs(docsModalEmployee.id, updatedDocs);
    if (ok) {
      showToast(`Document "${label}" added successfully`, 'success');
      setIsAddingDocInModal(false);
      setModalNewDocLabel('');
      setModalNewDocBase64('');
      setModalNewDocFilename('');
    }
  };

  const handleModalDocFileChange = (e, isEdit = false) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (isEdit) {
        setDocEditFileBase64(reader.result);
        setDocEditFilename(file.name);
        if (!docEditLabel.trim()) {
          setDocEditLabel(file.name.split('.')[0].replace(/_/g, ' '));
        }
      } else {
        setModalNewDocBase64(reader.result);
        setModalNewDocFilename(file.name);
        if (!modalNewDocLabel.trim()) {
          setModalNewDocLabel(file.name.split('.')[0].replace(/_/g, ' '));
        }
      }
    };
    reader.readAsDataURL(file);
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
          <h2 className="text-[22px] font-bold text-slate-950 tracking-tight">Personnel & HR Management</h2>
          <p className="text-[13px] text-slate-900 font-normal">Manage employee profile details, credentials, and document deposits</p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'leaves' && (
            <button
              onClick={() => setIsLeaveModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md cursor-pointer"
            >
              <Plus size={16} />
              <span>Apply Leave</span>
            </button>
          )}
          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-4 py-2.5 rounded-xl text-[14px] font-medium transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md cursor-pointer self-start sm:self-auto"
          >
            <UserPlus size={16} className="stroke-[2.5]" />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* TOP HR WORKSPACE TABS */}
      <div className="flex items-center gap-2 border-b border-slate-300 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('directory')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'directory'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-900 hover:bg-slate-100 border border-slate-300'
          }`}
        >
          <Users size={16} />
          <span>Employee Directory</span>
          <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${activeTab === 'directory' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-900'}`}>
            {employees.length}
          </span>
        </button>

        <button
          onClick={() => { setActiveTab('attendance'); fetchAttendance(selectedAttDate); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'attendance'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-900 hover:bg-slate-100 border border-slate-300'
          }`}
        >
          <CalendarDays size={16} />
          <span>Attendance Tracker</span>
        </button>

        <button
          onClick={() => { setActiveTab('leaves'); fetchLeaves(); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'leaves'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-900 hover:bg-slate-100 border border-slate-300'
          }`}
        >
          <Clock size={16} />
          <span>Leave Management</span>
          {leaveRecords.filter(l => l.status === 'pending').length > 0 && (
            <span className="bg-orange-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {leaveRecords.filter(l => l.status === 'pending').length}
            </span>
          )}
        </button>

        <button
          onClick={() => { setActiveTab('timesheets'); fetchTimesheets(); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'timesheets'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-900 hover:bg-slate-100 border border-slate-300'
          }`}
        >
          <Timer size={16} />
          <span>Weekly Timesheets</span>
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
            <span className="text-[11px] font-bold text-orange-950 uppercase tracking-widest block">On Role Staff</span>
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
            <span className="text-[11px] font-bold text-emerald-950 uppercase tracking-widest block">Active Engineers</span>
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
            <h3 className="text-[30px] font-bold text-slate-950 tracking-tight">
              {employees.filter(e => e.role === 'admin' || e.role === 'project_head').length}
            </h3>
          </div>
          <div className="p-3 bg-violet-600 rounded-xl text-white shadow-md shadow-violet-600/10">
            <Shield size={20} className="stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* EMPLOYEE DIRECTORY TAB */}
      {activeTab === 'directory' && (
      <>
      {/* SEARCH AND FILTERS BAR */}
      <div className="rounded-2xl space-y-3 md:space-y-0 md:flex md:items-center md:justify-between gap-4 animate-fade-in-fast">
        
        {/* Left Side: Search Keyword */}
        <div className="flex items-center bg-white border border-slate-400 rounded-xl px-3.5 py-1.5 shadow-inner flex-1 max-w-md">
          <Search size={16} className="text-slate-900 mr-2" />
          <input 
            type="text" 
            placeholder="Search by name, email, designation..." 
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full bg-transparent text-[13px] text-slate-950 focus:outline-none placeholder:text-slate-900 font-medium py-1 border-none"
          />
        </div>

        {/* Right Side: Joining Date Range Filters & Clear Button */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-400 rounded-xl px-3 py-1 text-[12px] font-bold text-slate-950">
            <span className="text-slate-900 font-medium">Joined From:</span>
            <input 
              type="date"
              value={filterStartDate}
              onChange={(e) => { setFilterStartDate(e.target.value); setCurrentPage(1); }}
              className="bg-transparent border-none text-[12px] font-bold text-slate-950 focus:outline-none cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2 bg-white border border-slate-400 rounded-xl px-3 py-1 text-[12px] font-bold text-slate-950">
            <span className="text-slate-900 font-medium">To:</span>
            <input 
              type="date"
              value={filterEndDate}
              onChange={(e) => { setFilterEndDate(e.target.value); setCurrentPage(1); }}
              className="bg-transparent border-none text-[12px] font-bold text-slate-950 focus:outline-none cursor-pointer"
            />
          </div>

          {(searchTerm || filterStartDate || filterEndDate) && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-950 border border-slate-400 rounded-xl text-[12px] font-bold transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
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
                  <th className="px-4 py-3.5 text-[13px] font-semibold text-center border border-slate-300 w-16">S.No.</th>
                  <th className="px-4 py-3.5 text-[13px] font-semibold text-left border border-slate-300 min-w-[190px]">Employee Name</th>
                  <th className="px-4 py-3.5 text-[13px] font-semibold text-left border border-slate-300 min-w-[180px]">Email ID</th>
                  <th className="px-4 py-3.5 text-[13px] font-semibold text-left border border-slate-300 min-w-[150px]">Designation</th>
                  <th className="px-4 py-3.5 text-[13px] font-semibold text-left border border-slate-300 whitespace-nowrap min-w-[130px]">Date of Joining</th>
                  <th className="px-4 py-3.5 text-[13px] font-semibold text-center border border-slate-300 min-w-[170px]">Documents</th>
                  <th className="px-4 py-3.5 text-[13px] font-semibold text-center border border-slate-300 w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 text-slate-950 font-medium">
                {currentEmployees.map((employee, index) => {
                  const empInitials = employee.full_name ? employee.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'E';
                  return (
                    <tr key={employee.id} className="hover:bg-slate-50 transition-colors text-slate-950">
                      <td className="px-4 py-3.5 text-[13px] font-normal text-slate-900 border border-slate-300 text-center">
                        {indexOfFirstItem + index + 1}
                      </td>
                      <td className="px-4 py-3.5 border border-slate-300">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-700 border border-orange-200 flex items-center justify-center font-medium text-[12px]">
                            {empInitials}
                          </div>
                          <div>
                            <span className="block text-[14px] font-medium text-slate-950 leading-tight">{employee.full_name}</span>
                            <span className="inline-block text-[10px] font-medium uppercase px-2 py-0.5 bg-slate-100 border border-slate-300 rounded mt-1.5 text-slate-900">
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
                      <td className="px-4 py-3.5 border border-slate-300 text-center">
                        {employee.documents && employee.documents.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => openDocsModal(employee)}
                            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 hover:text-orange-900 border border-orange-300 rounded-lg text-[12px] font-medium shadow-xs transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                            title={`View ${employee.documents.length} document(s)`}
                          >
                            <FileText size={14} className="text-orange-600" />
                            <span>View Documents</span>
                            <span className="px-1.5 py-0.2 bg-orange-200/90 text-orange-950 rounded-full text-[10px] font-medium">
                              {employee.documents.length}
                            </span>
                          </button>
                        ) : (
                          <div className="flex justify-center">
                            <span className="inline-flex items-center gap-1.5 text-slate-900 text-[12px] font-medium px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200/80">
                              <FileText size={13} className="text-slate-900" />
                              No documents
                            </span>
                          </div>
                        )}
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
                    <td colSpan="7" className="border border-slate-300 p-8 text-center text-slate-900 italic text-[13px] font-medium">No matching employee records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 bg-slate-100 border-t border-slate-400 sm:px-6">
              <div>
                <p className="text-xs text-slate-950 font-medium">
                  Showing <span className="font-bold">{indexOfFirstItem + 1}</span> to <span className="font-bold">{Math.min(indexOfLastItem, filteredEmployees.length)}</span> of <span className="font-bold">{filteredEmployees.length}</span> results
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 bg-white border border-slate-400 rounded text-xs font-bold text-slate-950 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                >
                  Prev
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 bg-white border border-slate-400 rounded text-xs font-bold text-slate-950 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
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

      {/* 2. ATTENDANCE TRACKER TAB */}
      {activeTab === 'attendance' && (
        <div className="space-y-4 animate-fade-in-fast">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-300 rounded-2xl p-4 shadow-sm">
            <div>
              <h3 className="text-[17px] font-bold text-slate-950">Daily Attendance Log</h3>
              <p className="text-[12px] text-slate-900 font-normal">Monitor check-in status, work location, and operational remarks</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-medium text-slate-900">Select Date:</span>
              <input
                type="date"
                value={selectedAttDate}
                onChange={(e) => {
                  setSelectedAttDate(e.target.value);
                  fetchAttendance(e.target.value);
                }}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-[13px] font-medium text-slate-950 focus:outline-none"
              />
            </div>
          </div>

          <div className="bg-white rounded-[20px] overflow-hidden shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#3715ca] text-white">
                    <th className="px-4 py-3.5 text-[13px] font-semibold text-center border border-slate-300 w-16">S.No.</th>
                    <th className="px-4 py-3.5 text-[13px] font-semibold border border-slate-300 min-w-[200px]">Employee</th>
                    <th className="px-4 py-3.5 text-[13px] font-semibold border border-slate-300 w-40">Status</th>
                    <th className="px-4 py-3.5 text-[13px] font-semibold border border-slate-300 w-36">Work Mode</th>
                    <th className="px-4 py-3.5 text-[13px] font-semibold border border-slate-300 min-w-[200px]">Notes</th>
                    <th className="px-4 py-3.5 text-[13px] font-semibold text-center border border-slate-300 w-28">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp, idx) => {
                    const record = attendanceRecords.find(a => String(a.user_id) === String(emp.id));
                    const currentStatus = attStatusForm[emp.id] || record?.status || 'present';
                    const currentMode = attWorkModeForm[emp.id] || record?.work_mode || 'office';
                    const currentNotes = attNotesForm[emp.id] !== undefined ? attNotesForm[emp.id] : (record?.notes || '');
                    const isSaving = attSavingUserId === emp.id;

                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 text-[13px] font-normal text-slate-900 border border-slate-300 text-center">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3 border border-slate-300">
                          <span className="block text-[14px] font-medium text-slate-950">{emp.full_name}</span>
                          <span className="block text-[11.5px] font-normal text-slate-900">{emp.designation || 'Staff'} &bull; {emp.department}</span>
                        </td>
                        <td className="px-4 py-3 border border-slate-300">
                          <select
                            value={currentStatus}
                            onChange={(e) => setAttStatusForm({ ...attStatusForm, [emp.id]: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-slate-950 focus:outline-none"
                          >
                            <option value="present">Present</option>
                            <option value="absent">Absent</option>
                            <option value="half_day">Half Day</option>
                            <option value="on_leave">On Leave</option>
                            <option value="holiday">Holiday</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 border border-slate-300">
                          <select
                            value={currentMode}
                            onChange={(e) => setAttWorkModeForm({ ...attWorkModeForm, [emp.id]: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-slate-950 focus:outline-none"
                          >
                            <option value="office">In Office</option>
                            <option value="remote">Remote (WFH)</option>
                            <option value="hybrid">Hybrid</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 border border-slate-300">
                          <input
                            type="text"
                            placeholder="Optional notes..."
                            value={currentNotes}
                            onChange={(e) => setAttNotesForm({ ...attNotesForm, [emp.id]: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-[12px] font-normal text-slate-950 focus:outline-none"
                          />
                        </td>
                        <td className="px-4 py-3 border border-slate-300 text-center">
                          <button
                            type="button"
                            onClick={() => handleSaveAttendance(emp.id)}
                            disabled={isSaving}
                            className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-[12px] font-medium transition-all cursor-pointer shadow-xs"
                          >
                            {isSaving ? 'Saving...' : 'Update'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. LEAVE MANAGEMENT TAB */}
      {activeTab === 'leaves' && (
        <div className="space-y-4 animate-fade-in-fast">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-300 rounded-2xl p-4 shadow-sm">
            <div>
              <h3 className="text-[17px] font-bold text-slate-950">Employee Leave Applications</h3>
              <p className="text-[12px] text-slate-900 font-normal">Review leave requests, reason justifications, and authorize approvals</p>
            </div>
            <button
              onClick={() => setIsLeaveModalOpen(true)}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-[13px] font-medium cursor-pointer"
            >
              <Plus size={15} />
              <span>New Leave Request</span>
            </button>
          </div>

          <div className="bg-white rounded-[20px] overflow-hidden shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#3715ca] text-white">
                    <th className="px-4 py-3.5 text-[13px] font-semibold text-center border border-slate-300 w-16">S.No.</th>
                    <th className="px-4 py-3.5 text-[13px] font-semibold border border-slate-300 min-w-[180px]">Employee</th>
                    <th className="px-4 py-3.5 text-[13px] font-semibold border border-slate-300 w-28">Type</th>
                    <th className="px-4 py-3.5 text-[13px] font-semibold border border-slate-300 w-44">Duration</th>
                    <th className="px-4 py-3.5 text-[13px] font-semibold border border-slate-300 min-w-[200px]">Reason</th>
                    <th className="px-4 py-3.5 text-[13px] font-semibold text-center border border-slate-300 w-28">Status</th>
                    <th className="px-4 py-3.5 text-[13px] font-semibold text-center border border-slate-300 w-32">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveRecords.map((leave, idx) => (
                    <tr key={leave.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 text-[13px] font-normal text-slate-900 border border-slate-300 text-center">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3 border border-slate-300">
                        <span className="block text-[14px] font-medium text-slate-950">{leave.user?.full_name || 'Employee'}</span>
                        <span className="block text-[11px] font-normal text-slate-900">{leave.user?.department || 'Staff'}</span>
                      </td>
                      <td className="px-4 py-3 border border-slate-300">
                        <span className="px-2.5 py-1 bg-slate-100 border border-slate-300 text-slate-950 rounded-md text-[11.5px] font-medium uppercase">
                          {leave.leave_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 border border-slate-300 text-[12px] text-slate-950 font-normal">
                        <div>{formatDateToDMY(leave.start_date)} to {formatDateToDMY(leave.end_date)}</div>
                        <span className="text-[11px] font-medium text-slate-900">({leave.days} day{leave.days > 1 ? 's' : ''})</span>
                      </td>
                      <td className="px-4 py-3 border border-slate-300 text-[13px] font-normal text-slate-950">
                        {leave.reason}
                      </td>
                      <td className="px-4 py-3 border border-slate-300 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-medium uppercase ${
                          leave.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                            : leave.status === 'rejected'
                            ? 'bg-red-100 text-red-950 border border-red-300'
                            : 'bg-amber-100 text-amber-950 border border-amber-300'
                        }`}>
                          {leave.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 border border-slate-300 text-center">
                        {leave.status === 'pending' ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleUpdateLeaveStatus(leave.id, 'approved')}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg cursor-pointer"
                              title="Approve Leave"
                            >
                              <CheckCircle2 size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateLeaveStatus(leave.id, 'rejected')}
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-800 border border-red-300 rounded-lg cursor-pointer"
                              title="Reject Leave"
                            >
                              <XCircle size={16} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-900 font-medium">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {leaveRecords.length === 0 && (
                    <tr>
                      <td colSpan="7" className="border border-slate-300 p-8 text-center text-slate-900 italic text-[13px] font-medium">
                        No leave applications on record.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. WEEKLY TIMESHEETS TAB */}
      {activeTab === 'timesheets' && (
        <div className="space-y-4 animate-fade-in-fast">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-300 rounded-2xl p-4 shadow-sm">
            <div>
              <h3 className="text-[17px] font-bold text-slate-950">Employee Timesheets & Aggregated Hours</h3>
              <p className="text-[12px] text-slate-900 font-normal">Real-time compilation of total hours logged against task progression reports</p>
            </div>
            <button
              onClick={fetchTimesheets}
              className="px-3.5 py-1.5 bg-white border border-slate-300 rounded-xl text-[12px] font-medium text-slate-950 hover:bg-slate-50 cursor-pointer shadow-xs"
            >
              Refresh Aggregates
            </button>
          </div>

          {timesheetLoading ? (
            <div className="flex items-center justify-center h-48 bg-white rounded-2xl border border-slate-300">
              <div className="animate-spin rounded-full h-7 w-7 border-t-2 border-orange-500"></div>
            </div>
          ) : (
            <div className="bg-white rounded-[20px] overflow-hidden shadow-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#3715ca] text-white">
                      <th className="px-4 py-3.5 text-[13px] font-semibold text-center border border-slate-300 w-16">S.No.</th>
                      <th className="px-4 py-3.5 text-[13px] font-semibold border border-slate-300 min-w-[200px]">Employee</th>
                      <th className="px-4 py-3.5 text-[13px] font-semibold text-center border border-slate-300 w-36">Total Hours Logged</th>
                      <th className="px-4 py-3.5 text-[13px] font-semibold text-center border border-slate-300 w-32">Reports Submitted</th>
                      <th className="px-4 py-3.5 text-[13px] font-semibold text-center border border-slate-300 w-32">Tasks Completed</th>
                      <th className="px-4 py-3.5 text-[13px] font-semibold text-center border border-slate-300 w-32">Days Present</th>
                      <th className="px-4 py-3.5 text-[13px] font-semibold border border-slate-300 min-w-[240px]">Recent Work Logs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timesheetSummaries.map((item, idx) => (
                      <tr key={item.user.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 text-[13px] font-normal text-slate-900 border border-slate-300 text-center">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3 border border-slate-300">
                          <span className="block text-[14px] font-medium text-slate-950">{item.user.full_name}</span>
                          <span className="block text-[11px] font-normal text-slate-900">{item.user.designation || 'Staff'} &bull; {item.user.department}</span>
                        </td>
                        <td className="px-4 py-3 border border-slate-300 text-center">
                          <span className="inline-block px-3 py-1 bg-orange-50 border border-orange-200 text-orange-950 rounded-full text-[13px] font-semibold">
                            {item.total_hours_logged} hrs
                          </span>
                        </td>
                        <td className="px-4 py-3 border border-slate-300 text-center text-[13px] font-medium text-slate-950">
                          {item.reports_count}
                        </td>
                        <td className="px-4 py-3 border border-slate-300 text-center text-[13px] font-medium text-slate-950">
                          {item.completed_tasks_count}
                        </td>
                        <td className="px-4 py-3 border border-slate-300 text-center text-[13px] font-medium text-slate-950">
                          {item.days_present}
                        </td>
                        <td className="px-4 py-3 border border-slate-300 text-[12px] font-normal text-slate-900">
                          {item.recent_reports && item.recent_reports.length > 0 ? (
                            <ul className="list-disc list-inside space-y-1">
                              {item.recent_reports.map(r => (
                                <li key={r.id} className="truncate max-w-xs" title={r.content}>
                                  <span className="text-slate-950 font-medium">{r.hours_spent}h</span> &bull; {r.content}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="italic text-slate-900">No recent task logs</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {timesheetSummaries.length === 0 && (
                      <tr>
                        <td colSpan="7" className="border border-slate-300 p-8 text-center text-slate-900 italic text-[13px] font-medium">
                          No timesheet data available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL FOR APPLYING LEAVE */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm animate-fade-in-fast">
          <div className="w-full max-w-md bg-white border border-slate-400 rounded-2xl shadow-2xl p-6 text-slate-950 relative animate-scale-up space-y-4">
            <button
              onClick={() => setIsLeaveModalOpen(false)}
              className="absolute top-4 right-4 text-slate-900 hover:text-black bg-slate-50 hover:bg-slate-100 p-1.5 rounded-lg border border-slate-300 cursor-pointer"
            >
              <X size={16} />
            </button>

            <div>
              <h3 className="text-[17px] font-bold text-slate-950">Apply for Leave</h3>
              <p className="text-[12px] text-slate-900 font-normal">Submit formal leave request for approval</p>
            </div>

            <form onSubmit={handleSubmitLeave} className="space-y-3.5 pt-1">
              <div>
                <label className="block text-[11px] font-medium text-slate-900 mb-1">Select Employee</label>
                <select
                  required
                  value={leaveUserId}
                  onChange={(e) => setLeaveUserId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-[13px] font-normal text-slate-950 focus:bg-white focus:outline-none"
                >
                  <option value="">-- Choose employee --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.department})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-900 mb-1">Leave Category</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-[13px] font-normal text-slate-950 focus:bg-white focus:outline-none"
                >
                  <option value="casual">Casual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="earned">Earned Leave</option>
                  <option value="unpaid">Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-900 mb-1">From Date</label>
                  <input
                    type="date"
                    required
                    value={leaveStartDate}
                    onChange={(e) => setLeaveStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-[12px] font-normal text-slate-950 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-900 mb-1">To Date</label>
                  <input
                    type="date"
                    required
                    value={leaveEndDate}
                    onChange={(e) => setLeaveEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-[12px] font-normal text-slate-950 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-900 mb-1">Total Days</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={leaveDays}
                  onChange={(e) => setLeaveDays(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-[13px] font-normal text-slate-950 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-900 mb-1">Reason for Absence</label>
                <textarea
                  rows="2"
                  required
                  placeholder="Specify brief reason..."
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-[13px] font-normal text-slate-950 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsLeaveModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl text-[12px] font-medium border border-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingLeave}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-[12px] font-medium shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {submittingLeave && <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-white"></div>}
                  <span>Submit Application</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>

      {/* COMBINED VIEW / EDIT & DOCUMENT MANAGEMENT MODAL */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm animate-fade-in-fast">
          <div className="w-full max-w-3xl bg-white border border-slate-400 rounded-2xl shadow-2xl flex flex-col h-[90vh] text-slate-950 relative overflow-hidden animate-scale-up">
            
            {/* CLOSE BUTTON TOP RIGHT */}
            <button 
              onClick={() => { setIsFormModalOpen(false); resetForm(); }}
              className="absolute top-4 right-4 z-10 text-slate-900 hover:text-black bg-slate-50 hover:bg-slate-100 p-1.5 rounded-lg border border-slate-300 transition-colors cursor-pointer"
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
                    <p className="text-[12px] text-slate-900">Fill in background profile, role controls and credentials</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-900 mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-full px-4 py-2 text-slate-950 text-[13px] font-medium focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-900 mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-full px-4 py-2 text-slate-950 text-[13px] font-medium focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-900 mb-1">
                        {isEditing ? 'Change Password (optional)' : 'Password'}
                      </label>
                      <input
                        type="password"
                        required={!isEditing}
                        placeholder={isEditing ? 'Leave blank to keep same' : 'e.g. member123'}
                        value={passwordHash}
                        onChange={(e) => setPasswordHash(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-full px-4 py-2 text-slate-950 text-[13px] font-medium focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-900 mb-1">Platform Role</label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-full px-4 py-2 text-slate-950 text-[13px] font-medium focus:outline-none"
                      >
                        <option value="admin">Admin</option>
                        <option value="project_head">Project Head</option>
                        <option value="team_member">Team Member</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-900 mb-1">Department</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Engineering"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-full px-4 py-2 text-slate-950 text-[13px] font-medium focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-900 mb-1">Designation</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Developer"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-full px-4 py-2 text-slate-950 text-[13px] font-medium focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-900 mb-1">Phone Number</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-full px-4 py-2 text-slate-950 text-[13px] font-medium focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-900 mb-1">Date of Birth</label>
                      <input
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-full px-4 py-1.5 text-slate-950 text-[12px] font-medium focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-900 mb-1">Gender</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-full px-4 py-2 text-slate-950 text-[13px] font-medium focus:outline-none"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-900 mb-1">Status</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-full px-4 py-2 text-slate-950 text-[13px] font-medium focus:outline-none"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-900 mb-1">Date of Joining</label>
                      <input
                        type="date"
                        required
                        value={joinsDate}
                        onChange={(e) => setJoinsDate(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-full px-4 py-1.5 text-slate-950 text-[12px] font-medium focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-900 mb-1">Employment Type</label>
                      <select
                        value={employmentType}
                        onChange={(e) => setEmploymentType(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-full px-4 py-2 text-slate-950 text-[13px] font-medium focus:outline-none"
                      >
                        <option value="internship" disabled={isInternshipDisabled}>Internship {isInternshipDisabled ? '(Disabled - Staff Guard)' : ''}</option>
                        <option value="on role">On Role</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-900 mb-1">Residential Address</label>
                    <textarea
                      rows="2"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-2xl px-4 py-2 text-slate-950 text-[13px] font-medium focus:outline-none"
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
                          <label className="block text-[10px] font-medium text-slate-900 mb-1 uppercase">Document Label</label>
                          <input
                            type="text"
                            placeholder="e.g. Pan Card, Offer Letter, Resume"
                            value={newDocLabel}
                            onChange={(e) => setNewDocLabel(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-full px-3.5 py-1.5 text-slate-950 text-[12px] font-medium focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-slate-900 mb-1 uppercase">Select File (.pdf, images)</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="file"
                              accept=".pdf,.png,.jpg,.jpeg"
                              id="hr-doc-picker"
                              onChange={handleUploadNewDoc}
                              className="hidden"
                            />
                            <label htmlFor="hr-doc-picker" className="bg-white border border-slate-300 text-slate-950 hover:bg-slate-50 px-3.5 py-1.5 rounded-full cursor-pointer text-[12px] font-medium shadow-sm inline-flex items-center gap-1.5 transition-colors">
                              <Upload size={14} />
                              <span>{uploadingDocName ? 'Replace File' : 'Choose File'}</span>
                            </label>
                            {uploadingDocName && (
                              <span className="text-[11px] text-slate-900 truncate max-w-[140px] font-semibold" title={uploadingDocName}>
                                {uploadingDocName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {newDocBase64 && (
                        <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-950 text-[12px] font-semibold animate-fade-in">
                          <span className="truncate mr-2">Selected: <strong className="font-bold">{uploadingDocName}</strong></span>
                          <button
                            type="button"
                            onClick={handleDepositNewDoc}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-[11px] font-bold shadow-xs cursor-pointer transition-colors shrink-0"
                          >
                            + Add to Documents List
                          </button>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleDepositNewDoc}
                        className="w-full bg-slate-200 hover:bg-slate-300 text-slate-900 border border-slate-300 py-1.5 rounded-full text-[12px] font-bold shadow-sm cursor-pointer transition-colors"
                      >
                        Add to Profile Documents
                      </button>
                    </div>

                    {/* DOCUMENTS LIST */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {formDocuments.map((doc, idx) => {
                        const displayName = doc.name || doc.label || 'Document';
                        const fileData = doc.file || doc.file_data || '';
                        const filename = doc.filename || doc.name || 'document';
                        return (
                          <div key={idx} className="bg-white border border-slate-300 rounded-xl p-3 flex justify-between items-center shadow-sm">
                            <div className="flex items-center gap-2 overflow-hidden mr-2">
                              <FileText size={16} className="text-orange-600 shrink-0" />
                              <div className="overflow-hidden">
                                <span className="block text-[12.5px] font-bold text-slate-950 truncate leading-tight">{displayName}</span>
                                <span className="block text-[9.5px] text-slate-900 font-semibold truncate mt-0.5">{filename}</span>
                              </div>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              {fileData && (
                                <button
                                  type="button"
                                  onClick={() => openBase64File(fileData, filename)}
                                  className="p-1.5 bg-slate-50 border border-slate-300 hover:bg-slate-100 rounded text-slate-900 cursor-pointer"
                                  title="View / Preview Document"
                                >
                                  <Eye size={12} />
                                </button>
                              )}
                              {fileData && (
                                <button
                                  type="button"
                                  onClick={() => downloadFile(fileData, filename)}
                                  className="p-1.5 bg-slate-50 border border-slate-300 hover:bg-slate-100 rounded text-slate-900 cursor-pointer"
                                  title="Download Document"
                                >
                                  <Download size={12} />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteFormDoc(idx)}
                                className="p-1.5 bg-red-50 border border-red-300 hover:bg-red-100 rounded text-red-700 cursor-pointer"
                                title="Delete Document"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {formDocuments.length === 0 && (
                        <div className="col-span-full py-6 text-center border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50">
                          <FileText size={24} className="mx-auto text-slate-900 mb-1" />
                          <p className="text-[12px] font-normal text-slate-900">No documents attached yet</p>
                          <p className="text-[11px] text-slate-900">Choose a file above and click "Add to Profile Documents" or save the profile.</p>
                        </div>
                      )}
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
      {/* DOCUMENTS GRID VIEW MODAL */}
      {isDocsModalOpen && docsModalEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in-fast">
          <div className="w-full max-w-4xl bg-white border border-slate-400 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] text-slate-950 relative overflow-hidden animate-scale-up">
            
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0">
                  <FileText size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[17px] font-bold text-slate-950 leading-tight">Employee Documents</h3>
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-800 border border-orange-200 rounded-full text-[11px] font-bold">
                      {docsModalEmployee.documents?.length || 0} Files
                    </span>
                  </div>
                  <p className="text-[12px] font-normal text-slate-900 mt-0.5">
                    {docsModalEmployee.full_name} &bull; {docsModalEmployee.designation || 'Staff'} ({docsModalEmployee.email})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingDocInModal(!isAddingDocInModal)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-[12px] font-bold shadow-sm transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Plus size={14} />
                  <span>{isAddingDocInModal ? 'Cancel Add' : 'Add Document'}</span>
                </button>
                <button 
                  type="button"
                  onClick={closeDocsModal}
                  className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-200 text-slate-900 hover:text-black cursor-pointer transition-colors"
                  title="Close modal"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* INLINE ADD NEW DOCUMENT PANEL */}
            {isAddingDocInModal && (
              <form onSubmit={handleModalAddNewDoc} className="p-4 bg-orange-50/70 border-b border-orange-200 animate-fade-in space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-orange-900 uppercase tracking-wide">Attach New Document</span>
                  <span className="text-[11px] text-slate-900">Select file and assign a label</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-900 mb-1">Document Label</label>
                    <input
                      type="text"
                      placeholder="e.g. Identity Proof, Certificate, Contract"
                      value={modalNewDocLabel}
                      onChange={(e) => setModalNewDocLabel(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-1.5 text-slate-950 text-[12px] font-medium focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-900 mb-1">Select File (.pdf, images)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        id="modal-add-doc-picker"
                        onChange={(e) => handleModalDocFileChange(e, false)}
                        className="hidden"
                      />
                      <label htmlFor="modal-add-doc-picker" className="bg-white border border-slate-300 text-slate-900 hover:bg-slate-100 px-3 py-1.5 rounded-xl cursor-pointer text-[12px] font-medium shadow-xs inline-flex items-center gap-1.5 transition-colors">
                        <Upload size={13} />
                        <span>{modalNewDocFilename ? 'Replace File' : 'Choose File'}</span>
                      </label>
                      {modalNewDocFilename && (
                        <span className="text-[11px] text-slate-900 font-semibold truncate max-w-[180px]" title={modalNewDocFilename}>
                          {modalNewDocFilename}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingDocInModal(false);
                      setModalNewDocLabel('');
                      setModalNewDocBase64('');
                      setModalNewDocFilename('');
                    }}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-900 rounded-xl text-[12px] font-bold border border-slate-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-[12px] font-bold shadow-xs cursor-pointer transition-all hover:scale-[1.02]"
                  >
                    Upload & Save
                  </button>
                </div>
              </form>
            )}

            {/* GRID VIEW BODY */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
              {docsModalEmployee.documents && docsModalEmployee.documents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {docsModalEmployee.documents.map((doc, idx) => {
                    const docName = doc.name || doc.label || doc.filename || 'Document';
                    const docFile = doc.file || doc.file_data || '';
                    const docFilename = doc.filename || doc.name || 'document';
                    const isPdf = (docFile && docFile.startsWith('data:application/pdf')) || docFilename.toLowerCase().endsWith('.pdf');
                    const isImg = (docFile && docFile.startsWith('data:image')) || docFilename.match(/\.(png|jpe?g|webp|gif)$/i);

                    return (
                      <div
                        key={idx}
                        className="bg-white border border-slate-300 rounded-xl p-3.5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                      >
                        {/* PREVIEW THUMBNAIL */}
                        <div>
                          <div 
                            onClick={() => openDetailDoc(doc, idx)}
                            className="w-full h-32 rounded-lg border border-slate-200 overflow-hidden mb-3 flex items-center justify-center cursor-pointer transition-colors group-hover:border-orange-300 relative bg-slate-100"
                            title="Click to view detailed preview"
                          >
                            {isImg && docFile ? (
                              <img src={docFile} alt={docName} className="w-full h-full object-cover" />
                            ) : isPdf ? (
                              <div className="flex flex-col items-center justify-center p-2 text-center bg-red-50 w-full h-full">
                                <FileText size={36} className="text-red-500 mb-1" />
                                <span className="text-[11px] font-bold text-red-700 uppercase tracking-wider">PDF File</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center p-2 text-center bg-orange-50 w-full h-full">
                                <FileText size={36} className="text-orange-500 mb-1" />
                                <span className="text-[11px] font-bold text-orange-700 uppercase tracking-wider">Document</span>
                              </div>
                            )}

                            {/* HOVER OVERLAY */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 transition-opacity text-white text-[12px] font-bold">
                              <Eye size={16} />
                              <span>Preview</span>
                            </div>
                          </div>

                          {/* INFO */}
                          <div className="space-y-0.5">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="text-[13.5px] font-bold text-slate-950 truncate" title={docName}>
                                {docName}
                              </h4>
                              <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold shrink-0 border ${
                                isPdf ? 'bg-red-50 text-red-700 border-red-200' : isImg ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-900 border-slate-200'
                              }`}>
                                {isPdf ? 'PDF' : isImg ? 'IMG' : 'DOC'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-900 font-medium truncate" title={docFilename}>
                              {docFilename}
                            </p>
                          </div>
                        </div>

                        {/* ACTIONS */}
                        <div className="flex items-center gap-1.5 pt-3 mt-3 border-t border-slate-200">
                          <button
                            type="button"
                            onClick={() => openDetailDoc(doc, idx)}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg text-[11.5px] font-bold transition-colors cursor-pointer shadow-xs"
                            title="View detailed document"
                          >
                            <Eye size={13} />
                            <span>View</span>
                          </button>
                          {docFile && (
                            <button
                              type="button"
                              onClick={() => downloadFile(docFile, docFilename)}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-900 hover:text-slate-900 border border-slate-300 rounded-lg transition-colors cursor-pointer shadow-xs"
                              title="Download document"
                            >
                              <Download size={13} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => startEditDoc(idx)}
                            className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300 rounded-lg transition-colors cursor-pointer shadow-xs"
                            title="Update / Edit label & file"
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDoc(idx)}
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 rounded-lg transition-colors cursor-pointer shadow-xs"
                            title="Delete document"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-16 text-center border-2 border-dashed border-slate-300 rounded-2xl bg-white space-y-2">
                  <FileText size={40} className="mx-auto text-slate-900 mb-2" />
                  <p className="text-[14px] font-normal text-slate-900">No documents deposited</p>
                  <p className="text-[12px] text-slate-900 max-w-sm mx-auto">
                    Click "Add Document" above to upload credentials, identity cards, or letters for this employee.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsAddingDocInModal(true)}
                    className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-[12px] font-bold shadow-xs cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>Upload Document</span>
                  </button>
                </div>
              )}
            </div>

            {/* MODAL FOOTER */}
            <div className="flex items-center justify-between px-6 py-3 bg-white border-t border-slate-200">
              <span className="text-[12px] text-slate-900 font-medium">
                Showing <strong className="font-bold text-slate-900">{docsModalEmployee.documents?.length || 0}</strong> attached files
              </span>
              <button
                type="button"
                onClick={closeDocsModal}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl text-[12px] font-bold border border-slate-300 cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED DOCUMENT VIEWER POPUP MODAL */}
      {selectedDetailDoc && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in-fast">
          <div className="w-full max-w-4xl bg-white border border-slate-400 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] text-slate-950 overflow-hidden animate-scale-up">
            
            {/* DETAIL HEADER */}
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => { setSelectedDetailDoc(null); setSelectedDetailDocIndex(null); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-900 rounded-xl text-[12px] font-bold border border-slate-300 transition-colors cursor-pointer shadow-xs"
                >
                  <ArrowLeft size={14} />
                  <span>Back to Grid</span>
                </button>
                <div>
                  <h3 className="text-[16px] font-bold text-slate-950 leading-tight">
                    {selectedDetailDoc.name || selectedDetailDoc.label || 'Document Details'}
                  </h3>
                  <p className="text-[11px] font-normal text-slate-900">
                    {selectedDetailDoc.filename || selectedDetailDoc.name}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => { setSelectedDetailDoc(null); setSelectedDetailDocIndex(null); }}
                className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-200 text-slate-900 hover:text-black cursor-pointer transition-colors"
                title="Close detailed view"
              >
                <X size={18} />
              </button>
            </div>

            {/* DETAIL PREVIEW CONTAINER */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-100 flex flex-col items-center justify-center">
              {(() => {
                const docFile = selectedDetailDoc.file || selectedDetailDoc.file_data || '';
                const docFilename = selectedDetailDoc.filename || selectedDetailDoc.name || '';
                const isPdf = (docFile && docFile.startsWith('data:application/pdf')) || docFilename.toLowerCase().endsWith('.pdf');
                const isImg = (docFile && docFile.startsWith('data:image')) || docFilename.match(/\.(png|jpe?g|webp|gif)$/i);

                if (isPdf && docFile) {
                  return (
                    <div className="w-full h-[54vh] bg-white rounded-xl border border-slate-300 shadow-md overflow-hidden">
                      <iframe 
                        src={docFile} 
                        className="w-full h-full border-none" 
                        title={selectedDetailDoc.name || 'PDF Preview'} 
                      />
                    </div>
                  );
                }

                if (isImg && docFile) {
                  return (
                    <div className="w-full max-h-[54vh] flex items-center justify-center p-3 bg-white rounded-xl border border-slate-300 shadow-md overflow-auto">
                      <img 
                        src={docFile} 
                        alt={selectedDetailDoc.name || 'Document Preview'} 
                        className="max-h-[50vh] max-w-full object-contain rounded-lg"
                      />
                    </div>
                  );
                }

                return (
                  <div className="w-full max-w-md py-12 px-6 bg-white border border-slate-300 rounded-2xl shadow-sm text-center space-y-3">
                    <FileText size={52} className="mx-auto text-orange-500" />
                    <div>
                      <h4 className="text-[16px] font-bold text-slate-900">{selectedDetailDoc.name || 'File Document'}</h4>
                      <p className="text-[12px] text-slate-900 mt-1">{selectedDetailDoc.filename || 'Direct preview is unavailable for this format.'}</p>
                    </div>
                    <p className="text-[11px] text-slate-900">
                      Use the download option below to inspect the file locally or open it in a new window.
                    </p>
                  </div>
                );
              })()}

              {/* METADATA INFO BAR */}
              <div className="w-full mt-4 bg-white border border-slate-300 rounded-xl p-3.5 shadow-xs grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
                <div>
                  <span className="block text-[10px] font-bold text-slate-900 uppercase">Document Name</span>
                  <span className="block text-[12px] font-bold text-slate-900 truncate">{selectedDetailDoc.name || 'Document'}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-900 uppercase">Original File</span>
                  <span className="block text-[12px] font-bold text-slate-900 truncate">{selectedDetailDoc.filename || selectedDetailDoc.name}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-900 uppercase">Format</span>
                  <span className="block text-[12px] font-bold text-slate-900">
                    {selectedDetailDoc.file?.startsWith('data:application/pdf') ? 'PDF Document' : selectedDetailDoc.file?.startsWith('data:image') ? 'Image File' : 'Standard File'}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-900 uppercase">Employee</span>
                  <span className="block text-[12px] font-bold text-slate-900 truncate">{docsModalEmployee?.full_name || 'Staff'}</span>
                </div>
              </div>
            </div>

            {/* DETAIL ACTION BAR (Download, Update, Delete) */}
            <div className="flex items-center justify-between px-6 py-3.5 bg-white border-t border-slate-200">
              <div className="flex items-center gap-2">
                {selectedDetailDoc.file && (
                  <button
                    type="button"
                    onClick={() => downloadFile(selectedDetailDoc.file, selectedDetailDoc.filename || selectedDetailDoc.name)}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-[12px] font-bold shadow-sm transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Download size={14} />
                    <span>Download File</span>
                  </button>
                )}
                {selectedDetailDoc.file && (
                  <button
                    type="button"
                    onClick={() => openBase64File(selectedDetailDoc.file, selectedDetailDoc.filename || selectedDetailDoc.name)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 rounded-xl text-[12px] font-bold transition-all cursor-pointer shadow-xs"
                  >
                    <ExternalLink size={14} />
                    <span>Open in New Tab</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => startEditDoc(selectedDetailDocIndex)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-[12px] font-bold transition-all cursor-pointer shadow-xs"
                >
                  <Edit size={14} />
                  <span>Update Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteDoc(selectedDetailDocIndex)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 rounded-xl text-[12px] font-bold transition-all cursor-pointer shadow-xs"
                >
                  <Trash2 size={14} />
                  <span>Delete Document</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UPDATE / EDIT DOCUMENT DIALOG */}
      {isEditingDoc && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in-fast">
          <div className="w-full max-w-md bg-white border border-slate-400 rounded-2xl shadow-2xl p-6 text-slate-950 animate-scale-up space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-[16px] font-bold text-slate-900">Update Document</h3>
              <button 
                type="button"
                onClick={() => setIsEditingDoc(false)} 
                className="p-1 rounded text-slate-900 hover:text-black hover:bg-slate-100 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEditedDoc} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-900 mb-1">Document Label / Name</label>
                <input
                  type="text"
                  required
                  value={docEditLabel}
                  onChange={(e) => setDocEditLabel(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-950 text-[13px] font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-900 mb-1">Replace File (Optional)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    id="edit-doc-picker"
                    onChange={(e) => handleModalDocFileChange(e, true)}
                    className="hidden"
                  />
                  <label htmlFor="edit-doc-picker" className="bg-slate-100 border border-slate-300 hover:bg-slate-200 text-slate-900 px-3.5 py-1.5 rounded-xl cursor-pointer text-[12px] font-medium inline-flex items-center gap-1.5 transition-colors shadow-xs">
                    <Upload size={14} />
                    <span>{docEditFilename ? 'Change Replacement' : 'Choose New File'}</span>
                  </label>
                  {docEditFilename && (
                    <span className="text-[11px] text-slate-900 font-semibold truncate max-w-[170px]" title={docEditFilename}>
                      {docEditFilename}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditingDoc(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl text-[12px] font-bold border border-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-[12px] font-bold shadow-sm cursor-pointer transition-all hover:scale-[1.02]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
