
import React, { useState, useRef } from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabase';

interface UserManagementProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  onAddUser: (username: string, name: string, role: 'admin' | 'staff', password?: string) => void;
  onToggleUserStatus: (userId: string) => void;
  onDeleteUser: (userId: string) => void;
}

const DEFAULT_PRODUCTS = [
  { name: "Air mineral Aqua 220 ml ( 48 btl )", unit: "btl" },
  { name: "Air mineral Aqua 330 ml ( 24 btl )", unit: "btl" },
  { name: "Air mineral Aqua 600 ml (24 btl )", unit: "btl" },
  { name: "Air mineral Galon VIT ( plus isi )", unit: "gln" },
  { name: "Air mineral Vit 550 ml ( 24 btl )", unit: "btl" },
  { name: "Beras (5kg)", unit: "zak" },
  { name: "Cutleries - Chopstick ( 1 pack : 100 pcs )", unit: "pcs" },
  { name: "Cutleries Set ( 1 pack : 50 pcs )", unit: "pcs" },
  { name: "Fiora Dishwashing", unit: "jur" },
  { name: "Fiora Floor Cleaner", unit: "jur" },
  { name: "Fiora Glass Cleaner", unit: "jur" },
  { name: "Garam", unit: "pack" },
  { name: "Gula Pasir", unit: "kg" },
  { name: "Handglove Besttaft Nitrile ( 1 pack : 10 lbr )", unit: "pack" },
  { name: "Handglove Plastic ( 1 pack : 100 lbr )", unit: "pack" },
  { name: "Kertas Checker", unit: "roll" },
  { name: "Masker koki transparan", unit: "pcs" },
  { name: "Minyak Goreng Refill 2 lt", unit: "pouch" },
  { name: "Packaging - Lunch Box L ( 1 pack : 100 pcs )", unit: "pcs" },
  { name: "Packaging - Paper Bowl 800ml ( 1 pack : 50 pcs )", unit: "pcs" },
  { name: "Packaging - Tutup Paper Bowl 800ml ( 1 pack : 50 pcs )", unit: "pcs" },
  { name: "Plastik kiloan tahan panas 15 x 30 ( 1 pack : 250 gr )", unit: "pack" },
  { name: "Plastik TA White 24'", unit: "pack" },
  { name: "Plastik TA White 28'", unit: "pack" },
  { name: "Plastik TA White 35'", unit: "pack" },
  { name: "Santan Kara ( 1 lt )", unit: "kotak" },
  { name: "Sauce container 35 ml ( 1 pack : 50 pcs )", unit: "pcs" },
  { name: "Susu Cair", unit: "kotak" },
  { name: "Tabung LPG 3 kg", unit: "tbg" },
  { name: "Tissue Livi Evo Smart", unit: "pack" },
  { name: "Trash bag 60 x 100 ( isi : 12 pcs )", unit: "pack" },
  { name: "Boombuku - Ayam", unit: "ekor" },
  { name: "Boombuku - Bawang Goreng ( 250 gr )", unit: "pack" },
  { name: "Boombuku - Bebek", unit: "ekor" },
  { name: "Boombuku - Bumbu Curry Hijau ( 50 gr )", unit: "pack" },
  { name: "Boombuku - Bumbu Curry Kuning ( 35 gr )", unit: "pack" },
  { name: "Boombuku - Bumbu Hitam Madura ( 500 gr )", unit: "pack" },
  { name: "Boombuku - Bumbu Mie Hijau ( 80 gr )", unit: "pack" },
  { name: "Boombuku - Chilli Oil ( 200 gr )", unit: "pack" },
  { name: "Boombuku - Jamur Kuping", unit: "pack" },
  { name: "Boombuku - Kambing ( 50 gr )", unit: "pack" },
  { name: "Boombuku - Kuah Kambing ( 400 ml )", unit: "pack" },
  { name: "Boombuku - Mie Hijau", unit: "pcs" },
  { name: "Boombuku - Mie Lamian", unit: "pcs" },
  { name: "Boombuku - Premix Kacang Wijen ( 500 gr )", unit: "pack" },
  { name: "Boombuku - Sambal Bawang ( 500 gr )", unit: "pack" },
  { name: "Boombuku - Soun ( 1 pack : isi 10 pcs )", unit: "pcs" },
  { name: "Santan Kara ( 200 ml )", unit: "kotak" },
  { name: "Cabe rawit", unit: "gr" },
  { name: "Daun bawang", unit: "gr" },
  { name: "Daun kari", unit: "gr" },
  { name: "Daun kemangi", unit: "gr" },
  { name: "Daun ketumbar", unit: "gr" },
  { name: "Daun seledri", unit: "gr" },
  { name: "Jeruk nipis", unit: "gr" },
  { name: "Kol", unit: "gr" },
  { name: "Lobak", unit: "gr" },
  { name: "Tahu", unit: "pcs" },
  { name: "Taoge", unit: "gr" },
  { name: "Telur", unit: "pcs" },
  { name: "Timun", unit: "gr" },
  { name: "Wortel", unit: "gr" },
  { name: "Tissue Basah", unit: "pcs" }
];

