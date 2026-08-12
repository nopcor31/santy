import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { exec } from 'child_process';
import util from 'util';
import multer from 'multer';

const execPromise = util.promisify(exec);
import * as XLSX from 'xlsx';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import mammoth from 'mammoth';
import nodemailer from 'nodemailer';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Configure body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Multer memory storage for uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }
});

// Helper: Normalize object key strings (remove accents, uppercase, trim)
function normalizeKey(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .trim();
}

// Minimal valid DOCX XML template builder using PizZip
function createDefaultDocxBuffer(title = 'CARTA COMPROMISO Y NOTIFICACIÓN OFICIAL'): Buffer {
  const zip = new PizZip();

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const documentRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`;

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr><w:jc w:val="right"/></w:pPr>
      <w:r><w:t>Fecha: {{Fecha}}</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t></w:t></w:r></w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="32"/></w:rPr>
        <w:t>${title}</w:t>
      </w:r>
    </w:p>
    <w:p><w:r><w:t></w:t></w:r></w:p>
    <w:p>
      <w:r>
        <w:rPr><w:b/></w:rPr>
        <w:t>Señor(a): </w:t>
      </w:r>
      <w:r>
        <w:rPr><w:b/></w:rPr>
        <w:t>{{Rep_legal}}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Representante Legal de: </w:t>
      </w:r>
      <w:r>
        <w:rPr><w:b/></w:rPr>
        <w:t>{{Clinica}}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Correo Institucional: </w:t>
      </w:r>
      <w:r>
        <w:t>{{Correo}}</w:t>
      </w:r>
    </w:p>
    <w:p><w:r><w:t></w:t></w:r></w:p>
    <w:p>
      <w:r>
        <w:t>Por medio de la presente comunicación, confirmamos de manera formal la actualización de datos y asignación de servicios para la institución </w:t>
      </w:r>
      <w:r>
        <w:rPr><w:b/></w:rPr>
        <w:t>{{Clinica}}</w:t>
      </w:r>
      <w:r>
        <w:t>. Hacemos constar que el representante legal registrado, Sr.(a) </w:t>
      </w:r>
      <w:r>
        <w:rPr><w:b/></w:rPr>
        <w:t>{{Rep_legal}}</w:t>
      </w:r>
      <w:r>
        <w:t>, ha sido habilitado(a) como contacto principal de correspondencia electrónica en la dirección </w:t>
      </w:r>
      <w:r>
        <w:rPr><w:u w:val="single"/></w:rPr>
        <w:t>{{Correo}}</w:t>
      </w:r>
      <w:r>
        <w:t>.</w:t>
      </w:r>
    </w:p>
    <w:p><w:r><w:t></w:t></w:r></w:p>
    <w:p>
      <w:r>
        <w:t>Agradecemos su atención y quedamos a su entera disposición para cualquier inquietud adicional respecto a los trámites en curso.</w:t>
      </w:r>
    </w:p>
    <w:p><w:r><w:t></w:t></w:r></w:p>
    <w:p><w:r><w:t></w:t></w:r></w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r>
        <w:t>Atentamente,</w:t>
      </w:r>
    </w:p>
    <w:p><w:r><w:t></w:t></w:r></w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r>
        <w:rPr><w:b/></w:rPr>
        <w:t>DEPARTAMENTO DE GESTIÓN Y ADMINISTRACIÓN</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`;

  zip.file('[Content_Types].xml', contentTypes);
  zip.file('_rels/.rels', rels);
  zip.file('word/_rels/document.xml.rels', documentRels);
  zip.file('word/document.xml', documentXml);

  return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
}

// Helper: Get base template buffer (prefers PROPUESTA COMERCIAL.docx in process.cwd())
function getDefaultTemplateBuffer(): Buffer {
  const proposalPath = path.join(process.cwd(), 'PROPUESTA COMERCIAL.docx');
  if (fs.existsSync(proposalPath)) {
    try {
      return fs.readFileSync(proposalPath);
    } catch (e: any) {
      console.error('Error al leer PROPUESTA COMERCIAL.docx:', e?.message);
    }
  }
  return createDefaultDocxBuffer();
}

