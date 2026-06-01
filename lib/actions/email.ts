import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 'MISSING');

export async function sendEventSummaryEmail(to: string, eventName: string, eventId: string) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[EMAIL MOCK] Would have sent summary email for ${eventName} to ${to}`);
    return { success: true, mocked: true };
  }

  try {
    const data = await resend.emails.send({
      from: 'CrowdCanvas <onboarding@resend.dev>',
      to: [to],
      subject: `AI Insights Ready for ${eventName}`,
      html: `
        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
          <h2>Your AI Insights are ready!</h2>
          <p>The intelligent processing engine has successfully summarized <strong>${eventName}</strong>.</p>
          <p>Log in to your CrowdCanvas dashboard to view the Highlights, Analytics, and Story Timeline.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/events/${eventId}" style="display: inline-block; padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 8px; margin-top: 20px;">
            View Event Insights
          </a>
        </div>
      `
    });
    
    return { success: true, data };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error };
  }
}
