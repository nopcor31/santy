import React, { useState, useEffect } from 'react';
import { Client, ProcessingLog } from '../types';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Mail,
  ExternalLink,
  X,
  Pause,
  Play,
  Square,
  Clock,
  Zap,
  TrendingUp,
  BarChart2
} from 'lucide-react';

interface BatchProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClients: Client[];
  currentIndex: number;
  isProcessing: boolean;
  isPaused: boolean;
  logs: ProcessingLog[];
  onStartProcess: () => void;
  onPauseProcess: () => void;
  onResumeProcess: () => void;
  onStopProcess: () => void;
  concurrency: number;
  setConcurrency: (val: number) => void;
}

export const BatchProgressModal: React.FC<BatchProgressModalProps> = ({
  isOpen,
  onClose,
  selectedClients,
  currentIndex,
  isProcessing,
  isPaused,
  logs,
  onStartProcess,
  onPauseProcess,
  onResumeProcess,
  onStopProcess,
  concurrency,
  setConcurrency
}) => {
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Timer for elapsed time
  useEffect(() => {
    let timer: any = null;
    if (isProcessing && !isPaused) {
      if (!startTime) setStartTime(Date.now());
      timer = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isProcessing, isPaused, startTime]);

  if (!isOpen) return null;

  const total = selectedClients.length;
  const progressPercent = total > 0 ? Math.min(100, Math.round((currentIndex / total) * 100)) : 0;

  // Calculate success & error counts from logs or currentIndex
  const successCount = logs.filter(l => l.type === 'success').length;
  const errorCount = logs.filter(l => l.type === 'error').length;

  // Estimate speed & ETA
  const speedPerSec = elapsedSeconds > 0 ? (currentIndex / elapsedSeconds).toFixed(1) : '0.0';
  const remainingItems = total - currentIndex;
  const etaSeconds = parseFloat(speedPerSec) > 0 ? Math.ceil(remainingItems / parseFloat(speedPerSec)) : 0;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    if (mins > 60) {
      const hrs = Math.floor(mins / 60);
      return `${hrs}h ${mins % 60}m`;
    }
    return `${mins}m ${s}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-600/30 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-white">Procesamiento y Envío Masivo</h3>
                {isProcessing && (
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300">
                Lote de <strong className="text-emerald-400 font-semibold">{total.toLocaleString('es-ES')}</strong> clientes seleccionados
              </p>
            </div>
          </div>

          {!isProcessing && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Procesados</span>
              <span className="text-lg font-bold text-slate-900">
                {currentIndex.toLocaleString('es-ES')} <span className="text-xs text-slate-400 font-normal">/ {total.toLocaleString('es-ES')}</span>
              </span>
            </div>

            <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-3 text-center">
              <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">Exitosos</span>
              <span className="text-lg font-bold text-emerald-700">
                {successCount.toLocaleString('es-ES')}
              </span>
            </div>

            <div className="bg-red-50 border border-red-200/80 rounded-xl p-3 text-center">
              <span className="text-[11px] font-semibold text-red-700 uppercase tracking-wider block">Errores</span>
              <span className="text-lg font-bold text-red-700">
                {errorCount.toLocaleString('es-ES')}
              </span>
            </div>

            <div className="bg-indigo-50 border border-indigo-200/80 rounded-xl p-3 text-center">
              <span className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider block">Velocidad</span>
              <span className="text-lg font-bold text-indigo-700">
                {speedPerSec} <span className="text-xs font-normal">env/s</span>
              </span>
            </div>
          </div>

          {/* Progress Bar & ETA */}
          <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Tiempo transcurrido: {formatTime(elapsedSeconds)}</span>
              </span>

              {isProcessing && etaSeconds > 0 && (
                <span className="text-indigo-600 font-semibold">
                  ETA restante: ~{formatTime(etaSeconds)}
                </span>
              )}

              <span className="text-sm font-extrabold text-emerald-600">{progressPercent}%</span>
            </div>

            <div className="w-full bg-slate-200 rounded-full h-3.5 overflow-hidden border border-slate-300/80">
              <div
                className="bg-gradient-to-r from-emerald-500 to-indigo-600 h-full transition-all duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Speed / Concurrency Control */}
          <div className="flex items-center justify-between bg-slate-100 p-3 rounded-xl border border-slate-200 text-xs text-slate-700">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="font-semibold">Velocidad de Envío (Hilos Paralelos):</span>
            </div>
            
            <div className="flex items-center space-x-1">
              {[1, 3, 5, 10].map(val => (
                <button
                  key={val}
                  onClick={() => setConcurrency(val)}
                  disabled={isProcessing && !isPaused}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                    concurrency === val
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-200'
                  } disabled:opacity-60`}
                >
                  {val}x
                </button>
              ))}
            </div>
          </div>

          {/* Logs Terminal */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <BarChart2 className="w-3.5 h-3.5 text-slate-500" /> Registro en Tiempo Real
              </h4>
              <span className="text-[11px] text-slate-400">Mostrando últimos eventos</span>
            </div>

            <div className="bg-slate-950 rounded-xl p-4 h-56 overflow-y-auto font-mono text-xs text-slate-200 space-y-2 border border-slate-800 shadow-inner">
              {logs.length === 0 ? (
                <div className="text-slate-500 italic text-center py-16">
                  Presione &quot;Iniciar Envío Masivo&quot; para arrancar el procesamiento...
                </div>
              ) : (
                logs.map(log => (
                  <div
                    key={log.id}
                    className={`flex items-start space-x-2 p-1.5 rounded transition-colors ${
                      log.type === 'success'
                        ? 'text-emerald-400 bg-emerald-950/30 border border-emerald-900/30'
                        : log.type === 'error'
                        ? 'text-red-400 bg-red-950/30 border border-red-900/30'
                        : 'text-slate-300'
                    }`}
                  >
                    <span className="text-[10px] text-slate-500 shrink-0">{log.timestamp}</span>
                    <div className="flex-1">
                      <div>{log.message}</div>
                      {log.testInboxUrl && (
                        <a
                          href={log.testInboxUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-emerald-300 underline mt-1 hover:text-white"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Ver correo de prueba (Ethereal Email)</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Footer Control Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="text-xs text-slate-500 font-medium">
              {isProcessing && !isPaused && (
                <span className="text-emerald-600 font-semibold animate-pulse flex items-center gap-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Procesando envíos...
                </span>
              )}
              {isPaused && (
                <span className="text-amber-600 font-semibold flex items-center gap-1">
                  <Pause className="w-3.5 h-3.5" /> Pausado
                </span>
              )}
            </div>

            <div className="flex items-center space-x-3">
              {/* Start Button */}
              {!isProcessing && currentIndex < total && (
                <button
                  onClick={() => {
                    setStartTime(Date.now());
                    onStartProcess();
                  }}
                  className="flex items-center space-x-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20 transition-all"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Iniciar Envío Masivo</span>
                </button>
              )}

              {/* Pause / Resume Controls */}
              {isProcessing && (
                <>
                  {isPaused ? (
                    <button
                      onClick={onResumeProcess}
                      className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs shadow-sm transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Reanudar</span>
                    </button>
                  ) : (
                    <button
                      onClick={onPauseProcess}
                      className="flex items-center space-x-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl text-xs shadow-sm transition-colors"
                    >
                      <Pause className="w-3.5 h-3.5 fill-white" />
                      <span>Pausar</span>
                    </button>
                  )}

                  <button
                    onClick={onStopProcess}
                    className="flex items-center space-x-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl text-xs shadow-sm transition-colors"
                  >
                    <Square className="w-3.5 h-3.5 fill-white" />
                    <span>Detener</span>
                  </button>
                </>
              )}

              {/* Close Button */}
              {!isProcessing && (
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cerrar
                </button>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
