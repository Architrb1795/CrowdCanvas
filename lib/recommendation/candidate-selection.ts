// lib/recommendation/candidate-selection.ts

import { SupabaseClient } from '@supabase/supabase-js';

export async function getRecommendationCandidates(supabaseAdmin: SupabaseClient, sourceMedia: Record<string, unknown>): Promise<Record<string, unknown>[]> {
    if (sourceMedia.embedding) {
        // Broad vector search to cast a wide net (Top 50)
        // We use a very low threshold to ensure we get plenty of candidates for the JS engine to sort
        const { data: matchedMedia, error } = await supabaseAdmin.rpc('match_media', {
            query_embedding: sourceMedia.embedding,
            match_threshold: 0.05,
            match_count: 50,
            filter_event_id: null,
            filter_mood: null,
            filter_scene: null,
            filter_people_count: null,
        });

        if (error || !matchedMedia) return [];
        
        let candidates = matchedMedia.filter((m: Record<string, unknown>) => m.id !== sourceMedia.id); // Remove self
        
        // Fetch missing columns that the RPC doesn't return
        if (candidates.length > 0) {
            const ids = candidates.map((c: Record<string, unknown>) => c.id);
            const { data: extraData } = await supabaseAdmin.from('media').select('id, ocr_text, mood, scene_type').in('id', ids);
            if (extraData) {
                const extraMap = new Map(extraData.map((e: Record<string, unknown>) => [e.id, e]));
                candidates = candidates.map((c: Record<string, unknown>) => ({ ...c, ...((extraMap.get(c.id) as object) || {}) }));
            }
        }
        
        return candidates;
    } else {
        // FALLBACK: If source media has no embedding, fallback to same-event photos
        const { data: eventMatches, error } = await supabaseAdmin
            .from('media')
            .select('id, event_id, file_url, thumbnail_url, media_type, ai_caption, ai_tags, ocr_text, mood, scene_type')
            .eq('event_id', sourceMedia.event_id)
            .neq('id', sourceMedia.id)
            .limit(50);
            
        if (error || !eventMatches) return [];
        
        return eventMatches.map((m: Record<string, unknown>) => ({ ...m, similarity: 0 })); // Base vector similarity is 0
    }
}
