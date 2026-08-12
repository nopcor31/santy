import React, { useState, useEffect } from 'react';
import { Client } from '../types';
import { X, Save, User, Building, Mail, MapPin, Calendar, Plus, Trash2 } from 'lucide-react';

interface ClientEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onSave: (updatedClient: Client) => void;
}

export const ClientEditModal: React.FC<ClientEditModalProps> = ({
  isOpen,
  onClose,
  client,
  onSave
}) => {
  const [formData, setFormData] = useState<Partial<Client>>({
    clinica: '',
    rep_legal: '',
    correo: '',
    ciudad: 'Bogotá D.C.',
    fecha: new Date().toLocaleDateString('es-ES'),
    extraData: {}
  });

  const [customKey, setCustomKey] = useState('');
  const [customVal, setCustomVal] = useState('');

  useEffect(() => {
    if (client) {
      setFormData({
        ...client,
        extraData: { ...(client.extraData || {}) }
      });
    } else {
      setFormData({
        clinica: '',
        rep_legal: '',
        correo: '',
        ciudad: 'Bogotá D.C.',
        fecha: new Date().toLocaleDateString('es-ES'),
        extraData: {}
      });
    }
  }, [client, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clinica || !formData.rep_legal || !formData.correo) {
      alert('Por favor complete los campos obligatorios: CLINICA, REP_LEGAL y CORREO.');
      return;
    }

    const updated: Client = {
      id: formData.id || `client_${Date.now()}`,
      clinica: formData.clinica.trim(),
      rep_legal: formData.rep_legal.trim(),
      correo: formData.correo.trim(),
      ciudad: formData.ciudad?.trim() || 'Bogotá D.C.',
      fecha: formData.fecha || new Date().toLocaleDateString('es-ES'),
      extraData: formData.extraData || {},
      status: formData.status || 'pending'
    };

    onSave(updated);
    onClose();
  };

  const handleAddCustomField = () => {
    if (!customKey.trim() || !customVal.trim()) return;
    setFormData(prev => ({
      ...prev,
      extraData: {
        ...(prev.extraData || {}),
        [customKey.trim()]: customVal.trim()
      }
    }));
    setCustomKey('');
    setCustomVal('');
  };

  const handleRemoveCustomField = (keyToRemove: string) => {
    setFormData(prev => {
      const nextExtra = { ...(prev.extraData || {}) };
      delete nextExtra[keyToRemove];
      return { ...prev, extraData: nextExtra };
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-lg text-white">
              {client ? 'Editar Cliente / Clínica' : 'Agregar Nuevo Cliente'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Clinica */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Clínica / Empresa <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                placeholder="Ej. Clínica San Rafael S.A.S."
                value={formData.clinica}
                onChange={e => setFormData({ ...formData, clinica: e.target.value })}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-medium"
              />
            </div>
          </div>

          {/* Rep Legal */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Representante Legal <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                placeholder="Ej. Dra. María Fernanda Gómez"
                value={formData.rep_legal}
                onChange={e => setFormData({ ...formData, rep_legal: e.target.value })}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-medium"
              />
            </div>
          </div>

          {/* Correo */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Correo Electrónico <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="Ej. maria.gomez@clinica.com"
                value={formData.correo}
                onChange={e => setFormData({ ...formData, correo: e.target.value })}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-medium"
              />
            </div>
          </div>

          {/* Grid: Ciudad & Fecha */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Ciudad
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Bogotá"
                  value={formData.ciudad}
                  onChange={e => setFormData({ ...formData, ciudad: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Fecha
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={formData.fecha}
                  onChange={e => setFormData({ ...formData, fecha: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Extra Custom Fields */}
          <div className="pt-2 border-t border-slate-200">
            <span className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Campos Adicionales para Plantilla
            </span>

            {/* List Existing Extra Data */}
            {formData.extraData && Object.keys(formData.extraData).length > 0 && (
              <div className="space-y-1.5 mb-3 max-h-32 overflow-y-auto pr-1">
                {Object.entries(formData.extraData).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between bg-slate-100 px-3 py-1.5 rounded-lg text-xs">
                    <span className="font-mono font-medium text-slate-700">{`{{${k}}}`}: <span className="font-sans font-normal text-slate-900">{v}</span></span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomField(k)}
                      className="text-slate-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Custom Field Inputs */}
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Nombre Campo (ej. NIT)"
                value={customKey}
                onChange={e => setCustomKey(e.target.value)}
                className="w-1/2 px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <input
                type="text"
                placeholder="Valor (ej. 900.123.456-1)"
                value={customVal}
                onChange={e => setCustomVal(e.target.value)}
                className="w-1/2 px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddCustomField}
                className="p-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                title="Agregar campo personalizado"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium shadow-md transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Cliente</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
