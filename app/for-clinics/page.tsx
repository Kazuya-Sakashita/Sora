"use client"

import { useState } from "react"
import type { Metadata } from "next"

const BENEFITS = [
  {
    icon: "📋",
    title: "診察がスムーズになる",
    desc: "患者さんが記録した食事・体調・投薬履歴を診察前に確認。問診時間を短縮できます。",
  },
  {
    icon: "💊",
    title: "服薬管理をサポート",
    desc: "投薬スケジュールや次回受診日をアプリで通知。飲み忘れや予約忘れが減ります。",
  },
  {
    icon: "❤️",
    title: "飼い主さんの安心感が増す",
    desc: "日々の記録が蓄積されることで、ペットの変化に気づきやすくなります。",
  },
  {
    icon: "🤝",
    title: "クリニックへの信頼が高まる",
    desc: "「このクリニックに勧めてもらったアプリ」として口コミが広がります。",
  },
]

const FEATURES = [
  { icon: "📸", label: "思い出記録", desc: "写真・メモ・気持ちを記録" },
  { icon: "📅", label: "受診スケジュール", desc: "通院・ワクチンの予定管理" },
  { icon: "💬", label: "AIサポート", desc: "ペットロスのグリーフケア" },
  { icon: "🔔", label: "プッシュ通知", desc: "服薬・予定のリマインダー" },
]

