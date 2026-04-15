import { useState } from 'react';
// import { format } from 'date-fns';
// import { Upload, Calendar as CalendarIcon, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui-v2/button';
// import { Calendar } from '@/components/ui-v2/calendar';
// import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui-v2/popover';
// import { uploadPermitDocument } from '@/lib/api/documents';
import { calculateExpiryDate } from '@/lib/permitRules';
// import { formatPermitDuration } from '@/lib/permitRules';
import type { Permit } from '@/types/database';

interface PermitUploadFormProps {
  permit: Permit;
  onSuccess: () => void;
  onCancel: () => void;
  updatePermit: (permitId: string, updates: any) => Promise<void>;
}

export function PermitUploadForm({
  permit,
  onSuccess: _onSuccess,
  onCancel,
  updatePermit: _updatePermit,
}: PermitUploadFormProps) {
  const [_file, _setFile] = useState<File | null>(null);
  const [issueDate, _setIssueDate] = useState<Date>(new Date());
  const [_loading, _setLoading] = useState(false);
  const [_error, _setError] = useState<string | null>(null);

  // Calculate expiry date in real-time (will be used in next task)
  // const expiryDate = useMemo(() => {
  //   return calculateExpiryDate(permit.type, issueDate);
  // }, [permit.type, issueDate]);

  // Placeholder for upload handler (will implement in next task)
  const handleUpload = async () => {
    console.log('Upload handler - to be implemented');
    console.log('Expiry will be:', calculateExpiryDate(permit.type, issueDate));
  };

  return (
    <div className="bg-gray-50 border-t border-gray-200 p-6">
      <p>Upload form placeholder - to be implemented</p>
      <div className="flex gap-3 mt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleUpload}>
          Guardar documento
        </Button>
      </div>
    </div>
  );
}
