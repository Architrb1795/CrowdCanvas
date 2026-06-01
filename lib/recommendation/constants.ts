// lib/recommendation/constants.ts

export let WEIGHTS = {
    TAG: 0.35,
    DESC: 0.20,
    OCR: 0.10,
    MOOD: 0.10,
    SCENE: 0.10,
    EVENT: 0.10,
    EMBEDDING: 0.05
};

export function setDynamicWeights(newWeights: typeof WEIGHTS) {
    WEIGHTS = { ...WEIGHTS, ...newWeights };
}

// If data is missing (e.g. no tags or OCR), we fallback
// and divide by a smaller denominator.
export const MIN_DENOMINATOR = 0.20; 

// Cache expiration: 24 hours in milliseconds
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export const CATEGORIES = {
    SIMILAR_SUBJECT: 'Similar Subject',
    SAME_EVENT: 'Same Event',
    SHARED_TAGS: 'Shared Tags',
    SIMILAR_MOOD: 'Similar Mood',
    VISUAL_MATCH: 'Visual Match',
    RELATED_TOPIC: 'Related Topic'
} as const;
