import { env, hasEmailTransport, isDevelopment } from "@/lib/env";

export type MailMessage = {
  to: string;
  subject: string;
  text: string;
  /** Never logged outside development. */
  sensitiveUrl?: string;
};

/**
 * Console transport by default so the demo runs with no mail server, SMTP when
 * EMAIL_SERVER and EMAIL_FROM are both configured. Failures are swallowed: a
 * mail outage must not break sign-in or checkout.
 */
export async function sendMail(message: MailMessage): Promise<boolean> {
  if (!hasEmailTransport) {
    logToConsole(message);
    return false;
  }

  try {
    const { createTransport } = await import("nodemailer");
    const transport = createTransport(env.EMAIL_SERVER!);

    await transport.sendMail({
      from: env.EMAIL_FROM,
      to: message.to,
      subject: message.subject,
      text: message.sensitiveUrl
        ? `${message.text}\n\n${message.sensitiveUrl}`
        : message.text,
    });

    return true;
  } catch (error) {
    console.error(
      `[noom] Failed to send "${message.subject}" to ${message.to}`,
      error,
    );
    logToConsole(message);
    return false;
  }
}

function logToConsole(message: MailMessage) {
  if (isDevelopment) {
    console.log(
      `[noom] Email to ${message.to} — ${message.subject}\n${message.text}${
        message.sensitiveUrl ? `\n${message.sensitiveUrl}` : ""
      }`,
    );
    return;
  }

  // A token in a production log is a credential leak.
  console.log(
    `[noom] Email to ${message.to} — ${message.subject}${
      message.sensitiveUrl ? " (link redacted)" : ""
    }`,
  );
}
