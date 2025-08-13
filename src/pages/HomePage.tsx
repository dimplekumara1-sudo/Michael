import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Star, Users, Award, ArrowRight, Play, Heart, MessageCircle, Share2, QrCode, Upload, Pause, Volume2, VolumeX, Maximize2, X, Youtube } from 'lucide-react';
import { mockMediaPosts } from '../data/mockData';
import PortfolioCarousel from '../components/PortfolioCarousel';
import PortfolioCarouselSimple from '../components/PortfolioCarouselSimple';
import LatestWork from '../components/LatestWork';
import GridGallery from '../components/GridGallery';
import { useHeroMedia } from '../hooks/useHeroMedia';
import { useAboutWork } from '../hooks/useAboutWork';
import Footer from '../components/Footer';


const HomePage = () => {
  const { getHeroMediaWithFallback, isLoading } = useHeroMedia();
  const heroData = getHeroMediaWithFallback();
  
  // About My Work section data from backend
  const { getAboutWorkWithFallback, isLoading: aboutWorkLoading } = useAboutWork();
  const aboutWorkData = getAboutWorkWithFallback();
  
  // Video control states
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false); // Default unmuted
  const [volume, setVolume] = useState(1); // Default full volume
  const [showFullscreen, setShowFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false);
const [showThumbnail, setShowThumbnail] = useState(false); // New state to track thumbnail visibility

// Play/pause when user clicks button
const togglePlayPause = useCallback(() => {
  if (!videoRef.current) return;

  if (!isPlaying) {
    videoRef.current.play();
    setIsPlaying(true);
    setShowThumbnail(false); // Hide thumbnail when video starts playing
  } else {
    videoRef.current.pause();
    setIsPlaying(false);
  }
}, [isPlaying]);

// Track when video ends
useEffect(() => {
  if (!videoRef.current) return;

const handleEnded = () => {
  setIsPlaying(false);
  setHasPlayedOnce(true); // mark as watched
  setShowThumbnail(true); // Show thumbnail when video ends
};

  videoRef.current.addEventListener("ended", handleEnded);
  return () => {
    videoRef.current?.removeEventListener("ended", handleEnded);
  };
}, []);