const UserManagement: React.FC<UserManagementProps> = ({ 
  isOpen, onClose, users, onAddUser, onToggleUserStatus, onDeleteUser 
}) => {
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'staff'>('staff');
  const [isImporting, setIsImporting] = useState(false);
  const [importType, setImportType] = useState<'habibeat' | 'csv' | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newName.trim() || !newPassword.trim()) return;
    onAddUser(newUsername.trim(), newName.trim(), newRole, newPassword.trim());
    setNewUsername('');
    setNewName('');
    setNewPassword('');
    setNewRole('staff');
  };

  const insertBatch = async (items: {name: string, unit: string}[]) => {
    const payload = items.map(item => ({
      name: item.name,
      unit: item.unit,
      unit_price: 0
    }));

    const { data, error } = await supabase
      .from('products')
      .insert(payload)
      .select();

    if (error) {
      console.error("Bulk insert error:", error);
      throw error;
    }
    return data ? data.length : 0;
  };

  const handleBulkImport = async () => {
    if (!window.confirm("Ingin mengimpor 60+ produk default Habibeat ke database?")) return;
    setIsImporting(true);
    setImportType('habibeat');
    setImportStatus("Sedang memasukkan data Habibeat...");
    try {
      const count = await insertBatch(DEFAULT_PRODUCTS);
      setImportStatus(`Sukses! ${count} produk baru ditambahkan.`);
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      setImportStatus(`Gagal: ${err.message || "Kesalahan database"}`);
      setIsImporting(false);
      setImportType(null);
    }
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Set UI to loading state immediately
    setIsImporting(true);
    setImportType('csv');
    setImportStatus("Membaca file CSV...");

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
        const productsToImport: {name: string, unit: string}[] = [];

        lines.forEach((line, index) => {
          if (index === 0 && (line.toLowerCase().includes('nama') || line.toLowerCase().includes('unit'))) return; 
          
          const columns = line.split(/[;,]/);
          if (columns.length >= 2) {
            const name = columns[0].trim().replace(/^"|"$/g, '');
            const unit = columns[1].trim().replace(/^"|"$/g, '');
            if (name) {
              productsToImport.push({ name, unit: unit || 'pcs' });
            }
          }
        });

        if (productsToImport.length === 0) {
          throw new Error("Format CSV tidak terbaca atau kosong. Pastikan ada kolom Nama dan Satuan.");
        }

        setImportStatus(`Ditemukan ${productsToImport.length} barang. Mengirim ke database...`);
        
        const count = await insertBatch(productsToImport);
        setImportStatus(`Berhasil! ${count} barang dari CSV ditambahkan.`);
        setTimeout(() => window.location.reload(), 1500);
        
      } catch (err: any) {
        setImportStatus(`Error: ${err.message}`);
        setIsImporting(false);
        setImportType(null);
      }
    };

    reader.onerror = () => {
      setImportStatus("Gagal membaca file dari disk.");
      setIsImporting(false);
      setImportType(null);
    };

    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 my-8 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h3 className="text-xl font-extrabold text-slate-800">Kelola Akses & Database</h3>
            <p className="text-xs text-slate-400 font-medium mt-1 uppercase tracking-wider font-bold">Admin Panel</p>
          </div>
          <button 
            onClick={onClose} 
            className="group flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-rose-500 hover:text-white rounded-xl text-slate-500 transition-all font-black text-xs"
          >
            <span>TUTUP</span>
            <i className="fas fa-times text-sm"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Section: Impor Data Produk */}
          <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100/50">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                    <h4 className="text-sm font-black text-indigo-900 uppercase tracking-widest">Master Data Produk</h4>
                    <p className="text-[10px] text-indigo-600 font-bold mt-1 uppercase">Impor daftar barang secara massal:</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button 
                        disabled={isImporting}
                        onClick={handleBulkImport}
                        className={`px-4 py-2.5 rounded-xl text-[10px] font-black transition-all shadow-sm flex items-center gap-2 ${
                            isImporting 
                            ? (importType === 'habibeat' ? 'bg-indigo-400 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed')
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
                        }`}
                    >
                        {isImporting && importType === 'habibeat' ? (
                            <><i className="fas fa-circle-notch fa-spin"></i> MEMPROSES...</>
                        ) : (
                            <><i className="fas fa-magic"></i> LIST HABIBEAT</>
                        )}
                    </button>

                    <button 
                        disabled={isImporting}
                        onClick={() => fileInputRef.current?.click()}
                        className={`px-4 py-2.5 rounded-xl text-[10px] font-black transition-all shadow-sm flex items-center gap-2 ${
                            isImporting 
                            ? (importType === 'csv' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed')
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 active:scale-95'
                        }`}
                    >
                        {isImporting && importType === 'csv' ? (
                            <><i className="fas fa-circle-notch fa-spin"></i> LOADING...</>
                        ) : (
                            <><i className="fas fa-file-excel text-emerald-500"></i> UPLOAD CSV</>
                        )}
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleCsvUpload} 
                      accept=".csv" 
                      className="hidden" 
                    />
                </div>
             </div>
             
             {importStatus && (
                <div className={`mt-4 p-3 rounded-xl border flex items-center gap-2 text-[10px] font-bold ${
                    importStatus.includes('Error') || importStatus.includes('Gagal')
                    ? 'bg-rose-50 border-rose-100 text-rose-600'
                    : 'bg-white/50 border-indigo-100 text-indigo-600'
                }`}>
                    <i className={`fas ${
                        importStatus.includes('Berhasil') || importStatus.includes('Sukses') 
                        ? 'fa-check-circle text-emerald-500' 
                        : (importStatus.includes('Error') ? 'fa-exclamation-circle' : 'fa-sync fa-spin') 
                    }`}></i> 
                    {importStatus}
                </div>
             )}

             {!importStatus && (
                <div className="mt-4 flex items-start gap-2 text-[9px] text-slate-400 italic">
                  <i className="fas fa-info-circle mt-0.5"></i>
                  <span>Format CSV: Nama Barang, Satuan. Contoh: "Aqua 600ml, btl"</span>
                </div>
             )}
          </div>

          {/* FORM USER */}
          <form onSubmit={handleSubmit} className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Tambah User Baru</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Username</label>
                <input 
                  type="text" 
                  placeholder="Username" 
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Nama Lengkap</label>
                <input 
                  type="text" 
                  placeholder="Nama Lengkap" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Role Akses</label>
                <select 
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as 'admin' | 'staff')}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-bold text-slate-700"
                >
                  <option value="staff">Staff (Input Saja)</option>
                  <option value="admin">Admin (Full Akses)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Password Baru</label>
                <input 
                  type="password" 
                  placeholder="Password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium"
                  required
                />
              </div>
            </div>
            <button 
              type="submit"
              className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-md shadow-indigo-100 active:scale-[0.98]"
            >
              SIMPAN & TAMBAH USER
            </button>
          </form>

          {/* LIST USER */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Daftar Pengguna Aktif</h4>
              <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold">{users.length} Users</span>
            </div>
            <div className="space-y-3">
              {users.map(user => (
                <div key={user.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${user.role === 'admin' ? 'bg-indigo-500' : 'bg-slate-400'}`}>
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{user.name} <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded ml-1 text-slate-400">@{user.username}</span></p>
                      <p className="text-[10px] font-black text-indigo-500 uppercase mt-0.5">{user.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => onToggleUserStatus(user.id)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${user.isActive ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`}
                    >
                      {user.isActive ? 'AKTIF' : 'NON-AKTIF'}
                    </button>
                    {user.username !== 'admin' && (
                      <button 
                        onClick={() => onDeleteUser(user.id)}
                        className="w-8 h-8 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center"
                      >
                        <i className="fas fa-trash-can text-xs"></i>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-center">
            <button 
                onClick={onClose}
                className="px-10 py-3 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 font-black rounded-2xl text-xs transition-all shadow-sm active:scale-95 flex items-center gap-2"
            >
                <i className="fas fa-arrow-left text-[10px]"></i>
                KEMBALI KE DASHBOARD
            </button>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
