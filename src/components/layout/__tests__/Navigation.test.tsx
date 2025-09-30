import { render, screen, fireEvent } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import Navigation from '../Navigation'

expect.extend(toHaveNoViolations)

describe('Navigation Component', () => {
  it('renders all main navigation links', () => {
    render(<Navigation />)
    
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Research')).toBeInTheDocument()
    expect(screen.getByText('Leadership')).toBeInTheDocument()
    expect(screen.getByText('Articles')).toBeInTheDocument()
    expect(screen.getByText('Search')).toBeInTheDocument()
  })

  it('has proper semantic navigation structure', () => {
    render(<Navigation />)
    
    const nav = screen.getByRole('navigation')
    expect(nav).toBeInTheDocument()
    expect(nav).toHaveAttribute('aria-label', 'Main navigation')
  })

  it('should not have accessibility violations', async () => {
    const { container } = render(<Navigation />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('handles mobile menu toggle', () => {
    render(<Navigation />)
    
    const mobileMenuButton = screen.getByRole('button', { name: /toggle menu/i })
    expect(mobileMenuButton).toBeInTheDocument()
    
    fireEvent.click(mobileMenuButton)
    
    // Check if mobile menu is expanded
    expect(mobileMenuButton).toHaveAttribute('aria-expanded', 'true')
  })

  it('supports keyboard navigation', () => {
    render(<Navigation />)
    
    const firstLink = screen.getByText('Home')
    firstLink.focus()
    
    expect(firstLink).toHaveFocus()
    
    // Test Tab navigation
    fireEvent.keyDown(firstLink, { key: 'Tab' })
    const secondLink = screen.getByText('Research')
    expect(secondLink).toHaveFocus()
  })

  it('highlights active page', () => {
    // Mock usePathname to return '/research'
    jest.doMock('next/navigation', () => ({
      usePathname: () => '/research',
    }))
    
    render(<Navigation />)
    
    const researchLink = screen.getByText('Research')
    expect(researchLink).toHaveClass('text-primary')
  })

  it('renders research division dropdown', () => {
    render(<Navigation />)
    
    const researchLink = screen.getByText('Research')
    fireEvent.mouseEnter(researchLink)
    
    expect(screen.getByText('Social Sciences & Governance')).toBeInTheDocument()
    expect(screen.getByText('Economics & Development')).toBeInTheDocument()
    expect(screen.getByText('Environment Climate & Sustainability')).toBeInTheDocument()
    expect(screen.getByText('Health & Human Development')).toBeInTheDocument()
    expect(screen.getByText('Policy & Innovation')).toBeInTheDocument()
  })
})