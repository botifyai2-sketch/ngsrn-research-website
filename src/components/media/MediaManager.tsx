'use client';

import React, { useState, useCallback } from 'react';
import { Upload, File } from 'lucide-react';
import { MediaFile } from '@/types';
import { MediaUploader } from './MediaUploader';
import { MediaLibrary } from './MediaLibrary';
import { MediaPreview } from './MediaPreview';

interface MediaManagerProps {
  allowedTypes: string[];
  maxFileSize: number;
  onUpload: (files: File[]) => Promise<MediaFile[]>;
  onSelect: (media: MediaFile) => void;
  onDelete?: (mediaId: string) => Promise<void>;
  selectedMedia?: MediaFile[];
  mode?: 'upload' | 'select' | 'manage';
  multiple?: boolean;
}

export const MediaManager: React.FC<MediaManagerProps> = ({
  allowedTypes,
  maxFileSize,
  onUpload,
  onSelect,
  onDelete,
  selectedMedia = [],
  mode = 'manage',
  multiple = true
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'library'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [previewMedia, setPreviewMedia] = useState<MediaFile | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [recentlyUploadedFiles, setRecentlyUploadedFiles] = useState<MediaFile[]>([]);

  const handleUpload = useCallback(async (files: File[]) => {
    setIsUploading(true);
    try {
      const uploadedFiles = await onUpload(files);
      if (mode === 'select' && uploadedFiles.length > 0) {
        onSelect(uploadedFiles[0]);
      }
      // Store uploaded files for immediate display
      setRecentlyUploadedFiles(uploadedFiles);
      // Clear recently uploaded files after a short delay to avoid duplicates
      setTimeout(() => {
        setRecentlyUploadedFiles([]);
      }, 1000);
      // Refresh the media library after successful upload
      setRefreshTrigger(prev => prev + 1);
      // Switch to library tab to show the uploaded files
      setActiveTab('library');
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
      setUploadProgress({});
    }
  }, [onUpload, onSelect, mode]);

  const handleSelect = useCallback((media: MediaFile) => {
    onSelect(media);
  }, [onSelect]);

  const handlePreview = useCallback((media: MediaFile) => {
    setPreviewMedia(media);
  }, []);

  const handleClosePreview = useCallback(() => {
    setPreviewMedia(null);
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <h2 className="text-xl font-semibold text-gray-900">Media Manager</h2>
        <p className="text-sm text-gray-600 mt-1">
          Upload and manage your media files
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-4">
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'upload'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Upload className="w-4 h-4 inline-block mr-2" />
            Upload Files
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'library'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <File className="w-4 h-4 inline-block mr-2" />
            Media Library
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'upload' && (
          <MediaUploader
            allowedTypes={allowedTypes}
            maxFileSize={maxFileSize}
            onUpload={handleUpload}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
            multiple={multiple}
          />
        )}

        {activeTab === 'library' && (
          <MediaLibrary
            onSelect={handleSelect}
            onDelete={onDelete}
            onPreview={handlePreview}
            selectedMedia={selectedMedia}
            mode={mode}
            multiple={multiple}
            refreshTrigger={refreshTrigger}
            newUploadedFiles={recentlyUploadedFiles}
          />
        )}
      </div>

      {/* Preview Modal */}
      {previewMedia && (
        <MediaPreview
          media={previewMedia}
          onClose={handleClosePreview}
          onSelect={() => handleSelect(previewMedia)}
          onDelete={onDelete}
          showActions={mode !== 'select'}
        />
      )}
    </div>
  );
};