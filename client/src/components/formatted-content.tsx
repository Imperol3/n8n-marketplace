import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface FormattedContentProps {
  content: string;
  className?: string;
}

/**
 * Component to format text content with proper styling
 * Automatically detects and renders markdown content
 */
export function FormattedContent({ content, className }: FormattedContentProps) {
  // Check if content contains markdown indicators
  const hasMarkdown = /[*#\[\]_`~]/.test(content);
  
  if (hasMarkdown) {
    return (
      <div className={cn("prose prose-stone dark:prose-invert max-w-none", className)}>
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    );
  }
  
  // If no markdown detected, format as regular text with proper spacing
  return (
    <div className={cn("space-y-4", className)}>
      {content.split('\n\n').map((paragraph, index) => (
        <p key={index}>
          {paragraph.split('\n').map((line, lineIndex) => (
            <span key={lineIndex}>
              {line}
              {lineIndex < paragraph.split('\n').length - 1 && <br />}
            </span>
          ))}
        </p>
      ))}
    </div>
  );
}

/**
 * Function to format text content into HTML
 * Can be used in non-React contexts like API responses
 */
export function formatTextContent(content: string): string {
  // Check if content contains markdown indicators
  const hasMarkdown = /[*#\[\]_`~]/.test(content);
  
  if (hasMarkdown) {
    // This is a simplified approach - in a real implementation you might want to
    // use a server-side markdown renderer like marked.js
    return `<div class="formatted-markdown">${content}</div>`;
  }
  
  // Format as regular text with proper paragraph breaks
  return content
    .split('\n\n')
    .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
    .join('');
}