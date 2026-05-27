import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export function getLibrarianCredentials() {
  const email = process.env.LIBRARIAN_EMAIL?.toLowerCase();
  const password = process.env.LIBRARIAN_PASSWORD;
  const name = process.env.LIBRARIAN_NAME ?? "Library Admin";

  if (!email || !password) {
    throw new Error("LIBRARIAN_EMAIL and LIBRARIAN_PASSWORD must be set.");
  }

  return { email, password, name };
}

export async function ensureLibrarianUser() {
  const { email, password, name } = getLibrarianCredentials();
  const passwordHash = await bcrypt.hash(password, 12);

  return prisma.user.upsert({
    where: { email },
    update: {
      name,
      phone: "-",
      password: passwordHash,
      role: UserRole.LIBRARIAN,
    },
    create: {
      name,
      email,
      phone: "-",
      password: passwordHash,
      role: UserRole.LIBRARIAN,
    },
  });
}
