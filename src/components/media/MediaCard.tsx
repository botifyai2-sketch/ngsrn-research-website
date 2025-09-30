'use client';

import React from 'react';
import { Eye, Trash2, Download, Check, Image, Video, FileText } from 'lucide-react';
import { MediaFile } from '@/types';

interface MediaCardProps {
  media: MediaFile;
  isSelected: boolean;
  onSelect: () => void;
  onPreview: () => void;
  onDelete?: () => void;
  mode?: 'upload' | 'select' | 'manage';
}

export const MediaCard: React.FC<MediaCardProps> = ({
  media,
  isSelected,
  onSelect,
  onPreview,
  onDelete,
  mode = 'manage'
}) => {
  const isImage = media.mimeType.startsWith('image/');
  const isVideo = media.mimeType.startsWith('video/');


  const getFileIcon = () => {
    if (isImage) return <Image className="w-8 h-8 text-blue-500" />;
    if (isVideo) return <Video className="w-8 h-8 text-purple-500" />;
    return <FileText className="w-8 h-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleCardClick = () => {
    if (mode === 'select') {
      onSelect();
    } else {
      onPreview();
    }
  };

  return (
    <div
      className={`relative group bg-white border-2 rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={handleCardClick}
    >
      {/* Selection Indicator */}
      {mode === 'select' && (
        <div className={`absolute top-2 right-2 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
          isSelected 
            ? 'bg-blue-600 border-blue-600' 
            : 'bg-white border-gray-300 group-hover:border-blue-400'
        }`}>
          {isSelected && <Check className="w-4 h-4 text-white" />}
        </div>
      )}

      {/* Media Preview */}
      <div className="aspect-square bg-gray-50 flex items-center justify-center">
        {isImage ? (
          <img
            src={media.url}
            alt={media.alt || media.originalName}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : isVideo ? (
          <div className="relative w-full h-full bg-black flex items-center justify-center">
            <Video className="w-12 h-12 text-white opacity-80" />
            <video
              src={media.url}
              className="absolute inset-0 w-full h-full object-cover opacity-50"
              muted
              preload="metadata"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-400">
            {getFileIcon()}
            <span className="text-xs mt-2 font-medium">
              {media.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}
            </span>
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="p-3">
        <h3 className="text-sm font-medium text-gray-900 truncate" title={media.originalName}>
          {media.originalName}
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          {formatFileSize(media.size)}
        </p>
      </div>

      {/* Action Buttons */}
      {mode === 'manage' && (
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPreview();
              }}
              className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100 transition-colors"
              title="Preview"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.open(media.url, '_blank');
              }}
              className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100 transition-colors"
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
                className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};