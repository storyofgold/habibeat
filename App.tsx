
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { InventoryState, CalculatedStock, Product, DayData, DailyStockEntry, User } from './types';
import Layout from './components/Layout';
import InventoryTable from './components/InventoryTable';
import StatsCards from './components/StatsCards';
import ProductModal from './components/ProductModal';
import Login from './components/Login';
import UserManagement from './components/UserManagement';
import { supabase } from './lib/supabase';

const SESSION_KEY = 'habibeat_session_v5';

// Type for separated data: section -> day -> productId -> entry
type SeparatedDailyData = Record<string, Record<number, Record<string, DailyStockEntry>>>;

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    return saved ? JSON.parse(saved) : null;
  });

const handleLogout = () => {
  localStorage.removeItem(SESSION_KEY);
  setCurrentUser(null);
};


  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // This state now only holds data for the CURRENTLY VIEWED MONTH
  const [dailyData, setDailyData] = useState<SeparatedDailyData>({ gudang: {}, booth: {} });
  
  // State for Carry-Over (Closing stock from previous month)
  // Structure: section -> productId -> closingStockValue
  const [prevMonthClosing, setPrevMonthClosing] = useState<Record<string, Record<string, number>>>({ gudang: {}, booth: {} });

  // Date State
  const [viewDate, setViewDate] = useState(new Date()); // Tracks the Month/Year being viewed
  const [activeDay, setActiveDay] = useState(new Date().getDate());
  
  const [activeSection, setActiveSection] = useState<'gudang' | 'booth'>('gudang');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [syncStatuses, setSyncStatuses] = useState<Record<string, 'saving' | 'success' | 'error'>>({});
  const lastUpdateRef = useRef<Record<string, number>>({});

  // Determine if we are in "Archive/History" mode
  // Logic: If viewDate month/year is LESS than today's month/year
  const isHistoryView = useMemo(() => {
    const today = new Date();
    // Normalize to first day of month to ignore time/day diffs
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const viewingMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    return viewingMonth < currentMonth;
  }, [viewDate]);

  const formattedCurrentDate = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(viewDate.getFullYear(), viewDate.getMonth(), activeDay));

  const handleSelectDay = (day: number) => {
    // Validation: Don't allow selecting future days in current month
    const today = new Date();
    const isCurrentMonth = today.getMonth() === viewDate.getMonth() && today.getFullYear() === viewDate.getFullYear();
    
    if (isCurrentMonth && day > today.getDate()) return;
    setActiveDay(day);
  };

  const handleMonthChange = (newDate: Date) => {
    setViewDate(newDate);
    // Reset day to 1 when changing months to avoid out-of-bound errors
    setActiveDay(1); 
  };

  const fetchPreviousMonthClosing = async () => {
    // Calculate previous month
    const prevDate = new Date(viewDate);
    prevDate.setMonth(prevDate.getMonth() - 1);
    const prevMonth = prevDate.getMonth() + 1; // 1-12
    const prevYear = prevDate.getFullYear();

    // Fetch entries for prev month
    // We try to get the highest day available for that month
    const { data, error } = await supabase
      .from('daily_entries')
      .select('*')
      .eq('month', prevMonth)
      .eq('year', prevYear)
      .order('day', { ascending: false });

    if (error || !data) return;

    // Process data to find closing stock for each product per section
    const closingData: Record<string, Record<string, number>> = { gudang: {}, booth: {} };

    // We iterate through data. Since it's ordered by day desc, the first time we see a product, that's its latest state.
    const processedKeys = new Set<string>(); // "section:productId"

    data.forEach(entry => {
        const key = `${entry.section}:${entry.product_id}`;
        if (!processedKeys.has(key)) {
            // Found latest entry for this product
            const section = (entry.section as 'gudang' | 'booth') || 'gudang';
            const closing = (entry.opening_stock || 0) + (entry.stock_in || 0) - (entry.stock_out || 0);
            
            if (!closingData[section]) closingData[section] = {};
            closingData[section][entry.product_id] = closing;
            
            processedKeys.add(key);
        }
    });

    setPrevMonthClosing(closingData);
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      // 1. Fetch Users & Products (Static)
      const { data: usersData } = await supabase.from('app_users').select('*');
      if (usersData) setUsers(usersData.map(u => ({ id: u.id, username: u.username, name: u.name, role: u.role, isActive: u.is_active, password: u.password })));

      const { data: productsData } = await supabase.from('products').select('*').order('name');
      if (productsData) setProducts(productsData.map(p => ({ id: p.id, name: p.name, unit: p.unit, unitPrice: Number(p.unit_price) })));

      // 2. Fetch Entries for SPECIFIC MONTH/YEAR
      const targetMonth = viewDate.getMonth() + 1;
      const targetYear = viewDate.getFullYear();

      const { data: entriesData, error } = await supabase.from('daily_entries')
        .select('*')
        .eq('month', targetMonth)
        .eq('year', targetYear);

      if (error) console.error("Data entries fetch error:", error);

      if (entriesData) {
        const organized: SeparatedDailyData = { gudang: {}, booth: {} };
        entriesData.forEach(entry => {
          const section = (entry.section as 'gudang' | 'booth') || 'gudang'; 
          const day = entry.day;

          if (!organized[section]) organized[section] = {};
          if (!organized[section][day]) organized[section][day] = {};
          
          organized[section][day][entry.product_id] = {
            productId: entry.product_id,
            section: section,
            openingStock: Number(entry.opening_stock) || 0,
            stockIn: Number(entry.stock_in) || 0,
            stockOut: Number(entry.stock_out) || 0,
            description: entry.description || '',
            lastModifiedBy: entry.last_modified_by,
            lastModifiedAt: entry.last_modified_at,
            month: entry.month,
            year: entry.year
          };
        });
        setDailyData(organized);
      } else {
        // Clear data if no entries found for this month (e.g. switching to new month)
        setDailyData({ gudang: {}, booth: {} });
      }

      // 3. Fetch Previous Month for Carry Over Logic
      await fetchPreviousMonthClosing();

    } catch (error) {
      console.error("Critical Fetch Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Re-fetch when Month changes
  useEffect(() => {
    fetchData();
  }, [viewDate]); // Removed activeDay dependency, we don't need to refetch on day change, just state calculation

  // Realtime Subscription
  useEffect(() => {
    const channel = supabase
      .channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_entries' }, (payload) => {
        const entry = (payload.new || payload.old) as any;
        if (!entry || !entry.product_id) return;
        
        // Only update if the change belongs to the currently viewed month
        const currentMonth = viewDate.getMonth() + 1;
        const currentYear = viewDate.getFullYear();
        if (entry.month !== currentMonth || entry.year !== currentYear) return;

        const incomingTime = new Date(entry.last_modified_at || 0).getTime();
        const localTime = lastUpdateRef.current[`${entry.section}:${entry.day}:${entry.product_id}`] || 0;

        if (incomingTime <= localTime) return;

        setDailyData(prev => {
          const section = (entry.section as 'gudang' | 'booth') || 'gudang';
          const day = entry.day;

          const updatedSection = { ...(prev[section] || {}) };
          const updatedDay = { ...(updatedSection[day] || {}) };
          
          updatedDay[entry.product_id] = {
            productId: entry.product_id,
            section: section,
            openingStock: Number(entry.opening_stock) || 0,
            stockIn: Number(entry.stock_in) || 0,
            stockOut: Number(entry.stock_out) || 0,
            description: entry.description || '',
            lastModifiedBy: entry.last_modified_by,
            lastModifiedAt: entry.last_modified_at,
            month: entry.month,
            year: entry.year
          };
          
          updatedSection[day] = updatedDay;
          return { ...prev, [section]: updatedSection };
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [viewDate]);

  useEffect(() => {
    if (currentUser) localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
  }, [currentUser]);

  const dailyCalculations = useMemo(() => {
    const results: Record<string, Record<number, CalculatedStock[]>> = { gudang: {}, booth: {} };
    
    ['gudang', 'booth'].forEach(sectionName => {
      const section = sectionName as 'gudang' | 'booth';
      const sectionData = dailyData[section] || {};
      const prevEndStocks: Record<string, number> = {};
      
      for (let d = 1; d <= 31; d++) {
        const dayEntries = sectionData[d] || {};
        const currentDayResults: CalculatedStock[] = products.map(product => {
          const entry = dayEntries[product.id] || { productId: product.id, section, stockIn: 0, stockOut: 0, description: '', openingStock: 0 };
          
          // START CARRY OVER LOGIC
          let initialStock = 0;
          if (d === 1) {
            // Priority 1: Use manually entered opening stock if exists in DB
            if (entry.openingStock !== undefined && entry.openingStock !== 0) {
               initialStock = entry.openingStock;
            } else {
               // Priority 2: Use calculated closing stock from Previous Month
               const carryOver = prevMonthClosing[section]?.[product.id];
               initialStock = carryOver !== undefined ? carryOver : 0;
            }
          } else {
            // Day 2 onwards: use previous day's end stock
            initialStock = prevEndStocks[product.id] || 0;
          }
          // END CARRY OVER LOGIC

          const endStock = initialStock + (entry.stockIn || 0) - (entry.stockOut || 0);
          prevEndStocks[product.id] = endStock;

          return {
            productId: product.id, 
            name: product.name, 
            unit: product.unit, 
            section: section,
            initialStock, 
            stockIn: entry.stockIn || 0,
            stockOut: entry.stockOut || 0, 
            endStock, 
            unitPrice: product.unitPrice, 
            description: entry.description || '', 
            lastModifiedBy: entry.lastModifiedBy,
            lastModifiedAt: entry.lastModifiedAt
          };
        });
        results[section][d] = currentDayResults;
      }
    });
    return results;
  }, [products, dailyData, prevMonthClosing]);

  const currentStocks = dailyCalculations[activeSection]?.[activeDay] || [];

  // Logic to calculate last modified info
  const lastModifiedInfo = useMemo(() => {
    const modifiedStocks = currentStocks.filter(s => s.lastModifiedAt && s.lastModifiedBy);
    if (modifiedStocks.length === 0) return null;
    modifiedStocks.sort((a, b) => new Date(b.lastModifiedAt!).getTime() - new Date(a.lastModifiedAt!).getTime());
    const latest = modifiedStocks[0];
    const latestTime = new Date(latest.lastModifiedAt!);
    const fiveMinutesInMillis = 5 * 60 * 1000;
    const recentBatchCount = modifiedStocks.filter(s => {
        if (s.lastModifiedBy !== latest.lastModifiedBy) return false;
        const timeDiff = latestTime.getTime() - new Date(s.lastModifiedAt!).getTime();
        return timeDiff >= 0 && timeDiff <= fiveMinutesInMillis;
    }).length;

    return {
        user: latest.lastModifiedBy,
        time: latestTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        count: recentBatchCount
    };
  }, [currentStocks]);

  const handleUpdateEntry = useCallback(async (productId: string, field: string, value: string | number) => {
    if (!currentUser) return;
    if (isHistoryView) {
        alert("Mode Arsip: Data tidak bisa diubah.");
        return;
    }
    
    // Create a section-specific key for the sync status
    const statusKey = `${activeSection}:${productId}:${field}`;
    const timestamp = new Date().toISOString();

    setDailyData(prev => {
      const section = activeSection;
      const day = activeDay;
      const updatedSection = { ...(prev[section] || {}) };
      const updatedDay = { ...(updatedSection[day] || {}) };
      const currentEntry = updatedDay[productId] || { productId: productId, section: activeSection, stockIn: 0, stockOut: 0, description: '', openingStock: 0 };
      
      updatedDay[productId] = { 
        ...currentEntry, 
        [field]: value, 
        lastModifiedBy: currentUser.username, 
        lastModifiedAt: timestamp,
        month: viewDate.getMonth() + 1,
        year: viewDate.getFullYear()
      };
      
      updatedSection[day] = updatedDay;
      return { ...prev, [section]: updatedSection };
    });

    setSyncStatuses(prev => ({ ...prev, [statusKey]: 'saving' }));
    setIsSyncing(true);

    try {
      const sectionEntries = dailyData[activeSection] || {};
      const dayEntries = sectionEntries[activeDay] || {};
      // Fallback: If no entry in state yet, grab basic info, but we need openingStock if it's Day 1
      const entryToSave = dayEntries[productId] || {
          openingStock: (activeDay === 1 && field !== 'openingStock') ? (prevMonthClosing[activeSection]?.[productId] || 0) : 0, 
          stockIn: 0, 
          stockOut: 0, 
          description: '', 
          section: activeSection
      };
      
      const finalEntry = { ...entryToSave, [field]: value };

      const { error } = await supabase.from('daily_entries').upsert({
        product_id: productId, 
        day: activeDay,
        section: activeSection,
        // Ensure month and year are sent
        month: viewDate.getMonth() + 1,
        year: viewDate.getFullYear(),
        opening_stock: Number(field === 'openingStock' ? value : (finalEntry.openingStock || 0)),
        stock_in: Number(field === 'stockIn' ? value : (finalEntry.stockIn || 0)),
        stock_out: Number(field === 'stockOut' ? value : (finalEntry.stockOut || 0)),
        description: field === 'description' ? String(value) : (finalEntry.description || ''),
        last_modified_by: currentUser.username,
        last_modified_at: timestamp
      }, { onConflict: 'product_id,day,section,month,year' }); // Updated Conflict constraint assumption

      if (error) {
        console.error("Sync Error:", error.message);
        setSyncStatuses(prev => ({ ...prev, [statusKey]: 'error' }));
      } else {
        lastUpdateRef.current[`${activeSection}:${activeDay}:${productId}`] = new Date(timestamp).getTime();
        setSyncStatuses(prev => ({ ...prev, [statusKey]: 'success' }));
        setTimeout(() => {
          setSyncStatuses(prev => {
            const next = { ...prev };
            delete next[statusKey];
            return next;
          });
        }, 2000);
      }
    } catch (e) {
      setSyncStatuses(prev => ({ ...prev, [statusKey]: 'error' }));
    } finally {
      setIsSyncing(false);
    }
  }, [activeDay, activeSection, currentUser, dailyData, viewDate, isHistoryView, prevMonthClosing]);

  const handleSaveProduct = useCallback(async (name: string, unit: string, price: number) => {
    try {
      if (editingProduct) {
        await supabase.from('products').update({ name, unit, unit_price: price }).eq('id', editingProduct.id);
      } else {
        await supabase.from('products').insert({ name, unit, unit_price: price });
      }
      fetchData(); // Refresh product list
      setIsModalOpen(false);
      setEditingProduct(null);
    } catch (e) { alert("Gagal simpan barang."); }
  }, [editingProduct, viewDate]); // Added viewDate dependency to potentially refresh

  const handleAddUser = useCallback(async (username: string, name: string, role: 'admin' | 'staff', password?: string) => {
    try {
      const { error } = await supabase.from('app_users').insert({ username, name, role, password, is_active: true });
      if (error) throw error;
      fetchData();
    } catch (e: any) { alert("Gagal tambah user: " + e.message); }
  }, []);

  const handleToggleUserStatus = useCallback(async (userId: string) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;
      const { error } = await supabase.from('app_users').update({ is_active: !user.isActive }).eq('id', userId);
      if (error) throw error;
      fetchData();
    } catch (e: any) { alert("Gagal update status: " + e.message); }
  }, [users]);

  const handleDeleteUser = useCallback(async (userId: string) => {
    if (!window.confirm("Hapus user ini selamanya?")) return;
    try {
      const { error } = await supabase.from('app_users').delete().eq('id', userId);
      if (error) throw error;
      fetchData();
    } catch (e: any) { alert("Gagal hapus user: " + e.message); }
  }, []);

  if (isLoading && products.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
        <div className="w-10 h-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-black text-[9px] tracking-[0.4em] uppercase">Sinkronisasi Habibeat...</p>
      </div>
    );
  }

  if (!currentUser) return <Login users={users} onLogin={setCurrentUser} />;

  return (
    <Layout 
      activeDay={activeDay} onSelectDay={handleSelectDay} 
      currentUser={currentUser} onLogout={handleLogout}
      onOpenUserManagement={() => setIsUserManagementOpen(true)}
      viewDate={viewDate} onMonthChange={handleMonthChange}
    >
      <div className="max-w-7xl mx-auto pb-12">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8 no-print">
          <div className="flex-1">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-4xl font-black text-slate-800 tracking-tighter">Inventory</h1>
                <div className="flex items-center gap-3 mt-1">
                    <p className="text-sm font-bold text-slate-500">{formattedCurrentDate}</p>
                    {isHistoryView && (
                        <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded border border-amber-200 uppercase tracking-wide">
                            <i className="fas fa-archive mr-1"></i> Arsip / Read Only
                        </span>
                    )}
                </div>
              </div>
              {!isHistoryView && (
                <div className={`px-4 py-2 rounded-2xl border flex items-center gap-2 transition-all ${isSyncing ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
                    <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isSyncing ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {isSyncing ? 'Syncing...' : 'Cloud Connected'}
                    </span>
                </div>
              )}
            </div>
            
            <div className="mt-8 flex bg-slate-200/50 p-1.5 rounded-[1.5rem] w-fit border border-slate-200/80 shadow-inner">
                <button onClick={() => setActiveSection('gudang')} className={`flex items-center gap-2 px-8 py-3 rounded-2xl text-[11px] font-black transition-all ${activeSection === 'gudang' ? 'bg-indigo-600 text-white shadow-xl scale-105' : 'text-slate-500 hover:bg-white/60'}`}>UNIT GUDANG</button>
                <button onClick={() => setActiveSection('booth')} className={`flex items-center gap-2 px-8 py-3 rounded-2xl text-[11px] font-black transition-all ${activeSection === 'booth' ? 'bg-amber-500 text-white shadow-xl scale-105' : 'text-slate-500 hover:bg-white/60'}`}>UNIT BOOTH</button>
            </div>
            
            {/* Last Modified Section */}
            {lastModifiedInfo && (
                <div className="mt-4 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                    <p className="text-[11px] text-slate-500 font-medium italic">
                        Terakhir diubah oleh <span className="font-bold text-slate-700 underline decoration-indigo-200">{lastModifiedInfo.user}</span> di <span className="uppercase font-bold text-slate-600">{activeSection}</span> <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600 mx-1">{lastModifiedInfo.count} baris/barang</span> di jam <span className="font-bold text-slate-700">{lastModifiedInfo.time}</span>
                    </p>
                </div>
            )}
          </div>
        </div>
        
        <InventoryTable 
          key={activeSection} 
          stocks={currentStocks} day={activeDay} currentUser={currentUser}
          onUpdateEntry={handleUpdateEntry} 
          onAddProduct={() => setIsModalOpen(true)}
          onEditProduct={(pid) => { setEditingProduct(products.find(p => p.id === pid) || null); setIsModalOpen(true); }} 
          onDeleteProduct={(id) => { if(window.confirm("Hapus barang?")) supabase.from('products').delete().eq('id', id).then(() => fetchData()); }}
          section={activeSection}
          syncStatuses={syncStatuses}
          isArchived={isHistoryView}
        />
        
        <div className="mt-12 no-print">
          <StatsCards stocks={currentStocks} />
        </div>
        
        <ProductModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingProduct(null); }} onSave={handleSaveProduct} editingProduct={editingProduct} />
        <UserManagement 
          isOpen={isUserManagementOpen} onClose={() => setIsUserManagementOpen(false)}
          users={users} 
          onAddUser={handleAddUser} 
          onToggleUserStatus={handleToggleUserStatus} 
          onDeleteUser={handleDeleteUser}
        />
      </div>
    </Layout>
  );
};

export default App;
