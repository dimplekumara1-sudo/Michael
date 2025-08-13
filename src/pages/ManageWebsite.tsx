import React, { useState, useEffect, useCallback } from 'react';
import { MediaPost, CreateMediaPost, UpdateMediaPost } from '../types';
import { Calendar, MapPin, Clock, Camera, Download, QrCode, Plus, Filter, Search, ExternalLink, Edit3, Trash2, Users, FileImage, Link, Copy, Check, X, AlertCircle, Phone, Mail, Image, Video, Home, Sliders, Monitor, Star, Play, Pause, Volume2, VolumeX, Youtube, MessageCircle, Grid as GridIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useAboutWork } from '../hooks/useAboutWork';
import { AboutWorkService } from '../services/aboutWorkService';
import Notification from '../components/Notification';
import { HeroMediaService } from '../services/heroMediaService';
import { MediaPostsService } from '../services/mediaPostsService';
import { useSliderMedia } from '../hooks/useSliderMedia';
import { HomepageGridService, HomepageGridImage } from '../services/homepageGridService';

type HomepageSection = 'grid' | 'slider';

const ManageWebsite = () => {
  const { user, profile, isLoading } = useAuth();
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
  } | null>(null);
  
  // Media management states
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [editingMedia, setEditingMedia] = useState<MediaPost | null>(null);
  const [mediaFilter, setMediaFilter] = useState<'all' | 'slider' | 'hero' | 'about'>('all');
  
  // About My Work section state
  const { 
    getAboutWorkWithFallback, 
    updateAboutWork, 
    loading: aboutWorkLoading,
    validateAndExtractVideoId 
  } = useAboutWork();
  const aboutWorkData = getAboutWorkWithFallback();
  const [showAboutWorkModal, setShowAboutWorkModal] = useState(false);
  const [aboutWorkFormData, setAboutWorkFormData] = useState({
    title: aboutWorkData.title,
    description: aboutWorkData.description,
    youtube_video_id: aboutWorkData.youtube_video_id,
    video_title: aboutWorkData.video_title,
    video_description: aboutWorkData.video_description
  });
  
  // Hero media states
  const [heroMedia, setHeroMedia] = useState<MediaPost[]>([]);
  const [activeHeroMedia, setActiveHeroMedia] = useState<MediaPost | null>(null);
  const [loadingHeroMedia, setLoadingHeroMedia] = useState(false);
  
  // Slider management states
  const { 
    sliderPosts, 
    activeSliderPosts, 
    fetchSliderPosts, 
    resetSliderContent,
    isLoading: loadingSliderPosts 
  } = useSliderMedia();
  
  // Grid management state
  const [gridItems, setGridItems] = useState<HomepageGridImage[]>([]);
  const [loadingGrid, setLoadingGrid] = useState(false);
  const [showGridModal, setShowGridModal] = useState(false);
  const [editingGridItem, setEditingGridItem] = useState<HomepageGridImage | null>(null);
  const [gridForm, setGridForm] = useState<{ image_url: string; title: string; section: HomepageSection; sort_order: number }>({
    image_url: '',
    title: '',
    section: 'grid',
    sort_order: 0,
  });
  
  const [mediaForm, setMediaForm] = useState<CreateMediaPost>({
    title: '',
    caption: '',
    media_type: 'hero',
    media_url: '',
    thumbnail: null,
    is_active: false
  });

  // Hero Media Functions
  const fetchHeroMedia = async () => {
    setLoadingHeroMedia(true);
    try {
      console.log('🎬 Fetching hero media...');
      const media = await HeroMediaService.getAllHeroMedia();
      console.log('✅ Hero media fetched:', media.length, 'items');
      setHeroMedia(media);
      
      // Set active hero media
      const active = media.find(m => m.is_active);
      setActiveHeroMedia(active || null);
    } catch (error) {
      console.error('Error fetching hero media:', error);
      setNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load hero media'
      });
    } finally {
      setLoadingHeroMedia(false);
    }
  };

  const setActiveHero = async (mediaId: string) => {
    try {
      console.log('🎯 Setting active hero media:', mediaId);
      const success = await HeroMediaService.setActiveHeroMedia(mediaId);
      
      if (success) {
        setNotification({
          type: 'success',
          title: 'Hero Media Updated',
          message: 'Active hero media updated successfully!'
        });
        await fetchHeroMedia();
      } else {
        throw new Error('Failed to set active hero media');
      }
    } catch (error) {
      console.error('Error setting active hero media:', error);
      setNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to set active hero media. Please try again.'
      });
    }
  };

  const deleteHeroMedia = async (mediaId: string) => {
    if (!confirm('Are you sure you want to delete this hero media? This action cannot be undone.')) {
      return;
    }

    try {
      console.log('🗑️ Deleting hero media:', mediaId);
      const success = await HeroMediaService.deleteHeroMedia(mediaId);
      
      if (success) {
        setNotification({
          type: 'success',
          title: 'Hero Media Deleted',
          message: 'Hero media deleted successfully!'
        });
        await fetchHeroMedia();
      } else {
        throw new Error('Failed to delete hero media');
      }
    } catch (error) {
      console.error('Error deleting hero media:', error);
      setNotification({
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete hero media. Please try again.'
      });
    }
  };

  // Slider Functions
  const deleteSliderPost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this slider item? This action cannot be undone.')) {
      return;
    }

    try {
      console.log('🗑️ Deleting slider post:', postId);
      const success = await MediaPostsService.deleteSliderPost(postId);
      
      if (success) {
        setNotification({
          type: 'success',
          title: 'Slider Item Deleted',
          message: 'Slider item deleted successfully!'
        });
        await fetchSliderPosts();
      } else {
        throw new Error('Failed to delete slider post');
      }
    } catch (error) {
      console.error('Error deleting slider post:', error);
      setNotification({
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete slider item. Please try again.'
      });
    }
  };

  const toggleSliderPostActive = async (postId: string, isActive: boolean) => {
    try {
      console.log('🔄 Toggling slider post active status:', postId, isActive);
      const success = await MediaPostsService.toggleSliderPostActive(postId, isActive);
      
      if (success) {
        setNotification({
          type: 'success',
          title: 'Status Updated',
          message: `Slider item ${isActive ? 'activated' : 'deactivated'} successfully!`
        });
        await fetchSliderPosts();
      } else {
        throw new Error('Failed to toggle slider post status');
      }
    } catch (error) {
      console.error('Error toggling slider post status:', error);
      setNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update slider item status. Please try again.'
      });
    }
  };

  // Create or update media post
  const saveMediaPost = async () => {
    try {
      setLoadingMedia(true);
      console.log('💾 Saving media post:', mediaForm);
      
      if (editingMedia) {
        // Update existing media post
        console.log('📝 Updating existing media post:', editingMedia.id);
        
        if (mediaForm.media_type === 'hero') {
          // Use HeroMediaService for hero media
          const success = await HeroMediaService.updateHeroMedia(editingMedia.id, {
            title: mediaForm.title,
            caption: mediaForm.caption,
            media_url: mediaForm.media_url,
            thumbnail: mediaForm.thumbnail,
            is_active: mediaForm.is_active
          });

          if (!success) {
            throw new Error('Failed to update hero media');
          }
        } else if (mediaForm.media_type === 'slider') {
          // Use MediaPostsService for slider media
          const success = await MediaPostsService.updateSliderPost(editingMedia.id, {
            title: mediaForm.title,
            caption: mediaForm.caption,
            media_url: mediaForm.media_url,
            thumbnail: mediaForm.thumbnail,
            is_active: mediaForm.is_active
          });

          if (!success) {
            throw new Error('Failed to update slider media');
          }
        }

        setNotification({
          type: 'success',
          title: 'Media Updated',
          message: 'Media post updated successfully!'
        });
      } else {
        // Create new media post
        console.log('➕ Creating new media post');
        
        if (mediaForm.media_type === 'hero') {
          // Use HeroMediaService for hero media
          const success = await HeroMediaService.createHeroMedia({
            title: mediaForm.title,
            caption: mediaForm.caption,
            media_url: mediaForm.media_url,
            thumbnail: mediaForm.thumbnail,
            is_active: mediaForm.is_active
          });

          if (!success) {
            throw new Error('Failed to create hero media');
          }
        } else if (mediaForm.media_type === 'slider') {
          // Use MediaPostsService for slider media
          const success = await MediaPostsService.createSliderPost({
            title: mediaForm.title,
            caption: mediaForm.caption,
            media_url: mediaForm.media_url,
            thumbnail: mediaForm.thumbnail,
            is_active: mediaForm.is_active
          });

          if (!success) {
            throw new Error('Failed to create slider media');
          }
        }

        setNotification({
          type: 'success',
          title: 'Media Created',
          message: 'Media post created successfully!'
        });
      }

      // Refresh data based on media type
      if (mediaForm.media_type === 'hero') {
        await fetchHeroMedia();
      } else if (mediaForm.media_type === 'slider') {
        await fetchSliderPosts();
      }

      // Close modal and reset form
      setShowMediaModal(false);
      setEditingMedia(null);
      setMediaForm({
        title: '',
        caption: '',
        media_type: 'hero',
        media_url: '',
        thumbnail: null,
        is_active: false
      });
    } catch (error) {
      console.error('Error saving media post:', error);
      setNotification({
        type: 'error',
        title: 'Save Failed',
        message: 'Failed to save media post. Please try again.'
      });
    } finally {
      setLoadingMedia(false);
    }
  };

  // Edit media post
  const editMediaPost = (media: MediaPost) => {
    setEditingMedia(media);
    setMediaForm({
      title: media.title,
      caption: media.caption,
      media_type: media.media_type as 'hero' | 'slider' | 'about',
      media_url: media.media_url,
      thumbnail: media.thumbnail,
      is_active: media.is_active || false
    });
    setShowMediaModal(true);
  };

  // Handle About Work form submission
  const handleAboutWorkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      console.log('💾 Updating About My Work section:', aboutWorkFormData);
      
      // Validate YouTube URL if provided
      if (aboutWorkFormData.youtube_video_id) {
        const videoId = validateAndExtractVideoId(aboutWorkFormData.youtube_video_id);
        if (!videoId) {
          setNotification({
            type: 'error',
            title: 'Invalid YouTube URL',
            message: 'Please provide a valid YouTube video URL or video ID.'
          });
          return;
        }
        aboutWorkFormData.youtube_video_id = videoId;
      }
      
      const success = await updateAboutWork(aboutWorkFormData);
      
      if (success) {
        setNotification({
          type: 'success',
          title: 'Content Updated',
          message: 'About My Work section updated successfully!'
        });
        setShowAboutWorkModal(false);
      } else {
        throw new Error('Failed to update about work content');
      }
    } catch (error) {
      console.error('Error updating about work:', error);
      setNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update About My Work section. Please try again.'
      });
    }
  };

  // Load data on component mount
  useEffect(() => {
    if (user && profile?.role === 'admin') {
      fetchHeroMedia();
      fetchSliderPosts();
      loadGrid();
    }
  }, [user, profile]);

  const loadGrid = async () => {
    try {
      setLoadingGrid(true);
      const items = await HomepageGridService.list();
      setGridItems(items);
    } catch (e) {
      console.error('Error loading homepage grid images', e);
      setNotification({ type: 'error', title: 'Load Failed', message: 'Failed to load grid images' });
    } finally {
      setLoadingGrid(false);
    }
  };

  // Update about work form data when aboutWorkData changes
  useEffect(() => {
    setAboutWorkFormData({
      title: aboutWorkData.title,
      description: aboutWorkData.description,
      youtube_video_id: aboutWorkData.youtube_video_id,
      video_title: aboutWorkData.video_title,
      video_description: aboutWorkData.video_description
    });
  }, [aboutWorkData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Website</h1>
              <p className="text-gray-600 mt-2">
                Manage your website's homepage content, hero media, and portfolio slider
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Home className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Homepage Management</h2>
                <button 
                  onClick={() => setShowMediaModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Media</span>
                </button>
              </div>

              {/* Media Type Filter */}
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">Filter:</span>
                <div className="flex space-x-2">
                  {[
                    { key: 'all', label: 'All', icon: FileImage },
                    { key: 'hero', label: 'Hero', icon: Monitor },
                    { key: 'about', label: 'Work', icon: Youtube },
                    { key: 'slider', label: 'Slider', icon: Sliders },
                    { key: 'grid', label: '', icon: GridIcon },
                  ].map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setMediaFilter(key as any)}
                      className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                        mediaFilter === key
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid Management Section */}
              {(mediaFilter === 'all' || mediaFilter === 'grid') && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <GridIcon className="h-5 w-5 text-indigo-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Homepage Grid Management</h3>
                    </div>
                    <button
                      onClick={() => {
                        setEditingGridItem(null);
                        setGridForm({ image_url: '', title: '', section: 'grid', sort_order: (gridItems.at(-1)?.sort_order ?? -1) + 1 });
                        setShowGridModal(true);
                      }}
                      className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Grid Image</span>
                    </button>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">
                    Manage images displayed in the "Grid" sections of your homepage gallery.
                  </p>

                  {loadingGrid ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                      <p className="text-gray-600 mt-2">Loading grid images...</p>
                    </div>
                  ) : gridItems.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
                      <GridIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No Grid Images</h4>
                      <p className="text-gray-600 mb-4">Add grid images to populate your homepage gallery.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {gridItems.filter(i => i.section === 'grid').map((item) => (
                        <div key={item.id} className="bg-white rounded-lg border overflow-hidden">
                          <div className="aspect-video bg-gray-100 relative">
                            <img src={item.image_url} alt={item.title || 'Grid image'} className="w-full h-full object-cover" />
                          </div>
                          <div className="p-3 flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900 text-sm">{item.title || 'Untitled'}</h4>
                              <p className="text-xs text-gray-500">Order: {item.sort_order}</p>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setEditingGridItem(item);
                                  setGridForm({ image_url: item.image_url, title: item.title || '', section: item.section, sort_order: item.sort_order });
                                  setShowGridModal(true);
                                }}
                                className="px-2 py-1 text-xs rounded bg-white border hover:bg-gray-50"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={async () => {
                                  if (!confirm('Delete this image?')) return;
                                  try {
                                    await HomepageGridService.remove(item.id);
                                    setNotification({ type: 'success', title: 'Deleted', message: 'Image deleted' });
                                    await loadGrid();
                                  } catch (e) {
                                    setNotification({ type: 'error', title: 'Delete Failed', message: 'Could not delete image' });
                                  }
                                }}
                                className="px-2 py-1 text-xs rounded bg-white border hover:bg-gray-50 text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Slider Row (Homepage Gallery) */}
                  <div className="mt-8">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Sliders className="h-5 w-5 text-orange-600" />
                        <h4 className="text-md font-semibold text-gray-900">Slider Row (Homepage Gallery)</h4>
                      </div>
                      <button
                        onClick={() => {
                          const sliderItems = gridItems.filter(i => i.section === 'slider');
                          const nextOrder = (sliderItems.at(-1)?.sort_order ?? -1) + 1;
                          setEditingGridItem(null);
                          setGridForm({ image_url: '', title: '', section: 'slider', sort_order: nextOrder });
                          setShowGridModal(true);
                        }}
                        className="flex items-center space-x-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Slider Image</span>
                      </button>
                    </div>

                    {loadingGrid ? (
                      <div className="text-center py-6">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600 mx-auto"></div>
                        <p className="text-gray-600 mt-2 text-sm">Loading slider images...</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {gridItems.filter(i => i.section === 'slider').map((item) => (
                          <div key={item.id} className="bg-white rounded-lg border overflow-hidden">
                            <div className="aspect-video bg-gray-100 relative">
                              <img src={item.image_url} alt={item.title || 'Slider image'} className="w-full h-full object-cover" />
                            </div>
                            <div className="p-3 flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-gray-900 text-sm">{item.title || 'Untitled'}</h4>
                                <p className="text-xs text-gray-500">Order: {item.sort_order}</p>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => {
                                    setEditingGridItem(item);
                                    setGridForm({ image_url: item.image_url, title: item.title || '', section: item.section, sort_order: item.sort_order });
                                    setShowGridModal(true);
                                  }}
                                  className="px-2 py-1 text-xs rounded bg-white border hover:bg-gray-50"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={async () => {
                                    if (!confirm('Delete this image?')) return;
                                    try {
                                      await HomepageGridService.remove(item.id);
                                      setNotification({ type: 'success', title: 'Deleted', message: 'Slider image deleted' });
                                      await loadGrid();
                                    } catch (e) {
                                      setNotification({ type: 'error', title: 'Delete Failed', message: 'Could not delete slider image' });
                                    }
                                  }}
                                  className="px-2 py-1 text-xs rounded bg-white border hover:bg-gray-50 text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                        {gridItems.filter(i => i.section === 'slider').length === 0 && (
                          <div className="text-center py-10 bg-white rounded-lg border-2 border-dashed border-gray-200 col-span-full">
                            <Sliders className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-600">No slider images yet. Click "Add Slider Image" to create one.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Hero Media Management Section */}
                {(mediaFilter === 'all' || mediaFilter === 'hero') && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Monitor className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Hero Media Management</h3>
                    </div>
                    <button
                      onClick={() => {
                        setMediaForm({
                          title: '',
                          caption: '',
                          media_type: 'hero',
                          media_url: '',
                          thumbnail: null,
                          is_active: heroMedia.length === 0 // Auto-activate if it's the first hero media
                        });
                        setShowMediaModal(true);
                      }}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Hero Media</span>
                    </button>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">
                    Manage the hero image or video that appears on your homepage. Only one hero media can be active at a time.
                  </p>

                  {/* Current Active Hero */}
                  {activeHeroMedia && (
                    <div className="bg-white rounded-lg p-4 mb-4 border-2 border-green-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Star className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">Currently Active Hero</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="w-24 h-16 bg-gray-100 rounded overflow-hidden relative group">
                          {activeHeroMedia.media_url.includes('video') || 
                           activeHeroMedia.media_url.includes('.mp4') || 
                           activeHeroMedia.media_url.includes('.webm') ? (
                            <>
                              <video 
                                src={activeHeroMedia.media_url} 
                                className="w-full h-full object-cover"
                                muted
                                loop
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                                <Video className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                              </div>
                            </>
                          ) : (
                            <img 
                              src={activeHeroMedia.thumbnail || activeHeroMedia.media_url} 
                              alt={activeHeroMedia.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{activeHeroMedia.title}</h4>
                          <p className="text-sm text-gray-600 line-clamp-1">{activeHeroMedia.caption}</p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => editMediaPost(activeHeroMedia)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteHeroMedia(activeHeroMedia.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* All Hero Media */}
                  {loadingHeroMedia ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading hero media...</p>
                    </div>
                  ) : heroMedia.length === 0 ? (
                    <div className="text-center py-8 bg-white rounded-lg border-2 border-dashed border-gray-300">
                      <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No Hero Media</h4>
                      <p className="text-gray-600 mb-4">
                        Add your first hero image or video to customize your homepage.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {heroMedia.map((media) => (
                        <div 
                          key={media.id} 
                          className={`bg-white rounded-lg border-2 overflow-hidden transition-all ${
                            media.is_active 
                              ? 'border-green-300 shadow-md' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="aspect-video bg-gray-100 relative group">
                            {media.media_url.includes('video') || 
                             media.media_url.includes('.mp4') || 
                             media.media_url.includes('.webm') ? (
                              <>
                                <video 
                                  src={media.media_url} 
                                  className="w-full h-full object-cover"
                                  muted
                                  loop
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const video = e.currentTarget.closest('.group')?.querySelector('video') as HTMLVideoElement;
                                        if (video) {
                                          if (video.paused) {
                                            video.play();
                                          } else {
                                            video.pause();
                                          }
                                        }
                                      }}
                                      className="p-2 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-all opacity-0 group-hover:opacity-100"
                                      title="Play/Pause"
                                    >
                                      <Play className="h-4 w-4 text-gray-700" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const video = e.currentTarget.closest('.group')?.querySelector('video') as HTMLVideoElement;
                                        if (video) {
                                          video.muted = !video.muted;
                                          const icon = e.currentTarget.querySelector('svg');
                                          if (icon) {
                                            icon.className = video.muted ? 'h-4 w-4 text-gray-700' : 'h-4 w-4 text-blue-600';
                                          }
                                        }
                                      }}
                                      className="p-2 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-all opacity-0 group-hover:opacity-100"
                                      title="Mute/Unmute"
                                    >
                                      <Volume2 className="h-4 w-4 text-gray-700" />
                                    </button>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <img 
                                src={media.thumbnail || media.media_url} 
                                alt={media.title}
                                className="w-full h-full object-cover"
                              />
                            )}
                            
                            {media.is_active && (
                              <div className="absolute top-2 left-2">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <Star className="h-3 w-3 mr-1" />
                                  Active
                                </span>
                              </div>
                            )}

                            <div className="absolute top-2 right-2 flex space-x-1">
                              <button
                                onClick={() => editMediaPost(media)}
                                className="p-1 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all"
                              >
                                <Edit3 className="h-4 w-4 text-gray-600" />
                              </button>
                              <button
                                onClick={() => deleteHeroMedia(media.id)}
                                className="p-1 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </button>
                            </div>
                          </div>

                          <div className="p-3">
                            <h4 className="font-medium text-gray-900 mb-1">{media.title}</h4>
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{media.caption}</p>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">
                                {new Date(media.created_at).toLocaleDateString()}
                              </span>
                              {!media.is_active && (
                                <button
                                  onClick={() => setActiveHero(media.id)}
                                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded-full hover:bg-blue-700 transition-colors"
                                >
                                  Set Active
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* About My Work Section Management */}
              {(mediaFilter === 'all' || mediaFilter === 'about') && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Youtube className="h-5 w-5 text-purple-600" />
                      <h3 className="text-lg font-semibold text-gray-900">About My Work Section</h3>
                    </div>
                    <button
                      onClick={() => {
                        // Sync form data with current about work data
                        setAboutWorkFormData({
                          title: aboutWorkData.title,
                          description: aboutWorkData.description,
                          youtube_video_id: aboutWorkData.youtube_video_id,
                          video_title: aboutWorkData.video_title,
                          video_description: aboutWorkData.video_description
                        });
                        setShowAboutWorkModal(true);
                      }}
                      className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <Edit3 className="h-4 w-4" />
                      <span>Edit Content</span>
                    </button>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">
                    Manage the "See My Work in Action" section content, including title, description, and YouTube video embedding.
                  </p>

                  {/* Current Content Preview */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="grid lg:grid-cols-2 gap-6">
                      {/* Content Preview */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900">{aboutWorkData.title}</h4>
                        <p className="text-sm text-gray-600 line-clamp-3">{aboutWorkData.description}</p>
                        <div className="flex space-x-2">
                          <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            <Camera className="h-3 w-3 mr-1" />
                            Professional Equipment
                          </span>
                          <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            Artistic Vision
                          </span>
                        </div>
                      </div>
                      
                      {/* Video Preview */}
                      <div className="space-y-3">
                        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                          <iframe
                            className="w-full h-full"
                            src={`https://www.youtube.com/embed/${aboutWorkData.youtube_video_id}?rel=0&modestbranding=1&showinfo=0`}
                            title={aboutWorkData.video_title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        </div>
                        <div className="text-center">
                          <h5 className="font-medium text-gray-900 text-sm">{aboutWorkData.video_title}</h5>
                          <p className="text-xs text-gray-600">{aboutWorkData.video_description}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Slider Management Section */}
              {(mediaFilter === 'all' || mediaFilter === 'slider') && (
                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Sliders className="h-5 w-5 text-orange-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Slider Management</h3>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={async () => {
                          if (window.confirm('This will remove ALL existing slider items. This action cannot be undone. Are you sure?')) {
                            try {
                              await resetSliderContent();
                              setNotification({
                                type: 'success',
                                title: 'Slider Reset',
                                message: 'All slider items have been removed successfully!'
                              });
                            } catch (error) {
                              console.error('Error resetting slider content:', error);
                              setNotification({
                                type: 'error',
                                title: 'Reset Failed',
                                message: 'Failed to reset slider content. Please try again.'
                              });
                            }
                          }
                        }}
                        className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Reset</span>
                      </button>
                      <button
                        onClick={() => {
                          setMediaForm({
                            title: '',
                            caption: '',
                            media_type: 'slider',
                            media_url: '',
                            thumbnail: null,
                            is_active: true
                          });
                          setEditingMedia(null);
                          setShowMediaModal(true);
                        }}
                        className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">
                    Manage the "See My Work" portfolio slider items that appear on your homepage. Control which items are active and visible to visitors.
                  </p>

                  {/* Slider Items Grid */}
                  {loadingSliderPosts ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                      <p className="text-gray-600 mt-2">Loading slider items...</p>
                    </div>
                  ) : sliderPosts.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
                      <Sliders className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No Slider Items</h4>
                      <p className="text-gray-600 mb-4">
                        Create your first slider item to showcase your portfolio on the homepage.
                      </p>
                      <button
                        onClick={() => {
                          setMediaForm({
                            title: '',
                            caption: '',
                            media_type: 'slider',
                            media_url: '',
                            thumbnail: null,
                            is_active: true
                          });
                          setEditingMedia(null);
                          setShowMediaModal(true);
                        }}
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add First Item</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {sliderPosts.map((slider) => (
                        <div 
                          key={slider.id} 
                          className={`bg-white rounded-lg border-2 overflow-hidden transition-all ${
                            slider.is_active 
                              ? 'border-green-300 shadow-md' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="aspect-video bg-gray-100 relative group">
                            <img 
                              src={slider.thumbnail || slider.media_url} 
                              alt={slider.title}
                              className="w-full h-full object-cover"
                            />
                            
                            {slider.is_active && (
                              <div className="absolute top-2 left-2">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <Star className="h-3 w-3 mr-1" />
                                  Active
                                </span>
                              </div>
                            )}

                            <div className="absolute top-2 right-2 flex space-x-1">
                              <button
                                onClick={() => {
                                  setEditingMedia(slider);
                                  setMediaForm({
                                    title: slider.title,
                                    caption: slider.caption,
                                    media_type: 'slider',
                                    media_url: slider.media_url,
                                    thumbnail: slider.thumbnail,
                                    is_active: slider.is_active || false
                                  });
                                  setShowMediaModal(true);
                                }}
                                className="p-1 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all"
                              >
                                <Edit3 className="h-4 w-4 text-gray-600" />
                              </button>
                              <button
                                onClick={() => deleteSliderPost(slider.id)}
                                className="p-1 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </button>
                            </div>
                          </div>

                          <div className="p-3">
                            <h4 className="font-medium text-gray-900 mb-1">{slider.title}</h4>
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{slider.caption}</p>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">
                                {new Date(slider.created_at).toLocaleDateString()}
                              </span>
                              <button
                                onClick={() => toggleSliderPostActive(slider.id, !slider.is_active)}
                                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                                  slider.is_active
                                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                }`}
                              >
                                {slider.is_active ? 'Deactivate' : 'Activate'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Active Slider Items Summary */}
                  {activeSliderPosts.length > 0 && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Star className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">
                          {activeSliderPosts.length} active slider item{activeSliderPosts.length !== 1 ? 's' : ''} currently visible on homepage
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Grid Modal */}
        {showGridModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{editingGridItem ? 'Edit Grid Image' : 'Add Grid Image'}</h3>
                  <button onClick={() => { setShowGridModal(false); setEditingGridItem(null); }} className="text-gray-400 hover:text-gray-600">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const urlPattern = /^(https?:\/\/).+/i;
                  if (!urlPattern.test(gridForm.image_url)) {
                    setNotification({ type: 'error', title: 'Invalid URL', message: 'Please enter a valid image URL (must start with http or https).' });
                    return;
                  }
                  try {
                    if (editingGridItem) {
                      await HomepageGridService.update(editingGridItem.id, gridForm);
                      setNotification({ type: 'success', title: 'Updated', message: 'Grid image updated.' });
                    } else {
                      await HomepageGridService.create(gridForm);
                      setNotification({ type: 'success', title: 'Created', message: 'Grid image added.' });
                    }
                    setShowGridModal(false);
                    setEditingGridItem(null);
                    await loadGrid();
                  } catch (e) {
                    setNotification({ type: 'error', title: 'Save Failed', message: 'Could not save grid image.' });
                  }
                }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                    <input
                      type="url"
                      required
                      value={gridForm.image_url}
                      onChange={(e) => setGridForm(prev => ({ ...prev, image_url: e.target.value }))}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title (optional)</label>
                    <input
                      type="text"
                      value={gridForm.title}
                      onChange={(e) => setGridForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                      <select
                        value={gridForm.section}
                        onChange={(e) => setGridForm(prev => ({ ...prev, section: e.target.value as HomepageSection }))}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="grid">Grid</option>
                        <option value="slider">Slider</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                      <input
                        type="number"
                        value={gridForm.sort_order}
                        onChange={(e) => setGridForm(prev => ({ ...prev, sort_order: parseInt(e.target.value || '0', 10) }))}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {gridForm.image_url && /^(https?:\/\/).+/i.test(gridForm.image_url) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
                      <div className="aspect-video bg-gray-100 rounded overflow-hidden">
                        <img src={gridForm.image_url} alt={gridForm.title || 'Preview'} className="w-full h-full object-cover" />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-end space-x-2 pt-2">
                    <button type="button" onClick={() => { setShowGridModal(false); setEditingGridItem(null); }} className="px-4 py-2 rounded-lg border">
                      Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Media Modal */}
        {showMediaModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingMedia ? 'Edit Media' : 'Add New Media'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowMediaModal(false);
                      setEditingMedia(null);
                      setMediaForm({
                        title: '',
                        caption: '',
                        media_type: 'hero',
                        media_url: '',
                        thumbnail: null,
                        is_active: false
                      });
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); saveMediaPost(); }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Media Type
                    </label>
                    <select
                      value={mediaForm.media_type}
                      onChange={(e) => setMediaForm(prev => ({ ...prev, media_type: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="hero">Hero Media (Homepage Background)</option>
                      <option value="slider">Slider Item (Portfolio Showcase)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={mediaForm.title}
                      onChange={(e) => setMediaForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter media title"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Caption/Description
                    </label>
                    <textarea
                      value={mediaForm.caption}
                      onChange={(e) => setMediaForm(prev => ({ ...prev, caption: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter media description"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Media URL
                    </label>
                    <input
                      type="url"
                      value={mediaForm.media_url}
                      onChange={(e) => setMediaForm(prev => ({ ...prev, media_url: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://example.com/image.jpg or video.mp4"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Thumbnail URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={mediaForm.thumbnail || ''}
                      onChange={(e) => setMediaForm(prev => ({ ...prev, thumbnail: e.target.value || null }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://example.com/thumbnail.jpg"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={mediaForm.is_active}
                      onChange={(e) => setMediaForm(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                      {mediaForm.media_type === 'hero' ? 'Set as Active Hero Media' : 'Set as Active Slider Item'}
                    </label>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowMediaModal(false);
                        setEditingMedia(null);
                        setMediaForm({
                          title: '',
                          caption: '',
                          media_type: 'hero',
                          media_url: '',
                          thumbnail: null,
                          is_active: false
                        });
                      }}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loadingMedia}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {loadingMedia ? 'Saving...' : (editingMedia ? 'Update Media' : 'Create Media')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* About Work Modal */}
        {showAboutWorkModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Edit About My Work Section</h3>
                  <button
                    onClick={() => setShowAboutWorkModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleAboutWorkSubmit} className="space-y-6">
                  <div className="grid lg:grid-cols-2 gap-6">
                    {/* Left Column - Text Content */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Section Title
                        </label>
                        <input
                          type="text"
                          value={aboutWorkFormData.title}
                          onChange={(e) => setAboutWorkFormData(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="e.g., See My Work in Action"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          value={aboutWorkFormData.description}
                          onChange={(e) => setAboutWorkFormData(prev => ({ ...prev, description: e.target.value }))}
                          rows={6}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Describe your work and approach..."
                          required
                        />
                      </div>
                    </div>

                    {/* Right Column - Video Content */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          YouTube Video URL or ID
                        </label>
                        <input
                          type="text"
                          value={aboutWorkFormData.youtube_video_id}
                          onChange={(e) => setAboutWorkFormData(prev => ({ ...prev, youtube_video_id: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="https://www.youtube.com/watch?v=VIDEO_ID or just VIDEO_ID"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Paste the full YouTube URL or just the video ID
                        </p>
                      </div>

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
                    </div>
                  </div>

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
          </div>
        )}

        {/* Notification */}
        {notification && (
          <Notification
            type={notification.type}
            title={notification.title}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}
      </div>
    </div>
  );
};

export default ManageWebsite;
