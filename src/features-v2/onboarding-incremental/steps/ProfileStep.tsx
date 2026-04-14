import { useState } from 'react';

interface ProfileStepProps {
  initialName?: string;
  onNext: (fullName: string) => Promise<void>;
  loading: boolean;
}

export function ProfileStep({ initialName = '', onNext, loading }: ProfileStepProps) {
  const [fullName, setFullName] = useState(initialName);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fullName.trim().length === 0) return;
    await onNext(fullName.trim());
  };

  const canProceed = fullName.trim().length > 0;

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-xl font-semibold text-gray-900 mb-1 tracking-tight">
        Bienvenido a PermitOps
      </h2>
      <p className="text-[13px] text-gray-500 mb-8">
        Comencemos con tu información básica. Paso 1 de 3
      </p>

      <div className="space-y-5">
        <div>
          <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
            ¿Cómo te llamas?
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nombre completo"
            disabled={loading}
            autoFocus
            className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={!canProceed || loading}
        className="hidden"
      />
    </form>
  );
}
