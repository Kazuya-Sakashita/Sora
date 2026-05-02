import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { validateLength, validatePhotoUrls, parseBody } from "@/lib/validate"
import { PetInputSchema, MemoryInputSchema, FeelingInputSchema, ScheduleInputSchema, PetPatchSchema } from "@/lib/schemas"

describe("validateLength", () => {
  it("値が制限以内なら null を返す", () => {
    expect(validateLength("短いタイトル", "title", 100)).toBeNull()
  })

  it("値がちょうど制限文字数なら null を返す", () => {
    expect(validateLength("a".repeat(100), "title", 100)).toBeNull()
  })

  it("値が制限を超えたらエラーを返す", () => {
    const error = validateLength("a".repeat(101), "title", 100)
    expect(error).not.toBeNull()
    expect(error?.field).toBe("title")
    expect(error?.message).toContain("100文字以内")
  })

  it("undefined なら null を返す", () => {
    expect(validateLength(undefined, "title", 100)).toBeNull()
  })

  it("null なら null を返す", () => {
    expect(validateLength(null, "title", 100)).toBeNull()
  })

  it("空文字なら null を返す", () => {
    expect(validateLength("", "title", 100)).toBeNull()
  })

  it("フィールド名がエラーメッセージに含まれる", () => {
    const error = validateLength("a".repeat(51), "description", 50)
    expect(error?.field).toBe("description")
    expect(error?.message).toContain("description")
  })
})

describe("validatePhotoUrls — SUPABASE_URL なし", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "")
  })
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("undefined なら null を返す", () => {
    expect(validatePhotoUrls(undefined)).toBeNull()
  })

  it("null なら null を返す", () => {
    expect(validatePhotoUrls(null)).toBeNull()
  })

  it("配列でない場合はエラーを返す", () => {
    const error = validatePhotoUrls("not-an-array")
    expect(error?.field).toBe("photoUrls")
  })

  it("空配列なら null を返す", () => {
    expect(validatePhotoUrls([])).toBeNull()
  })

  it("10枚を超えるとエラーを返す", () => {
    const urls = Array(11).fill("https://example.com/photo.jpg")
    const error = validatePhotoUrls(urls)
    expect(error?.field).toBe("photoUrls")
    expect(error?.message).toContain("10枚以内")
  })

  it("ちょうど10枚なら null を返す（SUPABASE_URL 未設定時）", () => {
    const urls = Array(10).fill("https://example.com/photo.jpg")
    expect(validatePhotoUrls(urls)).toBeNull()
  })
})

describe("validatePhotoUrls — SUPABASE_URL あり", () => {
  const STORAGE_HOST = "https://xxxx.supabase.co"

  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", STORAGE_HOST)
  })
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("自社 Storage URL なら null を返す", () => {
    const urls = [`${STORAGE_HOST}/storage/v1/object/public/photos/image.jpg`]
    expect(validatePhotoUrls(urls)).toBeNull()
  })

  it("外部 URL が含まれるとエラーを返す", () => {
    const urls = ["https://malicious.example.com/evil.jpg"]
    const error = validatePhotoUrls(urls)
    expect(error?.field).toBe("photoUrls")
    expect(error?.message).toContain("無効な写真URL")
  })

  it("string でない要素があるとエラーを返す", () => {
    const error = validatePhotoUrls([123])
    expect(error?.field).toBe("photoUrls")
  })

  it("混在（正常＋外部）でもエラーを返す", () => {
    const urls = [
      `${STORAGE_HOST}/storage/v1/object/public/photos/ok.jpg`,
      "https://external.com/bad.jpg",
    ]
    expect(validatePhotoUrls(urls)).not.toBeNull()
  })
})

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("parseBody", () => {
  it("正しいボディなら data を返す", async () => {
    const result = await parseBody(PetInputSchema, makeRequest({ name: "タロウ" }))
    expect(result.data?.name).toBe("タロウ")
    expect(result.error).toBeUndefined()
  })

  it("不正なボディなら error Response を返す", async () => {
    const result = await parseBody(PetInputSchema, makeRequest({ name: "" }))
    expect(result.error).toBeDefined()
    expect(result.data).toBeUndefined()
  })

  it("JSON でないボディなら error Response を返す", async () => {
    const req = new Request("http://localhost/api/test", {
      method: "POST",
      body: "not-json",
    })
    const result = await parseBody(PetInputSchema, req)
    expect(result.error).toBeDefined()
  })
})

