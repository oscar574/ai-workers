import React, { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useOrg } from '@/lib/OrgContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, RotateCcw, Zap, User, Bot, AlertTriangle, Loader2 } from 'lucide-react';

export default function TestChat() {
  const { effectiveOrg } = useOrg();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [debug, setDebug] = useState(null);
  const [usageWarning, setUsageWarning] = useState(null);
  const [limitReached, setLimitReached] = useState(false);
  const [employee, setEmployee] = useState(null);
  const [knowledgeCount, setKnowledgeCount] = useState(0);
  const [activating, setActivating] = useState(false);
  const scrollRef = useRef(null);

  const primaryColor = effectiveOrg?.primary_color || '#4f46e5';
  const canActivate = employee && knowledgeCount > 0 && employee.welcome_message && employee.human_contact_phone;

  const init = async () => {
    if (!effectiveOrg) return;
    setInitializing(true);
    try {
      // Load employee and knowledge for the activate button
      const emps = await base44.entities.AIEmployee.filter({ organization_id: effectiveOrg.id });
      if (emps.length > 0) setEmployee(emps[0]);
      const kn = await base44.entities.KnowledgeItem.filter({ organization_id: effectiveOrg.id, status: 'active' });
      setKnowledgeCount(kn.length);

      // Init conversation — get welcome message
      const res = await base44.functions.invoke('chat-message', {});
      if (res.data.limit_reached) {
        setLimitReached(true);
        setMessages([{ role: 'assistant', content: res.data.reply }]);
      } else {
        setConversationId(res.data.conversation_id);
        setMessages([{ role: 'assistant', content: res.data.reply }]);
      }
    } catch (e) {
      setMessages([{ role: 'assistant', content: 'Error al iniciar el chat: ' + (e.response?.data?.error || e.message) }]);
    } finally {
      setInitializing(false);
    }
  };

  useEffect(() => { init(); }, [effectiveOrg?.id]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading || limitReached) return;
    const text = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);
    setDebug(null);
    try {
      const res = await base44.functions.invoke('chat-message', {
        message_text: text,
        conversation_id: conversationId
      });
      const d = res.data;
      if (d.limit_reached) {
        setLimitReached(true);
        setMessages(prev => [...prev, { role: 'assistant', content: d.reply }]);
        return;
      }
      setConversationId(d.conversation_id);
      setMessages(prev => [...prev, { role: 'assistant', content: d.reply }]);
      setDebug({
        intent: d.intent,
        lead_data: d.lead_data,
        qualification: d.qualification,
        action: d.action,
        confidence: d.confidence,
        summary: d.conversation_summary
      });
      if (d.usage_warning) setUsageWarning(d.usage_warning);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error: ' + (e.response?.data?.error || e.message) }]);
    } finally {
      setLoading(false);
    }
  };

  const restart = async () => {
    if (loading) return;
    setLoading(true);
    setDebug(null);
    setUsageWarning(null);
    setLimitReached(false);
    try {
      const res = await base44.functions.invoke('chat-message', {
        restart: true,
        conversation_id: conversationId
      });
      if (res.data.limit_reached) {
        setLimitReached(true);
        setMessages([{ role: 'assistant', content: res.data.reply }]);
      } else {
        setConversationId(res.data.conversation_id);
        setMessages([{ role: 'assistant', content: res.data.reply }]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const activate = async () => {
    if (!canActivate || activating) return;
    setActivating(true);
    try {
      await base44.entities.AIEmployee.update(employee.id, { status: 'active' });
      setEmployee({ ...employee, status: 'active' });
    } catch (e) {
      console.error(e);
    } finally {
      setActivating(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  if (initializing) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  const intentLabels = { faq: 'Consulta', sales: 'Venta', appointment: 'Cita', support: 'Soporte', complaint: 'Queja', human_request: 'Humano', unknown: 'Desconocido' };
  const actionLabels = { none: 'Ninguna', save_lead: 'Guardar lead', request_appointment: 'Solicitar cita', request_human: 'Transferir a humano', send_notification: 'Notificar', unknown_question: 'Pregunta desconocida' };
  const qualLabels = { unqualified: 'No calificado', in_progress: 'En progreso', qualified: 'Calificado' };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Chat de prueba</h1>
          <p className="text-sm text-slate-500 mt-1">Prueba tu asistente antes de publicarlo</p>
        </div>
        <div className="flex items-center gap-2">
          {employee?.status !== 'active' ? (
            <Button onClick={activate} disabled={!canActivate || activating} className="bg-slate-900 hover:bg-slate-800">
              <Zap className="w-4 h-4 mr-1.5" /> {activating ? 'Activando...' : 'Activar asistente'}
            </Button>
          ) : (
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">● Activo</Badge>
          )}
          <Button onClick={restart} variant="outline" disabled={loading}>
            <RotateCcw className="w-4 h-4 mr-1.5" /> Reiniciar
          </Button>
        </div>
      </div>

      {employee?.status !== 'active' && !canActivate && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Para activar el asistente necesitas: al menos 1 elemento de conocimiento, mensaje de bienvenida y teléfono de transferencia.
        </div>
      )}
      {usageWarning && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {usageWarning}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chat panel */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 flex flex-col" style={{ height: '70vh' }}>
          <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium" style={{ backgroundColor: primaryColor }}>
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">{employee?.name || 'Asistente'}</p>
              <p className="text-xs text-slate-400">{employee?.role || ''}</p>
            </div>
            <div className="ml-auto">
              {employee?.status === 'active' ? (
                <span className="text-xs text-green-600 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" />En línea</span>
              ) : (
                <span className="text-xs text-slate-400 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-300" />Borrador</span>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0" style={{ backgroundColor: primaryColor }}>
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap ${m.role === 'user'
                    ? 'bg-slate-900 text-white rounded-tr-sm'
                    : 'bg-slate-100 text-slate-900 rounded-tl-sm'
                  }`}
                >
                  {m.content}
                </div>
                {m.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 flex-shrink-0">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white flex-shrink-0" style={{ backgroundColor: primaryColor }}>
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          {!limitReached && (
            <div className="p-3 border-t border-slate-200 flex items-center gap-2">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe un mensaje..."
                disabled={loading}
                className="flex-1"
              />
              <Button onClick={send} disabled={loading || !input.trim()} className="bg-slate-900 hover:bg-slate-800" size="icon">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Debug panel */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4 overflow-y-auto" style={{ maxHeight: '70vh' }}>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1">Panel de depuración</h3>
            <p className="text-xs text-slate-400">Datos del último mensaje procesado</p>
          </div>

          {!debug ? (
            <div className="text-sm text-slate-400 py-8 text-center">Envía un mensaje para ver el análisis</div>
          ) : (
            <>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Intención</p>
                <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-100">{intentLabels[debug.intent] || debug.intent}</Badge>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Confianza</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.round((debug.confidence || 0) * 100)}%`, backgroundColor: primaryColor }} />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{Math.round((debug.confidence || 0) * 100)}%</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Calificación</p>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-100">{qualLabels[debug.qualification?.status] || debug.qualification?.status}</Badge>
                  <span className="text-sm text-slate-500">Score: {debug.qualification?.score || 0}</span>
                </div>
                {debug.qualification?.missing_fields?.length > 0 && (
                  <p className="text-xs text-slate-400 mt-1">Faltan: {debug.qualification.missing_fields.join(', ')}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Datos del lead</p>
                <div className="bg-slate-50 rounded-lg p-2.5 space-y-1 text-xs">
                  {debug.lead_data && Object.entries(debug.lead_data).map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-slate-400 capitalize">{k.replace(/_/g, ' ')}</span>
                      <span className="text-slate-700 font-medium text-right">{v || '—'}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Acción recomendada</p>
                <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-100">{actionLabels[debug.action?.type] || debug.action?.type}</Badge>
                {debug.action?.reason && <p className="text-xs text-slate-400 mt-1">{debug.action.reason}</p>}
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Resumen</p>
                <p className="text-xs text-slate-600 bg-slate-50 rounded-lg p-2.5">{debug.summary || '—'}</p>
              </div>
            </>
          )}

          <div className="pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-400">
            <p>Conocimiento activo: {knowledgeCount} elementos</p>
            <p>Estado: {employee?.status || '—'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}