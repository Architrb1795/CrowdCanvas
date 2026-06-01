// lib/recommendation/scoring.ts

import { WEIGHTS } from './constants';

// Helper to tokenize and clean text
function tokenize(text: string | null): string[] {
    if (!text) return [];
    return text.toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .split(/\s+/)
        .filter(t => t.length > 2); // Ignore short stop words
}

// Jaccard similarity for sets (arrays of tokens)
function jaccardSimilarity(setA: string[], setB: string[]): number {
    if (setA.length === 0 || setB.length === 0) return 0;
    
    const intersection = setA.filter(x => setB.includes(x)).length;
    const union = new Set([...setA, ...setB]).size;
    
    return intersection / union;
}

// Calculate tag overlap (0.0 to 1.0)
export function calculateTagScore(sourceTags: string[] | null, candidateTags: string[] | null): number {
    if (!sourceTags || !candidateTags || sourceTags.length === 0 || candidateTags.length === 0) {
        return 0;
    }
    
    const sourceLower = sourceTags.map(t => t.toLowerCase());
    const candidateLower = candidateTags.map(t => t.toLowerCase());
    
    // Exact overlap ratio relative to source tags length
    const exactMatches = sourceLower.filter(tag => candidateLower.includes(tag)).length;
    
    // Also consider partial overlaps (e.g. "Iron Spider" intersects "Spider-Man" on "Spider")
    const sourceTokens = sourceLower.flatMap(t => t.split(/\s+/));
    const candidateTokens = candidateLower.flatMap(t => t.split(/\s+/));
    
    const partialScore = jaccardSimilarity(sourceTokens, candidateTokens);
    const exactScore = exactMatches / Math.max(sourceLower.length, 1);
    
    // Return the better of the two scores, capped at 1.0
    return Math.min(Math.max(exactScore, partialScore), 1.0);
}

// Calculate Description overlap
export function calculateDescScore(sourceDesc: string | null, candidateDesc: string | null): number {
    const sourceTokens = tokenize(sourceDesc);
    const candidateTokens = tokenize(candidateDesc);
    return jaccardSimilarity(sourceTokens, candidateTokens);
}

// Calculate OCR overlap
export function calculateOcrScore(sourceOcr: string | null, candidateOcr: string | null): number {
    const sourceTokens = tokenize(sourceOcr);
    const candidateTokens = tokenize(candidateOcr);
    return jaccardSimilarity(sourceTokens, candidateTokens);
}

export function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function calculateCompositeScore(
    sourceMedia: Record<string, unknown>, 
    candidateMedia: Record<string, unknown>, 
    baseVectorSimilarity: number,
    userProfile?: Record<string, unknown> | null,
    personalizationWeight: number = 0.0
) {
    const tagScore = calculateTagScore(sourceMedia.ai_tags as string[] | null, candidateMedia.ai_tags as string[] | null);
    const descScore = calculateDescScore(sourceMedia.ai_caption as string | null, candidateMedia.ai_caption as string | null);
    const ocrScore = calculateOcrScore(sourceMedia.ocr_text as string | null, candidateMedia.ocr_text as string | null);
    
    let moodScore = 0;
    if (sourceMedia.mood && candidateMedia.mood && sourceMedia.mood === candidateMedia.mood) {
        moodScore = 1.0;
    }
    
    let sceneScore = 0;
    if (sourceMedia.scene_type && candidateMedia.scene_type && sourceMedia.scene_type === candidateMedia.scene_type) {
        sceneScore = 1.0;
    }
    
    let eventScore = 0;
    if (sourceMedia.event_id === candidateMedia.event_id) {
        eventScore = 1.0;
    }
    
    // Fallback denomiator adjustment
    let denominator = WEIGHTS.EMBEDDING;
    let totalScore = baseVectorSimilarity * WEIGHTS.EMBEDDING;
    
    if (sourceMedia.ai_tags && (sourceMedia.ai_tags as string[]).length > 0) {
        denominator += WEIGHTS.TAG;
        totalScore += (tagScore * WEIGHTS.TAG);
    } else {
        // If no tags exist on source, boost description and event weight to compensate
        denominator += WEIGHTS.DESC; // absorb some impact
    }
    
    if (sourceMedia.ai_caption) {
        denominator += WEIGHTS.DESC;
        totalScore += (descScore * WEIGHTS.DESC);
    }
    
    if (sourceMedia.ocr_text) {
        denominator += WEIGHTS.OCR;
        totalScore += (ocrScore * WEIGHTS.OCR);
    }
    
    if (sourceMedia.mood) {
        denominator += WEIGHTS.MOOD;
        totalScore += (moodScore * WEIGHTS.MOOD);
    }
    
    if (sourceMedia.scene_type) {
        denominator += WEIGHTS.SCENE;
        totalScore += (sceneScore * WEIGHTS.SCENE);
    }
    
    denominator += WEIGHTS.EVENT;
    totalScore += (eventScore * WEIGHTS.EVENT);
    
    let finalScore = totalScore / denominator;
    
    // Personalization Scoring Layer
    let personalizationScore = 0;
    
    if (userProfile && personalizationWeight > 0) {
        // 1. Tag Match Score
        let pTagScore = 0;
        if (candidateMedia.ai_tags && Array.isArray(candidateMedia.ai_tags) && userProfile.favorite_tags) {
            const favTags = userProfile.favorite_tags as Record<string, number>;
            let tagSum = 0;
            let tagMax = 0;
            for (const tag of Object.keys(favTags)) {
                tagMax += favTags[tag];
                if ((candidateMedia.ai_tags as string[]).includes(tag)) {
                    tagSum += favTags[tag];
                }
            }
            if (tagMax > 0) pTagScore = tagSum / tagMax;
        }
        
        // 2. Embedding Match Score
        let pVectorScore = 0;
        if (candidateMedia.embedding && userProfile.interest_embedding) {
            // Note: DB returns embeddings as strings, so we must parse them
            try {
                const candVec = typeof candidateMedia.embedding === 'string' ? JSON.parse(candidateMedia.embedding) : candidateMedia.embedding;
                const userVec = typeof userProfile.interest_embedding === 'string' ? JSON.parse(userProfile.interest_embedding) : userProfile.interest_embedding;
                pVectorScore = calculateCosineSimilarity(userVec as number[], candVec as number[]);
            } catch (e) {
                // Ignore parse errors
            }
        }
        
        // Combine personalization metrics
        personalizationScore = (pVectorScore * 0.7) + (pTagScore * 0.3);
        
        // Apply Personalization Weight
        finalScore = (finalScore * (1 - personalizationWeight)) + (personalizationScore * personalizationWeight);
    }

    finalScore = Math.min(Math.max(finalScore, 0), 1.0);
    
    return {
        tagScore,
        descScore,
        ocrScore,
        moodScore,
        sceneScore,
        eventScore,
        similarityScore: baseVectorSimilarity,
        personalizationScore,
        finalScore
    };
}
