import React from 'react';

export default function StatCard({ label, value, sublabel, icon: Icon }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
            <Icon className="w-4 h-4 text-slate-400" />
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {sublabel && <p className="text-xs text-slate-400 mt-1">{sublabel}</p>}
    </div>
  );
}