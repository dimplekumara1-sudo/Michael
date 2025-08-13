import React, { useRef, useState } from 'react';

interface BlogEditorProps {
  initialHtml?: string;
  onChange?: (html: string) => void;
}

// Simple built-in rich text editor using contentEditable.
// Supports: bold/italic/underline, links, and inserting up to 3 inline images.
const BlogEditor: React.FC<BlogEditorProps> = ({ initialHtml = '', onChange }) => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [imageCount, setImageCount] = useState(0);

  const exec = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    handleInput();
  };

  const handleCreateLink = () => {
    const url = prompt('Enter URL (include https://):');
    if (!url) return;
    exec('createLink', url);
  };

  const handleInsertImage = () => {
    if (imageCount >= 3) {
      alert('Maximum of 3 inline images allowed.');
      return;
    }
    const url = prompt('Enter image URL:');
    if (!url) return;
    exec('insertImage', url);
    setImageCount((c) => c + 1);
  };

  const handleInput = () => {
    const html = editorRef.current?.innerHTML || '';
    onChange?.(html);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <button className="px-3 py-1 border rounded" onClick={() => exec('bold')}>Bold</button>
        <button className="px-3 py-1 border rounded" onClick={() => exec('italic')}>Italic</button>
        <button className="px-3 py-1 border rounded" onClick={() => exec('underline')}>Underline</button>
        <button className="px-3 py-1 border rounded" onClick={handleCreateLink}>Add Link</button>
        <button className="px-3 py-1 border rounded" onClick={handleInsertImage}>Insert Image</button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className="min-h-[200px] border rounded p-3 bg-white"
        onInput={handleInput}
        dangerouslySetInnerHTML={{ __html: initialHtml }}
      />
      <p className="text-xs text-gray-500 mt-1">Tip: Select text and click "Add Link" to insert a clickable hyperlink.</p>
    </div>
  );
};

export default BlogEditor;