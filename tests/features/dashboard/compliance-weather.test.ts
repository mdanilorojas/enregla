import { describe, it, expect } from 'vitest'
import { computeComplianceWeather } from '@/features/dashboard/compliance-weather'

describe('computeComplianceWeather', () => {
  it('debe retornar estado de tormenta (err) si hay permisos vencidos', () => {
    const res = computeComplianceWeather({ vencidos: 1, porVencer: 2, noRegistrado: 0 })
    expect(res.state).toBe('err')
    expect(res.chipLabel).toBe('Riesgo Crítico')
    expect(res.headline).toContain('permisos vencidos')
  })

  it('debe retornar estado de nublado (warn) si no hay vencidos pero hay permisos por vencer o no registrados', () => {
    const res1 = computeComplianceWeather({ vencidos: 0, porVencer: 1, noRegistrado: 0 })
    expect(res1.state).toBe('warn')
    expect(res1.chipLabel).toBe('Alerta Operativa')

    const res2 = computeComplianceWeather({ vencidos: 0, porVencer: 0, noRegistrado: 1 })
    expect(res2.state).toBe('warn')
    expect(res2.chipLabel).toBe('Alerta Operativa')
  })

  it('debe retornar estado soleado (sunny) si no hay vencidos, por vencer ni no registrados', () => {
    const res = computeComplianceWeather({ vencidos: 0, porVencer: 0, noRegistrado: 0 })
    expect(res.state).toBe('sunny')
    expect(res.chipLabel).toBe('Operación Protegida')
    expect(res.headline).toContain('al día y segura')
  })
})
