'use client';

import React, { useState, useCallback } from 'react';
import { X, Plus, File } from 'lucide-react';
import { MediaFile } from '@/types';
import { MediaManager } from './MediaManager';
import { SUPPORTED_FILE_TYPES, MAX_FILE_SIZES } from '@/lib/storage';

interface MediaSelectorProps {
  selectedMedia: MediaFile[];
  onSelectionChange: (media: MediaFile[]) => void;
  allowedTypes?: string[];
  maxFileSize?: number;
  multiple?: boolean;
  label?: string;
  description?: string;
}

export const MediaSelector: React.FC<MediaSelectorProps> = ({
  selectedMedia,
  onSelectionChange,
  allowedTypes = SUPPORTED_FILE_TYPES.all,
  maxFileSize = MAX_FILE_SIZES.default,
  multiple = true,
  label = 'Media Files',
  description = 'Select or upload media files'
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleUpload = useCallback(async (files: File[]): Promise<MediaFile[]> => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    const response = await fetch('/api/media', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    const result = await response.json();
    return result.files;
  }, []);

  const handleSelect = useCallback((media: MediaFile) => {
    if (multiple) {
      const exists = selectedMedia.find(m => m.id === media.id);
      if (exists) {
        onSelectionChange(selectedMedia.filter(m => m.id !== media.id));
      } else {
        onSelectionChange([...selectedMedia, media]);
      }
    } else {
      onSelectionChange([media]);
      setIsModalOpen(false);
    }
  }, [selectedMedia, onSelectionChange, multiple]);

  const handleRemove = useCallback((mediaId: string) => {
    onSelectionChange(selectedMedia.filter(m => m.id !== mediaId));
  }, [selectedMedia, onSelectionChange]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Label and Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
        {description && (
          <p className="text-sm text-gray-500">{description}</p>
        )}
      </div>

      {/* Selected Media Display */}
      {selectedMedia.length > 0 && (
        <div className="space-y-3">
          {selectedMedia.map((media) => (
            <div key={media.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border">
              {/* Thumbnail */}
              <div className="w-12 h-12 flex-shrink-0">
                {media.mimeType.startsWith('image/') ? (
                  <img
                    src={media.url}
                    alt={media.alt || media.originalName}
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                    <File className="w-6 h-6 text-gray-500" />
                  </div>
                )}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {media.originalName}
                </p>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <span>{formatFileSize(media.size)}</span>
                  <span>•</span>
                  <span>{media.mimeType}</span>
                </div>
              </div>

              {/* Remove Button */}
              <button
                onClick={() => handleRemove(media.id)}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Media Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
      >
        <Plus className="w-5 h-5 text-gray-400 mr-2" />
        <span className="text-sm text-gray-600">
          {selectedMedia.length === 0 ? 'Add Media Files' : 'Add More Files'}
        </span>
      </button>

      {/* Media Manager Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Select Media</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 max-h-[calc(90vh-120px)] overflow-auto">
              <MediaManager
                allowedTypes={allowedTypes}
                maxFileSize={maxFileSize}
                onUpload={handleUpload}
                onSelect={handleSelect}
                selectedMedia={selectedMedia}
                mode="select"
                multiple={multiple}
              />
            </div>
            <div className="flex justify-end p-4 border-t bg-gray-50">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};