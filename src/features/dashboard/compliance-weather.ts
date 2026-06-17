import type { WeatherState } from '@/components/ui/ComplianceWeatherCard'

export interface WeatherMetrics {
  state: WeatherState
  chipLabel: string
  headline: string
}

export function computeComplianceWeather(metrics: {
  vencidos: number
  porVencer: number
  noRegistrado: number
  enTramite: number
  total: number
}): WeatherMetrics {
  const { vencidos, porVencer, noRegistrado, enTramite, total } = metrics

  if (total === 0) {
    return {
      state: 'warn',
      chipLabel: 'Configuración',
      headline: 'Registra tu primer permiso para comenzar a monitorear.',
    }
  }

  if (vencidos > 0) {
    return {
      state: 'err',
      chipLabel: 'Riesgo Crítico',
      headline: 'Atención: tienes permisos vencidos que requieren acción.',
    }
  }

  if (enTramite > 0) {
    return {
      state: 'warn',
      chipLabel: 'Alerta Operativa',
      headline: 'Tienes permisos próximos a vencer, en trámite o sin registrar.',
    }
  }

  if (porVencer > 0 || noRegistrado > 0) {
    return {
      state: 'warn',
      chipLabel: 'Alerta Operativa',
      headline: 'Tienes permisos próximos a vencer o sin registrar.',
    }
  }

  return {
    state: 'sunny',
    chipLabel: 'Operación Protegida',
    headline: 'Tu operación se encuentra al día y segura.',
  }
}
