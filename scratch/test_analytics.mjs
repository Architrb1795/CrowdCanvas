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

async function generateDummyAnalytics() {
  console.log('--- GENERATING DUMMY ANALYTICS ---');
  
  await supabaseAdmin.from('recommendation_analytics').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('Cleared existing analytics.');

  const { data: media } = await supabaseAdmin.from('media').select('id').limit(2);
  if (!media || media.length < 2) {
      console.log('Not enough media to test.');
      return;
  }
  const sourceId = media[0].id;
  const recommendedId = media[1].id;

  const events = [];
  const categories = ['Similar Subject', 'Same Event', 'Shared Tags'];
  
  for (let i = 0; i < 50; i++) {
      events.push({
          source_media_id: sourceId,
          recommended_media_id: recommendedId,
          event_type: 'generated',
          category: categories[i % categories.length],
          reason: 'Test reason',
          position: i,
          score: Math.floor(Math.random() * 50) + 10
      });
  }

  for (let i = 0; i < 30; i++) {
      events.push({
          source_media_id: sourceId,
          recommended_media_id: recommendedId,
          event_type: 'viewed',
          category: categories[i % categories.length],
          reason: 'Test reason',
          position: i,
          score: Math.floor(Math.random() * 50) + 10,
          view_duration_ms: Math.floor(Math.random() * 5000) + 500
      });
  }

  for (let i = 0; i < 12; i++) {
      events.push({
          source_media_id: sourceId,
          recommended_media_id: recommendedId,
          event_type: 'clicked',
          category: categories[i % categories.length],
          reason: 'Test reason',
          position: i,
          score: Math.floor(Math.random() * 50) + 10,
          view_duration_ms: Math.floor(Math.random() * 3000) + 1000
      });
  }

  for (let i = 0; i < 18; i++) {
      events.push({
          source_media_id: sourceId,
          recommended_media_id: recommendedId,
          event_type: 'ignored',
          category: categories[i % categories.length],
          reason: 'Test reason',
          position: i,
          score: Math.floor(Math.random() * 50) + 10,
          view_duration_ms: Math.floor(Math.random() * 1000) + 200
      });
  }

  const { error } = await supabaseAdmin.from('recommendation_analytics').insert(events);
  
  if (error) {
      console.error('Error inserting dummy data:', error);
      return;
  }
  console.log(`Successfully inserted ${events.length} dummy analytics events.`);

  console.log('\n--- VERIFYING DASHBOARD API ---');
  const res = await fetch('http://localhost:3000/api/admin/analytics');
  const data = await res.json();
  
  if (!res.ok) {
      console.error('API Error:', data);
  } else {
      console.log('Dashboard API Response:');
      console.log(JSON.stringify(data, null, 2));
  }
}

generateDummyAnalytics().catch(console.error);
