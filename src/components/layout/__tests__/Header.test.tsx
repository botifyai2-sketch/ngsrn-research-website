import { render, screen } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import Header from '../Header'

expect.extend(toHaveNoViolations)

// Mock the Navigation component
jest.mock('../Navigation', () => {
  return function MockNavigation() {
    return <nav data-testid="navigation">Navigation</nav>
  }
})

describe('Header Component', () => {
  it('renders the NGSRN logo', () => {
    render(<Header />)
    
    const logo = screen.getByAltText('NGSRN Logo')
    expect(logo).toBeInTheDocument()
  })

  it('renders the navigation component', () => {
    render(<Header />)
    
    const navigation = screen.getByTestId('navigation')
    expect(navigation).toBeInTheDocument()
  })

  it('has proper semantic structure', () => {
    render(<Header />)
    
    const header = screen.getByRole('banner')
    expect(header).toBeInTheDocument()
  })

  it('should not have accessibility violations', async () => {
    const { container } = render(<Header />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('applies correct styling classes', () => {
    render(<Header />)
    
    const header = screen.getByRole('banner')
    expect(header).toHaveClass('bg-white', 'shadow-sm', 'border-b')
  })

  it('renders with proper ARIA attributes', () => {
    render(<Header />)
    
    const header = screen.getByRole('banner')
    expect(header).toBeInTheDocument()
    
    // Check for proper heading structure
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toBeInTheDocument()
  })
})