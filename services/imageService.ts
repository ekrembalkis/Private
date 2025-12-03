export const searchImage = async (topic: string): Promise<string | null> => {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const cseId = process.env.GOOGLE_CSE_ID;

  if (!apiKey || !cseId) {
    console.error("Google Search API key or CSE ID is missing");
    return null;
  }

  // Elektrik mühendisliği staj konularına uygun arama sorgusu oluştur
  const searchQuery = `${topic} elektrik mühendisliği eğitim tablo şema`;

  try {
    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}&q=${encodeURIComponent(searchQuery)}&searchType=image&num=5&safe=active&imgType=photo`
    );

    if (!response.ok) {
      console.error("Google Search API error:", response.status);
      return null;
    }

    const data = await response.json();

    if (data.items && data.items.length > 0) {
      // Rastgele bir görsel seç (ilk 5'ten)
      const randomIndex = Math.floor(Math.random() * Math.min(5, data.items.length));
      return data.items[randomIndex].link;
    }

    return null;
  } catch (error) {
    console.error("Image search error:", error);
    return null;
  }
};

// Eski fonksiyon kaldırıldı, artık sadece searchImage kullanılıyor