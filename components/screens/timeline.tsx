"use client"

import { useState } from "react"
import { useApp } from "@/lib/app-context"
import { GlassCard } from "@/components/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Plus, X } from "lucide-react"

export function TimelineScreen() {
  const { setCurrentScreen, memories, addMemory } = useApp()
  const [isAdding, setIsAdding] = useState(false)
  const [newMemory, setNewMemory] = useState({ title: "", description: "" })

  const handleAddMemory = () => {
    if (newMemory.title) {
      addMemory({
        id: Date.now().toString(),
        title: newMemory.title,
        description: newMemory.description,
        date: new Date().toISOString(),
      })
      setNewMemory({ title: "", description: "" })
      setIsAdding(false)
    }
  }

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
            <h1 className="flex-1 font-medium text-foreground/90">思い出</h1>
          </div>
        </div>
      </header>

      <main className="px-6 py-6 space-y-6">
        {/* Add Memory Button or Form */}
        {isAdding ? (
          <GlassCard className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-foreground/80">新しい思い出</h3>
              <button 
                onClick={() => setIsAdding(false)}
                className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center text-muted-foreground"
              >
                <X size={16} />
              </button>
            </div>
            <Input
              value={newMemory.title}
              onChange={(e) => setNewMemory(prev => ({ ...prev, title: e.target.value }))}
              placeholder="タイトル（例：いっしょにお散歩した日）"
              className="h-12 rounded-xl bg-white/50 border-white/60"
            />
            <Textarea
              value={newMemory.description}
              onChange={(e) => setNewMemory(prev => ({ ...prev, description: e.target.value }))}
              placeholder="その時の思い出を少しだけ..."
              rows={3}
              className="rounded-xl bg-white/50 border-white/60 resize-none"
            />
            <Button
              onClick={handleAddMemory}
              disabled={!newMemory.title}
              className="w-full h-12 rounded-xl bg-primary/80 hover:bg-primary/90"
            >
              保存する
            </Button>
          </GlassCard>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full py-4 rounded-2xl border-2 border-dashed border-primary/20 flex items-center justify-center gap-2 text-primary/60 hover:border-primary/40 hover:text-primary/80 transition-colors"
          >
            <Plus size={20} />
            <span>思い出を追加する</span>
          </button>
        )}

        {/* Memories List */}
        {memories.length > 0 ? (
          <div className="space-y-4">
            {memories.map((memory) => (
              <GlassCard key={memory.id}>
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium text-foreground/90">{memory.title}</h3>
                    <span className="text-xs text-muted-foreground">
                      {new Date(memory.date).toLocaleDateString("ja-JP", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  {memory.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {memory.description}
                    </p>
                  )}
                </div>
              </GlassCard>
            ))}
          </div>
        ) : !isAdding && (
          <div className="py-16 text-center">
            <p className="text-muted-foreground text-sm leading-relaxed">
              少しずつ、<br />思い出を残していきましょう
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
