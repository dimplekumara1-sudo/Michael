import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  Save, 
  X, 
  MapPin, 
  Youtube, 
  Image as ImageIcon,
  Video,
  Eye,
  EyeOff,
  Loader2,
  Heart,
  MessageCircle,
  Users,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { MediaPost, CreateMediaPost, UpdateMediaPost, Like, Comment } from '../../types';
import { LatestWorkService } from '../../services/latestWorkService';
import { supabase } from '../../lib/supabase';
import { useRealtimeLatestWorkAdmin } from '../../hooks/useRealtimeLatestWorkAdmin';
import MultiImageSlider from '../MultiImageSlider';

interface LatestWorkManagerProps {
  onClose?: () => void;
}

function extractYouTubeId(url: string): string {
  const regExp = /(?:youtube\.com.*(?:\?|&)v=|youtu\.be\/)([^&\n?#]+)/;
  const match = url.match(regExp);
  return match && match[1] ? match[1] : '';
}

interface FormData {
  title: string;
  caption: string;
  media_url: string;
  thumbnail: string;
  // New multi-image support
  media_urls: string[];
  thumbnails: string[];
  location: string;
  youtube_url: string;
  category: string;
  is_active: boolean;
}

interface AboutWorkFormData {
  video_title: string;
  video_description: string;
  youtube_video_id: string;
}

const LatestWorkManager: React.FC<LatestWorkManagerProps> = ({ onClose }) => {
  // Use the real-time admin hook
  const { 
    posts, 
    loading, 
    error: realtimeError, 
    refreshPosts, 
    getComments, 
    getLikes, 
    deleteComment, 
    removeLike 
  } = useRealtimeLatestWorkAdmin();

  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<MediaPost | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // New states for likes/comments management
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [postComments, setPostComments] = useState<{ [postId: string]: Comment[] }>({});
  const [postLikes, setPostLikes] = useState<{ [postId: string]: Like[] }>({});
  const [loadingComments, setLoadingComments] = useState<{ [postId: string]: boolean }>({});
  const [loadingLikes, setLoadingLikes] = useState<{ [postId: string]: boolean }>({});
  const [formData, setFormData] = useState<FormData>({
    title: '',
    caption: '',
    media_url: '',
    thumbnail: '',
    // New multi-image support
    media_urls: [],
    thumbnails: [],
    location: '',
    youtube_url: '',
    category: 'All Work',
    is_active: true
  });

  const [showAboutWorkModal, setShowAboutWorkModal] = useState(false);
  const [aboutWorkLoading, setAboutWorkLoading] = useState(false);
  const [aboutWorkFormData, setAboutWorkFormData] = useState<AboutWorkFormData>({
    video_title: '',
    video_description: '',
    youtube_video_id: ''
  });

  // Combine errors from real-time hook and local state
  const combinedError = error || realtimeError;

  // Load comments for a specific post
  const loadPostComments = async (postId: string) => {
    if (loadingComments[postId]) return;
    
    setLoadingComments(prev => ({ ...prev, [postId]: true }));
    try {
      const comments = await getComments(postId);
      setPostComments(prev => ({ ...prev, [postId]: comments }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comments');
    } finally {
      setLoadingComments(prev => ({ ...prev, [postId]: false }));
    }
  };

  // Load likes for a specific post
  const loadPostLikes = async (postId: string) => {
    if (loadingLikes[postId]) return;
    
    setLoadingLikes(prev => ({ ...prev, [postId]: true }));
    try {
      const likes = await getLikes(postId);
      setPostLikes(prev => ({ ...prev, [postId]: likes }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load likes');
    } finally {
      setLoadingLikes(prev => ({ ...prev, [postId]: false }));
    }
  };

  // Toggle expanded view for a post
  const togglePostExpansion = async (postId: string) => {
    if (expandedPost === postId) {
      setExpandedPost(null);
    } else {
      setExpandedPost(postId);
      // Load comments and likes when expanding
      await Promise.all([
        loadPostComments(postId),
        loadPostLikes(postId)
      ]);
    }
  };

  // Handle comment deletion
  const handleDeleteComment = async (commentId: string, postId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      const success = await deleteComment(commentId);
      if (success) {
        // Reload comments for this post
        await loadPostComments(postId);
        setError(null);
      } else {
        setError('Failed to delete comment');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete comment');
    }
  };

  // Handle like removal
  const handleRemoveLike = async (likeId: string, postId: string) => {
    if (!confirm('Are you sure you want to remove this like?')) return;
    
    try {
      const success = await removeLike(likeId);
      if (success) {
        // Reload likes for this post
        await loadPostLikes(postId);
        setError(null);
      } else {
        setError('Failed to remove like');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove like');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      caption: '',
      media_url: '',
      thumbnail: '',
      // New multi-image support
      media_urls: [],
      thumbnails: [],
      location: '',
      youtube_url: '',
      category: 'All Work',
      is_active: true
    });
    setEditingPost(null);
    setShowForm(false);
  };

  const handleEdit = (post: MediaPost) => {
    setFormData({
      title: post.title,
      caption: post.caption,
      media_url: post.media_url,
      thumbnail: post.thumbnail || '',
      // New multi-image support
      media_urls: post.media_urls || [],
      thumbnails: post.thumbnails || [],
      location: post.location || '',
      youtube_url: post.youtube_url || '',
      category: post.category || 'All Work',
      is_active: post.is_active !== false
    });
    setEditingPost(post);
    setShowForm(true);
  };

  const handleFileUpload = async (file: File, type: 'media' | 'thumbnail') => {
    try {
      setUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `latest-work/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      if (type === 'media') {
        setFormData(prev => ({ ...prev, media_url: publicUrl }));
      } else {
        setFormData(prev => ({ ...prev, thumbnail: publicUrl }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // New function for multi-image upload
  const handleMultiFileUpload = async (files: FileList, type: 'media' | 'thumbnail') => {
    if (files.length === 0) return;
    
    // Limit to 3 images
    const filesToUpload = Array.from(files).slice(0, 3);
    
    try {
      setUploading(true);
      const uploadPromises = filesToUpload.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `latest-work/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(filePath);

        return publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);

      if (type === 'media') {
        setFormData(prev => ({ 
          ...prev, 
          media_urls: [...prev.media_urls, ...uploadedUrls].slice(0, 3) // Ensure max 3 images
        }));
      } else {
        setFormData(prev => ({ 
          ...prev, 
          thumbnails: [...prev.thumbnails, ...uploadedUrls].slice(0, 3) // Ensure max 3 thumbnails
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Helper function to delete file from Supabase storage
  const deleteFileFromStorage = async (url: string) => {
    try {
      // Extract file path from Supabase URL
      const urlParts = url.split('/');
      const bucketName = 'media-uploads'; // Assuming this is your bucket name
      const fileName = urlParts[urlParts.length - 1];
      
      // Only delete if it's a Supabase storage URL
      if (url.includes('supabase') && url.includes('storage')) {
        const { error } = await supabase.storage
          .from(bucketName)
          .remove([fileName]);
        
        if (error) {
          console.error('Error deleting file from storage:', error);
        } else {
          console.log('File deleted successfully from storage:', fileName);
        }
      }
    } catch (error) {
      console.error('Error in deleteFileFromStorage:', error);
    }
  };

  // Remove image from multi-image array and delete from storage
  const removeImage = async (index: number, type: 'media' | 'thumbnail') => {
    if (type === 'media') {
      const urlToDelete = formData.media_urls[index];
      if (urlToDelete) {
        await deleteFileFromStorage(urlToDelete);
      }
      setFormData(prev => ({
        ...prev,
        media_urls: prev.media_urls.filter((_, i) => i !== index)
      }));
    } else {
      const urlToDelete = formData.thumbnails[index];
      if (urlToDelete) {
        await deleteFileFromStorage(urlToDelete);
      }
      setFormData(prev => ({
        ...prev,
        thumbnails: prev.thumbnails.filter((_, i) => i !== index)
      }));
    }
  };

  // Add new URL input field
  const addUrlField = (type: 'media' | 'thumbnail') => {
    if (type === 'media' && formData.media_urls.length < 3) {
      setFormData(prev => ({
        ...prev,
        media_urls: [...prev.media_urls, '']
      }));
    } else if (type === 'thumbnail' && formData.thumbnails.length < 3) {
      setFormData(prev => ({
        ...prev,
        thumbnails: [...prev.thumbnails, '']
      }));
    }
  };

  // Validate URL format
  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.caption.trim()) {
      setError('Title and caption are required');
      return;
    }

    // Check if we have either single media URL, multiple images, or YouTube URL
    const hasMedia = formData.media_url.trim() || 
                    (formData.media_urls && formData.media_urls.length > 0) || 
                    formData.youtube_url.trim();
    
    if (!hasMedia) {
      setError('Either media URL, multiple images, or YouTube URL is required');
      return;
    }

    try {
      setSubmitting(true);
      
      // Prepare media URLs - prioritize multi-image array if available
      const finalMediaUrls = formData.media_urls && formData.media_urls.length > 0 
        ? formData.media_urls 
        : (formData.media_url.trim() ? [formData.media_url.trim()] : null);
      
      const finalThumbnails = formData.thumbnails && formData.thumbnails.length > 0 
        ? formData.thumbnails 
        : (formData.thumbnail.trim() ? [formData.thumbnail.trim()] : null);
      
      const postData: CreateMediaPost | UpdateMediaPost = {
        title: formData.title.trim(),
        caption: formData.caption.trim(),
        media_type: 'latest_work',
        media_url: finalMediaUrls ? finalMediaUrls[0] : (formData.youtube_url.trim() || ''),
        thumbnail: finalThumbnails ? finalThumbnails[0] : null,
        // New multi-image support
        media_urls: finalMediaUrls,
        thumbnails: finalThumbnails,
        location: formData.location.trim() || null,
        youtube_url: formData.youtube_url.trim() || null,
        category: formData.category,
        is_active: formData.is_active
      };

      console.log('Submitting post data:', postData);

      if (editingPost) {
        await LatestWorkService.updateLatestWorkPost(editingPost.id, postData);
      } else {
        await LatestWorkService.createLatestWorkPost(postData as CreateMediaPost);
      }

      await refreshPosts();
      resetForm();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save post');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await LatestWorkService.deleteLatestWorkPost(postId);
      await refreshPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete post');
    }
  };

  const toggleActive = async (post: MediaPost) => {
    try {
      await LatestWorkService.updateLatestWorkPost(post.id, {
        is_active: !post.is_active
      });
      await refreshPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update post');
    }
  };

  const isYouTubeUrl = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  const validateAndExtractVideoId = (url: string) => {
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const handleAboutWorkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!aboutWorkFormData.video_title.trim() || !aboutWorkFormData.video_description.trim() || !aboutWorkFormData.youtube_video_id.trim()) {
      setError('All fields are required');
      return;
    }

    try {
      setAboutWorkLoading(true);

      // Here you would typically send the aboutWorkFormData to your backend
      // For now, we'll just simulate a successful update
      console.log('About Work Data:', aboutWorkFormData);

      // Reset form and close modal
      setAboutWorkFormData({
        video_title: '',
        video_description: '',
        youtube_video_id: ''
      });
      setShowAboutWorkModal(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update about work');
    } finally {
      setAboutWorkLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Work Manager</h2>
          <p className="text-sm text-gray-600 mt-1">
            {posts.length} total posts • {posts.filter(p => p.is_active).length} active • {posts.filter(p => !p.is_active).length} inactive
          </p>
          <p className="text-xs text-gray-500 mt-1 flex items-center space-x-4">
            <span className="flex items-center">
              <Heart className="h-3 w-3 mr-1 text-red-500" />
              {posts.reduce((total, post) => total + (post.like_count || 0), 0)} total likes
            </span>
            <span className="flex items-center">
              <MessageCircle className="h-3 w-3 mr-1 text-blue-500" />
              {posts.reduce((total, post) => total + (post.comment_count || 0), 0)} total comments
            </span>
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add
          </button>
          <button
            onClick={() => setShowAboutWorkModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {combinedError && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{combinedError}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-red-600 hover:text-red-700 text-sm underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">
                {editingPost ? 'Edit Post' : 'Add New Post'}
              </h3>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  onKeyDown={(e) => {
                    // Ensure space key works properly
                    if (e.key === ' ' || e.keyCode === 32) {
                      e.stopPropagation();
                      return true;
                    }
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter post title"
                  required
                />
              </div>

              {/* Caption */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Caption *
                </label>
                <textarea
                  value={formData.caption}
                  onChange={(e) => setFormData(prev => ({ ...prev, caption: e.target.value }))}
                  onKeyDown={(e) => {
                    // Ensure space key works properly and prevent any interference
                    if (e.key === ' ' || e.keyCode === 32) {
                      e.stopPropagation();
                      // Allow the default behavior for space
                      return true;
                    }
                  }}
                  onKeyPress={(e) => {
                    // Additional handler for space key press
                    if (e.key === ' ' || e.charCode === 32) {
                      e.stopPropagation();
                      return true;
                    }
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter post caption"
                  required
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  onKeyDown={(e) => {
                    // Ensure space key works properly
                    if (e.key === ' ' || e.keyCode === 32) {
                      e.stopPropagation();
                      return true;
                    }
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter location (optional)"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="All Work">All Work</option>
                  <option value="Weddings">Weddings</option>
                  <option value="Corporate">Corporate</option>
                  <option value="Portraits">Portraits</option>
                  <option value="Events">Events</option>
                </select>
              </div>

              {/* YouTube URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Youtube className="h-4 w-4 inline mr-1" />
                  YouTube URL
                </label>
                <input
                  type="url"
                  value={formData.youtube_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, youtube_url: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>

              {/* Multi-Image Upload */}
              {!formData.youtube_url && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Multiple Images (Up to 3)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files && files.length > 0) {
                          handleMultiFileUpload(files, 'media');
                        }
                      }}
                      className="hidden"
                      id="multi-media-upload"
                      disabled={uploading || formData.media_urls.length >= 3}
                    />
                    <label
                      htmlFor="multi-media-upload"
                      className={`cursor-pointer flex flex-col items-center ${
                        formData.media_urls.length >= 3 ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {uploading ? (
                        <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-2" />
                      ) : (
                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      )}
                      <span className="text-sm text-gray-600">
                        {uploading 
                          ? 'Uploading...' 
                          : formData.media_urls.length >= 3 
                            ? 'Maximum 3 images reached'
                            : `Click to upload images (${formData.media_urls.length}/3)`
                        }
                      </span>
                    </label>
                  </div>
                  
                  {/* Display uploaded images */}
                  {formData.media_urls.length > 0 && (
                    <div className="mt-4">
                      <div className="grid grid-cols-3 gap-2">
                        {formData.media_urls.map((url, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={url}
                              alt={`Upload ${index + 1}`}
                              className="w-full h-20 object-cover rounded border"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index, 'media')}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-green-600 mt-2">
                        ✓ {formData.media_urls.length} image{formData.media_urls.length > 1 ? 's' : ''} uploaded
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Single Media Upload (Legacy) */}
              {!formData.youtube_url && formData.media_urls.length === 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Or Single Media File
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'media');
                      }}
                      className="hidden"
                      id="single-media-upload"
                      disabled={uploading}
                    />
                    <label
                      htmlFor="single-media-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      {uploading ? (
                        <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-2" />
                      ) : (
                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      )}
                      <span className="text-sm text-gray-600">
                        {uploading ? 'Uploading...' : 'Click to upload single media file'}
                      </span>
                    </label>
                  </div>
                  {formData.media_url && (
                    <div className="mt-2">
                      <p className="text-sm text-green-600">✓ Media uploaded successfully</p>
                    </div>
                  )}
                </div>
              )}

              {/* Multiple Media URLs Input */}
              {!formData.youtube_url && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Multiple Image URLs (Up to 3)
                    </label>
                    {formData.media_urls.length < 3 && (
                      <button
                        type="button"
                        onClick={() => addUrlField('media')}
                        className="text-blue-600 hover:text-blue-700 text-sm flex items-center"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add URL
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {formData.media_urls.map((url, index) => (
                      <div key={index} className="flex space-x-2">
                        <div className="flex-1 relative">
                          <input
                            type="url"
                            value={url}
                            onChange={(e) => {
                              const newUrls = [...formData.media_urls];
                              newUrls[index] = e.target.value;
                              setFormData(prev => ({ ...prev, media_urls: newUrls }));
                            }}
                            className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              url && !isValidUrl(url) 
                                ? 'border-red-300 focus:ring-red-500' 
                                : 'border-gray-300'
                            }`}
                            placeholder={`Image URL ${index + 1} ${index === 0 ? '(required)' : '(optional)'}`}
                          />
                          {url && !isValidUrl(url) && (
                            <p className="text-red-500 text-xs mt-1">Please enter a valid URL</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(index, 'media')}
                          className="bg-red-100 hover:bg-red-200 text-red-600 px-3 py-2 rounded-lg transition-colors flex items-center"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    
                    {/* Show at least one input field */}
                    {formData.media_urls.length === 0 && (
                      <div className="flex space-x-2">
                        <input
                          type="url"
                          value=""
                          onChange={(e) => {
                            if (e.target.value.trim()) {
                              setFormData(prev => ({ ...prev, media_urls: [e.target.value.trim()] }));
                            }
                          }}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Image URL 1 (required)"
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* URL Preview */}
                  {formData.media_urls.length > 0 && (
                    <div className="mt-4">
                      <div className="grid grid-cols-3 gap-2">
                        {formData.media_urls.map((url, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={url}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-20 object-cover rounded border"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling.style.display = 'flex';
                              }}
                            />
                            <div className="hidden w-full h-20 bg-gray-200 rounded border items-center justify-center">
                              <span className="text-xs text-gray-500">Invalid URL</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeImage(index, 'media')}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-green-600 mt-2">
                        ✓ {formData.media_urls.length} URL{formData.media_urls.length > 1 ? 's' : ''} added
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Single Media URL (Legacy/Fallback) */}
              {!formData.youtube_url && formData.media_urls.length === 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Or Single Media URL
                  </label>
                  <input
                    type="url"
                    value={formData.media_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, media_url: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              )}

              {/* Multiple Thumbnail URLs */}
              {formData.media_urls.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thumbnail URLs (Optional - matches image order)
                  </label>
                  <div className="space-y-2">
                    {formData.media_urls.map((_, index) => (
                      <div key={index} className="flex space-x-2">
                        <div className="flex-1 relative">
                          <input
                            type="url"
                            value={formData.thumbnails[index] || ''}
                            onChange={(e) => {
                              const newThumbnails = [...formData.thumbnails];
                              newThumbnails[index] = e.target.value;
                              // Remove empty entries at the end
                              while (newThumbnails.length > 0 && !newThumbnails[newThumbnails.length - 1]) {
                                newThumbnails.pop();
                              }
                              setFormData(prev => ({ ...prev, thumbnails: newThumbnails }));
                            }}
                            className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              formData.thumbnails[index] && !isValidUrl(formData.thumbnails[index]) 
                                ? 'border-red-300 focus:ring-red-500' 
                                : 'border-gray-300'
                            }`}
                            placeholder={`Thumbnail URL for Image ${index + 1} (optional)`}
                          />
                          {formData.thumbnails[index] && !isValidUrl(formData.thumbnails[index]) && (
                            <p className="text-red-500 text-xs mt-1">Please enter a valid URL</p>
                          )}
                        </div>
                        {formData.thumbnails[index] && (
                          <button
                            type="button"
                            onClick={() => removeImage(index, 'thumbnail')}
                            className="bg-red-100 hover:bg-red-200 text-red-600 px-3 py-2 rounded-lg transition-colors flex items-center"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Thumbnail Upload for Multiple Images */}
                  <div className="mt-2">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files && files.length > 0) {
                          handleMultiFileUpload(files, 'thumbnail');
                        }
                      }}
                      className="hidden"
                      id="multi-thumbnail-upload"
                      disabled={uploading}
                    />
                    <label
                      htmlFor="multi-thumbnail-upload"
                      className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg cursor-pointer transition-colors flex items-center text-sm"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Thumbnail Files
                    </label>
                  </div>
                </div>
              )}

              {/* Single Thumbnail (Legacy/Fallback) */}
              {formData.media_urls.length === 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thumbnail (Optional)
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="url"
                      value={formData.thumbnail}
                      onChange={(e) => setFormData(prev => ({ ...prev, thumbnail: e.target.value }))}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Thumbnail URL"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'thumbnail');
                      }}
                      className="hidden"
                      id="single-thumbnail-upload"
                      disabled={uploading}
                    />
                    <label
                      htmlFor="single-thumbnail-upload"
                      className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg cursor-pointer transition-colors flex items-center"
                    >
                      <Upload className="h-4 w-4" />
                    </label>
                  </div>
                </div>
              )}

              {/* Form Summary */}
              {(formData.media_urls.length > 0 || formData.media_url || formData.youtube_url) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Post Summary</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    {formData.youtube_url ? (
                      <p>• YouTube video: {formData.youtube_url}</p>
                    ) : formData.media_urls.length > 0 ? (
                      <p>• {formData.media_urls.length} image{formData.media_urls.length > 1 ? 's' : ''} (slider will be shown)</p>
                    ) : formData.media_url ? (
                      <p>• Single image</p>
                    ) : null}
                    
                    {formData.thumbnails.length > 0 && (
                      <p>• {formData.thumbnails.length} custom thumbnail{formData.thumbnails.length > 1 ? 's' : ''}</p>
                    )}
                    
                    {formData.location && (
                      <p>• Location: {formData.location}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Active Status */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                  Active (visible to users)
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {editingPost ? 'Update' : 'Create'} Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* About Work Modal */}
      {showAboutWorkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">
                Edit About Work
              </h3>
              <button
                onClick={() => setShowAboutWorkModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAboutWorkSubmit} className="p-6 space-y-4">
              {/* Video Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video Title
                </label>
                <input
                  type="text"
                  value={aboutWorkFormData.video_title}
                  onChange={(e) => setAboutWorkFormData(prev => ({ ...prev, video_title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Video title for display"
                />
              </div>

              {/* Video Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video Description
                </label>
                <textarea
                  value={aboutWorkFormData.video_description}
                  onChange={(e) => setAboutWorkFormData(prev => ({ ...prev, video_description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Brief description of the video content"
                />
              </div>

              {/* YouTube Video ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  YouTube Video ID
                </label>
                <input
                  type="text"
                  value={aboutWorkFormData.youtube_video_id}
                  onChange={(e) => setAboutWorkFormData(prev => ({ ...prev, youtube_video_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter YouTube video ID"
                />
              </div>

              {/* Video Preview */}
              {aboutWorkFormData.youtube_video_id && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Video Preview
                  </label>
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <iframe
                      className="w-full h-full"
                      src={`https://www.youtube.com/embed/${validateAndExtractVideoId(aboutWorkFormData.youtube_video_id) || aboutWorkFormData.youtube_video_id}?rel=0&modestbranding=1&showinfo=0`}
                      title="Video Preview"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => setShowAboutWorkModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={aboutWorkLoading}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {aboutWorkLoading ? 'Updating...' : 'Update Content'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

{/* Posts List */}
<div className="p-4 sm:p-6">
  {loading && posts.length === 0 ? (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  ) : posts.length === 0 ? (
    <div className="text-center py-12">
      <div className="text-gray-400 mb-4">
        <ImageIcon className="h-16 w-16 mx-auto" />
      </div>
      <h3 className="text-md sm:text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
      <p className="text-sm sm:text-base text-gray-600 mb-4">Create your first latest work post to get started.</p>
      <button
        onClick={() => setShowForm(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Add First Post
      </button>
    </div>
  ) : (
    <div className="flex flex-wrap gap-4 sm:grid sm:grid-cols-2 sm:gap-6">
      {posts.map((post) => (
        <div key={post.id} className={`w-full sm:max-w-full border rounded-xl p-4 hover:shadow-md transition-shadow relative ${
          post.is_active 
            ? 'border-gray-300 bg-white' 
            : 'border-gray-200 bg-gray-50'
        }`}>
          {/* Inactive Badge */}
          {!post.is_active && (
            <div className="absolute top-2 right-2 z-10">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                <EyeOff className="h-3 w-3 mr-1" />
                Inactive
              </span>
            </div>
          )}
          {/* Use a flex-col for mobile, and sm:flex-row for desktop */}
          <div className="flex flex-col sm:flex-row sm:items-start">
            
            {/* Media Preview: Full width on mobile, fixed size on desktop */}
         <div className={`flex-shrink-0 w-full h-60 sm:w-60 sm:h-60 bg-gray-100 rounded-lg overflow-hidden mb-4 sm:mb-0 sm:mr-4 relative ${
           !post.is_active ? 'opacity-60' : ''
         }`}>
  {post.youtube_url && isYouTubeUrl(post.youtube_url) ? (
    <iframe
      src={`https://www.youtube.com/embed/${extractYouTubeId(post.youtube_url)}`}
      title="YouTube video"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      className="w-full h-full rounded-lg"
    ></iframe>
  ) : post.media_urls && post.media_urls.length > 1 ? (
    // Multi-image slider for admin preview
    <div className="w-full h-full">
      <MultiImageSlider
        images={post.media_urls}
        thumbnails={post.thumbnails || undefined}
        title={post.title}
        autoSlide={false} // Disable auto-slide in admin
        showDots={true}
        showArrows={true}
        className="w-full h-full"
      />
    </div>
  ) : post.primary_media_url || post.media_url ? (
    <img
      src={post.primary_thumbnail || post.thumbnail || post.primary_media_url || post.media_url}
      alt={post.title}
      className="w-full h-full object-cover"
    />
  ) : (
    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
      <ImageIcon className="h-12 w-12 sm:h-8 sm:w-8 text-gray-400" />
    </div>
  )}
  
  {/* Multi-image indicator */}
  {post.media_urls && post.media_urls.length > 1 && (
    <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs font-medium">
      {post.media_urls.length} images
    </div>
  )}
  
  {/* Inactive Overlay */}
  {!post.is_active && (
    <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
      <div className="bg-white bg-opacity-90 rounded-full p-2">
        <EyeOff className="h-6 w-6 text-gray-600" />
      </div>
    </div>
  )}
</div>

            {/* Post Info & Actions Wrapper */}
            <div className="flex-1 min-w-0">
              {/* Top section: Title, Caption, Location */}
              <div>
                <h3 className={`text-lg font-semibold truncate ${
                  post.is_active ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {post.title}
                  {!post.is_active && (
                    <span className="ml-2 text-xs text-red-600 font-normal">(Hidden from public)</span>
                  )}
                </h3>
                <p className={`text-sm mt-1 line-clamp-2 ${
                  post.is_active ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  {post.caption}
                </p>
                {post.location && (
                  <div className="flex items-center mt-2 text-sm text-gray-500">
                    <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                    <span>{post.location}</span>
                  </div>
                )}
              </div>
              
              {/* Bottom section: Stats and Action Buttons */}
              <div className="flex items-center justify-between mt-4">
                {/* Stats - Now clickable to expand */}
                <button
                  onClick={() => togglePostExpansion(post.id)}
                  className="flex items-center flex-wrap gap-x-3 gap-y-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <span className="flex items-center">
                    <Heart className="h-4 w-4 mr-1 text-red-500" />
                    {post.like_count || 0} likes
                  </span>
                  <span className="flex items-center">
                    <MessageCircle className="h-4 w-4 mr-1 text-blue-500" />
                    {post.comment_count || 0} comments
                  </span>
                  <span className="hidden xs:inline flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {new Date(post.created_at).toLocaleDateString()}
                  </span>
                  {expandedPost === post.id ? (
                    <ChevronUp className="h-4 w-4 ml-1" />
                  ) : (
                    <ChevronDown className="h-4 w-4 ml-1" />
                  )}
                </button>
                
                {/* Actions */}
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <button
                    onClick={() => toggleActive(post)}
                    className={`p-2 rounded-lg transition-colors ${
                      post.is_active 
                        ? 'text-green-600 hover:bg-green-50' 
                        : 'text-gray-400 hover:bg-gray-50'
                    }`}
                    title={post.is_active ? 'Active' : 'Inactive'}
                  >
                    {post.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => handleEdit(post)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Expanded Details Section */}
              {expandedPost === post.id && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Likes Section */}
                    <div className="bg-red-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-red-900 flex items-center">
                          <Heart className="h-4 w-4 mr-2 text-red-600" />
                          Likes ({post.like_count || 0})
                        </h4>
                        {loadingLikes[post.id] && (
                          <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                        )}
                      </div>
                      
                      {postLikes[post.id] && postLikes[post.id].length > 0 ? (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {postLikes[post.id].map((like) => (
                            <div key={like.id} className="flex items-center justify-between bg-white rounded p-2">
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                                  <Users className="h-3 w-3 text-red-600" />
                                </div>
                                <span className="text-sm font-medium">
                                  {like.user_profile?.name || 'Anonymous User'}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(like.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <button
                                onClick={() => handleRemoveLike(like.id, post.id)}
                                className="text-red-600 hover:text-red-800 p-1"
                                title="Remove like"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-red-600">No likes yet</p>
                      )}
                    </div>

                    {/* Comments Section */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-blue-900 flex items-center">
                          <MessageCircle className="h-4 w-4 mr-2 text-blue-600" />
                          Comments ({post.comment_count || 0})
                        </h4>
                        {loadingComments[post.id] && (
                          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        )}
                      </div>
                      
                      {postComments[post.id] && postComments[post.id].length > 0 ? (
                        <div className="space-y-3 max-h-40 overflow-y-auto">
                          {postComments[post.id].map((comment) => (
                            <div key={comment.id} className="bg-white rounded p-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                      <Users className="h-3 w-3 text-blue-600" />
                                    </div>
                                    <span className="text-sm font-medium">
                                      {comment.user_profile?.name || 'Anonymous User'}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {new Date(comment.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-700 ml-8">
                                    {comment.content}
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleDeleteComment(comment.id, post.id)}
                                  className="text-red-600 hover:text-red-800 p-1 ml-2"
                                  title="Delete comment"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-blue-600">No comments yet</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )}
</div>
      
    </div>
  );
};

export default LatestWorkManager;
