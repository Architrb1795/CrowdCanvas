import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  console.log("Checking recommendation_analytics...");
  const { data: analytics, error: e1 } = await supabase
    .from('recommendation_analytics')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
    
  console.log("Recent analytics:", analytics);
  console.log("Analytics Error:", e1);
  
  console.log("\nChecking user_preference_profiles...");
  const { data: profiles, error: e2 } = await supabase
    .from('user_preference_profiles')
    .select('user_id, engagement_score, favorite_tags')
    .limit(5);
    
  console.log("Profiles:", profiles);
  console.log("Profiles Error:", e2);
}

check();
