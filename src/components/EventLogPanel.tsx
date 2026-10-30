import React from 'react';
import { Terminal, Trash2 } from 'lucide-react';

export interface LogEntry {
  type: string;
  message: string;
  timestamp: string;
}

interface EventLogPanelProps {
  logs: LogEntry[];
  onClear: () => void;
}

export const EventLogPanel: React.FC<EventLogPanelProps> = ({ logs, onClear }) => {
  return (
    <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col h-[280px]">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-2.5">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-slate-200">
            Android OS Real-Time Event Log (Accessibility &amp; Device Admin)
          </span>
          <span className="text-[10px] text-slate-500 font-mono">({logs.length} events)</span>
        </div>

        <button
          onClick={onClear}
          className="text-slate-500 hover:text-slate-300 text-[10px] flex items-center space-x-1"
          title="Clear Logs"
        >
          <Trash2 className="w-3 h-3" />
          <span>Clear</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1.5 font-mono text-[11px] pr-1">
        {logs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-600 text-xs italic">
            इथे Android OS इव्हेंट्स आणि ऍक्सेसिबिलिटी कॉल्स रिअल-टाईम दिसतील...
          </div>
        ) : (
          logs.map((log, idx) => {
            const isTamper = log.type.includes('TAMPER');
            const isIntercept = log.type.includes('INTERCEPT');
            const isUnlock = log.type.includes('UNLOCK');

            return (
              <div
                key={idx}
                className={`p-1.5 rounded-lg border transition-all flex items-start space-x-2 ${
                  isTamper
                    ? 'bg-rose-950/40 border-rose-800/40 text-rose-200'
                    : isIntercept
                    ? 'bg-amber-950/30 border-amber-800/30 text-amber-200'
                    : isUnlock
                    ? 'bg-emerald-950/30 border-emerald-800/30 text-emerald-200'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300'
                }`}
              >
                <span className="text-[10px] text-slate-500 shrink-0">{log.timestamp}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0 ${
                    isTamper
                      ? 'bg-rose-900/80 text-rose-300'
                      : isIntercept
                      ? 'bg-amber-900/80 text-amber-300'
                      : isUnlock
                      ? 'bg-emerald-900/80 text-emerald-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {log.type}
                </span>
                <span className="leading-snug break-words">{log.message}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
