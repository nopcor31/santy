import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Renders an HTML element or HTML string into a high-quality PDF Buffer or Blob.
 */
export async function convertHtmlToPdfBlob(
  htmlContainer: HTMLElement | string,
  fileName = 'documento.pdf'
): Promise<{ blob: Blob; base64: string }> {
  let targetElement: HTMLElement;
  let isCreated = false;

  if (typeof htmlContainer === 'string') {
    targetElement = document.createElement('div');
    targetElement.className = 'pdf-render-container';
    targetElement.style.position = 'fixed';
    targetElement.style.left = '0';
    targetElement.style.top = '0';
    targetElement.style.zIndex = '-9999';
    targetElement.style.opacity = '0';
    targetElement.style.pointerEvents = 'none';
    targetElement.style.width = '794px'; // A4 width at 96 DPI
    targetElement.style.padding = '40px 50px';
    targetElement.style.backgroundColor = '#ffffff';
    targetElement.style.color = '#1a202c';
    targetElement.style.fontFamily = 'Arial, sans-serif';
    targetElement.style.fontSize = '14px';
    targetElement.style.lineHeight = '1.6';
    targetElement.innerHTML = htmlContainer;
    document.body.appendChild(targetElement);
    isCreated = true;
  } else {
    targetElement = htmlContainer;
  }

  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Check for docx-preview rendered sections (pages)
    const pageSections = targetElement.querySelectorAll('section.docx, section, .docx-rendered-page section');

    if (pageSections && pageSections.length > 0) {
      for (let i = 0; i < pageSections.length; i++) {
        const pageEl = pageSections[i] as HTMLElement;
        if (i > 0) {
          pdf.addPage('a4', 'portrait');
        }

        const canvas = await html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#ffffff',
          imageTimeout: 15000,
          scrollX: 0,
          scrollY: 0
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.98);
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      }
    } else {
      // Fallback capturing whole container
      const canvas = await html2canvas(targetElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        imageTimeout: 15000,
        scrollX: 0,
        scrollY: 0,
        windowWidth: targetElement.scrollWidth || 800
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 2) {
        position = heightLeft - imgHeight;
        pdf.addPage('a4', 'portrait');
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
    }

    const pdfBlob = pdf.output('blob');
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const base64 = ArrayBufferToBase64(arrayBuffer);

    return { blob: pdfBlob, base64 };
  } finally {
    if (isCreated && targetElement.parentNode) {
      targetElement.parentNode.removeChild(targetElement);
    }
  }
}

/**
 * Triggers a browser file download for a Blob
 */
export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function ArrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return window.btoa(binary);
}

