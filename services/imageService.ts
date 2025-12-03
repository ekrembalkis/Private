
export interface StockImage {
  id: string;
  url: string;
  thumbUrl: string;
  title: string;
}

// Query temizleme
const cleanQuery = (query: string): string => {
  return query.replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/g, ' ').trim();
};

// Google Custom Search
const searchGoogleImages = async (
  query: string,
  count: number = 10
): Promise<StockImage[]> => {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const cseId = process.env.GOOGLE_CSE_ID;

  if (!apiKey || !cseId) {
    console.error("Google Search API key or CSE ID is missing");
    return [];
  }

  try {
    const cleanedQuery = cleanQuery(query);
    console.log('Searching Google Images for:', cleanedQuery);

    const url = `https://www.googleapis.com/customsearch/v1?` +
      `key=${apiKey}` +
      `&cx=${cseId}` +
      `&q=${encodeURIComponent(cleanedQuery)}` +
      `&searchType=image` +
      `&num=${Math.min(count, 10)}` +
      `&imgSize=large` +
      `&safe=active`;

    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json();
      console.error('Google Image Search error:', error);
      return [];
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      console.log('No images found for:', cleanedQuery);
      return [];
    }

    console.log(`Found ${data.items.length} images`);

    return data.items.map((item: any, index: number) => ({
      id: `img-${index}-${Date.now()}`,
      url: item.link,
      thumbUrl: item.image?.thumbnailLink || item.link,
      title: item.title || query
    }));
  } catch (error) {
    console.error('Google Image Search failed:', error);
    return [];
  }
};

// Tip bazlı arama sorguları - çok spesifik
const getSearchQueries = (topic: string, imageType: string): string[] => {
  const baseTopic = topic.split(' ').slice(0, 4).join(' '); // İlk 4 kelime
  
  switch(imageType) {
    case 'autocad':
      return [
        `${baseTopic} AutoCAD elektrik projesi çizim`,
        `${baseTopic} elektrik tesisat projesi dwg`,
        `elektrik proje çizimi AutoCAD plan`,
        `iç tesisat elektrik projesi teknik çizim`
      ];
    case 'saha':
      return [
        `${baseTopic} elektrik montaj kurulum`,
        `${baseTopic} elektrik tesisat saha`,
        `elektrik pano montaj kablolama`,
        `elektrikçi tesisat kurulum`
      ];
    case 'tablo':
      return [
        `${baseTopic} elektrik şema diyagram`,
        `${baseTopic} tek hat şeması`,
        `elektrik sembol tablosu eğitim`,
        `elektrik devre şeması diyagram`
      ];
    default:
      return [baseTopic, `${baseTopic} elektrik`];
  }
};

// Ana arama fonksiyonu - fallback mekanizmalı
export const searchImages = async (
  topic: string,
  count: number = 15,
  imageType: string = 'autocad'
): Promise<StockImage[]> => {
  const queries = getSearchQueries(topic, imageType);
  let allResults: StockImage[] = [];
  
  // Her sorgu için ara, yeterli sonuç bulana kadar devam et
  for (const query of queries) {
    if (allResults.length >= count) break;
    
    const needed = count - allResults.length;
    const results = await searchGoogleImages(query, Math.min(needed, 10));
    
    // Duplicate URL'leri filtrele
    const newResults = results.filter(r => 
      !allResults.some(existing => existing.url === r.url)
    );
    
    allResults = [...allResults, ...newResults];
    console.log(`Query "${query}" returned ${results.length} results. Total: ${allResults.length}`);
    
    // API rate limit için küçük bekleme
    if (allResults.length < count) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  return allResults.slice(0, count);
};
