// Core data types for NGSRN website
import { 
  Article as PrismaArticle, 
  Author as PrismaAuthor, 
  ResearchDivision as PrismaResearchDivision,
  User as PrismaUser,
  MediaFile as PrismaMediaFile,
  ArticleStatus,
  UserRole
} from '@prisma/client'

// Extended Prisma types with relations
export type ArticleWithRelations = PrismaArticle & {
  division: PrismaResearchDivision;
  authors: {
    author: PrismaAuthor;
    order: number;
  }[];
  mediaFiles: {
    mediaFile: PrismaMediaFile;
    order: number;
  }[];
}

export type AuthorWithRelations = PrismaAuthor & {
  researchDivisions: {
    division: PrismaResearchDivision;
  }[];
  articles: {
    article: PrismaArticle;
  }[];
}

// Re-export Prisma types with transformations
export type Article = Omit<PrismaArticle, 'tags' | 'seoKeywords'> & {
  tags: string[]; // Transform JSON string to array
  seoKeywords: string[]; // Transform JSON string to array
}

export type ResearchDivision = Omit<PrismaResearchDivision, 'sdgAlignment'> & {
  sdgAlignment: string[]; // Transform JSON string to array
}

export type { 
  PrismaAuthor as Author,
  PrismaUser as User,
  PrismaMediaFile as MediaFile,
  ArticleStatus,
  UserRole
}

// Legacy interfaces for backward compatibility
export interface LegacyArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary: string;
  authors: AuthorWithRelations[];
  division: PrismaResearchDivision;
  tags: string[];
  status: 'draft' | 'published' | 'scheduled';
  publishedAt?: Date;
  scheduledFor?: Date;
  seoMetadata: SEOMetadata;
  readTime: number;
  downloadUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SEOMetadata {
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
  canonicalUrl?: string;
}

export interface SearchResult {
  article: ArticleWithRelations;
  relevanceScore: number;
  aiSummary?: string;
  highlightedSnippets: string[];
}

export interface SearchFilters {
  divisions: string[];
  dateRange: { start: Date; end: Date };
  authors: string[];
  tags: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  articleContext?: string;
}

// Legacy MediaFile interface for backward compatibility
export interface LegacyMediaFile {
  id: string;
  filename: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Date;
}

// Navigation types
export interface NavigationItem {
  label: string;
  href: string;
  children?: NavigationItem[];
  requiresAuth?: boolean;
}

// Component prop types
export interface HeaderProps {
  isAuthenticated: boolean;
  userRole?: 'admin' | 'editor' | 'viewer';
}

export interface ArticleCardProps {
  article: ArticleWithRelations;
  showSummary?: boolean;
}

export interface ArticleReaderProps {
  article: ArticleWithRelations;
  enableAIAssistant?: boolean;
  showTableOfContents?: boolean;
}

export interface SearchComponentProps {
  onSearch: (query: string, filters: SearchFilters) => void;
  results: SearchResult[];
  isLoading: boolean;
}

export interface AIAssistantProps {
  articleId: string;
  articleContent: string;
  onQuestionSubmit: (question: string) => Promise<string>;
}

export interface ArticleEditorProps {
  article?: ArticleWithRelations;
  onSave: (article: Partial<PrismaArticle>) => Promise<void>;
  onPublish: (article: Partial<PrismaArticle>) => Promise<void>;
  onSchedule: (article: Partial<PrismaArticle>, publishDate: Date) => Promise<void>;
}

export interface MediaManagerProps {
  allowedTypes: string[];
  maxFileSize: number;
  onUpload: (files: File[]) => Promise<PrismaMediaFile[]>;
  onSelect: (media: PrismaMediaFile) => void;
}