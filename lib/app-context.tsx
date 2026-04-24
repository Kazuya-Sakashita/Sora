"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export type Pet = {
  id: string
  name: string
  nickname: string
  personality: string
  favorites: string
  memories: string
  photo?: string
}

export type Memory = {
  id: string
  title: string
  description: string
  date: string
}

export type Feeling = {
  id: string
  feeling: string
  date: string
}

export type Screen = 
  | "onboarding" 
  | "profile-create" 
  | "home" 
  | "chat" 
  | "timeline" 
  | "letter" 
  | "feelings" 
  | "settings"

type AppContextType = {
  currentScreen: Screen
  setCurrentScreen: (screen: Screen) => void
  pet: Pet | null
  setPet: (pet: Pet | null) => void
  memories: Memory[]
  addMemory: (memory: Memory) => void
  feelings: Feeling[]
  addFeeling: (feeling: Feeling) => void
  conversationTone: string
  setConversationTone: (tone: string) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentScreen, setCurrentScreen] = useState<Screen>("onboarding")
  const [pet, setPet] = useState<Pet | null>(null)
  const [memories, setMemories] = useState<Memory[]>([])
  const [feelings, setFeelings] = useState<Feeling[]>([])
  const [conversationTone, setConversationTone] = useState("やさしく寄り添う")

  const addMemory = (memory: Memory) => {
    setMemories(prev => [memory, ...prev])
  }

  const addFeeling = (feeling: Feeling) => {
    setFeelings(prev => [feeling, ...prev])
  }

  return (
    <AppContext.Provider value={{
      currentScreen,
      setCurrentScreen,
      pet,
      setPet,
      memories,
      addMemory,
      feelings,
      addFeeling,
      conversationTone,
      setConversationTone,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}
