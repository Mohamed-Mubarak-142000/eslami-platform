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

export async function sendMail(message: MailMessage): Promise<void> {
  const config = smtpConfig();
  const socket = connect({ host: config.host, port: config.port, servername: config.host });
  socket.setTimeout(TIMEOUT_MS, () => socket.destroy(new Error("SMTP timeout")));
  const expect = replyReader(socket);
  const send = (line: string, code: number) => {
    socket.write(`${line}\r\n`);
    return expect(code);
  };

  try {
    await expect(220);
    await send("EHLO al-manara", 250);
    await send(`AUTH PLAIN ${Buffer.from(`\0${config.user}\0${config.pass}`, "utf8").toString("base64")}`, 235);
    await send(`MAIL FROM:<${config.user}>`, 250);
    await send(`RCPT TO:<${message.to}>`, 250);
    await send("DATA", 354);
    await send(`${buildMessage(config.user, config.fromName, message)}\r\n.`, 250);
    socket.write("QUIT\r\n");
  } finally {
    socket.end();
  }
}
