import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import {
  SESSION_COOKIE_NAME,
  createSessionToken,
  getSessionCookieOptions,
  toSessionUser,
} from "@/lib/auth";
import { getLibrarianCredentials, ensureLibrarianUser } from "@/lib/librarian";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "Login identifier is required.")
    .optional(),
  email: z.string().trim().optional(),
  password: z.string().min(1, "Password is required."),
  role: z.enum([UserRole.MEMBER, UserRole.LIBRARIAN]).default(UserRole.MEMBER),
});

function normalizeLoginIdentifier(data: z.infer<typeof loginSchema>) {
  return String(data.identifier ?? data.email ?? "").trim().toLowerCase();
}

function invalidMemberLogin() {
  return NextResponse.json(
    { error: "Invalid email or password." },
    { status: 401 },
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid login data." },
        { status: 400 },
      );
    }

    let user;
    const identifier = normalizeLoginIdentifier(parsed.data);

    if (!identifier) {
      return NextResponse.json(
        { error: "Login identifier is required." },
        { status: 400 },
      );
    }

    if (parsed.data.role === UserRole.LIBRARIAN) {
      const librarian = getLibrarianCredentials();

      if (
        (identifier !== librarian.username && identifier !== librarian.email) ||
        parsed.data.password !== librarian.password
      ) {
        return NextResponse.json(
          { error: "Invalid librarian credentials." },
          { status: 401 },
        );
      }

      user = await ensureLibrarianUser();
    } else {
      const email = z.string().email().safeParse(identifier);

      if (!email.success) {
        return invalidMemberLogin();
      }

      user = await prisma.user.findUnique({
        where: { email: email.data },
      });

      if (!user || user.role !== UserRole.MEMBER) {
        return invalidMemberLogin();
      }

      const isValidPassword = await bcrypt.compare(
        parsed.data.password,
        user.password,
      );

      if (!isValidPassword) {
        return invalidMemberLogin();
      }
    }

    const sessionUser = toSessionUser(user);
    const token = await createSessionToken(sessionUser);
    const response = NextResponse.json({ user: sessionUser });
    response.cookies.set(
      SESSION_COOKIE_NAME,
      token,
      getSessionCookieOptions(),
    );

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Unable to log in right now." },
      { status: 500 },
    );
  }
}
