import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { blogService } from '../services/blogService';
import { BlogPost } from '../types/Blog';
import { Loader2 } from 'lucide-react';

const BlogDetailPage: React.FC = () => {
  const { slug } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBlog = async () => {
      if (!slug) {
        setError('No blog slug provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const blogPost = await blogService.getBlogBySlug(slug);
        setPost(blogPost);
        if (!blogPost) {
          setError('Blog post not found');
        }
      } catch (err) {
        console.error('Error loading blog:', err);
        setError('Failed to load blog post. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadBlog();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/blog" className="text-blue-600 hover:text-blue-700">← Back to Blog</Link>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading blog post...</span>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/blog" className="text-blue-600 hover:text-blue-700">← Back to Blog</Link>
        <div className="text-center py-12">
          <p className="text-gray-700 text-lg mb-4">{error || 'Blog post not found.'}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/blog" className="text-blue-600 hover:text-blue-700">← Back to Blog</Link>
      <header className="mt-4">
        <h1 className="text-3xl font-bold text-gray-900">{post.title}</h1>
        <p className="text-gray-600 mt-2">{post.description}</p>
        <div className="text-sm text-gray-500 mt-1">{new Date(post.publishedAt).toLocaleDateString()}</div>
      </header>
      <img
        src={post.thumbnailUrl}
        alt={post.title}
        className="w-full h-64 object-cover rounded-lg mt-6"
      />
      <section
        className="blog-content max-w-none mt-6"
        dangerouslySetInnerHTML={{ __html: post.contentHtml }}
      />
      <footer className="mt-8 p-4 bg-gray-50 rounded-lg border text-gray-700">
        <h2 className="text-lg font-semibold">Conclusion</h2>
        <p className="mt-2">{post.conclusion}</p>
      </footer>
    </article>
  );
};

export default BlogDetailPage;