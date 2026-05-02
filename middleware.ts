import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { applyRateLimit } from "@/lib/ratelimit"

export async function middleware(request: NextRequest) {
  // APIルートにレート制限を適用
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const rateLimitResponse = await applyRateLimit(request)
    if (rateLimitResponse) return rateLimitResponse
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // 認証不要パス
  const publicPaths = ["/auth/login", "/auth/callback"]
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return supabaseResponse
  }

  // 未認証
  if (!user) {
    // APIルートは 401 JSON を返す
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { type: "https://sora.app/errors/unauthorized", title: "Unauthorized", status: 401 },
        { status: 401 }
      )
    }
    // それ以外はログインへリダイレクト
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
