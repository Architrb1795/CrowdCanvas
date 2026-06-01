// lib/recommendation/cache.ts

import { SupabaseClient } from '@supabase/supabase-js';
import { RecommendationCacheEntry, RecommendedMedia } from './types';
import { CACHE_TTL_MS } from './constants';

export async function getCachedRecommendations(supabaseAdmin: SupabaseClient, sourceMediaId: string): Promise<RecommendedMedia[] | null> {
    try {
        const { data, error } = await supabaseAdmin
            .from('recommendation_cache')
            .select('recommendations, expires_at')
            .eq('source_media_id', sourceMediaId)
            .single();

        if (error || !data) return null;
        
        const expiresAt = new Date(data.expires_at).getTime();
        if (Date.now() > expiresAt) {
            // Cache expired, delete it in the background
            supabaseAdmin.from('recommendation_cache').delete().eq('source_media_id', sourceMediaId).then();
            return null;
        }

        return data.recommendations as RecommendedMedia[];
    } catch (e) {
        console.error('Error fetching recommendation cache', e);
        return null;
    }
}

export async function setCachedRecommendations(supabaseAdmin: SupabaseClient, sourceMediaId: string, recommendations: RecommendedMedia[]): Promise<void> {
    try {
        const expiresAt = new Date(Date.now() + CACHE_TTL_MS).toISOString();
        
        // Upsert to handle race conditions gracefully
        await supabaseAdmin.from('recommendation_cache').upsert({
            source_media_id: sourceMediaId,
            recommendations: recommendations,
            expires_at: expiresAt
        }, { onConflict: 'source_media_id' });
    } catch (e) {
        console.error('Error setting recommendation cache', e);
    }
}
