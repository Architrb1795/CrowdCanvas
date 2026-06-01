// lib/recommendation/types.ts

export interface RecommendationSignal {
    similarityScore: number;
    tagScore: number;
    descScore: number;
    ocrScore: number;
    moodScore: number;
    sceneScore: number;
    eventScore: number;
    finalScore: number;
}

export type RecommendationCategory = 
    | 'Similar Subject'
    | 'Same Event'
    | 'Shared Tags'
    | 'Similar Mood'
    | 'Visual Match'
    | 'Related Topic';

export interface RecommendedMedia {
    id: string;
    event_id: string;
    file_url: string;
    thumbnail_url: string;
    media_type: string;
    ai_caption: string | null;
    ai_tags: string[] | null;
    ocr_text: string | null;
    mood: string | null;
    scene_type: string | null;
    
    // Injected by Recommendation Engine
    matchPercentage: number;
    category: RecommendationCategory;
    reason: string;
    signals: RecommendationSignal;
}

export interface RecommendationCacheEntry {
    id: string;
    source_media_id: string;
    recommendations: RecommendedMedia[];
    generated_at: string;
    expires_at: string;
}