function getDefaultTemplateName(): string {
  const proposalPath = path.join(process.cwd(), 'PROPUESTA COMERCIAL.docx');
  if (fs.existsSync(proposalPath)) {
    return 'PROPUESTA COMERCIAL.docx';
  }
  return 'Carta de Notificación Oficial (.docx)';
}

// Store default template and custom uploaded template in memory
let defaultTemplateBuffer = getDefaultTemplateBuffer();
let activeCustomTemplateBuffer: Buffer | null = null;
let activeCustomTemplateName: string | null = null;

// Normalize SmartArt / Diagram text bodies for native PDF rendering
// Converts Microsoft Office Diagram drawing text bodies (<dsp:txBody>) to standard DrawingML (<a:txBody>)
function normalizeDocxDiagramText(docxBuffer: Buffer): Buffer {
  try {
    const zip = new PizZip(docxBuffer);
    let modified = false;

    for (const filename of Object.keys(zip.files)) {
      if (filename.startsWith('word/') && filename.endsWith('.xml')) {
        let xml = zip.file(filename)?.asText();
        if (xml && xml.includes('<dsp:txBody')) {
          xml = xml
            .replace(/<dsp:txBody(?=\s|>)/g, '<a:txBody')
            .replace(/<\/dsp:txBody>/g, '</a:txBody>');
          zip.file(filename, xml);
          modified = true;
        }
      }
    }

    if (modified) {
      return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
    }
  } catch (err: any) {
    console.warn('Advertencia al normalizar diagramas SmartArt:', err?.message);
  }
  return docxBuffer;
}

// Robust Docx Template Filler with fallback for MS Word XML split tags
function fillDocxTemplate(docxBuffer: Buffer, dataMap: Record<string, string>): Buffer {
  // Strategy 1: docxtemplater with double braces {{ }}
  try {
    const zip = new PizZip(docxBuffer);
    const doc = new Docxtemplater(zip, {
      delimiters: { start: '{{', end: '}}' },
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: () => ''
    });
    doc.render(dataMap);
    const filled = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });
    return normalizeDocxDiagramText(filled);
  } catch (err1: any) {
    console.warn('Estrategia docxtemplater {{ }} devolvió advertencia/error:', err1?.message);
  }

  // Strategy 2: docxtemplater with single braces { }
  try {
    const zip = new PizZip(docxBuffer);
    const doc = new Docxtemplater(zip, {
      delimiters: { start: '{', end: '}' },
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: () => ''
    });
    doc.render(dataMap);
    const filled = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });
    return normalizeDocxDiagramText(filled);
  } catch (err2: any) {
    console.warn('Estrategia docxtemplater { } devolvió advertencia/error:', err2?.message);
  }

  // Strategy 3: Direct XML cleanup & replacement for Word documents where MS Word split tags across <w:t> nodes
  try {
    const zip = new PizZip(docxBuffer);
    const wordXmlFiles = Object.keys(zip.files).filter(
      file => file.startsWith('word/') && file.endsWith('.xml')
    );

    let replaced = false;
    for (const xmlFile of wordXmlFiles) {
      let fileXml = zip.file(xmlFile)?.asText();
      if (!fileXml) continue;

      // Clean XML tags inside {{...}} or {...} if Word split them across <w:r> nodes
      fileXml = fileXml.replace(/\{\{\s*(?:<[^>]+>)*\s*([a-zA-Z0-9_]+)\s*(?:<[^>]+>)*\s*\}\}/g, '{{$1}}');
      fileXml = fileXml.replace(/\{\s*(?:<[^>]+>)*\s*([a-zA-Z0-9_]+)\s*(?:<[^>]+>)*\s*\}/g, '{$1}');

      // Replace keys in dataMap
      for (const [key, value] of Object.entries(dataMap)) {
        const valStr = String(value ?? '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');

        const doubleRegex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi');
        const singleRegex = new RegExp(`\\{\\s*${key}\\s*\\}`, 'gi');

        fileXml = fileXml.replace(doubleRegex, valStr);
        fileXml = fileXml.replace(singleRegex, valStr);
      }

      zip.file(xmlFile, fileXml);
      replaced = true;
    }

    if (replaced) {
      const filled = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
      return normalizeDocxDiagramText(filled);
    }
  } catch (err3: any) {
    console.error('Error en reemplazo directo XML:', err3?.message);
  }

  // Fallback if all rendering attempts failed
  return normalizeDocxDiagramText(docxBuffer);
}

