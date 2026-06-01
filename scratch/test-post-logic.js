const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  const { data: mediaItems } = await supabaseAdmin.from('media').select('id, uploaded_by, title').limit(1);
  if (!mediaItems || mediaItems.length === 0) return console.log("No media");
  
  const data = mediaItems[0];
  console.log("Media data:", data);

  if (data && data.uploaded_by) {
    const ownerId = data.uploaded_by;
    // use a fake liker ID that is different from owner
    const likerId = '5779de87-db74-4845-a2d1-28344668f56e'; 
    const likerName = 'Test User';
    const mediaTitle = data.title || '';
    
    if (ownerId === likerId) {
       console.log("Same user, returning early");
       // we won't return early for testing
    }

    console.log("Attempting to insert notification...");
    const { data: insertData, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: ownerId,
        actor_id: likerId,
        category: 'social',
        action_type: 'like',
        title: 'Someone liked your photo',
        description: `${likerName} liked "${mediaTitle || 'your media'}"`,
        action_url: `/media?id=${data.id}`,
        icon: 'heart',
        metadata: {}
      })
      .select();

    if (error) {
      console.error('Failed to create notification:', error);
    } else {
      console.log('Successfully created notification:', insertData);
    }
  }
}

test();
