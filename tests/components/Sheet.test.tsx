import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Sheet } from '@/components/ui/sheet'

describe('Sheet', () => {
  it('renders content when open', () => {
    render(<Sheet open={true} onOpenChange={() => {}} side="bottom"><p>hello</p></Sheet>)
    expect(screen.getByText('hello')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<Sheet open={false} onOpenChange={() => {}} side="bottom"><p>hello</p></Sheet>)
    expect(screen.queryByText('hello')).not.toBeInTheDocument()
  })

  it('calls onOpenChange(false) when overlay clicked', () => {
    const onChange = vi.fn()
    render(<Sheet open={true} onOpenChange={onChange} side="bottom"><p>x</p></Sheet>)
    fireEvent.click(screen.getByTestId('sheet-overlay'))
    expect(onChange).toHaveBeenCalledWith(false)
  })

  it('calls onOpenChange(false) on Escape', () => {
    const onChange = vi.fn()
    render(<Sheet open={true} onOpenChange={onChange} side="bottom"><p>x</p></Sheet>)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onChange).toHaveBeenCalledWith(false)
  })

  it('does not call onOpenChange on Escape when closed', () => {
    const onChange = vi.fn()
    render(<Sheet open={false} onOpenChange={onChange} side="bottom"><p>x</p></Sheet>)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onChange).not.toHaveBeenCalled()
  })

  it('moves focus to first focusable on open', () => {
    render(
      <Sheet open={true} onOpenChange={() => {}} side="bottom">
        <button>first</button>
        <button>second</button>
      </Sheet>
    )
    expect(document.activeElement).toBe(screen.getByText('first'))
  })

  it('restores focus on close (unmount)', () => {
    const trigger = document.createElement('button')
    trigger.textContent = 'trigger'
    document.body.appendChild(trigger)
    trigger.focus()

    const { rerender } = render(
      <Sheet open={true} onOpenChange={() => {}} side="bottom">
        <button>inside</button>
      </Sheet>
    )
    expect(document.activeElement).toBe(screen.getByText('inside'))

    rerender(<Sheet open={false} onOpenChange={() => {}} side="bottom"><button>inside</button></Sheet>)
    expect(document.activeElement).toBe(trigger)

    document.body.removeChild(trigger)
  })
})
