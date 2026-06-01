// lib/recommendation/reasoning.ts

import { RecommendationSignal, RecommendationCategory } from './types';
import { CATEGORIES } from './constants';

export function determineCategoryAndReason(signals: RecommendationSignal, sourceTags: string[] | null, candidateTags: string[] | null): { category: RecommendationCategory, reason: string } {
    
    // Check tags first (highest weight usually)
    if (signals.tagScore > 0.3) {
        let overlapCount = 0;
        let overlapTag = '';
        if (sourceTags && candidateTags) {
            const sourceLower = sourceTags.map(t => t.toLowerCase());
            const candidateLower = candidateTags.map(t => t.toLowerCase());
            const overlaps = sourceLower.filter(tag => candidateLower.includes(tag));
            overlapCount = overlaps.length;
            if (overlapCount > 0) overlapTag = overlaps[0];
        }
        
        if (overlapCount >= 3) {
            return {
                category: CATEGORIES.SIMILAR_SUBJECT,
                reason: `Shares ${overlapCount} common tags including "${overlapTag}"`
            };
        } else if (overlapCount > 0) {
            return {
                category: CATEGORIES.SHARED_TAGS,
                reason: `Shared tag: "${overlapTag}"`
            };
        }
    }
    
    // Check OCR
    if (signals.ocrScore > 0.5) {
        return {
            category: CATEGORIES.RELATED_TOPIC,
            reason: 'Matching OCR keywords'
        };
    }
    
    // Check Event + Mood
    if (signals.eventScore === 1.0 && signals.moodScore === 1.0) {
        return {
            category: CATEGORIES.SAME_EVENT,
            reason: 'Same event and similar mood'
        };
    }
    
    // Check just Event
    if (signals.eventScore === 1.0) {
        return {
            category: CATEGORIES.SAME_EVENT,
            reason: 'From the same event'
        };
    }
    
    // Check Scene / Visual
    if (signals.sceneScore === 1.0) {
        return {
            category: CATEGORIES.VISUAL_MATCH,
            reason: 'Similar visual style'
        };
    }
    
    // Check Description
    if (signals.descScore > 0.3) {
        return {
            category: CATEGORIES.RELATED_TOPIC,
            reason: 'Similar description'
        };
    }
    
    // Check Mood
    if (signals.moodScore === 1.0) {
        return {
            category: CATEGORIES.SIMILAR_MOOD,
            reason: 'Shares the same mood'
        };
    }
    
    // Fallback to generic semantic match
    return {
        category: CATEGORIES.VISUAL_MATCH,
        reason: 'Strong semantic similarity'
    };
}
