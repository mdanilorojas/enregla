import { describe, it, expect } from 'vitest'
import { qualifyPartner, qualificationLabel } from '@/types/crm'

describe('qualifyPartner', () => {
  it('returns priority for score >= 35', () => {
    expect(qualifyPartner(40)).toBe('priority')
    expect(qualifyPartner(35)).toBe('priority')
  })

  it('returns good for score 28-34', () => {
    expect(qualifyPartner(34)).toBe('good')
    expect(qualifyPartner(28)).toBe('good')
  })

  it('returns nurture for score 20-27', () => {
    expect(qualifyPartner(27)).toBe('nurture')
    expect(qualifyPartner(20)).toBe('nurture')
  })

  it('returns ignore for score < 20', () => {
    expect(qualifyPartner(19)).toBe('ignore')
    expect(qualifyPartner(0)).toBe('ignore')
  })
})

describe('qualificationLabel', () => {
  it('maps qualification to Spanish label', () => {
    expect(qualificationLabel('priority')).toBe('Priority Partner')
    expect(qualificationLabel('good')).toBe('Good Partner')
    expect(qualificationLabel('nurture')).toBe('Nurture')
    expect(qualificationLabel('ignore')).toBe('Ignore for now')
  })
})
