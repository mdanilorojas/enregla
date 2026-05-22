import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import { MoreSheet } from '@/components/layout/MoreSheet'

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    profile: { full_name: 'Ada Lovelace', role: 'admin' },
    signOut: vi.fn(),
  }),
}))

describe('MoreSheet', () => {
  it('renders overflow nav items when open', () => {
    render(<MoreSheet open={true} onOpenChange={() => {}} />, { wrapper: MemoryRouter })
    expect(screen.getByRole('link', { name: /mapa interactivo/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /marco legal/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /configuración/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cerrar sesión/i })).toBeInTheDocument()
  })

  it('does not render content when closed', () => {
    render(<MoreSheet open={false} onOpenChange={() => {}} />, { wrapper: MemoryRouter })
    expect(screen.queryByRole('link', { name: /mapa interactivo/i })).not.toBeInTheDocument()
  })

  it('closes when a link is clicked', () => {
    const onChange = vi.fn()
    render(<MoreSheet open={true} onOpenChange={onChange} />, { wrapper: MemoryRouter })
    fireEvent.click(screen.getByRole('link', { name: /marco legal/i }))
    expect(onChange).toHaveBeenCalledWith(false)
  })
})
