/**
 * Detects if a string contains markdown formatting
 * @param text The text to check
 * @returns Boolean indicating if markdown formatting is detected
 */
export function containsMarkdown(text: string): boolean {
  // Check for common markdown indicators
  return /[*#\[\]_`~]/.test(text);
}

/**
 * Formats text content to HTML based on content type detection
 * @param content The text content to format
 * @returns HTML string of the formatted content
 */
export function formatTextToHtml(content: string): string {
  if (!content) return '';
  
  // Check if content contains markdown
  if (containsMarkdown(content)) {
    try {
      // In a production app, we'd use a library like marked
      // Here we'll do simple conversion for demonstration
      return convertMarkdownToHtml(content);
    } catch (error) {
      console.error('Error converting markdown to HTML:', error);
      // Fallback to basic formatting
      return formatPlainTextToHtml(content);
    }
  }
  
  // Format as regular text
  return formatPlainTextToHtml(content);
}

/**
 * A very simple markdown to HTML converter
 * In a real app, use a library like marked
 */
function convertMarkdownToHtml(markdown: string): string {
  // Convert headings (# Heading)
  let html = markdown.replace(/^(#{1,6})\s+(.+)$/gm, (_, hashtags, text) => {
    const level = hashtags.length;
    return `<h${level}>${text}</h${level}>`;
  });
  
  // Convert bold (**bold**)
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Convert italic (*italic*)
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Convert paragraphs
  html = html.split('\n\n').map(para => {
    // Skip if it's already a heading
    if (para.startsWith('<h')) return para;
    return `<p>${para.replace(/\n/g, '<br>')}</p>`;
  }).join('');
  
  return html;
}

/**
 * Formats plain text with proper paragraph breaks
 * @param text The plain text to format
 * @returns HTML formatted version of the text
 */
function formatPlainTextToHtml(text: string): string {
  return text
    .split('\n\n')
    .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
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
  plainText: string;
  isMarkdown: boolean;
} {
  const isMarkdown = containsMarkdown(text);
  return {
    html: formatTextToHtml(text),
    plainText: text,
    isMarkdown
  };
}