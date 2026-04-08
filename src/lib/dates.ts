import { format, differenceInDays, addDays, parseISO, isAfter, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, "d 'de' MMM, yyyy", { locale: es });
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'd MMM', { locale: es });
}

export function formatDateRelative(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const today = new Date();
  const diff = differenceInDays(d, today);

  if (diff < 0) return `Venció hace ${Math.abs(diff)} días`;
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Mañana';
  if (diff <= 7) return `En ${diff} días`;
  if (diff <= 30) return `En ${Math.ceil(diff / 7)} semanas`;
  return `En ${Math.ceil(diff / 30)} meses`;
}

export function daysUntil(date: string | Date): number {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return differenceInDays(d, new Date());
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
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isBefore(d, new Date());
}

export function isFuture(date: string | Date): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isAfter(d, new Date());
}

export function getMonthName(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMMM yyyy', { locale: es });
}
