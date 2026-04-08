import { useState, useRef, useCallback } from 'react';
import type { Permit } from '@/types';
import { PERMIT_TYPE_LABELS } from '@/types';
import { useAppStore } from '@/store';
import {
  X,
  Upload,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Loader2,
} from 'lucide-react';

interface Props {
  permit: Permit;
  onClose: () => void;
}

type Step = 'upload' | 'confirm' | 'done';

export function PermitUploadModal({ permit, onClose }: Props) {
  const resolvePermit = useAppStore((s) => s.resolvePermit);
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const permitLabel = PERMIT_TYPE_LABELS[permit.type];

  const handleFile = useCallback((f: File) => {
    setFile(f);
    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
    setStep('confirm');
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile],
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const handleConfirm = () => {
    if (!file) return;
    setSaving(true);
    setTimeout(() => {
      resolvePermit(permit.id, file.name);
      setStep('done');
      setSaving(false);
    }, 600);
  };

  const isImage = file?.type.startsWith('image/');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Shield size={16} strokeWidth={1.8} />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-gray-900">
                {step === 'done' ? 'Permiso actualizado' : `Subir ${permitLabel}`}
              </h3>
              <p className="text-[11px] text-gray-400">{permit.issuer}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {step === 'upload' && (
            <div
              className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${
                dragging
                  ? 'border-blue-400 bg-blue-50/50 scale-[1.01]'
                  : 'border-gray-200 hover:border-gray-300 bg-gray-50/30'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={onInputChange}
                className="hidden"
              />

              <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-500 flex items-center justify-center mx-auto mb-4">
                <Upload size={24} strokeWidth={1.5} />
              </div>

              <p className="text-[14px] font-semibold text-gray-800 mb-1">
                Arrastra tu archivo aquí
              </p>
              <p className="text-[12px] text-gray-400 mb-4">
                o haz clic para seleccionar — PDF, JPG, PNG
              </p>

              <button
                onClick={() => inputRef.current?.click()}
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-[13px] font-semibold shadow-lg shadow-blue-500/20 hover:bg-blue-700 active:scale-[0.98] transition-all"
              >
                Seleccionar archivo
              </button>
            </div>
          )}

          {step === 'confirm' && file && (
            <div className="space-y-5">
              {/* File preview */}
              <div className="rounded-2xl border border-gray-200 overflow-hidden bg-gray-50">
                {isImage && preview ? (
                  <img
                    src={preview}
                    alt="Vista previa"
                    className="w-full max-h-[280px] object-contain bg-white"
                  />
                ) : (
                  <div className="flex items-center justify-center py-12 bg-white">
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-3">
                        <FileText size={28} strokeWidth={1.5} />
                      </div>
                      <p className="text-[13px] font-medium text-gray-600">{file.name}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {(file.size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                  </div>
                )}

                {isImage && (
                  <div className="flex items-center gap-3 px-4 py-3 border-t border-gray-100 bg-white">
                    <ImageIcon size={14} className="text-gray-400 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-medium text-gray-700 truncate">{file.name}</p>
                      <p className="text-[10px] text-gray-400">{(file.size / 1024).toFixed(0)} KB</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirmation */}
              <div className="rounded-xl bg-amber-50 border border-amber-200/60 px-4 py-3.5">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[13px] font-semibold text-amber-800 leading-tight">
                      ¿Confirmas que este es el documento de {permitLabel}?
                    </p>
                    <p className="text-[11px] text-amber-600/80 mt-1 leading-snug">
                      Al confirmar, el permiso pasará a estado <strong>Vigente</strong> y se recalculará la fecha de vencimiento automáticamente.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setFile(null); setPreview(null); setStep('upload'); }}
                  className="flex-1 px-4 py-3 rounded-xl bg-gray-100 text-gray-600 text-[13px] font-semibold hover:bg-gray-200 active:scale-[0.98] transition-all"
                >
                  Cambiar archivo
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white text-[13px] font-semibold shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      Confirmar y registrar
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 'done' && (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 animate-count-pulse">
                <CheckCircle2 size={28} />
              </div>
              <h4 className="text-[16px] font-bold text-gray-900 mb-1">
                {permitLabel} actualizado
              </h4>
              <p className="text-[13px] text-gray-500 mb-1">
                El permiso ahora está <span className="text-emerald-600 font-semibold">Vigente</span>
              </p>
              <p className="text-[11px] text-gray-400 mb-6">
                Documento registrado · Fecha de vencimiento recalculada
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-gray-900 text-white text-[13px] font-semibold hover:bg-gray-800 active:scale-[0.98] transition-all"
              >
                Listo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
