import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Get the current path
  const path = req.nextUrl.pathname

  // Public routes that don't require authentication
  const publicRoutes = ["/auth/login", "/auth/register", "/auth/verify-email", "/auth/callback", "/auth/blocked"]

  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some((route) => path.startsWith(route))

  // If not authenticated and not on a public route, redirect to login
  if (!session && !isPublicRoute) {
    const redirectUrl = new URL("/auth/login", req.url)
    redirectUrl.searchParams.set("redirectTo", path)
    return NextResponse.redirect(redirectUrl)
  }

  // If authenticated and on an auth page, redirect to home
  if (session && path.startsWith("/auth") && !path.startsWith("/auth/callback")) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  return res
}

// Specify which routes this middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)",
  ],
}
