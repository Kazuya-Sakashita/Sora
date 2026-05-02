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

export type ScheduleType = "hospital" | "trimming" | "vaccine" | "anniversary" | "other"

export type Schedule = {
  id: string
  type: ScheduleType
  title: string
  date: string
  memo: string | null
  createdAt: string
}

export type CreateScheduleInput = {
  type: ScheduleType
  title: string
  date: string
  memo?: string
}

export type Screen =
  | "onboarding"
  | "profile-create"
  | "home"
  | "timeline"
  | "feelings"
  | "settings"
  | "schedule"

type AppContextType = {
  currentScreen: Screen
  setCurrentScreen: (screen: Screen) => void
  pet: Pet | null
  createPet: (input: CreatePetInput) => Promise<void>
  memories: Memory[]
  memoriesTotal: number
  addMemory: (input: CreateMemoryInput) => Promise<void>
  loadMoreMemories: () => Promise<void>
  isLoadingMore: boolean
  feelings: Feeling[]
  addFeeling: (input: CreateFeelingInput) => Promise<void>
  schedules: Schedule[]
  addSchedule: (input: CreateScheduleInput) => Promise<void>
  deleteSchedule: (id: string) => Promise<void>
  isLoading: boolean
  conversationTone: string
  setConversationTone: (tone: string) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentScreen, setCurrentScreen] = useState<Screen>("onboarding")
  const [pet, setPet] = useState<Pet | null>(null)
  const [memories, setMemories] = useState<Memory[]>([])
  const [memoriesTotal, setMemoriesTotal] = useState(0)
  const [memoriesOffset, setMemoriesOffset] = useState(0)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [feelings, setFeelings] = useState<Feeling[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [conversationTone, setConversationTone] = useState("やさしく寄り添う")
  const [currentPetId, setCurrentPetId] = useState<string | null>(null)

  const MEMORY_PAGE_SIZE = 20

  useEffect(() => {
    fetch("/api/pets")
      .then((r) => (r.ok ? r.json() : null))
      .then(async (data) => {
        if (data?.items?.length > 0) {
          const firstPet = data.items[0] as Pet
          setPet(firstPet)
          setCurrentPetId(firstPet.id)
          const [memRes, feelRes, schRes] = await Promise.all([
            fetch(`/api/pets/${firstPet.id}/memories?limit=${MEMORY_PAGE_SIZE}&offset=0`).then((r) =>
              r.ok ? r.json() : { items: [], total: 0 }
            ),
            fetch(`/api/pets/${firstPet.id}/feelings`).then((r) =>
              r.ok ? r.json() : { items: [] }
            ),
            fetch(`/api/pets/${firstPet.id}/schedules`).then((r) =>
              r.ok ? r.json() : { items: [] }
            ),
          ])
          setMemories(memRes.items ?? [])
          setMemoriesTotal(memRes.total ?? 0)
          setMemoriesOffset(MEMORY_PAGE_SIZE)
          setFeelings(feelRes.items ?? [])
          setSchedules(schRes.items ?? [])
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
    setMemoriesTotal((prev) => prev + 1)
  }

  const loadMoreMemories = async () => {
    if (!currentPetId || isLoadingMore) return
    setIsLoadingMore(true)
    try {
      const res = await fetch(
        `/api/pets/${currentPetId}/memories?limit=${MEMORY_PAGE_SIZE}&offset=${memoriesOffset}`
      )
      if (!res.ok) return
      const data = await res.json()
      setMemories((prev) => [...prev, ...(data.items ?? [])])
      setMemoriesTotal(data.total ?? memoriesTotal)
      setMemoriesOffset((prev) => prev + MEMORY_PAGE_SIZE)
    } finally {
      setIsLoadingMore(false)
    }
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

  const addSchedule = async (input: CreateScheduleInput) => {
    if (!pet) return
    const res = await fetch(`/api/pets/${pet.id}/schedules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
    if (!res.ok) throw new Error("予定の保存に失敗しました")
    const schedule = (await res.json()) as Schedule
    setSchedules((prev) =>
      [...prev, schedule].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      )
    )
  }

  const deleteSchedule = async (id: string) => {
    if (!pet) return
    const res = await fetch(`/api/pets/${pet.id}/schedules/${id}`, {
      method: "DELETE",
    })
    if (!res.ok) throw new Error("予定の削除に失敗しました")
    setSchedules((prev) => prev.filter((s) => s.id !== id))
  }

  return (
    <AppContext.Provider
      value={{
        currentScreen,
        setCurrentScreen,
        pet,
        createPet,
        memories,
        memoriesTotal,
        addMemory,
        loadMoreMemories,
        isLoadingMore,
        feelings,
        addFeeling,
        schedules,
        addSchedule,
        deleteSchedule,
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
