import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ComplianceWeatherCard } from '@/components/ui/ComplianceWeatherCard'

describe('ComplianceWeatherCard', () => {
  it('renders the weather card content correctly', () => {
    render(
      <ComplianceWeatherCard
        state="sunny"
        chipLabel="Operación Protegida"
        headline="Tu operación se encuentra al día y segura"
        percentage={95}
        permitsDone={19}
        permitsTotal={20}
        locations={3}
      />
    )

    // Verify chip label
    expect(screen.getByText('Operación Protegida')).toBeDefined()

    // Verify headline
    expect(screen.getByText('Tu operación se encuentra al día y segura')).toBeDefined()

    // Verify percentage
    expect(screen.getByText('95')).toBeDefined()

    // Verify metrics
    expect(screen.getByText('19 de 20')).toBeDefined()
    expect(screen.getByText('3')).toBeDefined()
  })
})
