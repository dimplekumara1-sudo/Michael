import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Filter, 
  Search, 
  MapPin, 
  Calendar,
  Grid3X3,
  List,
  ChevronLeft,
  ChevronRight,
  X,
  Heart,
  MessageCircle,
  Share2,
  Send,
  Loader2,
  Play,
  Youtube,
  Maximize2,
  ZoomIn,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { useLatestWork } from '../hooks/useLatestWork';
import { useAuth } from '../contexts/AuthContext';
import { MediaPost, Comment } from '../types';
import { PostSkeleton, CommentSkeleton } from '../components/SkeletonLoader';
import LoginPrompt from '../components/LoginPrompt';
import MultiImageSlider from '../components/MultiImageSlider';
import { useToast } from '../contexts/ToastContext';

const POSTS_PER_PAGE = 12;

// YouTube helpers at module scope so they are available to PostViewer and this component
const isYouTubeUrl = (url: string) => {
  return !!url && (url.includes('youtube.com') || url.includes('youtu.be'));
};

const getYouTubeId = (url: string) => {
  if (!url) return '';
  try {
    if (url.includes('youtu.be/')) {
      return url.split('youtu.be/')[1]?.split('?')[0] || '';
    }
    if (url.includes('v=')) {
      return url.split('v=')[1]?.split('&')[0] || '';
    }
    if (url.includes('/embed/')) {
      return url.split('/embed/')[1]?.split(/[?&]/)[0] || '';
    }
    if (url.includes('/shorts/')) {
      return url.split('/shorts/')[1]?.split(/[?&]/)[0] || '';
    }
    return '';
  } catch {
    return '';
  }
};

const getYouTubeEmbedUrl = (url: string) => {
  const videoId = getYouTubeId(url);
  return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
};

const isYouTubeShorts = (url: string) => {
  if (!url) return false;
  return url.includes('/shorts/');
};

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  postTitle: string;
  onAddComment: (postId: string, content: string) => Promise<void>;
  getComments: (postId: string) => Promise<Comment[]>;
}

