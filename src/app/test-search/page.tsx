'use client';

import { useState, useEffect } from 'react';
import { SearchResult, SearchFilters } from '@/types';

interface FilterOptions {
    divisions: Array<{ id: string; name: string; color: string; articleCount: number }>;
    authors: Array<{ id: string; name: string; title: string; isLeadership: boolean; articleCount: number }>;
    tags: Array<{ name: string; count: number }>;
}

export default function TestSearchPage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [popularTerms, setPopularTerms] = useState<string[]>([]);
    const [searchStats, setSearchStats] = useState<any>(null);

    // Load filter options and initial data
    useEffect(() => {
        loadFilterOptions();
        loadPopularTerms();
        loadSearchStats();
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
            const response = await fetch('/api/search/popular?limit=10');
            const data = await response.json();
            if (data.success) {
                setPopularTerms(data.popularTerms);
            }
        } catch (error) {
            console.error('Failed to load popular terms:', error);
        }
    };

    const loadSearchStats = async () => {
        try {
            const response = await fetch('/api/search/stats');
            const data = await response.json();
            if (data.success) {
                setSearchStats(data.stats);
            }
        } catch (error) {
            console.error('Failed to load search stats:', error);
        }
    };

    const handleSearch = async () => {
        if (!query.trim()) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=10`);
            const data = await response.json();

            if (data.success) {
                setResults(data.results);
            } else {
                setError(data.error || 'Search failed');
            }
        } catch (error) {
            setError('Search request failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuggestions = async (value: string) => {
        if (value.length < 2) {
            setSuggestions([]);
            return;
        }

        try {
            const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(value)}&limit=5`);
            const data = await response.json();
            if (data.success) {
                setSuggestions(data.suggestions);
            }
        } catch (error) {
            console.error('Failed to get suggestions:', error);
        }
    };

    const refreshIndex = async () => {
        try {
            const response = await fetch('/api/search/stats', { method: 'POST' });
            const data = await response.json();
            if (data.success) {
                setSearchStats(data.stats);
                alert('Search index refreshed successfully!');
            }
        } catch (error) {
            alert('Failed to refresh search index');
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Search Infrastructure Test</h1>

            {/* Search Stats */}
            {searchStats && (
                <div className="bg-gray-100 p-4 rounded-lg mb-6">
                    <h2 className="text-xl font-semibold mb-2">Search Index Status</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <strong>Status:</strong> {searchStats.status}
                        </div>
                        <div>
                            <strong>Total Articles:</strong> {searchStats.totalArticles}
                        </div>
                        <div>
                            <strong>Index Size:</strong> {searchStats.indexSize}
                        </div>
                        <div>
                            <strong>Last Update:</strong> {searchStats.lastIndexUpdate ? new Date(searchStats.lastIndexUpdate).toLocaleString() : 'Never'}
                        </div>
                    </div>
                    <button
                        onClick={refreshIndex}
                        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Refresh Index
                    </button>
                </div>
            )}

            {/* Popular Terms */}
            {popularTerms.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-2">Popular Search Terms</h2>
                    <div className="flex flex-wrap gap-2">
                        {popularTerms.map((term, index) => (
                            <button
                                key={index}
                                onClick={() => setQuery(term)}
                                className="px-3 py-1 bg-gray-200 rounded-full text-sm hover:bg-gray-300"
                            >
                                {term}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Search Interface */}
            <div className="mb-6">
                <div className="flex gap-2 mb-2">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            handleSuggestions(e.target.value);
                        }}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Search articles..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={handleSearch}
                        disabled={isLoading || !query.trim()}
                        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                    >
                        {isLoading ? 'Searching...' : 'Search'}
                    </button>
                </div>

                {/* Suggestions */}
                {suggestions.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                        {suggestions.map((suggestion, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    setQuery(suggestion);
                                    setSuggestions([]);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Filter Options Display */}
            {filterOptions && (
                <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                    <h2 className="text-xl font-semibold mb-4">Available Filters</h2>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div>
                            <h3 className="font-medium mb-2">Research Divisions ({filterOptions.divisions.length})</h3>
                            <ul className="text-sm space-y-1">
                                {filterOptions.divisions.slice(0, 5).map(division => (
                                    <li key={division.id} className="flex justify-between">
                                        <span>{division.name}</span>
                                        <span className="text-gray-500">({division.articleCount})</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-medium mb-2">Authors ({filterOptions.authors.length})</h3>
                            <ul className="text-sm space-y-1">
                                {filterOptions.authors.slice(0, 5).map(author => (
                                    <li key={author.id} className="flex justify-between">
                                        <span>{author.name} {author.isLeadership && '👑'}</span>
                                        <span className="text-gray-500">({author.articleCount})</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-medium mb-2">Tags ({filterOptions.tags.length})</h3>
                            <ul className="text-sm space-y-1">
                                {filterOptions.tags.slice(0, 5).map((tag, index) => (
                                    <li key={index} className="flex justify-between">
                                        <span>{tag.name}</span>
                                        <span className="text-gray-500">({tag.count})</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {/* Search Results */}
            {results.length > 0 && (
                <div>
                    <h2 className="text-xl font-semibold mb-4">
                        Search Results ({results.length})
                    </h2>

                    <div className="space-y-4">
                        {results.map((result, index) => (
                            <div key={result.article.id} className="bg-white border border-gray-200 rounded-lg p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-lg font-medium text-blue-600">
                                        {result.article.title}
                                    </h3>
                                    <span className="text-sm text-gray-500 ml-4">
                                        Score: {result.relevanceScore.toFixed(3)}
                                    </span>
                                </div>

                                <div className="text-sm text-gray-600 mb-2">
                                    <span className="font-medium">{result.article.division.name}</span>
                                    {' • '}
                                    <span>
                                        {result.article.authors.map(a => a.author.name).join(', ')}
                                    </span>
                                    {result.article.publishedAt && (
                                        <>
                                            {' • '}
                                            <span>{new Date(result.article.publishedAt).toLocaleDateString()}</span>
                                        </>
                                    )}
                                </div>

                                <p className="text-gray-700 mb-2">{result.article.summary}</p>

                                {result.highlightedSnippets.length > 0 && (
                                    <div className="mt-2">
                                        <h4 className="text-sm font-medium text-gray-600 mb-1">Highlighted Snippets:</h4>
                                        {result.highlightedSnippets.map((snippet, snippetIndex) => (
                                            <div
                                                key={snippetIndex}
                                                className="text-sm text-gray-600 bg-yellow-50 p-2 rounded mb-1"
                                                dangerouslySetInnerHTML={{ __html: snippet }}
                                            />
                                        ))}
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-1 mt-2">
                                    {JSON.parse(result.article.tags || '[]').map((tag: string, tagIndex: number) => (
                                        <span
                                            key={tagIndex}
                                            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {results.length === 0 && query && !isLoading && !error && (
                <div className="text-center text-gray-500 py-8">
                    No results found for "{query}"
                </div>
            )}
        </div>
    );
}