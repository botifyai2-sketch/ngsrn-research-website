"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
// import { useSession } from 'next-auth/react'
import { 
  Save, 
  Calendar, 
  Send, 
  History,
  FileText,
  Tag,
  Users,
  Building2
} from 'lucide-react'
import { ArticleWithRelations, ResearchDivision, Author } from '@/types'
import RichTextEditor from './RichTextEditor'
import MediaSelector from './MediaSelector'
import ArticlePreview from './ArticlePreview'

interface ArticleEditorProps {
  article?: ArticleWithRelations
  divisions: ResearchDivision[]
  authors: Author[]
  onSave?: (article: Partial<ArticleWithRelations>) => Promise<void>
  onPublish?: (article: Partial<ArticleWithRelations>) => Promise<void>
  onSchedule?: (article: Partial<ArticleWithRelations>, publishDate: Date) => Promise<void>
}

interface FormData {
  title: string
  content: string
  summary: string
  divisionId: string
  authorIds: string[]
  tags: string[]
  seoTitle: string
  seoDescription: string
  seoKeywords: string[]
  status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED'
  scheduledFor?: string
}

export default function ArticleEditor({
  article,
  divisions,
  authors,
  onSave,
  onPublish,
  onSchedule
}: ArticleEditorProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [showMediaSelector, setShowMediaSelector] = useState(false)
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<FormData>({
    title: article?.title || '',
    content: article?.content || '',
    summary: article?.summary || '',
    divisionId: article?.divisionId || '',
    authorIds: article?.authors?.map(a => a.author.id) || [],
    tags: article?.tags ? JSON.parse(article.tags as string) : [],
    seoTitle: article?.seoTitle || '',
    seoDescription: article?.seoDescription || '',
    seoKeywords: article?.seoKeywords ? JSON.parse(article.seoKeywords as string) : [],
    status: article?.status || 'DRAFT',
    scheduledFor: article?.scheduledFor?.toISOString().slice(0, 16) || ''
  })

  // Auto-save functionality
  useEffect(() => {
    if (!article) return // Don't auto-save for new articles

    const autoSaveTimer = setTimeout(() => {
      handleAutoSave()
    }, 30000) // Auto-save every 30 seconds

    return () => clearTimeout(autoSaveTimer)
  }, [formData, article])

  const handleAutoSave = async () => {
    if (!article || isSaving) return

    try {
      setIsSaving(true)
      await saveArticle('DRAFT')
      setLastSaved(new Date())
    } catch (error) {
      console.error('Auto-save failed:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required'
    }

    if (!formData.summary.trim()) {
      newErrors.summary = 'Summary is required'
    }

    if (!formData.divisionId) {
      newErrors.divisionId = 'Research division is required'
    }

    if (formData.authorIds.length === 0) {
      newErrors.authorIds = 'At least one author is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const saveArticle = async (status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED') => {
    if (!validateForm()) return

    const articleData = {
      ...formData,
      status,
      scheduledFor: status === 'SCHEDULED' ? formData.scheduledFor : undefined
    }

    if (article) {
      // Update existing article
      const response = await fetch(`/api/articles/${article.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(articleData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update article')
      }

      return response.json()
    } else {
      // Create new article
      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(articleData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create article')
      }

      const newArticle = await response.json()
      router.push(`/cms/articles/${newArticle.id}`)
      return newArticle
    }
  }

  const handleSave = async () => {
    try {
      setIsLoading(true)
      await saveArticle('DRAFT')
      setLastSaved(new Date())
      if (onSave) await onSave(formData as any)
    } catch (error) {
      console.error('Save failed:', error)
      alert(error instanceof Error ? error.message : 'Failed to save article')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePublish = async () => {
    try {
      setIsLoading(true)
      await saveArticle('PUBLISHED')
      if (onPublish) await onPublish(formData as any)
      alert('Article published successfully!')
    } catch (error) {
      console.error('Publish failed:', error)
      alert(error instanceof Error ? error.message : 'Failed to publish article')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSchedule = async (publishDate: Date) => {
    try {
      setIsLoading(true)
      setFormData(prev => ({ 
        ...prev, 
        scheduledFor: publishDate.toISOString().slice(0, 16) 
      }))
      await saveArticle('SCHEDULED')
      if (onSchedule) await onSchedule(formData as any, publishDate)
      setShowScheduleModal(false)
      alert('Article scheduled successfully!')
    } catch (error) {
      console.error('Schedule failed:', error)
      alert(error instanceof Error ? error.message : 'Failed to schedule article')
    } finally {
      setIsLoading(false)
    }
  }

  const addTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }))
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const addKeyword = (keyword: string) => {
    if (keyword && !formData.seoKeywords.includes(keyword)) {
      setFormData(prev => ({
        ...prev,
        seoKeywords: [...prev.seoKeywords, keyword]
      }))
    }
  }

  const removeKeyword = (keywordToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      seoKeywords: prev.seoKeywords.filter(keyword => keyword !== keywordToRemove)
    }))
  }

  const handleMediaSelect = (media: any) => {
    const mediaMarkdown = media.mimeType.startsWith('image/') 
      ? `![${media.originalName}](${media.url})`
      : `[${media.originalName}](${media.url})`;
    
    setFormData(prev => ({
      ...prev,
      content: prev.content + '\n\n' + mediaMarkdown + '\n\n'
    }));
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {article ? 'Edit Article' : 'Create New Article'}
          </h1>
          {lastSaved && (
            <p className="text-sm text-gray-500">
              Last saved: {lastSaved.toLocaleTimeString()}
              {isSaving && <span className="ml-2 text-blue-600">Saving...</span>}
            </p>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {article && (
            <button
              onClick={() => setShowRevisionHistory(true)}
              className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <History className="w-4 h-4 mr-2" />
              History
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </button>

          <button
            onClick={() => setShowScheduleModal(true)}
            disabled={isLoading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Schedule
          </button>

          <button
            onClick={handlePublish}
            disabled={isLoading}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            <Send className="w-4 h-4 mr-2" />
            Publish
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter article title..."
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Content Editor */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Content *
              </label>
              
              {/* Tab Switcher */}
              <div className="flex border border-gray-300 rounded-md">
                <button
                  type="button"
                  onClick={() => setActiveTab('edit')}
                  className={`px-3 py-1 text-sm font-medium rounded-l-md ${
                    activeTab === 'edit'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`px-3 py-1 text-sm font-medium rounded-r-md ${
                    activeTab === 'preview'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Preview
                </button>
              </div>
            </div>

            {activeTab === 'edit' ? (
              <>
                <RichTextEditor
                  value={formData.content}
                  onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                  placeholder="Write your article content here... Use the toolbar for formatting options."
                  error={errors.content}
                />
                {errors.content && (
                  <p className="mt-1 text-sm text-red-600">{errors.content}</p>
                )}
                <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
                  <span>Supports Markdown, HTML, and rich formatting</span>
                  <button
                    type="button"
                    onClick={() => setShowMediaSelector(true)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Insert Media
                  </button>
                </div>
              </>
            ) : (
              <div className="border border-gray-300 rounded-lg p-4 bg-white min-h-[400px]">
                <ArticlePreview 
                  content={formData.content || '*No content to preview*'}
                  title={formData.title}
                />
              </div>
            )}
          </div>

          {/* Summary */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Summary *
            </label>
            <textarea
              value={formData.summary}
              onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.summary ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Brief summary of the article..."
            />
            {errors.summary && (
              <p className="mt-1 text-sm text-red-600">{errors.summary}</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Article Settings */}
          <div className="bg-white p-4 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Article Settings
            </h3>

            {/* Research Division */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building2 className="w-4 h-4 inline mr-1" />
                Research Division *
              </label>
              <select
                value={formData.divisionId}
                onChange={(e) => setFormData(prev => ({ ...prev, divisionId: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.divisionId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select division...</option>
                {divisions.map(division => (
                  <option key={division.id} value={division.id}>
                    {division.name}
                  </option>
                ))}
              </select>
              {errors.divisionId && (
                <p className="mt-1 text-sm text-red-600">{errors.divisionId}</p>
              )}
            </div>

            {/* Authors */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="w-4 h-4 inline mr-1" />
                Authors *
              </label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {authors.map(author => (
                  <label key={author.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.authorIds.includes(author.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            authorIds: [...prev.authorIds, author.id]
                          }))
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            authorIds: prev.authorIds.filter(id => id !== author.id)
                          }))
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm">{author.name}</span>
                  </label>
                ))}
              </div>
              {errors.authorIds && (
                <p className="mt-1 text-sm text-red-600">{errors.authorIds}</p>
              )}
            </div>

            {/* Tags */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="w-4 h-4 inline mr-1" />
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="Add tag and press Enter..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag(e.currentTarget.value.trim())
                    e.currentTarget.value = ''
                  }
                }}
              />
            </div>
          </div>

          {/* SEO Settings */}
          <div className="bg-white p-4 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">SEO Settings</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SEO Title
                </label>
                <input
                  type="text"
                  value={formData.seoTitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, seoTitle: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Custom SEO title..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SEO Description
                </label>
                <textarea
                  value={formData.seoDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, seoDescription: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Meta description for search engines..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SEO Keywords
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.seoKeywords.map(keyword => (
                    <span
                      key={keyword}
                      className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                    >
                      {keyword}
                      <button
                        onClick={() => removeKeyword(keyword)}
                        className="ml-1 text-green-600 hover:text-green-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Add keyword and press Enter..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addKeyword(e.currentTarget.value.trim())
                      e.currentTarget.value = ''
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Schedule Publication</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Publication Date & Time
              </label>
              <input
                type="datetime-local"
                value={formData.scheduledFor}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduledFor: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (formData.scheduledFor) {
                    handleSchedule(new Date(formData.scheduledFor))
                  }
                }}
                disabled={!formData.scheduledFor}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Selector */}
      <MediaSelector
        isOpen={showMediaSelector}
        onClose={() => setShowMediaSelector(false)}
        onSelect={handleMediaSelect}
        allowedTypes={['image/*', 'video/*', 'application/pdf']}
      />
    </div>
  )
}