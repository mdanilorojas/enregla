import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCompany, getEffectiveStatus, getDaysLeftInTrial } from '@/hooks/useCompany';
import { Shield, MessageSquare, Check, Clock, ArrowLeft } from '@/lib/lucide-icons';

// Placeholders — reemplazar con datos reales:
const WHATSAPP_NUMBER = '593987654321'; // E.164 sin +
const WHATSAPP_DISPLAY = '+593 98 765 4321';
const PRICE_BASIC = 19;
const PRICE_PRO = 49;
const PRICE_ENTERPRISE = 99;

const PLANS = [
  {
    id: 'basic',
    name: 'Básico',
    price: PRICE_BASIC,
    description: 'Para una sola sede',
    features: [
      'Hasta 1 sede',
      'Permisos ilimitados',
      'Alertas de vencimiento por email',
      'Documentos en la nube',
      'QR público para inspectores',
    ],
    highlighted: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: PRICE_PRO,
    description: 'Para múltiples sedes',
    features: [
      'Hasta 10 sedes',
      'Todo lo del plan Básico',
      'Múltiples usuarios por empresa',
      'Reportes exportables',
      'Soporte prioritario',
    ],
    highlighted: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: PRICE_ENTERPRISE,
    description: 'Para cadenas y franquicias',
    features: [
      'Sedes ilimitadas',
      'Todo lo del plan Pro',
      'API de integración',
      'Onboarding personalizado',
      'SLA dedicado',
    ],
    highlighted: false,
  },
];

