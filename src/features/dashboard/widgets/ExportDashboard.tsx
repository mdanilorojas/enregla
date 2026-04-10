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
    <div className="flex gap-2">
      <button
        onClick={exportToPDF}
        disabled={exporting}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
      >
        {exporting ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Download size={16} />
        )}
        {exporting ? 'Exportando...' : 'Exportar PDF'}
      </button>
      <button
        onClick={shareLink}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition-all shadow-sm"
      >
        <Share2 size={16} />
        Compartir
      </button>
    </div>
  );
}
