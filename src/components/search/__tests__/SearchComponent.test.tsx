import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import SearchComponent from '../SearchComponent'

expect.extend(toHaveNoViolations)

// Mock the search hook
jest.mock('@/hooks/useSearch', () => ({
  useSearch: () => ({
    query: '',
    setQuery: jest.fn(),
    results: [],
    isLoading: false,
    error: null,
    search: jest.fn(),
    filters: {
      divisions: [],
      dateRange: { start: null, end: null },
      authors: [],
      tags: [],
    },
    setFilters: jest.fn(),
  }),
}))

const mockSearchResults = [
  {
    id: '1',
    title: 'Test Article 1',
    summary: 'This is a test article summary',
    authors: [{ id: '1', name: 'John Doe' }],
    division: { id: '1', name: 'Social Sciences & Governance' },
    publishedAt: new Date('2024-01-01'),
    readTime: 5,
    tags: ['policy', 'governance'],
    aiSummary: 'AI generated summary',
    relevanceScore: 0.95,
    highlightedSnippets: ['test snippet'],
  },
]

describe('SearchComponent', () => {
  const user = userEvent.setup()

  it('renders search input field', () => {
    render(<SearchComponent />)
    
    const searchInput = screen.getByPlaceholderText('Search articles, authors, or topics...')
    expect(searchInput).toBeInTheDocument()
  })

  it('renders search button', () => {
    render(<SearchComponent />)
    
    const searchButton = screen.getByRole('button', { name: /search/i })
    expect(searchButton).toBeInTheDocument()
  })

  it('handles search input changes', async () => {
    render(<SearchComponent />)
    
    const searchInput = screen.getByPlaceholderText('Search articles, authors, or topics...')
    
    await user.type(searchInput, 'test query')
    
    expect(searchInput).toHaveValue('test query')
  })

  it('submits search on form submission', async () => {
    const mockSearch = jest.fn()
    
    // Mock the hook with our search function
    jest.doMock('@/hooks/useSearch', () => ({
      useSearch: () => ({
        query: '',
        setQuery: jest.fn(),
        results: [],
        isLoading: false,
        error: null,
        search: mockSearch,
        filters: {
          divisions: [],
          dateRange: { start: null, end: null },
          authors: [],
          tags: [],
        },
        setFilters: jest.fn(),
      }),
    }))
    
    render(<SearchComponent />)
    
    const searchInput = screen.getByPlaceholderText('Search articles, authors, or topics...')
    const searchButton = screen.getByRole('button', { name: /search/i })
    
    await user.type(searchInput, 'test query')
    await user.click(searchButton)
    
    expect(mockSearch).toHaveBeenCalledWith('test query')
  })

  it('displays loading state', () => {
    // Mock loading state
    jest.doMock('@/hooks/useSearch', () => ({
      useSearch: () => ({
        query: 'test',
        setQuery: jest.fn(),
        results: [],
        isLoading: true,
        error: null,
        search: jest.fn(),
        filters: {
          divisions: [],
          dateRange: { start: null, end: null },
          authors: [],
          tags: [],
        },
        setFilters: jest.fn(),
      }),
    }))
    
    render(<SearchComponent />)
    
    expect(screen.getByText('Searching...')).toBeInTheDocument()
  })

  it('displays search results', () => {
    // Mock results state
    jest.doMock('@/hooks/useSearch', () => ({
      useSearch: () => ({
        query: 'test',
        setQuery: jest.fn(),
        results: mockSearchResults,
        isLoading: false,
        error: null,
        search: jest.fn(),
        filters: {
          divisions: [],
          dateRange: { start: null, end: null },
          authors: [],
          tags: [],
        },
        setFilters: jest.fn(),
      }),
    }))
    
    render(<SearchComponent />)
    
    expect(screen.getByText('Test Article 1')).toBeInTheDocument()
    expect(screen.getByText('This is a test article summary')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('displays error state', () => {
    // Mock error state
    jest.doMock('@/hooks/useSearch', () => ({
      useSearch: () => ({
        query: 'test',
        setQuery: jest.fn(),
        results: [],
        isLoading: false,
        error: 'Search failed',
        search: jest.fn(),
        filters: {
          divisions: [],
          dateRange: { start: null, end: null },
          authors: [],
          tags: [],
        },
        setFilters: jest.fn(),
      }),
    }))
    
    render(<SearchComponent />)
    
    expect(screen.getByText('Search failed')).toBeInTheDocument()
  })

  it('renders filter options', () => {
    render(<SearchComponent />)
    
    const filtersButton = screen.getByRole('button', { name: /filters/i })
    expect(filtersButton).toBeInTheDocument()
    
    fireEvent.click(filtersButton)
    
    expect(screen.getByText('Research Divisions')).toBeInTheDocument()
    expect(screen.getByText('Date Range')).toBeInTheDocument()
    expect(screen.getByText('Authors')).toBeInTheDocument()
  })

  it('should not have accessibility violations', async () => {
    const { container } = render(<SearchComponent />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('supports keyboard navigation', async () => {
    render(<SearchComponent />)
    
    const searchInput = screen.getByPlaceholderText('Search articles, authors, or topics...')
    
    await user.tab()
    expect(searchInput).toHaveFocus()
    
    await user.tab()
    const searchButton = screen.getByRole('button', { name: /search/i })
    expect(searchButton).toHaveFocus()
  })

  it('handles Enter key submission', async () => {
    const mockSearch = jest.fn()
    
    jest.doMock('@/hooks/useSearch', () => ({
      useSearch: () => ({
        query: '',
        setQuery: jest.fn(),
        results: [],
        isLoading: false,
        error: null,
        search: mockSearch,
        filters: {
          divisions: [],
          dateRange: { start: null, end: null },
          authors: [],
          tags: [],
        },
        setFilters: jest.fn(),
      }),
    }))
    
    render(<SearchComponent />)
    
    const searchInput = screen.getByPlaceholderText('Search articles, authors, or topics...')
    
    await user.type(searchInput, 'test query')
    await user.keyboard('{Enter}')
    
    expect(mockSearch).toHaveBeenCalledWith('test query')
  })
})