"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"

export default function InvitePage() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get("token")
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setMessage("招待リンクが正しくありません")
      return
    }

    fetch("/api/invite/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        if (res.status === 401) {
          // Not logged in — redirect to login, then back
          window.location.href = `/auth/login?redirect=/invite?token=${token}`
          return
        }
        if (res.status === 410) {
          setStatus("error")
          setMessage("招待リンクの有効期限が切れています")
          return
        }
        if (!res.ok) {
          setStatus("error")
          setMessage("招待の受け付けに失敗しました")
          return
        }
        setStatus("success")
      })
      .catch(() => {
        setStatus("error")
        setMessage("エラーが発生しました")
      })
  }, [token])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary/80 animate-spin" />
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-3xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-xl p-8 text-center space-y-4">
          <p className="text-3xl">😔</p>
          <p className="font-medium text-foreground/80">{message}</p>
          <button
            onClick={() => router.push("/")}
            className="w-full h-12 rounded-2xl bg-primary/10 text-primary/80 font-medium text-sm"
          >
            ホームへ
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-3xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-xl p-8 text-center space-y-4">
        <p className="text-3xl">🎉</p>
        <h1 className="font-semibold text-foreground/90">家族として参加しました</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          ペットの思い出を一緒に残せるようになりました。
        </p>
        <button
          onClick={() => router.push("/")}
          className="w-full h-12 rounded-2xl bg-primary/80 text-primary-foreground font-medium text-sm"
        >
          思い出を見る
        </button>
      </div>
    </div>
  )
}
