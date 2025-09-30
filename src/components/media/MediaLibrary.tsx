'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Grid, List, Filter } from 'lucide-react';
import { MediaFile } from '@/types';
import { MediaCard } from './MediaCard';
import { MediaListItem } from './MediaListItem';

interface MediaLibraryProps {
  onSelect: (media: MediaFile) => void;
  onDelete?: (mediaId: string) => Promise<void>;
  onPreview: (media: MediaFile) => void;
  selectedMedia?: MediaFile[];
  mode?: 'upload' | 'select' | 'manage';
  multiple?: boolean;
  refreshTrigger?: number; // Add this to trigger refresh
  newUploadedFiles?: MediaFile[]; // Add this to immediately show uploaded files
}

type ViewMode = 'grid' | 'list';
type SortBy = 'name' | 'date' | 'size' | 'type';
type FilterBy = 'all' | 'images' | 'videos' | 'documents';

export const MediaLibrary: React.FC<MediaLibraryProps> = ({
  onSelect,
  onDelete,
  onPreview,
  selectedMedia = [],
  mode = 'manage',
  multiple = true,
  refreshTrigger = 0,
  newUploadedFiles = []
}) => {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [filterBy, setFilterBy] = useState<FilterBy>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Load media files
  useEffect(() => {
    loadMediaFiles();
  }, []);

  // Refresh when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      loadMediaFiles();
    }
  }, [refreshTrigger]);

  // Add new uploaded files to the beginning of the list
  useEffect(() => {
    if (newUploadedFiles.length > 0) {
      setMediaFiles(prev => {
        // Avoid duplicates by checking if files already exist
        const existingIds = new Set(prev.map(f => f.id));
        const uniqueNewFiles = newUploadedFiles.filter(f => !existingIds.has(f.id));
        return [...uniqueNewFiles, ...prev];
      });
    }
  }, [newUploadedFiles]);

  // Update selected IDs when selectedMedia prop changes
  useEffect(() => {
    setSelectedIds(new Set(selectedMedia.map(media => media.id)));
  }, [selectedMedia]);

  const loadMediaFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/media');
      if (response.ok) {
        const data = await response.json();
        // Handle both array format and object format with files property
        const files = Array.isArray(data) ? data : (data.files || []);
        setMediaFiles(Array.isArray(files) ? files : []);
      } else {
        setMediaFiles([]);
      }
    } catch (error) {
      console.error('Failed to load media files:', error);
      setMediaFiles([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort files
  useEffect(() => {
    let filtered = Array.isArray(mediaFiles) ? [...mediaFiles] : [];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(file =>
        file.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.originalName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply type filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(file => {
        switch (filterBy) {
          case 'images':
            return file.mimeType.startsWith('image/');
          case 'videos':
            return file.mimeType.startsWith('video/');
          case 'documents':
            return !file.mimeType.startsWith('image/') && !file.mimeType.startsWith('video/');
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.originalName.localeCompare(b.originalName);
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'size':
          return b.size - a.size;
        case 'type':
          return a.mimeType.localeCompare(b.mimeType);
        default:
          return 0;
      }
    });

    setFilteredFiles(filtered);
  }, [mediaFiles, searchQuery, filterBy, sortBy]);

  const handleSelect = useCallback((media: MediaFile) => {
    if (mode === 'select') {
      if (multiple) {
        setSelectedIds(prev => {
          const newSet = new Set(prev);
          if (newSet.has(media.id)) {
            newSet.delete(media.id);
          } else {
            newSet.add(media.id);
          }
          return newSet;
        });
      } else {
        setSelectedIds(new Set([media.id]));
      }
    }
    onSelect(media);
  }, [mode, multiple, onSelect]);

  const handleDelete = useCallback(async (mediaId: string) => {
    if (!onDelete) return;
    
    try {
      await onDelete(mediaId);
      setMediaFiles(prev => prev.filter(file => file.id !== mediaId));
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(mediaId);
        return newSet;
      });
    } catch (error) {
      console.error('Failed to delete media file:', error);
    }
  }, [onDelete]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search media files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-4">
          {/* Filter */}
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as FilterBy)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Files</option>
            <option value="images">Images</option>
            <option value="videos">Videos</option>
            <option value="documents">Documents</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="date">Sort by Date</option>
            <option value="name">Sort by Name</option>
            <option value="size">Sort by Size</option>
            <option value="type">Sort by Type</option>
          </select>

          {/* View Mode */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        {filteredFiles.length} of {mediaFiles.length} files
        {selectedIds.size > 0 && ` • ${selectedIds.size} selected`}
      </div>

      {/* Media Grid/List */}
      {filteredFiles.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Filter className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No files found</h3>
          <p className="text-gray-600">
            {searchQuery || filterBy !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'Upload some files to get started'}
          </p>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4'
          : 'space-y-2'
        }>
          {filteredFiles.map((file) => (
            viewMode === 'grid' ? (
              <MediaCard
                key={file.id}
                media={file}
                isSelected={selectedIds.has(file.id)}
                onSelect={() => handleSelect(file)}
                onPreview={() => onPreview(file)}
                onDelete={onDelete ? () => handleDelete(file.id) : undefined}
                mode={mode}
              />
            ) : (
              <MediaListItem
                key={file.id}
                media={file}
                isSelected={selectedIds.has(file.id)}
                onSelect={() => handleSelect(file)}
                onPreview={() => onPreview(file)}
                onDelete={onDelete ? () => handleDelete(file.id) : undefined}
                mode={mode}
                formatFileSize={formatFileSize}
              />
            )
          ))}
        </div>
      )}
    </div>
  );
};