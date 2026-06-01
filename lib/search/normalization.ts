// Query Normalization Layer
// This file maps user queries to canonical terms to ensure consistent hybrid search results.

const SYNONYMS: Record<string, string[]> = {
  // Automotive / Racing
  'f1': ['formula 1', 'formula one', 'grand prix', 'racing car', 'motorsport'],
  'formula 1': ['f1', 'formula one', 'grand prix', 'racing car', 'motorsport'],
  'formula one': ['f1', 'formula 1', 'grand prix', 'racing car', 'motorsport'],
  'car': ['vehicle', 'auto', 'automobile', 'racing car'],
  
  // Pop Culture / Characters
  'spider': ['spider-man', 'spiderman', 'iron spider', 'peter parker'],
  'spiderman': ['spider', 'spider-man', 'iron spider', 'peter parker'],
  'spider-man': ['spider', 'spiderman', 'iron spider', 'peter parker'],
  
  // Technical / Electronics
  'electronics': ['circuits', 'sensors', 'transducers', 'microchip', 'hardware'],
  'formula': ['equations', 'notes', 'diagram', 'mathematics'],
  'missile': ['rocket', 'interceptor', 'weapon', 'military'],
  
  // Events
  'prom': ['prom night', 'dance', 'party', 'formal'],
  'prom night': ['prom', 'dance', 'party', 'formal'],
  
  // Indian / Cultural
  'krishna': ['lord krishna', 'radha', 'hindu', 'deity', 'god']
};

export interface NormalizedQuery {
  original: string;
  primary: string;
  synonyms: string[];
  allTerms: string[];
}

export function normalizeQuery(query: string): NormalizedQuery {
  const cleanQuery = query.toLowerCase().trim();
  const synonyms = SYNONYMS[cleanQuery] || [];
  
  // We check if the query is a partial match to any key in our dictionary
  // to support things like "f1 car" picking up "f1" synonyms.
  let additionalSynonyms: string[] = [];
  if (synonyms.length === 0) {
    for (const [key, vals] of Object.entries(SYNONYMS)) {
      // If the query contains a mapped word (e.g., "spider man render" contains "spider-man")
      if (cleanQuery.includes(key)) {
        additionalSynonyms = [...additionalSynonyms, ...vals];
      }
    }
  }

  const finalSynonyms = Array.from(new Set([...synonyms, ...additionalSynonyms]));
  
  return {
    original: query,
    primary: cleanQuery,
    synonyms: finalSynonyms,
    allTerms: Array.from(new Set([cleanQuery, ...finalSynonyms]))
  };
}
