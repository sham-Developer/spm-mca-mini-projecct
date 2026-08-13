import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Server, ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';
import API_URL from '../config';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('admin@saas.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] flex items-center justify-center px-4 relative overflow-hidden font-sans">
      {/* Dynamic blueprint grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f60d_1px,transparent_1px),linear-gradient(to_bottom,#3b82f60d_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
      
      {/* Glowing atmospheric orbs */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-tr from-orange-600/25 to-amber-500/10 rounded-full blur-[130px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }}></div>
      <div className="absolute -bottom-52 -right-20 w-[700px] h-[700px] bg-gradient-to-bl from-blue-600/20 to-indigo-500/10 rounded-full blur-[150px] pointer-events-none animate-pulse" style={{ animationDuration: '10s' }}></div>
      
      <div className="w-full max-w-md bg-white/95 backdrop-blur-md border border-slate-200 rounded-3xl shadow-2xl overflow-hidden relative z-10 transition-all duration-300 hover:shadow-orange-500/10">
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center font-extrabold text-2xl text-white shadow-lg shadow-orange-600/20">
              N
            </div>
          </div>

          <h2 className="text-[24px] font-extrabold text-center text-slate-900 mb-1 tracking-tight">Welcome back</h2>
          <p className="text-slate-800 text-center text-[14px] font-semibold mb-8">Sign in to access your NexTask workspace</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={18} />
              <span className="text-[14px] text-red-700 leading-snug">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[14px] font-semibold text-slate-800 mb-2">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-700 pointer-events-none">
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-slate-400 rounded-xl py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 text-[16px] focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  placeholder="name@company.com"
                />
              </div>
            </div>

             <div>
              <label className="block text-[14px] font-semibold text-slate-800 mb-2">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-700 pointer-events-none">
                  <Lock size={18} />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-slate-400 rounded-xl py-3 pl-11 pr-11 text-slate-900 placeholder-slate-400 text-[16px] focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-700 hover:text-slate-950 cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-500 text-white rounded-xl py-3 text-[16px] font-bold transition-all duration-200 shadow-lg shadow-orange-600/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Quick Demo Logins Helper */}
          <div className="mt-8 pt-6 border-t border-slate-300">
            <h4 className="text-[12px] font-bold text-orange-600 uppercase tracking-wider text-center mb-3">Quick Demo Logins</h4>
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => setDemoRole('admin')}
                className="py-2 bg-slate-50 hover:bg-slate-100 border border-slate-400 text-[13px] text-slate-800 rounded-lg font-bold transition-all"
              >
                Admin
              </button>
              <button 
                onClick={() => setDemoRole('project_head')}
                className="py-2 bg-slate-50 hover:bg-slate-100 border border-slate-400 text-[13px] text-slate-800 rounded-lg font-bold transition-all"
              >
                Project Head
              </button>
              <button 
                onClick={() => setDemoRole('team_member')}
                className="py-2 bg-slate-50 hover:bg-slate-100 border border-slate-400 text-[13px] text-slate-800 rounded-lg font-bold transition-all"
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
