import React from 'react';

interface RichTextViewerProps {
  content: string;
  className?: string;
}

const RichTextViewer: React.FC<RichTextViewerProps> = ({
  content,
  className = ""
}) => {
  // If content is empty or null, show placeholder
  if (!content || content.trim() === '<p><br></p>' || content.trim() === '') {
    return (
      <div className={`text-muted-foreground italic ${className}`}>
        Tidak ada deskripsi
      </div>
    );
  }

  return (
    <div
      className={`rich-text-viewer prose prose-sm max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
      style={{
        fontSize: '14px',
        lineHeight: '1.6',
        color: '#374151'
      }}
    />
  );
};

export default RichTextViewer;