/**
 * Translates a given English text to Sinhala using the free client-side Google Translate API.
 * Supports multi-line and multi-sentence translation.
 */
export async function translateToSinhala(text: string): Promise<string> {
  if (!text.trim()) return '';
  
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=si&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Google Translate API responded with status ${res.status}`);
    }
    
    const data = await res.json();
    
    // Google Translate single API returns a multi-dimensional array.
    // The translations of the sentences are stored in data[0], where each element is an array
    // with index 0 representing the translated sentence.
    if (data && data[0] && Array.isArray(data[0])) {
      const translatedParts = data[0]
        .map((part: any) => part && part[0])
        .filter((part: any) => typeof part === 'string');
      
      return translatedParts.join('').trim();
    }
    
    return '';
  } catch (error) {
    console.error('Translation error:', error);
    return '';
  }
}
