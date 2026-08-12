import React from 'react';
import { ProcessingLog } from '../types';
import { Mail, CheckCircle2, AlertCircle, ExternalLink, Trash2 } from 'lucide-react';

interface EmailLogDrawerProps {
  logs: ProcessingLog[];
  onClearLogs: () => void;
}

export const EmailLogDrawer: React.FC<EmailLogDrawerProps> = ({ logs, onClearLogs }) => {
  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-xl flex items-center justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-2">
            <Mail className="w-3.5 h-3.5 text-emerald-400" /> Historial de Notificaciones
          </span>
          <h2 className="text-2xl font-bold text-white">Auditoría y Registros de Correo</h2>
          <p className="text-sm text-slate-300 mt-1">
            Visualice los envíos realizados, confirmaciones de recibo y accesos a la bandeja de prueba.
          </p>
        </div>

        {logs.length > 0 && (
          <button
            onClick={onClearLogs}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
            <span>Limpiar Historial</span>
          </button>
        )}
      </div>

      {/* Logs Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Mail className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p className="font-semibold text-sm">No hay registros de envío todavía</p>
            <p className="text-xs text-slate-400 mt-1">
              Los correos enviados figurarán aquí con hora, estado y link a la bandeja de prueba.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {logs.map(log => (
              <div key={log.id} className="p-4 hover:bg-slate-50 flex items-start justify-between gap-4 transition-colors">
                
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5">
                    {log.type === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{log.message}</div>
                    {log.details && (
                      <div className="text-xs text-slate-500 mt-0.5">{log.details}</div>
                    )}
                    <div className="text-[11px] text-slate-400 mt-1 font-mono">{log.timestamp}</div>
                  </div>
                </div>

                {log.testInboxUrl && (
                  <a
                    href={log.testInboxUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition-colors shrink-0"
                  >
                    <span>Ver Email en Ethereal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
