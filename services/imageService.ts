
export const searchImages = async (topic: string, count: number = 15): Promise<string[]> => {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const cseId = process.env.GOOGLE_CSE_ID;

  if (!apiKey || !cseId) {
    console.error("Google Search API key or CSE ID is missing");
    return [];
  }

  // Değişiklik: Arama sorgusu güncellendi
  const searchQuery = `${topic} elektrik tesisat şema teknik çizim diagram`;

  try {
    // Google API max 10 sonuç döndürür, 15 için 2 istek yapacağız
    const results: string[] = [];
    
    // İlk 10 sonuç
    const response1 = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}&q=${encodeURIComponent(searchQuery)}&searchType=image&num=10&safe=active&imgType=photo`
    );
    
    if (response1.ok) {
      const data1 = await response1.json();
      if (data1.items) {
        results.push(...data1.items.map((item: any) => item.link));
      }
    }

    // Sonraki 5 sonuç
    const response2 = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}&q=${encodeURIComponent(searchQuery)}&searchType=image&num=5&start=11&safe=active&imgType=photo`
    );
    
    if (response2.ok) {
      const data2 = await response2.json();
      if (data2.items) {
        results.push(...data2.items.map((item: any) => item.link));
      }
    }

    return results.slice(0, count);
  } catch (error) {
    console.error("Image search error:", error);
    return [];
  }
};
