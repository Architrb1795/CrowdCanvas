import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data: media } = await supabase.from('media').select('id').limit(2);
  
  const testInsert = {
    source_media_id: media[0].id,
    recommended_media_id: media[1].id,
    event_type: 'viewed',
    position: 1,
    score: 0.9,
    category: 'test',
    reason: 'test',
    session_id: 'randomstring123',
    user_id: null,
    view_duration_ms: 100
  };
  
  const { error } = await supabase.from('recommendation_analytics').insert(testInsert);
  console.log("Insert with string session_id error:", error);
}

check();
