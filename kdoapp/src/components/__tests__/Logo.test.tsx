import { render } from '@testing-library/react'
import { Logo } from '../Logo'

describe('Logo Component', () => {
  it('renders without crashing', () => {
    const { container } = render(<Logo />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('applies custom size correctly', () => {
    const customSize = 80
    const { container } = render(<Logo size={customSize} />)
    
    // The div should have style with the custom size applied to width and height
    const divElement = container.firstChild as HTMLElement
    expect(divElement.style.width).toBe(`${customSize}px`)
    expect(divElement.style.height).toBe(`${customSize}px`)
  })

  it('applies custom className correctly', () => {
    const { container } = render(<Logo className="mt-5 custom-logo" />)
    
    const divElement = container.firstChild as HTMLElement
    expect(divElement).toHaveClass('custom-logo')
    expect(divElement).toHaveClass('mt-5')
  })
})
