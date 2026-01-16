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

    const subject = `You're invited to join ${params.projectName}`;
    const text = `You've been invited to join "${params.projectName}" by ${inviterLabel}. Open your invitations here: ${params.invitationLink}`;
    const html = `
    <div style="font-family: Arial, sans-serif; color: #111;">
      <h2>You're invited to join ${params.projectName}</h2>
      <p><strong>${inviterLabel}</strong> invited you to collaborate on <strong>${params.projectName}</strong>.</p>
      <p>
        <a href="${params.invitationLink}" style="color: #2563eb; text-decoration: none;">
          View invitation
        </a>
      </p>
      <p>If the link doesn’t work, copy and paste this URL:</p>
      <p>${params.invitationLink}</p>
    </div>
  `;

    return { subject, text, html };
};

export const getNotificationEmailTemplate = (params: { title: string; body: string; link?: string }) => {
  const subject = params.title;
  const text = params.link ? `${params.body}\n\nOpen: ${params.link}` : params.body;
  const html = `
    <div style="font-family: Arial, sans-serif; color: #111;">
      <h2>${params.title}</h2>
      <p>${params.body}</p>
      ${
        params.link
          ? `<p><a href="${params.link}" style="color: #2563eb; text-decoration: none;">Open notification</a></p>
             <p>If the link doesn’t work, copy and paste this URL:</p>
             <p>${params.link}</p>`
          : ''
      }
    </div>
  `;

  return { subject, text, html };
};

export const logMailerStatus = () => {
    if (!isMailerConfigured) {
        logger.warn('Resend is not configured. Invitation emails will be skipped.');
    }
};
