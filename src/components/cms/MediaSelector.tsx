'use client';

import React, { useState, useEffect } from 'react';
import { Image, Video, FileText, Upload, X, Search, Grid, List } from 'lucide-react';

interface MediaFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
}

interface MediaSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: MediaFile) => void;
  allowedTypes?: string[];
  multiple?: boolean;
}

export default function MediaSelector({ 
  isOpen, 
  onClose, 
  onSelect, 
  allowedTypes = ['image/*', 'video/*'], 
  multiple = false 
}: MediaSelectorProps) {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFiles, setSelectedFiles] = useState<MediaFile[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchMediaFiles();
    }
  }, [isOpen]);

  const fetchMediaFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/media');
      if (response.ok) {
        const data = await response.json();
        setMediaFiles(data.files || []);
      }
    } catch (error) {
      console.error('Failed to fetch media files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (files: FileList) => {
    setUploading(true);
    const formData = new FormData();
    
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await fetch('/api/media', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setMediaFiles(prev => [...data.files, ...prev]);
      }
    } catch (error) {
      console.error('Failed to upload files:', error);
    } finally {
      setUploading(false);
    }
  };

  const filteredFiles = mediaFiles.filter(file => {
    const matchesSearch = file.originalName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = allowedTypes.some(type => {
      if (type === 'image/*') return file.mimeType.startsWith('image/');
      if (type === 'video/*') return file.mimeType.startsWith('video/');
      return file.mimeType === type;
    });
    return matchesSearch && matchesType;
  });

  const handleSelect = (file: MediaFile) => {
    if (multiple) {
      setSelectedFiles(prev => {
        const isSelected = prev.find(f => f.id === file.id);
        if (isSelected) {
          return prev.filter(f => f.id !== file.id);
        } else {
          return [...prev, file];
        }
      });
    } else {
      onSelect(file);
      onClose();
    }
  };

  const handleConfirmSelection = () => {
    if (multiple && selectedFiles.length > 0) {
      selectedFiles.forEach(file => onSelect(file));
      onClose();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image size={20} />;
    if (mimeType.startsWith('video/')) return <Video size={20} />;
    return <FileText size={20} />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Select Media</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Controls */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search media files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* View Mode */}
              <div className="flex border border-gray-300 rounded-md">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
                >
                  <Grid size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
                >
                  <List size={16} />
                </button>
              </div>
            </div>

            {/* Upload */}
            <label className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer">
              <Upload size={16} className="mr-2" />
              {uploading ? 'Uploading...' : 'Upload Files'}
              <input
                type="file"
                multiple
                accept={allowedTypes.join(',')}
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>

          {multiple && selectedFiles.length > 0 && (
            <div className="flex items-center justify-between bg-blue-50 p-3 rounded-md">
              <span className="text-sm text-blue-700">
                {selectedFiles.length} file(s) selected
              </span>
              <button
                onClick={handleConfirmSelection}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                Use Selected Files
              </button>
            </div>
          )}
        </div>

        {/* Media Grid/List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-12">
              <Image size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No media files found</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  onClick={() => handleSelect(file)}
                  className={`relative group cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
                    selectedFiles.find(f => f.id === file.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {file.mimeType.startsWith('image/') ? (
                    <img
                      src={file.url}
                      alt={file.originalName}
                      className="w-full h-32 object-cover"
                    />
                  ) : (
                    <div className="w-full h-32 bg-gray-100 flex items-center justify-center">
                      {getFileIcon(file.mimeType)}
                    </div>
                  )}
                  
                  <div className="p-3">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.originalName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>

                  {multiple && selectedFiles.find(f => f.id === file.id) && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">
                      ✓
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  onClick={() => handleSelect(file)}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedFiles.find(f => f.id === file.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex-shrink-0 mr-3">
                    {file.mimeType.startsWith('image/') ? (
                      <img
                        src={file.url}
                        alt={file.originalName}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                        {getFileIcon(file.mimeType)}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.originalName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)} • {new Date(file.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {multiple && selectedFiles.find(f => f.id === file.id) && (
                    <div className="flex-shrink-0 ml-3">
                      <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">
                        ✓
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}