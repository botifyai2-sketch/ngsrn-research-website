'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SearchFilters } from '@/types';
import useSearch from '@/hooks/useSearch';

interface FilterOptions {
  divisions: Array<{ id: string; name: string; color: string; articleCount: number }>;
  authors: Array<{ id: string; name: string; title: string; isLeadership: boolean; articleCount: number }>;
  tags: Array<{ name: string; count: number }>;
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const { results, isLoading, error, search } = useSearch();
  
  const [query, setQuery] = useState(searchParams?.get('q') || '');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [popularTerms, setPopularTerms] = useState<string[]>([]);
  const [activeFilters, setActiveFilters] = useState<SearchFilters>({
    divisions: [],
    authors: [],
    tags: [],
    dateRange: {
      start: new Date('2020-01-01'),
      end: new Date(),
    },
  });
  const [showFilters, setShowFilters] = useState(false);
  const [aiSummary, setAiSummary] = useState<{
    summary: string;
    keyPoints?: string[];
    relevanceExplanation?: string;
    confidence?: number;
    cached?: boolean;
  } | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [showAISummary, setShowAISummary] = useState(true);

  // Load initial data
  useEffect(() => {
    loadFilterOptions();
    loadPopularTerms();
    
    // If there's a query parameter, perform search
    const initialQuery = searchParams?.get('q');
    if (initialQuery) {
      setQuery(initialQuery);
      search(initialQuery, activeFilters);
    }
  }, [searchParams, search, activeFilters]);

  const loadFilterOptions = async () => {
    try {
      const response = await fetch('/api/search/filters');
      const data = await response.json();
      if (data.success) {
        setFilterOptions(data.filters);
      }
    } catch (error) {
      console.error('Failed to load filter options:', error);
    }
  };

  const loadPopularTerms = async () => {
    try {
      const response = await fetch('/api/search/popular?limit=8');
      const data = await response.json();
      if (data.success) {
        setPopularTerms(data.popularTerms);
      }
    } catch (error) {
      console.error('Failed to load popular terms:', error);
    }
  };

  const handleSearch = useCallback(async (searchQuery?: string) => {
    const queryToSearch = searchQuery || query;
    if (!queryToSearch.trim()) return;

    await search(queryToSearch, activeFilters);
    setShowSuggestions(false);
    
    // Generate AI summary if enabled
    if (showAISummary) {
      generateAISummary(queryToSearch);
    }
  }, [query, activeFilters, search, showAISummary]);

