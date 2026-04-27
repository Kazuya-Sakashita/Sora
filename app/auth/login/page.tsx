"use client"

import { useState } from "react"
import { createSupabaseBrowserClient } from "@/lib/supabase-browser"
import { SkyBackground } from "@/components/sky-background"

export default function LoginPage() {
  const [loading, setLoading] = useState<"google" | "apple" | null>(null)

  const signIn = async (provider: "google" | "apple") => {
    setLoading(provider)
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    })
  }

  return (
    <>
      <SkyBackground />
      <div className="relative min-h-screen max-w-md mx-auto flex flex-col items-center justify-center px-8 text-center">

        {/* Rainbow arc — onboarding と同じ */}
        <div className="absolute top-0 left-0 right-0 h-[200px] overflow-hidden opacity-40 pointer-events-none">
          <svg viewBox="0 0 400 200" className="w-full h-full" preserveAspectRatio="xMidYMin slice">
            <defs>
              <linearGradient id="rainbow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="#ffd6e0" stopOpacity="0.5" />
                <stop offset="25%"  stopColor="#ffe4c9" stopOpacity="0.4" />
                <stop offset="50%"  stopColor="#fff5cc" stopOpacity="0.3" />
                <stop offset="75%"  stopColor="#d4f0d4" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#d4e5f7" stopOpacity="0.4" />
              </linearGradient>
            </defs>
            <path
              d="M-50,200 Q200,-50 450,200"
              fill="none"
              stroke="url(#rainbow)"
              strokeWidth="60"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className="relative z-10 w-full">

          {/* ブランド画像 */}
          <div className="mb-6">
            <img
              src="/sora-brand-sunrise.png"
              alt="Sora"
              className="w-36 h-36 mx-auto object-contain drop-shadow-md"
            />
          </div>

          {/* タイトル */}
          <h1 className="text-2xl font-medium text-foreground/90 mb-3 tracking-wide">
            Sora
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed mb-12">
            ペットとの毎日を、<br />ずっとそばに。
          </p>

          {/* SNS ログインボタン */}
          <div className="space-y-3">
            <button
              onClick={() => signIn("google")}
              disabled={loading !== null}
              className="w-full h-14 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)] flex items-center justify-center gap-3 text-foreground/80 font-medium text-sm hover:bg-white/75 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <GoogleIcon />
              {loading === "google" ? "接続中…" : "Googleでログイン"}
            </button>

            <button
              onClick={() => signIn("apple")}
              disabled={loading !== null}
              className="w-full h-14 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)] flex items-center justify-center gap-3 text-foreground/80 font-medium text-sm hover:bg-white/75 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <AppleIcon />
              {loading === "apple" ? "接続中…" : "Appleでログイン"}
            </button>
          </div>

          <p className="mt-10 text-xs text-muted-foreground/50 leading-relaxed">
            ログインすることで利用規約および<br />プライバシーポリシーに同意したものとみなします
          </p>
        </div>

        {/* 底部フェード */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white/30 to-transparent pointer-events-none" />
      </div>
    </>
  )
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  )
}
