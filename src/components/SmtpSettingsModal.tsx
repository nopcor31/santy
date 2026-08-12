import React, { useState } from 'react';
import { EmailConfig, EmailTemplate } from '../types';
import {
  X,
  Settings,
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Server,
  User,
  ExternalLink,
  ShieldCheck,
  Send
} from 'lucide-react';

interface SmtpSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: EmailConfig;
  onSaveConfig: (updatedConfig: EmailConfig) => void;
  emailTemplate: EmailTemplate;
  onSaveEmailTemplate: (template: EmailTemplate) => void;
}

export const SmtpSettingsModal: React.FC<SmtpSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  emailTemplate,
  onSaveEmailTemplate
}) => {
  const [formData, setFormData] = useState<EmailConfig>({ ...config });
  const [templateData, setTemplateData] = useState<EmailTemplate>({ ...emailTemplate });
  const [testing, setTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<{ success?: boolean; message?: string; details?: any } | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTesting(true);
    setTestStatus(null);

    try {
      const response = await fetch('/api/email/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setTestStatus({ success: true, message: data.message, details: data.details });
      } else {
        setTestStatus({ success: false, message: data.error || 'Error de conexión SMTP.' });
      }
    } catch (err: any) {
      setTestStatus({ success: false, message: 'Error al conectar con el servidor: ' + err.message });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formData);
    onSaveEmailTemplate(templateData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-600/30 text-emerald-400 rounded-lg">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Configuración de Envío de Correos</h3>
              <p className="text-xs text-slate-300">Servidor SMTP y Plantilla de Mensaje para Representante Legal</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* SMTP Mode Selection */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Modo de Envío de Correos
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Test Account Option */}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, useTestAccount: true })}
                className={`p-3.5 rounded-xl border text-left flex items-start space-x-3 transition-all ${
                  formData.useTestAccount
                    ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className={`p-2 rounded-lg ${formData.useTestAccount ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900">Modo Pruebas Automático</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    No requiere contraseñas. Genera buzón de prueba live con vista previa de emails.
                  </div>
                </div>
              </button>

              {/* Custom SMTP Option */}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, useTestAccount: false })}
                className={`p-3.5 rounded-xl border text-left flex items-start space-x-3 transition-all ${
                  !formData.useTestAccount
                    ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className={`p-2 rounded-lg ${!formData.useTestAccount ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900">Servidor SMTP Propio</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Para enviar desde tu propio correo real (Gmail, Office365, cPanel, etc.).
                  </div>
                </div>
              </button>

            </div>
          </div>

          {/* Custom SMTP Configuration Controls */}
          {!formData.useTestAccount && (
            <div className="space-y-4 border-t border-slate-200 pt-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Datos del Servidor SMTP
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Servidor SMTP (Host)
                  </label>
                  <input
                    type="text"
                    required={!formData.useTestAccount}
                    placeholder="smtp.gmail.com"
                    value={formData.host}
                    onChange={e => setFormData({ ...formData, host: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Puerto
                  </label>
                  <input
                    type="number"
                    required={!formData.useTestAccount}
                    placeholder="587"
                    value={formData.port}
                    onChange={e => setFormData({ ...formData, port: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Usuario / Correo Remitente
                  </label>
                  <input
                    type="email"
                    required={!formData.useTestAccount}
                    placeholder="miusuario@empresa.com"
                    value={formData.user}
                    onChange={e => setFormData({ ...formData, user: e.target.value, fromEmail: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Contraseña / App Password
                  </label>
                  <input
                    type="password"
                    required={!formData.useTestAccount}
                    placeholder="••••••••••••"
                    value={formData.pass}
                    onChange={e => setFormData({ ...formData, pass: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nombre visible del Remitente
                </label>
                <input
                  type="text"
                  placeholder="Gestión y Administración"
                  value={formData.fromName}
                  onChange={e => setFormData({ ...formData, fromName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center justify-between">
                  <span className="font-bold text-slate-700">Firma HTML</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    Admite texto, tablas, imágenes, links y estilos inline
                  </span>
                </label>
                <textarea
                  rows={4}
                  placeholder='<div style="font-family: Arial, sans-serif; font-size: 13px; color: #333;"><p><b>Atentamente,</b></p><p>Director de Contratación<br>Giaudimedic S.A.S.</p></div>'
                  value={formData.signatureHtml || ''}
                  onChange={e => setFormData({ ...formData, signatureHtml: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {formData.signatureHtml && formData.signatureHtml.trim() && (
                  <div className="mt-2.5 p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Vista Previa de la Firma HTML:
                    </div>
                    <div
                      className="text-xs text-slate-800 border-t border-slate-100 pt-2 font-sans"
                      dangerouslySetInnerHTML={{ __html: formData.signatureHtml }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Test connection button */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Server className="w-3.5 h-3.5 text-emerald-400" />}
              <span>Probar Conexión SMTP</span>
            </button>

            {testStatus && (
              <div className={`text-xs font-semibold flex items-center gap-1.5 ${testStatus.success ? 'text-emerald-600' : 'text-red-600'}`}>
                {testStatus.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{testStatus.message}</span>
              </div>
            )}
          </div>

          {/* Email Body & Subject Template Configuration */}
          <div className="space-y-3 border-t border-slate-200 pt-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
              <span>Plantilla del Mensaje de Correo</span>
              <span className="text-[10px] text-slate-500 normal-case font-mono">
                Variables: {"{{Rep_legal}}"}, {"{{Clinica}}"}
              </span>
            </h4>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Asunto del Correo
              </label>
              <input
                type="text"
                value={templateData.subject}
                onChange={e => setTemplateData({ ...templateData, subject: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Cuerpo del Correo (Texto / HTML)
              </label>
              <textarea
                rows={4}
                value={templateData.body}
                onChange={e => setTemplateData({ ...templateData, body: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
            >
              Guardar Configuración
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
