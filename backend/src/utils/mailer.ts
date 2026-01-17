import { Resend } from 'resend';
import logger from './logger';

const resendApiKey = process.env.RESEND_API_KEY;
const from = process.env.RESEND_FROM;

export const isMailerConfigured = Boolean(resendApiKey && from);

const getResendClient = () => {
    if (!resendApiKey) {
        throw new Error('RESEND_API_KEY is not set');
    }

    return new Resend(resendApiKey);
};

export const sendEmail = async (options: { to: string; subject: string; html: string; text?: string }) => {
    if (!from) {
        throw new Error('RESEND_FROM is not set');
    }

    const resend = getResendClient();

    await resend.emails.send({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
    });
};

export const getInviteEmailTemplate = (params: {
    projectName: string;
    inviterName: string;
    inviterEmail?: string;
    invitationLink: string;
}) => {
    const inviterLabel = params.inviterEmail ? `${params.inviterName} (${params.inviterEmail})` : params.inviterName;

    const subject = `Invitation to join ${params.projectName} on CollabHub`;
    const text = `You've been invited to join "${params.projectName}" on CollabHub by ${inviterLabel}.\n\nOpen your invitation: ${params.invitationLink}`;
    const html = `
    <div style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 24px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0;">
        <tr>
          <td>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">
              <div style="width: 36px; height: 36px; border-radius: 10px; background: #10b981; display: inline-block;"></div>
              <span style="font-size: 18px; font-weight: 700; color: #0f172a;">CollabHub</span>
            </div>
            <h2 style="margin: 0 0 8px; font-size: 20px; color: #0f172a;">You're invited to join ${params.projectName}</h2>
            <p style="margin: 0 0 16px; color: #334155; line-height: 1.5;">
              <strong>${inviterLabel}</strong> invited you to collaborate on <strong>${params.projectName}</strong>.
            </p>
            <a href="${params.invitationLink}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 16px; border-radius: 8px; font-weight: 600;">
              View invitation
            </a>
            <p style="margin: 16px 0 0; color: #64748b; font-size: 13px;">
              If the button doesn’t work, copy and paste this URL:
            </p>
            <p style="margin: 4px 0 0; color: #2563eb; font-size: 13px; word-break: break-all;">
              ${params.invitationLink}
            </p>
          </td>
        </tr>
      </table>
      <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 16px;">
        You received this email because you were invited to CollabHub.
      </p>
    </div>
  `;

    return { subject, text, html };
};

export const getNotificationEmailTemplate = (params: { title: string; body: string; link?: string }) => {
  const subject = params.title;
  const text = params.link ? `${params.body}\n\nOpen: ${params.link}` : params.body;
  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 24px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0;">
        <tr>
          <td>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">
              <div style="width: 36px; height: 36px; border-radius: 10px; background: #10b981; display: inline-block;"></div>
              <span style="font-size: 18px; font-weight: 700; color: #0f172a;">CollabHub</span>
            </div>
            <h2 style="margin: 0 0 8px; font-size: 20px; color: #0f172a;">${params.title}</h2>
            <p style="margin: 0 0 16px; color: #334155; line-height: 1.5;">${params.body}</p>
            ${
              params.link
                ? `<a href="${params.link}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 16px; border-radius: 8px; font-weight: 600;">
                     Open notification
                   </a>
                   <p style="margin: 16px 0 0; color: #64748b; font-size: 13px;">
                     If the button doesn’t work, copy and paste this URL:
                   </p>
                   <p style="margin: 4px 0 0; color: #2563eb; font-size: 13px; word-break: break-all;">
                     ${params.link}
                   </p>`
                : ''
            }
          </td>
        </tr>
      </table>
      <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 16px;">
        You received this email because you have notifications on CollabHub.
      </p>
    </div>
  `;

  return { subject, text, html };
};

export const logMailerStatus = () => {
    if (!isMailerConfigured) {
        logger.warn('Resend is not configured. Invitation emails will be skipped.');
    }
};
