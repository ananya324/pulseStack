import { Router, Response } from "express";
import { registerSchema, loginSchema } from "./auth.schemas";
import { registerUser, loginUser, AuthError } from "./auth.service";
import { COOKIE_NAME } from "./auth.token";
import { env } from "../../config/env";

export const authRouter = Router();

function setAuthCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

authRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
  }

  try {
    const { user, token } = await registerUser(parsed.data.email, parsed.data.password);
    setAuthCookie(res, token);
    return res.status(201).json({ user });
  } catch (err) {
    if (err instanceof AuthError) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error(err);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
  }

  try {
    const { user, token } = await loginUser(parsed.data.email, parsed.data.password);
    setAuthCookie(res, token);
    return res.json({ user });
  } catch (err) {
    if (err instanceof AuthError) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error(err);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true });
});