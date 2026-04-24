"use client"

import { useState, useRef, useEffect } from "react"
import { useApp } from "@/lib/app-context"
import { GlassCard } from "@/components/glass-card"
import { ArrowLeft, Send } from "lucide-react"

type Message = {
  id: string
  content: string
  isUser: boolean
  timestamp: Date
}

const aiResponses = [
  "ここにいるよ。無理しなくて大丈夫。",
  "その気持ち、ちゃんと受け止めているよ。",
  "一緒に過ごした時間は、とても大切なものだったんだね。",
  "辛いときは、辛いって言っていいんだよ。",
  "あなたの思いは、ちゃんとここに届いているよ。",
  "ゆっくり、自分のペースで大丈夫だから。",
  "その子との思い出、もっと聞かせてくれる？",
  "あなたがそんなに大切に思っていること、素敵なことだね。",
]

export function ChatScreen() {
  const { setCurrentScreen, pet } = useApp()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "ここにいるよ。無理しなくて大丈夫",
      isUser: false,
      timestamp: new Date(),
    }
  ])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const quickPrompts = [
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

  const sendMessage = (content: string) => {
    if (!content.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      isUser: true,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue("")
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponses[Math.floor(Math.random() * aiResponses.length)],
        isUser: false,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, aiResponse])
      setIsTyping(false)
    }, 1500)
  }

  return (
    <div className="min-h-screen flex flex-col pb-safe">
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
            <div className="flex-1">
              <h1 className="font-medium text-foreground/90">
                {pet ? `${pet.name}へ` : "お話しする"}
              </h1>
              <p className="text-xs text-muted-foreground">いつでもそばにいるよ</p>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-3xl px-5 py-3 ${
                message.isUser
                  ? "bg-primary/80 text-primary-foreground rounded-br-lg"
                  : "bg-white/70 text-foreground/90 rounded-bl-lg backdrop-blur-sm border border-white/50"
              }`}
            >
              <p className="text-sm leading-relaxed">{message.content}</p>
            </div>
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

        <div ref={messagesEndRef} />
      </main>

      {/* Quick Prompts */}
      <div className="px-4 pb-2">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => sendMessage(prompt)}
              className="flex-shrink-0 px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-white/50 text-sm text-foreground/70 hover:bg-white/80 transition-colors"
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
              if (e.key === "Enter" && !e.shiftKey) {
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
            disabled={!inputValue.trim()}
            className="w-10 h-10 rounded-full bg-primary/80 flex items-center justify-center text-primary-foreground disabled:bg-muted disabled:text-muted-foreground transition-colors flex-shrink-0"
          >
            <Send size={18} />
          </button>
        </GlassCard>
      </div>
    </div>
  )
}
