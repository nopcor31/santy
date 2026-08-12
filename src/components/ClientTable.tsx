import React, { useState, useMemo, useRef } from 'react';
import { Client } from '../types';
import {
  FileSpreadsheet,
  Upload,
  Search,
  Plus,
  Edit2,
  Trash2,
  FileText,
  Mail,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Database,
  Loader2,
  Filter,
  XCircle
} from 'lucide-react';

interface ClientTableProps {
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  onEditClient: (client: Client) => void;
  onAddClient: () => void;
  onPreviewClientDocument: (client: Client) => void;
  onSendSingleEmail: (client: Client) => void;
  onBatchProcess: (selectedClients: Client[]) => void;
  onDownloadSampleExcel: () => void;
  isLoadingExcel: boolean;
  setIsLoadingExcel: (loading: boolean) => void;
}

export const ClientTable: React.FC<ClientTableProps> = ({
  clients,
  setClients,
  onEditClient,
  onAddClient,
  onPreviewClientDocument,
  onSendSingleEmail,
  onBatchProcess,
  onDownloadSampleExcel,
  isLoadingExcel,
  setIsLoadingExcel
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'sent' | 'generated' | 'error'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fast Memoized Filter
  const filteredClients = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return clients.filter(c => {
      // Status filter check
      if (statusFilter !== 'all' && c.status !== statusFilter) {
        return false;
      }
      if (!term) return true;

      return (
        c.clinica.toLowerCase().includes(term) ||
        c.rep_legal.toLowerCase().includes(term) ||
        c.correo.toLowerCase().includes(term) ||
        (c.ciudad && c.ciudad.toLowerCase().includes(term))
      );
    });
  }, [clients, searchTerm, statusFilter]);

  // Pagination calculation
  const totalItems = filteredClients.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedClients = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredClients.slice(start, start + pageSize);
  }, [filteredClients, safeCurrentPage, pageSize]);

  // Status counts across all clients
  const counts = useMemo(() => {
    let pending = 0;
    let sent = 0;
    let generated = 0;
    let error = 0;
    for (const c of clients) {
      if (c.status === 'sent') sent++;
      else if (c.status === 'generated') generated++;
      else if (c.status === 'error') error++;
      else pending++;
    }
    return { all: clients.length, pending, sent, generated, error };
  }, [clients]);

  // Handle Excel upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoadingExcel(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload/excel', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setClients(data.clients);
        setSelectedIds(new Set(data.clients.map((c: Client) => c.id)));
        setCurrentPage(1);
      } else {
        alert(data.error || 'Error al cargar el archivo Excel.');
      }
    } catch (err: any) {
      alert('Error de conexión al procesar el archivo Excel: ' + err.message);
    } finally {
      setIsLoadingExcel(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Export current list to Excel
  const handleExportToExcel = async () => {
    if (clients.length === 0) return;
    setIsExportingExcel(true);
    try {
      const res = await fetch('/api/export/excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clients: filteredClients })
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Clientes_Exportados_${filteredClients.length}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      } else {
        const errJson = await res.json();
        alert(errJson.error || 'Error exportando archivo Excel.');
      }
    } catch (err: any) {
      alert('Error de conexión al exportar: ' + err.message);
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Selection handlers using Set for fast operations
  const isPageAllSelected = paginatedClients.length > 0 && paginatedClients.every(c => selectedIds.has(c.id));

  const handleToggleSelectPage = () => {
    const next = new Set(selectedIds);
    if (isPageAllSelected) {
      paginatedClients.forEach(c => next.delete(c.id));
    } else {
      paginatedClients.forEach(c => next.add(c.id));
    }
    setSelectedIds(next);
  };

  const handleSelectAllFiltered = () => {
    setSelectedIds(new Set(filteredClients.map(c => c.id)));
  };

  const handleSelectPendingOnly = () => {
    const pendingIds = clients.filter(c => c.status === 'pending' || c.status === 'error').map(c => c.id);
    setSelectedIds(new Set(pendingIds));
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleToggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleDeleteClient = (id: string) => {
    if (confirm('¿Está seguro de eliminar este registro de cliente?')) {
      setClients(prev => prev.filter(c => c.id !== id));
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // Convert selected set to array for batch processing
  const selectedClientsList = useMemo(() => {
    return clients.filter(c => selectedIds.has(c.id));
  }, [clients, selectedIds]);

  return (
    <div className="space-y-6">

      {/* Top Banner / Upload Zone */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Carga Masiva de Archivo Excel
              </span>
              {clients.length > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Database className="w-3.5 h-3.5 text-emerald-400" /> {clients.length.toLocaleString('es-ES')} Registros Cargados
                </span>
              )}
            </div>
            
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Gestor de Base de Datos de Clientes
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Cargue su archivo Excel de contactos para autocompletar la plantilla Word personalizada y enviar notificaciones masivas por correo electrónico.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx, .xls, .csv"
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoadingExcel}
              className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-600/30 transition-all border border-indigo-400/20 disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              <span>{isLoadingExcel ? 'Procesando Excel...' : 'Cargar Archivo Excel'}</span>
            </button>

            <button
              onClick={onDownloadSampleExcel}
              className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-sm font-medium transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Descargar Estructura Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-4">
        
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>Todos</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${statusFilter === 'all' ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>
                {counts.all.toLocaleString('es-ES')}
              </span>
            </button>

            <button
              onClick={() => { setStatusFilter('pending'); setCurrentPage(1); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                statusFilter === 'pending'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/60'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pendientes</span>
              <span className="px-1.5 py-0.5 bg-amber-200/80 text-amber-900 rounded-md text-[10px]">
                {counts.pending.toLocaleString('es-ES')}
              </span>
            </button>

            <button
              onClick={() => { setStatusFilter('sent'); setCurrentPage(1); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                statusFilter === 'sent'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Enviados</span>
              <span className="px-1.5 py-0.5 bg-emerald-200/80 text-emerald-900 rounded-md text-[10px]">
                {counts.sent.toLocaleString('es-ES')}
              </span>
            </button>

            <button
              onClick={() => { setStatusFilter('error'); setCurrentPage(1); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                statusFilter === 'error'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200/60'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Errores</span>
              <span className="px-1.5 py-0.5 bg-red-200/80 text-red-900 rounded-md text-[10px]">
                {counts.error.toLocaleString('es-ES')}
              </span>
            </button>
          </div>

          {/* Export to Excel */}
          {clients.length > 0 && (
            <button
              onClick={handleExportToExcel}
              disabled={isExportingExcel}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 transition-colors disabled:opacity-50"
            >
              {isExportingExcel ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-600" />
              ) : (
                <Download className="w-3.5 h-3.5 text-emerald-600" />
              )}
              <span>Exportar Vista a Excel</span>
            </button>
          )}
        </div>

        {/* Search Input & Action Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Search */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Buscar clínica, representante, correo o ciudad..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Mass Actions */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            
            {/* Batch Send Selected */}
            {selectedIds.size > 0 && (
              <button
                onClick={() => onBatchProcess(selectedClientsList)}
                className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all animate-in fade-in"
              >
                <Mail className="w-4 h-4" />
                <span>Generar & Enviar Masivo ({selectedIds.size.toLocaleString('es-ES')})</span>
              </button>
            )}

            <button
              onClick={onAddClient}
              className="flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Cliente</span>
            </button>
          </div>

        </div>

        {/* Mass Selection Tools Bar */}
        {clients.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-slate-600 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80">
            <div className="flex items-center space-x-2 font-medium">
              <span>Selección rápida:</span>
              <button
                onClick={handleSelectAllFiltered}
                className="text-indigo-600 font-semibold hover:underline bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200"
              >
                Todos los filtrados ({filteredClients.length.toLocaleString('es-ES')})
              </button>
              <button
                onClick={handleSelectPendingOnly}
                className="text-amber-700 font-semibold hover:underline bg-amber-50 px-2 py-0.5 rounded border border-amber-200"
              >
                Solo Pendientes ({counts.pending.toLocaleString('es-ES')})
              </button>
              {selectedIds.size > 0 && (
                <button
                  onClick={handleDeselectAll}
                  className="text-slate-500 hover:text-slate-800 hover:underline px-2 py-0.5"
                >
                  Deseleccionar todo
                </button>
              )}
            </div>

            <div className="font-semibold text-slate-700">
              {selectedIds.size > 0 ? (
                <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {selectedIds.size.toLocaleString('es-ES')} clientes seleccionados
                </span>
              ) : (
                <span className="text-slate-400">Sin selección</span>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Main Clients Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredClients.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
              <FileSpreadsheet className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">
              No se encontraron clientes
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
              {searchTerm || statusFilter !== 'all'
                ? 'No hay resultados que coincidan con la búsqueda o filtro aplicado.'
                : 'Haga clic en "Cargar desde Excel" para seleccionar e importar su lista de contactos desde un archivo .xlsx o .csv.'}
            </p>
            <div className="flex items-center justify-center gap-3">
              {(searchTerm || statusFilter !== 'all') ? (
                <button
                  onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-xl transition-colors"
                >
                  Restablecer Filtros
                </button>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
                >
                  Cargar desde Excel
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                    <th className="py-3.5 px-4 w-10 text-center">
                      <button
                        onClick={handleToggleSelectPage}
                        className="text-slate-500 hover:text-indigo-600"
                        title={isPageAllSelected ? "Deseleccionar esta página" : "Seleccionar todos en esta página"}
                      >
                        {isPageAllSelected ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="py-3.5 px-4">Clínica / Institución</th>
                    <th className="py-3.5 px-4">Representante Legal</th>
                    <th className="py-3.5 px-4">Correo Electrónico</th>
                    <th className="py-3.5 px-4">Ciudad / Fecha</th>
                    <th className="py-3.5 px-4 text-center">Estado</th>
                    <th className="py-3.5 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {paginatedClients.map(client => {
                    const isSelected = selectedIds.has(client.id);
                    return (
                      <tr
                        key={client.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isSelected ? 'bg-indigo-50/30' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleToggleSelectOne(client.id)}
                            className="text-slate-400 hover:text-indigo-600"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-indigo-600" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        {/* Clinica */}
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {client.clinica}
                        </td>

                        {/* Rep Legal */}
                        <td className="py-3 px-4 text-slate-700 font-medium">
                          {client.rep_legal}
                        </td>

                        {/* Correo */}
                        <td className="py-3 px-4 text-indigo-600 font-mono text-xs font-medium">
                          {client.correo}
                        </td>

                        {/* Ciudad / Fecha */}
                        <td className="py-3 px-4 text-slate-500 text-xs">
                          <div>{client.ciudad || 'N/A'}</div>
                          <div className="text-slate-400 text-[11px]">{client.fecha}</div>
                        </td>

                        {/* Estado */}
                        <td className="py-3 px-4 text-center">
                          {client.status === 'sent' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Enviado
                            </span>
                          ) : client.status === 'generated' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                              <FileText className="w-3.5 h-3.5 text-blue-600" />
                              Generado
                            </span>
                          ) : client.status === 'error' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800" title={client.errorMessage}>
                              <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                              Error
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              Pendiente
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            
                            {/* Preview / Generate */}
                            <button
                              onClick={() => onPreviewClientDocument(client)}
                              className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Ver Vista Previa y Descargar Word/PDF"
                            >
                              <FileText className="w-4 h-4" />
                            </button>

                            {/* Email */}
                            <button
                              onClick={() => onSendSingleEmail(client)}
                              className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Enviar por Correo Electrónico"
                            >
                              <Mail className="w-4 h-4" />
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => onEditClient(client)}
                              className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Editar Datos del Cliente"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteClient(client.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Eliminar Cliente"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>

                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Footer */}
            <div className="px-6 py-4 bg-slate-50/90 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
              
              {/* Range text */}
              <div className="flex items-center gap-3">
                <span>
                  Mostrando <strong className="text-slate-900">{((safeCurrentPage - 1) * pageSize) + 1}</strong> a <strong className="text-slate-900">{Math.min(safeCurrentPage * pageSize, totalItems).toLocaleString('es-ES')}</strong> de <strong className="text-slate-900">{totalItems.toLocaleString('es-ES')}</strong> clientes
                </span>

                {/* Page Size selector */}
                <div className="flex items-center space-x-1.5 pl-3 border-l border-slate-300">
                  <span className="text-slate-500">Filas por página:</span>
                  <select
                    value={pageSize}
                    onChange={e => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                  >
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={250}>250</option>
                    <option value={500}>500</option>
                    <option value={1000}>1,000</option>
                  </select>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={safeCurrentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Primera página"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={safeCurrentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Página anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="px-3 py-1 font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg">
                  Página {safeCurrentPage} de {totalPages.toLocaleString('es-ES')}
                </span>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={safeCurrentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Página siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={safeCurrentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Última página"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          </>
        )}
      </div>

    </div>
  );
};
