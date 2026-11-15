import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Users, 
  UserCheck, 
  FolderKanban, 
  TrendingUp, 
  DollarSign,
  ArrowUpRight
} from '../components/Iconify';
import { Link } from 'react-router-dom';
import API_URL from '../config';
import { MetricCardSkeleton, Skeleton } from '../components/Skeleton';
import { cachedFetch, invalidateClientCache } from '../utils/clientCache';
import { getSocket } from '../socket';

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

  // Currency formatter
  const formatRupee = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const fetchData = async () => {
    try {
      const [clientsRes, projectsRes, usersRes] = await Promise.all([
        cachedFetch(`${API_URL}/clients`),
        cachedFetch(`${API_URL}/projects`),
        cachedFetch(`${API_URL}/users`)
      ]);
      const clientsData = clientsRes.data || [];
      const projectsData = projectsRes.data || [];
      const usersData = usersRes.data || [];

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

  useEffect(() => {
    fetchData();

    // Real-time live synchronization over WebSocket
    const socket = getSocket();
    const handleDbChange = (event) => {
      if (['clients', 'projects', 'users'].includes(event?.type)) {
        invalidateClientCache();
        fetchData();
      }
    };

    socket.on('db_changed', handleDbChange);
    return () => {
      socket.off('db_changed', handleDbChange);
    };
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
      <div className="space-y-8 animate-fade-in-fast">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>

        {/* 4 Metrics Skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </div>

        {/* Chart & Leads Skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-300 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
          <div className="bg-white border border-slate-300 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="space-y-3 pt-2">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="flex items-center gap-3 p-2 border border-slate-100 rounded-xl">
                  <Skeleton className="w-9 h-9 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col justify-between gap-3 sm:gap-4 animate-fade-in text-slate-900 overflow-hidden">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shrink-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight">Executive Overview</h2>
          <p className="text-[12px] sm:text-[13px] text-slate-500 mt-0.5">High-level enterprise performance metrics and operations status</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/projects"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <span>Manage Projects</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 shrink-0">
        {/* Total Clients */}
        <div className="bg-white border border-slate-300 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 shadow-sm hover:border-slate-400 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-600 uppercase tracking-wider">Total Clients</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center border border-blue-200/80">
              <UserCheck size={18} className="stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3 flex items-baseline justify-between">
            <h3 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">{stats.totalClients}</h3>
            <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
              <TrendingUp size={11} /> +12% MoM
            </span>
          </div>
        </div>

        {/* Active Projects */}
        <div className="bg-white border border-slate-300 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 shadow-sm hover:border-slate-400 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-600 uppercase tracking-wider">Active Projects</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center border border-orange-200/80">
              <FolderKanban size={18} className="stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3 flex items-baseline justify-between">
            <h3 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">{stats.activeProjects}</h3>
            <span className="text-[10px] sm:text-[11px] font-semibold text-blue-800 bg-blue-100 border border-blue-300 px-2 py-0.5 rounded-full">
              On Schedule
            </span>
          </div>
        </div>

        {/* Total Headcount */}
        <div className="bg-white border border-slate-300 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 shadow-sm hover:border-slate-400 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-600 uppercase tracking-wider">HR Headcount</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200/80">
              <Users size={18} className="stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3 flex items-baseline justify-between">
            <h3 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">{stats.totalEmployees}</h3>
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-800 bg-slate-200/80 border border-slate-300 px-2 py-0.5 rounded-full">
              Full Team
            </span>
          </div>
        </div>

        {/* Portfolio Budget */}
        <div className="bg-white border border-slate-300 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 shadow-sm hover:border-slate-400 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-600 uppercase tracking-wider">Allocated Budget</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center border border-indigo-200/80">
              <DollarSign size={18} className="stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3 flex items-baseline justify-between">
            <h3 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
              {formatRupee(stats.totalBudget)}
            </h3>
            <span className="text-[10px] sm:text-[11px] font-semibold text-indigo-800 bg-indigo-100 border border-indigo-300 px-2 py-0.5 rounded-full">
              Committed
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Chart & Pipeline Summary (Fills remaining screen height seamlessly) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 flex-1 min-h-0">
        {/* Chart View */}
        <div className="lg:col-span-2 bg-white border border-slate-300 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2 shrink-0">
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-slate-900">Portfolio Budget Evolution</h3>
              <p className="text-[11px] sm:text-xs text-slate-600">Historical trajectory of capital committed to client projects</p>
            </div>
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-100 border border-blue-300 px-2 py-0.5 rounded-full">FY 2026-27</span>
          </div>

          <div className="w-full flex-1 min-h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBudget" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={{ stroke: '#cbd5e1' }} 
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={{ stroke: '#cbd5e1' }} 
                  tickFormatter={(val) => `₹${val/100000}L`} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    borderColor: '#cbd5e1', 
                    borderRadius: '10px', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.12)' 
                  }}
                  labelStyle={{ color: '#0f172a', fontWeight: '700', fontSize: '12px' }}
                  itemStyle={{ color: '#2563eb', fontWeight: '600', fontSize: '12px' }}
                  formatter={(val) => [formatRupee(val), 'Budget']}
                />
                <Area 
                  type="monotone" 
                  dataKey="budget" 
                  stroke="#2563eb" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#colorBudget)" 
                  isAnimationActive={true} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Client onboard summaries */}
        <div className="bg-white border border-slate-300 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between min-h-0">
          <div className="flex flex-col min-h-0 flex-1">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-200 shrink-0">
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-slate-900">Recent CRM Leads</h3>
                <p className="text-[11px] sm:text-xs text-slate-600">Prospect pipeline overview</p>
              </div>
              <Link 
                to="/admin/clients" 
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
              >
                View all
              </Link>
            </div>

            <div className="divide-y divide-slate-100 overflow-y-auto pr-1">
              {clients.slice(0, 4).map((client) => {
                const initials = client.name 
                  ? client.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() 
                  : 'CL';
                return (
                  <div key={client.id} className="py-2 sm:py-2.5 flex items-center justify-between hover:bg-slate-50 -mx-1.5 px-1.5 rounded-lg transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center font-medium text-xs border border-slate-300 shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-[12px] sm:text-[13px] font-semibold text-slate-900 leading-tight truncate">{client.name}</h4>
                        <span className="text-[10px] sm:text-[11px] text-slate-600 block truncate mt-0.5">{client.company || 'Private Organization'}</span>
                      </div>
                    </div>
                    <span className={`text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${
                      client.status === 'onboarded' 
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                        : client.status === 'follow_up'
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-slate-100 text-slate-800 border-slate-300'
                    }`}>
                      {client.status === 'follow_up' ? 'Follow Up' : client.status}
                    </span>
                  </div>
                );
              })}
              {clients.length === 0 && (
                <div className="py-8 text-center text-slate-500 text-xs">No client records available.</div>
              )}
            </div>
          </div>

          <div className="pt-2 sm:pt-3 border-t border-slate-200 mt-2 shrink-0">
            <Link
              to="/admin/clients"
              className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors"
            >
              Manage Client Pipeline
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