// Convert filled DOCX Buffer to PDF natively using LibreOffice Writer
async function convertDocxBufferToPdf(docxBuffer: Buffer): Promise<Buffer> {
  const tmpDir = os.tmpdir();
  const uniqueId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const inputPath = path.join(tmpDir, `${uniqueId}.docx`);
  const expectedPdfPath = path.join(tmpDir, `${uniqueId}.pdf`);

  fs.writeFileSync(inputPath, docxBuffer);

  try {
    const isWindows = process.platform === 'win32';

    // Construct OS-specific command and options
    const cmd = isWindows
      ? `soffice.exe --headless --norestore --writer --convert-to pdf "${inputPath}" --outdir "${tmpDir}"`
      : `HOME=/tmp soffice --headless --norestore --writer --convert-to pdf "${inputPath}" --outdir "${tmpDir}"`;

    const execOptions = isWindows
      ? {}
      : { env: { ...process.env, HOME: '/tmp' } };

    await execPromise(cmd, execOptions);

    if (fs.existsSync(expectedPdfPath)) {
      const pdfBuffer = fs.readFileSync(expectedPdfPath);
      try { fs.unlinkSync(inputPath); } catch (_) {}
      try { fs.unlinkSync(expectedPdfPath); } catch (_) {}
      return pdfBuffer;
    } else {
      throw new Error('LibreOffice Writer no produjo el archivo PDF esperado.');
    }
  } catch (err: any) {
    try { if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath); } catch (_) {}
    try { if (fs.existsSync(expectedPdfPath)) fs.unlinkSync(expectedPdfPath); } catch (_) {}
    throw err;
  }
}

// Ethereal test account cache
let etherealTransporter: nodemailer.Transporter | null = null;
let testAccountDetails: { user: string; pass: string; web?: string } | null = null;

async function getEtherealTransporter() {
  if (!etherealTransporter) {
    const testAccount = await nodemailer.createTestAccount();
    testAccountDetails = {
      user: testAccount.user,
      pass: testAccount.pass,
      web: 'https://ethereal.email'
    };
    etherealTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }
  return { transporter: etherealTransporter, details: testAccountDetails! };
}

// --- API ENDPOINTS ---

