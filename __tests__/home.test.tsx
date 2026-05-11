import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { HomeScreen } from "@/components/screens/home"
import type { Memory, Pet } from "@/lib/app-context"

// --- モック ---

vi.mock("@/lib/app-context", () => ({ useApp: vi.fn() }))
const mockGetNotificationStatus = vi.fn()
vi.mock("@/lib/push-client", () => ({
  getNotificationStatus: () => mockGetNotificationStatus(),
}))

// fetch モック（billing/plan と daily-question）
vi.stubGlobal("fetch", vi.fn().mockImplementation((url: string) => {
  if (typeof url === "string" && url.includes("/daily-question")) {
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ question: "今日のポチはどうでしたか？" }) })
  }
  return Promise.resolve({ ok: true, json: () => Promise.resolve({ plan: "FREE" }) })
}))
vi.mock("@/lib/date", () => ({
  calcDaysWith: vi.fn((broughtAt: string) => {
    const start = new Date(broughtAt)
    const today = new Date("2026-05-02T10:00:00Z")
    return Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  }),
  getTimeGreeting: vi.fn(() => "おはようございます"),
}))

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
  favorites: null, personalityVault: null,
  status: "alive",
  role: "owner",
  publicProfile: false,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
}

// 今日の記録（2026-05-02）
const memoryToday: Memory = {
  id: "mem-today",
  title: "今日の散歩",
  description: null,
  date: "2026-05-02",
  category: "daily",
  moodTag: null,
  photoUrls: [],
  createdAt: "2026-05-02T09:00:00Z",
}

// 今日の記録（写真付き）
const memoryTodayWithPhoto: Memory = {
  ...memoryToday,
  id: "mem-today-photo",
  photoUrls: ["https://example.com/today.jpg"],
}

// 1年前の今日の記録（2025-05-02）
const memoryLastYear: Memory = {
  id: "mem-last-year",
  title: "去年の今日",
  description: null,
  date: "2025-05-02",
  category: "daily",
  moodTag: null,
  photoUrls: [],
  createdAt: "2025-05-02T09:00:00Z",
}

// 別の日の記録（on this day 対象外）
const memoryOtherDay: Memory = {
  id: "mem-other",
  title: "他の日",
  description: null,
  date: "2026-04-20",
  category: "daily",
  moodTag: null,
  photoUrls: [],
  createdAt: "2026-04-20T09:00:00Z",
}

function mockContext(memories: Memory[], pet: Pet | null = mockPet) {
  vi.mocked(useApp).mockReturnValue({
    currentScreen: "home",
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
    addMemory: vi.fn(),
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

// --- テスト ---

beforeEach(() => {
  mockGetNotificationStatus.mockResolvedValue("unsupported")
  localStorage.clear()
})

describe("HomeScreen — ペットなし", () => {
  beforeEach(() => mockContext([], null))

  it("ペットがない場合はカウンターが表示されない", () => {
    render(<HomeScreen />)
    expect(screen.queryByText(/一緒に/)).not.toBeInTheDocument()
  })
})

describe("HomeScreen — 日数カウンター", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-05-02T10:00:00Z"))
  })
  afterEach(() => vi.useRealTimers())

  it("ペット名が表示される", () => {
    mockContext([])
    render(<HomeScreen />)
    expect(screen.getAllByText("ポチ").length).toBeGreaterThan(0)
  })

  it("「○○と一緒に」テキストが表示される", () => {
    mockContext([])
    render(<HomeScreen />)
    expect(screen.getByText(/ポチと一緒に/)).toBeInTheDocument()
  })

  it("broughtAt がない場合は「一緒にいる日々」が表示される", () => {
    const petNoDate = { ...mockPet, broughtAt: null }
    mockContext([], petNoDate)
    render(<HomeScreen />)
    expect(screen.getByText("一緒にいる日々")).toBeInTheDocument()
  })
})

describe("HomeScreen — 今日の記録状態", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-05-02T10:00:00Z"))
  })
  afterEach(() => vi.useRealTimers())

  it("今日未記録なら「今日の思い出を残す」ボタンが表示される", () => {
    mockContext([memoryLastYear])
    render(<HomeScreen />)
    expect(screen.getByText("今日の思い出を残す")).toBeInTheDocument()
  })

  it("今日記録済みなら「今日も残せました」テキストが表示される", () => {
    mockContext([memoryToday])
    render(<HomeScreen />)
    expect(screen.getByText("今日も残せました")).toBeInTheDocument()
  })

  it("今日記録済みのとき「今日の思い出を残す」が消える", () => {
    mockContext([memoryToday])
    render(<HomeScreen />)
    expect(screen.queryByText("今日の思い出を残す")).not.toBeInTheDocument()
  })

  it("今日の記録に写真があればサムネイルが表示される", () => {
    mockContext([memoryTodayWithPhoto])
    render(<HomeScreen />)
    expect(screen.getByAltText("今日の散歩")).toBeInTheDocument()
  })
})

