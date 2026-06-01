import { SupabaseClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Reads a user's preference profile and uses Gemini to generate a human-readable summary.
 * This is only re-calculated occasionally (e.g., if ai_summary_updated_at is > 7 days ago, or manually triggered)
 */
export async function generateUserProfileInsight(supabaseAdmin: SupabaseClient, userId: string): Promise<string | null> {
    const { data: profile, error } = await supabaseAdmin
        .from('user_preference_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error || !profile) {
        console.error('Failed to fetch profile for insight generation:', error);
        return null;
    }

    // Only generate if there is enough data
    if (profile.engagement_score < 5) {
        return "You haven't interacted with enough content yet! Keep exploring CrowdCanvas for personalized insights.";
    }

    const prompt = `
    You are an AI personalization engine for CrowdCanvas, an image and event discovery platform.
    Analyze the following user behavior data and generate a short, friendly, and highly insightful 2-sentence summary of their preferences. 
    Write directly to the user (e.g., "You strongly prefer..."). 
    Do not mention "data", "JSON", or "metrics". Keep it natural.

    User Engagement Score: ${profile.engagement_score} (Higher means more active)
    Favorite Tags: ${JSON.stringify(profile.favorite_tags)}
    Favorite Moods: ${JSON.stringify(profile.favorite_moods)}
    Favorite Scene Types: ${JSON.stringify(profile.favorite_scenes)}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const summary = response.text || "Your unique tastes are still taking shape!";

        // Save the summary back to the database
        await supabaseAdmin
            .from('user_preference_profiles')
            .update({
                ai_profile_summary: summary,
                ai_summary_updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);

        return summary;
    } catch (aiError) {
        console.error('Gemini API Error during insight generation:', aiError);
        return null;
    }
}
