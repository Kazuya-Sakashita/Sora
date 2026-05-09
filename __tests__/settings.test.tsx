import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { SettingsScreen } from "@/components/screens/settings"

// --- モック ---

vi.mock("@/lib/app-context", () => ({ useApp: vi.fn() }))
vi.mock("@/lib/supabase-browser", () => ({
  createSupabaseBrowserClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { email: "test@example.com" } },
      }),
      signOut: vi.fn().mockResolvedValue({}),
    },
  })),
}))

const mockGetNotificationStatus = vi.fn()
const mockIsCurrentlySubscribed = vi.fn()
const mockSubscribePush = vi.fn()
const mockSavePushSubscription = vi.fn()
const mockUnsubscribePush = vi.fn()
const mockDeletePushSubscription = vi.fn()

// /api/billing/plan fetch をモック
vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
  json: () => Promise.resolve({ plan: "FREE" }),
  ok: true,
} as Response))

vi.mock("@/lib/push-client", () => ({
  getNotificationStatus: () => mockGetNotificationStatus(),
  isCurrentlySubscribed: () => mockIsCurrentlySubscribed(),
  subscribePush: () => mockSubscribePush(),
  savePushSubscription: (sub: unknown) => mockSavePushSubscription(sub),
  unsubscribePush: () => mockUnsubscribePush(),
  deletePushSubscription: (endpoint: string) => mockDeletePushSubscription(endpoint),
}))

import { useApp } from "@/lib/app-context"

