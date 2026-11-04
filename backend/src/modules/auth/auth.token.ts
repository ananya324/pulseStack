import jwt from "jsonwebtoken";
import { env } from "../../config/env";

export const COOKIE_NAME = "tp_token";

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): { sub: string } | null {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    if (typeof payload === "object" && typeof payload.sub === "string") {
      return { sub: payload.sub };
    }
    return null;
  } catch {
    return null;
  }
}