import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { ChatScreen } from "@/components/screens/chat"
import type { Pet } from "@/lib/app-context"

// --- モック ---

vi.mock("@/lib/app-context", () => ({ useApp: vi.fn() }))

import { useApp } from "@/lib/app-context"

// --- テストデータ ---

const mockPet: Pet = {
  id: "pet-1",
  name: "ポチ",
  nickname: null,
  species: null,
  breed: null,
  birthDate: null,
  broughtAt: "2021-01-01",
  gender: null,
  photoUrl: null,
  personality: null,
  favorites: null,
  status: "rainbow_bridge",
  role: "owner",
  createdAt: "2021-01-01T00:00:00Z",
  updatedAt: "2026-04-11T00:00:00Z",
}

const mockContext = {
  pet: mockPet,
  setCurrentScreen: vi.fn(),
  pets: [mockPet],
  memories: [],
  feelings: [],
  schedules: [],
  isLoading: false,
  addMemory: vi.fn(),
  updateMemory: vi.fn(),
  deleteMemory: vi.fn(),
  addFeeling: vi.fn(),
  addSchedule: vi.fn(),
  updateSchedule: vi.fn(),
  deleteSchedule: vi.fn(),
  createPet: vi.fn(),
  updatePet: vi.fn(),
  updatePetStatus: vi.fn(),
  switchPet: vi.fn(),
  loadMoreMemories: vi.fn(),
  hasMoreMemories: false,
  pendingMemoryTitle: null,
  setPendingMemoryTitle: vi.fn(),
}

beforeEach(() => {
  vi.clearAllMocks()
  ;(useApp as ReturnType<typeof vi.fn>).mockReturnValue(mockContext)
  global.fetch = vi.fn()
  Element.prototype.scrollIntoView = vi.fn()
})

// --- テスト ---

describe("ChatScreen", () => {
  it("初期表示でウェルカムメッセージが表示される", () => {
    render(<ChatScreen />)
    expect(screen.getByText("ポチのことを話せる場所です。ゆっくりでいいですよ。")).toBeInTheDocument()
  })

  it("ペット名がヘッダーに表示される", () => {
    render(<ChatScreen />)
    expect(screen.getByText("ポチへ")).toBeInTheDocument()
  })

  it("クイックプロンプトが表示される", () => {
    render(<ChatScreen />)
    expect(screen.getByText("会いたいな")).toBeInTheDocument()
    expect(screen.getByText("今日は少しつらい")).toBeInTheDocument()
  })

  it("メッセージ送信 → ローディング → AI返答が表示される", async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ reply: "その気持ち、受け止めています。" }),
    })

    render(<ChatScreen />)
    const textarea = screen.getByPlaceholderText("話したいことを、ゆっくりでいいので書いてみてください")
    await userEvent.type(textarea, "ポチのことが恋しいです")
    await userEvent.keyboard("{Enter}")

    expect(screen.getByText("ポチのことが恋しいです")).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText("その気持ち、受け止めています。")).toBeInTheDocument()
    })
  })

  it("クイックプロンプトのクリックでメッセージが送信される", async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ reply: "一緒にいるよ。" }),
    })

    render(<ChatScreen />)
    await userEvent.click(screen.getByText("会いたいな"))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/pets/pet-1/chat",
        expect.objectContaining({ method: "POST" })
      )
    })
  })

  it("APIエラー時にインラインエラーが表示され、フォームが継続して使える", async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ title: "Internal Server Error" }),
    })

    render(<ChatScreen />)
    const textarea = screen.getByPlaceholderText("話したいことを、ゆっくりでいいので書いてみてください")
    await userEvent.type(textarea, "テスト")
    await userEvent.keyboard("{Enter}")

    await waitFor(() => {
      expect(screen.getByText("少し待ってから、もう一度試してみてください")).toBeInTheDocument()
    })

    // フォームは引き続き使える
    expect(textarea).not.toBeDisabled()
  })

  it("レート制限(429)時に適切なエラーメッセージが表示される", async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ title: "少し待ってから、もう一度試してみてください" }),
    })

    render(<ChatScreen />)
    const textarea = screen.getByPlaceholderText("話したいことを、ゆっくりでいいので書いてみてください")
    await userEvent.type(textarea, "テスト")
    await userEvent.keyboard("{Enter}")

    await waitFor(() => {
      expect(screen.getByText("少し待ってから、もう一度試してみてください")).toBeInTheDocument()
    })
  })

  it("Shift+Enterは改行のみで送信しない", async () => {
    render(<ChatScreen />)
    const textarea = screen.getByPlaceholderText("話したいことを、ゆっくりでいいので書いてみてください")
    await userEvent.type(textarea, "テスト")
    await userEvent.keyboard("{Shift>}{Enter}{/Shift}")

    expect(global.fetch).not.toHaveBeenCalled()
  })

  it("戻るボタンでhome画面に遷移する", async () => {
    render(<ChatScreen />)
    await userEvent.click(screen.getByRole("button", { name: "ホームに戻る" }))
    expect(mockContext.setCurrentScreen).toHaveBeenCalledWith("home")
  })

  it("APIリクエストに正しい会話履歴が含まれる", async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ reply: "そうでしたね。" }),
    })

    render(<ChatScreen />)
    const textarea = screen.getByPlaceholderText("話したいことを、ゆっくりでいいので書いてみてください")
    await userEvent.type(textarea, "散歩の思い出")
    await userEvent.keyboard("{Enter}")

    await waitFor(() => {
      const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
      const body = JSON.parse(call[1].body)
      expect(body.messages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ role: "assistant", content: "ポチのことを話せる場所です。ゆっくりでいいですよ。" }),
          expect.objectContaining({ role: "user", content: "散歩の思い出" }),
        ])
      )
    })
  })
})
