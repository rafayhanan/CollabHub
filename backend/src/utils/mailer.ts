import nodemailer from 'nodemailer';
import logger from './logger';

const host = process.env.SMTP_HOST;
const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.SMTP_FROM || process.env.SMTP_USER;

export const isMailerConfigured = Boolean(host && port && user && pass);

const createTransporter = () => {
    if (!host || !port || !user || !pass) {
        throw new Error('SMTP configuration is missing');
    }

    const secure = port === 465;

    return nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
            user,
            pass,
        },
    });
};

export const sendEmail = async (options: { to: string; subject: string; html: string; text?: string }) => {
    if (!from) {
        throw new Error('SMTP_FROM is not set');
    }

    const transporter = createTransporter();

    await transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
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

export const logMailerStatus = () => {
    if (!isMailerConfigured) {
        logger.warn('SMTP is not configured. Invitation emails will be skipped.');
    }
};
