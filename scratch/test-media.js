const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  console.log("Checking media columns...");
  
  const { data, error } = await supabaseAdmin
    .from('media')
    .select('*')
    .limit(1);

  if (error) {
    console.error("Error querying media table:", error);
  } else {
    console.log("Media columns:", Object.keys(data[0] || {}));
  }
}

test();
