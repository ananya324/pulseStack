import { Request, Response, NextFunction } from "express";
import { COOKIE_NAME, verifyToken } from "../modules/auth/auth.token";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function requireUser(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ error: "Not logged in" });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: "Invalid or expired login" });
  }

  req.userId = payload.sub;
  next();
}