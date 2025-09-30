'use client';

import React from 'react';
import { X, Download, Trash2, Check, FileText, File } from 'lucide-react';
import { MediaFile } from '@/types';

interface MediaPreviewProps {
  media: MediaFile;
  onClose: () => void;
  onSelect?: () => void;
  onDelete?: (mediaId: string) => Promise<void>;
  showActions?: boolean;
}

export const MediaPreview: React.FC<MediaPreviewProps> = ({
  media,
  onClose,
  onSelect,
  onDelete,
  showActions = true
}) => {
  const isImage = media.mimeType.startsWith('image/');
  const isVideo = media.mimeType.startsWith('video/');
  const isPDF = media.mimeType === 'application/pdf';


  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    if (confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      try {
        await onDelete(media.id);
        onClose();
      } catch (error) {
        console.error('Failed to delete file:', error);
        alert('Failed to delete file. Please try again.');
      }
    }
  };

  const renderPreview = () => {
    if (isImage) {
      return (
        <div className="flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={media.url}
            alt={media.alt || media.originalName}
            className="max-w-full max-h-96 object-contain"
          />
        </div>
      );
    }

    if (isVideo) {
      return (
        <div className="bg-black rounded-lg overflow-hidden">
          <video
            src={media.url}
            controls
            className="w-full max-h-96"
            preload="metadata"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    if (isPDF) {
      return (
        <div className="bg-gray-100 rounded-lg p-8 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">PDF Document</p>
          <button
            onClick={() => window.open(media.url, '_blank')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Open PDF
          </button>
        </div>
      );
    }

    // Default preview for other file types
    return (
      <div className="bg-gray-100 rounded-lg p-8 text-center">
        <File className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-2">
          {media.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}
        </p>
        <p className="text-sm text-gray-500">
          Preview not available for this file type
        </p>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold text-gray-900 truncate">
              {media.originalName}
            </h2>
            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
              <span>{formatFileSize(media.size)}</span>
              <span>{media.mimeType}</span>
              <span>Uploaded {formatDate(media.createdAt)}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Preview Content */}
        <div className="p-6 max-h-[60vh] overflow-auto">
          {renderPreview()}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-4">
              {media.alt && (
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Alt text: </span>
                  <span className="text-gray-600">{media.alt}</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-3">
              {onSelect && (
                <button
                  onClick={() => {
                    onSelect();
                    onClose();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Select</span>
                </button>
              )}
              <button
                onClick={() => window.open(media.url, '_blank')}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
              {onDelete && (
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};