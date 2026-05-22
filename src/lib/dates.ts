import { format, differenceInDays, addDays, parseISO, isAfter, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { toZonedTime } from 'date-fns-tz';

const ECUADOR_TZ = 'America/Guayaquil';

/** "Hoy" en Ecuador (UTC-5), independiente de la TZ del navegador. */
function todayInEcuador(): Date {
  return startOfDay(toZonedTime(new Date(), ECUADOR_TZ));
}

/**
 * Convierte el input de fecha a un Date que representa el inicio del día en Ecuador.
 * Si es ISO con hora, se respeta la fecha calendario en EC.
 */
function ecuadorDate(date: string | Date): Date {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return startOfDay(toZonedTime(d, ECUADOR_TZ));
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, "d 'de' MMM, yyyy", { locale: es });
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'd MMM', { locale: es });
}

export function formatDateRelative(date: string | Date): string {
  const diff = daysUntil(date);

  if (diff < 0) return `Venció hace ${Math.abs(diff)} días`;
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Mañana';
  if (diff <= 7) return `En ${diff} días`;
  if (diff <= 30) return `En ${Math.ceil(diff / 7)} semanas`;
  return `En ${Math.ceil(diff / 30)} meses`;
}

export function daysUntil(date: string | Date): number {
  return differenceInDays(ecuadorDate(date), todayInEcuador());
}

export function urgencyLevel(date: string | Date): 'expired' | 'critical' | 'warning' | 'ok' {
  const days = daysUntil(date);
  if (days < 0) return 'expired';
  if (days <= 30) return 'critical';
  if (days <= 60) return 'warning';
  return 'ok';
}

export function getDateInDays(days: number): string {
  return addDays(new Date(), days).toISOString();
}

export function isExpired(date: string | Date): boolean {
  return isBefore(ecuadorDate(date), todayInEcuador());
}

export function isFuture(date: string | Date): boolean {
  return isAfter(ecuadorDate(date), todayInEcuador());
}

export function getMonthName(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMMM yyyy', { locale: es });
}

/** Año calendario en Ecuador para una fecha dada. */
export function yearInEcuador(date: string | Date): number {
  return ecuadorDate(date).getFullYear();
}

/** Año actual en Ecuador. */
export function currentYearEcuador(): number {
  return todayInEcuador().getFullYear();
}
