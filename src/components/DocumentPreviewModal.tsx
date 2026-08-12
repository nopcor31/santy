import React, { useState, useEffect, useRef } from 'react';
import { renderAsync } from 'docx-preview';
import { Client, WordTemplate } from '../types';
import { downloadBlob } from '../utils/pdfGenerator';
import {
  X,
  FileText,
  Download,
  Mail,
  Loader2,
  Check,
  RefreshCw,
  Printer,
  Sparkles
} from 'lucide-react';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  template: WordTemplate;
  onSendEmailWithPdf: (client: Client, pdfBase64: string, fileName: string) => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  client,
  template,
  onSendEmailWithPdf
}) => {
  const [htmlFallback, setHtmlFallback] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [docxBase64, setDocxBase64] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const docxRenderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !client) return;

    const generatePreview = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/generate/docx', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client,
            templateBase64: template?.fileBase64,
            returnFormat: 'base64'
          })
        });

        const data = await response.json();
        if (response.ok && data.success) {
          setHtmlFallback(data.html);
          setDocxBase64(data.docxBase64);
        } else {
          setError(data.error || 'Error al generar la vista previa del documento.');
        }
      } catch (err: any) {
        setError('Error de conexión con el servidor: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    generatePreview();
  }, [isOpen, client, template]);

  // Render high-fidelity docx preview using docx-preview library when docxBase64 is ready
  useEffect(() => {
    if (!docxBase64 || !docxRenderRef.current) return;

    try {
      const binary = atob(docxBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      docxRenderRef.current.innerHTML = '';
      renderAsync(bytes.buffer, docxRenderRef.current, undefined, {
        className: 'docx-rendered-page',
        inWrapper: true,
        ignoreWidth: false,
        ignoreHeight: false,
        ignoreFonts: false,
        breakPages: true,
        ignoreLastRenderedPageBreak: false,
        experimental: true,
        useBase64URL: true,
        renderHeaders: true,
        renderFooters: true,
        renderFootnotes: true,
        renderEndnotes: true
      }).catch((err) => {
        console.warn('docx-preview warning:', err);
      });
    } catch (err: any) {
      console.error('Error rendering docx-preview:', err);
    }
  }, [docxBase64, loading]);

  if (!isOpen || !client) return null;

  // Download DOCX Word File
  const handleDownloadDocx = () => {
    if (!docxBase64) return;
    const binary = atob(docxBase64);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([array], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });
    downloadBlob(blob, `Documento_${client.clinica.replace(/\s+/g, '_')}.docx`);
  };

  // Download PDF File generated natively from processed DOCX
  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const fileName = `Documento_${client.clinica.replace(/\s+/g, '_')}.pdf`;
      const response = await fetch('/api/generate/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client,
          templateBase64: template?.fileBase64
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        downloadBlob(blob, fileName);
      } else {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Error al generar el PDF nativo desde el servidor');
      }
    } catch (err: any) {
      console.error('Error generando PDF:', err);
      alert('Error al generar PDF: ' + (err?.message || err));
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Generate native PDF and send via email
  const handleSendEmail = async () => {
    setIsGeneratingPdf(true);
    try {
      const fileName = `Documento_${client.clinica.replace(/\s+/g, '_')}.pdf`;
      const response = await fetch('/api/generate/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client,
          templateBase64: template?.fileBase64,
          returnFormat: 'base64'
        })
      });

      const data = await response.json();
      if (response.ok && data.success && data.pdfBase64) {
        onSendEmailWithPdf(client, data.pdfBase64, fileName);
      } else {
        throw new Error(data?.error || 'Error al procesar el PDF nativo para envío');
      }
    } catch (err: any) {
      console.error('Error al procesar PDF para envío:', err);
      alert('Error al procesar PDF para envío: ' + (err?.message || err));
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600/30 text-indigo-400 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Vista Previa Fiel del Documento Word</h3>
              <p className="text-xs text-slate-300">
                Cliente: <span className="text-indigo-300 font-semibold">{client.clinica}</span> ({client.rep_legal})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar Bar */}
        <div className="bg-slate-100 px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-600 flex items-center gap-2">
            <span className="font-semibold text-slate-800">Correo Destino:</span>
            <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-indigo-600 font-medium">
              {client.correo}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadDocx}
              disabled={loading || !docxBase64}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
              title="Descargar archivo Word (.docx) procesado"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Descargar Word (.docx)</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={loading || isGeneratingPdf}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
              title="Convertir vista previa a PDF y descargar"
            >
              {isGeneratingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>Descargar PDF</span>
            </button>

            <button
              onClick={handleSendEmail}
              disabled={loading || isGeneratingPdf}
              className="flex items-center space-x-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
              title="Enviar PDF adjunto por correo electrónico"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Enviar por Correo</span>
            </button>
          </div>
        </div>

        {/* Modal Document Body */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-300/60 flex justify-center docx-preview-container">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center text-slate-600">
              <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-3" />
              <p className="text-sm font-semibold">Procesando plantilla Word e integrando variables...</p>
              <p className="text-xs text-slate-500 mt-1">Cargando marcas de agua, encabezados y formatos originales</p>
            </div>
          ) : error ? (
            <div className="p-8 bg-red-50 border border-red-200 text-red-700 rounded-xl max-w-md text-center my-auto shadow-sm">
              <p className="font-semibold text-sm mb-2">Error al procesar el documento</p>
              <p className="text-xs">{error}</p>
            </div>
          ) : (
            <div ref={previewRef} className="w-full flex justify-center">
              <div ref={docxRenderRef} className="w-full flex flex-col items-center" />
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
