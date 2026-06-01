// lib/recommendation/config.ts

import { SupabaseClient } from '@supabase/supabase-js';
import { WEIGHTS, setDynamicWeights } from './constants';

let weightsCache: typeof WEIGHTS | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getRecommendationWeights(supabase: SupabaseClient) {
    if (weightsCache && Date.now() - lastFetchTime < CACHE_TTL) {
        return weightsCache;
    }

    try {
        const { data, error } = await supabase
            .from('recommendation_weights_config')
            .select('*')
            .limit(1)
            .single();

        if (error || !data) {
            console.warn('Failed to load dynamic weights, falling back to defaults', error);
            return WEIGHTS; // Fallback
        }

        const newWeights = {
            TAG: data.tag_weight,
            DESC: data.desc_weight,
            OCR: data.ocr_weight,
            MOOD: data.mood_weight,
            SCENE: data.scene_weight,
            EVENT: data.event_weight,
            EMBEDDING: data.embedding_weight
        };

        weightsCache = newWeights;
        lastFetchTime = Date.now();
        setDynamicWeights(newWeights);
        return newWeights;

    } catch (err) {
        console.error('Error fetching recommendation weights:', err);
        return WEIGHTS;
    }
}
