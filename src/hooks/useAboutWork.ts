import { useState, useEffect, useCallback } from 'react';
import { AboutWorkSection, CreateAboutWorkSection, UpdateAboutWorkSection } from '../types/AboutWork';
import { AboutWorkService } from '../services/aboutWorkService';

export const useAboutWork = () => {
  const [aboutWork, setAboutWork] = useState<AboutWorkSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch active about work section
  const fetchAboutWork = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await AboutWorkService.getActiveAboutWork();
      setAboutWork(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch about work section');
      console.error('Error fetching about work:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update about work section
  const updateAboutWork = useCallback(async (updates: UpdateAboutWorkSection) => {
    try {
      setError(null);
      const updatedData = await AboutWorkService.updateActiveAboutWork(updates);
      setAboutWork(updatedData);
      return updatedData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update about work section';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Create new about work section
  const createAboutWork = useCallback(async (data: CreateAboutWorkSection) => {
    try {
      setError(null);
      const newData = await AboutWorkService.createAboutWork(data);
      setAboutWork(newData);
      return newData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create about work section';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Get about work with fallback data
  const getAboutWorkWithFallback = useCallback((): AboutWorkSection => {
    if (aboutWork) {
      return aboutWork;
    }

    // Fallback data if no data is available
    return {
      id: 'fallback',
      title: 'See My Work in Action',
      description: 'Discover the passion and artistry behind every shot. Watch how I capture life\'s most precious moments, from intimate portraits to grand celebrations. Each frame tells a story, and every story deserves to be told beautifully.',
      youtube_video_id: 'cn6V_7I4U0g',
      video_title: 'Behind the Scenes: Wedding Photography',
      video_description: 'Watch how I capture the magic of your special day',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }, [aboutWork]);

  // Validate and extract YouTube video ID
  const validateAndExtractVideoId = useCallback((input: string): string | null => {
    return AboutWorkService.extractYouTubeVideoId(input);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchAboutWork();
  }, [fetchAboutWork]);

  return {
    aboutWork,
    loading,
    error,
    fetchAboutWork,
    updateAboutWork,
    createAboutWork,
    getAboutWorkWithFallback,
    validateAndExtractVideoId,
    isLoading: loading
  };
};