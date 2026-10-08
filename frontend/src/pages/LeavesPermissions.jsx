import React, { useEffect, useState } from 'react';
import { 
  Clock, 
  Plus, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Users, 
  Filter, 
  X,
  Send,
  Building,
  User,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import API_URL from '../config';
import { useUI } from '../components/UIProvider';

export default function LeavesPermissions({ user }) {
  const { showToast } = useUI();
  const [activeTab, setActiveTab] = useState('my_requests'); // 'my_requests' or 'team_requests' (for head/admin)
  const [myLeaves, setMyLeaves] = useState([]);
  const [teamLeaves, setTeamLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  // Apply modal states
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [requestType, setRequestType] = useState('permission');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [days, setDays] = useState(1);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Status Filter for history
  const [statusFilter, setStatusFilter] = useState('all');

  const isProjectHead = user?.role === 'project_head';
  const isAdmin = user?.role === 'admin';

  // Format date helper: YYYY-MM-DD -> DD-MM-YYYY
  const formatDateToDMY = (dateStr) => {
    if (!dateStr) return '--';
    try {
      const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
      const parts = cleanDate.split('-');
      if (parts.length === 3 && parts[0].length === 4) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      return cleanDate;
    } catch {
      return dateStr;
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch own requests
      const myRes = await fetch(`${API_URL}/leaves?user_id=${user?.id}`);
      const myData = await myRes.json();
      setMyLeaves(Array.isArray(myData) ? myData : []);

      // 2. If Project Head or Admin, fetch team leaves
      if (isProjectHead || isAdmin) {
        if (isProjectHead) {
          // Find team members assigned under this Project Head's projects
          const [projRes, taskRes, allLeavesRes] = await Promise.all([
            fetch(`${API_URL}/projects`),
            fetch(`${API_URL}/tasks`),
            fetch(`${API_URL}/leaves`)
          ]);
          const projects = await projRes.json();
          const allTasks = await taskRes.json();
          const allLeaves = await allLeavesRes.json();

          // Projects owned by this head
          const headProjectIds = (projects || [])
            .filter(p => String(p.project_head_id) === String(user?.id))
            .map(p => String(p.id));

          // Task assignees under this head's projects
          const subordinateUserIds = new Set();
          (allTasks || []).forEach(t => {
            if (headProjectIds.includes(String(t.project_id)) && t.assigned_to) {
              subordinateUserIds.add(String(t.assigned_to));
            }
          });

          // Filter leaves of subordinates
          const subordinatesLeaves = (allLeaves || []).filter(l => 
            subordinateUserIds.has(String(l.user_id))
          );
          setTeamLeaves(subordinatesLeaves);
        } else if (isAdmin) {
          // Admin can see all leaves
          const allLeavesRes = await fetch(`${API_URL}/leaves`);
          const allLeaves = await allLeavesRes.json();
          setTeamLeaves(Array.isArray(allLeaves) ? allLeaves : []);
        }
      }
    } catch (e) {
      console.error('Error loading leaves:', e);
      showToast('Could not load leave records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user]);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      showToast('Please provide a reason for the request', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/leaves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id,
          leave_type: requestType,
          start_date: startDate,
          end_date: endDate,
          days: Number(days || 1),
          reason: reason.trim()
        })
      });

      if (res.ok) {
        showToast('Request submitted successfully for review', 'success');
        setIsApplyModalOpen(false);
        setReason('');
        setDays(1);
        setRequestType('permission');
        loadData();
      } else {
        showToast('Failed to submit request', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Error sending application', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter list by status
  const filterList = (list) => {
    if (statusFilter === 'all') return list;
    return list.filter(l => l.status === statusFilter);
  };

  const displayedMyLeaves = filterList(myLeaves);
  const displayedTeamLeaves = filterList(teamLeaves);

  // Leave counts summary
  const myPendingCount = myLeaves.filter(l => l.status === 'pending').length;
  const myApprovedCount = myLeaves.filter(l => l.status === 'approved').length;
  const myRejectedCount = myLeaves.filter(l => l.status === 'rejected').length;

  return (
    <div className="space-y-6 animate-fade-in text-slate-900 font-medium">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-[22px] font-bold text-slate-950 tracking-tight">Leaves & Permissions Portal</h2>
          <p className="text-[13px] text-slate-900 font-normal">
            Request formal work leaves or short permissions, track decision history, and view team records
          </p>
        </div>

        <button
          onClick={() => setIsApplyModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-4 py-2.5 rounded-xl text-[14px] font-medium transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} className="stroke-[2.5]" />
          <span>Apply Leave / Permission</span>
        </button>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-300 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11.5px] font-medium text-slate-900 uppercase tracking-wider block">Total Applied</span>
            <span className="text-[22px] font-bold text-slate-950">{myLeaves.length}</span>
          </div>
          <div className="p-2.5 bg-slate-100 rounded-lg text-slate-900 border border-slate-300">
            <Calendar size={19} />
          </div>
        </div>

        <div className="bg-white border border-slate-300 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11.5px] font-medium text-amber-900 uppercase tracking-wider block">Pending Approval</span>
            <span className="text-[22px] font-bold text-amber-950">{myPendingCount}</span>
          </div>
          <div className="p-2.5 bg-amber-50 rounded-lg text-amber-900 border border-amber-300">
            <Clock size={19} />
          </div>
        </div>

        <div className="bg-white border border-slate-300 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11.5px] font-medium text-emerald-900 uppercase tracking-wider block">Approved</span>
            <span className="text-[22px] font-bold text-emerald-950">{myApprovedCount}</span>
          </div>
          <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-900 border border-emerald-300">
            <CheckCircle2 size={19} />
          </div>
        </div>

        <div className="bg-white border border-slate-300 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11.5px] font-medium text-red-900 uppercase tracking-wider block">Rejected</span>
            <span className="text-[22px] font-bold text-red-950">{myRejectedCount}</span>
          </div>
          <div className="p-2.5 bg-red-50 rounded-lg text-red-900 border border-red-300">
            <XCircle size={19} />
          </div>
        </div>
      </div>

      {/* TABS & FILTER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-300 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('my_requests')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'my_requests'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-900 hover:bg-slate-100 border border-slate-300'
            }`}
          >
            <Clock size={15} />
            <span>My Applications & History</span>
            <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${activeTab === 'my_requests' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-900'}`}>
              {myLeaves.length}
            </span>
          </button>

          {(isProjectHead || isAdmin) && (
            <button
              onClick={() => setActiveTab('team_requests')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'team_requests'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-900 hover:bg-slate-100 border border-slate-300'
              }`}
            >
              <Users size={15} />
              <span>{isProjectHead ? 'Subordinates / Team Requests' : 'All Organization Applications'}</span>
              <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${activeTab === 'team_requests' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-900'}`}>
                {teamLeaves.length}
              </span>
            </button>
          )}
        </div>

        {/* STATUS FILTER */}
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-medium text-slate-900 whitespace-nowrap">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-[12.5px] font-medium text-slate-950 focus:outline-none shadow-xs"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* CONTENT TABLES */}
      {loading ? (
        <div className="flex items-center justify-center h-48 bg-white rounded-xl border border-slate-400 shadow-md">
          <div className="animate-spin rounded-full h-7 w-7 border-t-2 border-orange-500"></div>
        </div>
      ) : activeTab === 'my_requests' ? (
        /* MY REQUESTS & AUDIT HISTORY TABLE */
        <div className="bg-white rounded-xl border border-slate-400 overflow-hidden shadow-md">
          <div className="p-4 border-b border-slate-300 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 className="text-[16px] font-bold text-slate-950">My Request History</h3>
              <p className="text-[12px] text-slate-900 font-normal">Real-time status of your permissions and leave applications</p>
            </div>
            <span className="text-[12px] font-medium text-slate-900">
              Showing {displayedMyLeaves.length} application(s)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#3715ca] text-white">
                  <th className="px-4 py-3 text-[12.5px] font-semibold text-center border border-slate-300 w-16">S.No.</th>
                  <th className="px-4 py-3 text-[12.5px] font-semibold border border-slate-300 w-36">Category</th>
                  <th className="px-4 py-3 text-[12.5px] font-semibold border border-slate-300 w-44">Duration</th>
                  <th className="px-4 py-3 text-[12.5px] font-semibold border border-slate-300 min-w-[200px]">Reason & Purpose</th>
                  <th className="px-4 py-3 text-[12.5px] font-semibold text-center border border-slate-300 w-28">Status</th>
                  <th className="px-4 py-3 text-[12.5px] font-semibold border border-slate-300 min-w-[170px]">Reviewed By</th>
                  <th className="px-4 py-3 text-[12.5px] font-semibold border border-slate-300 w-36">Applied Date</th>
                </tr>
              </thead>
              <tbody>
                {displayedMyLeaves.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-[13px] font-normal text-slate-900 border border-slate-300 text-center">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3 border border-slate-300">
                      <span className="px-2.5 py-1 bg-slate-100 border border-slate-300 text-slate-950 rounded-md text-[11.5px] font-medium uppercase block w-fit">
                        {item.leave_type?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 border border-slate-300 text-[12.5px] text-slate-950 font-normal">
                      <div>{formatDateToDMY(item.start_date)} to {formatDateToDMY(item.end_date)}</div>
                      <span className="text-[11px] font-medium text-slate-900">({item.days} day{item.days > 1 ? 's' : ''})</span>
                    </td>
                    <td className="px-4 py-3 border border-slate-300 text-[13px] font-normal text-slate-950">
                      {item.reason}
                    </td>
                    <td className="px-4 py-3 border border-slate-300 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-medium uppercase ${
                        item.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                          : item.status === 'rejected'
                          ? 'bg-red-100 text-red-950 border border-red-300'
                          : 'bg-amber-100 text-amber-950 border border-amber-300'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 border border-slate-300 text-[12px] text-slate-950 font-normal">
                      {item.reviewer?.full_name ? (
                        <div>
                          <span className="font-semibold text-slate-950 block">{item.reviewer.full_name}</span>
                          <span className="text-[10.5px] text-slate-700 capitalize">({item.reviewer.role?.replace('_', ' ') || 'Admin'})</span>
                        </div>
                      ) : item.status !== 'pending' ? (
                        <span className="text-slate-700 italic text-[11.5px]">Executive Admin</span>
                      ) : (
                        <span className="text-amber-800 text-[11px] font-semibold italic">Pending review</span>
                      )}
                    </td>
                    <td className="px-4 py-3 border border-slate-300 text-[12px] text-slate-900 font-normal">
                      {formatDateToDMY(item.created_at)}
                    </td>
                  </tr>
                ))}
                {displayedMyLeaves.length === 0 && (
                  <tr>
                    <td colSpan="7" className="border border-slate-300 p-8 text-center text-slate-900 italic text-[13px] font-medium">
                      No applications recorded under current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* SUBORDINATES / TEAM LEAVES VIEW (FOR PROJECT HEADS & ADMINS) */
        <div className="bg-white rounded-xl border border-slate-400 overflow-hidden shadow-md">
          <div className="p-4 border-b border-slate-300 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 className="text-[16px] font-bold text-slate-950">
                {isProjectHead ? 'Subordinates & Project Team Members History' : 'All Organization Employee Applications'}
              </h3>
              <p className="text-[12px] text-slate-900 font-normal">
                {isProjectHead 
                  ? 'Audit records of team members allocated to your workspaces. Approvals are managed by the Executive Admin.'
                  : 'Complete log of employee leave and permission requests across all departments.'}
              </p>
            </div>
            <span className="text-[12px] font-medium text-slate-900">
              Showing {displayedTeamLeaves.length} record(s)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#3715ca] text-white">
                  <th className="px-4 py-3 text-[12.5px] font-semibold text-center border border-slate-300 w-16">S.No.</th>
                  <th className="px-4 py-3 text-[12.5px] font-semibold border border-slate-300 min-w-[180px]">Team Member</th>
                  <th className="px-4 py-3 text-[12.5px] font-semibold border border-slate-300 w-32">Type</th>
                  <th className="px-4 py-3 text-[12.5px] font-semibold border border-slate-300 w-44">Duration</th>
                  <th className="px-4 py-3 text-[12.5px] font-semibold border border-slate-300 min-w-[200px]">Reason</th>
                  <th className="px-4 py-3 text-[12.5px] font-semibold text-center border border-slate-300 w-28">Status</th>
                  <th className="px-4 py-3 text-[12.5px] font-semibold border border-slate-300 min-w-[170px]">Reviewed By</th>
                  <th className="px-4 py-3 text-[12.5px] font-semibold border border-slate-300 w-36">Applied Date</th>
                </tr>
              </thead>
              <tbody>
                {displayedTeamLeaves.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-[13px] font-normal text-slate-900 border border-slate-300 text-center">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3 border border-slate-300">
                      <span className="block text-[14px] font-medium text-slate-950">{item.user?.full_name || 'Employee'}</span>
                      <span className="block text-[11px] font-normal text-slate-900">{item.user?.department || 'Staff'} &bull; <span className="capitalize">{item.user?.role?.replace('_', ' ') || 'Member'}</span></span>
                    </td>
                    <td className="px-4 py-3 border border-slate-300">
                      <span className="px-2.5 py-1 bg-slate-100 border border-slate-300 text-slate-950 rounded-md text-[11.5px] font-medium uppercase block w-fit">
                        {item.leave_type?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 border border-slate-300 text-[12.5px] text-slate-950 font-normal">
                      <div>{formatDateToDMY(item.start_date)} to {formatDateToDMY(item.end_date)}</div>
                      <span className="text-[11px] font-medium text-slate-900">({item.days} day{item.days > 1 ? 's' : ''})</span>
                    </td>
                    <td className="px-4 py-3 border border-slate-300 text-[13px] font-normal text-slate-950">
                      {item.reason}
                    </td>
                    <td className="px-4 py-3 border border-slate-300 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-medium uppercase ${
                        item.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                          : item.status === 'rejected'
                          ? 'bg-red-100 text-red-950 border border-red-300'
                          : 'bg-amber-100 text-amber-950 border border-amber-300'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 border border-slate-300 text-[12px] text-slate-950 font-normal">
                      {item.reviewer?.full_name ? (
                        <div>
                          <span className="font-semibold text-slate-950 block">{item.reviewer.full_name}</span>
                          <span className="text-[10.5px] text-slate-700 capitalize">({item.reviewer.role?.replace('_', ' ') || 'Admin'})</span>
                        </div>
                      ) : item.status !== 'pending' ? (
                        <span className="text-slate-700 italic text-[11.5px]">Admin Action</span>
                      ) : (
                        <span className="text-amber-800 text-[11px] font-semibold italic">Pending review</span>
                      )}
                    </td>
                    <td className="px-4 py-3 border border-slate-300 text-[12px] text-slate-900 font-normal">
                      {formatDateToDMY(item.created_at)}
                    </td>
                  </tr>
                ))}
                {displayedTeamLeaves.length === 0 && (
                  <tr>
                    <td colSpan="8" className="border border-slate-300 p-8 text-center text-slate-900 italic text-[13px] font-medium">
                      {isProjectHead 
                        ? 'No subordinate leave applications found.'
                        : 'No employee leave records found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL FOR APPLYING LEAVE OR PERMISSION */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm animate-fade-in-fast">
          <div className="w-full max-w-md bg-white border border-slate-400 rounded-2xl shadow-2xl p-6 text-slate-950 relative animate-scale-up space-y-4">
            <button
              onClick={() => setIsApplyModalOpen(false)}
              className="absolute top-4 right-4 text-slate-900 hover:text-black bg-slate-50 hover:bg-slate-100 p-1.5 rounded-lg border border-slate-300 cursor-pointer"
            >
              <X size={16} />
            </button>

            <div>
              <h3 className="text-[18px] font-bold text-slate-950">Apply Leave or Permission</h3>
              <p className="text-[12px] text-slate-900 font-normal">
                Submits request directly to executive administration for approval
              </p>
            </div>

            <form onSubmit={handleApply} className="space-y-3.5 pt-1">
              <div>
                <label className="block text-[11px] font-medium text-slate-900 mb-1">Applicant</label>
                <div className="bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-[13px] text-slate-950 font-medium">
                  {user?.full_name} <span className="text-[11px] text-slate-800">({user?.role?.replace('_', ' ')})</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-900 mb-1">Request Category</label>
                <select
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-[13px] font-normal text-slate-950 focus:bg-white focus:outline-none"
                >
                  <option value="permission">Official Permission / Short Leave</option>
                  <option value="half_day">Half Day Leave</option>
                  <option value="casual">Casual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="earned">Earned Leave</option>
                  <option value="emergency">Emergency Leave</option>
                  <option value="unpaid">Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-900 mb-1">From Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-[12px] font-normal text-slate-950 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-900 mb-1">To Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-[12px] font-normal text-slate-950 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-900 mb-1">Duration / Total Days</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  required
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-[13px] font-normal text-slate-950 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-900 mb-1">Reason / Note for Absence</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Specify brief justification or timing details..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-[13px] font-normal text-slate-950 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl text-[12px] font-medium border border-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-[12px] font-medium shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {submitting && <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-white"></div>}
                  <span>Submit Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
