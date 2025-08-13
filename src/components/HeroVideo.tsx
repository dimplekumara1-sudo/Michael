import React, { useRef, useEffect, useState } from 'react';
import { Volume2, VolumeX, Play, Pause } from 'lucide-react';

interface HeroVideoProps {
  src: string;
  thumbnail?: string;
  className?: string;
}

const HeroVideo: React.FC<HeroVideoProps> = ({ src, thumbnail, className = '' }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true); // Start muted for better UX
  const [showControls, setShowControls] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedData = () => {
      setIsLoaded(true);
      // Try to play the video
      video.play().catch((error) => {
        console.log('Autoplay prevented:', error);
        setIsPlaying(false);
      });
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleVideoClick = () => {
    // Show controls temporarily when video is clicked
    setShowControls(true);
    setTimeout(() => setShowControls(false), 3000);
  };

  return (
    <div 
      className={`relative w-full h-full ${className}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-cover cursor-pointer"
        autoPlay
        loop
        muted={isMuted}
        playsInline
        poster={thumbnail}
        onClick={handleVideoClick}
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1
        }}
      >
        <source src={src} type="video/mp4" />
        <source src={src} type="video/webm" />
        <source src={src} type="video/ogg" />
        Your browser does not support the video tag.
      </video>

      {/* Video Controls Overlay */}
      <div 
        className={`absolute bottom-4 right-4 z-30 flex space-x-2 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Mute/Unmute Button */}
        <button
          onClick={toggleMute}
          className="bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-3 rounded-full transition-all duration-200 backdrop-blur-sm"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>

        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          className="bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-3 rounded-full transition-all duration-200 backdrop-blur-sm"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </button>
      </div>

      {/* Audio Indicator */}
      {!isMuted && isPlaying && (
        <div className="absolute top-4 right-4 z-30">
          <div className="bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
            <Volume2 className="h-4 w-4 inline mr-1" />
            Audio On
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      )}

      {/* Fallback Background Image */}
      {thumbnail && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${thumbnail})`,
            zIndex: 0
          }}
        />
      )}
    </div>
  );
};

export default HeroVideo;