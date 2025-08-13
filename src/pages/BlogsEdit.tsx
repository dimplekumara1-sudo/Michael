import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  Save, 
  X, 
  Calendar,
  User,
  Globe,
  FileText,
  Loader2
} from 'lucide-react';
import { blogService, CreateBlogData, UpdateBlogData } from '../services/blogService';
import { BlogPost } from '../types/Blog';
import BlogEditor from '../components/BlogEditor';
import { useToast } from '../contexts/ToastContext';

interface ExtendedBlogPost extends BlogPost {
  isPublished: boolean;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

const BlogsEdit: React.FC = () => {
  const [blogs, setBlogs] = useState<ExtendedBlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingBlog, setEditingBlog] = useState<ExtendedBlogPost | null>(null);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thumbnailUrl: '',
    contentHtml: '',
    conclusion: '',
    slug: '',
    isPublished: false
  });

  useEffect(() => {
    loadBlogs();
  }, []);

  const loadBlogs = async () => {
    try {
      setLoading(true);
      const blogsData = await blogService.getAllBlogs();
      setBlogs(blogsData);
    } catch (error) {
      console.error('Error loading blogs:', error);
      showToast('Failed to load blogs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      thumbnailUrl: '',
      contentHtml: '',
      conclusion: '',
      slug: '',
      isPublished: false
    });
    setEditingBlog(null);
  };

  const openEditor = (blog?: ExtendedBlogPost) => {
    if (blog) {
      setEditingBlog(blog);
      setFormData({
        title: blog.title,
        description: blog.description,
        thumbnailUrl: blog.thumbnailUrl,
        contentHtml: blog.contentHtml,
        conclusion: blog.conclusion,
        slug: blog.slug,
        isPublished: blog.isPublished
      });
    } else {
      resetForm();
    }
    setShowEditor(true);
  };

  const closeEditor = () => {
    setShowEditor(false);
    resetForm();
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.description.trim() || !formData.contentHtml.trim()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    try {
      setSaving(true);

      if (editingBlog) {
        // Update existing blog
        const updateData: UpdateBlogData = {
          id: editingBlog.id,
          title: formData.title,
          description: formData.description,
          thumbnailUrl: formData.thumbnailUrl,
          contentHtml: formData.contentHtml,
          conclusion: formData.conclusion,
          slug: formData.slug || undefined,
          isPublished: formData.isPublished
        };
        await blogService.updateBlog(updateData);
        showToast('Blog updated successfully', 'success');
      } else {
        // Create new blog
        const createData: CreateBlogData = {
          title: formData.title,
          description: formData.description,
          thumbnailUrl: formData.thumbnailUrl,
          contentHtml: formData.contentHtml,
          conclusion: formData.conclusion,
          slug: formData.slug || undefined,
          isPublished: formData.isPublished
        };
        await blogService.createBlog(createData);
        showToast('Blog created successfully', 'success');
      }

      closeEditor();
      await loadBlogs();
    } catch (error) {
      console.error('Error saving blog:', error);
      showToast('Failed to save blog', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (blog: ExtendedBlogPost) => {
    if (!confirm(`Are you sure you want to delete "${blog.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await blogService.deleteBlog(blog.id);
      showToast('Blog deleted successfully', 'success');
      await loadBlogs();
    } catch (error) {
      console.error('Error deleting blog:', error);
      showToast('Failed to delete blog', 'error');
    }
  };

  const handleTogglePublish = async (blog: ExtendedBlogPost) => {
    try {
      const newStatus = await blogService.togglePublishStatus(blog.id);
      showToast(`Blog ${newStatus ? 'published' : 'unpublished'} successfully`, 'success');
      await loadBlogs();
    } catch (error) {
      console.error('Error toggling publish status:', error);
      showToast('Failed to update publish status', 'error');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading blogs...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Blog Management</h1>
          <p className="text-gray-600 mt-2">Create, edit, and manage your blog posts</p>
        </div>
        <button
          onClick={() => openEditor()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Blog Post
        </button>
      </div>

      {/* Blog List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {blogs.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No blog posts yet</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first blog post</p>
            <button
              onClick={() => openEditor()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Blog Post
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Title</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Created</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Updated</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {blogs.map((blog) => (
                  <tr key={blog.id} className="hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="flex items-start space-x-3">
                        {blog.thumbnailUrl && (
                          <img
                            src={blog.thumbnailUrl}
                            alt={blog.title}
                            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {blog.title}
                          </h3>
                          <p className="text-sm text-gray-600 truncate mt-1">
                            {blog.description}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Slug: /{blog.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          blog.isPublished
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {blog.isPublished ? (
                          <>
                            <Globe className="h-3 w-3 mr-1" />
                            Published
                          </>
                        ) : (
                          <>
                            <FileText className="h-3 w-3 mr-1" />
                            Draft
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(blog.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(blog.updatedAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleTogglePublish(blog)}
                          className={`p-2 rounded-lg transition-colors ${
                            blog.isPublished
                              ? 'text-gray-600 hover:bg-gray-100'
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={blog.isPublished ? 'Unpublish' : 'Publish'}
                        >
                          {blog.isPublished ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => openEditor(blog)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(blog)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingBlog ? 'Edit Blog Post' : 'Create New Blog Post'}
              </h2>
              <button
                onClick={closeEditor}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter blog title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custom Slug (optional)
                    </label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="custom-url-slug"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thumbnail URL *
                  </label>
                  <input
                    type="url"
                    value={formData.thumbnailUrl}
                    onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Short Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Brief summary shown on the blog list page"
                  />
                </div>

                {/* Content Editor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Main Content *
                  </label>
                  <BlogEditor
                    initialHtml={formData.contentHtml}
                    onChange={(html) => setFormData({ ...formData, contentHtml: html })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conclusion
                  </label>
                  <textarea
                    value={formData.conclusion}
                    onChange={(e) => setFormData({ ...formData, conclusion: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Final takeaway or conclusion"
                  />
                </div>

                {/* Publish Status */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPublished"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isPublished" className="ml-2 text-sm text-gray-700">
                    Publish immediately
                  </label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
              <button
                onClick={closeEditor}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {editingBlog ? 'Update' : 'Create'} Blog
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogsEdit;