export const BUSINESS_TYPES = [
  'restaurante',
  'retail',
  'food_truck',
  'consultorio',
  'cafeteria',
  'panaderia',
  'bar',
  'farmacia',
  'gimnasio',
  'salon_belleza',
  'oficina',
  'otro',
] as const;

export type BusinessType = typeof BUSINESS_TYPES[number];

const LABELS: Record<BusinessType, string> = {
  restaurante: 'Restaurante',
  retail: 'Retail / Tienda',
  food_truck: 'Food truck',
  consultorio: 'Consultorio médico',
  cafeteria: 'Cafetería',
  panaderia: 'Panadería',
  bar: 'Bar / Discoteca',
  farmacia: 'Farmacia',
  gimnasio: 'Gimnasio',
  salon_belleza: 'Salón de belleza',
  oficina: 'Oficina profesional',
  otro: 'Otro',
};

export function businessTypeLabel(t: string): string {
  return LABELS[t as BusinessType] ?? t;
}
