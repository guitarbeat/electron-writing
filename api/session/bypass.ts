import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSessionToken, setCookieHeader } from "../../src/lib/auth.js";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { attempts } = req.body || {};
  
  if (typeof attempts !== "number" || attempts < 3) {
    return res.status(403).json({ error: "Not yet" });
  }

  console.log(`AUTH_BYPASS: Smeemo is letting the user through after ${attempts} failed attempts.`);
  
  const token = createSessionToken({ authorized: true, bypass: true });
  res.setHeader("Set-Cookie", setCookieHeader(token));
  return res.status(200).json({ status: "ok", bypass: true });
}