  const generateAISummary = async (searchQuery: string) => {
    setIsLoadingAI(true);
    setAiSummary(null);
    
    try {
      const response = await fetch(`/api/search/ai-summary?q=${encodeURIComponent(searchQuery)}&limit=5`);
      const data = await response.json();
      
      if (data.success) {
        setAiSummary(data.aiSummary);
      }
    } catch (error) {
      console.error('Failed to generate AI summary:', error);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleSuggestions = async (value: string) => {
    if (value.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(value)}&limit=5`);
      const data = await response.json();
      if (data.success) {
        setSuggestions(data.suggestions);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Failed to get suggestions:', error);
    }
  };

  const handleFilterChange = (filterType: keyof SearchFilters, value: any) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const clearAllFilters = () => {
    setActiveFilters({
      divisions: [],
      authors: [],
      tags: [],
      dateRange: {
        start: new Date('2020-01-01'),
        end: new Date(),
      },
    });
  };

  const hasActiveFilters = activeFilters.divisions.length > 0 || 
                          activeFilters.authors.length > 0 || 
                          activeFilters.tags.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Search Research Articles</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover insights from NGSRN&apos;s comprehensive research database using our AI-powered search
          </p>
        </div>

        {/* Search Interface */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {/* Search Input */}
            <div className="relative mb-4">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      handleSuggestions(e.target.value);
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="Search for research topics, authors, or keywords..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  />
                  
                  {/* Search Suggestions */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-10">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setQuery(suggestion);
                            setShowSuggestions(false);
                            handleSearch(suggestion);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 first:rounded-t-lg last:rounded-b-lg"
                        >
                          <span className="text-gray-700">{suggestion}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => handleSearch()}
                  disabled={isLoading || !query.trim()}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isLoading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>

            {/* Popular Terms */}
            {popularTerms.length > 0 && !query && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Popular searches:</p>
                <div className="flex flex-wrap gap-2">
                  {popularTerms.map((term, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setQuery(term);
                        handleSearch(term);
                      }}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Filter Toggle and AI Summary Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                  </svg>
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                  {hasActiveFilters && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      {activeFilters.divisions.length + activeFilters.authors.length + activeFilters.tags.length}
                    </span>
                  )}
                </button>

                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={showAISummary}
                    onChange={(e) => setShowAISummary(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  AI Summary
                </label>
              </div>
              
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && filterOptions && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-4">
              <div className="grid md:grid-cols-3 gap-6">
                {/* Research Divisions Filter */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Research Divisions</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {filterOptions.divisions.map(division => (
                      <label key={division.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={activeFilters.divisions.includes(division.name)}
                          onChange={(e) => {
                            const newDivisions = e.target.checked
                              ? [...activeFilters.divisions, division.name]
                              : activeFilters.divisions.filter(d => d !== division.name);
                            handleFilterChange('divisions', newDivisions);
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {division.name} ({division.articleCount})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Authors Filter */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Authors</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {filterOptions.authors.slice(0, 10).map(author => (
                      <label key={author.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={activeFilters.authors.includes(author.name)}
                          onChange={(e) => {
                            const newAuthors = e.target.checked
                              ? [...activeFilters.authors, author.name]
                              : activeFilters.authors.filter(a => a !== author.name);
                            handleFilterChange('authors', newAuthors);
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {author.name} {author.isLeadership && '👑'} ({author.articleCount})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Tags Filter */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Tags</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {filterOptions.tags.slice(0, 15).map((tag, index) => (
                      <label key={index} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={activeFilters.tags.includes(tag.name)}
                          onChange={(e) => {
                            const newTags = e.target.checked
                              ? [...activeFilters.tags, tag.name]
                              : activeFilters.tags.filter(t => t !== tag.name);
                            handleFilterChange('tags', newTags);
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {tag.name} ({tag.count})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* AI Summary Section */}
        {query && showAISummary && (aiSummary || isLoadingAI) && (
          <div className="max-w-4xl mx-auto mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-blue-900">AI Research Summary</h3>
                </div>
                <button
                  onClick={() => setShowAISummary(false)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {isLoadingAI && (
                <div className="flex items-center text-blue-600">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating AI summary...
                </div>
              )}

              {aiSummary && !isLoadingAI && (
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-700 leading-relaxed">{aiSummary.summary}</p>
                  </div>

                  {aiSummary.keyPoints && aiSummary.keyPoints.length > 0 && (
                    <div>
                      <h4 className="font-medium text-blue-900 mb-2">Key Research Insights:</h4>
                      <ul className="list-disc list-inside space-y-1 text-gray-700">
                        {aiSummary.keyPoints.map((point: string, index: number) => (
                          <li key={index}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {aiSummary.relevanceExplanation && (
                    <div className="bg-white bg-opacity-50 rounded-lg p-3">
                      <h4 className="font-medium text-blue-900 mb-1">Why these results matter:</h4>
                      <p className="text-gray-700 text-sm">{aiSummary.relevanceExplanation}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-blue-600">
                    <span>
                      {aiSummary.cached ? '🔄 Cached result' : '✨ Fresh AI analysis'} • 
                      Confidence: {Math.round((aiSummary.confidence || 0.7) * 100)}%
                    </span>
                    <button
                      onClick={() => generateAISummary(query)}
                      className="hover:text-blue-800"
                    >
                      Regenerate
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="max-w-4xl mx-auto mb-6">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            </div>
          </div>
        )}

        {/* Search Results */}
        {results.length > 0 && (
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Search Results ({results.length})
              </h2>
              {query && (
                <p className="text-gray-600">
                  Results for &quot;<span className="font-medium">{query}</span>&quot;
                </p>
              )}
            </div>
            
            <div className="space-y-6">
              {results.map((result) => (
                <div key={result.article.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-blue-600 hover:text-blue-700 mb-2">
                        <a href={`/articles/${result.article.slug}`}>
                          {result.article.title}
                        </a>
                      </h3>
                      
                      <div className="flex items-center text-sm text-gray-600 mb-3 space-x-4">
                        <span className="font-medium" style={{ color: result.article.division.color }}>
                          {result.article.division.name}
                        </span>
                        <span>
                          {result.article.authors.map(a => a.author.name).join(', ')}
                        </span>
                        {result.article.publishedAt && (
                          <span>{new Date(result.article.publishedAt).toLocaleDateString()}</span>
                        )}
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          Relevance: {(result.relevanceScore * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-4 leading-relaxed">{result.article.summary}</p>

                  {result.highlightedSnippets.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-600 mb-2">Relevant excerpts:</h4>
                      <div className="space-y-2">
                        {result.highlightedSnippets.map((snippet, snippetIndex) => (
                          <div
                            key={snippetIndex}
                            className="text-sm text-gray-600 bg-yellow-50 border-l-4 border-yellow-200 p-3 rounded-r"
                            dangerouslySetInnerHTML={{ __html: snippet }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      {JSON.parse(result.article.tags || '[]').slice(0, 5).map((tag: string, tagIndex: number) => (
                        <span
                          key={tagIndex}
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{result.article.readTime} min read</span>
                      <a
                        href={`/articles/${result.article.slug}`}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Read Article →
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {results.length === 0 && query && !isLoading && !error && (
          <div className="max-w-4xl mx-auto text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600 mb-6">
              We couldn&apos;t find any articles matching &quot;<span className="font-medium">{query}</span>&quot;
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <p>Try:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Using different keywords</li>
                <li>Checking your spelling</li>
                <li>Using more general terms</li>
                <li>Removing some filters</li>
              </ul>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!query && results.length === 0 && !isLoading && (
          <div className="max-w-4xl mx-auto text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Start your research journey</h3>
            <p className="text-gray-600">
              Enter a search term above to discover relevant research articles from NGSRN&apos;s database
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading search...</p>
        </div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}