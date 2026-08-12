# Arquitectura del Sistema - Generador de Documentos y Notificaciones Masivas

## 1. Visión General
Esta aplicación es un sistema full-stack desarrollado con **React (Vite, TypeScript, Tailwind CSS)** en el cliente y **Node.js (Express)** en el servidor. Está diseñada para la **gestión de clientes**, **autocompletado masivo de plantillas Word (.docx)** respetando marcas de agua y gráficos incrustados, **exportación directa a PDF de alta fidelidad desde el archivo Word en el servidor (LibreOffice Writer)** y **envío masivo de notificaciones por correo electrónico** a través de SMTP.

---

## 2. Diagrama de Arquitectura de Alto Nivel

```
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                            CLIENTE (React SPA)                              │
 │                                                                             │
 │  ┌─────────────────┐   ┌────────────────────┐   ┌──────────────────────┐  │
 │  │ ClientTable.tsx │   │TemplateManager.tsx │   │DocumentPreviewModal  │  │
 │  └────────┬────────┘   └─────────┬──────────┘   └──────────┬───────────┘  │
 │           │                      │                         │                │
 │           │ Excel upload (.xlsx) │ Upload/Reset .docx      │ Descarga/Envío │
 │           ▼                      ▼                         ▼                │
 │  ┌──────────────────────────────────────────────────────────────────────┐   │
 │  │      Vista previa client-side con docx-preview (Solo Renderizado)    │   │
 │  └──────────────────────────────────┬───────────────────────────────────┘   │
 └─────────────────────────────────────┼───────────────────────────────────────┘
                                       │ HTTP / REST API (JSON & Multipart)
                                       ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                           SERVIDOR (Node.js Express)                        │
 │                                                                             │
 │  ┌─────────────────┐   ┌────────────────────┐   ┌──────────────────────┐  │
 │  │ /api/parse/excel│   │ /api/template/upload│  │ /api/generate/pdf    │  │
 │  └────────┬────────┘   └─────────┬──────────┘   └──────────┬───────────┘  │
 │           │ XLSX Parser          │ Pizzip / Docx           │ Docxtemplater  │
 │           ▼                      ▼                         ▼                │
 │  ┌──────────────────────────────────────────────────────────────────────┐   │
 │  │   Plantilla Base: PROPUESTA COMERCIAL.docx (Conserva marcas de agua, │   │
 │  │   encabezados, logos y gráficos vectoriales originales)              │   │
 │  └──────────────────────────────────┬───────────────────────────────────┘   │
 │                                     │
 │                                     ▼
 │  ┌──────────────────────────────────────────────────────────────────────┐   │
 │  │   Conversión Nativa Word ──► PDF (LibreOffice Writer Engine)         │   │
 │  │   Garantiza márgenes, tablas, marcas de agua e imágenes 100% idénticos │   │
 │  └──────────────────────────────────┬───────────────────────────────────┘   │
 │                                     │ Nodemailer (SMTP Engine)
 │                                     ▼
 │                          ┌──────────────────────┐
 │                          │ Servidor SMTP
 │                          └──────────────────────┘
 └─────────────────────────────────────┴───────────────────────────────────────┘
```

---

## 3. Componentes Principales

### 3.1 Frontend (`/src`)

1. **`App.tsx`**
   - Controlador principal del estado global de la aplicación.
   - Maneja la navegación entre pestañas (*Clientes*, *Plantilla Word*, *Historial/Logs*).
   - Administra el estado de la lista de clientes, la plantilla activa y los registros de correos enviados.
   - Solicita la generación de PDFs nativos al servidor para envíos masivos.

2. **`components/ClientTable.tsx`**
   - Tabla interactiva para listar, filtrar, buscar y seleccionar contactos.
   - Integra la carga diferida de archivos Excel (`.xlsx`, `.csv`) con auto-detección inteligente de columnas.
   - Permite la selección masiva de registros para generación en lote o envíos masivos.
   - Muestra detalles adicionales recuperados dinámicamente (`extraData`).

3. **`components/TemplateManager.tsx`**
   - Interfaz de administración de la plantilla Word.
   - Permite cargar un archivo `.docx` personalizado o restablecer la plantilla oficial por defecto (`PROPUESTA COMERCIAL.docx`).
   - Muestra las variables/etiquetas dinámicas detectadas (`{{Clinica}}`, `{{Rep_legal}}`, `{{Correo}}`, etc.).

4. **`components/DocumentPreviewModal.tsx`**
   - Modal de vista previa individual del documento utilizando `docx-preview` para pantalla.
   - Generación rápida de descargable `.docx` personalizado.
   - Generación de PDF idéntico enviando la solicitud directamente al servidor (`/api/generate/pdf`).
   - Envío individual de correo electrónico con el archivo PDF adjunto.

