import { useState } from 'react';
import { DESIGN_SYSTEM, type DesignSystem } from '@/config';

export function DesignSystemToggle() {
  const [system, setSystem] = useState<DesignSystem>(DESIGN_SYSTEM);

  const toggleSystem = () => {
    const newSystem: DesignSystem = system === 'professional' ? 'energetic' : 'professional';
    setSystem(newSystem);
    localStorage.setItem('design-system', newSystem);

    // Update data-theme attribute on document element
    document.documentElement.setAttribute('data-theme', newSystem);
  };

  return (
    <div className="fixed top-4 right-4 z-50 bg-surface rounded-lg shadow-lg p-2 border border-border">
      <button
        onClick={toggleSystem}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium hover:bg-gray-50 rounded-md transition-colors"
        type="button"
      >
        <span role="img" aria-label="Design">🎨</span>
        <span className="font-semibold">
          {system === 'professional' ? 'Professional (Blue)' : 'Energetic (Orange)'}
        </span>
        <span className="text-xs text-text-secondary ml-2">Click to switch</span>
      </button>
      <p className="text-xs text-text-secondary mt-1 px-3">
        Testing design systems - choice applies to all screens
      </p>
    </div>
  );
}
