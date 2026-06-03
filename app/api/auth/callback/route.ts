/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createNotification } from '@/lib/actions/notifications';
import { sendSignInAlertEmail, sendWelcomeEmail } from '@/lib/email';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/events';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Trigger OAuth Sign-in Notifications
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const userAgent = request.headers.get('user-agent') || 'Unknown';
        const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown IP';
        
        let deviceType = 'Desktop';
        if (/Mobile|Android|iP(hone|od|ad)/i.test(userAgent)) deviceType = 'Mobile';
        else if (/Tablet|iPad/i.test(userAgent)) deviceType = 'Tablet';

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

        // Log session in DB
        await (supabase as any).from('user_sessions').insert({
          user_id: user.id,
          device_type: deviceType,
          browser: browser,
          ip_address: ipAddress,
        });

        // Send notifications
        await createNotification({
          user_id: user.id,
          type: 'new_login',
          title: 'New Sign-In Detected',
          description: `A new device (${deviceType} - ${browser}) logged into your account via OAuth.`,
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
      }

      const forwardedHost = request.headers.get('x-forwarded-host'); // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development';
      
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
    
    console.error('OAuth callback error:', error.message);
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate`);
}
