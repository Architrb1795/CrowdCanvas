import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = 'CrowdCanvas <notifications@resend.dev>'; // Using default testing domain

export async function sendRoleRequestEmail(to: string, userName: string, eventName: string, role: string, dashboardUrl: string) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `[CrowdCanvas] New Access Request for ${eventName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; padding: 24px; border-radius: 12px; border: 1px solid #1e293b;">
          <h2 style="color: #ffffff;">New Access Request</h2>
          <p style="color: #cbd5e1; font-size: 16px;">
            <strong>${userName}</strong> has requested <strong>${role}</strong> access to your event <strong>${eventName}</strong>.
          </p>
          <div style="margin-top: 32px;">
            <a href="${dashboardUrl}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Review Request in Dashboard
            </a>
          </div>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('Error sending role request email:', error);
    return { success: false, error };
  }
}

export async function sendRoleDecisionEmail(to: string, eventName: string, role: string, decision: 'approved' | 'rejected', eventUrl: string) {
  try {
    const isApproved = decision === 'approved';
    const color = isApproved ? '#10b981' : '#ef4444';
    
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `[CrowdCanvas] Request ${decision.toUpperCase()} for ${eventName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; padding: 24px; border-radius: 12px; border: 1px solid #1e293b;">
          <h2 style="color: #ffffff;">Access Request Update</h2>
          <p style="color: #cbd5e1; font-size: 16px;">
            Your request for <strong>${role}</strong> access to the event <strong>${eventName}</strong> has been 
            <strong style="color: ${color};">${decision}</strong>.
          </p>
          ${isApproved ? `
            <div style="margin-top: 32px;">
              <a href="${eventUrl}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Go to Event
              </a>
            </div>
          ` : ''}
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('Error sending role decision email:', error);
    return { success: false, error };
  }
}

export async function sendEventInviteEmail(to: string, eventName: string, role: string, eventUrl: string) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `[CrowdCanvas] You've been invited to ${eventName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; padding: 24px; border-radius: 12px; border: 1px solid #1e293b;">
          <h2 style="color: #ffffff;">You're Invited!</h2>
          <p style="color: #cbd5e1; font-size: 16px;">
            You have been added as a <strong>${role}</strong> to the event <strong>${eventName}</strong> on CrowdCanvas.
          </p>
          <div style="margin-top: 32px;">
            <a href="${eventUrl}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              View Event
            </a>
          </div>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('Error sending invite email:', error);
    return { success: false, error };
  }
}

export async function sendSignInAlertEmail(to: string, userName: string, time: string, deviceOs: string, browser: string) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `[CrowdCanvas] Security Alert: New Login`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; padding: 24px; border-radius: 12px; border: 1px solid #1e293b;">
          <h2 style="color: #ffffff;">New Sign-In Detected</h2>
          <p style="color: #cbd5e1; font-size: 16px;">
            Hi ${userName},
          </p>
          <p style="color: #cbd5e1; font-size: 16px;">
            We noticed a new login to your CrowdCanvas account.
          </p>
          <div style="background-color: #1e293b; padding: 16px; border-radius: 8px; margin: 24px 0;">
            <p style="margin: 0; color: #94a3b8; font-size: 14px;"><strong>Time:</strong> ${time}</p>
            <p style="margin: 8px 0 0 0; color: #94a3b8; font-size: 14px;"><strong>Device/Browser:</strong> ${deviceOs} - ${browser}</p>
          </div>
          <p style="color: #64748b; font-size: 14px;">
            If this was you, you can safely ignore this email. If you don't recognize this activity, please secure your account immediately.
          </p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('Error sending sign-in alert email:', error);
    return { success: false, error };
  }
}

export async function sendWelcomeEmail(to: string, userName: string) {
  try {
    const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/events` : 'http://localhost:3000/events';
    
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Welcome to CrowdCanvas, ${userName}! 📸`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; padding: 32px; border-radius: 12px; border: 1px solid #1e293b;">
          <h1 style="color: #ffffff; margin-bottom: 24px;">Welcome to the Experience!</h1>
          <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6;">
            Hi <strong>${userName}</strong>,
          </p>
          <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6;">
            We are thrilled to have you on board. CrowdCanvas is your AI-powered hub for finding, organizing, and sharing the best event memories.
          </p>
          <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6;">
            Ready to get started? You can create your first event gallery or join an existing one.
          </p>
          <div style="margin-top: 32px; text-align: center;">
            <a href="${dashboardUrl}" style="background-color: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
              Go to Dashboard
            </a>
          </div>
          <p style="color: #64748b; font-size: 14px; margin-top: 48px; border-top: 1px solid #1e293b; padding-top: 24px;">
            If you have any questions, feel free to reply to this email. We're here to help!
          </p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error };
  }
}

