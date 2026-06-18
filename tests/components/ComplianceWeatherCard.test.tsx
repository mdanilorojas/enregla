import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
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

  it('renders and calls onActionClick when provided', () => {
    const handleAction = vi.fn()
    render(
      <ComplianceWeatherCard
        state="warn"
        chipLabel="Alerta Operativa"
        headline="Tienes permisos próximos a vencer"
        percentage={75}
        permitsDone={15}
        permitsTotal={20}
        locations={3}
        onActionClick={handleAction}
      />
    )

    // Verify action button is rendered
    const button = screen.getByRole('button', { name: /resolver alertas/i })
    expect(button).toBeDefined()

    // Fire click event
    fireEvent.click(button)

    // Verify callback was called
    expect(handleAction).toHaveBeenCalledTimes(1)
  })

  it('renders correct button label for sunny state', () => {
    const handleAction = vi.fn()
    render(
      <ComplianceWeatherCard
        state="sunny"
        chipLabel="Operación Protegida"
        headline="Tu operación está al día"
        percentage={100}
        permitsDone={20}
        permitsTotal={20}
        locations={3}
        onActionClick={handleAction}
      />
    )

    // Verify button label is "Ver permisos"
    const button = screen.getByRole('button', { name: /ver permisos/i })
    expect(button).toBeDefined()
  })
})
