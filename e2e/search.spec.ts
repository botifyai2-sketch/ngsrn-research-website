import { test, expect } from '@playwright/test'

test.describe('Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/search')
  })

  test('displays search interface', async ({ page }) => {
    await expect(page.getByPlaceholderText('Search articles, authors, or topics...')).toBeVisible()
    await expect(page.getByRole('button', { name: /search/i })).toBeVisible()
  })

  test('performs basic search', async ({ page }) => {
    const searchInput = page.getByPlaceholderText('Search articles, authors, or topics...')
    const searchButton = page.getByRole('button', { name: /search/i })
    
    await searchInput.fill('sustainability')
    await searchButton.click()
    
    // Wait for search results
    await page.waitForSelector('[data-testid="search-results"]', { timeout: 10000 })
    
    // Check if results are displayed
    const results = page.locator('[data-testid="search-result-item"]')
    await expect(results.first()).toBeVisible()
  })

  test('search with Enter key', async ({ page }) => {
    const searchInput = page.getByPlaceholderText('Search articles, authors, or topics...')
    
    await searchInput.fill('policy')
    await searchInput.press('Enter')
    
    await page.waitForSelector('[data-testid="search-results"]', { timeout: 10000 })
    
    const results = page.locator('[data-testid="search-result-item"]')
    await expect(results.first()).toBeVisible()
  })

  test('displays loading state during search', async ({ page }) => {
    const searchInput = page.getByPlaceholderText('Search articles, authors, or topics...')
    
    await searchInput.fill('governance')
    await searchInput.press('Enter')
    
    // Check for loading indicator
    await expect(page.getByText('Searching...')).toBeVisible()
  })

  test('filters work correctly', async ({ page }) => {
    // Open filters
    const filtersButton = page.getByRole('button', { name: /filters/i })
    await filtersButton.click()
    
    // Check filter options are visible
    await expect(page.getByText('Research Divisions')).toBeVisible()
    await expect(page.getByText('Date Range')).toBeVisible()
    await expect(page.getByText('Authors')).toBeVisible()
    
    // Select a division filter
    await page.getByLabel('Social Sciences & Governance').check()
    
    // Apply filters and search
    const searchInput = page.getByPlaceholderText('Search articles, authors, or topics...')
    await searchInput.fill('policy')
    await searchInput.press('Enter')
    
    await page.waitForSelector('[data-testid="search-results"]', { timeout: 10000 })
    
    // Verify filtered results
    const results = page.locator('[data-testid="search-result-item"]')
    await expect(results.first()).toBeVisible()
  })

  test('handles empty search results', async ({ page }) => {
    const searchInput = page.getByPlaceholderText('Search articles, authors, or topics...')
    
    await searchInput.fill('nonexistentterm12345')
    await searchInput.press('Enter')
    
    await page.waitForSelector('[data-testid="search-results"]', { timeout: 10000 })
    
    await expect(page.getByText('No results found')).toBeVisible()
    await expect(page.getByText('Try different keywords or adjust your filters')).toBeVisible()
  })

  test('search suggestions work', async ({ page }) => {
    const searchInput = page.getByPlaceholderText('Search articles, authors, or topics...')
    
    await searchInput.fill('sust')
    
    // Wait for suggestions to appear
    await page.waitForSelector('[data-testid="search-suggestions"]', { timeout: 5000 })
    
    const suggestions = page.locator('[data-testid="search-suggestion"]')
    await expect(suggestions.first()).toBeVisible()
    
    // Click on a suggestion
    await suggestions.first().click()
    
    // Verify search was performed
    await page.waitForSelector('[data-testid="search-results"]', { timeout: 10000 })
  })

  test('search results display correct information', async ({ page }) => {
    const searchInput = page.getByPlaceholderText('Search articles, authors, or topics...')
    
    await searchInput.fill('research')
    await searchInput.press('Enter')
    
    await page.waitForSelector('[data-testid="search-results"]', { timeout: 10000 })
    
    const firstResult = page.locator('[data-testid="search-result-item"]').first()
    
    // Check result contains required elements
    await expect(firstResult.locator('[data-testid="article-title"]')).toBeVisible()
    await expect(firstResult.locator('[data-testid="article-summary"]')).toBeVisible()
    await expect(firstResult.locator('[data-testid="article-authors"]')).toBeVisible()
    await expect(firstResult.locator('[data-testid="article-division"]')).toBeVisible()
    await expect(firstResult.locator('[data-testid="article-date"]')).toBeVisible()
  })

  test('search results are clickable', async ({ page }) => {
    const searchInput = page.getByPlaceholderText('Search articles, authors, or topics...')
    
    await searchInput.fill('policy')
    await searchInput.press('Enter')
    
    await page.waitForSelector('[data-testid="search-results"]', { timeout: 10000 })
    
    const firstResult = page.locator('[data-testid="search-result-item"]').first()
    const titleLink = firstResult.locator('[data-testid="article-title"] a')
    
    await expect(titleLink).toBeVisible()
    
    // Click on the result
    await titleLink.click()
    
    // Should navigate to article page
    await expect(page).toHaveURL(/\/articles\//)
  })

  test('keyboard navigation works', async ({ page }) => {
    const searchInput = page.getByPlaceholderText('Search articles, authors, or topics...')
    
    // Tab to search input
    await page.keyboard.press('Tab')
    await expect(searchInput).toBeFocused()
    
    // Tab to search button
    await page.keyboard.press('Tab')
    const searchButton = page.getByRole('button', { name: /search/i })
    await expect(searchButton).toBeFocused()
    
    // Tab to filters button
    await page.keyboard.press('Tab')
    const filtersButton = page.getByRole('button', { name: /filters/i })
    await expect(filtersButton).toBeFocused()
  })

  test('search works on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    
    const searchInput = page.getByPlaceholderText('Search articles, authors, or topics...')
    await expect(searchInput).toBeVisible()
    
    await searchInput.fill('mobile test')
    await searchInput.press('Enter')
    
    await page.waitForSelector('[data-testid="search-results"]', { timeout: 10000 })
    
    const results = page.locator('[data-testid="search-result-item"]')
    await expect(results.first()).toBeVisible()
  })
})