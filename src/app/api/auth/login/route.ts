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
  email: z.string().trim().email("A valid email is required.").toLowerCase(),
  password: z.string().min(1, "Password is required."),
  role: z.enum([UserRole.MEMBER, UserRole.LIBRARIAN]).default(UserRole.MEMBER),
});

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

    if (parsed.data.role === UserRole.LIBRARIAN) {
      const librarian = getLibrarianCredentials();

      if (
        parsed.data.email !== librarian.email ||
        parsed.data.password !== librarian.password
      ) {
        return NextResponse.json(
          { error: "Invalid librarian credentials." },
          { status: 401 },
        );
      }

      user = await ensureLibrarianUser();
    } else {
      user = await prisma.user.findUnique({
        where: { email: parsed.data.email },
      });

      if (!user || user.role !== UserRole.MEMBER) {
        return NextResponse.json(
          { error: "Invalid member credentials." },
          { status: 401 },
        );
      }

      const isValidPassword = await bcrypt.compare(
        parsed.data.password,
        user.password,
      );

      if (!isValidPassword) {
        return NextResponse.json(
          { error: "Invalid member credentials." },
          { status: 401 },
        );
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
