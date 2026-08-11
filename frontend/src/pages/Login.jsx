import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Server, ShieldCheck, AlertCircle } from 'lucide-react';
import API_URL from '../config';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('admin@saas.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        throw new Error('Invalid email or password');
      }

      const data = await response.json();
      onLoginSuccess(data.user);

      // Redirect depending on user role
      if (data.user.role === 'admin') {
        navigate('/admin');
      } else if (data.user.role === 'project_head') {
        navigate('/head');
      } else {
        navigate('/member');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoRole = (role) => {
    if (role === 'admin') {
      setEmail('admin@saas.com');
      setPassword('admin123');
    } else if (role === 'project_head') {
      setEmail('head@saas.com');
      setPassword('head123');
    } else {
      setEmail('member@saas.com');
      setPassword('member123');
    }
  };

  return (
    <div className="min-h-screen bg-[#0e0e10] flex items-center justify-center px-4 relative overflow-hidden font-sans">
      {/* Decorative premium gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-emerald-950/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#18181b] border border-[#27272a] rounded-2xl shadow-xl overflow-hidden relative z-10 transition-all duration-300">
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center font-extrabold text-2xl text-white shadow-lg shadow-indigo-600/20">
              N
            </div>
          </div>

          <h2 className="text-[24px] font-bold text-center text-zinc-100 mb-1 tracking-tight">Welcome back</h2>
          <p className="text-zinc-500 text-center text-[14px] mb-8">Sign in to access your NexTask workspace</p>

          {error && (
            <div className="mb-6 p-4 bg-red-950/20 border border-red-500/30 rounded-xl flex items-start gap-3">
              <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={18} />
              <span className="text-[14px] text-red-300 leading-snug">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[14px] font-medium text-zinc-400 mb-2">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-500 pointer-events-none">
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#202024] border border-[#27272a] rounded-xl py-3 pl-11 pr-4 text-zinc-200 placeholder-zinc-600 text-[16px] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-[14px] font-medium text-zinc-400 mb-2">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-500 pointer-events-none">
                  <Lock size={18} />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#202024] border border-[#27272a] rounded-xl py-3 pl-11 pr-4 text-zinc-200 placeholder-zinc-600 text-[16px] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 text-[16px] font-semibold transition-all duration-200 shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Quick Demo Logins Helper */}
          <div className="mt-8 pt-6 border-t border-[#27272a]">
            <h4 className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider text-center mb-3">Quick Demo Logins</h4>
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => setDemoRole('admin')}
                className="py-2 bg-[#202024] hover:bg-[#27272a] text-[13px] text-zinc-300 rounded-lg font-medium transition-all"
              >
                Admin
              </button>
              <button 
                onClick={() => setDemoRole('project_head')}
                className="py-2 bg-[#202024] hover:bg-[#27272a] text-[13px] text-zinc-300 rounded-lg font-medium transition-all"
              >
                Project Head
              </button>
              <button 
                onClick={() => setDemoRole('team_member')}
                className="py-2 bg-[#202024] hover:bg-[#27272a] text-[13px] text-zinc-300 rounded-lg font-medium transition-all"
              >
                Member
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
