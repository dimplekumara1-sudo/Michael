import { useState, useEffect, useCallback } from 'react';
import { MediaPost } from '../types';
import { MediaPostsService } from '../services/mediaPostsService';

export const useSliderMedia = () => {
  const [sliderPosts, setSliderPosts] = useState<MediaPost[]>([]);
  const [activeSliderPosts, setActiveSliderPosts] = useState<MediaPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all slider posts
  const fetchSliderPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const posts = await MediaPostsService.getMediaPostsByType('slider');
      setSliderPosts(posts);
    } catch (err) {
      console.error('Error fetching slider posts:', err);
      setError('Failed to load slider posts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch active slider posts
  const fetchActiveSliderPosts = useCallback(async () => {
    try {
      setError(null);
      const posts = await MediaPostsService.getActiveSliderPosts();
      setActiveSliderPosts(posts);
    } catch (err) {
      console.error('Error fetching active slider posts:', err);
      setError('Failed to load active slider posts');
    }
  }, []);

  // Get slider posts with fallback to default items
  const getSliderPostsWithFallback = useCallback(() => {
    if (activeSliderPosts.length > 0) {
      return activeSliderPosts.map(post => {
        // Extract subtitle from caption (part before " - ")
        const subtitle = post.caption.includes(' - ') 
          ? post.caption.split(' - ')[0].trim()
          : post.caption.trim();
        
        return {
          id: parseInt(post.id.slice(-6), 16), // Convert UUID to number for compatibility
          image: post.media_url,
          title: post.title,
          subtitle: subtitle,
          category: post.title.toLowerCase().replace(/\s+/g, '-')
        };
      });
    }

    // Return empty array - all content should be managed from database
    return [];
  }, [activeSliderPosts]);

  // Initialize data on mount
  useEffect(() => {
    fetchSliderPosts();
    fetchActiveSliderPosts();
  }, [fetchSliderPosts, fetchActiveSliderPosts]);

  // Reset slider content (remove all sliders)
  const resetSliderContent = useCallback(async () => {
    try {
      await MediaPostsService.resetSliderContent();
      // Refresh data after reset
      await fetchSliderPosts();
      await fetchActiveSliderPosts();
    } catch (err) {
      console.error('Error resetting slider content:', err);
      setError('Failed to reset slider content');
    }
  }, [fetchSliderPosts, fetchActiveSliderPosts]);

  return {
    sliderPosts,
    activeSliderPosts,
    isLoading,
    error,
    fetchSliderPosts,
    fetchActiveSliderPosts,
    getSliderPostsWithFallback,
    resetSliderContent
  };
};