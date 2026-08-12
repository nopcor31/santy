export interface Client {
  id: string;
  clinica: string;
  rep_legal: string;
  correo: string;
  fecha?: string;
  ciudad?: string;
  telefono?: string;
  extraData?: Record<string, string>;
  status?: 'pending' | 'generated' | 'sent' | 'error';
  lastSentAt?: string;
  errorMessage?: string;
}

export interface WordTemplate {
  id: string;
  name: string;
  isDefault: boolean;
  placeholders: string[];
  fileBuffer?: ArrayBuffer | string; // Base64 or ArrayBuffer
  htmlPreview?: string;
}

export interface EmailConfig {
  useTestAccount: boolean; // Ethereal SMTP test account
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
  signatureHtml?: string; // Firma HTML personalizada
}

export interface EmailTemplate {
  subject: string;
  body: string;
}

export interface ProcessingLog {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  clientId?: string;
  clientName?: string;
  message: string;
  details?: string;
  testInboxUrl?: string;
}