const CommentsModal: React.FC<CommentsModalProps> = ({
  isOpen,
  onClose,
  postId,
  postTitle,
  onAddComment,
  getComments
}) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && postId) {
      loadComments();
    }
  }, [isOpen, postId]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const commentsData = await getComments(postId);
      setComments(commentsData);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      await onAddComment(postId, newComment.trim());
      setNewComment('');
      await loadComments(); // Refresh comments
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Comments - {postTitle}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <CommentSkeleton key={index} />
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex space-x-3">
                  <div className="flex-shrink-0">
                    {comment.user_profile?.avatar ? (
                      <img
                        src={comment.user_profile.avatar}
                        alt={comment.user_profile.name}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {comment.user_profile?.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-sm text-gray-900">
                          {comment.user_profile?.name || 'Anonymous'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comment Form */}
        {user ? (
          <div className="border-t p-4">
            <form onSubmit={handleSubmitComment} className="flex space-x-3">
              <div className="flex-shrink-0">
                {user.user_metadata?.avatar ? (
                  <img
                    src={user.user_metadata.avatar}
                    alt="Your avatar"
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user.user_metadata?.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 flex space-x-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={submitting}
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || submitting}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="border-t p-4 text-center">
            <p className="text-gray-600 mb-3">Please log in to comment</p>
            <Link
              to="/login"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-block"
            >
              Log In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

// Instagram-style Post Viewer component
interface PostViewerProps {
  isOpen: boolean;
  onClose: () => void;
  initialPost: MediaPost | null;
  posts: MediaPost[];
  onLike: (postId: string) => Promise<void>;
  // Used only to trigger login prompt when not authenticated
  onComment: (postId: string) => void;
  onShare: (postId: string) => Promise<void>;
  getYouTubeEmbedUrl: (url: string) => string;
  isYouTubeUrl: (url: string) => boolean;
  // For inline comments inside the post viewer
  addComment: (postId: string, content: string) => Promise<void>;
  getComments: (postId: string) => Promise<Comment[]>;
  isAuthenticated: boolean;
}

const PostViewer: React.FC<PostViewerProps> = ({
  isOpen,
  onClose,
  initialPost,
  posts,
  onLike,
  onComment,
  onShare,
  getYouTubeEmbedUrl,
  isYouTubeUrl,
  addComment,
  getComments,
  isAuthenticated
}) => {
  const [currentPostIndex, setCurrentPostIndex] = useState<number>(-1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const postRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [isScrolling, setIsScrolling] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  // Inline comments state per post
  const commentsRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [openCommentsForIndex, setOpenCommentsForIndex] = useState<number | null>(null);
  const [commentsByPost, setCommentsByPost] = useState<Record<string, Comment[]>>({});
  const [commentsLoadingByPost, setCommentsLoadingByPost] = useState<Record<string, boolean>>({});
  const [newCommentByPost, setNewCommentByPost] = useState<Record<string, string>>({});
  const [commentSubmittingByPost, setCommentSubmittingByPost] = useState<Record<string, boolean>>({});
  // Video and YouTube players inside the viewer
  const viewerVideoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const ytPlayersRef = useRef<Record<string, any>>({});
  const ytAPIReadyRef = useRef<boolean>(false);

  // Set up the initial post when the viewer opens
  useEffect(() => {
    if (isOpen && initialPost) {
      const index = posts.findIndex(p => p.id === initialPost.id);
      if (index !== -1) {
        setCurrentPostIndex(index);
        // Reset scroll position
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = 0;
        }
        // Initialize/attach YouTube iframe players lazily for posts in view
        setTimeout(() => {
          const post = posts[index];
          if (post?.youtube_url) {
            const videoId = getYouTubeId(post.youtube_url);
            const el = document.getElementById(`yt-player-${post.id}`);
            if (el && (window as any).YT?.Player) {
              // Create player if not exists
              if (!ytPlayersRef.current[post.id]) {
                ytPlayersRef.current[post.id] = new (window as any).YT.Player(`yt-player-${post.id}`, {
                  videoId,
                  playerVars: { playsinline: 1, rel: 0 },
                  events: {
                    onStateChange: (e: any) => {
                      // Pause other players on play
                      if (e.data === (window as any).YT?.PlayerState?.PLAYING) {
                        Object.entries(ytPlayersRef.current).forEach(([id, player]) => {
                          if (id !== post.id) { try { player.pauseVideo && player.pauseVideo(); } catch {} }
                        });
                        // Pause native videos too
                        Object.values(viewerVideoRefs.current).forEach(v => { try { v?.pause(); } catch {} });
                      }
                    }
                  }
                });
              }
            }
          }
        }, 0);
      }
    }
  }, [isOpen, initialPost, posts]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        navigateToPreviousPost();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        navigateToNextPost();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentPostIndex, posts.length]);

  // Load YouTube IFrame API once
  useEffect(() => {
    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
    } else {
      ytAPIReadyRef.current = true;
    }

    (window as any).onYouTubeIframeAPIReady = () => {
      ytAPIReadyRef.current = true;
    };

    return () => {
      // optional: cleanup players on unmount/close
      if (!isOpen) {
        Object.values(ytPlayersRef.current).forEach(p => { try { p?.destroy && p.destroy(); } catch {} });
        ytPlayersRef.current = {} as any;
      }
    };
  }, [isOpen]);

  // Intersection Observer to detect which post is currently in view
  useEffect(() => {
    if (!isOpen || !scrollContainerRef.current) return;

    const options = {
      root: scrollContainerRef.current,
      rootMargin: '0px',
      threshold: 0.7, // Post is considered in view when 70% visible
    };

    const observer = new IntersectionObserver((entries) => {
      if (isScrolling) return;

      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = postRefs.current.findIndex(ref => ref === entry.target);
          if (index !== -1 && index !== currentPostIndex) {
            setCurrentPostIndex(index);
            // When a new post comes into view, stop all playing media for single-audio rule
            // Pause viewer videos
            Object.values(viewerVideoRefs.current).forEach(v => { try { v?.pause(); } catch {} });
            // Pause YouTube players
            Object.values(ytPlayersRef.current).forEach(player => { try { player?.pauseVideo && player.pauseVideo(); } catch {} });
          }
        }
      });
    }, options);

    // Observe all post elements
    postRefs.current.forEach((ref, index) => {
      if (ref) {
        observer.observe(ref);
        // Try to instantiate YouTube players for visible posts
        const post = posts[index];
        if (post?.youtube_url) {
          const el = document.getElementById(`yt-player-${post.id}`);
          const videoId = post.youtube_url ? getYouTubeId(post.youtube_url) : undefined;
          if (el && videoId && (window as any).YT?.Player && !ytPlayersRef.current[post.id]) {
            ytPlayersRef.current[post.id] = new (window as any).YT.Player(`yt-player-${post.id}`, {
              videoId,
              playerVars: { playsinline: 1, rel: 0 },
              events: {
                onStateChange: (e: any) => {
                  if (e.data === (window as any).YT?.PlayerState?.PLAYING) {
                    // Pause all other players
                    Object.entries(ytPlayersRef.current).forEach(([id, player]) => {
                      if (id !== post.id) { try { player.pauseVideo && player.pauseVideo(); } catch {} }
                    });
                    // Pause native videos
                    Object.values(viewerVideoRefs.current).forEach(v => { try { v?.pause(); } catch {} });
                  }
                }
              }
            });
          }
        }
      }
    });

    return () => observer.disconnect();
  }, [isOpen, posts.length, isScrolling, currentPostIndex]);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || isScrolling) return;
    
    setIsScrolling(true);
    setTimeout(() => setIsScrolling(false), 150); // Debounce
  }, [isScrolling]);

  // Navigate to specific post
  const scrollToPost = useCallback((index: number) => {
    if (index >= 0 && index < posts.length && postRefs.current[index]) {
      postRefs.current[index]?.scrollIntoView({ behavior: 'smooth' });
      setCurrentPostIndex(index);
    }
  }, [posts.length]);

  const navigateToNextPost = useCallback(() => {
    if (posts.length === 0) return;
    // Loop to first after last
    const nextIndex = (currentPostIndex + 1) % posts.length;
    scrollToPost(nextIndex);
  }, [currentPostIndex, posts.length, scrollToPost]);

  const navigateToPreviousPost = useCallback(() => {
    if (posts.length === 0) return;
    // Loop to last when going back from first
    const prevIndex = (currentPostIndex - 1 + posts.length) % posts.length;
    scrollToPost(prevIndex);
  }, [currentPostIndex, posts.length, scrollToPost]);

  // Touch handlers for swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isSwipeDown = distance < -50;
    const isSwipeUp = distance > 50;
    
    if (isSwipeUp) {
      navigateToNextPost();
    } else if (isSwipeDown) {
      navigateToPreviousPost();
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Inline comments helpers for the post viewer
  const loadCommentsFor = useCallback(async (postId: string) => {
    setCommentsLoadingByPost(prev => ({ ...prev, [postId]: true }));
    try {
      const data = await getComments(postId);
      setCommentsByPost(prev => ({ ...prev, [postId]: data }));
    } catch (err) {
      console.error('Failed to load comments for post', postId, err);
    } finally {
      setCommentsLoadingByPost(prev => ({ ...prev, [postId]: false }));
    }
  }, [getComments]);

  const openComments = useCallback(async (index: number) => {
    setOpenCommentsForIndex(index);
    const postId = posts[index]?.id;
    if (!postId) return;
    if (!commentsByPost[postId]) {
      await loadCommentsFor(postId);
    }
    // Scroll the comments panel into view
    setTimeout(() => {
      commentsRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, [posts, commentsByPost, loadCommentsFor]);

  const handleInlineCommentChange = useCallback((postId: string, value: string) => {
    setNewCommentByPost(prev => ({ ...prev, [postId]: value }));
  }, []);

  const handleInlineCommentSubmit = useCallback(async (postId: string) => {
    const content = (newCommentByPost[postId] || '').trim();
    if (!content) return;
    if (commentSubmittingByPost[postId]) return;
    setCommentSubmittingByPost(prev => ({ ...prev, [postId]: true }));
    try {
      await addComment(postId, content);
      setNewCommentByPost(prev => ({ ...prev, [postId]: '' }));
      await loadCommentsFor(postId);
    } catch (err) {
      console.error('Failed to submit comment for post', postId, err);
    } finally {
      setCommentSubmittingByPost(prev => ({ ...prev, [postId]: false }));
    }
  }, [addComment, newCommentByPost, commentSubmittingByPost, loadCommentsFor]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-90 z-50 overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 bg-black/40 hover:bg-black/60 rounded-full transition-colors"
      >
        <X className="h-6 w-6 text-white" />
      </button>

      {/* Navigation buttons */}
      <button
        onClick={navigateToPreviousPost}
        className="absolute top-1/2 left-4 z-40 p-2 bg-black/40 hover:bg-black/60 rounded-full transition-colors transform -translate-y-1/2 md:flex hidden"
      >
        <ArrowUp className="h-6 w-6 text-white" />
      </button>

      <button
        onClick={navigateToNextPost}
        className="absolute top-1/2 right-4 z-40 p-2 bg-black/40 hover:bg-black/60 rounded-full transition-colors transform -translate-y-1/2 md:flex hidden"
      >
        <ArrowDown className="h-6 w-6 text-white" />
      </button>

      {/* Scrollable container for posts */}
      <div 
        ref={scrollContainerRef}
        className="h-full w-full overflow-y-auto snap-y snap-mandatory"
        onScroll={handleScroll}
      >
        {posts.map((post, index) => (
          <div 
            key={post.id}
            ref={el => postRefs.current[index] = el}
            className="min-h-screen w-full flex flex-col md:flex-row items-center justify-center p-4 md:p-8 snap-start gap-8"
          >
            {/* Media container */}
            <div className="w-full md:w-7/12 lg:w-8/12 flex items-center justify-center">
              {post.youtube_url && isYouTubeUrl(post.youtube_url) ? (
                <div className={`w-full ${isYouTubeShorts(post.youtube_url) ? 'aspect-[9/16] md:aspect-[9/16]' : 'aspect-video md:aspect-video'} bg-black rounded-none md:rounded-lg overflow-hidden md:shadow-2xl`}>
                  <div id={`yt-player-${post.id}`} className="w-full h-full" />
                </div>
              ) : post.media_type === 'video' ? (
                <div className="w-full h-auto md:h-[80vh] bg-black rounded-none md:rounded-lg overflow-hidden md:shadow-2xl">
                  <video
                    ref={(el) => (viewerVideoRefs.current[post.id] = el)}
                    src={post.primary_media_url || post.media_url}
                    poster={post.primary_thumbnail || post.thumbnail || undefined}
                    className="w-full h-full object-contain"
                    controls
                    playsInline
                    preload="metadata"
                    style={{ WebkitTouchCallout: 'none' }}
                    onPlay={() => {
                      // Pause other viewer videos
                      Object.entries(viewerVideoRefs.current).forEach(([id, v]) => {
                        if (id !== post.id && v) {
                          try { v.pause(); } catch {}
                        }
                      });
                      // Pause YouTube players
                      Object.entries(ytPlayersRef.current).forEach(([id, player]) => {
                        try { player.pauseVideo && player.pauseVideo(); } catch {}
                      });
                    }}
                  />
                </div>
              ) : post.media_urls && post.media_urls.length > 1 ? (
                <div className="w-full h-auto md:h-[80vh] bg-black rounded-none md:rounded-lg overflow-hidden md:shadow-2xl">
                  <MultiImageSlider
                    images={post.media_urls}
                    thumbnails={post.thumbnails || undefined}
                    title={post.title}
                    autoSlide={false}
                    showDots={true}
                    showArrows={true}
                    className="w-full h-full"
                    isModal={true}
                  />
                </div>
              ) : (
                <div className="w-full flex items-center justify-center">
                  <img
                    src={post.primary_media_url || post.media_url}
                    alt={post.title}
                    className="w-full h-full object-contain md:rounded-lg md:shadow-2xl"
                  />
                </div>
              )}
            </div>

            {/* Post details */}
            <div className="w-full md:w-5/12 lg:w-4/12 bg-white/10 backdrop-blur-md rounded-lg p-6 mt-4 md:mt-0 text-white">
              <h2 className="text-2xl font-bold mb-2">{post.title}</h2>
              
              {post.location && (
                <div className="flex items-center mb-4 text-gray-300">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{post.location}</span>
                </div>
              )}
              
              <p className="text-gray-200 mb-6">{post.caption}</p>
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-6">
                  {/* Like Button */}
                  <button 
                    onClick={() => onLike(post.id)}
                    className={`flex items-center space-x-2 transition-colors ${
                      post.user_has_liked 
                        ? 'text-red-500 hover:text-red-400' 
                        : 'text-gray-300 hover:text-red-500'
                    }`}
                  >
                    <Heart 
                      className={`h-6 w-6 ${post.user_has_liked ? 'fill-current' : ''}`} 
                    />
                    <span>{post.like_count || 0}</span>
                  </button>

                  {/* Comment Button */}
                  <button 
                    onClick={() => onComment(post.id)}
                    className="flex items-center space-x-2 text-gray-300 hover:text-blue-400 transition-colors"
                  >
                    <MessageCircle className="h-6 w-6" />
                    <span>{post.comment_count || 0}</span>
                  </button>

                  {/* Share Button */}
                  <button 
                    onClick={() => onShare(post.id)}
                    className="flex items-center space-x-2 text-gray-300 hover:text-green-400 transition-colors"
                  >
                    <Share2 className="h-6 w-6" />
                    <span>Share</span>
                  </button>
                </div>
              </div>
              
              <div className="flex items-center text-sm text-gray-400 space-x-2 mt-4 pt-4 border-t border-white/20">
                <Calendar className="h-4 w-4" />
                <span>{new Date(post.created_at).toLocaleDateString()}</span>
              </div>

              {/* Inline comments panel under the post (mobile shows when opened) */}
              {openCommentsForIndex === index && (
                <div ref={el => commentsRefs.current[index] = el} className="mt-4">
                  {/* Comments List */}
                  {commentsLoadingByPost[post.id] ? (
                    <div className="space-y-3 py-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <CommentSkeleton key={i} />
                      ))}
                    </div>
                  ) : (commentsByPost[post.id]?.length || 0) === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>No comments yet. Be the first to comment!</p>
                    </div>
                  ) : (
                    <div className="space-y-4 py-4">
                      {commentsByPost[post.id]?.map((comment) => (
                        <div key={comment.id} className="flex space-x-3">
                          <div className="flex-shrink-0">
                            {comment.user_profile?.avatar ? (
                              <img src={comment.user_profile.avatar} alt={comment.user_profile.name} className="h-8 w-8 rounded-full object-cover" />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                                <span className="text-white text-sm font-medium">{comment.user_profile?.name?.charAt(0).toUpperCase() || 'U'}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-medium text-sm text-gray-900">{comment.user_profile?.name || 'Anonymous'}</span>
                                <span className="text-xs text-gray-500">{new Date(comment.created_at).toLocaleDateString()}</span>
                              </div>
                              <p className="text-gray-700 text-sm">{comment.content}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Comment Form */}
                  {isAuthenticated ? (
                    <div className="border-t border-white/20 pt-4">
                      <form onSubmit={(e) => { e.preventDefault(); handleInlineCommentSubmit(post.id); }} className="flex space-x-3">
                        <input
                          type="text"
                          value={newCommentByPost[post.id] || ''}
                          onChange={(e) => handleInlineCommentChange(post.id, e.target.value)}
                          placeholder="Write a comment..."
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                          disabled={commentSubmittingByPost[post.id]}
                        />
                        <button
                          type="submit"
                          disabled={!(newCommentByPost[post.id] || '').trim() || commentSubmittingByPost[post.id]}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                        >
                          {commentSubmittingByPost[post.id] ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </button>
                      </form>
                    </div>
                  ) : (
                    <div className="border-t border-white/10 p-4 text-center">
                      <p className="text-gray-300 mb-3">Please log in to comment</p>
                      <Link to="/login" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-block">Log In</Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const LatestWorkGallery: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [loginPromptAction, setLoginPromptAction] = useState<'like' | 'comment'>('like');
  const [selectedPost, setSelectedPost] = useState<MediaPost | null>(null);
  const [allPosts, setAllPosts] = useState<MediaPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<MediaPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedPostForComments, setSelectedPostForComments] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImagePost, setSelectedImagePost] = useState<MediaPost | null>(null);
  const [showPostViewer, setShowPostViewer] = useState(false);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});

  // Get all posts without limit
  const { posts, loading: postsLoading, toggleLike, addComment, getComments, copyShareUrl } = useLatestWork();

  useEffect(() => {
    if (!postsLoading) {
      setAllPosts(posts);
      setLoading(false);
    }
  }, [posts, postsLoading]);

  // Handle URL parameters for direct post access
  useEffect(() => {
    const postId = searchParams.get('post');
    if (postId && allPosts.length > 0) {
      const post = allPosts.find(p => p.id === postId);
      if (post) {
        setSelectedPost(post);
        setShowPostViewer(true);
      }
    }
  }, [searchParams, allPosts]);

  // Filter posts based on search, location, and category
  useEffect(() => {
    let filtered = allPosts;

    if (searchTerm) {
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.caption.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (post.location && post.location.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (locationFilter) {
      filtered = filtered.filter(post => 
        post.location && post.location.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    if (categoryFilter && categoryFilter !== 'All Work') {
      filtered = filtered.filter(post => 
        post.category === categoryFilter
      );
    }

    setFilteredPosts(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [allPosts, searchTerm, locationFilter, categoryFilter]);

  // Get unique locations for filter dropdown
  const uniqueLocations = Array.from(
    new Set(allPosts.filter(post => post.location).map(post => post.location))
  ).sort();

  // Get unique categories for filter dropdown
  const uniqueCategories = Array.from(
    new Set(allPosts.filter(post => post.category).map(post => post.category))
  ).sort();

  // Pagination
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const paginatedPosts = filteredPosts.slice(startIndex, startIndex + POSTS_PER_PAGE);

  const handleLike = async (postId: string) => {
    if (!user) {
      setLoginPromptAction('like');
      setShowLoginPrompt(true);
      return;
    }
    await toggleLike(postId);
  };

  const handleComment = (postId: string) => {
    if (!user) {
      setLoginPromptAction('comment');
      setShowLoginPrompt(true);
      return;
    }
    // Open comments modal
    setSelectedPostForComments(postId);
    setShowCommentsModal(true);
  };

  const handleShare = async (postId: string) => {
    try {
      const success = await copyShareUrl(postId);
      if (success) {
        showSuccess('Link Copied!', 'Share link has been copied to your clipboard');
      } else {
        showError('Copy Failed', 'Unable to copy link to clipboard');
      }
    } catch (error) {
      showError('Share Error', 'Failed to generate share link');
    }
  };

  const handleVideoPlay = (postId: string) => {
    const video = videoRefs.current[postId];
    if (video) {
      if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
    }
  };

  const handleImageClick = (post: MediaPost) => {
    setSelectedPost(post);
    setShowPostViewer(true);
    // Update URL for sharing
    setSearchParams({ post: post.id });
  };

  const closePostViewer = () => {
    setShowPostViewer(false);
    setSelectedPost(null);
    setSearchParams({});
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setSelectedImagePost(null);
  };

  // Keyboard support for image modal
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (showImageModal && e.key === 'Escape') {
        closeImageModal();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [showImageModal]);

  const isYouTubeUrl = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  const getYouTubeId = (url: string) => {
    return url.includes('youtu.be') 
      ? url.split('youtu.be/')[1]?.split('?')[0]
      : url.split('v=')[1]?.split('&')[0];
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = getYouTubeId(url);
    return `https://www.youtube.com/embed/${videoId}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Latest Work</h1>
            <p className="text-xl text-gray-600">Explore our complete collection of recent projects</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 12 }).map((_, index) => (
              <PostSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Latest Work</h1>
          <p className="text-xl text-gray-600">
            Explore our complete collection of recent projects ({filteredPosts.length} posts)
          </p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 md:gap-4">
              {/* Category Filter */}
              <div className="relative flex-1 min-w-[120px]">
                <Filter className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full pl-8 pr-6 py-1.5 md:py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="">All Categories</option>
                  {uniqueCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Location Filter */}
              <div className="relative flex-1 min-w-[120px]">
                <MapPin className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full pl-8 pr-6 py-1.5 md:py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="">All Locations</option>
                  {uniqueLocations.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 md:p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 md:p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {(searchTerm || locationFilter || categoryFilter) && (
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-200">
              <span className="text-sm text-gray-600">Active filters:</span>
              {searchTerm && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Search: "{searchTerm}"
                  <button
                    onClick={() => setSearchTerm('')}
                    className="ml-1 hover:text-blue-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {categoryFilter && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Category: {categoryFilter}
                  <button
                    onClick={() => setCategoryFilter('')}
                    className="ml-1 hover:text-purple-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {locationFilter && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Location: {locationFilter}
                  <button
                    onClick={() => setLocationFilter('')}
                    className="ml-1 hover:text-green-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Posts Grid/List */}
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto">
              <Search className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || locationFilter || categoryFilter
                  ? "Try adjusting your search or filter criteria."
                  : "No latest work posts available yet."
                }
              </p>
              {(searchTerm || locationFilter || categoryFilter) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setLocationFilter('');
                    setCategoryFilter('');
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6" 
              : "space-y-4 md:space-y-6"
            }>
              {paginatedPosts.map((post) => (
                <div 
                  key={post.id} 
                  className={`bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group ${
                    viewMode === 'list' ? 'flex flex-col md:flex-row' : ''
                  }`}
                >
                  <div className={`relative ${viewMode === 'list' ? 'md:w-64 flex-shrink-0' : ''}`}>
                    {/* Media Display */}
                    {post.youtube_url && isYouTubeUrl(post.youtube_url) ? (
                      <div 
                        className={`relative ${viewMode === 'list' ? 'h-48' : 'h-48 md:h-64'} cursor-pointer`}
                        onClick={() => handleImageClick(post)}
                      >
                        <div className="relative w-full h-full">
                          <iframe
                            src={getYouTubeEmbedUrl(post.youtube_url)}
                            title={post.title}
                            className="absolute inset-0 w-full h-full"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                          />
                        </div>
                        <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-medium flex items-center">
                          <Youtube className="h-3 w-3 mr-1" />
                          YouTube
                        </div>
                      </div>
                    ) : post.media_type === 'video' ? (
                      <div 
                        className={`relative ${viewMode === 'list' ? 'h-48' : 'h-48 md:h-64'} group cursor-pointer`}
                        onClick={() => handleImageClick(post)}
                      >
                        <video
                          ref={(el) => (videoRefs.current[post.id] = el)}
                          src={post.primary_media_url || post.media_url}
                          poster={post.primary_thumbnail || post.thumbnail || undefined}
                          className="w-full h-full object-cover"
                          muted
                          loop
                          playsInline
                          onPlay={() => {
                            // Pause all other videos when this one plays
                            Object.entries(videoRefs.current).forEach(([id, v]) => {
                              if (id !== post.id && v) {
                                try { v.pause(); } catch {}
                              }
                            });
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVideoPlay(post.id);
                            }}
                            className="bg-black/50 rounded-full p-4 group-hover:bg-black/70 transition-colors"
                          >
                            <Play className="h-8 w-8 text-white" />
                          </button>
                        </div>
                      </div>
                    ) : post.media_urls && post.media_urls.length > 1 ? (
                      // Multi-image slider - clickable
                      <div 
                        className="cursor-pointer group"
                        onClick={() => handleImageClick(post)}
                      >
                        <MultiImageSlider
                          images={post.media_urls}
                          thumbnails={post.thumbnails || undefined}
                          title={post.title}
                          autoSlide={true}
                          autoSlideInterval={5000}
                          showDots={true}
                          showArrows={true}
                          className={viewMode === 'list' ? 'h-48' : 'h-48 md:h-64'}
                        />
                        {/* Zoom overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 rounded-full p-2">
                            <ZoomIn className="h-6 w-6 text-gray-800" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div 
                        className={`${viewMode === 'list' ? 'h-48' : 'h-48 md:h-64'} overflow-hidden cursor-pointer group`}
                        onClick={() => handleImageClick(post)}
                      >
                        <img
                          src={post.primary_media_url || post.media_url}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        {/* Zoom overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 rounded-full p-2">
                            <ZoomIn className="h-6 w-6 text-gray-800" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Category Badge */}
                    {post.category && (
                      <div className="absolute top-2 left-2 bg-blue-600/90 text-white px-2 py-1 rounded text-xs font-medium">
                        {post.category}
                      </div>
                    )}

                    {/* Location Badge */}
                    {post.location && (
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {post.location}
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4 md:p-6 flex-1">
                    <h3 
                      className="text-lg md:text-xl font-bold text-gray-900 mb-2 cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={() => handleImageClick(post)}
                    >
                      {post.title}
                    </h3>
                    <p className={`text-gray-600 mb-4 text-sm md:text-base ${viewMode === 'list' ? 'line-clamp-3' : 'line-clamp-2'}`}>
                      {post.caption}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {/* Like Button */}
                        <button 
                          onClick={() => handleLike(post.id)}
                          className={`flex items-center space-x-1 transition-colors ${
                            post.user_has_liked 
                              ? 'text-red-500 hover:text-red-600' 
                              : 'text-gray-500 hover:text-red-500'
                          }`}
                        >
                          <Heart 
                            className={`h-4 w-4 ${post.user_has_liked ? 'fill-current' : ''}`} 
                          />
                          <span className="text-xs md:text-sm">{post.like_count || 0}</span>
                        </button>

                        {/* Comment Button */}
                        <button 
                          onClick={() => handleComment(post.id)}
                          className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors"
                        >
                          <MessageCircle className="h-4 w-4" />
                          <span className="text-xs md:text-sm">{post.comment_count || 0}</span>
                        </button>

                        {/* Share Button */}
                        <button 
                          onClick={() => handleShare(post.id)}
                          className="flex items-center space-x-1 text-gray-500 hover:text-green-500 transition-colors"
                        >
                          <Share2 className="h-4 w-4" />
                          <span className="text-xs md:text-sm">Share</span>
                        </button>
                      </div>
                      
                      <div className="hidden md:flex items-center text-xs md:text-sm text-gray-400 space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(post.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 mt-12">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 rounded-lg ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Comments Modal */}
      {selectedPostForComments && (
        <CommentsModal
          isOpen={showCommentsModal}
          onClose={() => {
            setShowCommentsModal(false);
            setSelectedPostForComments(null);
          }}
          postId={selectedPostForComments}
          postTitle={allPosts.find(p => p.id === selectedPostForComments)?.title || 'Post'}
          onAddComment={addComment}
          getComments={getComments}
        />
      )}

      {/* Login Prompt Modal */}
      <LoginPrompt
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        action={loginPromptAction}
        title="Join Our Community"
      />

      {/* Instagram-style Post Viewer */}
      {showPostViewer && (
        <PostViewer
          isOpen={showPostViewer}
          onClose={closePostViewer}
          initialPost={selectedPost}
          posts={filteredPosts}
          onLike={handleLike}
          onComment={handleComment}
          onShare={handleShare}
          getYouTubeEmbedUrl={getYouTubeEmbedUrl}
          isYouTubeUrl={isYouTubeUrl}
          addComment={addComment}
          getComments={getComments}
          isAuthenticated={!!user}
        />
      )}
    </div>
  );
};

export default LatestWorkGallery;