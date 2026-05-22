import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'

const wrapper = (path: string) => ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>
)

describe('MobileBottomNav', () => {
  it('renders 5 tab items', () => {
    render(<MobileBottomNav onMoreClick={() => {}} />, { wrapper: wrapper('/') })
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /sedes/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /permisos/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /renovaciones/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /más/i })).toBeInTheDocument()
  })

  it('marks current route with aria-current', () => {
    render(<MobileBottomNav onMoreClick={() => {}} />, { wrapper: wrapper('/permisos') })
    const link = screen.getByRole('link', { name: /permisos/i })
    expect(link).toHaveAttribute('aria-current', 'page')
  })

  it('calls onMoreClick when more button clicked', () => {
    const onMore = vi.fn()
    render(<MobileBottomNav onMoreClick={onMore} />, { wrapper: wrapper('/') })
    screen.getByRole('button', { name: /más/i }).click()
    expect(onMore).toHaveBeenCalled()
  })
})
