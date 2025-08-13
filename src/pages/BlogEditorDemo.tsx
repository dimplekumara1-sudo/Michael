import React, { useState } from 'react';
import BlogEditor from '../components/BlogEditor';

const BlogEditorDemo: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [conclusion, setConclusion] = useState('');
  const [contentHtml, setContentHtml] = useState('');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-6">Blog Editor (Demo)</h1>

      <div className="grid grid-cols-1 gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              className="mt-1 w-full border rounded p-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter blog title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Thumbnail URL</label>
            <input
              type="url"
              className="mt-1 w-full border rounded p-2"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Short Description</label>
            <textarea
              className="mt-1 w-full border rounded p-2"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary shown on the list page"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Main Content</label>
          <BlogEditor initialHtml={contentHtml} onChange={setContentHtml} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Conclusion</label>
          <textarea
            className="mt-1 w-full border rounded p-2"
            rows={3}
            value={conclusion}
            onChange={(e) => setConclusion(e.target.value)}
            placeholder="Final takeaway"
          />
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Live Preview</h2>
        <article className="bg-white border rounded p-4">
          {thumbnailUrl && (
            <img src={thumbnailUrl} alt="thumbnail" className="w-full h-48 object-cover rounded" />
          )}
          <h3 className="text-2xl font-bold mt-3">{title || 'Your Title'}</h3>
          <p className="text-gray-600 mt-1">{description || 'Short description...'}</p>
          <section className="prose max-w-none mt-4" dangerouslySetInnerHTML={{ __html: contentHtml }} />
          <footer className="mt-4 p-3 bg-gray-50 border rounded">
            <h4 className="font-semibold">Conclusion</h4>
            <p>{conclusion || 'Your conclusion...'}</p>
          </footer>
        </article>
      </div>
    </div>
  );
};

export default BlogEditorDemo;