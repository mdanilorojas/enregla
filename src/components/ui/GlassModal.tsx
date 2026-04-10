import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function GlassModal({ isOpen, onClose, title, children, size = 'md' }: GlassModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with strong blur */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Glass modal */}
      <div className={`relative ${sizeClasses[size]} w-full`}>
        <div className="backdrop-blur-2xl bg-white/80 border border-white/30 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/50">
              <h2 className="text-lg font-bold text-gray-900">{title}</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {/* Content */}
          <div className="px-6 py-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
