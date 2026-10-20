import React, { useState } from 'react';
import { User } from '../types';
import { api } from '../lib/api';
import logo from '@/assets/logo.png';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const user = await api.login(email, password);
      onLogin(user);
    } catch (err: any) {
      setError(err?.message || 'Username atau Password salah!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <img
            src={logo}
            alt="Logo Habibeat"
            className="w-45 h-auto mx-auto mb-4"
          />
          <p className="text-slate-500 font-medium">Inventory Tracking System</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200 border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Silakan Masuk</h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-shake">
                <i className="fas fa-circle-exclamation"></i> {error}
              </div>
            )}
            
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Email</label>
              <div className="relative">
                <i className="far fa-user absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                  placeholder="Masukkan email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Password</label>
              <div className="relative">
                <i className="far fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                  placeholder="Masukkan password"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-[0.98] mt-4 disabled:opacity-60 disabled:hover:scale-100"
            >
              {isSubmitting ? 'MEMPROSES...' : 'LOGIN KE SISTEM'}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-50 text-center">
            <p className="text-xs text-slate-400 leading-relaxed italic">
              "Akses terbatas untuk staff Habibeat. <br/>Kehilangan password? Hubungi Admin Utama."
            </p>
          </div>
        </div>
        
        <p className="text-center mt-8 text-slate-400 text-xs font-medium">
          &copy; {new Date().getFullYear()} Habibeat System v1.2.0
        </p>
      </div>
    </div>
  );
};

export default Login;
