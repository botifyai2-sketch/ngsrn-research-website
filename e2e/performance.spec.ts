import { test, expect } from '@playwright/test'

test.describe('Performance Tests', () => {
  test('homepage loads within performance budget', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/', { waitUntil: 'networkidle' })
    
    const loadTime = Date.now() - startTime
    
    // Page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000)
  })

  test('search page loads quickly', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/search', { waitUntil: 'networkidle' })
    
    const loadTime = Date.now() - startTime
    
    // Search page should load within 2 seconds
    expect(loadTime).toBeLessThan(2000)
  })

  test('images are optimized and load efficiently', async ({ page }) => {
    await page.goto('/')
    
    // Wait for images to load
    await page.waitForLoadState('networkidle')
    
    // Check that images have proper loading attributes
    const images = page.locator('img')
    const imageCount = await images.count()
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i)
      
      // Check for lazy loading or eager loading attributes
      const loading = await img.getAttribute('loading')
      const src = await img.getAttribute('src')
      
      // Images should have loading attribute or be optimized Next.js images
      expect(loading === 'lazy' || loading === 'eager' || src?.includes('_next/image')).toBe(true)
    }
  })

  test('CSS and JavaScript are minified and compressed', async ({ page }) => {
    const responses: any[] = []
    
    page.on('response', response => {
      if (response.url().includes('.css') || response.url().includes('.js')) {
        responses.push(response)
      }
    })
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check that CSS and JS files are compressed
    for (const response of responses) {
      const headers = response.headers()
      
      // Should have compression headers
      expect(
        headers['content-encoding'] === 'gzip' || 
        headers['content-encoding'] === 'br' ||
        headers['content-encoding'] === 'deflate'
      ).toBe(true)
    }
  })

  test('fonts load efficiently', async ({ page }) => {
    const fontResponses: any[] = []
    
    page.on('response', response => {
      if (response.url().includes('.woff') || response.url().includes('.woff2')) {
        fontResponses.push(response)
      }
    })
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check font loading performance
    for (const response of fontResponses) {
      const headers = response.headers()
      
      // Fonts should have proper caching headers
      expect(headers['cache-control']).toBeTruthy()
      
      // Should be compressed
      expect(
        headers['content-encoding'] === 'gzip' || 
        headers['content-encoding'] === 'br'
      ).toBe(true)
    }
  })

  test('API responses are fast', async ({ page }) => {
    const apiResponses: any[] = []
    
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        apiResponses.push({
          url: response.url(),
          status: response.status(),
          timing: response.timing(),
        })
      }
    })
    
    await page.goto('/search')
    
    // Perform a search to trigger API calls
    const searchInput = page.getByPlaceholderText('Search articles, authors, or topics...')
    await searchInput.fill('test')
    await searchInput.press('Enter')
    
    await page.waitForSelector('[data-testid="search-results"]', { timeout: 10000 })
    
    // Check API response times
    for (const response of apiResponses) {
      // API responses should be under 1 second
      expect(response.timing.responseEnd - response.timing.requestStart).toBeLessThan(1000)
      expect(response.status).toBe(200)
    }
  })

  test('page size is within budget', async ({ page }) => {
    const responses: any[] = []
    let totalSize = 0
    
    page.on('response', response => {
      responses.push(response)
    })
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Calculate total page size
    for (const response of responses) {
      const headers = response.headers()
      const contentLength = headers['content-length']
      if (contentLength) {
        totalSize += parseInt(contentLength)
      }
    }
    
    // Total page size should be under 2MB
    expect(totalSize).toBeLessThan(2 * 1024 * 1024)
  })

  test('Core Web Vitals are within thresholds', async ({ page }) => {
    await page.goto('/')
    
    // Measure Core Web Vitals
    const webVitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const vitals: any = {}
        
        // Largest Contentful Paint
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          vitals.lcp = lastEntry.startTime
        }).observe({ entryTypes: ['largest-contentful-paint'] })
        
        // First Input Delay (simulated)
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            if (entry.processingStart && entry.startTime) {
              vitals.fid = entry.processingStart - entry.startTime
            }
          })
        }).observe({ entryTypes: ['first-input'] })
        
        // Cumulative Layout Shift
        let clsValue = 0
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value
            }
          }
          vitals.cls = clsValue
        }).observe({ entryTypes: ['layout-shift'] })
        
        // Wait a bit for measurements
        setTimeout(() => resolve(vitals), 3000)
      })
    })
    
    // Check Core Web Vitals thresholds
    if ((webVitals as any).lcp) {
      expect((webVitals as any).lcp).toBeLessThan(2500) // LCP should be under 2.5s
    }
    
    if ((webVitals as any).fid) {
      expect((webVitals as any).fid).toBeLessThan(100) // FID should be under 100ms
    }
    
    if ((webVitals as any).cls) {
      expect((webVitals as any).cls).toBeLessThan(0.1) // CLS should be under 0.1
    }
  })

  test('search performance is acceptable', async ({ page }) => {
    await page.goto('/search')
    
    const searchInput = page.getByPlaceholderText('Search articles, authors, or topics...')
    
    // Measure search response time
    const startTime = Date.now()
    
    await searchInput.fill('sustainability')
    await searchInput.press('Enter')
    
    await page.waitForSelector('[data-testid="search-results"]', { timeout: 10000 })
    
    const searchTime = Date.now() - startTime
    
    // Search should complete within 5 seconds
    expect(searchTime).toBeLessThan(5000)
  })

  test('mobile performance is maintained', async ({ page }) => {
    // Simulate mobile device
    await page.setViewportSize({ width: 375, height: 667 })
    
    const startTime = Date.now()
    
    await page.goto('/', { waitUntil: 'networkidle' })
    
    const loadTime = Date.now() - startTime
    
    // Mobile should load within 4 seconds (slightly higher threshold)
    expect(loadTime).toBeLessThan(4000)
  })

  test('caching headers are properly set', async ({ page }) => {
    const responses: any[] = []
    
    page.on('response', response => {
      responses.push(response)
    })
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check caching headers for static assets
    const staticAssets = responses.filter(response => 
      response.url().includes('/_next/static/') ||
      response.url().includes('.css') ||
      response.url().includes('.js') ||
      response.url().includes('.woff')
    )
    
    for (const response of staticAssets) {
      const headers = response.headers()
      
      // Static assets should have long cache times
      expect(headers['cache-control']).toBeTruthy()
      expect(headers['cache-control']).toMatch(/max-age=\d+/)
    }
  })
})