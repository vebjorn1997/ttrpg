import { NextRequest, NextResponse } from "next/server"
import { getSessionCookie } from "better-auth/cookies"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionCookie = getSessionCookie(request)

  const needsAuth =
    pathname === "/characters" ||
    pathname.startsWith("/characters/") ||
    pathname === "/npcs" ||
    pathname.startsWith("/npcs/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/")

  if (needsAuth && !sessionCookie) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Role checks happen in server layouts (cookie alone cannot prove admin).
  return NextResponse.next()
}

export const config = {
  matcher: ["/characters", "/characters/:path*", "/npcs", "/npcs/:path*", "/admin", "/admin/:path*"],
}
