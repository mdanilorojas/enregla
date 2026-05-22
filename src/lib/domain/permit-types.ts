const PERMIT_TYPE_LABELS: Record<string, string> = {
  ruc: 'RUC',
  patente_municipal: 'Patente municipal',
  uso_suelo: 'Uso de suelo',
  luae: 'LUAE',
  bomberos: 'Bomberos',
  arcsa: 'ARCSA',
  rotulacion: 'Rotulación',
  msp: 'Permiso MSP',
}

export function permitTypeLabel(type: string | null | undefined): string {
  if (!type) return 'Permiso'
  return (
    PERMIT_TYPE_LABELS[type] ??
    type
      .split('_')
      .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
      .join(' ')
  )
}
