import { useState, useMemo } from 'react';
// @ts-expect-error - Used in Task 4
import { format } from 'date-fns';
// @ts-expect-error - Used in Task 4
import { Upload, Calendar as CalendarIcon, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui-v2/button';
// @ts-expect-error - Used in Task 4
import { Calendar } from '@/components/ui-v2/calendar';
// @ts-expect-error - Used in Task 4
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui-v2/popover';
// @ts-expect-error - Used in Task 4
import { uploadPermitDocument } from '@/lib/api/documents';
// @ts-expect-error - formatPermitDuration used in Task 4
import { calculateExpiryDate, formatPermitDuration } from '@/lib/permitRules';
import type { Permit } from '@/types/database';

interface PermitUploadFormProps {
  permit: Permit;
  onSuccess: () => void;
  onCancel: () => void;
  updatePermit: (
    permitId: string,
    updates: {
      issue_date?: string;
      expiry_date?: string | null;
      status?: 'vigente' | 'por_vencer' | 'vencido' | 'en_tramite' | 'no_registrado';
      permit_number?: string | null;
      notes?: string | null;
    }
  ) => Promise<void>;
}

export function PermitUploadForm({
  permit,
  // @ts-expect-error - Used in Task 6
  onSuccess,
  onCancel,
  // @ts-expect-error - Used in Task 6
  updatePermit,
}: PermitUploadFormProps) {
  // @ts-expect-error - Used in Task 4
  const [file, setFile] = useState<File | null>(null);
  // @ts-expect-error - setIssueDate used in Task 5
  const [issueDate, setIssueDate] = useState<Date>(new Date());
  // @ts-expect-error - Used in Task 6
  const [loading, setLoading] = useState(false);
  // @ts-expect-error - Used in Task 6
  const [error, setError] = useState<string | null>(null);

  // @ts-expect-error - Used in Task 4
  const expiryDate = useMemo(() => {
    return calculateExpiryDate(permit.type, issueDate);
  }, [permit.type, issueDate]);

  const handleUpload = async () => {
    console.log('Upload handler - to be implemented');
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
