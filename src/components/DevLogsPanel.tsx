import React, { useState, useEffect } from 'react';
import { DevLog } from '../types';
import { Terminal, RefreshCw, Trash2, X, ChevronDown, ChevronUp, Bell } from 'lucide-react';

export default function DevLogsPanel() {
  const [logs, setLogs] = useState<DevLog[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastCount, setLastCount] = useState(0);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/dev/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
        if (data.length > lastCount) {
          if (lastCount > 0) {
            setUnreadCount(prev => prev + (data.length - lastCount));
          }
          setLastCount(data.length);
        }
      }
    } catch (err) {
      console.error('Failed fetching dev logs:', err);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, [lastCount]);

  const clearLogs = async () => {
    if (!confirm('Are you sure you want to clear the simulated server logs?')) return;
    try {
      await fetch('/api/dev/logs', { method: 'DELETE' });
      setLogs([]);
      setLastCount(0);
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0);
    }
  };

  return (
    <div id="dev_logs_panel_root" className="fixed bottom-4 right-4 z-50 font-mono text-xs shadow-2xl transition-all duration-300">
      {/* Mini trigger button */}
      {!isOpen && (
        <button
          onClick={toggleOpen}
          id="btn_open_logs"
          className="relative flex items-center gap-2 bg-slate-900 border border-amber-500/30 text-amber-400 px-3 py-2 rounded-full cursor-pointer hover:bg-slate-850 hover:border-amber-400 transition"
        >
          <Terminal className="w-4 h-4 animate-pulse" />
          <span>Dev Gateway Logs</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full px-1.5 py-0.5 text-[9px] font-bold animate-bounce flex items-center justify-center">
              <Bell className="w-2 h-2 mr-0.5" />
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Expanded Log Console */}
      {isOpen && (
        <div className="bg-slate-950 border border-slate-800 rounded-lg w-96 max-w-[calc(100vw-2rem)] overflow-hidden flex flex-col h-96">
          {/* Header */}
          <div className="bg-slate-900 border-b border-slate-850 px-3 py-2 flex items-center justify-between text-slate-350">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-slate-100">Live API Gateways Simulation</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={fetchLogs}
                id="btn_refresh_logs"
                title="Refresh logs"
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-100 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={clearLogs}
                id="btn_clear_logs"
                title="Clear logs"
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-rose-400 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={toggleOpen}
                id="btn_close_logs"
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-100 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Description and instructions */}
          <div className="bg-amber-950/20 text-amber-300 border-b border-amber-900/30 p-2 text-[10px]">
            💡 OTP messages, secure admin invite keys, and instant WhatsApp dispatches are simulated here in real-time. Use these logs for seamless exploration.
          </div>

          {/* Logs feed container */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {logs.length === 0 ? (
              <div className="text-slate-600 text-center py-12 italic">
                Listening for transactions, order requests and SMS actions...
              </div>
            ) : (
              logs.map((log) => {
                const badgeColor =
                  log.type === 'SMS_OTP'
                    ? 'bg-sky-950 text-sky-300 border border-sky-850'
                    : log.type === 'EMAIL_PASSWORD'
                    ? 'bg-amber-950 text-amber-300 border border-amber-850'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-850';

                return (
                  <div key={log.id} className="bg-slate-900/50 p-2 rounded border border-slate-900 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${badgeColor}`}>
                        {log.type}
                      </span>
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>

                    <div className="text-slate-350">
                      <span className="text-slate-500">To: </span>
                      <span className="text-amber-200/90 font-semibold select-all">{log.recipient}</span>
                    </div>

                    <div className="text-emerald-400 font-mono text-[11px] bg-slate-950/80 p-1.5 rounded border border-slate-900/50 whitespace-pre-wrap leading-relaxed select-all">
                      {log.message}
                    </div>

                    {/* Metadata details */}
                    <div className="text-[9px] text-slate-500">
                      <details className="cursor-pointer">
                        <summary className="hover:text-slate-400 select-none">Show full API dispatch payload</summary>
                        <pre className="mt-1 bg-slate-950 p-1 rounded overflow-x-auto text-[8px] select-all">
                          {JSON.stringify(log.payload, null, 2)}
                        </pre>
                      </details>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
