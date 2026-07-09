import nodemailer from "nodemailer";
import { env } from "../../config/env";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

function hasSmtpConfig(): boolean {
  return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS && env.EMAIL_FROM);
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  if (!hasSmtpConfig()) {
    return;
  }

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: env.EMAIL_FROM,
    to: input.to,
    subject: input.subject,
    html: input.html
  });
}
