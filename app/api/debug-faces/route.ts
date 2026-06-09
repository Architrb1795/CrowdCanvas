import { NextResponse } from 'next/server';
import { createFaceProfile, scanHistoricalFaces } from '@/lib/actions/faces';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

  const dummyEmbedding = new Array(128).fill(0.1);
  const result = await createFaceProfile(dummyEmbedding, true);
  
  const scanResult = await scanHistoricalFaces(user.id);
  
  return NextResponse.json({ createResult: result, scanResult });
}
