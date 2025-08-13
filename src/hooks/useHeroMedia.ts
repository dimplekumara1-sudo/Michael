import { useState, useEffect } from 'react';
import { MediaPost } from '../types';
import { HeroMediaService } from '../services/heroMediaService';

export const useHeroMedia = () => {
  const [heroMedia, setHeroMedia] = useState<MediaPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHeroMedia = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const media = await HeroMediaService.getActiveHeroMedia();
      setHeroMedia(media);
    } catch (err) {
      console.error('Error fetching hero media:', err);
      setError('Failed to load hero media');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHeroMedia();
  }, []);

  const refreshHeroMedia = () => {
    fetchHeroMedia();
  };

  // Get hero media with fallback to default
  const getHeroMediaWithFallback = () => {
    if (heroMedia) {
      return {
        media_url: heroMedia.media_url,
        title: heroMedia.title,
        caption: heroMedia.caption,
        media_type: heroMedia.media_type,
        thumbnail: heroMedia.thumbnail,
        isVideo: heroMedia.media_url.includes('video') || 
                 heroMedia.media_url.includes('.mp4') || 
                 heroMedia.media_url.includes('.webm') ||
                 heroMedia.media_url.includes('.mov')
      };
    }

    // Return default fallback
    const defaultMedia = HeroMediaService.getDefaultHeroMedia();
    return {
      ...defaultMedia,
      media_type: 'hero' as const,
      thumbnail: null,
      isVideo: false
    };
  };

  return {
    heroMedia,
    isLoading,
    error,
    refreshHeroMedia,
    getHeroMediaWithFallback
  };
};