import React from 'react';
import { User } from '../types';
import logo from '../assets/logo.png';

interface LayoutProps {
  children: React.ReactNode;
  activeDay: number;
  onSelectDay: (day: number) => void;
  currentUser: User | null;
  onLogout: () => void;
  onOpenUserManagement?: () => void;
  viewDate: Date;
  onMonthChange: (date: Date) => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeDay, 
  onSelectDay, 
  currentUser, 
  onLogout,
  onOpenUserManagement,
  viewDate,
  onMonthChange
}) => {
  const today = new Date();
  // Reset time part for accurate comparison
  const currentMonthDate = new Date(today.getFullYear(), today.getMonth(), 1);
  const viewingMonthDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  
  const isViewingCurrentMonth = viewingMonthDate.getTime() === currentMonthDate.getTime();
  
  // Format Month Year string (e.g. "Februari 2026")
  const monthYearString = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(viewDate);

  const handlePrevMonth = () => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() - 1);
    onMonthChange(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() + 1);
    // Prevent going to future months beyond current month
    if (newDate > today) return; 
    onMonthChange(newDate);
  };

  const isNextDisabled = isViewingCurrentMonth;


  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar - Day Selector (Desktop Only) */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex shadow-xl shadow-slate-100 z-30">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="Logo Habibeat"
              className="w-12 h-12 object-contain"
            />
            <div>
              <h1 className="text-xl font-extrabold text-slate-800 tracking-tight leading-none">
                Habibeat
              </h1>
              <p className="text-[10px] text-indigo-500 mt-1 uppercase font-bold tracking-widest">
                Inventory
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1">

          {/* Month Navigator */}
          <div className="bg-slate-50 p-2 rounded-xl mb-6 border border-slate-200 flex items-center justify-between">
            <button 
                onClick={handlePrevMonth}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-slate-500 hover:text-indigo-600 shadow-sm border border-slate-100 transition-colors"
            >
                <i className="fas fa-chevron-left text-xs"></i>
            </button>
            <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{monthYearString}</span>
            <button 
                onClick={handleNextMonth}
                disabled={isNextDisabled}
                className={`w-8 h-8 flex items-center justify-center rounded-lg shadow-sm border border-slate-100 transition-colors ${isNextDisabled ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-white text-slate-500 hover:text-indigo-600'}`}
            >
                <i className="fas fa-chevron-right text-xs"></i>
            </button>
          </div>

          <div className="mb-6 px-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Tindakan Admin</p>
            {currentUser?.role === 'admin' && (
              <button 
                onClick={onOpenUserManagement}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-all mb-2 border border-transparent hover:border-slate-100"
              >
                <i className="fas fa-users-gear"></i>
                Kelola User
              </button>
            )}
            <button 
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-rose-500 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100"
            >
              <i className="fas fa-power-off"></i>
              Logout
            </button>
          </div>

          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">
            Navigasi Tanggal
          </p>

          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
            // Lock future days ONLY if we are in current month
            const isFuture = isViewingCurrentMonth && day > today.getDate();
            
            return (
              <button
                key={day}
                disabled={isFuture}
                onClick={() => onSelectDay(day)}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                  activeDay === day
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 font-bold'
                    : isFuture 
                      ? 'text-slate-300 cursor-not-allowed opacity-50 grayscale'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    Tanggal {day}
                    {isFuture && <i className="fas fa-lock text-[9px] opacity-40"></i>}
                  </span>
                  {activeDay === day && <i className="fas fa-chevron-right text-[10px]"></i>}
                </div>
              </button>
            );
          })}
        </div>

        {/* User Badge Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-600 font-bold">
              {currentUser?.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">
                {currentUser?.name}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase">
                {currentUser?.role}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between z-20 shadow-sm">
          <div className="flex items-center gap-2">
            <img
              src={logo}
              alt="Logo Habibeat"
              className="w-10 h-10 object-contain"
            />
            <h1 className="text-lg font-bold text-slate-800 tracking-tight">Habibeat</h1>
          </div>

          <div className="flex items-center gap-2">
            <select 
              value={activeDay} 
              onChange={(e) => onSelectDay(Number(e.target.value))}
              className="bg-slate-100 border-none text-[10px] rounded-lg px-2 py-1.5 outline-none font-bold text-slate-600"
            >
              {Array.from({ length: 31 }, (_, i) => i + 1)
                    .filter(day => !isViewingCurrentMonth || day <= today.getDate())
                .map(day => (
                  <option key={day} value={day}>Tgl {day}</option>
              ))}
            </select>
            
            {currentUser?.role === 'admin' && (
              <button 
                onClick={onOpenUserManagement}
                className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center"
                title="Kelola User"
              >
                <i className="fas fa-users-cog text-xs"></i>
              </button>
            )}

            <button 
              onClick={onLogout} 
              className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center"
              title="Logout"
            >
              <i className="fas fa-power-off text-xs"></i>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
