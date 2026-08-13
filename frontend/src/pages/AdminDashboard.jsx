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
    <div className="space-y-8 animate-fade-in">
      {/* Overview Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {/* Total Clients */}
        <div className="bg-white border border-slate-400 rounded-xl shadow-md p-6 flex items-start justify-between">
          <div className="space-y-2">
            <span className="text-[12px] font-extrabold text-slate-900 uppercase tracking-widest block">Total Clients</span>
            <div className="flex items-baseline gap-2">
              <h3 className="text-[28px] font-extrabold text-slate-950 tracking-tight">{stats.totalClients}</h3>
              <span className="text-[12px] font-extrabold text-emerald-700 flex items-center gap-0.5 bg-emerald-50 border border-emerald-300 px-1.5 py-0.5 rounded">
                <TrendingUp size={12} className="stroke-[2.5]" />
                +12%
              </span>
            </div>
          </div>
          <div className="p-3 bg-slate-100 rounded-lg border border-slate-300 text-slate-900">
            <UserCheck size={20} className="stroke-[2.5]" />
          </div>
        </div>

        {/* Active Projects */}
        <div className="bg-white border border-slate-400 rounded-xl shadow-md p-6 flex items-start justify-between">
          <div className="space-y-2">
            <span className="text-[12px] font-extrabold text-slate-900 uppercase tracking-widest block">Active Projects</span>
            <div className="flex items-baseline gap-2">
              <h3 className="text-[28px] font-extrabold text-slate-950 tracking-tight">{stats.activeProjects}</h3>
              <span className="text-[12px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-300 px-1.5 py-0.5 rounded">
                On Track
              </span>
            </div>
          </div>
          <div className="p-3 bg-slate-100 rounded-lg border border-slate-300 text-slate-900">
            <FolderKanban size={20} className="stroke-[2.5]" />
          </div>
        </div>

        {/* Headcount */}
        <div className="bg-white border border-slate-400 rounded-xl shadow-md p-6 flex items-start justify-between">
          <div className="space-y-2">
            <span className="text-[12px] font-extrabold text-slate-900 uppercase tracking-widest block">Headcount (HR)</span>
            <div className="flex items-baseline gap-2">
              <h3 className="text-[28px] font-extrabold text-slate-950 tracking-tight">{stats.totalEmployees}</h3>
              <span className="text-[12px] font-semibold text-slate-900 bg-slate-100 border border-slate-300 px-1.5 py-0.5 rounded">
                Employees
              </span>
            </div>
          </div>
          <div className="p-3 bg-slate-100 rounded-lg border border-slate-300 text-slate-900">
            <Users size={20} className="stroke-[2.5]" />
          </div>
        </div>

        {/* Portfolio Budget */}
        <div className="bg-white border border-slate-400 rounded-xl shadow-md p-6 flex items-start justify-between">
          <div className="space-y-2">
            <span className="text-[12px] font-extrabold text-slate-900 uppercase tracking-widest block">Total Portfolio Budget</span>
            <div className="flex items-baseline gap-2">
              <h3 className="text-[24px] font-extrabold text-emerald-800 tracking-tight">
                {formatRupee(stats.totalBudget)}
              </h3>
            </div>
          </div>
          <div className="p-3 bg-slate-100 rounded-lg border border-slate-300 text-slate-900">
            <DollarSign size={20} className="stroke-[2.5]" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart View */}
        <div className="lg:col-span-2 space-y-4">
          <div>
            <h3 className="text-[18px] font-bold text-slate-950 tracking-tight">Portfolio Budget Evolution</h3>
            <p className="text-[13px] text-slate-700 font-medium">Visual trend of budget allocations across onboarded projects</p>
          </div>
          <div className="h-80 bg-white p-6 rounded-xl border border-slate-400 shadow-md">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorBudget" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ea580c" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#ea580c" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} style={{ fontWeight: '600' }} />
                <YAxis 
                  stroke="#475569" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  style={{ fontWeight: '600' }}
                  tickFormatter={(val) => `₹${val/100000}L`} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', borderWidth: '1px' }}
                  labelStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                  itemStyle={{ color: '#0f172a', fontWeight: 'medium' }}
                  formatter={(val) => [formatRupee(val), 'Budget']}
                />
                <Area type="monotone" dataKey="budget" stroke="#ea580c" strokeWidth={2.5} fillOpacity={1} fill="url(#colorBudget)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Client onboard summaries */}
        <div className="space-y-4">
          <div>
            <h3 className="text-[18px] font-bold text-slate-950 tracking-tight">Recent Client Enquiries</h3>
            <p className="text-[13px] text-slate-700 font-medium">Quick view of sales funnel statuses</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-400 divide-y divide-slate-300 shadow-md">
            {clients.slice(0, 4).map((client) => (
              <div key={client.id} className="p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-[14px] font-bold text-slate-900">{client.name}</h4>
                  <span className="text-[12px] text-slate-700 font-medium">{client.company || 'Private Lead'}</span>
                </div>
                <span className={`text-[11px] font-bold uppercase px-2.5 py-1 rounded-full ${
                  client.status === 'onboarded' 
                    ? 'bg-emerald-100 text-emerald-950 border border-emerald-400' 
                    : client.status === 'follow_up'
                    ? 'bg-blue-100 text-blue-950 border border-blue-400'
                    : 'bg-slate-200 text-slate-950 border border-slate-400'
                }`}>
                  {client.status}
                </span>
              </div>
            ))}
            {clients.length === 0 && (
              <div className="p-8 text-center text-slate-800 font-medium text-[14px]">No clients registered.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
