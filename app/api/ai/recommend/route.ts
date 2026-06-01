// app/api/ai/recommend/route.ts

import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { getSimilarPhotos } from '@/lib/recommendation/engine';

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { mediaId } = await req.json();

    if (!mediaId) {
      return NextResponse.json({ error: 'mediaId is required' }, { status: 400 });
    }

    // Get current user if logged in
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    const recommendations = await getSimilarPhotos(supabaseAdmin, mediaId, user?.id);

    return NextResponse.json({ success: true, recommendations });

  } catch (error: unknown) {
    console.error('Recommendation Engine Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
