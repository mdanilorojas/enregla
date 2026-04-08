import { useState, useRef, useEffect } from 'react';
import type { PermitType } from '@/types';
import { PERMIT_TYPE_LABELS } from '@/types';
import { getLegalReference } from '@/data/legal-references';
import { Scale, ExternalLink, Clock, AlertTriangle, BookOpen, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LegalPillProps {
  permitType: PermitType;
  variant?: 'inline' | 'compact' | 'full';
  className?: string;
}

export function LegalPill({ permitType, variant = 'inline', className = '' }: LegalPillProps) {
  const [showPopover, setShowPopover] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState<'bottom' | 'top'>('bottom');
  const pillRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const navigate = useNavigate();
  const ref = getLegalReference(permitType);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!ref) return null;

  const primarySource = ref.sources[0];
  const primaryArticle = primarySource?.articles?.split(';')[0]?.trim() || '';

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (pillRef.current) {
      const rect = pillRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setPopoverPosition(spaceBelow < 350 ? 'top' : 'bottom');
    }

    timeoutRef.current = setTimeout(() => setShowPopover(true), 150);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setShowPopover(false), 200);
  };

  if (variant === 'compact') {
    return (
      <div className={`relative ${className}`} ref={pillRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <button
          className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
          onClick={(e) => { e.stopPropagation(); navigate('/marco-legal'); }}
        >
          <Scale size={10} />
          {primarySource?.shortName}
        </button>
        {showPopover && <LegalPopover ref_={ref} position={popoverPosition} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onNavigate={() => navigate('/marco-legal')} />}
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className={`relative ${className}`} ref={pillRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-50/60 border border-indigo-100/80 cursor-default">
          <Scale size={12} className="text-indigo-500 shrink-0" />
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-semibold text-indigo-600 block truncate">{primarySource?.shortName}</span>
            {primaryArticle && (
              <span className="text-[10px] text-indigo-400 block truncate">{primaryArticle}</span>
            )}
          </div>
          {primarySource?.url && (
            <a
              href={primarySource.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-indigo-400 hover:text-indigo-600 transition-colors shrink-0"
            >
              <ExternalLink size={11} />
            </a>
          )}
        </div>
        {showPopover && <LegalPopover ref_={ref} position={popoverPosition} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onNavigate={() => navigate('/marco-legal')} />}
      </div>
    );
  }

  // variant === 'inline' (default)
  return (
    <div className={`relative inline-flex ${className}`} ref={pillRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100/80 text-[10px] font-semibold text-indigo-600 cursor-default whitespace-nowrap">
        <Scale size={9} className="shrink-0" />
        {primarySource?.shortName}
        {primaryArticle && <span className="text-indigo-400 font-medium hidden sm:inline"> · {primaryArticle.slice(0, 30)}{primaryArticle.length > 30 ? '…' : ''}</span>}
      </span>
      {showPopover && <LegalPopover ref_={ref} position={popoverPosition} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onNavigate={() => navigate('/marco-legal')} />}
    </div>
  );
}

interface LegalPopoverProps {
  ref_: NonNullable<ReturnType<typeof getLegalReference>>;
  position: 'bottom' | 'top';
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onNavigate: () => void;
}

function LegalPopover({ ref_, position, onMouseEnter, onMouseLeave, onNavigate }: LegalPopoverProps) {
  const primarySource = ref_.sources[0];

  return (
    <div
      className={`absolute z-50 w-[360px] left-0 ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} animate-fade-in`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xl shadow-black/8 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-100/60">
          <div className="flex items-center gap-2 mb-1">
            <Scale size={13} className="text-indigo-500" />
            <span className="text-[12px] font-bold text-indigo-700">Regulación vigente</span>
          </div>
          <p className="text-[12px] font-semibold text-gray-800">{PERMIT_TYPE_LABELS[ref_.permitType]}</p>
        </div>

        {/* Sources */}
        <div className="px-4 py-3 space-y-2.5">
          {ref_.sources.slice(0, 3).map((source, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-500 flex items-center justify-center shrink-0 mt-0.5">
                <BookOpen size={10} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-1.5">
                  <p className="text-[12px] font-semibold text-gray-800 leading-tight">{source.shortName}</p>
                  {source.url && (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-600 transition-colors shrink-0 mt-0.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink size={10} />
                    </a>
                  )}
                </div>
                {source.articles && (
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{source.articles}</p>
                )}
                <p className="text-[10px] text-gray-400 mt-0.5">{source.entity}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Frequency */}
        <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock size={10} className="text-gray-400" />
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Periodicidad</span>
          </div>
          <p className="text-[11px] text-gray-600 leading-snug">
            {ref_.frequencyBasis.slice(0, 180)}{ref_.frequencyBasis.length > 180 ? '…' : ''}
          </p>
        </div>

        {/* Consequences preview */}
        {ref_.consequences.length > 0 && (
          <div className="px-4 py-2.5 border-t border-gray-100">
            <div className="flex items-center gap-1.5 mb-1.5">
              <AlertTriangle size={10} className="text-red-400" />
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Riesgo por incumplimiento</span>
            </div>
            <div className="space-y-1">
              {ref_.consequences.slice(0, 2).map((c, i) => (
                <p key={i} className="text-[11px] text-red-600/80 leading-snug flex items-start gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-red-400 mt-1.5 shrink-0" />
                  {c.slice(0, 100)}{c.length > 100 ? '…' : ''}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/30">
          <button
            onClick={(e) => { e.stopPropagation(); onNavigate(); }}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 transition-colors w-full"
          >
            Ver marco legal completo
            <ChevronRight size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}
