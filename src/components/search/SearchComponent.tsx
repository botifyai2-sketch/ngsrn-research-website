/**
 * Advanced Search Component
 * 
 * This component provides a comprehensive search interface with:
 * - Query input with autocomplete suggestions
 * - Advanced filtering by research division, date, and author
 * - Keyword highlighting in search results
 * - Search suggestions and alternative term recommendations
 * - AI-powered search summaries
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { SearchFilters } from '@/types';
import useSearch from '@/hooks/useSearch';

interface SearchComponentProps {
  onSearch?: (query: string, filters: SearchFilters) => void;
  initialQuery?: string;
  showAISummary?: boolean;
}

interface FilterOptions {
  divisions: Array<{ id: string; name: string; color: string; articleCount: number }>;
  authors: Array<{ id: string; name: string; title: string; isLeadership: boolean; articleCount: number }>;
  tags: Array<{ name: string; count: number }>;
}

export default function SearchComponent({ 
  onSearch, 
  initialQuery = '', 
  showAISummary = true 
}: SearchComponentProps) {
  const { results, isLoading, error, search } = useSearch();
  
  const [query, setQuery] = useState(initialQuery);
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

  // Load initial data
  useEffect(() => {
    loadFilterOptions();
    loadPopularTerms();
  }, []);

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
    
    // Call external onSearch callback if provided
    if (onSearch) {
      onSearch(queryToSearch, activeFilters);
    }
  }, [query, activeFilters, search, onSearch]);

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
    <div className="w-full">
      {/* Search Input */}
      <div className="relative mb-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <label htmlFor="search-input" className="sr-only">
              Search for research topics, authors, or keywords
            </label>
            <input
              id="search-input"
              type="search"
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
              aria-describedby={suggestions.length > 0 ? "search-suggestions" : undefined}
              aria-expanded={showSuggestions}
              aria-autocomplete="list"
              role="combobox"
            />
            
            {/* Search Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div 
                id="search-suggestions"
                className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-10"
                role="listbox"
                aria-label="Search suggestions"
              >
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setQuery(suggestion);
                      setShowSuggestions(false);
                      handleSearch(suggestion);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 first:rounded-t-lg last:rounded-b-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset min-h-[44px] flex items-center"
                    role="option"
                    aria-selected="false"
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
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-h-[44px]"
            aria-label={isLoading ? 'Searching...' : 'Search articles'}
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

      {/* Filter Toggle */}
      <div className="flex items-center justify-between mb-4">
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
        
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && filterOptions && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
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

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {/* Search Results */}
      {results.length > 0 && (
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
      )}

      {/* No Results */}
      {results.length === 0 && query && !isLoading && !error && (
        <div className="text-center py-12">
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
    </div>
  );
}