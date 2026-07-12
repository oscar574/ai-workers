import React from 'react';

export default function Placeholder({ title, description, icon: Icon }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
        {Icon && <Icon className="w-8 h-8 text-slate-400" />}
      </div>
      <h2 className="text-xl font-semibold text-slate-900 mb-2">{title}</h2>
      <p className="text-sm text-slate-500 max-w-md leading-relaxed">{description}</p>
      <span className="mt-5 px-3.5 py-1.5 text-xs font-medium text-slate-500 bg-slate-100 rounded-full">
        Disponible próximamente
      </span>
    </div>
  );
}