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
  // Check Authorization header first (Bearer <token>)
  const authHeader = req.headers?.authorization;
  if (authHeader && typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    const bearerToken = authHeader.substring(7).trim();
    if (bearerToken) return bearerToken;
  }

  const cookieHeader = req.headers?.cookie;
  if (!cookieHeader) return undefined;
  
  const cookieString = Array.isArray(cookieHeader) ? cookieHeader.join('; ') : cookieHeader;
  if (typeof cookieString !== 'string') return undefined;

  const cookies = cookieString.split(';').reduce((acc, cookie) => {
    if (!cookie) return acc;
    const [key, value] = cookie.trim().split('=');
    if (key && value) {
      acc[key] = value;
    }
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
  const maxAge = 30 * 24 * 60 * 60; // 30 days in seconds
  return `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=None; Partitioned; Max-Age=${maxAge}; Path=/`;
}

export function clearCookieHeader(): string {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=None; Partitioned; Max-Age=0; Path=/`;
}
