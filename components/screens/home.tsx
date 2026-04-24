"use client"

import { useApp } from "@/lib/app-context"
import { GlassCard } from "@/components/glass-card"
import { MessageCircle, Book, Mail, Heart, Settings } from "lucide-react"

export function HomeScreen() {
  const { pet, setCurrentScreen } = useApp()

  const quickActions = [
    { icon: MessageCircle, label: "お話しする", screen: "chat" as const },
    { icon: Book, label: "思い出を残す", screen: "timeline" as const },
    { icon: Mail, label: "手紙を読む", screen: "letter" as const },
    { icon: Heart, label: "気持ちを記録する", screen: "feelings" as const },
  ]

  return (
    <div className="min-h-screen pb-safe">
      {/* Header */}
      <header className="px-6 pt-safe">
        <div className="h-16 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "short" })}
          </div>
          <button 
            onClick={() => setCurrentScreen("settings")}
            className="w-10 h-10 rounded-full bg-white/50 backdrop-blur-sm flex items-center justify-center text-muted-foreground"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      <main className="px-6 space-y-6">
        {/* Greeting */}
        <div className="pt-4">
          <h1 className="text-xl font-medium text-foreground/90 mb-1">
            今日はどんな気持ちですか？
          </h1>
        </div>

        {/* Pet Card */}
        {pet && (
          <GlassCard className="relative overflow-hidden">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center overflow-hidden">
                {pet.photo ? (
                  <img src={pet.photo} alt={pet.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl text-primary/60">🐾</span>
                )}
              </div>
              <div className="flex-1">
                <h2 className="font-medium text-foreground/90">
                  {pet.name}との思い出
                </h2>
                {pet.nickname && (
                  <p className="text-sm text-muted-foreground">
                    {pet.nickname}
                  </p>
                )}
              </div>
            </div>
          </GlassCard>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          {quickActions.map(({ icon: Icon, label, screen }) => (
            <GlassCard 
              key={screen}
              onClick={() => setCurrentScreen(screen)}
              className="flex flex-col items-center justify-center py-8 gap-3 hover:bg-white/70 transition-colors"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center">
                <Icon size={22} className="text-primary/70" />
              </div>
              <span className="text-sm font-medium text-foreground/80">{label}</span>
            </GlassCard>
          ))}
        </div>

        {/* Gentle Message */}
        <GlassCard className="bg-gradient-to-br from-white/50 to-accent/10 border-accent/20">
          <p className="text-center text-sm text-muted-foreground leading-relaxed">
            ゆっくりで大丈夫です
          </p>
        </GlassCard>
      </main>
    </div>
  )
}
