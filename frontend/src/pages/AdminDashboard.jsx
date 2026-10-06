import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Users, 
  UserCheck, 
  FolderKanban, 
  TrendingUp, 
  Clock, 
  ArrowRight, 
  DollarSign 
} from 'lucide-react';
import API_URL from '../config';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalClients: 0,
    activeProjects: 0,
    totalEmployees: 0,
    totalBudget: 0
  });
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Indian currency formatter
  const formatRupee = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  useEffect(() => {
    const fetchData = async () => {
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

        const totalBudget = projectsData.reduce((acc, curr) => acc + Number(curr.budget || 0), 0);

        setStats({
          totalClients: clientsData.length,
          activeProjects: projectsData.filter(p => p.status === 'active').length,
          totalEmployees: usersData.length,
          totalBudget: totalBudget
        });
      } catch (error) {
        console.error('Error fetching admin dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const chartData = [
    { name: 'Apr', budget: 400000 },
    { name: 'May', budget: 1200000 },
    { name: 'Jun', budget: 900000 },
    { name: 'Jul', budget: 1800000 },
    { name: 'Aug', budget: stats.totalBudget || 1500000 }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in text-slate-950">
      {/* Page Header */}
      <div>
        <h2 className="text-[22px] font-bold text-slate-950 tracking-tight">Executive Dashboard</h2>
        <p className="text-[13px] text-slate-900 font-normal">Real-time overview of client onboarding, workspace portfolio, and capital resources</p>
      </div>

      {/* Overview Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {/* Total Clients */}
        <div className="bg-gradient-to-br from-indigo-100/70 to-indigo-50/40 border border-slate-400 rounded-2xl shadow-md p-5 flex items-start justify-between transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg">
          <div className="space-y-2">
            <span className="text-[11px] font-medium text-indigo-950 uppercase tracking-widest block">Total Clients</span>
            <div className="flex items-baseline gap-2">
              <h3 className="text-[30px] font-bold text-slate-950 tracking-tight">{stats.totalClients}</h3>
              <span className="text-[11px] font-medium text-emerald-950 flex items-center gap-0.5 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded-full">
                <TrendingUp size={10} className="stroke-[3]" />
                +12%
              </span>
            </div>
          </div>
          <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-600/10">
            <UserCheck size={20} className="stroke-[2.5]" />
          </div>
        </div>

        {/* Active Projects */}
        <div className="bg-gradient-to-br from-orange-100/70 to-orange-50/40 border border-slate-400 rounded-2xl shadow-md p-5 flex items-start justify-between transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg">
          <div className="space-y-2">
            <span className="text-[11px] font-medium text-orange-950 uppercase tracking-widest block">Active Projects</span>
            <div className="flex items-baseline gap-2">
              <h3 className="text-[30px] font-bold text-slate-950 tracking-tight">{stats.activeProjects}</h3>
              <span className="text-[11px] font-medium text-emerald-950 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                On Track
              </span>
            </div>
          </div>
          <div className="p-3 bg-orange-600 rounded-xl text-white shadow-md shadow-orange-600/10">
            <FolderKanban size={20} className="stroke-[2.5]" />
          </div>
        </div>

        {/* Headcount */}
        <div className="bg-gradient-to-br from-emerald-100/70 to-emerald-50/40 border border-slate-400 rounded-2xl shadow-md p-5 flex items-start justify-between transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg">
          <div className="space-y-2">
            <span className="text-[11px] font-medium text-emerald-950 uppercase tracking-widest block">Headcount (HR)</span>
            <div className="flex items-baseline gap-2">
              <h3 className="text-[30px] font-bold text-slate-950 tracking-tight">{stats.totalEmployees}</h3>
              <span className="text-[11px] font-medium text-emerald-950 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                Resourceful
              </span>
            </div>
          </div>
          <div className="p-3 bg-emerald-600 rounded-xl text-white shadow-md shadow-emerald-600/10">
            <Users size={20} className="stroke-[2.5]" />
          </div>
        </div>

        {/* Portfolio Budget */}
        <div className="bg-gradient-to-br from-amber-100/70 to-amber-50/40 border border-slate-400 rounded-2xl shadow-md p-5 flex items-start justify-between transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg">
          <div className="space-y-2">
            <span className="text-[11px] font-medium text-amber-950 uppercase tracking-widest block">Portfolio Budget</span>
            <div className="flex items-baseline gap-2">
              <h3 className="text-[22px] font-bold text-slate-950 tracking-tight">
                {formatRupee(stats.totalBudget)}
              </h3>
            </div>
          </div>
          <div className="p-3 bg-amber-600 rounded-xl text-white shadow-md shadow-amber-600/10">
            <DollarSign size={20} className="stroke-[2.5]" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart View */}
        <div className="lg:col-span-2 space-y-4">
          <div>
            <h3 className="text-[17px] font-bold text-slate-950 tracking-tight">Portfolio Budget Evolution</h3>
            <p className="text-[12px] text-slate-900 font-normal">Visual trend of budget allocations across onboarded projects</p>
          </div>
          <div className="h-80 bg-white p-5 rounded-2xl border border-slate-400 shadow-md">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorBudget" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ea580c" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#ea580c" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#0f172a" fontSize={11} tickLine={false} axisLine={false} style={{ fontWeight: '500' }} />
                <YAxis 
                  stroke="#0f172a" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                  style={{ fontWeight: '500' }}
                  tickFormatter={(val) => `₹${val/100000}L`} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', borderWidth: '1px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                  labelStyle={{ color: '#0f172a', fontWeight: '700', fontSize: '12px' }}
                  itemStyle={{ color: '#ea580c', fontWeight: '500', fontSize: '12px' }}
                  formatter={(val) => [formatRupee(val), 'Budget']}
                />
                <Area type="monotone" dataKey="budget" stroke="#ea580c" strokeWidth={3} fillOpacity={1} fill="url(#colorBudget)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Client onboard summaries */}
        <div className="space-y-4">
          <div>
            <h3 className="text-[17px] font-bold text-slate-950 tracking-tight">Recent Enquiries</h3>
            <p className="text-[12px] text-slate-900 font-normal">Quick view of sales funnel statuses</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-400 divide-y divide-slate-300 shadow-md overflow-hidden">
            {clients.slice(0, 4).map((client) => {
              const initials = client.name ? client.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'C';
              return (
                <div key={client.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-700 border border-orange-200 flex items-center justify-center font-bold text-[12px]">
                      {initials}
                    </div>
                    <div>
                      <h4 className="text-[13.5px] font-bold text-slate-900 leading-tight">{client.name}</h4>
                      <span className="text-[11px] text-slate-900 font-normal block mt-0.5">{client.company || 'Private Partner'}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-medium uppercase px-2.5 py-1 rounded-full border ${
                    client.status === 'onboarded' 
                      ? 'bg-emerald-100 text-emerald-950 border-emerald-400' 
                      : client.status === 'follow_up'
                      ? 'bg-blue-100 text-blue-950 border-blue-400'
                      : 'bg-slate-100 text-slate-950 border-slate-300'
                  }`}>
                    {client.status === 'follow_up' ? 'Follow Up' : client.status}
                  </span>
                </div>
              );
            })}
            {clients.length === 0 && (
              <div className="p-8 text-center text-slate-950 font-normal text-[13px]">No clients registered.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