// Optional: autoplay only once
useEffect(() => {
  if (videoRef.current && !hasPlayedOnce) {
    videoRef.current.play();
    setIsPlaying(true);
  }
}, [hasPlayedOnce]);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const openFullscreen = useCallback(() => {
    setShowFullscreen(true);
  }, []);

  const closeFullscreen = useCallback(() => {
    setShowFullscreen(false);
  }, []);

  // Set initial video properties when video loads
  useEffect(() => {
    if (videoRef.current && heroData.isVideo) {
      videoRef.current.muted = isMuted;
      if (isPlaying) {
        videoRef.current.play().catch(console.error);
      }
    }
  }, [heroData.isVideo, isMuted, isPlaying]);

  // Keyboard controls for fullscreen
  useEffect(() => {
const handleKeyPress = (e: KeyboardEvent) => {
  if (showFullscreen) {
    const video = document.querySelector('.fixed.inset-0 video') as HTMLVideoElement;
    
    // Only handle keyboard shortcuts if not typing in an input
    const activeElement = document.activeElement;
    const isTyping = activeElement && (
      (activeElement instanceof HTMLInputElement) || 
      (activeElement instanceof HTMLTextAreaElement) || 
      (activeElement.getAttribute('contenteditable') === 'true')
    );
    
    if (isTyping) return;
    
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        closeFullscreen();
        break;
      case ' ':
        // Only prevent default if not focused on video controls
        if (activeElement !== video) {
          e.preventDefault();
          if (video) {
            if (video.paused) {
              video.play();
            } else {
              video.pause();
            }
          }
        }
        break;
      case 'k':
      case 'K':
        e.preventDefault();
        if (video) {
          if (video.paused) {
            video.play();
          } else {
            video.pause();
          }
        }
        break;
      case 'm':
      case 'M':
        e.preventDefault();
        if (video) {
          if (isMuted) {
            video.muted = false;
            video.volume = volume > 0 ? volume : 0.5;
            setIsMuted(false);
          } else {
            video.muted = true;
            setIsMuted(true);
          }
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (video) {
          const newVolume = Math.min(1, video.volume + 0.1);
          video.volume = newVolume;
          setVolume(newVolume);
          setIsMuted(newVolume === 0);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (video) {
          const newVolume = Math.max(0, video.volume - 0.1);
          video.volume = newVolume;
          setVolume(newVolume);
          setIsMuted(newVolume === 0);
        }
        break;
      case 'f':
      case 'F':
        e.preventDefault();
        // Toggle browser fullscreen for the video
        if (video) {
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            video.requestFullscreen().catch(console.error);
          }
        }
        break;
    }
  }
};

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [showFullscreen, closeFullscreen, isMuted, volume]);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-black/50 z-10"></div>
        
        {/* Dynamic Hero Media Background */}
{heroData.isVideo ? (
  <>
    {!showThumbnail ? (
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay={!hasPlayedOnce} // Autoplay only once
        muted={isMuted}
        playsInline
        controls={false}
        onContextMenu={(e) => e.stopPropagation()} // Allow right-click on video
        onClick={(e) => e.stopPropagation()} // Prevent click propagation
      >
        <source src={heroData.media_url} type="video/mp4" />
      </video>
    ) : (
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${heroData.thumbnail || 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=1920'})`,
        }}
      ></div>
    )}
    
    {/* Video Controls */}
    <div className="absolute bottom-6 right-6 flex space-x-2 z-30">
      {/* Play/Pause Button */}
      <button
        onClick={togglePlayPause}
        className="p-3 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full transition-all duration-200 backdrop-blur-sm"
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
      </button>
      
      {/* Mute/Unmute Button */}
      <button
        onClick={toggleMute}
        className="p-3 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full transition-all duration-200 backdrop-blur-sm"
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      </button>
      
      {/* Fullscreen View Button */}
      <button
        onClick={openFullscreen}
        className="p-3 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full transition-all duration-200 backdrop-blur-sm"
        title="View Fullscreen"
      >
        <Maximize2 className="h-5 w-5" />
      </button>
    </div>
  </>
) : (
  <div
    className="absolute inset-0 bg-cover bg-center"
    style={{
      backgroundImage: `url(${heroData.media_url})`,
    }}
  ></div>
)}
        
        <div className="relative z-20 text-center text-white max-w-4xl mx-auto px-4">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            {heroData.title.includes('Perfect Moment') ? (
              <>
                Capture Every
                <span className="text-orange-400 block">Perfect Moment</span>
              </>
            ) : (
              <span className="text-orange-400">{heroData.title}</span>
            )}
          </h1>
          <p className="text-xl md:text-2xl mb-8 leading-relaxed opacity-90">
            {heroData.caption}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Book Your Event
            </Link>
            <Link
              to="/latest-work"
              className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-gray-900 px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300"
            >
              Latest Work
            </Link>
          </div>
        </div>

        {/* QR Code Access */}
      <div className="absolute bottom-8 left-8 z-20">
  <Link 
    to="/qr-scanner"
    className="flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-full hover:bg-white/30 transition-all duration-300 group"
    title="Scan QR Code for Gallery Access"
  >
    <QrCode className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
  </Link>
