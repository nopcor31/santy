import React, { useState, useRef } from 'react';
import { WordTemplate, Client } from '../types';
import { FileText, Upload, Download, Check, AlertTriangle, RefreshCw, Eye, Sparkles } from 'lucide-react';

interface TemplateManagerProps {
  currentTemplate: WordTemplate;
  onUploadCustomTemplate: (file: File) => void;
  onResetTemplate?: () => void;
  onDownloadSampleWord: () => void;
  clients: Client[];
  onPreviewClientDocument: (client: Client) => void;
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({
  currentTemplate,
  onUploadCustomTemplate,
  onResetTemplate,
  onDownloadSampleWord,
  clients,
  onPreviewClientDocument
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || '');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.docx')) {
        alert('Por favor seleccione un archivo con formato Word (.docx).');
        return;
      }
      onUploadCustomTemplate(file);
    }
  };

  const selectedClient = clients.find(c => c.id === selectedClientId) || clients[0];

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 mb-2">
            <FileText className="w-3.5 h-3.5 text-blue-400" /> Plantilla Word (.docx)
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Configuración de Plantilla Word
          </h2>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Sube tu propia plantilla en formato <span className="text-blue-300 font-mono font-semibold">.docx</span> con las etiquetas <span className="text-blue-300 font-mono font-semibold">{"{{Clinica}}"}</span>, <span className="text-blue-300 font-mono font-semibold">{"{{Rep_legal}}"}</span> y <span className="text-blue-300 font-mono font-semibold">{"{{Correo}}"}</span> para personalización automática.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".docx"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-blue-600/30 transition-all border border-blue-400/20"
          >
            <Upload className="w-4 h-4" />
            <span>Subir mi Plantilla (.docx)</span>
          </button>

          <button
            onClick={onDownloadSampleWord}
            className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4 text-blue-400" />
            <span>Descargar Plantilla Base</span>
          </button>
        </div>
      </div>

      {/* Grid: Details & Placeholder Inspector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Template Info Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-bold text-slate-900 leading-snug">{currentTemplate.name}</h3>
                </div>
                {currentTemplate.isDefault ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                    Plantilla por defecto del sistema
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <Check className="w-3 h-3 text-emerald-600" /> Plantilla Personalizada Activa
                  </span>
                )}
              </div>
            </div>

            {!currentTemplate.isDefault && onResetTemplate && (
              <button
                onClick={onResetTemplate}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors border border-slate-200"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span>Restablecer Plantilla por Defecto</span>
              </button>
            )}

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Variables soportadas:
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg font-mono text-xs font-semibold border border-slate-200">
                  {"{{Clinica}}"}
                </span>
                <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg font-mono text-xs font-semibold border border-slate-200">
                  {"{{Rep_legal}}"}
                </span>
                <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg font-mono text-xs font-semibold border border-slate-200">
                  {"{{Correo}}"}
                </span>
                <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg font-mono text-xs font-semibold border border-slate-200">
                  {"{{Fecha}}"}
                </span>
                <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg font-mono text-xs font-semibold border border-slate-200">
                  {"{{Ciudad}}"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview Selector Card */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Eye className="w-5 h-5 text-indigo-600" />
              Probar Combinación de Correspondencia
            </h3>
            <p className="text-xs text-slate-500">
              Seleccione un cliente para ver cómo se reemplazan automáticamente los campos en el documento Word.
            </p>

            {clients.length > 0 ? (
              <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
                <select
                  value={selectedClientId}
                  onChange={e => setSelectedClientId(e.target.value)}
                  className="w-full sm:w-80 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.clinica} ({c.rep_legal})
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => selectedClient && onPreviewClientDocument(selectedClient)}
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>Ver Vista Previa Documento</span>
                </button>
              </div>
            ) : (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                Cargue primero un archivo Excel de clientes para realizar pruebas de llenado.
              </div>
            )}
          </div>

          {selectedClient && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs space-y-1">
              <span className="font-semibold text-slate-700 block mb-1">Mapeo de Datos Activo:</span>
              <div className="grid grid-cols-2 gap-2 text-slate-600 font-mono">
                <div>{"{{Clinica}}"} → <span className="font-sans font-bold text-slate-900">{selectedClient.clinica}</span></div>
                <div>{"{{Rep_legal}}"} → <span className="font-sans font-bold text-slate-900">{selectedClient.rep_legal}</span></div>
                <div>{"{{Correo}}"} → <span className="font-sans font-bold text-indigo-600">{selectedClient.correo}</span></div>
                <div>{"{{Fecha}}"} → <span className="font-sans font-bold text-slate-900">{selectedClient.fecha}</span></div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
