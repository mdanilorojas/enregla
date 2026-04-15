/**
 * Permit duration rules based on Ecuadorian regulatory law
 * Source: deep-research-report.md
 */

/**
 * Number of days before expiry when a permit is considered "about to expire"
 */
export const EXPIRY_WARNING_DAYS = 30;

export interface PermitDuration {
  years?: number;
  type: 'calendar' | 'fiscal' | 'year_end' | 'annual_renewal' | 'indefinite';
}

/**
 * Permit status types exported for consumers
 */
export type PermitStatus = 'vigente' | 'por_vencer' | 'vencido';

/**
 * Duration rules for each permit type
 */
export const PERMIT_DURATIONS: Record<string, PermitDuration> = {
  // ARCSA permits - 1 year calendar
  'Permiso Sanitario (ARCSA)': { years: 1, type: 'calendar' },
  'ARCSA Supermercado/Comisariato': { years: 1, type: 'calendar' },
  'ARCSA Farmacia': { years: 1, type: 'calendar' },

  // Health permits - 1 year calendar
  'Permiso de Funcionamiento (ACESS)': { years: 1, type: 'calendar' },

  // Government permits - 1 year fiscal
  'Permiso Anual de Funcionamiento': { years: 1, type: 'fiscal' },

  // Municipal permits
  'LUAE': { type: 'annual_renewal' },
  'Patente Municipal': { years: 1, type: 'calendar' },

  // Fire department - until year end
  'Bomberos': { type: 'year_end' },

  // Special permits
  'Licencia Rayos X': { years: 4, type: 'calendar' },
  'PUCA': { type: 'annual_renewal' },

  // Tax - indefinite
  'RUC': { type: 'indefinite' },

  // Additional permits (defaults for regulatory factors)
  'Permiso de Alcohol (SCPM)': { years: 1, type: 'calendar' },
  'Permiso de Salud (MSP)': { years: 1, type: 'calendar' },
  'Permiso Químicos (CONSEP)': { years: 1, type: 'calendar' },
};

/**
 * Calculate expiry date for a permit based on its type and issue date
 * Returns null for indefinite permits
 *
 * IMPORTANT: All dates are treated as local/naive dates without timezone conversion.
 * This is intentional - permit issue dates in Ecuador are recorded as local dates
 * without timezone information. Expiry dates are calculated using local calendar dates.
 *
 * NOTE: Expiry dates returned are at start-of-day (00:00:00). The permit is considered
 * valid through the entire expiry date (until 23:59:59 of that day).
 */
export function calculateExpiryDate(
  permitType: string,
  issueDate: Date
): Date | null {
  // Validate issueDate parameter
  if (!(issueDate instanceof Date) || isNaN(issueDate.getTime())) {
    throw new Error('Invalid issueDate: must be a valid Date object');
  }

  const duration = PERMIT_DURATIONS[permitType];

  if (!duration) {
    // Fallback: assume 1 year calendar if permit type not found
    console.warn(
      `Unknown permit type: ${permitType}, defaulting to 1 year`
    );
    const expiry = new Date(issueDate);
    expiry.setFullYear(expiry.getFullYear() + 1);
    return expiry;
  }

  switch (duration.type) {
    case 'calendar':
      const expiry = new Date(issueDate);
      expiry.setFullYear(expiry.getFullYear() + (duration.years || 1));
      return expiry;

    case 'fiscal':
      // Fiscal year = 1 year from issue date
      const fiscalExpiry = new Date(issueDate);
      fiscalExpiry.setFullYear(fiscalExpiry.getFullYear() + 1);
      return fiscalExpiry;

    case 'year_end':
      // Expires 31-Dec of issue year
      return new Date(issueDate.getFullYear(), 11, 31); // Month 11 = December

    case 'annual_renewal':
      // For LUAE/PUCA: set expiry to end of year
      return new Date(issueDate.getFullYear(), 11, 31);

    case 'indefinite':
      // No expiry
      return null;

    default:
      return null;
  }
}

/**
 * Calculate permit status based on expiry date
 */
export function calculatePermitStatus(
  expiryDate: Date | null
): PermitStatus {
  if (!expiryDate) return 'vigente'; // Indefinite permits stay vigente

  const now = new Date();
  const daysUntilExpiry = Math.ceil(
    (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilExpiry < 0) return 'vencido';
  if (daysUntilExpiry <= EXPIRY_WARNING_DAYS) return 'por_vencer';
  return 'vigente';
}

/**
 * Format permit duration for display to user
 */
export function formatPermitDuration(permitType: string): string {
  const duration = PERMIT_DURATIONS[permitType];
  if (!duration) return 'Vigencia: 1 año';

  switch (duration.type) {
    case 'calendar':
      return `Vigencia: ${duration.years} año${duration.years !== 1 ? 's' : ''}`;
    case 'fiscal':
      return 'Vigencia: 1 año fiscal';
    case 'year_end':
      return 'Vigencia: Hasta 31-dic del año en curso';
    case 'annual_renewal':
      return 'Vigencia: Renovación anual';
    case 'indefinite':
      return 'Vigencia: Indefinida';
    default:
      return 'Vigencia: 1 año';
  }
}
