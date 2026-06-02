import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userAgent = request.headers.get('user-agent') || 'Unknown';
  const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown IP';
  
  // Basic user agent parsing for UI display
  let deviceType = 'Desktop';
  if (/Mobile|Android|iP(hone|od|ad)/i.test(userAgent)) {
    deviceType = 'Mobile';
  } else if (/Tablet|iPad/i.test(userAgent)) {
    deviceType = 'Tablet';
  }

  let browser = 'Unknown Browser';
  if (/Chrome/i.test(userAgent)) browser = 'Chrome';
  else if (/Safari/i.test(userAgent)) browser = 'Safari';
  else if (/Firefox/i.test(userAgent)) browser = 'Firefox';
  else if (/Edge/i.test(userAgent)) browser = 'Edge';

  // Cast to any since database.types.ts hasn't been updated with user_sessions yet
  const { error } = await (supabase as any).from('user_sessions').insert({
    user_id: user.id,
    device_type: deviceType,
    browser: browser,
    ip_address: ipAddress,
  });

  if (error) {
    console.error('Session log error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