export default function ForClinicsPage() {
  const [form, setForm] = useState({ name: "", clinicName: "", email: "", message: "" })
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")
  const [errors, setErrors] = useState<Partial<typeof form>>({})

  const validate = () => {
    const e: Partial<typeof form> = {}
    if (!form.name.trim()) e.name = "お名前を入力してください"
    if (!form.clinicName.trim()) e.clinicName = "クリニック名を入力してください"
    if (!form.email.trim()) e.email = "メールアドレスを入力してください"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "有効なメールアドレスを入力してください"
    if (!form.message.trim()) e.message = "メッセージを入力してください"
    return e
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setStatus("sending")
    try {
      const res = await fetch("/api/contact/clinic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      setStatus("sent")
    } catch {
      setStatus("error")
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-sky-50 via-white to-blue-50 px-6 py-20 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <p className="text-sm font-semibold text-sky-500 tracking-widest uppercase">For Clinics &amp; Insurance</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground/90 leading-tight">
            ペット記録アプリSoraを<br />
            患者さんにご紹介ください
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
            飼い主さんが日々の記録を自分で管理できるようになると、
            診察がスムーズになり、ペットとの時間がより豊かになります。
          </p>
          <a
            href="#contact"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-base transition-colors shadow-lg shadow-sky-200"
          >
            パートナーシップについて問い合わせる →
          </a>
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-foreground/90">クリニックに選ばれる理由</h2>
          <p className="text-muted-foreground mt-2">飼い主さんにとっても、クリニックにとってもメリットがあります</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          {BENEFITS.map((b) => (
            <div key={b.title} className="flex gap-4 p-6 rounded-2xl bg-sky-50/60 border border-sky-100">
              <span className="text-3xl shrink-0">{b.icon}</span>
              <div>
                <p className="font-semibold text-foreground/85">{b.title}</p>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* App Features */}
      <section className="bg-gradient-to-br from-slate-50 to-sky-50 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-foreground/90">Soraでできること</h2>
            <p className="text-muted-foreground mt-2">ペットとの日々を記録し、将来のグリーフケアへとつながるアプリです</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {FEATURES.map((f) => (
              <div key={f.label} className="text-center p-5 rounded-2xl bg-white border border-white shadow-sm space-y-2">
                <p className="text-3xl">{f.icon}</p>
                <p className="font-semibold text-sm text-foreground/85">{f.label}</p>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partnership Details */}
      <section className="max-w-3xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-foreground/90">パートナーシップの内容</h2>
        </div>
        <div className="space-y-4">
          {[
            { label: "紹介方法", desc: "待合室のポスター・リーフレット配布、またはスタッフからの口頭紹介" },
            { label: "費用", desc: "パートナー登録・紹介に費用はかかりません（無料）" },
            { label: "リーフレット", desc: "PDFデータをご提供します。印刷してご活用いただけます" },
            { label: "ユーザー特典", desc: "紹介経由でご登録いただいた飼い主さんに特典を提供予定（調整中）" },
          ].map((item) => (
            <div key={item.label} className="flex gap-4 py-4 border-b border-muted/30">
              <p className="w-28 shrink-0 text-sm font-semibold text-sky-600">{item.label}</p>
              <p className="text-sm text-foreground/70 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Leaflet download placeholder */}
        <div className="mt-8 p-6 rounded-2xl bg-amber-50 border border-amber-100 flex items-center gap-4">
          <span className="text-3xl">📄</span>
          <div className="flex-1">
            <p className="font-semibold text-foreground/85">紹介リーフレット（PDF）</p>
            <p className="text-sm text-muted-foreground">A4印刷対応・無料配布用デザイン</p>
          </div>
          <a
            href="/sora-clinic-leaflet.pdf"
            download
            className="shrink-0 px-4 py-2 rounded-xl bg-amber-400/90 hover:bg-amber-400 text-white text-sm font-medium transition-colors"
          >
            ダウンロード
          </a>
        </div>
      </section>

      {/* Contact Form */}
      <section id="contact" className="bg-gradient-to-br from-sky-50 to-white py-20 px-6">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-foreground/90">パートナーシップのお問い合わせ</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              まずはお気軽にご連絡ください。詳細をお伝えします。
            </p>
          </div>

          {status === "sent" ? (
            <div className="rounded-3xl bg-white border border-sky-100 shadow-sm p-10 text-center space-y-4">
              <p className="text-4xl">✉️</p>
              <p className="font-semibold text-foreground/90">お問い合わせを受け付けました</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                2営業日以内にご連絡いたします。<br />
                しばらくお待ちください。
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="rounded-3xl bg-white border border-sky-100 shadow-sm p-8 space-y-5">
              {[
                { id: "name", label: "お名前", placeholder: "山田 太郎", type: "text" },
                { id: "clinicName", label: "クリニック・会社名", placeholder: "〇〇動物病院", type: "text" },
                { id: "email", label: "メールアドレス", placeholder: "contact@example.com", type: "email" },
              ].map(({ id, label, placeholder, type }) => (
                <div key={id} className="space-y-1.5">
                  <label htmlFor={id} className="text-sm font-medium text-foreground/80">
                    {label} <span className="text-destructive">*</span>
                  </label>
                  <input
                    id={id}
                    type={type}
                    placeholder={placeholder}
                    value={form[id as keyof typeof form]}
                    onChange={(e) => setForm((p) => ({ ...p, [id]: e.target.value }))}
                    className="w-full h-11 px-4 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 transition"
                  />
                  {errors[id as keyof typeof errors] && (
                    <p className="text-xs text-destructive">{errors[id as keyof typeof errors]}</p>
                  )}
                </div>
              ))}

              <div className="space-y-1.5">
                <label htmlFor="message" className="text-sm font-medium text-foreground/80">
                  メッセージ <span className="text-destructive">*</span>
                </label>
                <textarea
                  id="message"
                  rows={4}
                  placeholder="ご質問・ご要望などをお聞かせください"
                  value={form.message}
                  onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 transition resize-none"
                />
                {errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
              </div>

              {status === "error" && (
                <p className="text-sm text-destructive">送信に失敗しました。時間をおいて再度お試しください。</p>
              )}

              <button
                type="submit"
                disabled={status === "sending"}
                className="w-full h-12 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {status === "sending" ? (
                  <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : "送信する"}
              </button>

              <p className="text-xs text-muted-foreground text-center">
                送信いただいた情報はパートナーシップ対応のみに使用します
              </p>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 text-center border-t border-muted/20">
        <p className="text-sm font-medium text-sky-400">Sora</p>
        <p className="text-xs text-muted-foreground mt-1">ペットとの毎日を残す場所</p>
        <a href="/" className="inline-block mt-3 text-xs text-muted-foreground/60 hover:text-muted-foreground/80 transition-colors underline underline-offset-2">
          アプリを使ってみる
        </a>
      </footer>
    </div>
  )
}
