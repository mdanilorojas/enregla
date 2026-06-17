import { describe, it, expect } from 'vitest'
import {
  evaluateRequirements,
  matchCondition,
  requirementApplies,
  countRequirements,
} from '@/features/evaluacion/engine'
import { clinica } from '@/features/evaluacion/catalog/clinica'
import { getBusinessType } from '@/features/evaluacion/catalog'
import type { InputValues, RequirementDef } from '@/features/evaluacion/types'

const baseline: InputValues = {
  area_m2: 100,
  staff_count: 0,
  health_professionals: 0,
  services: [],
  handles_medications: false,
  generates_biohazard: false,
  sells_food: false,
}

describe('matchCondition', () => {
  it('eq compara igualdad estricta', () => {
    expect(matchCondition({ field: 'sells_food', eq: true }, { sells_food: true })).toBe(true)
    expect(matchCondition({ field: 'sells_food', eq: true }, { sells_food: false })).toBe(false)
  })
  it('gt y gte sobre números', () => {
    expect(matchCondition({ field: 'staff_count', gt: 0 }, { staff_count: 1 })).toBe(true)
    expect(matchCondition({ field: 'staff_count', gt: 0 }, { staff_count: 0 })).toBe(false)
    expect(matchCondition({ field: 'staff_count', gte: 10 }, { staff_count: 10 })).toBe(true)
    expect(matchCondition({ field: 'staff_count', gte: 10 }, { staff_count: 9 })).toBe(false)
  })
  it('includes sobre arrays multiselect', () => {
    expect(matchCondition({ field: 'services', includes: 'laboratorio' }, { services: ['laboratorio'] })).toBe(true)
    expect(matchCondition({ field: 'services', includes: 'laboratorio' }, { services: [] })).toBe(false)
  })
  it('gt sobre valor no numérico es false', () => {
    expect(matchCondition({ field: 'staff_count', gt: 0 }, {})).toBe(false)
  })
})

describe('requirementApplies', () => {
  const conditional: RequirementDef = {
    code: 'x', area: 'sectorial', name: 'X', authority: 'A', description: '',
    mandatory: true, renewal: 'anual',
    appliesWhen: [{ field: 'handles_medications', eq: true }],
  }
  it('sin condiciones aplica siempre', () => {
    const r: RequirementDef = { ...conditional, appliesWhen: undefined }
    expect(requirementApplies(r, baseline)).toBe(true)
  })
  it('con condición evalúa el driver', () => {
    expect(requirementApplies(conditional, baseline)).toBe(false)
    expect(requirementApplies(conditional, { ...baseline, handles_medications: true })).toBe(true)
  })
})

describe('evaluateRequirements (clínica)', () => {
  it('baseline: funcionamiento + SRI, sin condicionales', () => {
    const res = evaluateRequirements(clinica, baseline)
    const codes = res.flatMap((g) => g.items.map((i) => i.code))
    // Funcionamiento siempre
    expect(codes).toContain('uso_suelo')
    expect(codes).toContain('luae_patente')
    expect(codes).toContain('bomberos')
    expect(codes).toContain('acess_pf')
    // SRI siempre
    expect(codes).toContain('ruc')
    expect(codes).toContain('facturacion_electronica')
    // Condicionales NO presentes
    expect(codes).not.toContain('arcsa_bpm')
    expect(codes).not.toContain('desechos_biopeligrosos')
    expect(codes).not.toContain('iess_afiliacion')
  })

  it('enciende ARCSA al manejar medicamentos', () => {
    const res = evaluateRequirements(clinica, { ...baseline, handles_medications: true })
    expect(res.flatMap((g) => g.items.map((i) => i.code))).toContain('arcsa_bpm')
  })

  it('enciende desechos + licencia ambiental al generar biopeligrosos', () => {
    const codes = evaluateRequirements(clinica, { ...baseline, generates_biohazard: true })
      .flatMap((g) => g.items.map((i) => i.code))
    expect(codes).toContain('desechos_biopeligrosos')
    expect(codes).toContain('licencia_ambiental')
  })

  it('personal>0 enciende IESS y riesgos; <10 NO enciende reglamento SST', () => {
    const codes = evaluateRequirements(clinica, { ...baseline, staff_count: 5 })
      .flatMap((g) => g.items.map((i) => i.code))
    expect(codes).toContain('iess_afiliacion')
    expect(codes).toContain('riesgos_trabajo')
    expect(codes).not.toContain('reglamento_sst')
  })

  it('personal>=10 enciende reglamento SST', () => {
    const codes = evaluateRequirements(clinica, { ...baseline, staff_count: 12 })
      .flatMap((g) => g.items.map((i) => i.code))
    expect(codes).toContain('reglamento_sst')
  })

  it('agrupa por área en orden fijo y filtra grupos vacíos', () => {
    const res = evaluateRequirements(clinica, baseline)
    const areas = res.map((g) => g.area)
    // sectorial y laboral_iess vacíos en baseline → no aparecen
    expect(areas).toEqual(['funcionamiento', 'sri'])
  })

  it('escenario completo cuenta todos los requisitos', () => {
    const res = evaluateRequirements(clinica, {
      area_m2: 300,
      staff_count: 15,
      health_professionals: 6,
      services: ['consulta_externa', 'laboratorio', 'farmacia_interna'],
      handles_medications: true,
      generates_biohazard: true,
      sells_food: true,
    })
    expect(countRequirements(res)).toBe(clinica.requirements.length)
  })
})

describe('catalog registry', () => {
  it('getBusinessType resuelve clínica y desconocidos', () => {
    expect(getBusinessType('clinica')?.slug).toBe('clinica')
    expect(getBusinessType('nope')).toBeUndefined()
  })
})
