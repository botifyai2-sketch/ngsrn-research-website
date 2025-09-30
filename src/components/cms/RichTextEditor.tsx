'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Quote, 
  List, 
  ListOrdered, 
  Link, 
  Image, 
  Code, 
  Heading1, 
  Heading2, 
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Strikethrough,
  Highlighter,
  Type,
  FileText,
  Video,
  Table,
  Undo,
  Redo
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: string;
  onMediaInsert?: () => void;
}

interface ToolbarButtonProps {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ 
  icon, 
  title, 
  onClick, 
  isActive = false, 
  disabled = false 
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-2 rounded-md border transition-colors ${
      isActive 
        ? 'bg-blue-100 border-blue-300 text-blue-700' 
        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}`}
  >
    {icon}
  </button>
);

const ToolbarSeparator = () => (
  <div className="w-px h-6 bg-gray-300 mx-1" />
);

export default function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = "Start writing your article...", 
  className = "",
  error,
  onMediaInsert
}: RichTextEditorProps) {
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Get current selection
  const getCurrentSelection = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return { start: 0, end: 0, text: '' };
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value.substring(start, end);
    
    return { start, end, text };
  }, []);

  // Insert text at cursor position
  const insertText = useCallback((text: string, selectInserted = false) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { start, end } = getCurrentSelection();
    const newValue = value.substring(0, start) + text + value.substring(end);
    
    onChange(newValue);
    
    // Set cursor position after insertion
    setTimeout(() => {
      if (selectInserted) {
        textarea.setSelectionRange(start, start + text.length);
      } else {
        textarea.setSelectionRange(start + text.length, start + text.length);
      }
      textarea.focus();
    }, 0);
  }, [value, onChange, getCurrentSelection]);

  // Wrap selected text with formatting
  const wrapText = useCallback((before: string, after: string = before) => {
    const { start, end, text } = getCurrentSelection();
    
    if (text) {
      const wrappedText = before + text + after;
      insertText(wrappedText);
    } else {
      const placeholder = before + 'text' + after;
      insertText(placeholder, true);
    }
  }, [insertText, getCurrentSelection]);

  // Formatting functions
  const formatBold = () => wrapText('**');
  const formatItalic = () => wrapText('*');
  const formatUnderline = () => wrapText('<u>', '</u>');
  const formatStrikethrough = () => wrapText('~~');
  const formatCode = () => wrapText('`');
  const formatHighlight = () => wrapText('<mark>', '</mark>');

