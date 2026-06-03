import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createNotification } from '@/lib/actions/notifications';
import { sendSignInAlertEmail, sendWelcomeEmail } from '@/lib/email';

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

  // Check if this is the first login
  const { count } = await (supabase as any).from('user_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);
  
  const isFirstLogin = count === 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // Trigger Notifications
  await createNotification({
    user_id: user.id,
    type: 'new_login',
    title: 'New Sign-In Detected',
    description: `A new device (${deviceType} - ${browser}) logged into your account.`,
    icon: 'log-in'
  });

  if (user.email) {
    const time = new Date().toLocaleString();
    const userName = user.user_metadata?.full_name || 'User';
    
    if (isFirstLogin) {
      await sendWelcomeEmail(user.email, userName);
    } else {
      await sendSignInAlertEmail(user.email, userName, time, deviceType, browser);
    }
  }

  return NextResponse.json({ success: true });
}
