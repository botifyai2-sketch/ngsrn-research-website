# Testing Documentation

This document outlines the comprehensive testing strategy for the NGSRN Research Website.

## Overview

The testing suite includes:
- **Unit Tests**: Component and utility function testing
- **Integration Tests**: API routes and database operations
- **End-to-End Tests**: Critical user workflows
- **Accessibility Tests**: WCAG 2.1 AA compliance
- **Performance Tests**: Core Web Vitals and load times

## Test Structure

```
ngsrn-website/
├── src/
│   ├── components/
│   │   └── **/__tests__/          # Component unit tests
│   ├── hooks/
│   │   └── __tests__/             # Hook tests
│   ├── lib/
│   │   └── __tests__/             # Utility function tests
│   └── app/api/
│       └── __tests__/             # API integration tests
├── e2e/                           # End-to-end tests
├── jest.config.js                 # Jest configuration
├── jest.setup.js                  # Test setup and mocks
├── playwright.config.ts           # Playwright configuration
├── lighthouserc.js               # Lighthouse CI configuration
└── scripts/
    ├── test-runner.js             # Test orchestration
    └── setup-test-db.js           # Test database setup
```

## Running Tests

### All Tests
```bash
npm run test:all
```

### Individual Test Suites
```bash
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:e2e          # End-to-end tests only
npm run test:accessibility # Accessibility tests only
npm run test:performance  # Performance tests only
```

### Development
```bash
npm run test:watch        # Watch mode for unit tests
npm run test:coverage     # Coverage report
npm run test:e2e:ui       # Playwright UI mode
```

## Test Categories

### 1. Unit Tests

**Location**: `src/**/__tests__/`
**Framework**: Jest + React Testing Library
**Coverage**: Components, hooks, utilities

**Key Features**:
- Component rendering and behavior
- User interaction simulation
- Accessibility compliance (axe-core)
- Prop validation and edge cases
- Hook state management

**Example**:
```typescript
import { render, screen } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import Header from '../Header'

expect.extend(toHaveNoViolations)

test('should not have accessibility violations', async () => {
  const { container } = render(<Header />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

### 2. Integration Tests

**Location**: `src/app/api/__tests__/`
**Framework**: Jest + node-mocks-http
**Coverage**: API routes, database operations

**Key Features**:
- API endpoint functionality
- Database query validation
- Authentication and authorization
- Error handling
- Request/response validation

**Example**:
```typescript
import { createMocks } from 'node-mocks-http'
import handler from '../search/route'

test('handles search with filters', async () => {
  const { req } = createMocks({
    method: 'GET',
    query: { q: 'policy', divisions: 'social-sciences' },
  })

  const response = await handler.GET(req)
  expect(response.status).toBe(200)
})
```

### 3. End-to-End Tests

**Location**: `e2e/`
**Framework**: Playwright
**Coverage**: User workflows, cross-browser testing

**Key Features**:
- Complete user journeys
- Cross-browser compatibility
- Mobile responsiveness
- Form submissions
- Navigation flows

**Example**:
```typescript
import { test, expect } from '@playwright/test'

test('search functionality works end-to-end', async ({ page }) => {
  await page.goto('/search')
  
  await page.fill('[placeholder*="Search"]', 'sustainability')
  await page.click('button[type="submit"]')
  
  await expect(page.locator('[data-testid="search-results"]')).toBeVisible()
})
```

### 4. Accessibility Tests

**Location**: `e2e/accessibility.spec.ts`
**Framework**: Playwright + axe-core
**Coverage**: WCAG 2.1 AA compliance

**Key Features**:
- Automated accessibility scanning
- Keyboard navigation testing
- Screen reader compatibility
- Color contrast validation
- Focus management

**Standards**:
- WCAG 2.1 Level AA
- Section 508 compliance
- Keyboard accessibility
- Screen reader support

### 5. Performance Tests

**Location**: `e2e/performance.spec.ts` + Lighthouse CI
**Framework**: Playwright + Lighthouse
**Coverage**: Core Web Vitals, load times

**Key Features**:
- Page load performance
- Core Web Vitals (LCP, FID, CLS)
- Resource optimization
- Caching validation
- Mobile performance

**Thresholds**:
- LCP: < 2.5 seconds
- FID: < 100 milliseconds
- CLS: < 0.1
- Page load: < 3 seconds

## Test Configuration

### Jest Configuration
```javascript
// jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
}

module.exports = createJestConfig(customJestConfig)
```

### Playwright Configuration
```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
  ],
})
```

## Mocking Strategy

### API Mocks
```typescript
// jest.setup.js
global.fetch = jest.fn()

// Mock Prisma client
jest.mock('@/lib/db', () => ({
  prisma: {
    article: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}))
```

### Component Mocks
```typescript
// Mock Next.js components
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => <img {...props} />,
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}))
```

## Coverage Requirements

### Minimum Coverage Thresholds
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

### Coverage Reports
```bash
npm run test:coverage
```

Reports are generated in:
- `coverage/lcov-report/index.html` (HTML report)
- `coverage/lcov.info` (LCOV format)

## Continuous Integration

### GitHub Actions Workflow
```yaml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:all
      - run: npm run test:coverage
```

### Pre-commit Hooks
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:unit && npm run lint"
    }
  }
}
```

## Test Data Management

### Test Database
- Separate test database: `ngsrn_test`
- Isolated test data
- Automatic cleanup between tests

### Fixtures
```typescript
// Test data fixtures
export const mockArticle = {
  id: '1',
  title: 'Test Article',
  content: 'Test content',
  authors: [{ name: 'John Doe' }],
}
```

## Debugging Tests

### Jest Debugging
```bash
# Debug specific test
npm run test -- --testNamePattern="specific test"

# Debug with Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Playwright Debugging
```bash
# Run with UI
npm run test:e2e:ui

# Debug mode
npx playwright test --debug

# Headed mode
npx playwright test --headed
```

## Best Practices

### Writing Tests
1. **Arrange, Act, Assert** pattern
2. **Descriptive test names**
3. **Test user behavior, not implementation**
4. **Mock external dependencies**
5. **Clean up after tests**

### Accessibility Testing
1. **Use semantic HTML**
2. **Test keyboard navigation**
3. **Verify ARIA attributes**
4. **Check color contrast**
5. **Test with screen readers**

### Performance Testing
1. **Set realistic thresholds**
2. **Test on various devices**
3. **Monitor Core Web Vitals**
4. **Validate caching strategies**
5. **Test under load**

## Troubleshooting

### Common Issues

**Tests timing out**:
```typescript
// Increase timeout for slow operations
test('slow operation', async () => {
  // ...
}, 10000) // 10 second timeout
```

**Flaky tests**:
```typescript
// Use waitFor for async operations
await waitFor(() => {
  expect(screen.getByText('Loading...')).not.toBeInTheDocument()
})
```

**Memory leaks**:
```typescript
// Clean up after tests
afterEach(() => {
  jest.clearAllMocks()
  cleanup()
})
```

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [axe-core Documentation](https://github.com/dequelabs/axe-core)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)