  const formatHeading = (level: number) => {
    const { start } = getCurrentSelection();
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = value.indexOf('\n', start);
    const currentLine = value.substring(lineStart, lineEnd === -1 ? value.length : lineEnd);
    
    // Remove existing heading markers
    const cleanLine = currentLine.replace(/^#+\s*/, '');
    const newLine = '#'.repeat(level) + ' ' + cleanLine;
    
    const newValue = value.substring(0, lineStart) + newLine + value.substring(lineEnd === -1 ? value.length : lineEnd);
    onChange(newValue);
  };

  const formatList = (ordered = false) => {
    const { start } = getCurrentSelection();
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const marker = ordered ? '1. ' : '- ';
    
    insertText('\n' + marker);
  };

  const formatQuote = () => {
    const { start } = getCurrentSelection();
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    
    insertText('\n> ');
  };

  const formatAlignment = (align: 'left' | 'center' | 'right') => {
    const alignmentMap = {
      left: '<div style="text-align: left;">',
      center: '<div style="text-align: center;">',
      right: '<div style="text-align: right;">'
    };
    
    wrapText(alignmentMap[align], '</div>');
  };

  const insertLink = () => {
    const { text } = getCurrentSelection();
    setSelectedText(text);
    setLinkText(text || '');
    setShowLinkDialog(true);
  };

  const confirmLink = () => {
    if (linkUrl) {
      const linkMarkdown = `[${linkText || selectedText || 'link text'}](${linkUrl})`;
      insertText(linkMarkdown);
    }
    setShowLinkDialog(false);
    setLinkUrl('');
    setLinkText('');
  };

  const insertImage = () => {
    setShowImageDialog(true);
  };

  const confirmImage = () => {
    if (imageUrl) {
      const imageMarkdown = `![${imageAlt || 'Image'}](${imageUrl})`;
      insertText(imageMarkdown);
    }
    setShowImageDialog(false);
    setImageUrl('');
    setImageAlt('');
  };

  const insertTable = () => {
    const tableMarkdown = `
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
`;
    insertText(tableMarkdown);
  };

  const insertHorizontalRule = () => {
    insertText('\n\n---\n\n');
  };

  const insertCodeBlock = () => {
    const { text } = getCurrentSelection();
    if (text) {
      wrapText('\n```\n', '\n```\n');
    } else {
      insertText('\n```\ncode here\n```\n');
    }
  };

  const insertCallout = (type: 'info' | 'warning' | 'success' | 'error') => {
    const calloutMap = {
      info: '> ℹ️ **Info:** ',
      warning: '> ⚠️ **Warning:** ',
      success: '> ✅ **Success:** ',
      error: '> ❌ **Error:** '
    };
    
    insertText('\n' + calloutMap[type] + 'Your message here\n\n');
  };

  // Keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          formatBold();
          break;
        case 'i':
          e.preventDefault();
          formatItalic();
          break;
        case 'u':
          e.preventDefault();
          formatUnderline();
          break;
        case 'k':
          e.preventDefault();
          insertLink();
          break;
        case '`':
          e.preventDefault();
          formatCode();
          break;
      }
    }
  };

  // Calculate word count
  const wordCount = useMemo(() => {
    return value.trim().split(/\s+/).filter(word => word.length > 0).length;
  }, [value]);

  return (
    <div className={`border border-gray-300 rounded-lg overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 p-3">
        <div className="flex flex-wrap items-center gap-1">
          {/* Text Formatting */}
          <ToolbarButton icon={<Bold size={16} />} title="Bold" onClick={formatBold} />
          <ToolbarButton icon={<Italic size={16} />} title="Italic" onClick={formatItalic} />
          <ToolbarButton icon={<Underline size={16} />} title="Underline" onClick={formatUnderline} />
          <ToolbarButton icon={<Strikethrough size={16} />} title="Strikethrough" onClick={formatStrikethrough} />
          <ToolbarButton icon={<Highlighter size={16} />} title="Highlight" onClick={formatHighlight} />
          
          <ToolbarSeparator />
          
          {/* Headings */}
          <ToolbarButton icon={<Heading1 size={16} />} title="Heading 1" onClick={() => formatHeading(1)} />
          <ToolbarButton icon={<Heading2 size={16} />} title="Heading 2" onClick={() => formatHeading(2)} />
          <ToolbarButton icon={<Heading3 size={16} />} title="Heading 3" onClick={() => formatHeading(3)} />
          
          <ToolbarSeparator />
          
          {/* Lists and Quotes */}
          <ToolbarButton icon={<List size={16} />} title="Bullet List" onClick={() => formatList(false)} />
          <ToolbarButton icon={<ListOrdered size={16} />} title="Numbered List" onClick={() => formatList(true)} />
          <ToolbarButton icon={<Quote size={16} />} title="Quote" onClick={formatQuote} />
          
          <ToolbarSeparator />
          
          {/* Alignment */}
          <ToolbarButton icon={<AlignLeft size={16} />} title="Align Left" onClick={() => formatAlignment('left')} />
          <ToolbarButton icon={<AlignCenter size={16} />} title="Align Center" onClick={() => formatAlignment('center')} />
          <ToolbarButton icon={<AlignRight size={16} />} title="Align Right" onClick={() => formatAlignment('right')} />
          
          <ToolbarSeparator />
          
          {/* Media and Links */}
          <ToolbarButton icon={<Link size={16} />} title="Insert Link" onClick={insertLink} />
          <ToolbarButton icon={<Image size={16} />} title="Insert Image" onClick={insertImage} />
          {onMediaInsert && (
            <ToolbarButton 
              icon={<Video size={16} />} 
              title="Insert Media from Library" 
              onClick={onMediaInsert} 
            />
          )}
          <ToolbarButton icon={<Table size={16} />} title="Insert Table" onClick={insertTable} />
          <ToolbarButton icon={<Code size={16} />} title="Inline Code" onClick={formatCode} />
          
          <ToolbarSeparator />
          
          {/* Special */}
          <ToolbarButton 
            icon={<FileText size={16} />} 
            title="Code Block" 
            onClick={insertCodeBlock} 
          />
          <ToolbarButton 
            icon={<Type size={16} />} 
            title="Horizontal Rule" 
            onClick={insertHorizontalRule} 
          />
          
          <ToolbarSeparator />
          
          {/* Callouts */}
          <div className="relative group">
            <ToolbarButton 
              icon={<div className="text-xs">💡</div>} 
              title="Insert Callout" 
              onClick={() => insertCallout('info')} 
            />
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <div className="p-2 space-y-1">
                <button
                  type="button"
                  onClick={() => insertCallout('info')}
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                >
                  ℹ️ Info
                </button>
                <button
                  type="button"
                  onClick={() => insertCallout('warning')}
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                >
                  ⚠️ Warning
                </button>
                <button
                  type="button"
                  onClick={() => insertCallout('success')}
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                >
                  ✅ Success
                </button>
                <button
                  type="button"
                  onClick={() => insertCallout('error')}
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                >
                  ❌ Error
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full p-4 border-0 resize-none focus:outline-none focus:ring-0 font-mono text-sm leading-relaxed ${
            error ? 'bg-red-50' : 'bg-white'
          }`}
          rows={20}
          style={{ minHeight: '400px' }}
        />
        
        {/* Word Count and Help */}
        <div className="absolute bottom-2 right-2 flex items-center space-x-2">
          <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">
            {wordCount} words
          </div>
          <div className="relative group">
            <button
              type="button"
              className="text-xs text-gray-500 bg-white px-2 py-1 rounded border hover:bg-gray-50"
            >
              ?
            </button>
            <div className="absolute bottom-full right-0 mb-2 w-80 bg-white border border-gray-300 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <div className="p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Formatting Help</h4>
                <div className="space-y-2 text-xs text-gray-600">
                  <div><strong>Ctrl+B:</strong> Bold text</div>
                  <div><strong>Ctrl+I:</strong> Italic text</div>
                  <div><strong>Ctrl+U:</strong> Underline text</div>
                  <div><strong>Ctrl+K:</strong> Insert link</div>
                  <div><strong>Ctrl+`:</strong> Inline code</div>
                  <div className="pt-2 border-t border-gray-200">
                    <div><strong>**text**:</strong> Bold</div>
                    <div><strong>*text*:</strong> Italic</div>
                    <div><strong>~~text~~:</strong> Strikethrough</div>
                    <div><strong>`code`:</strong> Inline code</div>
                    <div><strong>&gt; quote:</strong> Blockquote</div>
                    <div><strong>- item:</strong> Bullet list</div>
                    <div><strong>1. item:</strong> Numbered list</div>
                    <div><strong># Heading:</strong> H1</div>
                    <div><strong>## Heading:</strong> H2</div>
                    <div><strong>### Heading:</strong> H3</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-t border-red-200 p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Link Dialog */}
      {showLinkDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Insert Link</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link Text
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter link text..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowLinkDialog(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmLink}
                disabled={!linkUrl}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Insert Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Dialog */}
      {showImageDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Insert Image</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alt Text
                </label>
                <input
                  type="text"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the image..."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowImageDialog(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmImage}
                disabled={!imageUrl}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Insert Image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}