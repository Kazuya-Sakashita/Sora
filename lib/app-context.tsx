"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export type Pet = {
  id: string
  name: string
  nickname: string | null
  species: string | null
  breed: string | null
  birthDate: string | null
  broughtAt: string | null
  gender: string | null
  photoUrl: string | null
  personality: string | null
  favorites: string | null
  status: "alive" | "rainbow_bridge"
  createdAt: string
  updatedAt: string
}

export type Memory = {
  id: string
  title: string
  description: string | null
  date: string
  category: string
  moodTag: string | null
  photoUrls: string[]
  createdAt: string
}

export type Feeling = {
  id: string
  tag: string
  memo: string | null
  date: string
  createdAt: string
}

export type CreatePetInput = {
  name: string
  nickname?: string
  species?: string
  breed?: string
  birthDate?: string
  broughtAt?: string
  gender?: string
  personality?: string
  favorites?: string
  photoUrl?: string
  status?: "alive" | "rainbow_bridge"
}

export type CreateMemoryInput = {
  title: string
  description?: string
  date: string
  category?: string
  moodTag?: string
  photoUrls?: string[]
}

export type CreateFeelingInput = {
  tag: string
  memo?: string
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
  createPet: (input: CreatePetInput) => Promise<void>
  memories: Memory[]
  addMemory: (input: CreateMemoryInput) => Promise<void>
  feelings: Feeling[]
  addFeeling: (input: CreateFeelingInput) => Promise<void>
  isLoading: boolean
  conversationTone: string
  setConversationTone: (tone: string) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentScreen, setCurrentScreen] = useState<Screen>("onboarding")
  const [pet, setPet] = useState<Pet | null>(null)
  const [memories, setMemories] = useState<Memory[]>([])
  const [feelings, setFeelings] = useState<Feeling[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [conversationTone, setConversationTone] = useState("やさしく寄り添う")

  useEffect(() => {
    fetch("/api/pets")
      .then((r) => (r.ok ? r.json() : null))
      .then(async (data) => {
        if (data?.items?.length > 0) {
          const firstPet = data.items[0] as Pet
          setPet(firstPet)
          const [memRes, feelRes] = await Promise.all([
            fetch(`/api/pets/${firstPet.id}/memories`).then((r) =>
              r.ok ? r.json() : { items: [] }
            ),
            fetch(`/api/pets/${firstPet.id}/feelings`).then((r) =>
              r.ok ? r.json() : { items: [] }
            ),
          ])
          setMemories(memRes.items ?? [])
          setFeelings(feelRes.items ?? [])
          setCurrentScreen("home")
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  const createPet = async (input: CreatePetInput) => {
    const res = await fetch("/api/pets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
    if (!res.ok) throw new Error("ペットの登録に失敗しました")
    const newPet = (await res.json()) as Pet
    setPet(newPet)
    setCurrentScreen("home")
  }

  const addMemory = async (input: CreateMemoryInput) => {
    if (!pet) return
    const res = await fetch(`/api/pets/${pet.id}/memories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
    if (!res.ok) throw new Error("思い出の保存に失敗しました")
    const memory = (await res.json()) as Memory
    setMemories((prev) => [memory, ...prev])
  }

  const addFeeling = async (input: CreateFeelingInput) => {
    if (!pet) return
    const res = await fetch(`/api/pets/${pet.id}/feelings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
    if (!res.ok) throw new Error("気持ちの保存に失敗しました")
    const feeling = (await res.json()) as Feeling
    setFeelings((prev) => [feeling, ...prev])
  }

  return (
    <AppContext.Provider
      value={{
        currentScreen,
        setCurrentScreen,
        pet,
        createPet,
        memories,
        addMemory,
        feelings,
        addFeeling,
        isLoading,
        conversationTone,
        setConversationTone,
      }}
    >
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
