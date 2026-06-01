import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function shortenCaptions() {
  console.log('Fetching media with long ai_captions...');
  const { data: mediaItems, error } = await supabase
    .from('media')
    .select('id, ai_caption')
    .not('ai_caption', 'is', null);

  if (error) {
    console.error('Error fetching media:', error);
    return;
  }

  // Filter for captions that are overly long (e.g., > 150 chars or > 3 sentences)
  const longCaptions = mediaItems.filter(m => m.ai_caption && m.ai_caption.length > 200);
  console.log(`Found ${longCaptions.length} captions to shorten.`);

  for (const item of longCaptions) {
    console.log(`\nShortening caption for media ${item.id}...`);
    try {
      const prompt = `Shorten the following image description to exactly 2-3 sentences (maximum 20-30 words). Retain the most important details.\n\nDescription: ${item.ai_caption}`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      const newCaption = response.text.trim();
      console.log('Old:', item.ai_caption);
      console.log('New:', newCaption);

      const { error: updateError } = await supabase
        .from('media')
        .update({ ai_caption: newCaption })
        .eq('id', item.id);

      if (updateError) {
        console.error(`Failed to update media ${item.id}:`, updateError);
      } else {
        console.log(`Successfully updated media ${item.id}`);
      }

      // Respect rate limits
      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.error(`Error processing media ${item.id}:`, err);
    }
  }

  console.log('\nFinished shortening captions.');
}

shortenCaptions();
