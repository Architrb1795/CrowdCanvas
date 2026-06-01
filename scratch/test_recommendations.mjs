import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testRecommendations() {
  console.log('--- STARTING RECOMMENDATION ENGINE TEST ---');
  
  // 1. Get a test media item (e.g. an image that has ai_tags)
  const { data: testMedia, error: err1 } = await supabaseAdmin
    .from('media')
    .select('id, ai_tags, ai_caption, ocr_text')
    .not('ai_tags', 'is', null)
    .limit(1)
    .single();

  if (err1 || !testMedia) {
    console.error('Failed to find test media', err1);
    return;
  }

  console.log('\n[1] Selected Source Media:', testMedia.id);
  console.log('    Tags:', testMedia.ai_tags);
  console.log('    Caption:', testMedia.ai_caption);
  
  // 2. Clear cache for this item to force a fresh run
  await supabaseAdmin.from('recommendation_cache').delete().eq('source_media_id', testMedia.id);
  console.log('\n[2] Cleared recommendation cache for testing...');

  // 3. Call the API directly locally
  console.log('\n[3] Triggering recommendation generation...');
  const res = await fetch('http://localhost:3000/api/ai/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mediaId: testMedia.id })
  });

  const data = await res.json();
  
  if (!res.ok || !data.success) {
      console.error('API Error:', data);
      return;
  }
  
  console.log('\n[4] Recommendations Output:');
  console.table(data.recommendations.map((r) => ({
      Id: r.id.split('-')[0] + '...',
      Match: r.matchPercentage + '%',
      Category: r.category,
      Reason: r.reason,
      TagScore: r.signals?.tagScore?.toFixed(2),
      Similarity: r.signals?.similarityScore?.toFixed(2),
  })));
  
  // 4. Verify caching worked
  console.log('\n[5] Verifying cache hit...');
  const start = Date.now();
  const cachedRes = await fetch('http://localhost:3000/api/ai/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mediaId: testMedia.id })
  });
  const cachedData = await cachedRes.json();
  const timeTaken = Date.now() - start;
  
  console.log(`Cache returned ${cachedData.recommendations?.length} items in ${timeTaken}ms!`);
  
  // 5. Test Track Analytics
  console.log('\n[6] Testing Tracking Analytics...');
  const trackRes = await fetch('http://localhost:3000/api/ai/recommend/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
          source_media_id: testMedia.id,
          recommended_media_id: data.recommendations[0]?.id || testMedia.id,
          event_type: 'view',
          score: 85,
          category: 'Similar Topic',
          reason: 'Test View'
      })
  });
  
  if (trackRes.ok) {
      console.log('Tracking API returned successfully!');
  } else {
      console.log('Tracking API failed:', await trackRes.text());
  }

  console.log('\n--- RECOMMENDATION ENGINE TEST COMPLETE ---');
}

testRecommendations().catch(console.error);
