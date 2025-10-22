/**
 * Knowledge Base Loader
 * 
 * Loads and parses markdown configuration files for the recommendation engine.
 * These files contain the climate priorities, resources, expert knowledge, and
 * data source configurations that drive AI recommendations.
 * 
 * Files are loaded from supabase/functions/_shared/knowledge/ directory.
 */

interface ExternalResource {
  name: string;
  url: string;
  purpose: string;
  refresh: string;
  sections: string;
}

interface KnowledgeBase {
  priorities: string;
  resources: string;
  expertContext: string;
  dataSources: string;
  externalResources?: ExternalResource[];
  externalContent?: Map<string, { content: string; fetchedAt: number }>;
}

// Simple in-memory cache to avoid re-reading files on every request
let knowledgeCache: KnowledgeBase | null = null;
let externalContentCache: Map<string, { content: string; fetchedAt: number }> = new Map();

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

    // Parse external resources from expert context
    const externalResources = parseExternalResources(expertContext);
    console.log(`Found ${externalResources.length} external resources to fetch`);
    
    // Fetch external resources (non-blocking)
    const externalContent = await loadExternalResources(externalResources);
    
    // Cache the results
    knowledgeCache = {
      priorities,
      resources,
      expertContext,
      dataSources,
      externalResources,
      externalContent,
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
 * Parse external resources from the expert-context markdown
 * Extracts URLs and metadata for resources to fetch
 */
export function parseExternalResources(expertContextMarkdown: string): ExternalResource[] {
  const resources: ExternalResource[] = [];
  const section = extractSection(expertContextMarkdown, '## External Resources for Real-Time Context');
  
  if (!section) return resources;
  
  const lines = section.split('\n');
  let currentResource: Partial<ExternalResource> = {};
  
  for (const line of lines) {
    if (line.startsWith('### ') && !line.includes('How External') && !line.includes('Adding New') && !line.includes('Notes for')) {
      if (currentResource.name) {
        resources.push(currentResource as ExternalResource);
      }
      currentResource = {
        name: line.replace('### ', '').trim(),
        url: '',
        purpose: '',
        refresh: 'Daily',
        sections: ''
      };
    } else if (line.startsWith('**URL:**') && currentResource) {
      currentResource.url = line.replace('**URL:**', '').trim();
    } else if (line.startsWith('**Purpose:**') && currentResource) {
      currentResource.purpose = line.replace('**Purpose:**', '').trim();
    } else if (line.startsWith('**Refresh:**') && currentResource) {
      currentResource.refresh = line.replace('**Refresh:**', '').trim();
    } else if (line.startsWith('**Sections to extract:**') && currentResource) {
      currentResource.sections = line.replace('**Sections to extract:**', '').trim();
    }
  }
  
  if (currentResource.name && currentResource.url) {
    resources.push(currentResource as ExternalResource);
  }
  
  return resources;
}

/**
 * Get cache duration in milliseconds based on refresh frequency
 */
function getCacheDuration(refresh: string): number {
  const durations: Record<string, number> = {
    'Hourly': 60 * 60 * 1000,
    'Daily': 24 * 60 * 60 * 1000,
    'Weekly': 7 * 24 * 60 * 60 * 1000,
    'Monthly': 30 * 24 * 60 * 60 * 1000,
  };
  return durations[refresh] || durations['Daily'];
}

/**
 * Fetch content from an external resource with caching
 */
async function fetchExternalResource(resource: ExternalResource): Promise<string> {
  const cached = externalContentCache.get(resource.url);
  const cacheDuration = getCacheDuration(resource.refresh);
  
  // Return cached content if still valid
  if (cached && (Date.now() - cached.fetchedAt) < cacheDuration) {
    console.log(`Using cached content for ${resource.name}`);
    return cached.content;
  }
  
  try {
    console.log(`Fetching external resource: ${resource.name} from ${resource.url}`);
    const response = await fetch(resource.url, {
      headers: {
        'User-Agent': 'AustinCleanEnergyBot/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const content = await response.text();
    
    // Cache the fetched content
    externalContentCache.set(resource.url, {
      content,
      fetchedAt: Date.now()
    });
    
    console.log(`Successfully fetched ${resource.name} (${content.length} chars)`);
    return content;
  } catch (error) {
    console.error(`Failed to fetch ${resource.name}:`, error);
    // Return cached content even if expired, or empty string
    return cached?.content || '';
  }
}

/**
 * Load all external resources asynchronously
 */
async function loadExternalResources(resources: ExternalResource[]): Promise<Map<string, { content: string; fetchedAt: number }>> {
  const contentMap = new Map<string, { content: string; fetchedAt: number }>();
  
  // Fetch all resources in parallel
  const results = await Promise.allSettled(
    resources.map(async (resource) => ({
      name: resource.name,
      url: resource.url,
      content: await fetchExternalResource(resource)
    }))
  );
  
  // Process results
  results.forEach((result) => {
    if (result.status === 'fulfilled' && result.value.content) {
      contentMap.set(result.value.name, {
        content: result.value.content,
        fetchedAt: Date.now()
      });
    }
  });
  
  return contentMap;
}

/**
 * Get formatted external context for AI prompts
 */
export function getExternalContext(knowledgeBase: KnowledgeBase): string {
  if (!knowledgeBase.externalContent || knowledgeBase.externalContent.size === 0) {
    return '';
  }
  
  let context = '\n\n## SUPPLEMENTAL REAL-TIME INFORMATION\n\n';
  context += 'The following is current information fetched from external sources to supplement the core knowledge base:\n\n';
  
  for (const [name, data] of knowledgeBase.externalContent.entries()) {
    const age = Math.floor((Date.now() - data.fetchedAt) / (60 * 60 * 1000));
    context += `### ${name} (fetched ${age}h ago)\n${data.content.slice(0, 2000)}\n\n`;
  }
  
  return context;
}

/**
 * Clear the knowledge cache
 * Call this if you need to force a reload of the markdown files
 */
export function clearKnowledgeCache(): void {
  knowledgeCache = null;
  externalContentCache.clear();
  console.log('Knowledge cache cleared');
}
