// lib/recommendation/engine.ts

import { SupabaseClient } from '@supabase/supabase-js';
import { RecommendedMedia } from './types';
import { getCachedRecommendations, setCachedRecommendations } from './cache';
import { getRecommendationCandidates } from './candidate-selection';
import { calculateCompositeScore } from './scoring';
import { determineCategoryAndReason } from './reasoning';
import { getRecommendationWeights } from './config';

export async function getSimilarPhotos(supabaseAdmin: SupabaseClient, sourceMediaId: string, userId?: string): Promise<RecommendedMedia[]> {
    // 1. Check Cache ONLY if there is no logged-in user to personalize for.
    // If we have a userId, we must compute fresh scores for personalization.
    if (!userId) {
        const cached = await getCachedRecommendations(supabaseAdmin, sourceMediaId);
        if (cached) {
            return cached;
        }
    }

    // 2. Fetch Source Media Details
    const { data: sourceMedia, error } = await supabaseAdmin
        .from('media')
        .select('*')
        .eq('id', sourceMediaId)
        .single();
        
    if (error || !sourceMedia) {
        console.error('Source media not found for recommendation', error);
        return [];
    }

    // 3. Fetch Candidates, Weights, and User Profile (if logged in)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const promises: any[] = [
        getRecommendationCandidates(supabaseAdmin, sourceMedia),
        getRecommendationWeights(supabaseAdmin)
    ];

    if (userId) {
        promises.push(
            supabaseAdmin.from('user_preference_profiles').select('*').eq('user_id', userId).single()
        );
    }

    const [candidates, weights, profileResponse] = await Promise.all(promises);
    const userProfile = profileResponse?.data || null;
    
    // Determine personalization weight (Cold Start Strategy)
    // If user has high engagement (>10), we weigh personalization up to 40%
    let personalizationWeight = 0;
    if (userProfile && userProfile.engagement_score > 0) {
        personalizationWeight = Math.min(0.4, userProfile.engagement_score / 50.0);
    }
    
    if (candidates.length === 0) {
        return [];
    }

    // 4. Score and Reason
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scoredCandidates: RecommendedMedia[] = candidates.map((candidate: any) => {
        const signals = calculateCompositeScore(sourceMedia, candidate, Math.max(0, (candidate.similarity as number) || 0), userProfile, personalizationWeight);
        
        const { category, reason } = determineCategoryAndReason(signals, sourceMedia.ai_tags as string[] | null, candidate.ai_tags as string[] | null);
        
        return {
            id: candidate.id as string,
            event_id: candidate.event_id as string,
            file_url: candidate.file_url as string,
            thumbnail_url: candidate.thumbnail_url as string,
            media_type: candidate.media_type as string,
            ai_caption: candidate.ai_caption as string | null,
            ai_tags: candidate.ai_tags as string[] | null,
            ocr_text: candidate.ocr_text as string | null,
            mood: candidate.mood as string | null,
            scene_type: candidate.scene_type as string | null,
            matchPercentage: Math.round(signals.finalScore * 100),
            category,
            reason,
            signals
        };
    });

    // 5. Sort & Slice (Top 8)
    scoredCandidates.sort((a, b) => b.signals.finalScore - a.signals.finalScore);
    const topRecommendations = scoredCandidates.slice(0, 8);

    // 6. Set Cache (only for generic non-personalized requests)
    if (!userId) {
        await setCachedRecommendations(supabaseAdmin, sourceMediaId, topRecommendations);
    }

    return topRecommendations;
}