// 1. Upload & Parse Excel File
app.post('/api/upload/excel', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No se ha subido ningún archivo' });
      return;
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

    if (!rawData || rawData.length === 0) {
      res.status(400).json({ error: 'El archivo Excel está vacío o no tiene un formato válido.' });
      return;
    }

    const clients = rawData.map((row, index) => {
      let clinica = '';
      let rep_legal = '';
      let correo = '';
      let ciudad = '';
      let fecha = '';
      const extraData: Record<string, string> = {};

      // First pass: match column headers against known aliases
      Object.entries(row).forEach(([key, val]) => {
        const strVal = String(val ?? '').trim();
        if (!strVal) return;

        const norm = normalizeKey(key);
        // Store all original key-value pairs in extraData so docx template can substitute {{KEY}}
        extraData[key] = strVal;

        // Auto-detect fields by header string
        if (
          norm.includes('CLINICA') ||
          norm.includes('EMPRESA') ||
          norm.includes('HOSPITAL') ||
          norm.includes('CLIENTE') ||
          norm.includes('RAZON') ||
          norm.includes('ORGANIZACION') ||
          norm.includes('INSTITUCION') ||
          norm.includes('IPS') ||
          norm.includes('COMPANIA') ||
          norm.includes('SOCIEDAD') ||
          norm.includes('ENTIDAD') ||
          norm.includes('ESTABLECIMIENTO') ||
          norm.includes('PROVEEDOR') ||
          norm.includes('FIRMA') ||
          norm.includes('TITULAR')
        ) {
          if (!clinica) clinica = strVal;
        } else if (
          norm.includes('REP_LEGAL') ||
          norm.includes('REPRESENTANTE') ||
          norm.includes('REP') ||
          norm.includes('CONTACTO') ||
          norm.includes('NOMBRE') ||
          norm.includes('PERSONA') ||
          norm.includes('DESTINATARIO') ||
          norm.includes('RESPONSABLE') ||
          norm.includes('SOLICITANTE') ||
          norm.includes('DIRECTOR') ||
          norm.includes('GERENTE') ||
          norm.includes('SENOR')
        ) {
          if (!rep_legal) rep_legal = strVal;
        } else if (
          norm.includes('CORREO') ||
          norm.includes('EMAIL') ||
          norm.includes('MAIL')
        ) {
          if (!correo) correo = strVal;
        } else if (
          norm.includes('CIUDAD') ||
          norm.includes('MUNICIPIO') ||
          norm.includes('DEPARTAMENTO') ||
          norm.includes('UBICACION') ||
          norm.includes('SEDE')
        ) {
          if (!ciudad) ciudad = strVal;
        } else if (norm.includes('FECHA') || norm.includes('DATE')) {
          if (!fecha) fecha = strVal;
        }
      });

      // Second pass: Value-based fallback if some fields were not matched by header
      const entries = Object.entries(row);

      // Auto-detect email if correo is missing by checking for '@' symbol in cell values
      if (!correo) {
        for (const [_, val] of entries) {
          const strVal = String(val ?? '').trim();
          if (strVal.includes('@') && !strVal.includes(' ')) {
            correo = strVal;
            break;
          }
        }
      }

      // If clinica is still missing, use first non-empty string column
      if (!clinica) {
        for (const [_, val] of entries) {
          const strVal = String(val ?? '').trim();
          if (strVal && strVal !== correo && strVal !== rep_legal) {
            clinica = strVal;
            break;
          }
        }
      }

      // If rep_legal is still missing, use second non-empty column or copy clinica
      if (!rep_legal) {
        for (const [_, val] of entries) {
          const strVal = String(val ?? '').trim();
          if (strVal && strVal !== clinica && strVal !== correo) {
            rep_legal = strVal;
            break;
          }
        }
      }

      // Fallbacks without test strings
      if (!clinica) clinica = rep_legal || 'Sin Nombre';
      if (!rep_legal) rep_legal = clinica || '';
      if (!ciudad) ciudad = 'Bogotá D.C.';
      if (!fecha) fecha = new Date().toLocaleDateString('es-ES');

      return {
        id: `client_${Date.now()}_${index}`,
        clinica,
        rep_legal,
        correo,
        ciudad,
        fecha,
        extraData,
        status: 'pending' as const
      };
    });

    res.json({
      success: true,
      total: clients.length,
      clients
    });
  } catch (error: any) {
    console.error('Error procesando Excel:', error);
    res.status(500).json({ error: 'Error al procesar el archivo Excel: ' + error.message });
  }
});