function buildWhatsappUrl(planName: string, companyName: string, ruc: string): string {
  const text = `Hola, quiero activar mi cuenta de EnRegla.\n\nPlan: ${planName}\nEmpresa: ${companyName}\nRUC: ${ruc}\n\nQueda atento al proceso de pago.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export function PaywallView() {
  const { profile, signOut } = useAuth();
  const { data: company } = useCompany(profile?.company_id);
  const status = getEffectiveStatus(company);
  const daysLeft = getDaysLeftInTrial(company);

  const isExpired = status === 'expired' || status === 'suspended';
  const companyName = company?.name ?? '';
  const ruc = company?.ruc ?? '';

  return (
    <div className="min-h-screen bg-[var(--ds-neutral-50)]">
      {/* Header */}
      <header className="border-b border-[var(--ds-border)] bg-white">
        <div className="max-w-6xl mx-auto px-[var(--ds-space-400)] py-[var(--ds-space-300)] flex items-center justify-between">
          <div className="flex items-center gap-[var(--ds-space-150)]">
            <div className="w-9 h-9 rounded-[var(--ds-radius-200)] bg-[var(--ds-text)] flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <span className="text-[var(--ds-font-size-200)] font-semibold text-[var(--ds-text)]">
              EnRegla
            </span>
          </div>
          {!isExpired && (
            <Link
              to="/"
              className="inline-flex items-center gap-[var(--ds-space-100)] text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] hover:text-[var(--ds-text)]"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              Volver al dashboard
            </Link>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-[var(--ds-space-400)] pt-[var(--ds-space-600)] pb-[var(--ds-space-400)] text-center">
        {isExpired ? (
          <>
            <div className="inline-flex items-center gap-[var(--ds-space-100)] px-[var(--ds-space-200)] py-[var(--ds-space-100)] rounded-full bg-[var(--ds-status-vencido-bg)] text-[var(--ds-status-vencido-text)] text-[var(--ds-font-size-075)] font-semibold mb-[var(--ds-space-300)]">
              <Clock className="w-4 h-4" aria-hidden="true" />
              Tu período de prueba terminó
            </div>
            <h1 className="text-[var(--ds-font-size-600)] font-bold text-[var(--ds-text)] tracking-tight">
              Activa tu cuenta para seguir usando EnRegla
            </h1>
            <p className="mt-[var(--ds-space-200)] text-[var(--ds-font-size-200)] text-[var(--ds-text-subtle)] leading-relaxed">
              Elegí un plan, contactanos por WhatsApp y activamos tu cuenta el mismo día.
            </p>
          </>
        ) : (
          <>
            {daysLeft != null && (
              <div className="inline-flex items-center gap-[var(--ds-space-100)] px-[var(--ds-space-200)] py-[var(--ds-space-100)] rounded-full bg-[var(--ds-status-por-vencer-bg)] text-[var(--ds-status-por-vencer-text)] text-[var(--ds-font-size-075)] font-semibold mb-[var(--ds-space-300)]">
                <Clock className="w-4 h-4" aria-hidden="true" />
                Te quedan {daysLeft} {daysLeft === 1 ? 'día' : 'días'} de prueba
              </div>
            )}
            <h1 className="text-[var(--ds-font-size-600)] font-bold text-[var(--ds-text)] tracking-tight">
              Continúa con un plan que se adapte a tu negocio
            </h1>
            <p className="mt-[var(--ds-space-200)] text-[var(--ds-font-size-200)] text-[var(--ds-text-subtle)] leading-relaxed">
              Pago único mensual. Sin contratos largos, cancelas cuando quieras.
            </p>
          </>
        )}
      </section>

      {/* Plans */}
      <section className="max-w-6xl mx-auto px-[var(--ds-space-400)] pb-[var(--ds-space-500)]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[var(--ds-space-300)]">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-[var(--ds-radius-300)] border p-[var(--ds-space-400)] flex flex-col ${
                plan.highlighted
                  ? 'border-[var(--ds-background-brand)] shadow-[var(--ds-shadow-raised)]'
                  : 'border-[var(--ds-border)]'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-[var(--ds-space-200)] py-[var(--ds-space-050)] rounded-full bg-[var(--ds-background-brand)] text-white text-[var(--ds-font-size-075)] font-bold uppercase tracking-wide">
                  Más popular
                </div>
              )}
              <div className="mb-[var(--ds-space-200)]">
                <h3 className="text-[var(--ds-font-size-300)] font-bold text-[var(--ds-text)]">
                  {plan.name}
                </h3>
                <p className="mt-[var(--ds-space-050)] text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)]">
                  {plan.description}
                </p>
              </div>
              <div className="mb-[var(--ds-space-300)]">
                <span className="text-[var(--ds-font-size-700)] font-bold text-[var(--ds-text)] tabular-nums">
                  ${plan.price}
                </span>
                <span className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] ml-1">
                  /mes
                </span>
              </div>
              <ul className="space-y-[var(--ds-space-150)] mb-[var(--ds-space-400)] flex-1">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-[var(--ds-space-100)] text-[var(--ds-font-size-100)] text-[var(--ds-text)]"
                  >
                    <Check
                      className="w-5 h-5 text-[var(--ds-status-vigente-text)] flex-shrink-0 mt-[2px]"
                      aria-hidden="true"
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <a
                href={buildWhatsappUrl(plan.name, companyName, ruc)}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center justify-center gap-[var(--ds-space-100)] w-full py-[var(--ds-space-200)] px-[var(--ds-space-300)] rounded-[var(--ds-radius-200)] font-semibold text-[var(--ds-font-size-100)] transition-colors ${
                  plan.highlighted
                    ? 'bg-[var(--ds-background-brand)] text-white hover:opacity-90'
                    : 'bg-[var(--ds-neutral-100)] text-[var(--ds-text)] hover:bg-[var(--ds-neutral-200)]'
                }`}
              >
                <MessageSquare className="w-5 h-5" aria-hidden="true" />
                Contratar por WhatsApp
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Contact panel */}
      <section className="max-w-3xl mx-auto px-[var(--ds-space-400)] pb-[var(--ds-space-600)]">
        <div className="bg-white rounded-[var(--ds-radius-300)] border border-[var(--ds-border)] p-[var(--ds-space-400)] text-center">
          <h2 className="text-[var(--ds-font-size-300)] font-bold text-[var(--ds-text)] mb-[var(--ds-space-150)]">
            ¿Dudas? Contactanos
          </h2>
          <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)] mb-[var(--ds-space-300)]">
            Respondemos en horario de oficina (Lun-Vie, 9:00-18:00 GMT-5).
          </p>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-[var(--ds-space-150)] px-[var(--ds-space-400)] py-[var(--ds-space-250)] rounded-[var(--ds-radius-200)] bg-[#25D366] text-white font-semibold hover:opacity-90 transition-opacity"
          >
            <MessageSquare className="w-5 h-5" aria-hidden="true" />
            WhatsApp: {WHATSAPP_DISPLAY}
          </a>
          <p className="mt-[var(--ds-space-300)] text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)]">
            Una vez confirmado el pago, activamos tu cuenta de forma manual en menos de 2 horas hábiles.
          </p>
        </div>
      </section>

      {/* Logout footer (solo si expirado) */}
      {isExpired && (
        <footer className="border-t border-[var(--ds-border)] bg-white">
          <div className="max-w-6xl mx-auto px-[var(--ds-space-400)] py-[var(--ds-space-300)] flex items-center justify-between">
            <span className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)]">
              {profile?.full_name && `Sesión de ${profile.full_name}`}
            </span>
            <button
              type="button"
              onClick={() => {
                void signOut();
              }}
              className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] hover:text-[var(--ds-text)] underline"
            >
              Cerrar sesión
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}