5. **`components/BatchProgressModal.tsx`**
   - Modal de procesamiento masivo en segundo plano.
   - Generación de lote de documentos Word/PDF con barra de progreso en tiempo real.
   - Descarga de paquete ZIP comprimido con todos los documentos generados.
   - Envío masivo concurrente de correos electrónicos con reintentos automáticos e informe de resultados.

6. **`components/SmtpSettingsModal.tsx`**
   - Configuración de parámetros SMTP (Host, Puerto, Usuario, Contraseña, Seguridad TLS/SSL, Dirección de Remitente).
   - Prueba de conexión SMTP en tiempo real.

---

### 3.2 Backend (`server.ts`)

1. **Gestión de Plantilla Base**
   - Carga nativa del archivo `/PROPUESTA COMERCIAL.docx` ubicado en la raíz del proyecto.
   - Preservación íntegra del archivo `.zip` de OpenXML (`pizzip`), garantizando que los elementos gráficos, encabezados, pies de página y marcas de agua no sufran alteración alguna durante la sustitución de variables.

2. **Parseo e Ingesta de Excel (`/api/parse/excel`)**
   - Lee hojas de cálculo utilizando la librería `xlsx`.
   - Normalizador de encabezados (`normalizeKey`): mapea variaciones como `CLINICA`, `RAZON_SOCIAL`, `HOSPITAL`, `EMPRESA`, `REPRESENTANTE_LEGAL`, `REP_LEGAL`, `NIT`, `TELEFONO`, etc.
   - Mecanismo de respaldo (fallback) que detecta automáticamente direcciones de correo por patrón (`@`) cuando los encabezados no estándar son utilizados.

3. **Sustitución de Variables y Generación Docx (`/api/generate/docx`)**
   - Utiliza `docxtemplater` para inyectar datos del cliente en etiquetas estilo Mustache/Handlebars (`{{Clinica}}`, `{{Rep_legal}}`, `{{Correo}}`, `{{Ciudad}}`, `{{Fecha}}`, etc.).
   - Mantiene compatibilidad con mayúsculas y minúsculas en las etiquetas.

4. **Conversión Directa DOCX a PDF (`/api/generate/pdf`)**
   - Toma el archivo `.docx` procesado con `docxtemplater` y ejecuta el motor nativo de **LibreOffice Writer** (`soffice --headless --writer`).
   - Garantiza que el PDF resultante conserve de manera 100% idéntica los márgenes, marcas de agua vectoriales, encabezados, pies de página, fuentes y tablas de Microsoft Word.

5. **Motor de Notificaciones SMTP (`/api/smtp/send`)**
   - Configuración dinámica del transporte `nodemailer`.
   - Soporte para adjuntos en formato PDF Codificados en Base64.
   - Manejo de reintentos y reporte detallado de errores en caso de fallo de entrega.

---

## 4. Flujo de Datos Principal

```
[ Plantilla DOCX ] ──► [ Docxtemplater (Inyección de Datos) ]
                                   │
                                   ▼
                            [ DOCX Final ]
                                   │
                                   ▼
             [ Conversión Directa a PDF en Servidor (LibreOffice Writer) ]
                                   │
                                   ▼
             [ PDF 100% Idéntico a Word (Márgenes, Logos, Marcas de Agua) ]
                                   │
                   ┌───────────────┴───────────────┐
                   ▼                               ▼
      [ Descarga Directa PDF ]         [ Envío Adjunto Vía SMTP ]
```

---

## 5. Estructura de Archivos del Proyecto

```
.
├── PROPUESTA COMERCIAL.docx     # Plantilla oficial Word con gráficos y marcas de agua
├── ARCHITECTURE.md             # Documentación de arquitectura
├── server.ts                    # Servidor Express (Endpoints REST, Excel, Docx, Conversión PDF Nativo, SMTP)
├── package.json                 # Dependencias y scripts de compilación
├── vite.config.ts               # Configuración de Vite
└── src/
    ├── App.tsx                  # Componente raíz y enrutador de pestañas
    ├── main.tsx                 # Punto de entrada React
    ├── index.css                # Estilos globales y Tailwind CSS
    ├── components/
    │   ├── ClientTable.tsx          # Tabla e importador de Excel
    │   ├── TemplateManager.tsx      # Gestión de la plantilla Word
    │   ├── DocumentPreviewModal.tsx # Vista previa docx y generación de PDF nativo
    │   ├── BatchProgressModal.tsx   # Modal de ejecución masiva (ZIP/SMTP)
    │   ├── SmtpSettingsModal.tsx    # Configuración de correo SMTP
    │   └── EmailLogDrawer.tsx       # Historial de envíos
    └── utils/
        └── pdfGenerator.ts      # Utilidad auxiliar para clientes
```

---

## 6. Tecnologías Clave Utilizadas
- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React, Motion, docx-preview.
- **Backend**: Node.js, Express, Multer, XLSX, PizZip, Docxtemplater, LibreOffice Writer Engine, Nodemailer.
- **Compilación**: Vite, esbuild (para bundling de servidor en producción).