// 2. Download Sample Excel
app.get('/api/sample/excel', (req, res) => {
  try {
    const sampleData = [
      {
        CLINICA: 'Clínica San Rafael S.A.S.',
        REP_LEGAL: 'Dra. María Fernanda Gómez',
        CORREO: 'maria.gomez@clinicasanrafael.com',
        CIUDAD: 'Bogotá',
        TELEFONO: '+57 300 123 4567'
      },
      {
        CLINICA: 'Centro Médico Nueva Vida',
        REP_LEGAL: 'Dr. Carlos Alberto Mendoza',
        CORREO: 'carlos.mendoza@nuevavida.org',
        CIUDAD: 'Medellín',
        TELEFONO: '+57 311 987 6543'
      },
      {
        CLINICA: 'Hospital Universitario del Norte',
        REP_LEGAL: 'Dra. Ana Lucía Ramírez',
        CORREO: 'ana.ramirez@hunorte.edu.co',
        CIUDAD: 'Cali',
        TELEFONO: '+57 320 555 1212'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Clientes');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Plantilla_Clientes_Ejemplo.xlsx"');
    res.send(buffer);
  } catch (err: any) {
    res.status(500).json({ error: 'Error al generar plantilla Excel: ' + err.message });
  }
});

// 2c. Export Clients to Excel
app.post('/api/export/excel', express.json({ limit: '50mb' }), (req, res) => {
  try {
    const { clients } = req.body;
    if (!Array.isArray(clients)) {
      res.status(400).json({ error: 'Se requiere una lista de clientes para exportar' });
      return;
    }

    const exportRows = clients.map((c: any, index: number) => ({
      NRO: index + 1,
      CLINICA: c.clinica || '',
      REP_LEGAL: c.rep_legal || '',
      CORREO: c.correo || '',
      CIUDAD: c.ciudad || '',
      FECHA: c.fecha || '',
      ESTADO: c.status === 'sent' ? 'Enviado' : c.status === 'generated' ? 'Generado' : c.status === 'error' ? 'Error' : 'Pendiente',
      DETALLE_ERROR: c.errorMessage || '',
      ...(c.extraData || {})
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte_Clientes');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Exportacion_Clientes_15K.xlsx"');
    res.send(buffer);
  } catch (err: any) {
    res.status(500).json({ error: 'Error exportando a Excel: ' + err.message });
  }
});

// 3. Download Active/Default Word Template (.docx)
app.get('/api/sample/docx', (req, res) => {
  try {
    defaultTemplateBuffer = getDefaultTemplateBuffer();
    const buffer = activeCustomTemplateBuffer || defaultTemplateBuffer;
    const filename = activeCustomTemplateName || getDefaultTemplateName();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err: any) {
    res.status(500).json({ error: 'Error al obtener plantilla Word: ' + err.message });
  }
});

// 3b. Upload Custom Word Template
app.post('/api/template/upload', upload.single('templateFile'), (req, res) => {
  try {
    let buffer: Buffer | null = null;
    let filename = req.body?.name || 'Plantilla_Personalizada.docx';

    if (req.file) {
      buffer = req.file.buffer;
      filename = req.file.originalname;
    } else if (req.body?.templateBase64) {
      buffer = Buffer.from(req.body.templateBase64, 'base64');
    }

    if (!buffer) {
      res.status(400).json({ error: 'No se recibió ningún archivo de plantilla Word.' });
      return;
    }

    activeCustomTemplateBuffer = buffer;
    activeCustomTemplateName = filename;

    res.json({
      success: true,
      message: `Plantilla "${filename}" configurada correctamente como activa.`,
      templateName: filename,
      isCustom: true
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al guardar la plantilla Word: ' + err.message });
  }
});

// 3c. Reset Template to Default
app.delete('/api/template/reset', (req, res) => {
  activeCustomTemplateBuffer = null;
  activeCustomTemplateName = null;
  res.json({
    success: true,
    message: `Plantilla restablecida a la plantilla base (${getDefaultTemplateName()}).`,
    templateName: getDefaultTemplateName(),
    isCustom: false
  });
});

// 3d. Get Active Template Info
app.get('/api/template/active', (req, res) => {
  res.json({
    success: true,
    isCustom: !!activeCustomTemplateBuffer,
    templateName: activeCustomTemplateName || getDefaultTemplateName()
  });
});

// 4. Fill Word Template (.docx) and Return DOCX or HTML preview
app.post('/api/generate/docx', upload.single('templateFile'), async (req, res) => {
  try {
    let docxBuffer: Buffer;
    if (req.file) {
      docxBuffer = req.file.buffer;
    } else if (req.body.templateBase64) {
      docxBuffer = Buffer.from(req.body.templateBase64, 'base64');
    } else if (activeCustomTemplateBuffer) {
      docxBuffer = activeCustomTemplateBuffer;
    } else {
      docxBuffer = defaultTemplateBuffer;
    }

    const clientData = typeof req.body.client === 'string' ? JSON.parse(req.body.client) : req.body.client;

    if (!clientData) {
      res.status(400).json({ error: 'No se han proporcionado los datos del cliente' });
      return;
    }

    // Build exhaustive multi-cased data map for placeholders
    const dataMap: Record<string, string> = {
      Clinica: clientData.clinica || '',
      CLINICA: clientData.clinica || '',
      clinica: clientData.clinica || '',
      Rep_legal: clientData.rep_legal || '',
      REP_LEGAL: clientData.rep_legal || '',
      rep_legal: clientData.rep_legal || '',
      Correo: clientData.correo || '',
      CORREO: clientData.correo || '',
      correo: clientData.correo || '',
      Fecha: clientData.fecha || new Date().toLocaleDateString('es-ES'),
      FECHA: clientData.fecha || new Date().toLocaleDateString('es-ES'),
      fecha: clientData.fecha || new Date().toLocaleDateString('es-ES'),
      Ciudad: clientData.ciudad || 'Bogotá D.C.',
      CIUDAD: clientData.ciudad || 'Bogotá D.C.',
      ciudad: clientData.ciudad || 'Bogotá D.C.',
      Telefono: clientData.telefono || '',
      TELEFONO: clientData.telefono || '',
      telefono: clientData.telefono || '',
      ...(clientData.extraData || {})
    };

    // Include cased variants of extraData
    if (clientData.extraData) {
      for (const [k, v] of Object.entries(clientData.extraData)) {
        const strVal = String(v ?? '');
        dataMap[k] = strVal;
        dataMap[k.toUpperCase()] = strVal;
        dataMap[k.toLowerCase()] = strVal;
      }
    }

    // Fill template using robust filler function
    const filledBuffer = fillDocxTemplate(docxBuffer, dataMap);

    // Convert filled buffer to HTML preview using Mammoth
    const htmlResult = await mammoth.convertToHtml({ buffer: filledBuffer });

    if (req.body.returnFormat === 'html') {
      res.json({
        success: true,
        html: htmlResult.value,
        client: clientData
      });
    } else if (req.body.returnFormat === 'base64') {
      res.json({
        success: true,
        docxBase64: filledBuffer.toString('base64'),
        html: htmlResult.value
      });
    } else {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="Documento_${clientData.clinica.replace(/\s+/g, '_')}.docx"`);
      res.send(filledBuffer);
    }
  } catch (error: any) {
    console.error('Error al generar DOCX:', error);
    res.status(500).json({ error: 'Error al llenar la plantilla Word: ' + error.message });
  }
});

// 4b. Fill Word Template (.docx) and Return Native PDF converted via LibreOffice Writer
app.post('/api/generate/pdf', upload.single('templateFile'), async (req, res) => {
  try {
    let docxBuffer: Buffer;
    if (req.file) {
      docxBuffer = req.file.buffer;
    } else if (req.body.templateBase64) {
      const cleanTpl = String(req.body.templateBase64).replace(/^data:[^;]+;base64,/, '');
      docxBuffer = Buffer.from(cleanTpl, 'base64');
    } else if (activeCustomTemplateBuffer) {
      docxBuffer = activeCustomTemplateBuffer;
    } else {
      docxBuffer = defaultTemplateBuffer;
    }

    const clientData = typeof req.body.client === 'string' ? JSON.parse(req.body.client) : req.body.client;

    if (!clientData) {
      res.status(400).json({ error: 'No se han proporcionado los datos del cliente' });
      return;
    }

    const dataMap: Record<string, string> = {
      Clinica: clientData.clinica || '',
      CLINICA: clientData.clinica || '',
      clinica: clientData.clinica || '',
      Rep_legal: clientData.rep_legal || '',
      REP_LEGAL: clientData.rep_legal || '',
      rep_legal: clientData.rep_legal || '',
      Correo: clientData.correo || '',
      CORREO: clientData.correo || '',
      correo: clientData.correo || '',
      Fecha: clientData.fecha || new Date().toLocaleDateString('es-ES'),
      FECHA: clientData.fecha || new Date().toLocaleDateString('es-ES'),
      fecha: clientData.fecha || new Date().toLocaleDateString('es-ES'),
      Ciudad: clientData.ciudad || 'Bogotá D.C.',
      CIUDAD: clientData.ciudad || 'Bogotá D.C.',
      ciudad: clientData.ciudad || 'Bogotá D.C.',
      Telefono: clientData.telefono || '',
      TELEFONO: clientData.telefono || '',
      telefono: clientData.telefono || '',
      ...(clientData.extraData || {})
    };

    if (clientData.extraData) {
      for (const [k, v] of Object.entries(clientData.extraData)) {
        const strVal = String(v ?? '');
        dataMap[k] = strVal;
        dataMap[k.toUpperCase()] = strVal;
        dataMap[k.toLowerCase()] = strVal;
      }
    }

    // Fill template in memory
    const filledBuffer = fillDocxTemplate(docxBuffer, dataMap);

    // Convert docx buffer to pdf natively via LibreOffice
    const pdfBuffer = await convertDocxBufferToPdf(filledBuffer);
    const fileName = `Documento_${(clientData.clinica || 'Cliente').replace(/\s+/g, '_')}.pdf`;

    if (req.body.returnFormat === 'base64') {
      res.json({
        success: true,
        pdfBase64: pdfBuffer.toString('base64'),
        fileName
      });
    } else {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(pdfBuffer);
    }
  } catch (error: any) {
    console.error('Error al generar PDF nativo:', error);
    res.status(500).json({ error: 'Error al generar el archivo PDF: ' + error.message });
  }
});

// 5. Test SMTP Email Connection or Initialize Test Transporter
app.post('/api/email/test-connection', async (req, res) => {
  try {
    const { useTestAccount, host, port, secure, user, pass } = req.body;

    if (useTestAccount) {
      const { details } = await getEtherealTransporter();
      res.json({
        success: true,
        message: 'Modo de prueba activo (Servidor Ethereal SMTP listo).',
        details
      });
      return;
    }

    if (!host || !user || !pass) {
      res.status(400).json({ error: 'Faltan parámetros de servidor SMTP (host, usuario, contraseña).' });
      return;
    }

    const transporter = nodemailer.createTransport({
      host,
      port: Number(port) || 587,
      secure: Boolean(secure),
      auth: { user, pass }
    });

    await transporter.verify();
    res.json({ success: true, message: '¡Conexión SMTP verificada con éxito!' });
  } catch (error: any) {
    res.status(500).json({ error: 'Error de verificación SMTP: ' + error.message });
  }
});

// 6. Send Email with Attachment (PDF or DOCX)
app.post('/api/email/send', upload.single('attachment'), async (req, res) => {
  try {
    const {
      to,
      repName,
      clinicaName,
      subject,
      body,
      smtpConfig,
      fileName,
      fileBase64
    } = req.body;

    if (!to) {
      res.status(400).json({ error: 'Falta la dirección de correo de destino (CORREO).' });
      return;
    }

    let transporter: nodemailer.Transporter;
    let isTestAccount = false;
    let testInboxUrl = '';

    const config = typeof smtpConfig === 'string' ? JSON.parse(smtpConfig) : smtpConfig;

    if (!config || config.useTestAccount) {
      const ethereal = await getEtherealTransporter();
      transporter = ethereal.transporter;
      isTestAccount = true;
    } else {
      transporter = nodemailer.createTransport({
        host: config.host,
        port: Number(config.port) || 587,
        secure: Boolean(config.secure),
        auth: {
          user: config.user,
          pass: config.pass
        }
      });
    }

    // Attachment processing
    let attachmentBuffer: Buffer | null = null;
    let attachmentName = fileName || `Documento_${(clinicaName || 'Cliente').replace(/\s+/g, '_')}.pdf`;

    if (req.file) {
      attachmentBuffer = req.file.buffer;
      attachmentName = req.file.originalname;
    } else if (fileBase64) {
      const cleanBase64 = String(fileBase64).replace(/^data:[^;]+;base64,/, '');
      attachmentBuffer = Buffer.from(cleanBase64, 'base64');
    }

    const emailSubject = subject || `Documento Oficial - ${clinicaName || 'Notificación'}`;
    const emailBody = body || `Estimado(a) ${repName || 'Representante Legal'},\n\nAdjunto a este correo encontrará el documento correspondiente a ${clinicaName}.\n\nQuedamos atentos a sus comentarios.\n\nAtentamente,\nDepartamento de Gestión`;

    const emailAttachments: any[] = [];

    if (attachmentBuffer && attachmentBuffer.length > 0) {
      const isDocx = attachmentName.toLowerCase().endsWith('.docx');
      emailAttachments.push({
        filename: attachmentName,
        content: attachmentBuffer,
        contentType: isDocx
          ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          : 'application/pdf'
      });
    }

    // Automatically attach BROCHURE.pdf as an exact copy of the original PDF without any transformation
    const brochureCandidates = [
      path.join(process.cwd(), 'BROCHURE.pdf'),
      path.join(process.cwd(), 'public', 'BROCHURE.pdf'),
      path.join(process.cwd(), 'public', 'GI_Audimedic_Brochure.pdf'),
      path.join(process.cwd(), 'GI_Audimedic_Brochure.pdf')
    ];

    let brochurePathToUse: string | null = null;
    for (const candPath of brochureCandidates) {
      if (fs.existsSync(candPath)) {
        const stats = fs.statSync(candPath);
        if (stats.isFile() && stats.size > 0) {
          brochurePathToUse = candPath;
          break;
        }
      }
    }

    if (brochurePathToUse) {
      const brochureBuf = fs.readFileSync(brochurePathToUse);
      if (brochureBuf && brochureBuf.length > 0) {
        emailAttachments.push({
          filename: 'BROCHURE.pdf',
          content: brochureBuf,
          contentType: 'application/pdf'
        });
      }
    }

    const signatureHtml = config?.signatureHtml || '';

    let htmlBody = emailBody.replace(/\n/g, '<br/>');
    if (signatureHtml && signatureHtml.trim()) {
      htmlBody += `<br/><br/>${signatureHtml.trim()}`;
    }

    const mailOptions: nodemailer.SendMailOptions = {
      from: config?.fromEmail ? `"${config.fromName || 'Sistema de Gestión'}" <${config.fromEmail}>` : '"Sistema de Gestión" <noreply@gestion.com>',
      to: to,
      subject: emailSubject,
      text: emailBody + (signatureHtml ? `\n\n--\n${signatureHtml.replace(/<[^>]+>/g, '')}` : ''),
      html: htmlBody,
      attachments: emailAttachments
    };

    const info = await transporter.sendMail(mailOptions);

    if (isTestAccount) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      testInboxUrl = previewUrl || 'https://ethereal.email';
    }

    res.json({
      success: true,
      messageId: info.messageId,
      message: `Correo enviado con éxito a ${to}`,
      isTestAccount,
      testInboxUrl
    });
  } catch (error: any) {
    console.error('Error enviando correo:', error);
    res.status(500).json({ error: 'Error al enviar el correo electrónico: ' + error.message });
  }
});

// Endpoint to download brochure directly
app.get('/api/brochure/download', (req, res) => {
  const brochureCandidates = [
    path.join(process.cwd(), 'BROCHURE.pdf'),
    path.join(process.cwd(), 'public', 'BROCHURE.pdf'),
    path.join(process.cwd(), 'public', 'GI_Audimedic_Brochure.pdf'),
    path.join(process.cwd(), 'GI_Audimedic_Brochure.pdf')
  ];
  const foundPath = brochureCandidates.find(p => fs.existsSync(p) && fs.statSync(p).size > 0);
  if (foundPath) {
    res.download(foundPath, 'BROCHURE.pdf');
  } else {
    res.status(404).json({ error: 'BROCHURE.pdf no encontrado' });
  }
});

// Vite middleware for development vs static serve for production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor iniciado en http://0.0.0.0:${PORT}`);
  });
}

startServer();
