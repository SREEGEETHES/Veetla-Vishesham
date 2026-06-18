import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

type Tab = 'login' | 'register';

export default function AuthScreen() {
  const { login } = useAuth();
  const [tab, setTab] = useState<Tab>('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed');
      } else {
        login(data.token, data.user);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: regName, email: regEmail, password: regPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed');
      } else {
        login(data.token, data.user);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#ffdcc2] to-[#f9f9f9] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo area */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[#dc8e47] rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-orange-200">
            <svg viewBox="0 0 40 40" fill="none" className="w-12 h-12">
              <path d="M20 8C14.477 8 10 12.477 10 18c0 5.522 4.477 10 10 10s10-4.478 10-10c0-5.523-4.477-10-10-10zm0 18c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8z" fill="white" opacity="0.9"/>
              <path d="M20 13a3 3 0 100 6 3 3 0 000-6zm0 10c-4 0-8 2-8 5v2h16v-2c0-3-4-5-8-5z" fill="white"/>
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-[#8e4e08] tracking-tight">FamilyOS</h1>
          <p className="text-sm text-slate-500 mt-1">Your Family, Connected</p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-white/60 rounded-xl p-1 mb-4 shadow-sm">
          <button
            onClick={() => { setTab('login'); setError(''); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              tab === 'login' ? 'bg-white text-[#8e4e08] shadow-sm' : 'text-slate-500'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => { setTab('register'); setError(''); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              tab === 'register' ? 'bg-white text-[#8e4e08] shadow-sm' : 'text-slate-500'
            }`}
          >
            Register
          </button>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#dc8e47]/40 focus:border-[#dc8e47] transition-all"
                  placeholder="family@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Password</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#dc8e47]/40 focus:border-[#dc8e47] transition-all"
                  placeholder="••••••••"
                />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-xs text-red-600">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#dc8e47] hover:bg-[#c07a38] active:scale-[0.98] text-white font-bold rounded-xl text-sm transition-all disabled:opacity-60"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Your Name</label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#dc8e47]/40 focus:border-[#dc8e47] transition-all"
                  placeholder="Jane Miller"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email</label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#dc8e47]/40 focus:border-[#dc8e47] transition-all"
                  placeholder="jane@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Password</label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#dc8e47]/40 focus:border-[#dc8e47] transition-all"
                  placeholder="Min. 6 characters"
                />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-xs text-red-600">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#dc8e47] hover:bg-[#c07a38] active:scale-[0.98] text-white font-bold rounded-xl text-sm transition-all disabled:opacity-60"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}
        </div>

        {/* Hint */}
        <p className="text-center text-xs text-slate-400 mt-4 leading-relaxed">
          The first registered user automatically<br />becomes the family admin.
        </p>
      </div>
    </div>
  );
}