import "server-only";
import { randomUUID } from "node:crypto";
import { connect, type TLSSocket } from "node:tls";

/**
 * Minimal SMTP client over implicit TLS (port 465) using only Node built-ins. Enough for
 * transactional mail through Gmail: EHLO → AUTH PLAIN → MAIL/RCPT/DATA. The body is sent base64
 * encoded and MIME boundaries start with "--", so no line can start with "." and dot-stuffing is
 * never needed.
 */

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  /** Plain-text alternative; sent as multipart/alternative when present (better deliverability). */
  text?: string;
  /** Extra ASCII headers, e.g. List-Unsubscribe. */
  headers?: Record<string, string>;
}

const TIMEOUT_MS = 15_000;

function smtpConfig() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS?.replace(/\s+/g, ""); // Gmail shows app passwords in groups of 4.
  if (!user || !pass) throw new Error("SMTP_USER / SMTP_PASS are not configured");
  return {
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT ?? 465),
    user,
    pass,
    fromName: process.env.MAIL_FROM_NAME ?? "Mohamed Mubarak",
  };
}

export const isMailConfigured = () => Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

const b64 = (value: string) => Buffer.from(value, "utf8").toString("base64");
const encodedWord = (value: string) => `=?UTF-8?B?${b64(value)}?=`;

const b64Lines = (value: string) => b64(value).replace(/.{1,76}/g, "$&\r\n");

function mimeBody(message: MailMessage): string[] {
  const part = (type: string, content: string) => [
    `Content-Type: ${type}; charset=UTF-8`,
    "Content-Transfer-Encoding: base64",
    "",
    b64Lines(content),
  ];
  if (!message.text) return part("text/html", message.html);
  const boundary = `=_${randomUUID()}`;
  return [
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    ...part("text/plain", message.text),
    `--${boundary}`,
    ...part("text/html", message.html),
    `--${boundary}--`,
  ];
}

function buildMessage(from: string, fromName: string, message: MailMessage): string {
  const domain = from.split("@")[1] ?? "localhost";
  return [
    `From: ${encodedWord(fromName)} <${from}>`,
    `To: <${message.to}>`,
    `Subject: ${encodedWord(message.subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${randomUUID()}@${domain}>`,
    // RFC 3834: marks the mail as machine-sent, as legitimate transactional mail does.
    "Auto-Submitted: auto-generated",
    ...Object.entries(message.headers ?? {}).map(([name, value]) => `${name}: ${value.replace(/[\r\n]+/g, " ")}`),
    "MIME-Version: 1.0",
    ...mimeBody(message),
  ].join("\r\n");
}

/** Reads SMTP replies; a reply ends on a line whose 4th char is a space ("250 OK", not "250-..."). */
function replyReader(socket: TLSSocket) {
  let buffer = "";
  let waiting: ((reply: { code: number; text: string }) => void) | null = null;
  let failed: ((error: Error) => void) | null = null;

  const flush = () => {
    const lines = buffer.split("\r\n");
    for (let index = 0; index < lines.length - 1; index++) {
      const line = lines[index]!;
      if (/^\d{3} /.test(line) || /^\d{3}$/.test(line)) {
        const text = lines.slice(0, index + 1).join("\n");
        buffer = lines.slice(index + 1).join("\r\n");
        const resolve = waiting;
        waiting = failed = null;
        resolve?.({ code: Number(line.slice(0, 3)), text });
        return;
      }
    }
  };

  socket.on("data", (chunk: Buffer) => {
    buffer += chunk.toString("utf8");
    if (waiting) flush();
  });
  socket.on("error", (error) => failed?.(error));
  socket.on("close", () => failed?.(new Error("SMTP connection closed")));

  return (expected: number) =>
    new Promise<string>((resolve, reject) => {
      waiting = (reply) => (reply.code === expected ? resolve(reply.text) : reject(new Error(`SMTP ${reply.code}: ${reply.text}`)));
      failed = reject;
      flush();
    });
}

/** One authenticated SMTP connection that can deliver several messages in a row. */
async function openSession() {
  const config = smtpConfig();
  const socket = connect({ host: config.host, port: config.port, servername: config.host });
  socket.setTimeout(TIMEOUT_MS, () => socket.destroy(new Error("SMTP timeout")));
  const expect = replyReader(socket);
  const send = (line: string, code: number) => {
    socket.write(`${line}\r\n`);
    return expect(code);
  };
  let ended = false;

  try {
    await expect(220);
    await send("EHLO al-manara", 250);
    await send(`AUTH PLAIN ${Buffer.from(`\0${config.user}\0${config.pass}`, "utf8").toString("base64")}`, 235);
  } catch (error) {
    socket.end();
    throw error;
  }

  return {
    async deliver(message: MailMessage) {
      await send(`MAIL FROM:<${config.user}>`, 250);
      await send(`RCPT TO:<${message.to}>`, 250);
      await send("DATA", 354);
      await send(`${buildMessage(config.user, config.fromName, message)}\r\n.`, 250);
    },
    /** Clears a half-finished transaction after a rejected recipient, keeping the connection. */
    reset: () => send("RSET", 250),
    get closed() {
      return ended || socket.destroyed;
    },
    close() {
      if (ended) return;
      ended = true;
      if (!socket.destroyed) socket.write("QUIT\r\n");
      socket.end();
    },
  };
}

export async function sendMail(message: MailMessage): Promise<void> {
  const session = await openSession();
  try {
    await session.deliver(message);
  } finally {
    session.close();
  }
}

/** Gmail's "daily sending limit exceeded" (and similar quota) replies: nothing more will go out today. */
export const isQuotaError = (error: unknown) => error instanceof Error && /\b5\.4\.5\b|\b4\.7\.28\b|sending limit/i.test(error.message);

export interface BulkResult {
  sent: number;
  failed: string[];
  /** Set when the provider refused further mail (quota); the remaining messages were not attempted. */
  stoppedByQuota: boolean;
  /** Set when `deadline` passed; the remaining messages were not attempted (and are not in `failed`). */
  stoppedByDeadline: boolean;
}

export interface BulkOptions {
  onProgress?: (done: number) => void;
  /** Called after each accepted message, with its index in `messages`. */
  onSent?: (index: number) => void | Promise<void>;
  /** Epoch ms; no new message is started after it, so a serverless function can return in time. */
  deadline?: number;
}

/**
 * Sends messages one by one over a single connection (one login instead of one per message).
 * A rejected recipient is skipped; a dropped connection is reopened; a quota reply stops the run.
 */
export async function sendBulkMail(messages: MailMessage[], options: BulkOptions = {}): Promise<BulkResult> {
  const { onProgress, onSent, deadline } = options;
  const result: BulkResult = { sent: 0, failed: [], stoppedByQuota: false, stoppedByDeadline: false };
  let session: Awaited<ReturnType<typeof openSession>> | null = null;
  try {
    for (const [index, message] of messages.entries()) {
      if (deadline !== undefined && Date.now() >= deadline) {
        result.stoppedByDeadline = true;
        break;
      }
      try {
        if (!session || session.closed) session = await openSession();
        await session.deliver(message);
        result.sent++;
        await onSent?.(index);
      } catch (error) {
        result.failed.push(message.to);
        if (isQuotaError(error)) {
          result.stoppedByQuota = true;
          result.failed.push(...messages.slice(index + 1).map((rest) => rest.to));
          break;
        }
        await session?.reset().catch(() => session?.close());
      }
      onProgress?.(index + 1);
    }
  } finally {
    session?.close();
  }
  return result;
}
