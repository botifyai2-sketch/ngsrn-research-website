import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Accessibility Tests', () => {
  test('homepage should not have accessibility violations', async ({ page }) => {
    await page.goto('/')
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('research page should not have accessibility violations', async ({ page }) => {
    await page.goto('/research')
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('leadership page should not have accessibility violations', async ({ page }) => {
    await page.goto('/leadership')
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('search page should not have accessibility violations', async ({ page }) => {
    await page.goto('/search')
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('articles page should not have accessibility violations', async ({ page }) => {
    await page.goto('/articles')
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('keyboard navigation works throughout the site', async ({ page }) => {
    await page.goto('/')
    
    // Test Tab navigation
    await page.keyboard.press('Tab')
    
    // Should focus on skip link first
    const skipLink = page.getByText('Skip to main content')
    await expect(skipLink).toBeFocused()
    
    // Continue tabbing through navigation
    await page.keyboard.press('Tab')
    const homeLink = page.getByRole('link', { name: 'Home' })
    await expect(homeLink).toBeFocused()
    
    await page.keyboard.press('Tab')
    const researchLink = page.getByRole('link', { name: 'Research' })
    await expect(researchLink).toBeFocused()
  })

  test('skip link functionality works', async ({ page }) => {
    await page.goto('/')
    
    // Tab to skip link
    await page.keyboard.press('Tab')
    const skipLink = page.getByText('Skip to main content')
    await expect(skipLink).toBeFocused()
    
    // Activate skip link
    await page.keyboard.press('Enter')
    
    // Should focus on main content
    const mainContent = page.getByRole('main')
    await expect(mainContent).toBeFocused()
  })

  test('form labels and ARIA attributes are correct', async ({ page }) => {
    await page.goto('/search')
    
    const searchInput = page.getByPlaceholderText('Search articles, authors, or topics...')
    
    // Check for proper labeling
    await expect(searchInput).toHaveAttribute('aria-label', 'Search input')
    
    // Check search button has proper label
    const searchButton = page.getByRole('button', { name: /search/i })
    await expect(searchButton).toBeVisible()
  })

  test('images have proper alt text', async ({ page }) => {
    await page.goto('/')
    
    const logo = page.getByAltText('NGSRN Logo')
    await expect(logo).toBeVisible()
    
    await page.goto('/leadership')
    
    // Check leadership profile images have alt text
    const profileImages = page.locator('img[alt*="profile"]')
    const count = await profileImages.count()
    
    for (let i = 0; i < count; i++) {
      const img = profileImages.nth(i)
      const altText = await img.getAttribute('alt')
      expect(altText).toBeTruthy()
      expect(altText?.length).toBeGreaterThan(0)
    }
  })

  test('headings have proper hierarchy', async ({ page }) => {
    await page.goto('/')
    
    // Check for h1
    const h1 = page.locator('h1')
    await expect(h1).toBeVisible()
    
    // Check heading hierarchy (no skipped levels)
    const headings = page.locator('h1, h2, h3, h4, h5, h6')
    const headingLevels = await headings.evaluateAll(elements => 
      elements.map(el => parseInt(el.tagName.charAt(1)))
    )
    
    // Verify no heading levels are skipped
    for (let i = 1; i < headingLevels.length; i++) {
      const currentLevel = headingLevels[i]
      const previousLevel = headingLevels[i - 1]
      
      // Current level should not be more than 1 level deeper than previous
      expect(currentLevel - previousLevel).toBeLessThanOrEqual(1)
    }
  })

  test('color contrast meets WCAG standards', async ({ page }) => {
    await page.goto('/')
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include('body')
      .analyze()
    
    // Check specifically for color contrast violations
    const colorContrastViolations = accessibilityScanResults.violations.filter(
      violation => violation.id === 'color-contrast'
    )
    
    expect(colorContrastViolations).toEqual([])
  })

  test('focus indicators are visible', async ({ page }) => {
    await page.goto('/')
    
    // Tab to first focusable element
    await page.keyboard.press('Tab')
    
    // Check that focused element has visible focus indicator
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
    
    // Check focus indicator styling
    const focusStyles = await focusedElement.evaluate(el => {
      const styles = window.getComputedStyle(el)
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
        outlineStyle: styles.outlineStyle,
        outlineColor: styles.outlineColor,
      }
    })
    
    // Should have some form of focus indicator
    const hasFocusIndicator = 
      focusStyles.outline !== 'none' ||
      focusStyles.outlineWidth !== '0px' ||
      focusStyles.outlineStyle !== 'none'
    
    expect(hasFocusIndicator).toBe(true)
  })

  test('screen reader announcements work', async ({ page }) => {
    await page.goto('/search')
    
    // Check for live regions
    const liveRegions = page.locator('[aria-live]')
    const count = await liveRegions.count()
    
    expect(count).toBeGreaterThan(0)
    
    // Perform search to test live region updates
    const searchInput = page.getByPlaceholderText('Search articles, authors, or topics...')
    await searchInput.fill('test')
    await searchInput.press('Enter')
    
    // Wait for search results and check live region is updated
    await page.waitForSelector('[data-testid="search-results"]', { timeout: 10000 })
    
    const searchStatus = page.locator('[aria-live="polite"]')
    await expect(searchStatus).toBeVisible()
  })

  test('mobile accessibility is maintained', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
    
    // Test mobile menu accessibility
    const mobileMenuButton = page.getByRole('button', { name: /toggle menu/i })
    await expect(mobileMenuButton).toBeVisible()
    await expect(mobileMenuButton).toHaveAttribute('aria-expanded', 'false')
    
    await mobileMenuButton.click()
    await expect(mobileMenuButton).toHaveAttribute('aria-expanded', 'true')
  })
})