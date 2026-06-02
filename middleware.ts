import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/register') || request.nextUrl.pathname.startsWith('/forgot-password') || request.nextUrl.pathname.startsWith('/update-password')
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/events') || 
                           request.nextUrl.pathname.startsWith('/upload') || 
                           request.nextUrl.pathname.startsWith('/media') ||
                           request.nextUrl.pathname.startsWith('/profile')
  const isOnboardingRoute = request.nextUrl.pathname.startsWith('/onboarding')

  if (!user && !isAuthRoute && (isDashboardRoute || isOnboardingRoute)) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isAuthRoute) {
    // If user is already logged in and tries to access login/register, redirect to dashboard or home
    const url = request.nextUrl.clone()
    url.pathname = '/events'
    return NextResponse.redirect(url)
  }

  if (user && !isOnboardingRoute && !user.user_metadata?.onboarding_complete) {
    // If user is logged in but hasn't completed onboarding, redirect to onboarding
    const url = request.nextUrl.clone()
    url.pathname = '/onboarding'
    return NextResponse.redirect(url)
  }

  if (user && isOnboardingRoute && user.user_metadata?.onboarding_complete) {
    // If user has completed onboarding but tries to access onboarding, redirect to dashboard
    const url = request.nextUrl.clone()
    url.pathname = '/events'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
