import nodemailer, { Transporter } from "nodemailer";

import { SentimentSignal } from "../sentiment/types";

let cachedTransporter: Transporter | null = null;

function resolveTransporter(): Transporter | null {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const host = process.env.EMAIL_HOST || "mail.privateemail.com";
  const port = Number(process.env.EMAIL_PORT ?? 587);
  const secure = port === 465;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;

  if (user && pass) {
    cachedTransporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass
      }
    });
    return cachedTransporter;
  }

  if (process.env.NODE_ENV !== "production") {
    console.warn("[email] EMAIL_USER/EMAIL_PASSWORD not configured; skipping alerts.");
  }
  return null;
}

const DEFAULT_RECIPIENTS = ["support@trading.com"];

function parseRecipientValue(raw: string): string[] {
  const trimmed = raw.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((entry) => String(entry).trim()).filter(Boolean);
      }
    } catch {
      // fall back to delimiter parsing
    }
  }
  return trimmed
    .split(/[,\s]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function resolveRecipients(): string[] {
  const raw = process.env.PSYCHOLOGY_ALERT_RECIPIENTS;
  if (!raw) {
    return DEFAULT_RECIPIENTS;
  }
  const parsed = parseRecipientValue(raw);
  return parsed.length > 0 ? parsed : DEFAULT_RECIPIENTS;
}

export async function sendPsychologyAlert(signal: SentimentSignal) {
  const transporter = resolveTransporter();
  if (!transporter) {
    return;
  }
  const recipients = resolveRecipients();
  if (recipients.length === 0) {
    console.warn("[email] No PSYCHOLOGY_ALERT_RECIPIENTS configured; skipping alert.");
    return;
  }

  const subject = `[Psychology Alert] ${signal.headline}`;
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER || DEFAULT_RECIPIENTS[0];
  const lines = [
    signal.summary ?? "No summary provided.",
    "",
    `Sentiment: ${signal.sentiment} (score ${signal.score}, confidence ${signal.confidence})`,
    signal.url ? `Link: ${signal.url}` : undefined
  ].filter(Boolean);

  await transporter.sendMail({
    from,
    to: recipients,
    subject,
    text: lines.join("\n")
  });
}
