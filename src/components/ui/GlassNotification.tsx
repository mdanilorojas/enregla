import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

type NotificationType = 'success' | 'warning' | 'info' | 'error';

interface GlassNotificationProps {
  type: NotificationType;
  title: string;
  message: string;
  onClose?: () => void;
}

const typeConfig = {
  success: {
    icon: CheckCircle,
    bgColor: 'from-emerald-500/20 to-emerald-600/10',
    borderColor: 'border-emerald-500/30',
    iconColor: 'text-emerald-600',
    textColor: 'text-emerald-900',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'from-amber-500/20 to-amber-600/10',
    borderColor: 'border-amber-500/30',
    iconColor: 'text-amber-600',
    textColor: 'text-amber-900',
  },
  error: {
    icon: AlertTriangle,
    bgColor: 'from-red-500/20 to-red-600/10',
    borderColor: 'border-red-500/30',
    iconColor: 'text-red-600',
    textColor: 'text-red-900',
  },
  info: {
    icon: Info,
    bgColor: 'from-blue-500/20 to-blue-600/10',
    borderColor: 'border-blue-500/30',
    iconColor: 'text-blue-600',
    textColor: 'text-blue-900',
  },
};

export function GlassNotification({ type, title, message, onClose }: GlassNotificationProps) {
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div className={`backdrop-blur-xl bg-gradient-to-br ${config.bgColor} border ${config.borderColor} rounded-2xl p-4 shadow-2xl max-w-md animate-slide-up`}>
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 ${config.iconColor}`}>
          <Icon size={20} strokeWidth={2} />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-bold ${config.textColor}`}>{title}</h3>
          <p className={`text-xs mt-1 ${config.textColor} opacity-90`}>{message}</p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className={`flex-shrink-0 ${config.textColor} opacity-60 hover:opacity-100 transition-opacity`}
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
