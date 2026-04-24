"use client"

import { useApp } from "@/lib/app-context"
import { GlassCard } from "@/components/glass-card"
import { ArrowLeft, Bell, Palette, Lock, MessageCircle, Check } from "lucide-react"

export function SettingsScreen() {
  const { setCurrentScreen, conversationTone, setConversationTone } = useApp()

  const toneOptions = [
    { label: "やさしく寄り添う", description: "あたたかく、そっと支える言葉" },
    { label: "思い出を一緒に振り返る", description: "大切な時間を一緒に思い出す" },
    { label: "少し前を向く言葉もほしい", description: "ゆっくりと、次の一歩へ" },
  ]

  const settingSections = [
    { icon: Bell, label: "通知", description: "やさしいリマインダー" },
    { icon: Palette, label: "テーマ", description: "画面の雰囲気" },
    { icon: Lock, label: "プライバシー", description: "あなたの思い出を守る" },
  ]

  return (
    <div className="min-h-screen pb-safe">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/30 backdrop-blur-xl border-b border-white/40">
        <div className="px-4 pt-safe">
          <div className="h-14 flex items-center gap-4">
            <button 
              onClick={() => setCurrentScreen("home")}
              className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center text-muted-foreground"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="flex-1 font-medium text-foreground/90">設定</h1>
          </div>
        </div>
      </header>

      <main className="px-6 py-6 space-y-8">
        {/* Conversation Tone */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageCircle size={20} className="text-primary/70" />
            </div>
            <div>
              <h2 className="font-medium text-foreground/90">会話の雰囲気</h2>
              <p className="text-xs text-muted-foreground">どんな言葉で寄り添いますか？</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {toneOptions.map(({ label, description }) => (
              <button
                key={label}
                onClick={() => setConversationTone(label)}
                className={`w-full p-4 rounded-2xl flex items-start gap-4 text-left transition-all ${
                  conversationTone === label
                    ? "bg-primary/15 border-2 border-primary/30"
                    : "bg-white/60 backdrop-blur-sm border border-white/50 hover:bg-white/80"
                }`}
              >
                <div className="flex-1">
                  <p className="font-medium text-foreground/80 text-sm">{label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{description}</p>
                </div>
                {conversationTone === label && (
                  <div className="w-5 h-5 rounded-full bg-primary/80 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check size={12} className="text-primary-foreground" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Other Settings */}
        <section className="space-y-3">
          {settingSections.map(({ icon: Icon, label, description }) => (
            <GlassCard key={label} className="flex items-center gap-4 py-4">
              <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
                <Icon size={20} className="text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground/80 text-sm">{label}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
              <div className="w-6 h-6 rounded-full bg-muted/30 flex items-center justify-center">
                <ArrowLeft size={14} className="text-muted-foreground rotate-180" />
              </div>
            </GlassCard>
          ))}
        </section>

        {/* Footer Message */}
        <div className="pt-8 text-center">
          <p className="text-xs text-muted-foreground/60 leading-relaxed">
            あなたの思い出は、<br />大切に守られています
          </p>
        </div>
      </main>
    </div>
  )
}