function mockAppContext() {
  vi.mocked(useApp).mockReturnValue({
    currentScreen: "settings",
    setCurrentScreen: vi.fn(),
    pet: null,
    memories: [],
    memoriesTotal: 0,
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

describe("SettingsScreen — 基本表示", () => {
  beforeEach(() => {
    mockAppContext()
    mockGetNotificationStatus.mockResolvedValue("default")
    mockIsCurrentlySubscribed.mockResolvedValue(false)
  })

  it("ページタイトルが表示される", () => {
    render(<SettingsScreen />)
    expect(screen.getByText("設定")).toBeInTheDocument()
  })

  it("ログインユーザーのメールが表示される", async () => {
    render(<SettingsScreen />)
    expect(await screen.findByText("test@example.com")).toBeInTheDocument()
  })

  it("会話の雰囲気セクションが表示される", () => {
    render(<SettingsScreen />)
    expect(screen.getByText("会話の雰囲気")).toBeInTheDocument()
  })

  it("ログアウトボタンが表示される", () => {
    render(<SettingsScreen />)
    expect(screen.getByText("ログアウト")).toBeInTheDocument()
  })
})

describe("SettingsScreen — 通知トグル", () => {
  beforeEach(() => mockAppContext())

  it("通知が default 状態なら通知トグルが表示される", async () => {
    mockGetNotificationStatus.mockResolvedValue("default")
    mockIsCurrentlySubscribed.mockResolvedValue(false)
    render(<SettingsScreen />)
    expect(await screen.findByText("毎朝のリマインダー")).toBeInTheDocument()
  })

  it("通知が granted・購読済みなら「毎朝8時にお知らせします」と表示される", async () => {
    mockGetNotificationStatus.mockResolvedValue("granted")
    mockIsCurrentlySubscribed.mockResolvedValue(true)
    render(<SettingsScreen />)
    expect(await screen.findByText("毎朝8時にお知らせします")).toBeInTheDocument()
  })

  it("通知が denied ならブロックメッセージが表示される", async () => {
    mockGetNotificationStatus.mockResolvedValue("denied")
    mockIsCurrentlySubscribed.mockResolvedValue(false)
    render(<SettingsScreen />)
    expect(await screen.findByText(/ブロックされています/)).toBeInTheDocument()
  })

  it("通知が denied のときトグルボタンが無効", async () => {
    mockGetNotificationStatus.mockResolvedValue("denied")
    mockIsCurrentlySubscribed.mockResolvedValue(false)
    render(<SettingsScreen />)
    const toggle = await screen.findByRole("button", { name: "通知トグル" })
    expect(toggle).toBeDisabled()
  })

  it("通知が unsupported なら通知セクションが非表示", async () => {
    mockGetNotificationStatus.mockResolvedValue("unsupported")
    mockIsCurrentlySubscribed.mockResolvedValue(false)
    render(<SettingsScreen />)
    await waitFor(() => {
      expect(screen.queryByText("毎朝のリマインダー")).not.toBeInTheDocument()
    })
  })

  it("未購読状態でトグルを押すと subscribePush が呼ばれる", async () => {
    mockGetNotificationStatus.mockResolvedValue("default")
    mockIsCurrentlySubscribed.mockResolvedValue(false)
    const mockSub = {
      endpoint: "https://push.example.com/sub",
      toJSON: () => ({ keys: { p256dh: "p256dh", auth: "auth" } }),
    }
    mockSubscribePush.mockResolvedValue(mockSub)
    mockSavePushSubscription.mockResolvedValue(undefined)

    render(<SettingsScreen />)
    const toggle = await screen.findByRole("button", { name: "通知トグル" })
    await userEvent.click(toggle)

    expect(mockSubscribePush).toHaveBeenCalled()
  })

  it("購読済み状態でトグルを押すと unsubscribePush が呼ばれる", async () => {
    mockGetNotificationStatus.mockResolvedValue("granted")
    mockIsCurrentlySubscribed.mockResolvedValue(true)
    const mockSub = {
      endpoint: "https://push.example.com/sub",
      unsubscribe: vi.fn().mockResolvedValue(true),
    }
    // navigator.serviceWorker.getRegistration をモック
    Object.defineProperty(global.navigator, "serviceWorker", {
      value: {
        getRegistration: vi.fn().mockResolvedValue({
          pushManager: {
            getSubscription: vi.fn().mockResolvedValue(mockSub),
          },
        }),
      },
      writable: true,
    })
    mockDeletePushSubscription.mockResolvedValue(undefined)
    mockUnsubscribePush.mockResolvedValue(undefined)

    render(<SettingsScreen />)
    const toggle = await screen.findByRole("button", { name: "通知トグル" })
    await userEvent.click(toggle)

    expect(mockDeletePushSubscription).toHaveBeenCalledWith(mockSub.endpoint)
  })
})

describe("SettingsScreen — 会話トーン選択", () => {
  beforeEach(() => {
    mockAppContext()
    mockGetNotificationStatus.mockResolvedValue("default")
    mockIsCurrentlySubscribed.mockResolvedValue(false)
  })

  it("現在のトーンが選択状態で表示される", () => {
    render(<SettingsScreen />)
    const selected = screen.getByText("やさしく寄り添う").closest("button")
    expect(selected?.className).toContain("border-primary")
  })

  it("別のトーンを選択すると setConversationTone が呼ばれる", async () => {
    const setConversationTone = vi.fn()
    vi.mocked(useApp).mockReturnValue({
      ...vi.mocked(useApp)(),
      setConversationTone,
    })
    render(<SettingsScreen />)
    await userEvent.click(screen.getByText("思い出を一緒に振り返る"))
    expect(setConversationTone).toHaveBeenCalledWith("思い出を一緒に振り返る")
  })
})

describe("SettingsScreen — 月次AIメモリーレター", () => {
  beforeEach(() => {
    mockAppContext()
    mockGetNotificationStatus.mockResolvedValue("default")
    mockIsCurrentlySubscribed.mockResolvedValue(false)
  })

  it("Freeプランでは月次レターのティーザーと誘導ボタンが表示される", async () => {
    render(<SettingsScreen />)
    expect(await screen.findByText("Sora+ でレターを受け取る")).toBeInTheDocument()
  })

  it("Plusプランではレターアーカイブセクションが表示される", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation((url: string) => {
      if (url === "/api/billing/plan") {
        return Promise.resolve({ json: () => Promise.resolve({ plan: "PLUS" }), ok: true })
      }
      if (typeof url === "string" && url.includes("/letters")) {
        return Promise.resolve({ json: () => Promise.resolve({ letters: [] }), ok: true })
      }
      return Promise.resolve({ json: () => Promise.resolve({}), ok: true })
    }))

    render(<SettingsScreen />)
    expect(await screen.findByText("まだレターがありません")).toBeInTheDocument()
  })

  it("Plusプランで過去レターが存在する場合は一覧に表示される", async () => {
    vi.mocked(useApp).mockReturnValue({
      ...vi.mocked(useApp)(),
      pet: {
        id: "pet-1", name: "ポチ", nickname: null, species: null, breed: null,
        birthDate: null, broughtAt: "2021-01-01", gender: null, photoUrl: null,
        personality: null, favorites: null, status: "alive", role: "owner", publicProfile: false,
        createdAt: "2021-01-01T00:00:00Z", updatedAt: "2026-04-01T00:00:00Z",
      },
    })

    vi.stubGlobal("fetch", vi.fn().mockImplementation((url: string) => {
      if (url === "/api/billing/plan") {
        return Promise.resolve({ json: () => Promise.resolve({ plan: "PLUS" }), ok: true })
      }
      if (typeof url === "string" && url.includes("/letters")) {
        return Promise.resolve({
          json: () => Promise.resolve({
            letters: [{ id: "l1", year: 2026, month: 4, generatedAt: "2026-04-30T14:00:00Z" }],
          }),
          ok: true,
        })
      }
      return Promise.resolve({ json: () => Promise.resolve({}), ok: true })
    }))

    render(<SettingsScreen />)
    expect(await screen.findByText("2026年4月のレター")).toBeInTheDocument()
  })
})
