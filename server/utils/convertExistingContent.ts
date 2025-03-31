import { db } from '../db';
import { workflows } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * Script to analyze and convert existing content to markdown format
 * This tool can be run to enhance the readability of existing documentation
 */
export async function convertExistingContentToMarkdown() {
  console.log('Starting conversion of existing content to markdown format...');
  
  // Get all workflows that have documentation
  const workflowsWithDocs = await db.select()
    .from(workflows)
    .where(
      sql`metadata->>'documentation' IS NOT NULL AND metadata->>'documentation' != ''`
    );
  
  console.log(`Found ${workflowsWithDocs.length} workflows with documentation`);
  
  let convertedCount = 0;
  
  // Process each workflow
  for (const workflow of workflowsWithDocs) {
    const documentation = workflow.metadata?.documentation;
    
    if (!documentation) continue;
    
    // Skip if it already has markdown formatting
    if (hasMarkdownFormatting(documentation)) {
      console.log(`Workflow #${workflow.id} already has markdown formatting. Skipping.`);
      continue;
    }
    
    // Convert to markdown
    const enhancedDocumentation = convertToMarkdown(documentation);
    
    // Update the workflow with enhanced documentation
    if (enhancedDocumentation !== documentation) {
      await db.update(workflows)
        .set({
          metadata: {
            ...workflow.metadata,
            documentation: enhancedDocumentation
          }
        })
        .where(eq(workflows.id, workflow.id));
      
      convertedCount++;
      console.log(`Converted documentation for workflow #${workflow.id}`);
    }
  }
  
  console.log(`Conversion complete. Enhanced ${convertedCount} documents.`);
  return {
    total: workflowsWithDocs.length,
    converted: convertedCount
  };
}

/**
 * Check if text already has markdown formatting
 */
function hasMarkdownFormatting(text: string): boolean {
  // Check for common markdown indicators
  return /[*#\[\]_`~]/.test(text);
}

/**
 * Convert plain text to enhanced markdown
 */
function convertToMarkdown(text: string): string {
  // Split by paragraphs
  const paragraphs = text.split(/\n\n+/);
  
  // Process each paragraph
  const enhancedParagraphs = paragraphs.map((paragraph, index) => {
    paragraph = paragraph.trim();
    
    // Skip empty paragraphs
    if (!paragraph) return '';
    
    // First paragraph is likely a title if it's short
    if (index === 0 && paragraph.length < 80 && !paragraph.endsWith('.')) {
      return `# ${paragraph}`;
    }
    
    // Look for potential section headers (short lines that don't end with punctuation)
    if (paragraph.length < 60 && 
        !paragraph.endsWith('.') && 
        !paragraph.endsWith('?') && 
        !paragraph.includes('\n')) {
      return `## ${paragraph}`;
    }
    
    // Look for potential list items
    if (paragraph.startsWith('- ') || /^\d+\.\s/.test(paragraph)) {
      // Already formatted as a list, keep as is
      return paragraph;
    }
    
    // Convert numbered list-like paragraphs
    if (/^\d+\)/.test(paragraph)) {
      return paragraph.replace(/^(\d+)\)/, '$1.');
    }
    
    // Format steps or sequences that look like they should be lists
    if (paragraph.toLowerCase().startsWith('step ') || 
        paragraph.match(/^(first|second|third|fourth|fifth|next)/i)) {
      return `- ${paragraph}`;
    }
    
    // Find potential bold terms (terms followed by colon or terms in all caps)
    return paragraph.replace(/\b([A-Z]{2,})\b/g, '**$1**')
                    .replace(/([^:]+):\s/g, '**$1:** ');
  });
  
  // Join back with double newlines
  return enhancedParagraphs.join('\n\n');
}

/**
 * Script entry point when run directly
 */
if (require.main === module) {
  convertExistingContentToMarkdown()
    .then(() => {
      console.log('Content conversion completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error during content conversion:', error);
      process.exit(1);
    });
}