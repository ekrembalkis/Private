
import { IMAGE_SEARCH_TERMS, UNSPLASH_ACCESS_KEY } from '../constants';

// Helper to determine the best search query based on the Turkish topic
const getSearchQuery = (specificTopic: string): string => {
  const lowerTopic = specificTopic.toLowerCase();
  
  // Try to find a matching keyword in our dictionary
  for (const [key, value] of Object.entries(IMAGE_SEARCH_TERMS)) {
    if (lowerTopic.includes(key.toLowerCase())) {
      return value;
    }
  }
  
  // Default fallback if no keyword matches
  return "electrical engineering construction site";
};

export const searchStockImage = async (query: string): Promise<string | null> => {
  // If no API Key is provided, use a public placeholder service that supports keywords
  if (!UNSPLASH_ACCESS_KEY || UNSPLASH_ACCESS_KEY === "YOUR_ACCESS_KEY_HERE") {
     console.warn("Unsplash API Key is missing. Using fallback service.");
     
     // Get keywords and format them for LoremFlickr (comma separated)
     const searchTerms = getSearchQuery(query);
     // Take first 2-3 words to ensure better relevance with simple tag matching
     const tags = searchTerms.split(' ').slice(0, 3).join(',');
     
     // Add a random timestamp to prevent caching the same image for different days
     return `https://loremflickr.com/800/600/${tags}?random=${Date.now()}`;
  }

  try {
    const derivedQuery = getSearchQuery(query);
    console.log(`Searching Unsplash for: ${derivedQuery} (Derived from: ${query})`);

    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(derivedQuery)}&per_page=10&orientation=landscape&content_filter=high`,
      {
        headers: {
          Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`
        }
      }
    );
    
    if (!response.ok) {
        throw new Error(`Unsplash API Error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      // Pick a random image from the top results to add variety
      const randomIndex = Math.floor(Math.random() * Math.min(data.results.length, 5));
      return data.results[randomIndex].urls.regular;
    }
    
    return null;
  } catch (error) {
    console.error("Stock image search failed:", error);
    // Final fallback on error
    return `https://loremflickr.com/800/600/electrical,engineering?random=${Date.now()}`;
  }
};
