import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Bot, BookOpen, MessageSquare, Users, MessagesSquare, Hand, Plug, UserCog, BarChart3, Settings, CreditCard } from 'lucide-react';

const navItems = [
  { label: 'Inicio', path: '/app', icon: Home, end: true },
  { label: 'Asistente IA', path: '/app/assistant', icon: Bot },
  { label: 'Base de conocimiento', path: '/app/knowledge', icon: BookOpen },
  { label: 'Chat de prueba', path: '/app/test-chat', icon: MessageSquare },
  { label: 'Leads', path: '/app/leads', icon: Users },
  { label: 'Conversaciones', path: '/app/conversations', icon: MessagesSquare },
  { label: 'Solicitudes humanas', path: '/app/human-requests', icon: Hand },
  { label: 'Integraciones', path: '/app/integrations', icon: Plug },
  { label: 'Equipo', path: '/app/team', icon: UserCog },
  { label: 'Métricas', path: '/app/metrics', icon: BarChart3 },
  { label: 'Configuración', path: '/app/settings', icon: Settings },
  { label: 'Plan y consumo', path: '/app/plan', icon: CreditCard },
];

export default function BusinessSidebar({ onNavigate }) {
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
          <item.icon className="w-4.5 h-4.5 flex-shrink-0" style={{ width: 18, height: 18 }} />
          <span className="truncate">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}