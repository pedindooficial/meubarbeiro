import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const path = req.nextUrl.pathname;

  const isAuth = !!token;
  const isAdminRoute = path.startsWith("/admin");
  const isAuthRoute = path === "/login" || path === "/registro";
  const isPublic = path === "/" || path.startsWith("/api/auth") || path.startsWith("/api/webhooks") || path.startsWith("/portfolio") || path.startsWith("/api/portfolio");

  if (isPublic && !path.startsWith("/api")) return NextResponse.next();
  if (path.startsWith("/api")) return NextResponse.next();

  if (isAuthRoute && isAuth) {
    const role = (token as { role?: string }).role;
    if (role === "admin") return NextResponse.redirect(new URL("/admin", req.url));
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (!isAuth && !isAuthRoute && !isPublic) {
    const login = new URL("/login", req.url);
    login.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(login);
  }

  if (isAdminRoute && isAuth) {
    const role = (token as { role?: string }).role;
    if (role !== "admin") return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
