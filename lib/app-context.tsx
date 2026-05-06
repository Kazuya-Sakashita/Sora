"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { Pet, Memory, Feeling, Schedule, PetInput, MemoryInput, FeelingInput, ScheduleInput, ScheduleType } from "@/lib/api-types"

export type { Pet, Memory, Feeling, Schedule, ScheduleType }

export type CreatePetInput = PetInput
export type CreateMemoryInput = MemoryInput
export type CreateFeelingInput = FeelingInput
export type CreateScheduleInput = ScheduleInput

export type Screen =
  | "onboarding"
  | "profile-create"
  | "first-record"
  | "home"
  | "timeline"
  | "feelings"
  | "settings"
  | "schedule"
  | "letter"
  | "chat"

type AppContextType = {
  currentScreen: Screen
  setCurrentScreen: (screen: Screen) => void
  pets: Pet[]
  pet: Pet | null
  selectPet: (id: string) => void
  createPet: (input: CreatePetInput) => Promise<void>
  updatePetStatus: (status: "alive" | "rainbow_bridge") => Promise<void>
  memories: Memory[]
  memoriesTotal: number
  addMemory: (input: CreateMemoryInput) => Promise<Memory>
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
  pendingMemoryTitle: string | null
  setPendingMemoryTitle: (title: string | null) => void
  pendingHighlightMemoryId: string | null
  setPendingHighlightMemoryId: (id: string | null) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentScreen, setCurrentScreen] = useState<Screen>("onboarding")
  const [pets, setPets] = useState<Pet[]>([])
  const [pet, setPet] = useState<Pet | null>(null)
  const [memories, setMemories] = useState<Memory[]>([])
  const [memoriesTotal, setMemoriesTotal] = useState(0)
  const [memoriesOffset, setMemoriesOffset] = useState(0)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [feelings, setFeelings] = useState<Feeling[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [conversationTone, setConversationToneState] = useState(
    () => (typeof window !== "undefined" ? localStorage.getItem("sora:conversation-tone") : null) ?? "やさしく寄り添う"
  )
  const setConversationTone = (tone: string) => {
    try {
      localStorage.setItem("sora:conversation-tone", tone)
    } catch { /* ignore storage full */ }
    setConversationToneState(tone)
  }
  const [currentPetId, setCurrentPetId] = useState<string | null>(null)
  const [pendingMemoryTitle, setPendingMemoryTitle] = useState<string | null>(null)
  const [pendingHighlightMemoryId, setPendingHighlightMemoryId] = useState<string | null>(null)

  const MEMORY_PAGE_SIZE = 20

  const loadPetData = async (petId: string) => {
    const [memRes, feelRes, schRes] = await Promise.all([
      fetch(`/api/pets/${petId}/memories?limit=${MEMORY_PAGE_SIZE}&offset=0`).then((r) =>
        r.ok ? r.json() : { items: [], total: 0 }
      ),
      fetch(`/api/pets/${petId}/feelings`).then((r) =>
        r.ok ? r.json() : { items: [] }
      ),
      fetch(`/api/pets/${petId}/schedules`).then((r) =>
        r.ok ? r.json() : { items: [] }
      ),
    ])
    setMemories(memRes.items ?? [])
    setMemoriesTotal(memRes.total ?? 0)
    setMemoriesOffset(MEMORY_PAGE_SIZE)
    setFeelings(feelRes.items ?? [])
    setSchedules(schRes.items ?? [])
  }

  useEffect(() => {
    fetch("/api/pets")
      .then((r) => (r.ok ? r.json() : null))
      .then(async (data) => {
        if (data?.items?.length > 0) {
          const allPets = data.items as Pet[]
          setPets(allPets)
          const firstPet = allPets[0]
          setPet(firstPet)
          setCurrentPetId(firstPet.id)
          await loadPetData(firstPet.id)
          const params = new URLSearchParams(window.location.search)
          const deepMemoryId = params.get("memoryId")
          if (deepMemoryId) {
            setPendingHighlightMemoryId(deepMemoryId)
            setCurrentScreen("timeline")
          } else {
            setCurrentScreen("home")
          }
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  const selectPet = async (id: string) => {
    const found = pets.find((p) => p.id === id)
    if (!found) return
    setPet(found)
    setCurrentPetId(id)
    await loadPetData(id)
    setCurrentScreen("home")
  }

  const createPet = async (input: CreatePetInput) => {
    const res = await fetch("/api/pets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
    if (!res.ok) throw new Error("ペットの登録に失敗しました")
    const newPet = (await res.json()) as Pet
    setPets((prev) => [...prev, newPet])
    setPet(newPet)
    setCurrentScreen("first-record")
  }

  const updatePetStatus = async (status: "alive" | "rainbow_bridge") => {
    if (!pet) return
    const res = await fetch(`/api/pets/${pet.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) throw new Error("ステータスの更新に失敗しました")
    const updated = (await res.json()) as Pet
    setPet(updated)
    setPets((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
  }

  const addMemory = async (input: CreateMemoryInput): Promise<Memory> => {
    if (!pet) throw new Error("ペットが選択されていません")
    const res = await fetch(`/api/pets/${pet.id}/memories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
    if (res.status === 402) throw new Error("PLAN_LIMIT")
    if (!res.ok) throw new Error("思い出の保存に失敗しました")
    const memory = (await res.json()) as Memory
    setMemories((prev) => [memory, ...prev])
    setMemoriesTotal((prev) => prev + 1)
    return memory
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
        pets,
        pet,
        selectPet,
        createPet,
        updatePetStatus,
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
        pendingMemoryTitle,
        setPendingMemoryTitle,
        pendingHighlightMemoryId,
        setPendingHighlightMemoryId,
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
