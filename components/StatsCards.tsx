
import React from 'react';
import { CalculatedStock } from '../types';
import { formatCurrency } from '../constants';

interface StatsCardsProps {
  stocks: CalculatedStock[];
}

const StatsCards: React.FC<StatsCardsProps> = ({ stocks }) => {
  const totalItems = stocks.length;
  const totalStockIn = stocks.reduce((acc, s) => acc + s.stockIn, 0);
  const totalStockOut = stocks.reduce((acc, s) => acc + s.stockOut, 0);
  const totalInventoryValue = stocks.reduce((acc, s) => acc + (s.endStock * s.unitPrice), 0);

  const stats = [
    { label: 'Total Item', value: totalItems, icon: 'fa-tag', color: 'bg-blue-500' },
    { label: 'Total Stok Masuk', value: totalStockIn, icon: 'fa-arrow-down', color: 'bg-emerald-500' },
    { label: 'Total Stok Keluar', value: totalStockOut, icon: 'fa-arrow-up', color: 'bg-rose-500' },
    { label: 'Nilai Stok Akhir', value: formatCurrency(totalInventoryValue), icon: 'fa-wallet', color: 'bg-amber-500' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, i) => (
        <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center text-white shadow-inner`}>
            <i className={`fas ${stat.icon} text-lg`}></i>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
            <p className="text-xl font-bold text-slate-800">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
