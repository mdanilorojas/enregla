import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Location, Permit } from '@/types/database';
import { getLocationPermitStats } from '@/lib/dashboard-metrics';
import { RiskIndicator, ProgressBar } from '@/components/ui';
import { daysUntil, formatDateRelative } from '@/lib/dates';
import { MapPin, Building2, Edit, ExternalLink } from 'lucide-react';

interface Props {
  locations: Location[];
  permits: Permit[];
}

const STATUS_LABELS: Record<Location['status'], string> = {
  operando: 'Operando',
  en_preparacion: 'En preparación',
  cerrado: 'Cerrado',
};

function LocationCard({ location, permits, navigate }: {
  location: Location;
  permits: Permit[];
  navigate: (path: string) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const locPermits = permits.filter((p) => p.location_id === location.id && p.is_active);
  const stats = getLocationPermitStats(locPermits);
  const compliance = stats.total > 0 ? Math.round((stats.vigentes / stats.total) * 100) : 0;

  // Find next expiring permit
  const nextExpiring = locPermits
    .filter((p) => p.expiry_date && p.status !== 'vigente')
    .sort((a, b) => new Date(a.expiry_date!).getTime() - new Date(b.expiry_date!).getTime())[0];

  return (
    <motion.div
      onClick={() => navigate(`/sedes/${location.id}`)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative overflow-hidden group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all cursor-pointer"
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.2 }}
    >
      {/* Animated gradient on hover */}
      <div
        className={`absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <div className="relative p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-50 to-slate-100 border border-gray-200/60 flex items-center justify-center shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
              <Building2 size={16} className="text-gray-500" strokeWidth={1.8} />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {location.name}
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">{location.address}</p>
            </div>
          </div>

          {/* Quick actions on hover */}
          <div className={`flex gap-2 transition-all duration-200 ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/sedes/${location.id}`);
              }}
              className="p-1.5 rounded-lg bg-white shadow-lg hover:bg-blue-50 transition-colors z-10"
            >
              <Edit size={12} className="text-blue-600" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/sedes/${location.id}`);
              }}
              className="p-1.5 rounded-lg bg-white shadow-lg hover:bg-blue-50 transition-colors z-10"
            >
              <ExternalLink size={12} className="text-blue-600" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <RiskIndicator level={location.risk_level} size="sm" />
          <span className="text-[11px] text-gray-500 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-100 font-medium">
            {STATUS_LABELS[location.status]}
          </span>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <ProgressBar value={compliance} className="flex-1" size="md" />
          <span
            className={`text-[13px] font-bold tracking-tight ${
              compliance >= 80 ? 'text-emerald-600' : compliance >= 50 ? 'text-amber-600' : 'text-red-500'
            }`}
          >
            {compliance}%
          </span>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          {stats.criticalCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-red-500 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              {stats.criticalCount} {stats.criticalCount === 1 ? 'problema crítico' : 'problemas críticos'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-500 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Sin problemas
            </span>
          )}
          {nextExpiring && nextExpiring.expiry_date && (
            <span
              className={`text-[11px] font-semibold ${
                daysUntil(nextExpiring.expiry_date) < 0
                  ? 'text-red-500'
                  : daysUntil(nextExpiring.expiry_date) <= 30
                  ? 'text-amber-600'
                  : 'text-gray-400'
              }`}
            >
              {formatDateRelative(nextExpiring.expiry_date)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function LocationGrid({ locations, permits }: Props) {
  const navigate = useNavigate();

  if (locations.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-4">
          <MapPin size={24} />
        </div>
        <p className="text-sm font-semibold text-gray-700 mb-1">No hay sedes registradas</p>
        <p className="text-xs text-gray-500">Complete el proceso de onboarding para crear sus primeras sedes</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shadow-sm shadow-violet-500/10">
            <MapPin size={16} strokeWidth={1.8} />
          </div>
          <div>
            <span className="text-[14px] font-semibold text-gray-900 block leading-tight">Resumen por sede</span>
            <span className="text-[11px] text-gray-400 font-medium">{locations.length} ubicaciones registradas</span>
          </div>
        </div>
      </div>
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1,
            },
          },
        }}
      >
        {locations.map((loc) => (
          <motion.div
            key={loc.id}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <LocationCard
              location={loc}
              permits={permits}
              navigate={navigate}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
