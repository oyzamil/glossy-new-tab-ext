export interface Quote {
  content: string;
  author: string;
}

export interface QuoteApiResponse {
  content: string;
  author: string;
}

export const DEFAULT_QUOTES: Quote[] = [
  {
    content:
      'If today were the last day of your life, would you want to do what you are about to do today?',
    author: 'Steve Jobs',
  },
];

export const SYNC_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
export const SLIDE_INTERVAL_MS = 10 * 1000; // 10 seconds
export const QUOTE_API_URL = 'https://type.fit/api/quotes';
export const FALLBACK_API_URL = 'https://type.fit/api/quotes';

export const fetchQuotes = async (): Promise<Quote[]> => {
  try {
    const response = await fetch(QUOTE_API_URL);
    if (!response.ok) throw new Error('Primary API failed');
    const data = await response.json();

    // Standard format for quotable.io results
    if (data.results && Array.isArray(data.results)) {
      return data.results.map((q: any) => ({
        content: q.content,
        author: q.author,
      }));
    }
    return [];
  } catch (error) {
    console.warn('Primary quote API failed, trying fallback...', error);
    try {
      const fallbackResponse = await fetch(FALLBACK_API_URL);
      if (!fallbackResponse.ok) throw new Error('Fallback API failed');
      const fallbackData = await fallbackResponse.json();

      // format for type.fit: [{ text: "...", author: "..." }]
      return fallbackData.slice(0, 100).map((q: any) => ({
        content: q.text,
        author: q.author?.replace(', type.fit', '') || 'Unknown',
      }));
    } catch (fallbackError) {
      console.error('All quote APIs failed', fallbackError);
      return [];
    }
  }
};
