"use client"

import { useState, useRef, useEffect } from "react"
import { useApp } from "@/lib/app-context"
import { GlassCard } from "@/components/glass-card"
import { ArrowLeft, HeartHandshake, RotateCcw, Send, X } from "lucide-react"

type Message = {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
  isBreakMessage?: boolean
}

function makeInitialMessage(petName?: string): Message {
  return {
    id: "1",
    content: petName
      ? `${petName}のことを話せる場所です。ゆっくりでいいですよ。`
      : "ここにいるよ。ゆっくりでいいですよ。",
    role: "assistant",
    timestamp: new Date(),
  }
}

export function ChatScreen() {
  const { setCurrentScreen, pet, memories, feelings, conversationTone } = useApp()
  const [messages, setMessages] = useState<Message[]>([makeInitialMessage(pet?.name)])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSupportSheet, setShowSupportSheet] = useState(false)
  const [breakSuggested, setBreakSuggested] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const latestMemory = memories[0] ?? null
  const dynamicPrompt = latestMemory
    ? `「${latestMemory.title.slice(0, 20)}${latestMemory.title.length > 20 ? "…" : ""}」のこと、話してもいい？`
    : null

  const quickPrompts = [
    ...(dynamicPrompt ? [dynamicPrompt] : []),
    "会いたいな",
    "今日は少しつらい",
    "思い出を話したい",
    "ありがとうを伝えたい",
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (!pet) return
    try {
      const saved = localStorage.getItem(`sora:chat-${pet.id}`)
      if (saved) {
        const parsed = JSON.parse(saved) as (Omit<Message, "timestamp"> & { timestamp: string })[]
        setMessages(parsed.map((m) => ({ ...m, timestamp: new Date(m.timestamp) })))
      }
    } catch { /* ignore corrupt data */ }
  }, [pet?.id])

  useEffect(() => {
    if (!pet || messages.length <= 1) return
    try {
      localStorage.setItem(`sora:chat-${pet.id}`, JSON.stringify(messages.filter((m) => !m.isBreakMessage).slice(-20)))
    } catch { /* ignore storage full */ }
  }, [messages, pet?.id])

  const handleReset = () => {
    if (!pet) return
    localStorage.removeItem(`sora:chat-${pet.id}`)
    setMessages([makeInitialMessage(pet.name)])
  }

  const sendMessage = async (content: string) => {
    if (!content.trim() || isTyping || !pet) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: "user",
      timestamp: new Date(),
    }

    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setInputValue("")
    setIsTyping(true)
    setError(null)

    const apiMessages = nextMessages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role, content: m.content }))
      .slice(-20)

    try {
      const res = await fetch(`/api/pets/${pet.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            messages: apiMessages,
            tone: conversationTone,
            recentFeelings: feelings.slice(0, 3).map((f) => f.tag).filter(Boolean),
          }),
      })

      if (!res.ok) {
        if (res.status === 429) {
          setError("少し待ってから、もう一度試してみてください")
        } else {
          setError("少し待ってから、もう一度試してみてください")
        }
        return
      }

      const data = await res.json()
      const userCount = nextMessages.filter((m) => m.role === "user").length
      const shouldSuggestBreak = !breakSuggested && userCount >= 8
      setMessages((prev) => {
        const updated: Message[] = [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            content: data.reply,
            role: "assistant",
            timestamp: new Date(),
          },
        ]
        if (shouldSuggestBreak) {
          updated.push({
            id: (Date.now() + 2).toString(),
            content: "今日はたくさん話してくれましたね。少し休んで、また話しましょう。",
            role: "assistant",
            timestamp: new Date(),
            isBreakMessage: true,
          })
        }
        return updated
      })
      if (shouldSuggestBreak) setBreakSuggested(true)
    } catch {
      setError("少し待ってから、もう一度試してみてください")
    } finally {
      setIsTyping(false)
    }
  }

  if (!pet || pet.status !== "rainbow_bridge") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8 text-center gap-6">
        <p className="text-4xl">🌿</p>
        <div className="space-y-2">
          <h2 className="font-medium text-foreground/85">まだここではなせる日ではないかもしれない</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            「はなす」は、ロスケアモードに移行してから使える場所です。<br />
            今は、記録を積み重ねることが大切な時間です。
          </p>
        </div>
        <button
          onClick={() => setCurrentScreen("home")}
          className="px-6 py-3 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/50 text-sm text-muted-foreground hover:bg-white/80 transition-colors"
        >
          ホームへ戻る
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col pb-safe">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/30 backdrop-blur-xl border-b border-white/40">
        <div className="px-4 pt-safe">
          <div className="h-14 flex items-center gap-4">
            <button
              onClick={() => setCurrentScreen("home")}
              aria-label="ホームに戻る"
              className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center text-muted-foreground"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1">
              <h1 className="font-medium text-foreground/90">
                {pet ? `${pet.name}の思い出を話す` : "思い出を話す"}
              </h1>
              <p className="text-xs text-muted-foreground">話せる場所があります</p>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 1 && (
                <button
                  onClick={handleReset}
                  aria-label="会話をリセット"
                  className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                >
                  <RotateCcw size={16} />
                </button>
              )}
              <button
                onClick={() => setShowSupportSheet(true)}
                aria-label="専門サポート情報"
                className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
              >
                <HeartHandshake size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-3xl px-5 py-3 ${
                message.role === "user"
                  ? "bg-primary/80 text-primary-foreground rounded-br-lg"
                  : "bg-white/70 text-foreground/90 rounded-bl-lg backdrop-blur-sm border border-white/50"
              }`}
            >
              <p className="text-sm leading-relaxed">{message.content}</p>
            </div>
            {message.isBreakMessage && (
              <button
                onClick={() => setShowSupportSheet(true)}
                className="mt-1 ml-1 text-xs text-primary/50 underline underline-offset-2 hover:text-primary/70 transition-colors"
              >
                専門家に話してみる
              </button>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white/70 rounded-3xl rounded-bl-lg px-5 py-3 backdrop-blur-sm border border-white/50">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        {error && (
          <p className="text-center text-sm text-muted-foreground/70 px-4">{error}</p>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Quick Prompts */}
      <div className="px-4 pb-2">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => sendMessage(prompt)}
              disabled={isTyping}
              className="flex-shrink-0 px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-white/50 text-sm text-foreground/70 hover:bg-white/80 transition-colors disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="px-4 pb-4">
        <GlassCard className="p-3 flex items-end gap-3">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                sendMessage(inputValue)
              }
            }}
            placeholder="話したいことを、ゆっくりでいいので書いてみてください"
            rows={1}
            className="flex-1 bg-transparent border-0 focus:ring-0 focus:outline-none resize-none text-sm text-foreground/90 placeholder:text-muted-foreground/50 max-h-32"
            style={{ minHeight: "24px" }}
          />
          <button
            onClick={() => sendMessage(inputValue)}
            disabled={!inputValue.trim() || isTyping}
            className="w-10 h-10 rounded-full bg-primary/80 flex items-center justify-center text-primary-foreground disabled:bg-muted disabled:text-muted-foreground transition-colors flex-shrink-0"
          >
            <Send size={18} />
          </button>
        </GlassCard>
      </div>

      {/* Support Sheet (ISSUE-063) */}
      {showSupportSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowSupportSheet(false)}
          />
          <div className="relative w-full max-w-lg bg-white/90 backdrop-blur-xl rounded-t-3xl px-6 pt-6 pb-safe border-t border-white/50">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2 text-foreground/80">
                <HeartHandshake size={18} className="text-primary/60" />
                <span className="font-medium text-sm">専門家に話す</span>
              </div>
              <button
                onClick={() => setShowSupportSheet(false)}
                aria-label="閉じる"
                className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-sm text-foreground/70 leading-relaxed mb-5">
              つらくなったとき、専門家に話すことも選択肢のひとつです。
            </p>
            <a
              href="https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/hukushi_kaigo/seikatsuhogo/jisatsu/soudan_tel.html"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between w-full px-4 py-3 rounded-2xl bg-primary/10 text-primary/80 text-sm font-medium hover:bg-primary/15 transition-colors"
            >
              <span>厚生労働省 こころの健康相談窓口</span>
              <span className="text-xs text-muted-foreground">→</span>
            </a>
            <p className="mt-3 text-xs text-center text-muted-foreground/60">
              このアプリはいつもここにいます
            </p>
            <div className="h-4" />
          </div>
        </div>
      )}
    </div>
  )
}
