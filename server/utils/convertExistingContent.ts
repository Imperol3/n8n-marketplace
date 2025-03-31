import { db } from '../db';
import { workflows } from '@shared/schema';
import { eq, sql, or, isNotNull, ne } from 'drizzle-orm';

/**
 * Script to analyze and convert existing content to markdown format
 * This tool can be run to enhance the readability of existing documentation and descriptions
 */
export async function convertExistingContentToMarkdown() {
  console.log('Starting conversion of existing content to markdown format...');
  
  // Get all workflows that have documentation or descriptions
  const workflowsToProcess = await db.select()
    .from(workflows)
    .where(
      or(
        sql`metadata->>'documentation' IS NOT NULL AND metadata->>'documentation' != ''`,
        sql`description IS NOT NULL AND description != ''`
      )
    );
  
  console.log(`Found ${workflowsToProcess.length} workflows with content to process`);
  
  let convertedDocsCount = 0;
  let convertedDescCount = 0;
  
  // Process each workflow
  for (const workflow of workflowsToProcess) {
    let needsUpdate = false;
    const updates: any = {};
    
    // Process documentation if it exists
    if (workflow.metadata?.documentation) {
      const documentation = workflow.metadata.documentation;
      
      // Skip if it already has markdown formatting
      if (!hasMarkdownFormatting(documentation)) {
        const enhancedDocumentation = convertToMarkdown(documentation);
        
        // Update if there were changes
        if (enhancedDocumentation !== documentation) {
          updates.metadata = {
            ...workflow.metadata,
            documentation: enhancedDocumentation
          };
          needsUpdate = true;
          convertedDocsCount++;
          console.log(`Converted documentation for workflow #${workflow.id}`);
        }
      }
    }
    
    // Process description if it exists
    if (workflow.description) {
      // Skip if it already has markdown formatting
      if (!hasMarkdownFormatting(workflow.description)) {
        const enhancedDescription = convertToMarkdown(workflow.description);
        
        // Update if there were changes
        if (enhancedDescription !== workflow.description) {
          updates.description = enhancedDescription;
          needsUpdate = true;
          convertedDescCount++;
          console.log(`Converted description for workflow #${workflow.id}`);
        }
      }
    }
    
    // Update the workflow if changes were made
    if (needsUpdate) {
      await db.update(workflows)
        .set(updates)
        .where(eq(workflows.id, workflow.id));
    }
  }
  
  const totalConverted = convertedDocsCount + convertedDescCount;
  console.log(`Conversion complete. Enhanced ${convertedDocsCount} documentations and ${convertedDescCount} descriptions.`);
  
  return {
    total: workflowsToProcess.length,
    converted: totalConverted,
    documentations: convertedDocsCount,
    descriptions: convertedDescCount
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
 * @param text The text to convert to markdown
 * @returns Text with markdown formatting applied
 */
export function convertToMarkdown(text: string): string {
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

// Remove the direct execution section as it's not compatible with ES modules