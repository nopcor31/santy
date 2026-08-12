import React, { useState, useRef } from 'react';
import { Client, WordTemplate, EmailConfig, EmailTemplate, ProcessingLog } from './types';
import { parseApiResponse } from './utils/api';
import { Navbar } from './components/Navbar';
import { ClientTable } from './components/ClientTable';
import { ClientEditModal } from './components/ClientEditModal';
import { TemplateManager } from './components/TemplateManager';
import { DocumentPreviewModal } from './components/DocumentPreviewModal';
import { SmtpSettingsModal } from './components/SmtpSettingsModal';
import { BatchProgressModal } from './components/BatchProgressModal';
import { EmailLogDrawer } from './components/EmailLogDrawer';

export default function App() {
  const [activeTab, setActiveTab] = useState<'clients' | 'template' | 'logs'>('clients');

  // Initial Clients (empty, ready for uploaded Excel)
  const [clients, setClients] = useState<Client[]>([]);

  // Current Active Template
  const [currentTemplate, setCurrentTemplate] = useState<WordTemplate>({
    id: 'default_template',
    name: 'PROPUESTA COMERCIAL.docx',
    isDefault: true,
    placeholders: ['Clinica', 'Rep_legal', 'Correo', 'Fecha', 'Ciudad']
  });

  // SMTP Settings Config with LocalStorage persistence
  const [emailConfig, setEmailConfig] = useState<EmailConfig>(() => {
    try {
      const saved = localStorage.getItem('app_smtp_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (_) {}

    return {
      useTestAccount: false,
      host: 'smtp.zoho.com',
      port: 465,
      secure: true,
      user: 'director.contratacion@giaudimedic.com',
      pass: 'Andresito.2026*',
      fromName: 'Director de Contratación - Giaudimedic',
      fromEmail: 'director.contratacion@giaudimedic.com',
      signatureHtml: `<div style="font-family: Arial, sans-serif; font-size: 13px; color: #333333; margin-top: 20px; border-top: 2px solid #0284c7; padding-top: 12px;">
  <p style="margin: 0 0 4px 0;"><strong style="color: #0284c7; font-size: 14px;">Director de Contratación</strong></p>
  <p style="margin: 0 0 4px 0; font-weight: bold; color: #1e293b;">Giaudimedic S.A.S.</p>
  <p style="margin: 0; color: #64748b; font-size: 12px;">Correo: <a href="mailto:director.contratacion@giaudimedic.com" style="color: #0284c7; text-decoration: none;">director.contratacion@giaudimedic.com</a></p>
</div>`
    };
  });

  const handleSaveSmtpConfig = (updatedConfig: EmailConfig) => {
    setEmailConfig(updatedConfig);
    try {
      localStorage.setItem('app_smtp_config', JSON.stringify(updatedConfig));
    } catch (_) {}
  };

  // Email Body Template
  const [emailTemplate, setEmailTemplate] = useState<EmailTemplate>({
    subject: 'Notificación Oficial y Documentación Adjunta - {{Clinica}}',
    body: 'Estimado(a) {{Rep_legal}},\n\nLe enviamos adjunto en formato PDF el documento oficial correspondiente a {{Clinica}}.\n\nPor favor confirme la recepción de este mensaje.\n\nAtentamente,\nDepartamento de Gestión y Administración'
  });

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewingClient, setPreviewingClient] = useState<Client | null>(null);

  const [isSmtpModalOpen, setIsSmtpModalOpen] = useState(false);

  // Batch Processing State
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchClients, setBatchClients] = useState<Client[]>([]);
  const [batchCurrentIndex, setBatchCurrentIndex] = useState(0);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [concurrency, setConcurrency] = useState(3);

  const isPausedRef = useRef(false);
  const isStoppedRef = useRef(false);

  // Logs state
  const [logs, setLogs] = useState<ProcessingLog[]>([]);
  const [isLoadingExcel, setIsLoadingExcel] = useState(false);

  // Handlers for Sample Downloads
  const handleDownloadSampleExcel = () => {
    window.open('/api/sample/excel', '_blank');
  };

  const handleDownloadSampleWord = () => {
    window.open('/api/sample/docx', '_blank');
  };

  // Upload custom Word template
  const handleUploadCustomTemplate = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const resultStr = reader.result as string;
      const base64 = resultStr.includes(',') ? resultStr.split(',')[1] : resultStr;

      try {
        const res = await fetch('/api/template/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ templateBase64: base64, name: file.name })
        });
        const parsed = await parseApiResponse(res);
        if (!parsed.ok || !parsed.data?.success) {
          alert(parsed.error || 'Error al guardar la plantilla en el servidor');
          return;
        }

        setCurrentTemplate({
          id: `custom_${Date.now()}`,
          name: file.name,
          isDefault: false,
          placeholders: ['Clinica', 'Rep_legal', 'Correo', 'Fecha', 'Ciudad'],
          fileBase64: base64
        });

        alert(`Plantilla Word "${file.name}" cargada y vinculada correctamente.`);
      } catch (err: any) {
        alert('Error al guardar plantilla Word: ' + err.message);
      }
    };
    reader.readAsDataURL(file);
  };

  // Reset template to default
  const handleResetTemplate = async () => {
    try {
      const res = await fetch('/api/template/reset', { method: 'DELETE' });
      const parsed = await parseApiResponse(res);
      if (parsed.ok) {
        setCurrentTemplate({
          id: 'default_template',
          name: 'Carta de Notificación Oficial (.docx)',
          isDefault: true,
          placeholders: ['Clinica', 'Rep_legal', 'Correo', 'Fecha', 'Ciudad']
        });
        alert('Se ha restablecido a la plantilla base del sistema.');
      } else {
        alert(parsed.error || 'Error al restablecer plantilla.');
      }
    } catch (err: any) {
      alert('Error al restablecer plantilla: ' + err.message);
    }
  };

  // Add / Edit Client
  const handleSaveClient = (client: Client) => {
    setClients(prev => {
      const exists = prev.some(c => c.id === client.id);
      if (exists) {
        return prev.map(c => (c.id === client.id ? client : c));
      }
      return [client, ...prev];
    });
  };

  // Open Preview for client
  const handleOpenPreview = (client: Client) => {
    setPreviewingClient(client);
    setIsPreviewModalOpen(true);
  };

  // Single Email Sending Process
  const handleSendSingleEmail = async (client: Client, customPdfBase64?: string, customFileName?: string) => {
    try {
      let pdfBase64 = customPdfBase64;
      let fileName = customFileName || `Documento_${client.clinica.replace(/\s+/g, '_')}.pdf`;

      if (!pdfBase64) {
        // Fetch native PDF directly from processed DOCX template on backend
        const genRes = await fetch('/api/generate/pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client,
            templateBase64: currentTemplate?.fileBase64,
            returnFormat: 'base64'
          })
        });
        const genParsed = await parseApiResponse(genRes);
        if (!genParsed.ok || !genParsed.data?.success || !genParsed.data?.pdfBase64) {
          throw new Error(genParsed.error || 'Error al generar el PDF nativo desde la plantilla Word');
        }
        pdfBase64 = genParsed.data.pdfBase64;
      }

      // Populate subject and body
      const subject = emailTemplate.subject
        .replace(/\{\{Clinica\}\}/gi, client.clinica)
        .replace(/\{\{Rep_legal\}\}/gi, client.rep_legal);

      const body = emailTemplate.body
        .replace(/\{\{Clinica\}\}/gi, client.clinica)
        .replace(/\{\{Rep_legal\}\}/gi, client.rep_legal);

      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: client.correo,
          repName: client.rep_legal,
          clinicaName: client.clinica,
          subject,
          body,
          smtpConfig: emailConfig,
          fileName,
          fileBase64: pdfBase64
        })
      });

      const parsed = await parseApiResponse(response);
      if (parsed.ok && parsed.data?.success) {
        setClients(prev =>
          prev.map(c => (c.id === client.id ? { ...c, status: 'sent', lastSentAt: new Date().toLocaleTimeString() } : c))
        );

        const newLog: ProcessingLog = {
          id: `log_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('es-ES'),
          type: 'success',
          clientId: client.id,
          clientName: client.clinica,
          message: `Correo enviado exitosamente a ${client.rep_legal} (${client.correo})`,
          testInboxUrl: parsed.data.testInboxUrl
        };

        setLogs(prev => [newLog, ...prev.slice(0, 150)]);
        if (isPreviewModalOpen) setIsPreviewModalOpen(false);
        alert(`¡Correo enviado con éxito a ${client.correo}!`);
      } else {
        throw new Error(parsed.error || 'Error al enviar correo.');
      }
    } catch (err: any) {
      setClients(prev =>
        prev.map(c => (c.id === client.id ? { ...c, status: 'error', errorMessage: err.message } : c))
      );

      const newLog: ProcessingLog = {
        id: `log_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('es-ES'),
        type: 'error',
        clientId: client.id,
        clientName: client.clinica,
        message: `Fallo al enviar correo a ${client.correo}: ${err.message}`
      };
      setLogs(prev => [newLog, ...prev.slice(0, 150)]);
      alert(`Error al enviar correo: ${err.message}`);
    }
  };

  // Open Batch Modal
  const handleOpenBatchModal = (selectedClients: Client[]) => {
    setBatchClients(selectedClients);
    setBatchCurrentIndex(0);
    setIsBatchModalOpen(true);
  };

  // Pause / Resume / Stop Controls
  const handlePauseBatchProcess = () => {
    isPausedRef.current = true;
    setIsPaused(true);
  };

  const handleResumeBatchProcess = () => {
    isPausedRef.current = false;
    setIsPaused(false);
  };

  const handleStopBatchProcess = () => {
    isStoppedRef.current = true;
    isPausedRef.current = false;
    setIsPaused(false);
    setIsBatchProcessing(false);
  };

  // Execute Batch Sending with Concurrency & Pause/Resume
  const handleStartBatchProcess = async () => {
    setIsBatchProcessing(true);
    setIsPaused(false);
    isPausedRef.current = false;
    isStoppedRef.current = false;

    const processClient = async (client: Client, index: number) => {
      try {
        const fileName = `Documento_${client.clinica.replace(/\s+/g, '_')}.pdf`;
        let pdfBase64 = '';

        // Generate native LibreOffice PDF from processed DOCX
        const genRes = await fetch('/api/generate/pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client,
            templateBase64: currentTemplate?.fileBase64,
            returnFormat: 'base64'
          })
        });

        const genParsed = await parseApiResponse(genRes);
        if (genParsed.ok && genParsed.data?.success && genParsed.data?.pdfBase64) {
          pdfBase64 = genParsed.data.pdfBase64;
        } else {
          throw new Error(genParsed.error || 'Error al generar el PDF nativo del documento Word');
        }

        const subject = emailTemplate.subject
          .replace(/\{\{Clinica\}\}/gi, client.clinica)
          .replace(/\{\{Rep_legal\}\}/gi, client.rep_legal);

        const body = emailTemplate.body
          .replace(/\{\{Clinica\}\}/gi, client.clinica)
          .replace(/\{\{Rep_legal\}\}/gi, client.rep_legal);

        const sendRes = await fetch('/api/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: client.correo,
            repName: client.rep_legal,
            clinicaName: client.clinica,
            subject,
            body,
            smtpConfig: emailConfig,
            fileName,
            fileBase64: pdfBase64
          })
        });

        const sendParsed = await parseApiResponse(sendRes);
        if (sendParsed.ok && sendParsed.data?.success) {
          setClients(prev =>
            prev.map(c => (c.id === client.id ? { ...c, status: 'sent' } : c))
          );
          setLogs(prev => [
            {
              id: `log_${Date.now()}_${index}`,
              timestamp: new Date().toLocaleTimeString('es-ES'),
              type: 'success',
              clientId: client.id,
              clientName: client.clinica,
              message: `[${index + 1}/${batchClients.length}] Correo enviado a ${client.clinica} (${client.correo})`,
              testInboxUrl: sendParsed.data.testInboxUrl
            },
            ...prev.slice(0, 150)
          ]);
        } else {
          throw new Error(sendParsed.error || 'Fallo de envío');
        }
      } catch (err: any) {
        setClients(prev =>
          prev.map(c => (c.id === client.id ? { ...c, status: 'error', errorMessage: err.message } : c))
        );
        setLogs(prev => [
          {
            id: `log_${Date.now()}_${index}`,
            timestamp: new Date().toLocaleTimeString('es-ES'),
            type: 'error',
            clientId: client.id,
            clientName: client.clinica,
            message: `[${index + 1}/${batchClients.length}] Error en ${client.clinica}: ${err.message}`
          },
          ...prev.slice(0, 150)
        ]);
      }
    };

    let currentIdx = batchCurrentIndex;
    while (currentIdx < batchClients.length && !isStoppedRef.current) {
      while (isPausedRef.current && !isStoppedRef.current) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      if (isStoppedRef.current) break;

      const activeWorkers = Math.min(concurrency, batchClients.length - currentIdx);
      const batchPromises = [];

      for (let w = 0; w < activeWorkers; w++) {
        const itemIndex = currentIdx + w;
        if (itemIndex < batchClients.length) {
          batchPromises.push(processClient(batchClients[itemIndex], itemIndex));
        }
      }

      await Promise.all(batchPromises);
      currentIdx += activeWorkers;
      setBatchCurrentIndex(Math.min(currentIdx, batchClients.length));
    }

    setIsBatchProcessing(false);
    setIsPaused(false);
  };

  const sentCount = clients.filter(c => c.status === 'sent').length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased selection:bg-indigo-500 selection:text-white">
      
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        clientCount={clients.length}
        sentCount={sentCount}
        openSmtpSettings={() => setIsSmtpModalOpen(true)}
        onDownloadSampleExcel={handleDownloadSampleExcel}
        onDownloadSampleWord={handleDownloadSampleWord}
      />

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {activeTab === 'clients' && (
          <ClientTable
            clients={clients}
            setClients={setClients}
            onEditClient={client => {
              setEditingClient(client);
              setIsEditModalOpen(true);
            }}
            onAddClient={() => {
              setEditingClient(null);
              setIsEditModalOpen(true);
            }}
            onPreviewClientDocument={handleOpenPreview}
            onSendSingleEmail={client => handleSendSingleEmail(client)}
            onBatchProcess={handleOpenBatchModal}
            onDownloadSampleExcel={handleDownloadSampleExcel}
            isLoadingExcel={isLoadingExcel}
            setIsLoadingExcel={setIsLoadingExcel}
          />
        )}

        {activeTab === 'template' && (
          <TemplateManager
            currentTemplate={currentTemplate}
            onUploadCustomTemplate={handleUploadCustomTemplate}
            onResetTemplate={handleResetTemplate}
            onDownloadSampleWord={handleDownloadSampleWord}
            clients={clients}
            onPreviewClientDocument={handleOpenPreview}
          />
        )}

        {activeTab === 'logs' && (
          <EmailLogDrawer
            logs={logs}
            onClearLogs={() => setLogs([])}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 mt-auto">
        DocuSend PDF & Word • Sistema de Procesamiento de Documentos y Envíos por Correo Electrónico
      </footer>

      {/* Modals */}
      <ClientEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        client={editingClient}
        onSave={handleSaveClient}
      />

      <DocumentPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        client={previewingClient}
        template={currentTemplate}
        onSendEmailWithPdf={(client, base64, fileName) => handleSendSingleEmail(client, base64, fileName)}
      />

      <SmtpSettingsModal
        isOpen={isSmtpModalOpen}
        onClose={() => setIsSmtpModalOpen(false)}
        config={emailConfig}
        onSaveConfig={handleSaveSmtpConfig}
        emailTemplate={emailTemplate}
        onSaveEmailTemplate={setEmailTemplate}
      />

      <BatchProgressModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        selectedClients={batchClients}
        currentIndex={batchCurrentIndex}
        isProcessing={isBatchProcessing}
        isPaused={isPaused}
        logs={logs}
        onStartProcess={handleStartBatchProcess}
        onPauseProcess={handlePauseBatchProcess}
        onResumeProcess={handleResumeBatchProcess}
        onStopProcess={handleStopBatchProcess}
        concurrency={concurrency}
        setConcurrency={setConcurrency}
      />

    </div>
  );
}

