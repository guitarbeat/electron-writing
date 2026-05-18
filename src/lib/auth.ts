import jwt from "jsonwebtoken";
import type { VercelRequest } from "@vercel/node";

export const COOKIE_NAME = "clean_writer_session";
export const SESSION_SECRET = process.env.SESSION_SECRET || process.env.PASSCODE || "clean_writer_fallback_secret_12345";
export const APP_PASSCODE = (process.env.PASSCODE || "0000").toString().trim().replace(/^["']|["']$/g, '');

export function createSessionToken(payload: object = { authorized: true }): string {
  return jwt.sign(payload, SESSION_SECRET, { expiresIn: "30d" });
}

export function verifySessionToken(token: string): { authorized: boolean; bypass?: boolean } | null {
  try {
    return jwt.verify(token, SESSION_SECRET) as { authorized: boolean; bypass?: boolean };
  } catch {
    return null;
  }
}

export function getSessionCookie(req: VercelRequest): string | undefined {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return undefined;
  
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);
  
  return cookies[COOKIE_NAME];
}

export function isAuthenticated(req: VercelRequest): boolean {
  const token = getSessionCookie(req);
  if (!token) return false;
  const payload = verifySessionToken(token);
  return payload?.authorized === true;
}

export function setCookieHeader(token: string): string {
  const isProd = process.env.NODE_ENV === "production";
  const maxAge = 30 * 24 * 60 * 60; // 30 days in seconds
  return `${COOKIE_NAME}=${token}; HttpOnly; ${isProd ? "Secure; " : ""}SameSite=Lax; Max-Age=${maxAge}; Path=/`;
}

export function clearCookieHeader(): string {
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/`;
}