describe("HomeScreen — n日前の今日カード", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-05-02T10:00:00Z"))
  })
  afterEach(() => vi.useRealTimers())

  it("過去同月同日の記録があると「1年前の今日」ラベルが表示される", () => {
    mockContext([memoryLastYear])
    render(<HomeScreen />)
    expect(screen.getByText("1年前の今日")).toBeInTheDocument()
  })

  it("「1年前の今日」カードに記録タイトルが含まれる", () => {
    mockContext([memoryLastYear])
    render(<HomeScreen />)
    // タイトルは「最近の思い出」にも表示されるため getAllByText を使用
    expect(screen.getAllByText("去年の今日").length).toBeGreaterThan(0)
  })

  it("今日と同じ日付（同年）はカード対象外", () => {
    mockContext([memoryToday])
    render(<HomeScreen />)
    expect(screen.queryByText("1年前の今日")).not.toBeInTheDocument()
  })

  it("別の日付の記録はカードに表示されない", () => {
    mockContext([memoryOtherDay])
    render(<HomeScreen />)
    expect(screen.queryByText(/年前の今日/)).not.toBeInTheDocument()
  })

  it("記録がなければカードが表示されない", () => {
    mockContext([])
    render(<HomeScreen />)
    expect(screen.queryByText(/年前の今日/)).not.toBeInTheDocument()
  })
})

describe("HomeScreen — ナビゲーション", () => {
  beforeEach(() => mockContext([]))

  it("設定ボタンで settings 画面へ遷移する", async () => {
    const setCurrentScreen = vi.fn()
    vi.mocked(useApp).mockReturnValue({
      ...vi.mocked(useApp)(),
      setCurrentScreen,
    })
    render(<HomeScreen />)
    await userEvent.click(screen.getByRole("button", { name: "設定" }))
    expect(setCurrentScreen).toHaveBeenCalledWith("settings")
  })

  it("「気持ちを記録」ボタンで feelings 画面へ遷移する", async () => {
    const setCurrentScreen = vi.fn()
    vi.mocked(useApp).mockReturnValue({
      ...vi.mocked(useApp)(),
      setCurrentScreen,
    })
    render(<HomeScreen />)
    await userEvent.click(screen.getByRole("button", { name: "気持ちを記録" }))
    expect(setCurrentScreen).toHaveBeenCalledWith("feelings")
  })

  it("「予定を見る」ボタンで schedule 画面へ遷移する", async () => {
    const setCurrentScreen = vi.fn()
    vi.mocked(useApp).mockReturnValue({
      ...vi.mocked(useApp)(),
      setCurrentScreen,
    })
    render(<HomeScreen />)
    await userEvent.click(screen.getByRole("button", { name: "予定を見る" }))
    expect(setCurrentScreen).toHaveBeenCalledWith("schedule")
  })
})

describe("HomeScreen — 最近の思い出", () => {
  it("記録があると最近の思い出セクションが表示される", () => {
    mockContext([memoryToday])
    render(<HomeScreen />)
    expect(screen.getByText("最近の思い出")).toBeInTheDocument()
  })

  it("記録がないと最近の思い出セクションが非表示", () => {
    mockContext([])
    render(<HomeScreen />)
    expect(screen.queryByText("最近の思い出")).not.toBeInTheDocument()
  })
})

describe("HomeScreen — 今日の問いかけ（ISSUE-058）", () => {
  // fake timers を使わず動的な今日の日付で制御する
  const todayMemory: Memory = {
    ...memoryToday,
    date: new Date().toISOString().split("T")[0],
  }

  it("alive + 未記録なら問いかけカードが表示される", async () => {
    mockContext([])
    render(<HomeScreen />)
    expect(await screen.findByText("今日のポチはどうでしたか？")).toBeInTheDocument()
  })

  it("alive + 記録済みなら問いかけカードが非表示", async () => {
    mockContext([todayMemory])
    render(<HomeScreen />)
    await new Promise((r) => setTimeout(r, 100))
    expect(screen.queryByText("今日のポチはどうでしたか？")).not.toBeInTheDocument()
  })

  it("rainbow_bridge + 記録済みでも問いかけカードが表示される", async () => {
    const rbPet = { ...mockPet, status: "rainbow_bridge" as const }
    mockContext([todayMemory], rbPet)
    render(<HomeScreen />)
    expect(await screen.findByText("今日のポチはどうでしたか？")).toBeInTheDocument()
  })

  it("rainbow_bridge 時のサブコピーが「今日も残しませんか」", async () => {
    const rbPet = { ...mockPet, status: "rainbow_bridge" as const }
    mockContext([], rbPet)
    render(<HomeScreen />)
    expect(await screen.findByText("今日も残しませんか")).toBeInTheDocument()
  })

  it("alive 未記録時のサブコピーが「タップして記録する」", async () => {
    mockContext([])
    render(<HomeScreen />)
    expect(await screen.findByText("タップして記録する")).toBeInTheDocument()
  })
})

