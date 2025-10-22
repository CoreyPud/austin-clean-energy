/**
 * Knowledge Base Loader
 * 
 * Loads and parses markdown configuration files for the recommendation engine.
 * These files contain the climate priorities, resources, expert knowledge, and
 * data source configurations that drive AI recommendations.
 * 
 * Files are loaded from supabase/functions/_shared/knowledge/ directory.
 */

interface KnowledgeBase {
  priorities: string;
  resources: string;
  expertContext: string;
  dataSources: string;
}

// Simple in-memory cache to avoid re-reading files on every request
let knowledgeCache: KnowledgeBase | null = null;

/**
 * Load all knowledge base markdown files
 * Results are cached after first load
 */
export async function loadKnowledge(): Promise<KnowledgeBase> {
  // Return cached version if available
  if (knowledgeCache) {
    return knowledgeCache;
  }

  try {
    // Read all markdown files
    const [priorities, resources, expertContext, dataSources] = await Promise.all([
      Deno.readTextFile(new URL('./knowledge/priorities.md', import.meta.url)),
      Deno.readTextFile(new URL('./knowledge/resources.md', import.meta.url)),
      Deno.readTextFile(new URL('./knowledge/expert-context.md', import.meta.url)),
      Deno.readTextFile(new URL('./knowledge/data-sources.md', import.meta.url)),
    ]);

    // Cache the results
    knowledgeCache = {
      priorities,
      resources,
      expertContext,
      dataSources,
    };

    console.log('Knowledge base loaded successfully');
    return knowledgeCache;
  } catch (error) {
    console.error('Failed to load knowledge base:', error);
    
    // Return error message that will be visible in logs
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Knowledge base loading failed: ${errorMessage}. Ensure markdown files exist in supabase/functions/_shared/knowledge/`);
  }
}

/**
 * Extract a specific section from a markdown file
 * Useful for pulling out just one priority or resource category
 * 
 * @param markdown - Full markdown content
 * @param sectionTitle - The heading to extract (e.g., "## Solar Programs")
 * @returns The content under that heading until the next heading of same or higher level
 */
export function extractSection(markdown: string, sectionTitle: string): string {
  const lines = markdown.split('\n');
  const headingLevel = (sectionTitle.match(/^#+/) || [''])[0].length;
  
  let startIndex = -1;
  let endIndex = lines.length;
  
  // Find the start of the section
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().toLowerCase() === sectionTitle.toLowerCase()) {
      startIndex = i;
      break;
    }
  }
  
  if (startIndex === -1) {
    return ''; // Section not found
  }
  
  // Find the end of the section (next heading of same or higher level)
  for (let i = startIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('#')) {
      const currentLevel = (line.match(/^#+/) || [''])[0].length;
      if (currentLevel <= headingLevel) {
        endIndex = i;
        break;
      }
    }
  }
  
  return lines.slice(startIndex, endIndex).join('\n').trim();
}

/**
 * Parse resource links from the resources markdown
 * Returns a structured list of resources with URLs and descriptions
 */
export function parseResourceLinks(resourcesMarkdown: string): Array<{category: string, name: string, url: string, description: string}> {
  const resources: Array<{category: string, name: string, url: string, description: string}> = [];
  const lines = resourcesMarkdown.split('\n');
  
  let currentCategory = '';
  let currentResource: any = null;
  
  for (const line of lines) {
    // Category heading (## Solar Programs)
    if (line.startsWith('## ') && !line.startsWith('## How to Use')) {
      currentCategory = line.replace('## ', '').trim();
    }
    // Resource name (### Austin Energy Solar Solutions)
    else if (line.startsWith('### ')) {
      if (currentResource) {
        resources.push(currentResource);
      }
      currentResource = {
        category: currentCategory,
        name: line.replace('### ', '').trim(),
        url: '',
        description: ''
      };
    }
    // URL line
    else if (line.startsWith('**URL:**') && currentResource) {
      currentResource.url = line.replace('**URL:**', '').trim();
    }
    // Description line
    else if (line.startsWith('**Description:**') && currentResource) {
      currentResource.description = line.replace('**Description:**', '').trim();
    }
  }
  
  // Add last resource
  if (currentResource) {
    resources.push(currentResource);
  }
  
  return resources;
}

/**
 * Clear the knowledge cache
 * Call this if you need to force a reload of the markdown files
 */
export function clearKnowledgeCache(): void {
  knowledgeCache = null;
  console.log('Knowledge cache cleared');
}
