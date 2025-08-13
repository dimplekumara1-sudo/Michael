import React, { useMemo, useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { blogService } from '../services/blogService';
import { BlogPost } from '../types/Blog';
import { Loader2 } from 'lucide-react';

const POSTS_PER_PAGE = 10; // global rule

const BlogListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const currentPage = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;

  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 640px)');
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const loadBlogs = async () => {
      try {
        setLoading(true);
        setError(null);
        const publishedBlogs = await blogService.getPublishedBlogs();
        setBlogs(publishedBlogs);
      } catch (err) {
        console.error('Error loading blogs:', err);
        setError('Failed to load blog posts. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadBlogs();
  }, []);

  const totalPages = Math.ceil(blogs.length / POSTS_PER_PAGE);

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * POSTS_PER_PAGE;
    return blogs.slice(start, start + POSTS_PER_PAGE);
  }, [currentPage, blogs]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Blog</h1>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading blog posts...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Blog</h1>
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">{error}</div>
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

  if (blogs.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Blog</h1>
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No blog posts available yet.</p>
          <p className="text-gray-500 mt-2">Check back soon for new content!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Blog</h1>

      {/* Mobile: single column card stack. Only 2 visible at a time via CSS overflow (not changing pagination count). */}
      <div className={
        isMobile
          ? 'grid grid-cols-1 gap-6 max-h-[1100px] overflow-y-auto pr-2'
          : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
      }>
        {pageItems.map((post) => (
          <article
            key={post.id}
            className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden flex flex-col"
          >
            <Link to={`/blog/${post.slug}`}>
              <img
                src={post.thumbnailUrl}
                alt={post.title}
                className="w-full h-48 object-cover"
                loading="lazy"
              />
            </Link>
            <div className="p-4 flex flex-col flex-1">
              <Link to={`/blog/${post.slug}`} className="group">
                <h2 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {post.title}
                </h2>
              </Link>
              <p className="text-gray-600 mt-2 flex-1">{post.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {new Date(post.publishedAt).toLocaleDateString()}
                </span>
                <Link
                  to={`/blog/${post.slug}`}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Read more →
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-8 flex items-center justify-center space-x-2">
        <button
          className="px-3 py-2 rounded border text-sm disabled:opacity-50"
          onClick={() => setSearchParams({ page: String(Math.max(1, currentPage - 1)) })}
          disabled={currentPage <= 1}
        >
          Prev
        </button>
        {Array.from({ length: totalPages }).map((_, i) => {
          const pageNumber = i + 1;
          const isActive = pageNumber === currentPage;
          return (
            <button
              key={pageNumber}
              className={`px-3 py-2 rounded border text-sm ${isActive ? 'bg-blue-600 text-white' : ''}`}
              onClick={() => setSearchParams({ page: String(pageNumber) })}
            >
              {pageNumber}
            </button>
          );
        })}
        <button
          className="px-3 py-2 rounded border text-sm disabled:opacity-50"
          onClick={() => setSearchParams({ page: String(Math.min(totalPages, currentPage + 1)) })}
          disabled={currentPage >= totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default BlogListPage;