describe("HomeScreen — n日前カードのハイライト遷移（ISSUE-059）", () => {
  // on-this-day は同月同日の過去記録。ローカル日付コンポーネントで構築（UTC変換によるズレを防ぐ）
  const now = new Date()
  const lastYearStr = `${now.getFullYear() - 1}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
  const onThisDayMemory: Memory = {
    ...memoryLastYear,
    date: lastYearStr,
  }

  it("on-this-day カードタップで setPendingHighlightMemoryId が対象IDで呼ばれる", async () => {
    mockContext([onThisDayMemory])
    const setPendingHighlightMemoryId = vi.fn()
    vi.mocked(useApp).mockReturnValue({ ...vi.mocked(useApp)(), setPendingHighlightMemoryId })
    render(<HomeScreen />)
    const label = await screen.findByText("1年前の今日")
    await userEvent.click(label.closest("button")!)
    expect(setPendingHighlightMemoryId).toHaveBeenCalledWith(onThisDayMemory.id)
  })

  it("on-this-day カードタップで timeline に遷移する", async () => {
    mockContext([onThisDayMemory])
    const setCurrentScreen = vi.fn()
    vi.mocked(useApp).mockReturnValue({ ...vi.mocked(useApp)(), setCurrentScreen })
    render(<HomeScreen />)
    const label = await screen.findByText("1年前の今日")
    await userEvent.click(label.closest("button")!)
    expect(setCurrentScreen).toHaveBeenCalledWith("timeline")
  })
})

describe("HomeScreen — Push通知バナー", () => {
  beforeEach(() => mockContext([]))

  it("通知が default の場合にバナーが表示される", async () => {
    mockGetNotificationStatus.mockResolvedValue("default")
    render(<HomeScreen />)
    expect(await screen.findByText("記録を忘れた日に、そっとお知らせします")).toBeInTheDocument()
  })

  it("通知が granted の場合にバナーが表示されない", async () => {
    mockGetNotificationStatus.mockResolvedValue("granted")
    render(<HomeScreen />)
    await new Promise((r) => setTimeout(r, 50))
    expect(screen.queryByText("記録を忘れた日に、そっとお知らせします")).not.toBeInTheDocument()
  })

  it("バナーを閉じると非表示になり localStorage にフラグが立つ", async () => {
    mockGetNotificationStatus.mockResolvedValue("default")
    render(<HomeScreen />)
    const closeBtn = await screen.findByRole("button", { name: "バナーを閉じる" })
    await userEvent.click(closeBtn)
    expect(screen.queryByText("記録を忘れた日に、そっとお知らせします")).not.toBeInTheDocument()
    expect(localStorage.getItem("sora:push-banner-dismissed")).toBe("1")
  })

  it("localStorage にフラグがある場合は default でもバナーが表示されない", async () => {
    localStorage.setItem("sora:push-banner-dismissed", "1")
    mockGetNotificationStatus.mockResolvedValue("default")
    render(<HomeScreen />)
    await new Promise((r) => setTimeout(r, 50))
    expect(screen.queryByText("記録を忘れた日に、そっとお知らせします")).not.toBeInTheDocument()
  })
})

describe("HomeScreen — Sora+誘引バナー (ISSUE-043)", () => {
  beforeEach(() => localStorage.clear())

  it("Free + 5件以上でバナーが表示される", async () => {
    const fiveMemories = Array.from({ length: 5 }, (_, i) => ({
      ...memoryToday,
      id: `mem-${i}`,
      date: `2026-04-0${i + 1}`,
    }))
    mockContext(fiveMemories)
    render(<HomeScreen />)
    expect(await screen.findByText("Sora+ を見る")).toBeInTheDocument()
  })

  it("Free + 4件以下ではバナーが表示されない", async () => {
    const fourMemories = Array.from({ length: 4 }, (_, i) => ({
      ...memoryToday,
      id: `mem-${i}`,
      date: `2026-04-0${i + 1}`,
    }))
    mockContext(fourMemories)
    render(<HomeScreen />)
    await new Promise((r) => setTimeout(r, 50))
    expect(screen.queryByText("Sora+ を見る")).not.toBeInTheDocument()
  })

  it("Plus プランではバナーが表示されない", async () => {
    vi.mocked(global.fetch).mockImplementationOnce((url: unknown) => {
      const u = url as string
      if (typeof u === "string" && u.includes("/daily-question")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ question: "今日は？" }) }) as ReturnType<typeof fetch>
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ plan: "PLUS" }) }) as ReturnType<typeof fetch>
    })
    const fiveMemories = Array.from({ length: 5 }, (_, i) => ({
      ...memoryToday,
      id: `mem-${i}`,
      date: `2026-04-0${i + 1}`,
    }))
    mockContext(fiveMemories)
    render(<HomeScreen />)
    await new Promise((r) => setTimeout(r, 50))
    expect(screen.queryByText("Sora+ を見る")).not.toBeInTheDocument()
  })

  it("「Sora+ を見る」ボタンタップで UpgradeModal が開く", async () => {
    const fiveMemories = Array.from({ length: 5 }, (_, i) => ({
      ...memoryToday,
      id: `mem-${i}`,
      date: `2026-04-0${i + 1}`,
    }))
    mockContext(fiveMemories)
    render(<HomeScreen />)
    const btn = await screen.findByText("Sora+ を見る")
    await userEvent.click(btn)
    expect(screen.getByRole("heading", { name: "Sora+" })).toBeInTheDocument()
  })
})

describe("HomeScreen — 複数ペット共存 (ISSUE-115)", () => {
  const rbPet: Pet = {
    ...mockPet,
    id: "pet-rb",
    name: "ハナ",
    status: "rainbow_bridge",
  }

  beforeEach(() => localStorage.clear())

  it("ペットが1頭の場合はアバター列が表示されない", () => {
    mockContext([], mockPet)
    render(<HomeScreen />)
    expect(screen.queryByRole("button", { name: /に切り替え/ })).not.toBeInTheDocument()
  })

  it("2頭以上の場合にアバター列が表示される", () => {
    const selectPetFn = vi.fn()
    vi.mocked(useApp).mockReturnValue({
      ...vi.mocked(useApp)(),
      pet: mockPet,
      pets: [mockPet, rbPet],
      selectPet: selectPetFn,
      memories: [],
      memoriesTotal: 0,
    } as ReturnType<typeof import("@/lib/app-context").useApp>)
    render(<HomeScreen />)
    expect(screen.getByRole("button", { name: "ハナに切り替え" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "ポチに切り替え" })).toBeInTheDocument()
  })

  it("alive期に先代ペットがいると「大切な記憶」セクションが表示される", () => {
    vi.mocked(useApp).mockReturnValue({
      ...vi.mocked(useApp)(),
      pet: mockPet,
      pets: [mockPet, rbPet],
      selectPet: vi.fn(),
      memories: [],
      memoriesTotal: 0,
    } as ReturnType<typeof import("@/lib/app-context").useApp>)
    render(<HomeScreen />)
    expect(screen.getByText("大切な記憶")).toBeInTheDocument()
    expect(screen.getAllByText("ハナ").length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText("いつもそばにいます")).toBeInTheDocument()
  })

  it("先代ペットが0頭の場合は「大切な記憶」が表示されない", () => {
    mockContext([], mockPet)
    render(<HomeScreen />)
    expect(screen.queryByText("大切な記憶")).not.toBeInTheDocument()
  })

  it("先代ペットカードをタップするとselectPetとタイムライン遷移が呼ばれる", async () => {
    const selectPetFn = vi.fn()
    const setCurrentScreenFn = vi.fn()
    vi.mocked(useApp).mockReturnValue({
      ...vi.mocked(useApp)(),
      pet: mockPet,
      pets: [mockPet, rbPet],
      selectPet: selectPetFn,
      setCurrentScreen: setCurrentScreenFn,
      memories: [],
      memoriesTotal: 0,
    } as ReturnType<typeof import("@/lib/app-context").useApp>)
    render(<HomeScreen />)
    // アバター切り替えボタンではなく「大切な記憶」セクションのカードを対象にする
    const card = screen.getByRole("button", { name: /いつもそばにいます/ })
    await userEvent.click(card)
    expect(selectPetFn).toHaveBeenCalledWith("pet-rb")
    expect(setCurrentScreenFn).toHaveBeenCalledWith("timeline")
  })
})
