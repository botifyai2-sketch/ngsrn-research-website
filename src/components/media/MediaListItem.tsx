'use client';

import React from 'react';
import { Eye, Trash2, Download, Check, Image, Video, FileText } from 'lucide-react';
import { MediaFile } from '@/types';

interface MediaListItemProps {
  media: MediaFile;
  isSelected: boolean;
  onSelect: () => void;
  onPreview: () => void;
  onDelete?: () => void;
  mode?: 'upload' | 'select' | 'manage';
  formatFileSize: (bytes: number) => string;
}

export const MediaListItem: React.FC<MediaListItemProps> = ({
  media,
  isSelected,
  onSelect,
  onPreview,
  onDelete,
  mode = 'manage',
  formatFileSize
}) => {
  const isImage = media.mimeType.startsWith('image/');
  const isVideo = media.mimeType.startsWith('video/');

  const getFileIcon = () => {
    if (isImage) return <Image className="w-6 h-6 text-blue-500" />;
    if (isVideo) return <Video className="w-6 h-6 text-purple-500" />;
    return <FileText className="w-6 h-6 text-gray-500" />;
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleRowClick = () => {
    if (mode === 'select') {
      onSelect();
    } else {
      onPreview();
    }
  };

  return (
    <div
      className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all hover:shadow-sm ${
        isSelected 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 hover:border-gray-300 bg-white'
      }`}
      onClick={handleRowClick}
    >
      {/* Selection Checkbox */}
      {mode === 'select' && (
        <div className="mr-4">
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
            isSelected 
              ? 'bg-blue-600 border-blue-600' 
              : 'border-gray-300 hover:border-blue-400'
          }`}>
            {isSelected && <Check className="w-3 h-3 text-white" />}
          </div>
        </div>
      )}

      {/* Thumbnail */}
      <div className="w-12 h-12 flex-shrink-0 mr-4">
        {isImage ? (
          <img
            src={media.url}
            alt={media.alt || media.originalName}
            className="w-full h-full object-cover rounded"
            loading="lazy"
          />
        ) : isVideo ? (
          <div className="w-full h-full bg-black rounded flex items-center justify-center relative">
            <Video className="w-6 h-6 text-white" />
            <video
              src={media.url}
              className="absolute inset-0 w-full h-full object-cover rounded opacity-50"
              muted
              preload="metadata"
            />
          </div>
        ) : (
          <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center">
            {getFileIcon()}
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-gray-900 truncate" title={media.originalName}>
              {media.originalName}
            </h3>
            <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
              <span>{formatFileSize(media.size)}</span>
              <span>{media.mimeType}</span>
              <span>{formatDate(media.createdAt)}</span>
            </div>
          </div>

          {/* Actions */}
          {mode === 'manage' && (
            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPreview();
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                title="Preview"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(media.url, '_blank');
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Are you sure you want to delete this file?')) {
                      onDelete();
                    }
                  }}
                  className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};