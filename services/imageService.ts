
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
  if (!UNSPLASH_ACCESS_KEY || UNSPLASH_ACCESS_KEY === "YOUR_ACCESS_KEY_HERE") {
     console.warn("Unsplash API Key is missing or invalid.");
     // Fallback to a random image service if no key (for demo purposes)
     // or return null to indicate failure
     return `https://source.unsplash.com/random/800x600/?${encodeURIComponent(getSearchQuery(query))}`;
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
    return null;
  }
};