/**
 * Detects if a string contains substantial markdown formatting
 * @param text The text to check
 * @returns Boolean indicating if substantial markdown formatting is detected
 */
export function containsMarkdown(text: string): boolean {
  if (!text || text.trim().length < 5) return false;
  
  // First, count instances of markdown-like patterns
  let markdownCount = 0;
  
  // Check for common markdown patterns
  const markdownPatterns = [
    /^#+\s+/m,                  // Headers
    /\*\*.*?\*\*/,              // Bold
    /\*.*?\*/,                  // Italic
    /\[.*?\]\(.*?\)/,           // Links
    /^>.*$/m,                   // Blockquotes
    /^-\s+/m,                   // Unordered lists
    /^[0-9]+\.\s+/m,            // Ordered lists
    /^```[\s\S]*?```/m,         // Code blocks
    /`.*?`/,                    // Inline code
    /!\[.*?\]\(.*?\)/,          // Images
    /^---$/m,                   // Horizontal rules
    /==.*?==/,                  // Highlighting
    /~~.*?~~/,                  // Strikethrough
    /^\|.*\|$/m,                // Tables
  ];

  // Count total markdown elements
  markdownPatterns.forEach(pattern => {
    const matches = text.match(new RegExp(pattern, 'g'));
    if (matches) {
      markdownCount += matches.length;
    }
  });
  
  // Check if the text has substantial markdown formatting
  // If there are multiple instances or if markdown makes up a significant portion
  const textLength = text.length;
  const paragraphs = text.split(/\n\n+/).length;
  
  // More flexible criteria - only consider it heavily formatted if:
  // 1. Multiple header patterns are found (##, ###, etc.)
  const headerMatches = text.match(/^#+\s+/gm);
  const hasMultipleHeaders = headerMatches && headerMatches.length > 1;
  
  // 2. Or has many markdown elements relative to text size
  const markdownDensity = markdownCount / (textLength / 100);
  const hasHighMarkdownDensity = markdownDensity > 2; // 2% or more of text is markdown
  
  // 3. Or has combination of headers and other markdown elements
  const hasHeaderAndOtherMarkdown = 
    text.match(/^#+\s+/m) && 
    markdownCount >= 3;
    
  return hasMultipleHeaders || hasHighMarkdownDensity || hasHeaderAndOtherMarkdown;
}

/**
 * Formats text content to HTML based on content type detection
 * @param content The text content to format
 * @returns HTML string of the formatted content
 */
export function formatTextToHtml(content: string): string {
  if (!content) return '';
  
  // Determine if the content is markdown
  const isMarkdown = containsMarkdown(content);
  
  // Format accordingly
  if (isMarkdown) {
    return convertMarkdownToHtml(content);
  } else {
    return formatPlainTextToHtml(content);
  }
}

/**
 * A very simple markdown to HTML converter
 * In a real app, use a library like marked
 */
function convertMarkdownToHtml(markdown: string): string {
  let html = markdown;
  
  // Headers
  html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
  
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Line breaks
  html = html.replace(/\n/g, '<br>');
  
  // Links
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
  
  // Lists - very basic handling
  html = html.replace(/^\s*-\s+(.*$)/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
  
  // Code
  html = html.replace(/`(.*?)`/g, '<code>$1</code>');
  
  return html;
}

/**
 * Formats plain text with proper paragraph breaks
 * @param text The plain text to format
 * @returns HTML formatted version of the text
 */
function formatPlainTextToHtml(text: string): string {
  // Break into paragraphs
  const paragraphs = text.split(/\n\n+/);
  
  // Format each paragraph
  return paragraphs
    .map(para => {
      if (!para.trim()) return '';
      return `<p>${para.replace(/\n/g, '<br>')}</p>`;
    })
    .join('');
}

/**
 * Formats text for API responses
 * Can be used when the client needs formatted text but doesn't use React
 * @param text The text to format
 * @returns Object with HTML and plain text versions
 */
export function formatTextForApi(text: string): { 
  html: string; 
  text: string;
  isMarkdown: boolean;
} {
  const isMarkdown = containsMarkdown(text);
  return {
    html: formatTextToHtml(text),
    text: text,
    isMarkdown
  };
}