
import React, { useState } from 'react';
import { CalculatedStock, User } from '../types';

interface InventoryTableProps {
  stocks: CalculatedStock[];
  day: number;
  currentUser: User | null;
  onUpdateEntry: (productId: string, field: 'stockIn' | 'stockOut' | 'description' | 'openingStock', value: string | number) => void;
  onAddProduct: () => void;
  onEditProduct: (productId: string) => void;
  onDeleteProduct: (id: string) => void;
  section?: 'gudang' | 'booth';
  syncStatuses?: Record<string, 'saving' | 'success' | 'error'>;
}

const InventoryTable: React.FC<InventoryTableProps> = ({ 
  stocks, 
  day, 
  currentUser,
  onUpdateEntry, 
  onAddProduct, 
  onEditProduct, 
  onDeleteProduct,
  section = 'gudang',
  syncStatuses = {}
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const [localValues, setLocalValues] = useState<Record<string, string>>({});

  const handleBlur = (productId: string, field: 'stockIn' | 'stockOut' | 'openingStock', value: string) => {
    const val = value === '' ? 0 : parseInt(value);
    const finalVal = isNaN(val) ? 0 : val;
    onUpdateEntry(productId, field, finalVal);
    
    setTimeout(() => {
        setLocalValues(prev => {
            const next = {...prev};
            delete next[`${productId}:${field}`];
            return next;
        });
    }, 500);
  };

  const handleExportPDF = () => {
    const printWindow = document.createElement('div');
    printWindow.style.padding = '20px';
    printWindow.style.fontFamily = 'Arial, sans-serif';
    
    const title = `
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="margin: 0; font-size: 18px; text-transform: uppercase;">Habibeat Inventory Report</h1>
        <p style="margin: 5px 0; font-size: 12px; color: #666;">Unit: ${section.toUpperCase()} | Tanggal: ${day} | Dicetak oleh: ${currentUser?.name || 'System'}</p>
        <hr style="border: 1px solid #eee; margin: 15px 0;">
      </div>
    `;

    const tableHeader = `
      <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
        <thead>
          <tr style="background-color: #f8fafc; text-align: left;">
            <th style="border: 1px solid #e2e8f0; padding: 6px; width: 30px; text-align: center;">#</th>
            <th style="border: 1px solid #e2e8f0; padding: 6px;">Nama Barang</th>
            <th style="border: 1px solid #e2e8f0; padding: 6px; text-align: center;">Unit</th>
            <th style="border: 1px solid #e2e8f0; padding: 6px; text-align: center;">Awal</th>
            <th style="border: 1px solid #e2e8f0; padding: 6px; text-align: center;">In</th>
            <th style="border: 1px solid #e2e8f0; padding: 6px; text-align: center;">Out</th>
            <th style="border: 1px solid #e2e8f0; padding: 6px; text-align: center; font-weight: bold;">Akhir</th>
            <th style="border: 1px solid #e2e8f0; padding: 6px;">Ket</th>
          </tr>
        </thead>
        <tbody>
    `;

    const tableRows = stocks.map((s, i) => `
      <tr>
        <td style="border: 1px solid #e2e8f0; padding: 4px; text-align: center;">${i + 1}</td>
        <td style="border: 1px solid #e2e8f0; padding: 4px; font-weight: bold; text-transform: capitalize;">${s.name}</td>
        <td style="border: 1px solid #e2e8f0; padding: 4px; text-align: center; color: #666;">${s.unit}</td>
        <td style="border: 1px solid #e2e8f0; padding: 4px; text-align: center;">${s.initialStock}</td>
        <td style="border: 1px solid #e2e8f0; padding: 4px; text-align: center; color: green;">${s.stockIn}</td>
        <td style="border: 1px solid #e2e8f0; padding: 4px; text-align: center; color: red;">${s.stockOut}</td>
        <td style="border: 1px solid #e2e8f0; padding: 4px; text-align: center; font-weight: bold; background-color: #f8fafc;">${s.endStock}</td>
        <td style="border: 1px solid #e2e8f0; padding: 4px; font-style: italic; font-size: 9px; color: #888;">${s.description || '-'}</td>
      </tr>
    `).join('');

    const tableFooter = `
        </tbody>
      </table>
      <div style="margin-top: 30px; font-size: 9px; text-align: right; color: #94a3b8;">
        Generated via Habibeat Inventory System on ${new Date().toLocaleString('id-ID')}
      </div>
    `;

    printWindow.innerHTML = title + tableHeader + tableRows + tableFooter;

    const opt = {
      margin: 10,
      filename: `Habibeat_Laporan_${section}_Tgl_${day}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 3, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // @ts-ignore
    window.html2pdf().set(opt).from(printWindow).save();
  };

  const handleExportCSV = () => {
    const headers = ['#', 'Nama Barang', 'Unit', 'Awal', 'Masuk', 'Keluar', 'Akhir', 'Keterangan'];
    const rows = stocks.map((s, i) => [
      i + 1,
      `"${s.name}"`,
      s.unit,
      s.initialStock,
      s.stockIn,
      s.stockOut,
      s.endStock,
      `"${s.description || ''}"`
    ]);

    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Habibeat_Inventory_${section}_Tgl_${day}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderStatus = (productId: string, field: string) => {
    const status = syncStatuses[`${productId}:${field}`];
    if (!status) return null;

    return (
        <span className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[7px] font-black uppercase px-1.5 py-0.5 rounded shadow-sm z-30 animate-in fade-in zoom-in duration-300 ${
            status === 'saving' ? 'bg-amber-400 text-white' : 
            status === 'success' ? 'bg-emerald-500 text-white' : 
            'bg-rose-500 text-white'
        }`}>
            {status === 'saving' ? '...' : status === 'success' ? '✓' : '!'}
        </span>
    );
  };

  return (
    <div className={`bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl shadow-slate-200/60 overflow-hidden border-b-[8px] ${section === 'gudang' ? 'border-b-indigo-600' : 'border-b-amber-500'}`}>
      <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center bg-white no-print gap-4">
        <h2 className="font-black text-slate-800 flex items-center gap-3 text-lg tracking-tighter uppercase">
          <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-lg ${section === 'gudang' ? 'bg-indigo-600' : 'bg-amber-500'}`}>
            <i className={`fas ${section === 'gudang' ? 'fa-warehouse' : 'fa-store'} text-xs`}></i>
          </span>
          UNIT {section} <span className="text-slate-200 font-light">/</span> TGL {day}
        </h2>
        
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={handleExportPDF}
            className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-2 rounded-lg text-[9px] font-black transition-all flex items-center gap-2 shadow-sm uppercase"
          >
            <i className="fas fa-file-pdf"></i> PDF
          </button>
          <button 
            onClick={handleExportCSV}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 px-3 py-2 rounded-lg text-[9px] font-black transition-all flex items-center gap-2 shadow-sm uppercase"
          >
            <i className="fas fa-file-csv"></i> CSV
          </button>
          
          {isAdmin && (
            <button 
              onClick={onAddProduct}
              className="bg-slate-900 hover:bg-black text-white px-4 py-2 rounded-xl text-[9px] font-black transition-all flex items-center gap-2 shadow-xl active:scale-95 uppercase tracking-wider ml-1"
            >
              <i className="fas fa-plus-circle text-indigo-400"></i> Tambah
            </button>
          )}
        </div>
      </div>

      <div id="printable-table" className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead className="bg-slate-50/50 text-slate-400 text-[8px] uppercase tracking-[0.15em] font-black border-b border-slate-100">
            <tr>
              <th className="px-4 py-2 w-10 text-center">#</th>
              <th className="px-4 py-2 min-w-[180px]">Nama Barang</th>
              <th className="px-2 py-2 text-center">Unit</th>
              <th className="px-4 py-2 text-center bg-slate-100/40">Awal</th>
              <th className="px-4 py-2 text-center text-emerald-600">Masuk</th>
              <th className="px-4 py-2 text-center text-rose-600">Keluar</th>
              <th className="px-4 py-2 text-center font-extrabold text-slate-900 border-x border-slate-100">Akhir</th>
              <th className="px-4 py-2">Keterangan</th>
              {isAdmin && <th className="px-4 py-2 text-center no-print w-20">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-xs">
            {stocks.map((stock, idx) => (
              <tr key={stock.productId} className="hover:bg-slate-50/40 transition-colors group">
                <td className="px-4 py-1 text-center text-slate-300 font-black text-[9px]">{idx + 1}</td>
                <td className="px-4 py-1">
                    <div className="flex flex-col">
                        <span className="font-bold text-slate-700 capitalize group-hover:text-indigo-600 transition-colors text-[11px]">
                          {stock.name}
                        </span>
                    </div>
                </td>
                <td className="px-2 py-1 text-center">
                    <span className="text-[8px] text-slate-400 font-black uppercase tracking-tight">{stock.unit}</span>
                </td>
                
                <td className="px-4 py-1 text-center font-black bg-slate-50/20">
                  {day === 1 && isAdmin ? (
                    <div className="relative inline-block">
                        {renderStatus(stock.productId, 'openingStock')}
                        <input
                            type="number"
                            value={localValues[`${stock.productId}:openingStock`] ?? (stock.initialStock || '')}
                            onChange={(e) => setLocalValues({...localValues, [`${stock.productId}:openingStock`]: e.target.value})}
                            onBlur={(e) => handleBlur(stock.productId, 'openingStock', e.target.value)}
                            className="w-14 bg-white border-slate-200 border text-center rounded py-1 outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-600 font-black transition-all text-xs"
                        />
                    </div>
                  ) : <span className="text-slate-500 font-bold text-xs">{stock.initialStock}</span>}
                </td>

                <td className="px-4 py-1 text-center">
                  <div className="relative inline-block">
                    {renderStatus(stock.productId, 'stockIn')}
                    <input
                      type="number"
                      value={localValues[`${stock.productId}:stockIn`] ?? (stock.stockIn || '')}
                      onChange={(e) => setLocalValues({...localValues, [`${stock.productId}:stockIn`]: e.target.value})}
                      onBlur={(e) => handleBlur(stock.productId, 'stockIn', e.target.value)}
                      className="w-14 bg-white border-emerald-100 border text-emerald-700 text-center rounded py-1 outline-none focus:ring-1 focus:ring-emerald-500/20 focus:border-emerald-600 font-black transition-all text-xs"
                    />
                  </div>
                </td>

                <td className="px-4 py-1 text-center">
                   <div className="relative inline-block">
                    {renderStatus(stock.productId, 'stockOut')}
                    <input
                      type="number"
                      value={localValues[`${stock.productId}:stockOut`] ?? (stock.stockOut || '')}
                      onChange={(e) => setLocalValues({...localValues, [`${stock.productId}:stockOut`]: e.target.value})}
                      onBlur={(e) => handleBlur(stock.productId, 'stockOut', e.target.value)}
                      className="w-14 bg-white border-rose-100 border text-rose-700 text-center rounded py-1 outline-none focus:ring-1 focus:ring-rose-500/20 focus:border-rose-600 font-black transition-all text-xs"
                    />
                   </div>
                </td>

                <td className="px-4 py-1 text-center bg-slate-50/40 font-black text-slate-900 text-sm border-x border-slate-100">
                  {stock.endStock}
                </td>

                <td className="px-4 py-1">
                  <div className="relative">
                    {renderStatus(stock.productId, 'description')}
                    <input
                        type="text" placeholder="..."
                        value={localValues[`${stock.productId}:description`] ?? stock.description}
                        onChange={(e) => setLocalValues({...localValues, [`${stock.productId}:description`]: e.target.value})}
                        onBlur={(e) => onUpdateEntry(stock.productId, 'description', e.target.value)}
                        className="w-full bg-transparent border-b border-slate-100 focus:border-indigo-400 outline-none transition-all text-slate-500 text-[9px] py-0.5 italic font-medium"
                    />
                  </div>
                </td>
                
                {isAdmin && (
                  <td className="px-4 py-1 text-center no-print">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => onEditProduct(stock.productId)} className="w-6 h-6 rounded bg-slate-100 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center shadow-sm"><i className="fas fa-edit text-[9px]"></i></button>
                      <button onClick={() => onDeleteProduct(stock.productId)} className="w-6 h-6 rounded bg-slate-100 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all flex items-center justify-center shadow-sm"><i className="fas fa-trash-alt text-[9px]"></i></button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryTable;
