import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  ArrowRight, 
  Play, 
  MapPin, 
  Youtube,
  Send,
  X,
  Copy,
  Check,
  Loader2,
  ZoomIn,
  Maximize2
} from 'lucide-react';
import { useLatestWork } from '../hooks/useLatestWork';
import { useAuth } from '../contexts/AuthContext';
import { Comment } from '../types';
import LoginPrompt from './LoginPrompt';
import { PostSkeleton, CommentSkeleton } from './SkeletonLoader';
import { useToast } from '../contexts/ToastContext';
import MultiImageSlider from './MultiImageSlider';

interface LatestWorkProps {
  limit?: number;
  showViewAll?: boolean;
}

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  postTitle: string;
  onAddComment: (content: string) => Promise<void>;
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
          <h3 className="text-lg font-semibold text-gray-900">Comments</h3>
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

const LatestWork: React.FC<LatestWorkProps> = ({ limit = 6, showViewAll = true }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const { posts, loading, error, toggleLike, addComment, getComments, copyShareUrl } = useLatestWork(limit);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [loginPromptAction, setLoginPromptAction] = useState<'like' | 'comment'>('like');
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImagePost, setSelectedImagePost] = useState<any>(null);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});

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
    setSelectedPost(postId);
  };

  const handleShare = async (postId: string) => {
    try {
      const success = await copyShareUrl(postId);
      if (success) {
        setCopiedPostId(postId);
        setTimeout(() => setCopiedPostId(null), 2000);
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

  const handleImageClick = (post: any) => {
    setSelectedImagePost(post);
    setShowImageModal(true);
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

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.includes('youtu.be') 
      ? url.split('youtu.be/')[1]?.split('?')[0]
      : url.split('v=')[1]?.split('&')[0];
    return `https://www.youtube.com/embed/${videoId}`;
  };

  if (loading) {
    return (
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Latest Work</h2>
            <p className="text-xl text-gray-600">
              Follow our journey and see our latest captures
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: limit }).map((_, index) => (
              <PostSkeleton key={index} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Latest Work</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Latest Work</h2>
            <p className="text-xl text-gray-600">
              Follow our journey and see our latest captures
            </p>
          </div>

          {posts.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto">
                <div className="text-gray-400 mb-4">
                  <MessageCircle className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Latest Work Yet</h3>
                <p className="text-gray-600">
                  Check back soon for our latest photography and videography work!
                </p>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <div key={post.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group">
                  <div className="relative">
                    {/* Media Display */}
                    {post.youtube_url && isYouTubeUrl(post.youtube_url) ? (
                      <div className="relative h-64">
                        <iframe
                          src={getYouTubeEmbedUrl(post.youtube_url)}
                          title={post.title}
                          className="w-full h-full"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                        <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-medium flex items-center">
                          <Youtube className="h-3 w-3 mr-1" />
                          YouTube
                        </div>
                      </div>
                    ) : post.media_type === 'video' ? (
                      <div className="relative h-64 group">
                        <video
                          ref={(el) => (videoRefs.current[post.id] = el)}
                          src={post.primary_media_url || post.media_url}
                          poster={post.primary_thumbnail || post.thumbnail || undefined}
                          className="w-full h-full object-cover"
                          muted
                          loop
                          playsInline
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <button
                            onClick={() => handleVideoPlay(post.id)}
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
                          className="h-64"
                        />
                        {/* Zoom overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 rounded-full p-2">
                            <ZoomIn className="h-6 w-6 text-gray-800" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Single image - clickable
                      <div 
                        className="h-64 overflow-hidden cursor-pointer group"
                        onClick={() => handleImageClick(post)}
                      >
                        <img
                          src={post.primary_media_url || post.media_url}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {/* Zoom overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 rounded-full p-2">
                            <ZoomIn className="h-6 w-6 text-gray-800" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Location Badge */}
                    {post.location && (
                      <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {post.location}
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6">
                    <h3 
                      className="text-xl font-bold text-gray-900 mb-2 cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={() => handleImageClick(post)}
                    >
                      {post.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">{post.caption}</p>
                    
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
                          title={user ? (post.user_has_liked ? 'Unlike' : 'Like') : 'Login to like'}
                        >
                          <Heart className={`h-5 w-5 ${post.user_has_liked ? 'fill-current' : ''}`} />
                          <span className="text-sm">{post.like_count || 0}</span>
                        </button>

                        {/* Comment Button */}
                        <button 
                          onClick={() => handleComment(post.id)}
                          className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors"
                          title="View comments"
                        >
                          <MessageCircle className="h-5 w-5" />
                          <span className="text-sm">{post.comment_count || 0}</span>
                        </button>

                        {/* Share Button */}
                        <button 
                          onClick={() => handleShare(post.id)}
                          className="flex items-center space-x-1 text-gray-500 hover:text-green-500 transition-colors"
                          title="Share"
                        >
                          {copiedPostId === post.id ? (
                            <Check className="h-5 w-5 text-green-500" />
                          ) : (
                            <Share2 className="h-5 w-5" />
                          )}
                          <span className="text-sm">
                            {copiedPostId === post.id ? 'Copied!' : 'Share'}
                          </span>
                        </button>
                      </div>
                      
                      <span className="text-sm text-gray-400">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* View All Button */}
          {showViewAll && posts.length > 0 && (
            <div className="text-center mt-12">
              <Link
                to="/latest-work"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors inline-flex items-center"
              >
                View All Work <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Comments Modal */}
      <CommentsModal
        isOpen={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        postId={selectedPost || ''}
        postTitle={posts.find(p => p.id === selectedPost)?.title || ''}
        onAddComment={addComment}
        getComments={getComments}
      />

      {/* Login Prompt Modal */}
      <LoginPrompt
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        action={loginPromptAction}
        title="Join Our Community"
      />

      {/* Image Modal */}
      {showImageModal && selectedImagePost && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-7xl max-h-full w-full h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 text-white">
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-1">{selectedImagePost.title}</h2>
                <p className="text-gray-300">{selectedImagePost.caption}</p>
                {selectedImagePost.location && (
                  <div className="flex items-center mt-2 text-gray-400">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{selectedImagePost.location}</span>
                  </div>
                )}
              </div>
              <button
                onClick={closeImageModal}
                className="p-2 hover:bg-white/10 rounded-full transition-colors ml-4"
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>

            {/* Image Content */}
            <div className="flex-1 flex items-center justify-center min-h-0">
              {selectedImagePost.media_urls && selectedImagePost.media_urls.length > 1 ? (
                // Multi-image slider for modal
                <div className="w-full h-full max-h-[80vh]">
                  <MultiImageSlider
                    images={selectedImagePost.media_urls}
                    thumbnails={selectedImagePost.thumbnails || undefined}
                    title={selectedImagePost.title}
                    autoSlide={false}
                    showDots={true}
                    showArrows={true}
                    className="w-full h-full"
                    isModal={true}
                  />
                </div>
              ) : (
                // Single image
                <div className="w-full h-full flex items-center justify-center">
                  <img
                    src={selectedImagePost.primary_media_url || selectedImagePost.media_url}
                    alt={selectedImagePost.title}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              )}
            </div>

            {/* Footer with actions */}
            <div className="flex items-center justify-between p-4 text-white">
              <div className="flex items-center space-x-6">
                {/* Like Button */}
                <button 
                  onClick={() => handleLike(selectedImagePost.id)}
                  className={`flex items-center space-x-2 transition-colors ${
                    selectedImagePost.user_has_liked 
                      ? 'text-red-500 hover:text-red-400' 
                      : 'text-gray-300 hover:text-red-500'
                  }`}
                >
                  <Heart 
                    className={`h-5 w-5 ${selectedImagePost.user_has_liked ? 'fill-current' : ''}`} 
                  />
                  <span>{selectedImagePost.like_count || 0}</span>
                </button>

                {/* Comment Button */}
                <button 
                  onClick={() => {
                    closeImageModal();
                    handleComment(selectedImagePost.id);
                  }}
                  className="flex items-center space-x-2 text-gray-300 hover:text-blue-400 transition-colors"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span>{selectedImagePost.comment_count || 0}</span>
                </button>

                {/* Share Button */}
                <button 
                  onClick={() => handleShare(selectedImagePost.id)}
                  className="flex items-center space-x-2 text-gray-300 hover:text-green-400 transition-colors"
                >
                  <Share2 className="h-5 w-5" />
                  <span>Share</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LatestWork;