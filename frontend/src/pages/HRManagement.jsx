import React, { useEffect, useState } from 'react';
import { 
  Users, 
  UserPlus, 
  FileText, 
  Upload, 
  Edit3, 
  Search, 
  Briefcase 
} from 'lucide-react';
import API_URL from '../config';

export default function HRManagement() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [passwordHash, setPasswordHash] = useState('');
  const [role, setRole] = useState('team_member');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [phone, setPhone] = useState('');
  const [docName, setDocName] = useState('');

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${API_URL}/users`);
      const data = await response.json();
      setEmployees(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email,
          password_hash: passwordHash || 'member123',
          role,
          department,
          designation,
          phone
        })
      });
      if (response.ok) {
        setIsModalOpen(false);
        setFullName('');
        setEmail('');
        setPasswordHash('');
        setDepartment('');
        setDesignation('');
        setPhone('');
        fetchEmployees();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddDocument = async (employee) => {
    if (!docName.trim()) return;
    const currentDocs = employee.documents || [];
    const updatedDocs = [...currentDocs, { name: docName }];

    try {
      const response = await fetch(`${API_URL}/users/${employee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents: updatedDocs })
      });
      if (response.ok) {
        setDocName('');
        setSelectedEmployee(null);
        fetchEmployees();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-[20px] font-bold text-zinc-100 tracking-tight">HR & Personnel Directory</h2>
          <p className="text-[13px] text-zinc-500">Manage employee profile details, credentials, and document deposits</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-[14px] font-semibold transition-all shadow-md shadow-indigo-600/15"
        >
          <UserPlus size={16} />
          <span>Add Employee</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#27272a] bg-[#141416]/50">
                  <th className="p-4 text-[14px] font-bold text-zinc-400">Employee</th>
                  <th className="p-4 text-[14px] font-bold text-zinc-400">Org Details</th>
                  <th className="p-4 text-[14px] font-bold text-zinc-400">System Role</th>
                  <th className="p-4 text-[14px] font-bold text-zinc-400">Documents Deposited</th>
                  <th className="p-4 text-[14px] font-bold text-zinc-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]">
                {employees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-[#202024]/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-zinc-800 rounded-full flex items-center justify-center text-[13px] font-bold uppercase text-zinc-200">
                          {employee.full_name?.substring(0, 2)}
                        </div>
                        <div>
                          <span className="block text-[15px] font-bold text-zinc-200">{employee.full_name}</span>
                          <span className="block text-[13px] text-zinc-500">{employee.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="block text-[14px] text-zinc-300">{employee.designation || 'Unspecified'}</span>
                      <span className="block text-[12px] text-zinc-500">{employee.department || 'No department'}</span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-block text-[11px] font-bold uppercase px-2.5 py-1 rounded-full ${
                        employee.role === 'admin'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : employee.role === 'project_head'
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                      }`}>
                        {employee.role?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1.5 max-w-xs">
                        {(employee.documents || []).map((doc, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 bg-[#202024] border border-[#27272a] text-[12px] text-zinc-300 px-2 py-0.5 rounded">
                            <FileText size={11} className="text-zinc-500" />
                            {doc.name}
                          </span>
                        ))}
                        {(employee.documents || []).length === 0 && (
                          <span className="text-[13px] text-zinc-600">None uploaded</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedEmployee(employee)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#202024] hover:bg-[#27272a] text-zinc-300 rounded-lg text-[13px] font-medium transition-colors"
                      >
                        <Upload size={13} />
                        <span>Add Doc</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* NEW EMPLOYEE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#18181b] border border-[#27272a] rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-[18px] font-bold text-zinc-100">Add New Organization Employee</h3>
              <p className="text-[13px] text-zinc-500">Configure profile records & login details</p>
            </div>
            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-zinc-400 mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[#202024] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-zinc-200 text-[16px] focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-semibold text-zinc-400 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#202024] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-zinc-200 text-[16px] focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-zinc-400 mb-1.5">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="e.g. member123"
                    value={passwordHash}
                    onChange={(e) => setPasswordHash(e.target.value)}
                    className="w-full bg-[#202024] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-zinc-200 text-[16px] focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-semibold text-zinc-400 mb-1.5">Department</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Engineering"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-[#202024] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-zinc-200 text-[16px] focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-zinc-400 mb-1.5">Designation</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Frontend Dev"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full bg-[#202024] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-zinc-200 text-[16px] focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-semibold text-zinc-400 mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#202024] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-zinc-200 text-[16px] focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-zinc-400 mb-1.5">Platform Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-[#202024] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-zinc-200 text-[16px] focus:outline-none focus:border-indigo-500"
                  >
                    <option value="admin">Admin</option>
                    <option value="project_head">Project Head</option>
                    <option value="team_member">Team Member</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-[#202024] hover:bg-[#27272a] text-zinc-300 rounded-xl text-[14px] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[14px] font-semibold shadow-md shadow-indigo-600/15"
                >
                  Create Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOCUMENT DEPOSIT MODAL */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#18181b] border border-[#27272a] rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-[18px] font-bold text-zinc-100">Deposit Employee Document</h3>
              <p className="text-[13px] text-zinc-500">Add credentials for {selectedEmployee.full_name}</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-zinc-400 mb-1.5">Document Label Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PAN_Card.pdf"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  className="w-full bg-[#202024] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-zinc-200 text-[16px] focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedEmployee(null)}
                  className="px-4 py-2.5 bg-[#202024] hover:bg-[#27272a] text-zinc-300 rounded-xl text-[14px] font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAddDocument(selectedEmployee)}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[14px] font-semibold"
                >
                  Deposit Doc
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
