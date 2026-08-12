import React from 'react';
import { FileSpreadsheet, FileText, Mail, Settings, Download, Plus, Layers } from 'lucide-react';

interface NavbarProps {
  activeTab: 'clients' | 'template' | 'logs';
  setActiveTab: (tab: 'clients' | 'template' | 'logs') => void;
  clientCount: number;
  sentCount: number;
  openSmtpSettings: () => void;
  onDownloadSampleExcel: () => void;
  onDownloadSampleWord: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  clientCount,
  sentCount,
  openSmtpSettings,
  onDownloadSampleExcel,
  onDownloadSampleWord
}) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo / Title */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-tr from-indigo-600 to-blue-500 rounded-xl shadow-lg shadow-indigo-500/20">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                DocuSend <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium border border-indigo-500/30">PDF & Word</span>
              </h1>
              <p className="text-xs text-slate-400">Generador de Documentos y Envíos por Correo</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setActiveTab('clients')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'clients'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Clientes</span>
              {clientCount > 0 && (
                <span className="ml-1 px-2 py-0.2 text-xs bg-indigo-950 text-indigo-200 rounded-full border border-indigo-700">
                  {clientCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('template')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'template'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Plantilla Word</span>
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'logs'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>Historial & Envíos</span>
              {sentCount > 0 && (
                <span className="ml-1 px-2 py-0.2 text-xs bg-emerald-950 text-emerald-300 rounded-full border border-emerald-800">
                  {sentCount}
                </span>
              )}
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <div className="hidden lg:flex items-center space-x-2 border-r border-slate-800 pr-3 mr-1">
              <button
                onClick={onDownloadSampleExcel}
                title="Descargar Excel con formato y datos de prueba"
                className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-800/80 rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Ejemplo Excel</span>
              </button>

              <button
                onClick={onDownloadSampleWord}
                title="Descargar Plantilla Word (.docx) con {{Clinica}}, {{Rep_legal}}, {{Correo}}"
                className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-blue-300 bg-blue-950/50 hover:bg-blue-900/60 border border-blue-800/80 rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Ejemplo Word</span>
              </button>
            </div>

            <button
              onClick={openSmtpSettings}
              className="flex items-center space-x-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 transition-colors"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span className="hidden sm:inline">Config. Correo</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
