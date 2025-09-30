import { renderHook, act } from '@testing-library/react'
import { useSearch } from '../useSearch'

// Mock fetch
global.fetch = jest.fn()

describe('useSearch Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(fetch as jest.Mock).mockClear()
  })

  it('initializes with default values', () => {
    const { result } = renderHook(() => useSearch())
    
    expect(result.current.query).toBe('')
    expect(result.current.results).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe(null)
    expect(result.current.filters).toEqual({
      divisions: [],
      dateRange: { start: null, end: null },
      authors: [],
      tags: [],
    })
  })

  it('updates query correctly', () => {
    const { result } = renderHook(() => useSearch())
    
    act(() => {
      result.current.setQuery('test query')
    })
    
    expect(result.current.query).toBe('test query')
  })

  it('updates filters correctly', () => {
    const { result } = renderHook(() => useSearch())
    
    const newFilters = {
      divisions: ['social-sciences'],
      dateRange: { start: new Date('2024-01-01'), end: new Date('2024-12-31') },
      authors: ['john-doe'],
      tags: ['policy'],
    }
    
    act(() => {
      result.current.setFilters(newFilters)
    })
    
    expect(result.current.filters).toEqual(newFilters)
  })

  it('performs search successfully', async () => {
    const mockResults = [
      {
        id: '1',
        title: 'Test Article',
        summary: 'Test summary',
        authors: [{ name: 'John Doe' }],
        division: { name: 'Social Sciences' },
        publishedAt: new Date(),
        relevanceScore: 0.95,
      },
    ]
    
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: mockResults }),
    })
    
    const { result } = renderHook(() => useSearch())
    
    await act(async () => {
      await result.current.search('test query')
    })
    
    expect(result.current.results).toEqual(mockResults)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe(null)
    expect(fetch).toHaveBeenCalledWith('/api/search?q=test%20query&limit=20&offset=0')
  })

  it('handles search with filters', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [] }),
    })
    
    const { result } = renderHook(() => useSearch())
    
    act(() => {
      result.current.setFilters({
        divisions: ['social-sciences'],
        dateRange: { start: null, end: null },
        authors: ['john-doe'],
        tags: [],
      })
    })
    
    await act(async () => {
      await result.current.search('policy')
    })
    
    expect(fetch).toHaveBeenCalledWith(
      '/api/search?q=policy&limit=20&offset=0&divisions=social-sciences&authors=john-doe'
    )
  })

  it('handles search errors', async () => {
    ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))
    
    const { result } = renderHook(() => useSearch())
    
    await act(async () => {
      await result.current.search('test query')
    })
    
    expect(result.current.error).toBe('Search failed. Please try again.')
    expect(result.current.isLoading).toBe(false)
    expect(result.current.results).toEqual([])
  })

  it('handles API error responses', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Server error' }),
    })
    
    const { result } = renderHook(() => useSearch())
    
    await act(async () => {
      await result.current.search('test query')
    })
    
    expect(result.current.error).toBe('Search failed. Please try again.')
    expect(result.current.isLoading).toBe(false)
  })

  it('sets loading state during search', async () => {
    let resolvePromise: (value: any) => void
    const searchPromise = new Promise(resolve => {
      resolvePromise = resolve
    })
    
    ;(fetch as jest.Mock).mockReturnValueOnce(searchPromise)
    
    const { result } = renderHook(() => useSearch())
    
    act(() => {
      result.current.search('test query')
    })
    
    expect(result.current.isLoading).toBe(true)
    
    await act(async () => {
      resolvePromise!({
        ok: true,
        json: async () => ({ results: [] }),
      })
      await searchPromise
    })
    
    expect(result.current.isLoading).toBe(false)
  })

  it('clears error on new search', async () => {
    const { result } = renderHook(() => useSearch())
    
    // First search fails
    ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))
    
    await act(async () => {
      await result.current.search('test query')
    })
    
    expect(result.current.error).toBeTruthy()
    
    // Second search succeeds
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [] }),
    })
    
    await act(async () => {
      await result.current.search('new query')
    })
    
    expect(result.current.error).toBe(null)
  })

  it('handles empty search query', async () => {
    const { result } = renderHook(() => useSearch())
    
    await act(async () => {
      await result.current.search('')
    })
    
    expect(result.current.results).toEqual([])
    expect(result.current.error).toBe(null)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('debounces search requests', async () => {
    jest.useFakeTimers()
    
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ results: [] }),
    })
    
    const { result } = renderHook(() => useSearch())
    
    // Make multiple rapid search calls
    act(() => {
      result.current.search('query1')
      result.current.search('query2')
      result.current.search('query3')
    })
    
    // Fast-forward timers
    act(() => {
      jest.runAllTimers()
    })
    
    // Should only make one API call for the last query
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith('/api/search?q=query3&limit=20&offset=0')
    
    jest.useRealTimers()
  })
})