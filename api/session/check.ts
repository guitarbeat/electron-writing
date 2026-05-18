import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSessionCookie, verifySessionToken } from "../../src/lib/auth.js";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = getSessionCookie(req);
  if (!token) {
    return res.status(200).json({ authorized: false });
  }

  const payload = verifySessionToken(token);
  return res.status(200).json({ authorized: payload?.authorized === true });
}