describe("PetInputSchema", () => {
  it("name のみで有効", () => {
    expect(PetInputSchema.safeParse({ name: "タロウ" }).success).toBe(true)
  })

  it("name が空文字でエラー", () => {
    expect(PetInputSchema.safeParse({ name: "" }).success).toBe(false)
  })

  it("name が51文字以上でエラー", () => {
    expect(PetInputSchema.safeParse({ name: "a".repeat(51) }).success).toBe(false)
  })

  it("species が不正値でエラー", () => {
    expect(PetInputSchema.safeParse({ name: "タロウ", species: "fish" }).success).toBe(false)
  })

  it("gender が不正値でエラー", () => {
    expect(PetInputSchema.safeParse({ name: "タロウ", gender: "robot" }).success).toBe(false)
  })

  it("birthDate が不正フォーマットでエラー", () => {
    expect(PetInputSchema.safeParse({ name: "タロウ", birthDate: "2024/01/01" }).success).toBe(false)
  })

  it("全フィールドが有効", () => {
    const result = PetInputSchema.safeParse({
      name: "タロウ", species: "dog", breed: "柴犬",
      birthDate: "2020-01-15", broughtAt: "2020-02-01",
      gender: "male", status: "alive",
    })
    expect(result.success).toBe(true)
  })
})

describe("PetPatchSchema", () => {
  it("空オブジェクトでも有効（全フィールドオプショナル）", () => {
    expect(PetPatchSchema.safeParse({}).success).toBe(true)
  })

  it("status のみのパッチが有効", () => {
    expect(PetPatchSchema.safeParse({ status: "rainbow_bridge" }).success).toBe(true)
  })
})

describe("MemoryInputSchema", () => {
  it("title と date のみで有効", () => {
    expect(MemoryInputSchema.safeParse({ title: "散歩", date: "2026-05-01" }).success).toBe(true)
  })

  it("title が空でエラー", () => {
    expect(MemoryInputSchema.safeParse({ title: "", date: "2026-05-01" }).success).toBe(false)
  })

  it("date が必須", () => {
    expect(MemoryInputSchema.safeParse({ title: "散歩" }).success).toBe(false)
  })

  it("moodTag が不正値でエラー", () => {
    expect(MemoryInputSchema.safeParse({ title: "散歩", date: "2026-05-01", moodTag: "sad" }).success).toBe(false)
  })

  it("photoUrls が11枚でエラー", () => {
    const urls = Array(11).fill("https://example.com/photo.jpg")
    expect(MemoryInputSchema.safeParse({ title: "散歩", date: "2026-05-01", photoUrls: urls }).success).toBe(false)
  })
})

describe("FeelingInputSchema", () => {
  it("正しい tag と date で有効", () => {
    expect(FeelingInputSchema.safeParse({ tag: "happy", date: "2026-05-01" }).success).toBe(true)
  })

  it("tag が不正値でエラー", () => {
    expect(FeelingInputSchema.safeParse({ tag: "angry", date: "2026-05-01" }).success).toBe(false)
  })

  it("tag が必須", () => {
    expect(FeelingInputSchema.safeParse({ date: "2026-05-01" }).success).toBe(false)
  })
})

describe("ScheduleInputSchema", () => {
  it("有効なスケジュール", () => {
    expect(ScheduleInputSchema.safeParse({ type: "hospital", title: "健康診断", date: "2026-06-01" }).success).toBe(true)
  })

  it("type が不正値でエラー", () => {
    expect(ScheduleInputSchema.safeParse({ type: "unknown", title: "健康診断", date: "2026-06-01" }).success).toBe(false)
  })

  it("title が必須", () => {
    expect(ScheduleInputSchema.safeParse({ type: "hospital", date: "2026-06-01" }).success).toBe(false)
  })
})
