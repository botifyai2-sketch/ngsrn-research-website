"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    Plus,
    Search,
    Filter,
    Edit,
    Eye,
    Trash2,
    Calendar,
    Clock,
    CheckCircle,
    AlertCircle,
    FileText
} from 'lucide-react'

interface Article {
    id: string
    title: string
    slug: string
    status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED'
    authors: { author: { name: string } }[]
    division: { name: string }
    publishedAt?: Date
    scheduledFor?: Date
    createdAt: Date
    updatedAt: Date
}

interface ArticleManagerProps {
    initialArticles?: Article[]
}

export default function ArticleManager({ initialArticles = [] }: ArticleManagerProps) {
    const router = useRouter()
    const [articles, setArticles] = useState<Article[]>(initialArticles)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'scheduled'>('all')
    const [isLoading, setIsLoading] = useState(false)

    // Only fetch articles if we don't have initial articles
    useEffect(() => {
        if (initialArticles.length === 0) {
            fetchArticles()
        }
    }, [])

    const fetchArticles = async () => {
        setIsLoading(true)
        try {
            const response = await fetch('/api/articles')
            if (response.ok) {
                const data = await response.json()
                // Handle the API response format { articles: [...], pagination: {...} }
                const articles = Array.isArray(data) ? data : (data.articles || [])
                setArticles(articles)
            } else {
                setArticles([])
            }
        } catch (error) {
            console.error('Failed to fetch articles:', error)
            setArticles([])
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeleteArticle = async (articleId: string) => {
        if (!confirm('Are you sure you want to delete this article?')) return

        try {
            const response = await fetch(`/api/articles/${articleId}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                setArticles(articles.filter(article => article.id !== articleId))
            }
        } catch (error) {
            console.error('Failed to delete article:', error)
        }
    }

    const filteredArticles = Array.isArray(articles) ? articles.filter(article => {
        const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            article.authors.some(authorRel => authorRel.author.name.toLowerCase().includes(searchQuery.toLowerCase()))
        const matchesStatus = statusFilter === 'all' || article.status.toLowerCase() === statusFilter
        return matchesSearch && matchesStatus
    }) : []

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'published':
                return <CheckCircle className="w-4 h-4 text-green-600" />
            case 'scheduled':
                return <Clock className="w-4 h-4 text-blue-600" />
            case 'draft':
                return <AlertCircle className="w-4 h-4 text-yellow-600" />
            default:
                return <FileText className="w-4 h-4 text-gray-600" />
        }
    }

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date))
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Article Management</h1>
                    <p className="text-gray-600">Manage your research articles and publications</p>
                </div>
                <button
                    onClick={() => router.push('/cms/articles/new')}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    New Article
                </button>
            </div>

            {/* Search and Filters */}
            <div className="flex gap-4 items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search articles..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="all">All Status</option>
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="scheduled">Scheduled</option>
                    </select>
                </div>
            </div>

            {/* Articles Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Loading articles...</p>
                    </div>
                ) : filteredArticles.length === 0 ? (
                    <div className="p-8 text-center">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No articles found</h3>
                        <p className="text-gray-600">
                            {searchQuery || statusFilter !== 'all'
                                ? 'Try adjusting your search or filters'
                                : 'Get started by creating your first article'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Article
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Authors
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Division
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredArticles.map((article) => (
                                    <tr key={article.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{article.title}</div>
                                                <div className="text-sm text-gray-500">/{article.slug}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(article.status)}
                                                <span className="text-sm capitalize">{article.status.toLowerCase()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">
                                                {article.authors.map(authorRel => authorRel.author.name).join(', ')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">{article.division.name}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">
                                                {article.status === 'scheduled' && article.scheduledFor ? (
                                                    <div>
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {formatDate(article.scheduledFor)}
                                                        </div>
                                                    </div>
                                                ) : article.publishedAt ? (
                                                    formatDate(article.publishedAt)
                                                ) : (
                                                    formatDate(article.createdAt)
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => router.push(`/articles/${article.slug}`)}
                                                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                                    title="View article"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => router.push(`/cms/articles/${article.id}/edit`)}
                                                    className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                                                    title="Edit article"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteArticle(article.id)}
                                                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                                    title="Delete article"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}