import { describe, it, expect } from 'vitest'
import { computeComplianceWeather } from '@/features/dashboard/compliance-weather'

describe('computeComplianceWeather', () => {
  it('debe retornar estado de tormenta (err) si hay permisos vencidos', () => {
    const res = computeComplianceWeather({ vencidos: 1, porVencer: 2, noRegistrado: 0, enTramite: 0, total: 3 })
    expect(res.state).toBe('err')
    expect(res.chipLabel).toBe('Riesgo Crítico')
    expect(res.headline).toContain('permisos vencidos')
  })

  it('debe retornar estado de nublado (warn) si no hay vencidos pero hay permisos por vencer o no registrados', () => {
    const res1 = computeComplianceWeather({ vencidos: 0, porVencer: 1, noRegistrado: 0, enTramite: 0, total: 1 })
    expect(res1.state).toBe('warn')
    expect(res1.chipLabel).toBe('Alerta Operativa')

    const res2 = computeComplianceWeather({ vencidos: 0, porVencer: 0, noRegistrado: 1, enTramite: 0, total: 1 })
    expect(res2.state).toBe('warn')
    expect(res2.chipLabel).toBe('Alerta Operativa')
  })

  it('debe retornar estado de nublado (warn) si hay permisos en trámite', () => {
    const res = computeComplianceWeather({ vencidos: 0, porVencer: 0, noRegistrado: 0, enTramite: 1, total: 1 })
    expect(res.state).toBe('warn')
    expect(res.chipLabel).toBe('Alerta Operativa')
    expect(res.headline).toBe('Tienes permisos próximos a vencer, en trámite o sin registrar.')
  })

  it('debe retornar estado soleado (sunny) si no hay vencidos, por vencer ni no registrados', () => {
    const res = computeComplianceWeather({ vencidos: 0, porVencer: 0, noRegistrado: 0, enTramite: 0, total: 5 })
    expect(res.state).toBe('sunny')
    expect(res.chipLabel).toBe('Operación Protegida')
    expect(res.headline).toContain('al día y segura')
  })

  it('debe retornar estado de configuración (warn) si el total de permisos es 0', () => {
    const res = computeComplianceWeather({ vencidos: 0, porVencer: 0, noRegistrado: 0, enTramite: 0, total: 0 })
    expect(res.state).toBe('warn')
    expect(res.chipLabel).toBe('Configuración')
    expect(res.headline).toContain('Registra tu primer permiso')
  })
})
