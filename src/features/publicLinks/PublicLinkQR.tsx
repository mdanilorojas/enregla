import { QRCodeSVG } from 'qrcode.react';
import { useRef } from 'react';

interface PublicLinkQRProps {
  url: string;
  size?: number;
  includeLabel?: boolean;
  label?: string;
}

export function PublicLinkQR({
  url,
  size = 256,
  label,
}: PublicLinkQRProps) {
  const qrRef = useRef<HTMLDivElement>(null);

  /**
   * Download QR code as PNG
   */
  const handleDownload = () => {
    if (!qrRef.current) return;

    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;

    // Create canvas from SVG
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size (larger for better quality)
    const downloadSize = 512;
    canvas.width = downloadSize;
    canvas.height = downloadSize;

    // Convert SVG to image
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      // Draw white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, downloadSize, downloadSize);

      // Draw QR code
      ctx.drawImage(img, 0, 0, downloadSize, downloadSize);

      // Convert to PNG and download
      canvas.toBlob((blob) => {
        if (!blob) return;

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `enregla-qr-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });

      URL.revokeObjectURL(url);
    };

    img.src = url;
  };

  /**
   * Open print dialog with QR
   */
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>EnRegla - QR de Verificación</title>
          <style>
            @page {
              size: A4;
              margin: 20mm;
            }
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
            }
            .container {
              text-align: center;
              max-width: 600px;
            }
            h1 {
              font-size: 24px;
              font-weight: 700;
              color: #111827;
              margin: 0 0 8px 0;
            }
            .subtitle {
              font-size: 16px;
              color: #6B7280;
              margin: 0 0 32px 0;
            }
            .qr-wrapper {
              display: inline-block;
              padding: 20px;
              background: white;
              border: 2px solid #E5E7EB;
              border-radius: 12px;
              margin-bottom: 24px;
            }
            .label {
              font-size: 14px;
              font-weight: 600;
              color: #374151;
              margin-bottom: 12px;
            }
            .url {
              font-size: 12px;
              color: #6B7280;
              word-break: break-all;
              margin-top: 16px;
            }
            .footer {
              margin-top: 32px;
              padding-top: 16px;
              border-top: 1px solid #E5E7EB;
              font-size: 12px;
              color: #9CA3AF;
            }
            @media print {
              body {
                background: white;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>EnRegla Compliance</h1>
            <p class="subtitle">Verificación de Permisos</p>
            ${label ? `<p class="label">${label}</p>` : ''}
            <div class="qr-wrapper">
              ${svgData}
            </div>
            <p class="url">${url}</p>
            <div class="footer">
              <p>Escanea el código QR para verificar los permisos vigentes</p>
              <p>enregla.ec</p>
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();

    // Wait for content to load, then print
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  };

  return (
    <div>
      <div ref={qrRef} className="inline-block">
        <QRCodeSVG
          value={url}
          size={size}
          level="H"
          includeMargin={true}
          bgColor="#ffffff"
          fgColor="#000000"
        />
      </div>

      {/* Export property for parent components */}
      <div className="hidden">
        <button onClick={handleDownload} data-action="download" />
        <button onClick={handlePrint} data-action="print" />
      </div>
    </div>
  );
}
