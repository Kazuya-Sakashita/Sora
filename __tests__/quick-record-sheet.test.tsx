import { render, screen, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { QuickRecordSheet } from "@/components/quick-record-sheet"
import type { Pet } from "@/lib/app-context"

vi.mock("@/lib/app-context", () => ({ useApp: vi.fn() }))
vi.mock("@/lib/storage", () => ({ uploadPhoto: vi.fn() }))

import { useApp } from "@/lib/app-context"

const mockPet: Pet = {
  id: "pet-1",
  name: "ポチ",
  nickname: null,
  species: null,
  breed: null,
  birthDate: null,
  broughtAt: "2026-01-01",
  gender: null,
  photoUrl: null,
  personality: null,
  favorites: null,
  personalityVault: null,
  status: "alive",
  role: "owner",
  publicProfile: false,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
}

function mockContext(addMemory = vi.fn()) {
  vi.mocked(useApp).mockReturnValue({
    currentScreen: "home",
    setCurrentScreen: vi.fn(),
    pet: mockPet,
    memories: [],
    memoriesTotal: 0,
    loadMoreMemories: vi.fn(),
    isLoadingMore: false,
    feelings: [],
    schedules: [],
    isLoading: false,
    createPet: vi.fn(),
    addMemory,
    updateMemory: vi.fn(),
    addFeeling: vi.fn(),
    addSchedule: vi.fn(),
    deleteSchedule: vi.fn(),
    conversationTone: "やさしく寄り添う",
    setConversationTone: vi.fn(),
    pendingMemoryTitle: null,
    setPendingMemoryTitle: vi.fn(),
    pendingHighlightMemoryId: null,
    setPendingHighlightMemoryId: vi.fn(),
    updatePetStatus: vi.fn(),
    updatePet: vi.fn(),
    pets: [],
    selectPet: vi.fn(),
  })
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ reaction: null }) }))
})

describe("QuickRecordSheet", () => {
  it("通常のEnterキーで保存が発火する", async () => {
    const addMemory = vi.fn().mockResolvedValue({ id: "mem-1" })
    mockContext(addMemory)
    const onClose = vi.fn()
    render(<QuickRecordSheet onClose={onClose} />)

    const input = screen.getByRole("textbox")
    await userEvent.type(input, "今日の散歩")

    fireEvent.keyDown(input, { key: "Enter", isComposing: false })

    expect(addMemory).toHaveBeenCalledOnce()
  })

  it("IME変換中のEnterでは保存が発火しない", async () => {
    const addMemory = vi.fn().mockResolvedValue({ id: "mem-1" })
    mockContext(addMemory)
    render(<QuickRecordSheet onClose={vi.fn()} />)

    const input = screen.getByRole("textbox")
    await userEvent.type(input, "sanpo")

    // IME composing 中 (isComposing: true) — KeyboardEventInit で直接設定
    fireEvent.keyDown(input, { key: "Enter", isComposing: true })

    expect(addMemory).not.toHaveBeenCalled()
  })

  it("タイトルが空の場合はEnterでも保存されない", () => {
    const addMemory = vi.fn()
    mockContext(addMemory)
    render(<QuickRecordSheet onClose={vi.fn()} />)

    const input = screen.getByRole("textbox")
    fireEvent.keyDown(input, { key: "Enter", isComposing: false })

    expect(addMemory).not.toHaveBeenCalled()
  })

  it("閉じるボタンを押しても保存されない", async () => {
    const addMemory = vi.fn()
    const onClose = vi.fn()
    mockContext(addMemory)
    render(<QuickRecordSheet onClose={onClose} />)

    const input = screen.getByRole("textbox")
    await userEvent.type(input, "途中入力")

    const closeBtn = screen.getByRole("button", { name: "閉じる" })
    await userEvent.click(closeBtn)

    expect(addMemory).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it("写真ボタンを押しても保存されない", async () => {
    const addMemory = vi.fn()
    mockContext(addMemory)
    render(<QuickRecordSheet onClose={vi.fn()} />)

    const input = screen.getByRole("textbox")
    await userEvent.type(input, "途中入力")

    const photoBtn = screen.getByRole("button", { name: "写真を追加" })
    await userEvent.click(photoBtn)

    expect(addMemory).not.toHaveBeenCalled()
  })

  it("残すボタンを押したときだけ保存される", async () => {
    const addMemory = vi.fn().mockResolvedValue({ id: "mem-1" })
    mockContext(addMemory)
    render(<QuickRecordSheet onClose={vi.fn()} />)

    const input = screen.getByRole("textbox")
    await userEvent.type(input, "今日の思い出")

    const saveBtn = screen.getByRole("button", { name: "残す" })
    await userEvent.click(saveBtn)

    expect(addMemory).toHaveBeenCalledOnce()
    expect(addMemory).toHaveBeenCalledWith(expect.objectContaining({ title: "今日の思い出" }))
  })
})
