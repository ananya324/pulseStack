import bcrypt from "bcryptjs";
import { prisma } from "../../db/prisma";
import { signToken } from "./auth.token";

export class AuthError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function registerUser(email: string, password: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AuthError(409, "Email already registered");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, passwordHash },
    select: { id: true, email: true, createdAt: true },
  });

  return { user, token: signToken(user.id) };
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  // Same message for "no such email" and "wrong password",
  // so attackers can't find out which emails exist.
  const ok = user ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!user || !ok) {
    throw new AuthError(401, "Invalid email or password");
  }

  return {
    user: { id: user.id, email: user.email, createdAt: user.createdAt },
    token: signToken(user.id),
  };
}