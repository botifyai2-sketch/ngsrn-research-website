'use client';

import React, { useState, useEffect } from 'react';
import { Author } from '@/types';
import Image from 'next/image';

interface LeadershipFormData {
  id?: string;
  name: string;
  title: string;
  bio: string;
  email: string;
  linkedinUrl: string;
  profileImage?: string;
}

export default function LeadershipManagementPage() {
  const [leaders, setLeaders] = useState<Author[]>([]);
  const [selectedLeader, setSelectedLeader] = useState<LeadershipFormData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Fetch leadership team
  useEffect(() => {
    fetchLeaders();
  }, []);

  const fetchLeaders = async () => {
    try {
      const response = await fetch('/api/authors?leadership=true');
      if (response.ok) {
        const data = await response.json();
        setLeaders(data);
      }
    } catch (error) {
      console.error('Error fetching leaders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (leader: Author) => {
    setSelectedLeader({
      id: leader.id,
      name: leader.name,
      title: leader.title,
      bio: leader.bio,
      email: leader.email,
      linkedinUrl: leader.linkedinUrl || '',
      profileImage: leader.profileImage || ''
    });
    setIsEditing(true);
    setIsAddingNew(false);
  };

  const handleAddNew = () => {
    setSelectedLeader({
      name: '',
      title: '',
      bio: '',
      email: '',
      linkedinUrl: '',
      profileImage: ''
    });
    setIsEditing(true);
    setIsAddingNew(true);
  };

  const handleSave = async () => {
    if (!selectedLeader) return;

    // Validate required fields
    if (!selectedLeader.name || !selectedLeader.title || !selectedLeader.bio || !selectedLeader.email) {
      alert('Please fill in all required fields (Name, Title, Bio, Email)');
      return;
    }

    try {
      const url = isAddingNew ? '/api/authors' : `/api/authors/${selectedLeader.id}`;
      const method = isAddingNew ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...selectedLeader,
          isLeadership: true // Ensure new members are marked as leadership
        }),
      });

      if (response.ok) {
        await fetchLeaders();
        setIsEditing(false);
        setSelectedLeader(null);
        setIsAddingNew(false);
        alert(isAddingNew ? 'New leadership member added successfully!' : 'Leadership profile updated successfully!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${isAddingNew ? 'add' : 'update'} profile`);
      }
    } catch (error) {
      console.error('Error saving leader:', error);
      alert(`Failed to ${isAddingNew ? 'add' : 'update'} profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDelete = async (leaderId: string, leaderName: string) => {
    if (!confirm(`Are you sure you want to delete ${leaderName} from the leadership team? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/authors/${leaderId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchLeaders();
        alert(`${leaderName} has been removed from the leadership team.`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete member');
      }
    } catch (error) {
      console.error('Error deleting leader:', error);
      alert(`Failed to delete member: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!selectedLeader) return;

    console.log('Starting image upload:', file.name, file.size, file.type);
    setUploadingImage(true);
    
    const formData = new FormData();
    formData.append('files', file);
    formData.append('alt', `${selectedLeader.name} profile photo`);

    // Debug: Log FormData contents
    console.log('FormData entries:');
    for (const [key, value] of formData.entries()) {
      console.log(key, value);
    }

    try {
      const response = await fetch('/api/media', {
        method: 'POST',
        body: formData,
      });

      console.log('Upload response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Upload result:', result);
        
        if (result.files && result.files.length > 0) {
          const mediaFile = result.files[0];
          setSelectedLeader({
            ...selectedLeader,
            profileImage: mediaFile.url
          });
          
          // Show success message
          alert('Profile image uploaded successfully!');
        } else {
          throw new Error('No files returned from upload');
        }
      } else {
        const errorText = await response.text();
        console.error('Upload failed:', response.status, errorText);
        throw new Error(errorText || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploadingImage(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Leadership Management</h1>
        <p className="text-gray-600">Manage leadership team profiles and information</p>
      </div>

      {!isEditing ? (
        <div className="space-y-6">
          {/* Add New Member Button */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Current Leadership Team</h2>
            <button
              onClick={handleAddNew}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Add New Member</span>
            </button>
          </div>

          {leaders.map((leader) => (
            <div key={leader.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start space-x-4">
                <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-200">
                  {leader.profileImage ? (
                    <Image
                      src={leader.profileImage}
                      alt={leader.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900">{leader.name}</h3>
                  <p className="text-blue-600 font-medium">{leader.title}</p>
                  <p className="text-gray-600 text-sm mt-1">{leader.email}</p>
                  <p className="text-gray-700 mt-2 line-clamp-2">{leader.bio}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(leader)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(leader.id, leader.name)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              {isAddingNew ? 'Add New Leadership Member' : 'Edit Leadership Profile'}
            </h2>
            <p className="text-gray-600">
              {isAddingNew ? 'Add a new member to the leadership team' : 'Update profile information and upload new photo'}
            </p>
          </div>

          <div className="space-y-6">
            {/* Profile Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Image
              </label>
              <div className="flex items-center space-x-4">
                <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-200">
                  {selectedLeader?.profileImage ? (
                    <Image
                      src={selectedLeader.profileImage}
                      alt={selectedLeader.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // Validate file size (max 5MB)
                        if (file.size > 5 * 1024 * 1024) {
                          alert('File size must be less than 5MB');
                          return;
                        }
                        handleImageUpload(file);
                      }
                    }}
                    className="hidden"
                    id="profile-image-upload"
                    disabled={uploadingImage}
                  />
                  <label
                    htmlFor="profile-image-upload"
                    className={`inline-block px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors ${
                      uploadingImage ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {uploadingImage ? 'Uploading...' : 'Upload New Photo'}
                  </label>
                  {selectedLeader?.profileImage && (
                    <button
                      type="button"
                      onClick={() => setSelectedLeader(prev => prev ? {...prev, profileImage: ''} : null)}
                      className="ml-2 px-3 py-2 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                    >
                      Remove Photo
                    </button>
                  )}
                  <p className="text-xs text-gray-500">
                    Supported formats: JPEG, PNG, WebP (max 5MB)
                  </p>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={selectedLeader?.name || ''}
                  onChange={(e) => setSelectedLeader(prev => prev ? {...prev, name: e.target.value} : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={selectedLeader?.title || ''}
                  onChange={(e) => setSelectedLeader(prev => prev ? {...prev, title: e.target.value} : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Executive Director"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={selectedLeader?.email || ''}
                  onChange={(e) => setSelectedLeader(prev => prev ? {...prev, email: e.target.value} : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="email@ngsrn.org"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  value={selectedLeader?.linkedinUrl || ''}
                  onChange={(e) => setSelectedLeader(prev => prev ? {...prev, linkedinUrl: e.target.value} : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Biography <span className="text-red-500">*</span>
              </label>
              <textarea
                value={selectedLeader?.bio || ''}
                onChange={(e) => setSelectedLeader(prev => prev ? {...prev, bio: e.target.value} : null)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter detailed biography including education, experience, and expertise..."
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Include education, professional experience, research areas, and key achievements.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {isAddingNew ? 'Add Member' : 'Save Changes'}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setSelectedLeader(null);
                  setIsAddingNew(false);
                }}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}