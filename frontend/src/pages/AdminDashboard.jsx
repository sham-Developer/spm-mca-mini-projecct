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
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Overview Analytics Banner without card grouping */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-[#18181b] p-6 rounded-xl border border-[#27272a]">
        <div className="space-y-1">
          <span className="text-[12px] font-bold text-zinc-500 uppercase tracking-widest">Total Clients</span>
          <div className="flex items-baseline gap-2">
            <h3 className="text-[28px] font-extrabold text-zinc-100 tracking-tight">{stats.totalClients}</h3>
            <span className="text-[12px] font-semibold text-emerald-500 flex items-center gap-0.5">
              <TrendingUp size={12} />
              +12%
            </span>
          </div>
        </div>

        <div className="space-y-1 md:border-l md:border-[#27272a] md:pl-6">
          <span className="text-[12px] font-bold text-zinc-500 uppercase tracking-widest">Active Projects</span>
          <div className="flex items-baseline gap-2">
            <h3 className="text-[28px] font-extrabold text-zinc-100 tracking-tight">{stats.activeProjects}</h3>
            <span className="text-[12px] text-zinc-400">On Track</span>
          </div>
        </div>

        <div className="space-y-1 md:border-l md:border-[#27272a] md:pl-6">
          <span className="text-[12px] font-bold text-zinc-500 uppercase tracking-widest">Headcount (HR)</span>
          <div className="flex items-baseline gap-2">
            <h3 className="text-[28px] font-extrabold text-zinc-100 tracking-tight">{stats.totalEmployees}</h3>
            <span className="text-[12px] text-zinc-400">Employees</span>
          </div>
        </div>

        <div className="space-y-1 md:border-l md:border-[#27272a] md:pl-6">
          <span className="text-[12px] font-bold text-zinc-500 uppercase tracking-widest">Total Portfolio Budget</span>
          <div className="flex items-baseline gap-2">
            <h3 className="text-[24px] font-extrabold text-emerald-400 tracking-tight">
              {formatRupee(stats.totalBudget)}
            </h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart View */}
        <div className="lg:col-span-2 space-y-4">
          <div>
            <h3 className="text-[18px] font-bold text-zinc-100 tracking-tight">Portfolio Budget Evolution</h3>
            <p className="text-[13px] text-zinc-500">Visual trend of budget allocations across onboarded projects</p>
          </div>
          <div className="h-80 bg-[#18181b] p-6 rounded-xl border border-[#27272a]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorBudget" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis 
                  stroke="#71717a" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => `₹${val/100000}L`} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                  labelStyle={{ color: '#a1a1aa', fontWeight: 'bold' }}
                  itemStyle={{ color: '#e4e4e7' }}
                  formatter={(val) => [formatRupee(val), 'Budget']}
                />
                <Area type="monotone" dataKey="budget" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorBudget)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Client onboard summaries */}
        <div className="space-y-4">
          <div>
            <h3 className="text-[18px] font-bold text-zinc-100 tracking-tight">Recent Client Enquiries</h3>
            <p className="text-[13px] text-zinc-500">Quick view of sales funnel statuses</p>
          </div>

          <div className="bg-[#18181b] rounded-xl border border-[#27272a] divide-y divide-[#27272a]">
            {clients.slice(0, 4).map((client) => (
              <div key={client.id} className="p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-[14px] font-semibold text-zinc-200">{client.name}</h4>
                  <span className="text-[12px] text-zinc-500">{client.company || 'Private Lead'}</span>
                </div>
                <span className={`text-[11px] font-semibold uppercase px-2.5 py-1 rounded-full ${
                  client.status === 'onboarded' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : client.status === 'follow_up'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                }`}>
                  {client.status}
                </span>
              </div>
            ))}
            {clients.length === 0 && (
              <div className="p-8 text-center text-zinc-500 text-[14px]">No clients registered.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
