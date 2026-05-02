import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { TimelineScreen } from "@/components/screens/timeline"
import type { Memory, Pet } from "@/lib/app-context"

// --- モック ---

vi.mock("@/lib/app-context", () => ({ useApp: vi.fn() }))
vi.mock("@/lib/storage", () => ({ uploadPhoto: vi.fn() }))

import { useApp } from "@/lib/app-context"

// --- テストデータ ---

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
  status: "alive",
  role: "owner",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
}

const mockMemory: Memory = {
  id: "mem-1",
  title: "公園でお散歩",
  description: "楽しかった",
  date: "2026-05-01",
  category: "daily",
  moodTag: "happy",
  photoUrls: ["https://example.com/photo.jpg"],
  createdAt: "2026-05-01T10:00:00Z",
}

const mockMemoryMay: Memory = {
  id: "mem-2",
  title: "ごはんの時間",
  description: null,
  date: "2026-05-15",
  category: "daily",
  moodTag: null,
  photoUrls: [],
  createdAt: "2026-05-15T12:00:00Z",
}

const mockMemoryApril: Memory = {
  id: "mem-3",
  title: "初めての病院",
  description: null,
  date: "2026-04-10",
  category: "health",
  moodTag: "worried",
  photoUrls: [],
  createdAt: "2026-04-10T09:00:00Z",
}

function mockContext(memories: Memory[], pet: Pet | null = mockPet) {
  vi.mocked(useApp).mockReturnValue({
    currentScreen: "timeline",
    setCurrentScreen: vi.fn(),
    pet,
    memories,
    memoriesTotal: memories.length,
    loadMoreMemories: vi.fn(),
    isLoadingMore: false,
    feelings: [],
    schedules: [],
    isLoading: false,
    createPet: vi.fn(),
    addMemory: vi.fn().mockResolvedValue(undefined),
    addFeeling: vi.fn(),
    addSchedule: vi.fn(),
    deleteSchedule: vi.fn(),
    conversationTone: "やさしく寄り添う",
    setConversationTone: vi.fn(),
    updatePetStatus: vi.fn(),
    pets: [],
    selectPet: vi.fn(),
  })
}

// --- テスト ---

describe("TimelineScreen — 空状態", () => {
  beforeEach(() => mockContext([]))

  it("空状態メッセージが表示される", () => {
    render(<TimelineScreen />)
    expect(screen.getByText("まだ思い出がありません")).toBeInTheDocument()
  })

  it("ペット名が空状態メッセージに含まれる", () => {
    render(<TimelineScreen />)
    expect(screen.getByText(/ポチとの最初の思い出/)).toBeInTheDocument()
  })

  it("記録追加への導線ボタンがある", () => {
    render(<TimelineScreen />)
    expect(screen.getByRole("button", { name: "思い出を記録する" })).toBeInTheDocument()
  })

  it("「思い出を記録する」を押すとフォームが開く", async () => {
    render(<TimelineScreen />)
    await userEvent.click(screen.getByRole("button", { name: "思い出を記録する" }))
    expect(screen.getByPlaceholderText(/タイトル/)).toBeInTheDocument()
  })
})

describe("TimelineScreen — 記録あり", () => {
  beforeEach(() => mockContext([mockMemory]))

  it("空状態メッセージが表示されない", () => {
    render(<TimelineScreen />)
    expect(screen.queryByText("まだ思い出がありません")).not.toBeInTheDocument()
  })

  it("月別ヘッダーが表示される", () => {
    render(<TimelineScreen />)
    expect(screen.getByText("2026年5月")).toBeInTheDocument()
  })

  it("記録のタイトルが表示される", () => {
    render(<TimelineScreen />)
    expect(screen.getByText("公園でお散歩")).toBeInTheDocument()
  })

  it("写真が正しいsrcで表示される", () => {
    render(<TimelineScreen />)
    const img = screen.getByAltText("公園でお散歩")
    expect(img).toHaveAttribute("src", "https://example.com/photo.jpg")
  })

  it("気持ちタグが表示される", () => {
    render(<TimelineScreen />)
    expect(screen.getByText(/うれしい/)).toBeInTheDocument()
  })

  it("記録の説明文が表示される", () => {
    render(<TimelineScreen />)
    expect(screen.getByText("楽しかった")).toBeInTheDocument()
  })
})

describe("TimelineScreen — 月別グループ", () => {
  beforeEach(() => mockContext([mockMemoryMay, mockMemoryApril]))

  it("複数の月ヘッダーが表示される", () => {
    render(<TimelineScreen />)
    expect(screen.getByText("2026年5月")).toBeInTheDocument()
    expect(screen.getByText("2026年4月")).toBeInTheDocument()
  })

  it("新しい月が先に表示される", () => {
    render(<TimelineScreen />)
    const headers = screen.getAllByText(/2026年\d+月/)
    expect(headers[0]).toHaveTextContent("2026年5月")
    expect(headers[1]).toHaveTextContent("2026年4月")
  })

  it("各月の記録が正しく分類される", () => {
    render(<TimelineScreen />)
    expect(screen.getByText("ごはんの時間")).toBeInTheDocument()
    expect(screen.getByText("初めての病院")).toBeInTheDocument()
  })
})

describe("TimelineScreen — 写真なし記録", () => {
  beforeEach(() => mockContext([mockMemoryApril]))

  it("写真がない記録にはプレースホルダーが表示される", () => {
    render(<TimelineScreen />)
    // 写真がない場合は img タグが存在しない
    expect(screen.queryByRole("img")).not.toBeInTheDocument()
  })
})

