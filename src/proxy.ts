import { NextResponse, type NextRequest } from "next/server";

function normalizeHost(host: string | null) {
  return (host ?? "").split(":")[0]?.toLowerCase() ?? "";
}

function getPortalFromHost(host: string) {
  if (!host || host === "localhost" || host === "127.0.0.1") {
    return null;
  }

  if (process.env.MEMBER_HOST && host === process.env.MEMBER_HOST) {
    return "member";
  }

  if (process.env.ADMIN_HOST && host === process.env.ADMIN_HOST) {
    return "admin";
  }

  if (host.startsWith("member.")) {
    return "member";
  }

  if (host.startsWith("admin.")) {
    return "admin";
  }

  return null;
}

function portalPath(portal: "member" | "admin", pathname: string) {
  if (pathname === "/") {
    return `/${portal}`;
  }

  if (pathname === `/${portal}` || pathname.startsWith(`/${portal}/`)) {
    return pathname;
  }

  return `/${portal}${pathname}`;
}

export function proxy(request: NextRequest) {
  const host = normalizeHost(request.headers.get("host"));
  const portal = getPortalFromHost(host);

  if (!portal) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = portalPath(portal, request.nextUrl.pathname);

  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
