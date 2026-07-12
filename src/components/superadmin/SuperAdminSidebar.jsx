import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Building2, FileStack, CreditCard, ScrollText } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', path: '/superadmin', icon: LayoutDashboard, end: true },
  { label: 'Organizaciones', path: '/superadmin/organizations', icon: Building2 },
  { label: 'Plantillas', path: '/superadmin/templates', icon: FileStack },
  { label: 'Planes', path: '/superadmin/plans', icon: CreditCard },
  { label: 'Auditoría', path: '/superadmin/audit', icon: ScrollText },
];

export default function SuperAdminSidebar({ onNavigate }) {
  return (
    <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`
          }
        >
          <item.icon className="flex-shrink-0" style={{ width: 18, height: 18 }} />
          <span className="truncate">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}