"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { FileText, Image, Settings, Users, Folder } from "lucide-react"
import Link from "next/link"

interface StatCard {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  change?: string
  loading?: boolean
}

interface DashboardStats {
  totalArticles: number
  publishedArticles: number
  draftArticles: number
  totalAuthors: number
  leadershipAuthors: number
  totalDivisions: number
  totalMediaFiles: number
  totalUsers: number
}

interface RecentActivity {
  id: string
  type: 'article_published' | 'article_created' | 'author_created' | 'media_uploaded'
  title: string
  timestamp: string
  status?: string
}

export default function CMSDashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch statistics from multiple endpoints
      const [articlesRes, authorsRes, divisionsRes, mediaRes, usersRes] = await Promise.all([
        fetch('/api/articles'),
        fetch('/api/authors'),
        fetch('/api/divisions'),
        fetch('/api/media'),
        fetch('/api/users')
      ])

      // Handle responses and ensure we always get arrays
      let articles = []
      let authors = []
      let divisions = []
      let media = []
      let users = []

      try {
        if (articlesRes.ok) {
          const articlesData = await articlesRes.json()
          // Handle the API response format { articles: [...], pagination: {...} }
          articles = Array.isArray(articlesData) ? articlesData : (articlesData.articles || [])
        } else {
          console.error('Articles API error:', articlesRes.status, articlesRes.statusText)
        }
      } catch (error) {
        console.error('Failed to fetch articles:', error)
      }

      try {
        if (authorsRes.ok) {
          const authorsData = await authorsRes.json()
          authors = Array.isArray(authorsData) ? authorsData : []
        } else {
          console.error('Authors API error:', authorsRes.status, authorsRes.statusText)
        }
      } catch (error) {
        console.error('Failed to fetch authors:', error)
      }

      try {
        if (divisionsRes.ok) {
          const divisionsData = await divisionsRes.json()
          divisions = Array.isArray(divisionsData) ? divisionsData : []
        } else {
          console.error('Divisions API error:', divisionsRes.status, divisionsRes.statusText)
        }
      } catch (error) {
        console.error('Failed to fetch divisions:', error)
      }

      try {
        if (mediaRes.ok) {
          const mediaData = await mediaRes.json()
          // Handle the media API response format { files: [...], pagination: {...} }
          media = Array.isArray(mediaData) ? mediaData : (mediaData.files || [])
        } else {
          console.error('Media API error:', mediaRes.status, mediaRes.statusText)
        }
      } catch (error) {
        console.error('Failed to fetch media:', error)
      }

      try {
        if (usersRes.ok) {
          const usersData = await usersRes.json()
          users = Array.isArray(usersData) ? usersData : []
        } else {
          console.error('Users API error:', usersRes.status, usersRes.statusText)
        }
      } catch (error) {
        console.error('Failed to fetch users:', error)
      }

      // Debug: Log the data we received
      console.log('Dashboard data received:', {
        articlesLength: articles.length,
        articlesData: articles,
        authorsLength: authors.length,
        divisionsLength: divisions.length,
        mediaLength: media.length,
        usersLength: users.length
      })

      // Calculate statistics
      const dashboardStats: DashboardStats = {
        totalArticles: articles.length || 0,
        publishedArticles: articles.filter((a: any) => a.status === 'PUBLISHED').length || 0,
        draftArticles: articles.filter((a: any) => a.status === 'DRAFT').length || 0,
        totalAuthors: authors.length || 0,
        leadershipAuthors: authors.filter((a: any) => a.isLeadership).length || 0,
        totalDivisions: divisions.length || 0,
        totalMediaFiles: media.length || 0,
        totalUsers: users.length || 0
      }

      console.log('Calculated stats:', dashboardStats)

      setStats(dashboardStats)

      // Generate recent activity from articles
      const recentActivities: RecentActivity[] = articles
        .slice(0, 5)
        .map((article: any) => ({
          id: article.id,
          type: article.status === 'PUBLISHED' ? 'article_published' : 'article_created',
          title: article.title,
          timestamp: article.updatedAt,
          status: article.status
        }))

      setRecentActivity(recentActivities)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatCards = (): StatCard[] => {
    if (!stats) return []

    return [
      {
        title: "Total Articles",
        value: stats.totalArticles,
        icon: FileText,
        change: `${stats.publishedArticles} published, ${stats.draftArticles} drafts`,
        loading: isLoading
      },
      {
        title: "Authors",
        value: stats.totalAuthors,
        icon: Users,
        change: `${stats.leadershipAuthors} in leadership team`,
        loading: isLoading
      },
      {
        title: "Research Divisions",
        value: stats.totalDivisions,
        icon: Folder,
        loading: isLoading
      },
      {
        title: "Media Files",
        value: stats.totalMediaFiles,
        icon: Image,
        loading: isLoading
      }
    ]
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours} hours ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays} days ago`
    return time.toLocaleDateString()
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'article_published':
        return <div className="w-2 h-2 bg-green-500 rounded-full"></div>
      case 'article_created':
        return <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
      case 'author_created':
        return <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
      case 'media_uploaded':
        return <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
      default:
        return <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
    }
  }

  const getActivityText = (activity: RecentActivity) => {
    switch (activity.type) {
      case 'article_published':
        return `Article "${activity.title}" was published`
      case 'article_created':
        return `Article "${activity.title}" was created as draft`
      default:
        return activity.title
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {session?.user?.name || session?.user?.email}
        </h1>
        <p className="text-gray-600">
          Here&apos;s what&apos;s happening with your NGSRN content today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {getStatCards().map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.title}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  {stat.loading ? (
                    <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  )}
                  {stat.change && !stat.loading && (
                    <p className="text-sm text-gray-600">{stat.change}</p>
                  )}
                </div>
                <Icon className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="flex-1 h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3">
                  {getActivityIcon(activity.type)}
                  <p className="text-sm text-gray-600 flex-1">
                    {getActivityText(activity)}
                  </p>
                  <span className="text-xs text-gray-400">
                    {formatTimeAgo(activity.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No recent activity</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/cms/articles/new" className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <FileText className="h-6 w-6 text-blue-600 mb-2" />
              <h3 className="font-medium text-gray-900">Create New Article</h3>
              <p className="text-sm text-gray-600">Start writing a new research article</p>
            </Link>
            <Link href="/cms/articles" className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <FileText className="h-6 w-6 text-green-600 mb-2" />
              <h3 className="font-medium text-gray-900">Manage Articles</h3>
              <p className="text-sm text-gray-600">Edit and organize your articles</p>
            </Link>
            <Link href="/cms/media" className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Image className="h-6 w-6 text-purple-600 mb-2" />
              <h3 className="font-medium text-gray-900">Media Library</h3>
              <p className="text-sm text-gray-600">Upload and manage media files</p>
            </Link>
            <Link href="/cms/seo" className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Settings className="h-6 w-6 text-orange-600 mb-2" />
              <h3 className="font-medium text-gray-900">SEO Management</h3>
              <p className="text-sm text-gray-600">Optimize for search engines</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}