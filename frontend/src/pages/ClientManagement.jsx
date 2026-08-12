import React, { useEffect, useState } from 'react';
import { 
  UserCheck, 
  Calendar, 
  MessageSquare, 
  Plus, 
  Check, 
  UserPlus, 
  Search, 
  ChevronsRight 
} from 'lucide-react';
import API_URL from '../config';

export default function ClientManagement() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFollowupModalOpen, setIsFollowupModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [newNote, setNewNote] = useState('');

  const fetchClients = async () => {
    try {
      const response = await fetch(`${API_URL}/clients`);
      const data = await response.json();
      setClients(data);
    } catch (e) {
      console.error('Error fetching clients:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleCreateClient = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, company, status: 'lead' })
      });
      if (response.ok) {
        setIsModalOpen(false);
        setName('');
        setEmail('');
        setPhone('');
        setCompany('');
        fetchClients();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddFollowup = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    const updatedNotes = [
      ...(selectedClient.follow_up_notes || []),
      { date: new Date().toISOString().split('T')[0], note: newNote }
    ];

    try {
      const response = await fetch(`${API_URL}/clients/${selectedClient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ follow_up_notes: updatedNotes, status: 'follow_up' })
      });
      if (response.ok) {
        setIsFollowupModalOpen(false);
        setNewNote('');
        fetchClients();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOnboardClient = async (client) => {
    try {
      const response = await fetch(`${API_URL}/clients/${client.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'onboarded', onboarded_at: new Date().toISOString() })
      });
      if (response.ok) {
        fetchClients();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-[20px] font-bold text-slate-950 tracking-tight">Clients Pipeline</h2>
          <p className="text-[13px] text-slate-700 font-medium">Nurture leads, log follow ups, and onboard projects</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-4 py-2.5 rounded-xl text-[14px] font-semibold transition-all shadow-md shadow-orange-600/15 self-start sm:self-auto cursor-pointer"
        >
          <Plus size={16} className="stroke-[2]" />
          <span>New Lead</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-500"></div>
        </div>
      ) : (
        <div className="bg-white border border-slate-400 rounded-xl overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-400 bg-slate-100">
                  <th className="p-4 text-[13px] font-bold text-slate-950 uppercase tracking-wider">Client / Company</th>
                  <th className="p-4 text-[13px] font-bold text-slate-900 uppercase tracking-wider">Contact</th>
                  <th className="p-4 text-[13px] font-bold text-slate-900 uppercase tracking-wider">Status</th>
                  <th className="p-4 text-[13px] font-bold text-slate-900 uppercase tracking-wider">Last Action</th>
                  <th className="p-4 text-[13px] font-bold text-slate-900 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {clients.map((client) => {
                  const lastNote = client.follow_up_notes?.length > 0 
                    ? client.follow_up_notes[client.follow_up_notes.length - 1] 
                    : null;

                  return (
                    <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <span className="block text-[15px] font-bold text-slate-950">{client.name}</span>
                        <span className="block text-[13px] text-slate-700 font-semibold">{client.company || 'Private Client'}</span>
                      </td>
                      <td className="p-4">
                        <span className="block text-[14px] text-slate-900 font-semibold">{client.email}</span>
                        <span className="block text-[12px] text-slate-700 font-medium">{client.phone || '--'}</span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-block text-[11px] font-bold uppercase px-2.5 py-1 rounded-full ${
                          client.status === 'onboarded' 
                            ? 'bg-emerald-100 text-emerald-950 border border-emerald-400' 
                            : client.status === 'follow_up'
                            ? 'bg-blue-100 text-blue-950 border border-blue-400'
                            : 'bg-slate-200 text-slate-950 border border-slate-400'
                        }`}>
                          {client.status}
                        </span>
                      </td>
                      <td className="p-4 max-w-xs truncate">
                        {lastNote ? (
                          <div>
                            <span className="block text-[12px] text-slate-700 font-bold">{lastNote.date}</span>
                            <span className="text-[13px] text-slate-900 font-medium italic">"{lastNote.note}"</span>
                          </div>
                        ) : (
                          <span className="text-slate-600 text-[13px] font-medium">No interaction logged</span>
                        )}
                      </td>
                      <td className="p-4 text-right space-y-1.5 sm:space-y-0 sm:space-x-2">
                        {client.status !== 'onboarded' && (
                          <div className="inline-flex flex-col sm:flex-row gap-1.5 justify-end">
                            <button
                               onClick={() => {
                                 setSelectedClient(client);
                                 setIsFollowupModalOpen(true);
                               }}
                               className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-950 rounded-lg text-[13px] font-bold transition-colors border border-slate-400 shadow-sm cursor-pointer"
                            >
                              <MessageSquare size={14} className="text-slate-800 stroke-[2]" />
                              <span>Follow Up</span>
                            </button>
                            <button
                              onClick={() => handleOnboardClient(client)}
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-lg text-[13px] font-bold transition-colors border border-emerald-400 shadow-sm cursor-pointer"
                            >
                              <UserCheck size={14} className="stroke-[2]" />
                              <span>Onboard</span>
                            </button>
                          </div>
                        )}
                        {client.status === 'onboarded' && (
                          <span className="text-[13px] text-emerald-800 font-bold flex items-center justify-end gap-1">
                            <Check size={14} className="stroke-[2]" /> Onboarded
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {clients.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-700 text-[14px] font-medium">No clients pipeline records found. Add a lead above.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* NEW LEAD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-300 rounded-2xl p-6 space-y-6 shadow-xl">
            <div>
              <h3 className="text-[18px] font-bold text-slate-900">Add New Sales Lead</h3>
              <p className="text-[13px] text-slate-800 font-medium">Initiate a new client profile in pipeline</p>
            </div>
            <form onSubmit={handleCreateClient} className="space-y-4">
              <div>
                <label className="block text-[13px] font-bold text-slate-800 mb-1.5">Client Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 text-[16px] focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-slate-800 mb-1.5">Company Name</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 text-[16px] focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-slate-800 mb-1.5">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 text-[16px] focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-slate-800 mb-1.5">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 text-[16px] focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-xl text-[14px] font-bold border border-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-[14px] font-semibold shadow-md shadow-orange-600/15 cursor-pointer"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOLLOW UP MODAL */}
      {isFollowupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-300 rounded-2xl p-6 space-y-6 shadow-xl">
            <div>
              <h3 className="text-[18px] font-bold text-slate-900">Log Follow Up Discussion</h3>
              <p className="text-[13px] text-slate-800 font-medium">Record note for {selectedClient?.name}</p>
            </div>
            <form onSubmit={handleAddFollowup} className="space-y-4">
              <div>
                <label className="block text-[13px] font-bold text-slate-800 mb-1.5">Interaction Summary</label>
                <textarea
                  required
                  rows="3"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="e.g. Sent draft service scope agreement; requested review by Friday."
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 text-[16px] focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                ></textarea>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsFollowupModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-xl text-[14px] font-bold border border-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-[14px] font-semibold shadow-md shadow-orange-600/15 cursor-pointer"
                >
                  Log Action
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