describe("TimelineScreen — 記録追加フォーム", () => {
  beforeEach(() => mockContext([mockMemory]))

  it("ヘッダーの＋ボタンでフォームが開く", async () => {
    render(<TimelineScreen />)
    await userEvent.click(screen.getByRole("button", { name: "思い出を追加" }))
    expect(screen.getByText("新しい思い出")).toBeInTheDocument()
  })

  it("フォームに写真ピッカーがある", async () => {
    render(<TimelineScreen />)
    await userEvent.click(screen.getByRole("button", { name: "思い出を追加" }))
    expect(screen.getByText("写真を追加する（任意）")).toBeInTheDocument()
  })

  it("タイトルが空のとき保存ボタンが無効", async () => {
    render(<TimelineScreen />)
    await userEvent.click(screen.getByRole("button", { name: "思い出を追加" }))
    expect(screen.getByRole("button", { name: "保存する" })).toBeDisabled()
  })

  it("タイトルを入力すると保存ボタンが有効になる", async () => {
    render(<TimelineScreen />)
    await userEvent.click(screen.getByRole("button", { name: "思い出を追加" }))
    await userEvent.type(screen.getByPlaceholderText(/タイトル/), "散歩した日")
    expect(screen.getByRole("button", { name: "保存する" })).toBeEnabled()
  })

  it("×ボタンでフォームが閉じる", async () => {
    render(<TimelineScreen />)
    await userEvent.click(screen.getByRole("button", { name: "思い出を追加" }))
    expect(screen.getByText("新しい思い出")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "フォームを閉じる" }))
    expect(screen.queryByText("新しい思い出")).not.toBeInTheDocument()
  })
})

describe("TimelineScreen — 保存完了フィードバック", () => {
  it("保存後にフィードバックトーストが表示される", async () => {
    mockContext([])
    vi.mocked(useApp).mockReturnValue({
      ...vi.mocked(useApp)(),
      addMemory: vi.fn().mockResolvedValue(undefined),
    })
    render(<TimelineScreen />)
    await userEvent.click(screen.getByRole("button", { name: "思い出を記録する" }))
    await userEvent.type(screen.getByPlaceholderText(/タイトル/), "散歩した日")
    await userEvent.click(screen.getByRole("button", { name: "保存する" }))
    expect(await screen.findByText("残せました")).toBeInTheDocument()
  })

  it("フィードバックにペット名が含まれる", async () => {
    mockContext([])
    vi.mocked(useApp).mockReturnValue({
      ...vi.mocked(useApp)(),
      addMemory: vi.fn().mockResolvedValue(undefined),
    })
    render(<TimelineScreen />)
    await userEvent.click(screen.getByRole("button", { name: "思い出を記録する" }))
    await userEvent.type(screen.getByPlaceholderText(/タイトル/), "散歩した日")
    await userEvent.click(screen.getByRole("button", { name: "保存する" }))
    expect(await screen.findByText(/ポチとの今日が/)).toBeInTheDocument()
  })

  it("フィードバックをタップすると閉じる", async () => {
    mockContext([])
    vi.mocked(useApp).mockReturnValue({
      ...vi.mocked(useApp)(),
      addMemory: vi.fn().mockResolvedValue(undefined),
    })
    render(<TimelineScreen />)
    await userEvent.click(screen.getByRole("button", { name: "思い出を記録する" }))
    await userEvent.type(screen.getByPlaceholderText(/タイトル/), "散歩した日")
    await userEvent.click(screen.getByRole("button", { name: "保存する" }))
    const toast = await screen.findByRole("button", { name: "フィードバックを閉じる" })
    await userEvent.click(toast)
    expect(screen.queryByText("残せました")).not.toBeInTheDocument()
  })
})

describe("TimelineScreen — ページネーション「もっと見る」", () => {
  it("全件表示済み（memoriesTotal === memories.length）のとき「もっと見る」が非表示", () => {
    mockContext([mockMemory])
    render(<TimelineScreen />)
    expect(screen.queryByRole("button", { name: /もっと見る/ })).not.toBeInTheDocument()
  })

  it("未読込みがある場合「もっと見る（残りN件）」ボタンが表示される", () => {
    vi.mocked(useApp).mockReturnValue({
      ...vi.mocked(useApp)(),
      memories: [mockMemory],
      memoriesTotal: 5,
    })
    render(<TimelineScreen />)
    expect(screen.getByText("もっと見る（残り 4件）")).toBeInTheDocument()
  })

  it("「もっと見る」クリックで loadMoreMemories が呼ばれる", async () => {
    const loadMoreMemories = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useApp).mockReturnValue({
      ...vi.mocked(useApp)(),
      memories: [mockMemory],
      memoriesTotal: 5,
      loadMoreMemories,
    })
    render(<TimelineScreen />)
    await userEvent.click(screen.getByText("もっと見る（残り 4件）"))
    expect(loadMoreMemories).toHaveBeenCalledOnce()
  })

  it("isLoadingMore=true のときボタンが無効化され「読み込み中...」と表示される", () => {
    vi.mocked(useApp).mockReturnValue({
      ...vi.mocked(useApp)(),
      memories: [mockMemory],
      memoriesTotal: 5,
      isLoadingMore: true,
    })
    render(<TimelineScreen />)
    const btn = screen.getByRole("button", { name: /読み込み中/ })
    expect(btn).toBeDisabled()
    expect(btn).toHaveTextContent("読み込み中...")
  })

  it("records が 0 件で total が 0 のときボタンが非表示", () => {
    mockContext([])
    render(<TimelineScreen />)
    expect(screen.queryByText(/もっと見る/)).not.toBeInTheDocument()
  })
})
