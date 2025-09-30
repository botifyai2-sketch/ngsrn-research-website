import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAuth = !!token
    const isAuthPage = req.nextUrl.pathname.startsWith("/auth")
    const isCMSPage = req.nextUrl.pathname.startsWith("/cms")

    // If user is on auth page and already authenticated, redirect to CMS or home
    if (isAuthPage && isAuth) {
      if (token.role === "ADMIN" || token.role === "EDITOR") {
        return NextResponse.redirect(new URL("/cms", req.url))
      }
      return NextResponse.redirect(new URL("/", req.url))
    }

    // If user is trying to access CMS without proper role, redirect to sign in
    if (isCMSPage && (!isAuth || (token.role !== "ADMIN" && token.role !== "EDITOR"))) {
      return NextResponse.redirect(new URL("/auth/signin", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const isAuthPage = req.nextUrl.pathname.startsWith("/auth")
        const isCMSPage = req.nextUrl.pathname.startsWith("/cms")

        // Allow access to auth pages
        if (isAuthPage) {
          return true
        }

        // For CMS pages, require authentication and proper role
        if (isCMSPage) {
          return !!token && (token.role === "ADMIN" || token.role === "EDITOR")
        }

        // Allow access to all other pages
        return true
      },
    },
  }
)

export const config = {
  matcher: ["/cms/:path*", "/auth/:path*"]
}