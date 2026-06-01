const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  console.log("Checking if we can insert a notification...");
  
  // get a random user
  const { data: users } = await supabaseAdmin.from('profiles').select('id').limit(1);
  if (!users || users.length === 0) {
    console.log("No users found");
    return;
  }
  const userId = users[0].id;
  
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .insert({
      user_id: userId,
      category: 'social',
      action_type: 'like',
      title: 'Test Notification',
      description: 'This is a test notification.'
    })
    .select();

  if (error) {
    console.error("Error inserting notification:", error);
  } else {
    console.log("Successfully inserted notification:", data);
  }
}

test();
