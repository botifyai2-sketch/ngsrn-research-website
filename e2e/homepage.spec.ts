import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('has correct title and meta description', async ({ page }) => {
    await expect(page).toHaveTitle(/NGSRN - NextGen Sustainable Research Network/)
    
    const metaDescription = page.locator('meta[name="description"]')
    await expect(metaDescription).toHaveAttribute('content', /Advancing policy-focused research/)
  })

  test('displays main navigation', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Main navigation' })
    await expect(nav).toBeVisible()
    
    await expect(page.getByRole('link', { name: 'Home' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Research' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Leadership' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Articles' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Search' })).toBeVisible()
  })

  test('displays NGSRN logo', async ({ page }) => {
    const logo = page.getByAltText('NGSRN Logo')
    await expect(logo).toBeVisible()
  })

  test('displays mission statement', async ({ page }) => {
    const missionText = page.getByText('Advancing policy-focused research to shape sustainable futures for Africa')
    await expect(missionText).toBeVisible()
  })

  test('displays research divisions', async ({ page }) => {
    await expect(page.getByText('Social Sciences & Governance')).toBeVisible()
    await expect(page.getByText('Economics & Development')).toBeVisible()
    await expect(page.getByText('Environment Climate & Sustainability')).toBeVisible()
    await expect(page.getByText('Health & Human Development')).toBeVisible()
    await expect(page.getByText('Policy & Innovation')).toBeVisible()
  })

  test('navigation links work correctly', async ({ page }) => {
    await page.getByRole('link', { name: 'Research' }).click()
    await expect(page).toHaveURL('/research')
    
    await page.goBack()
    
    await page.getByRole('link', { name: 'Leadership' }).click()
    await expect(page).toHaveURL('/leadership')
    
    await page.goBack()
    
    await page.getByRole('link', { name: 'Search' }).click()
    await expect(page).toHaveURL('/search')
  })

  test('footer contains copyright and contact information', async ({ page }) => {
    const footer = page.getByRole('contentinfo')
    await expect(footer).toBeVisible()
    
    const currentYear = new Date().getFullYear()
    await expect(footer.getByText(`© ${currentYear} NextGen Sustainable Research Network (NGSRN). All rights reserved.`)).toBeVisible()
    
    await expect(footer.getByText('info@ngsrn.org')).toBeVisible()
  })

  test('social media links are present', async ({ page }) => {
    const linkedinLink = page.getByRole('link', { name: 'LinkedIn' })
    await expect(linkedinLink).toBeVisible()
    await expect(linkedinLink).toHaveAttribute('href', 'https://linkedin.com/company/ngsrn')
    await expect(linkedinLink).toHaveAttribute('target', '_blank')
  })

  test('responsive design works on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Check mobile menu button is visible
    const mobileMenuButton = page.getByRole('button', { name: /toggle menu/i })
    await expect(mobileMenuButton).toBeVisible()
    
    // Click mobile menu
    await mobileMenuButton.click()
    
    // Check navigation items are visible in mobile menu
    await expect(page.getByRole('link', { name: 'Home' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Research' })).toBeVisible()
  })

  test('page loads within performance budget', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime
    
    // Page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000)
  })
})