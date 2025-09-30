import { render, screen } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import Footer from '../Footer'

expect.extend(toHaveNoViolations)

describe('Footer Component', () => {
  it('renders copyright notice', () => {
    render(<Footer />)
    
    const currentYear = new Date().getFullYear()
    const copyrightText = screen.getByText(
      `© ${currentYear} NextGen Sustainable Research Network (NGSRN). All rights reserved.`
    )
    expect(copyrightText).toBeInTheDocument()
  })

  it('renders contact information', () => {
    render(<Footer />)
    
    expect(screen.getByText('Contact Us')).toBeInTheDocument()
    expect(screen.getByText('info@ngsrn.org')).toBeInTheDocument()
  })

  it('renders social media links', () => {
    render(<Footer />)
    
    const linkedinLink = screen.getByLabelText('LinkedIn')
    expect(linkedinLink).toBeInTheDocument()
    expect(linkedinLink).toHaveAttribute('href', 'https://linkedin.com/company/ngsrn')
    expect(linkedinLink).toHaveAttribute('target', '_blank')
    expect(linkedinLink).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders legal links', () => {
    render(<Footer />)
    
    expect(screen.getByText('Terms of Use')).toBeInTheDocument()
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument()
    expect(screen.getByText('Usage Guidelines')).toBeInTheDocument()
  })

  it('has proper semantic structure', () => {
    render(<Footer />)
    
    const footer = screen.getByRole('contentinfo')
    expect(footer).toBeInTheDocument()
  })

  it('should not have accessibility violations', async () => {
    const { container } = render(<Footer />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('renders mission statement', () => {
    render(<Footer />)
    
    const missionText = screen.getByText(
      'Advancing policy-focused research to shape sustainable futures for Africa'
    )
    expect(missionText).toBeInTheDocument()
  })

  it('renders research divisions links', () => {
    render(<Footer />)
    
    expect(screen.getByText('Research Divisions')).toBeInTheDocument()
    expect(screen.getByText('Social Sciences & Governance')).toBeInTheDocument()
    expect(screen.getByText('Economics & Development')).toBeInTheDocument()
    expect(screen.getByText('Environment Climate & Sustainability')).toBeInTheDocument()
    expect(screen.getByText('Health & Human Development')).toBeInTheDocument()
    expect(screen.getByText('Policy & Innovation')).toBeInTheDocument()
  })
})