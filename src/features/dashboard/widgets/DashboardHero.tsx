import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: number;
  suffix?: string;
  icon: React.ReactNode;
  trend?: string;
  variant?: 'success' | 'warning' | 'info';
}

function MetricCard({ label, value, suffix = '', icon, trend, variant = 'info' }: MetricCardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      let start = 0;
      const duration = 1000;
      const increment = value / (duration / 16);

      const counter = setInterval(() => {
        start += increment;
        if (start >= value) {
          setDisplayValue(value);
          clearInterval(counter);
        } else {
          setDisplayValue(Math.floor(start));
        }
      }, 16);

      return () => clearInterval(counter);
    }, 100);

    return () => clearTimeout(timer);
  }, [value]);

  const variantStyles = {
    success: 'from-emerald-500/10 to-emerald-600/5',
    warning: 'from-amber-500/10 to-orange-600/5',
    info: 'from-blue-500/10 to-blue-600/5',
  };

  return (
    <div className="relative group">
      <div className={`absolute inset-0 bg-gradient-to-br ${variantStyles[variant]} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      <div className="relative p-6 rounded-2xl bg-white/90 backdrop-blur-sm border border-white/20 shadow-lg">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/50 flex items-center justify-center">
              {icon}
            </div>
          </div>
          {trend && (
            <div className="flex items-center gap-1 text-emerald-400 text-sm font-semibold">
              <TrendingUp size={14} />
              {trend}
            </div>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-4xl font-bold text-white tracking-tight">
            {displayValue}
            <span className="text-2xl">{suffix}</span>
          </p>
          <p className="text-sm text-white/70 font-medium">{label}</p>
        </div>
      </div>
    </div>
  );
}

interface DashboardHeroProps {
  compliance: number;
  activeAlerts: number;
  pendingTasks: number;
}

export function DashboardHero({ compliance, activeAlerts, pendingTasks }: DashboardHeroProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 shadow-2xl">
      {/* Animated background blobs */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-blob" />
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <h2 className="text-2xl font-bold text-white mb-8">Panel de Control</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            label="Cumplimiento General"
            value={compliance}
            suffix="%"
            icon={<Shield size={20} className="text-emerald-500" />}
            trend="+5.2%"
            variant="success"
          />
          <MetricCard
            label="Alertas Activas"
            value={activeAlerts}
            icon={<AlertTriangle size={20} className="text-amber-500" />}
            variant="warning"
          />
          <MetricCard
            label="Tareas Pendientes"
            value={pendingTasks}
            icon={<CheckCircle size={20} className="text-blue-400" />}
            variant="info"
          />
        </div>
      </div>

      {/* Add keyframes for blob animation */}
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
