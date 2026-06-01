const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  console.log("Checking the media query...");
  const mediaId = '1780338981620'; // Wait, I don't know a valid mediaId. Let's just get any valid mediaId
  const { data: mediaItems } = await supabaseAdmin.from('media').select('id').limit(1);
  if (!mediaItems || mediaItems.length === 0) return console.log("No media");
  
  const mId = mediaItems[0].id;
  const { data, error } = await supabaseAdmin
    .from('media')
    .select('uploaded_by, title')
    .eq('id', mId)
    .single();

  console.log("Error:", error);
  console.log("Data:", data);
}

test();
