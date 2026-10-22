import { z } from "zod";

/** Helper accounts: sign in with an email or a mobile number and a 6-digit code. No passwords to forget. */

export type Contact = { kind: "email"; value: string } | { kind: "telemovel"; value: string };

/** Portuguese mobile numbers keep their 9 digits; the +351 / 00351 prefix is dropped. */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits.length === 12 && digits.startsWith("351") ? digits.slice(3) : digits.length === 14 && digits.startsWith("00351") ? digits.slice(5) : digits;
}

/** Reads what the person typed in the single "email ou telemóvel" box. */
export function parseContact(raw: string): Contact | undefined {
  const text = raw.trim();
  if (text.includes("@")) {
    const email = text.toLowerCase();
    return z.string().email().safeParse(email).success ? { kind: "email", value: email } : undefined;
  }
  const phone = normalizePhone(text);
  return /^\d{9,15}$/.test(phone) ? { kind: "telemovel", value: phone } : undefined;
}

export const contactKey = (c: Contact) => `${c.kind}:${c.value}`;

const contactField = z
  .string({ required_error: "Escreva o seu email ou telemóvel" })
  .refine((v) => parseContact(v) !== undefined, "Escreva um email ou um telemóvel com 9 números");

export const accountSchema = z.object({
  id: z.string(),
  name: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  /** Shown on the public thanks wall instead of the real name, and only with showOnWall. */
  nickname: z.string().max(30).optional(),
  showOnWall: z.boolean().default(false),
  createdAt: z.string().datetime(),
  consentAt: z.string().datetime(),
});
export type Account = z.infer<typeof accountSchema>;

/** Step 1: one box. New people also give a name and accept the terms. */
export const signInStartSchema = z.object({
  contact: contactField,
  name: z.string().trim().min(2, "Escreva o seu nome").optional(),
  consent: z.literal(true, { errorMap: () => ({ message: "Precisa de aceitar para criar a conta" }) }).optional(),
});
export type SignInStart = z.infer<typeof signInStartSchema>;

/** Step 2: the code we sent. Spaces are ignored, since people often type "123 456". */
export const signInVerifySchema = z.object({
  contact: contactField,
  code: z.preprocess((v) => (typeof v === "string" ? v.replace(/\s/g, "") : v), z.string({ required_error: "Escreva o código" }).regex(/^\d{6}$/, "O código tem 6 números")),
});
export type SignInVerify = z.infer<typeof signInVerifySchema>;

export const accountUpdateSchema = z.object({
  name: z.string().trim().min(2, "Escreva o seu nome").optional(),
  nickname: z.string().trim().max(30, "Use no máximo 30 letras").optional(),
  showOnWall: z.boolean().optional(),
});
export type AccountUpdate = z.infer<typeof accountUpdateSchema>;

export const LOGIN_CODE_MINUTES = 15;
export const LOGIN_CODE_MAX_ATTEMPTS = 5;
export const LOGIN_CODES_PER_HOUR = 5;

/** A code waiting to be typed. Only its hash is stored. */
export type LoginCode = {
  contact: string;
  codeHash: string;
  expiresAt: string;
  attempts: number;
  /** When the codes in the current hour started, and how many were sent, to stop floods. */
  windowStart: string;
  sentInWindow: number;
  /** For new people: the account is only created once the code is right. */
  pending?: { name: string; consentAt: string };
};

export type SignInError = "muitos-codigos" | "codigo-errado" | "codigo-expirado" | "muitas-tentativas";
export const signInErrorMessage: Record<SignInError, string> = {
  "muitos-codigos": "Já pedimos vários códigos na última hora. Espere um pouco e tente outra vez.",
  "codigo-errado": "Esse código não está certo. Veja a mensagem outra vez e tente de novo.",
  "codigo-expirado": "Esse código já não é válido. Peça um código novo.",
  "muitas-tentativas": "Tentou muitas vezes. Peça um código novo.",
};

/** Decides whether another code may be sent now, and returns the updated counters. */
export function nextCodeWindow(previous: LoginCode | undefined, now: Date): { ok: true; windowStart: string; sentInWindow: number } | { ok: false } {
  const hourAgo = now.getTime() - 3_600_000;
  if (!previous || new Date(previous.windowStart).getTime() <= hourAgo) return { ok: true, windowStart: now.toISOString(), sentInWindow: 1 };
  if (previous.sentInWindow >= LOGIN_CODES_PER_HOUR) return { ok: false };
  return { ok: true, windowStart: previous.windowStart, sentInWindow: previous.sentInWindow + 1 };
}

/** Checks a typed code against the stored one. `matches` compares hashes in constant time. */
export function checkLoginCode(stored: LoginCode | undefined, matches: (codeHash: string) => boolean, now: Date): { ok: true } | { ok: false; error: SignInError; attempts?: number } {
  if (!stored) return { ok: false, error: "codigo-expirado" };
  if (new Date(stored.expiresAt) <= now) return { ok: false, error: "codigo-expirado" };
  if (stored.attempts >= LOGIN_CODE_MAX_ATTEMPTS) return { ok: false, error: "muitas-tentativas" };
  if (!matches(stored.codeHash)) return { ok: false, error: "codigo-errado", attempts: stored.attempts + 1 };
  return { ok: true };
}

/** How the person is greeted and named on the wall. */
export const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;
export const wallName = (a: Pick<Account, "name" | "nickname">) => a.nickname?.trim() || firstName(a.name);