</div>

      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-600 text-white p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Camera className="h-8 w-8" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">500+</div>
              <div className="text-gray-600">Events Captured</div>
            </div>
            <div className="text-center">
              <div className="bg-orange-500 text-white p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">1000+</div>
              <div className="text-gray-600">Happy Clients</div>
            </div>
            <div className="text-center">
              <div className="bg-green-500 text-white p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">4.9</div>
              <div className="text-gray-600">Average Rating</div>
            </div>
            <div className="text-center">
              <div className="bg-purple-500 text-white p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">15</div>
              <div className="text-gray-600">Awards Won</div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Services</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From intimate portraits to grand celebrations, we capture the essence of every moment
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="group bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="h-50 bg-gradient-to-br from-pink-400 to-purple-600 relative overflow-hidden">
                <img
                  src="https://akshitphotography.com/wp-content/uploads/2023/08/15-1-scaled.jpg?auto=compress&cs=tinysrgb&w=400"
                  alt="Wedding Photography"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Wedding Photography</h3>
                <p className="text-gray-600 mb-4">
                  Capturing your special day with artistic flair and attention to every precious detail
                </p>
                <Link to="/contact" className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold">
                  Book Now <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="group bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="h-50 bg-gradient-to-br from-blue-400 to-indigo-600 relative overflow-hidden">
                <img
                  src="https://magica.in/media/posts/12/NK_PreWed_109.jpg?auto=compress&cs=tinysrgb&w=400"
                  alt="Corporate Events"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Pre-Wedding Shoots</h3>
                <p className="text-gray-600 mb-4">
                  Timeless portraits that celebrate your love story before the big day begins.
                </p>
                <Link to="/contact" className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold">
                  Book Now <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="group bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="h-50 bg-gradient-to-br from-green-400 to-teal-600 relative overflow-hidden">
                <img
                  src="https://cdn.pixabay.com/photo/2020/07/30/10/57/indian-woman-5450102_960_720.jpg?auto=compress&cs=tinysrgb&w=400"
                  alt="Portrait Sessions"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Portrait Sessions</h3>
                <p className="text-gray-600 mb-4">
                  Personal and professional portraits that reflect your unique personality and style
                </p>
                <Link to="/contact" className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold">
                  Book Now <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About My Work Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Content Section */}
            <div className="space-y-6">
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                <Youtube className="h-4 w-4 mr-2" />
                Behind the Lens
              </div>
              
              <h2 className="text-4xl font-bold text-gray-900 leading-tight">
                {aboutWorkData.title}
              </h2>
              
              <p className="text-lg text-gray-600 leading-relaxed">
                {aboutWorkData.description}
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mt-1">
                    <Camera className="h-3 w-3 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Professional Equipment</h3>
                    <p className="text-gray-600">State-of-the-art cameras and lighting for perfect shots</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mt-1">
                    <Star className="h-3 w-3 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Artistic Vision</h3>
                    <p className="text-gray-600">Unique perspective that captures emotion and beauty</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mt-1">
                    <Heart className="h-3 w-3 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Personal Touch</h3>
                    <p className="text-gray-600">Every session is tailored to your unique story</p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link
                  to="/latest-work"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 inline-flex items-center justify-center"
                >
                  Latest Work
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  to="/contact"
                  className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 inline-flex items-center justify-center"
                >
                  Book a Session
                </Link>
              </div>
            </div>
            
            {/* YouTube Video Section */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-6">
                <div className="aspect-video rounded-xl overflow-hidden bg-gray-100">
                  {/* YouTube Embed - Replace with actual video ID */}
                  <iframe
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${aboutWorkData.youtube_video_id}?rel=0&modestbranding=1&showinfo=0`}
                    title={aboutWorkData.video_title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
                
                <div className="mt-4 text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {aboutWorkData.video_title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {aboutWorkData.video_description}
                  </p>
                </div>
              </div>
              
              {/* Decorative Elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-600 rounded-full opacity-10"></div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-orange-500 rounded-full opacity-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio Carousel Section */}
      <PortfolioCarousel />

      {/* Latest Work Section */}
      <LatestWork limit={6} showViewAll={true} />

      {/* Grid Gallery Section */}
      <GridGallery />

      {/* QR Access Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8">
            <div className="flex justify-center mb-6">
              <div className="bg-blue-600 p-4 rounded-full">
                <QrCode className="h-8 w-8 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Quick Gallery Access
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Scan your personalized QR code to instantly access and download your event photos
            </p>
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <Camera className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">For Clients</h3>
                <p className="text-sm text-gray-600">
                  Received a QR code from us? Scan it here to access your private gallery
                </p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <Upload className="h-8 w-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Easy Download</h3>
                <p className="text-sm text-gray-600">
                  Download all your photos directly to your device via MEGA cloud storage
                </p>
              </div>
            </div>
            <Link
              to="/qr-scanner"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 transform hover:scale-105 inline-flex items-center"
            >
              <QrCode className="h-5 w-5 mr-2" />
              Scan QR Code
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-700">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Create Something Amazing?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Let's discuss your vision and bring it to life through stunning photography
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 transform hover:scale-105"
            >
              Get In Touch
            </Link>
            <Link
              to="/register"
              className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300"
            >
              Book Now
            </Link>
          </div>
        </div>
      </section>

      {/* Fullscreen Video Modal */}
      {showFullscreen && heroData.isVideo && (
        <div className="fixed inset-0 bg-black z-50">
          {/* Floating Close Button - Top Right */}
          <button
            onClick={closeFullscreen}
            className="fixed top-6 right-6 z-70 p-3 bg-black bg-opacity-60 hover:bg-opacity-80 text-white rounded-full transition-all duration-200 backdrop-blur-sm shadow-lg"
            title="Close Fullscreen (ESC)"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Floating Back to Homepage Button - Top Left */}
          <button
            onClick={closeFullscreen}
            className="fixed top-6 left-6 z-70 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all duration-200 backdrop-blur-sm flex items-center space-x-2 shadow-lg"
            title="Return to Homepage"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            <span className="text-sm font-medium">Back to Homepage</span>
          </button>

          {/* Video Title - Top Center */}
          <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-70 px-4 py-2 bg-black bg-opacity-60 text-white rounded-full backdrop-blur-sm shadow-lg">
            <h3 className="text-sm font-medium">{heroData.title}</h3>
          </div>

          {/* Fullscreen Video Container */}
          <div className="w-full h-full flex items-center justify-center">
            <video
              ref={(el) => {
                if (el && showFullscreen) {
                  // Set initial properties when fullscreen opens
                  el.muted = isMuted;
                  el.volume = volume;
                  if (isPlaying) {
                    el.play().catch(console.error);
                  } else {
                    el.pause();
                  }
                  
                  // Sync play/pause state with our controls
                  const handlePlay = () => setIsPlaying(true);
                  const handlePause = () => setIsPlaying(false);
                  const handleVolumeChange = () => {
                    setIsMuted(el.muted);
                    setVolume(el.volume);
                  };
                  
                  el.addEventListener('play', handlePlay);
                  el.addEventListener('pause', handlePause);
                  el.addEventListener('volumechange', handleVolumeChange);
                  
                  // Cleanup listeners
                  return () => {
                    el.removeEventListener('play', handlePlay);
                    el.removeEventListener('pause', handlePause);
                    el.removeEventListener('volumechange', handleVolumeChange);
                  };
                }
              }}
              className="max-w-full max-h-full object-contain"
              autoPlay
              muted={isMuted}
              loop
              playsInline
              controls
              style={{
                // Ensure video controls are always accessible
                pointerEvents: 'auto',
                zIndex: 60
              }}
              onContextMenu={(e) => e.stopPropagation()} // Allow right-click on video
              onClick={(e) => e.stopPropagation()} // Prevent click propagation
            >
              <source src={heroData.media_url} type="video/mp4" />
            </video>
          </div>

          {/* Keyboard Shortcuts Info - Bottom Right */}
          <div className="fixed bottom-6 right-6 z-70 px-3 py-2 bg-black bg-opacity-60 text-white rounded-lg backdrop-blur-sm shadow-lg">
            <div className="text-xs space-y-1">
              <div><kbd className="bg-gray-700 px-1 rounded">ESC</kbd> Close</div>
              <div><kbd className="bg-gray-700 px-1 rounded">SPACE</kbd> Play/Pause</div>
              <div><kbd className="bg-gray-700 px-1 rounded">M</kbd> Mute/Unmute</div>
              <div><kbd className="bg-gray-700 px-1 rounded">↑↓</kbd> Volume</div>
              <div><kbd className="bg-gray-700 px-1 rounded">F</kbd> Browser Fullscreen</div>
            </div>
          </div>

          {/* Background Click Handler - Only in empty areas */}
          <div 
            className="fixed inset-0 z-10"
            style={{ pointerEvents: 'none' }} // Disable pointer events by default
            onClick={closeFullscreen}
          />
          
          {/* Click-to-close areas - Only in corners and edges */}
          <div 
            className="fixed top-0 left-0 w-32 h-32 z-20 cursor-pointer"
            onClick={closeFullscreen}
            title="Click to close"
          />
          <div 
            className="fixed top-0 right-0 w-32 h-32 z-20 cursor-pointer"
            onClick={closeFullscreen}
            title="Click to close"
          />
          <div 
            className="fixed bottom-0 left-0 w-32 h-32 z-20 cursor-pointer"
            onClick={closeFullscreen}
            title="Click to close"
          />
          <div 
            className="fixed bottom-0 right-0 w-32 h-32 z-20 cursor-pointer"
            onClick={closeFullscreen}
            title="Click to close"
          />
        </div>
      )}
<Footer />
    </div>
  );
};

export default HomePage;
