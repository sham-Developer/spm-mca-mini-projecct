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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-[20px] font-bold text-zinc-100 tracking-tight">Clients Pipeline</h2>
          <p className="text-[13px] text-zinc-500">Nurture leads, log follow ups, and onboard projects</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-[14px] font-semibold transition-all shadow-md shadow-indigo-600/15"
        >
          <Plus size={16} />
          <span>New Lead</span>
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
                  <th className="p-4 text-[14px] font-bold text-zinc-400">Client / Company</th>
                  <th className="p-4 text-[14px] font-bold text-zinc-400">Contact</th>
                  <th className="p-4 text-[14px] font-bold text-zinc-400">Status</th>
                  <th className="p-4 text-[14px] font-bold text-zinc-400">Last Action</th>
                  <th className="p-4 text-[14px] font-bold text-zinc-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]">
                {clients.map((client) => {
                  const lastNote = client.follow_up_notes?.length > 0 
                    ? client.follow_up_notes[client.follow_up_notes.length - 1] 
                    : null;

                  return (
                    <tr key={client.id} className="hover:bg-[#202024]/50 transition-colors">
                      <td className="p-4">
                        <span className="block text-[15px] font-bold text-zinc-200">{client.name}</span>
                        <span className="block text-[13px] text-zinc-500">{client.company || 'Private Client'}</span>
                      </td>
                      <td className="p-4">
                        <span className="block text-[14px] text-zinc-300">{client.email}</span>
                        <span className="block text-[12px] text-zinc-500">{client.phone || '--'}</span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-block text-[11px] font-bold uppercase px-2.5 py-1 rounded-full ${
                          client.status === 'onboarded' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : client.status === 'follow_up'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        }`}>
                          {client.status}
                        </span>
                      </td>
                      <td className="p-4 max-w-xs truncate">
                        {lastNote ? (
                          <div>
                            <span className="block text-[12px] text-zinc-500">{lastNote.date}</span>
                            <span className="text-[13px] text-zinc-300 italic">"{lastNote.note}"</span>
                          </div>
                        ) : (
                          <span className="text-zinc-600 text-[13px]">No interaction logged</span>
                        )}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {client.status !== 'onboarded' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedClient(client);
                                setIsFollowupModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#202024] hover:bg-[#27272a] text-zinc-300 rounded-lg text-[13px] font-medium transition-colors"
                            >
                              <MessageSquare size={14} />
                              <span>Follow Up</span>
                            </button>
                            <button
                              onClick={() => handleOnboardClient(client)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 rounded-lg text-[13px] font-medium transition-colors border border-emerald-500/20"
                            >
                              <UserCheck size={14} />
                              <span>Onboard</span>
                            </button>
                          </>
                        )}
                        {client.status === 'onboarded' && (
                          <span className="text-[13px] text-emerald-500 font-semibold flex items-center justify-end gap-1">
                            <Check size={14} /> Onboarded
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {clients.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-zinc-500 text-[14px]">No clients pipeline records found. Add a lead above.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* NEW LEAD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#18181b] border border-[#27272a] rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-[18px] font-bold text-zinc-100">Add New Sales Lead</h3>
              <p className="text-[13px] text-zinc-500">Initiate a new client profile in pipeline</p>
            </div>
            <form onSubmit={handleCreateClient} className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-zinc-400 mb-1.5">Client Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#202024] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-zinc-200 text-[16px] focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-zinc-400 mb-1.5">Company Name</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full bg-[#202024] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-zinc-200 text-[16px] focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-semibold text-zinc-400 mb-1.5">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#202024] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-zinc-200 text-[16px] focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-zinc-400 mb-1.5">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#202024] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-zinc-200 text-[16px] focus:outline-none focus:border-indigo-500"
                  />
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
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOLLOW UP MODAL */}
      {isFollowupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#18181b] border border-[#27272a] rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-[18px] font-bold text-zinc-100">Log Follow Up Discussion</h3>
              <p className="text-[13px] text-zinc-500">Record note for {selectedClient?.name}</p>
            </div>
            <form onSubmit={handleAddFollowup} className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-zinc-400 mb-1.5">Interaction Summary</label>
                <textarea
                  required
                  rows="3"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="e.g. Sent draft service scope agreement; requested review by Friday."
                  className="w-full bg-[#202024] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-zinc-200 text-[16px] focus:outline-none focus:border-indigo-500"
                ></textarea>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsFollowupModalOpen(false)}
                  className="px-4 py-2.5 bg-[#202024] hover:bg-[#27272a] text-zinc-300 rounded-xl text-[14px] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[14px] font-semibold shadow-md shadow-indigo-600/15"
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
