import { useState } from 'react';
import { format } from 'date-fns';
import { Download, Share2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface ExportDashboardProps {
  dashboardRef: React.RefObject<HTMLDivElement | null>;
}

export function ExportDashboard({ dashboardRef }: ExportDashboardProps) {
  const [exporting, setExporting] = useState(false);

  const exportToPDF = async () => {
    setExporting(true);
    try {
      // Dynamically import html2canvas and jspdf only when needed
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      if (!dashboardRef.current) {
        throw new Error('Dashboard reference not found');
      }

      const element = dashboardRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 297; // A4 landscape width
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`dashboard-enregla-${format(new Date(), 'yyyy-MM-dd')}.pdf`);

      toast.success('Dashboard exportado correctamente');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Error al exportar el dashboard');
    } finally {
      setExporting(false);
    }
  };

  const shareLink = () => {
    try {
      const url = `${window.location.origin}/dashboard`;
      navigator.clipboard.writeText(url);
      toast.success('Link copiado al portapapeles');
    } catch (error) {
      toast.error('Error al copiar el link');
    }
  };

  return (
    <div className="flex gap-1">
      <button
        onClick={exportToPDF}
        disabled={exporting}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50"
        title="Exportar PDF"
      >
        {exporting ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
        PDF
      </button>
      <button
        onClick={shareLink}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-all"
        title="Compartir"
      >
        <Share2 size={12} />
      </button>
    </div>
  );
}
