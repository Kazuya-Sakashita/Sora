import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { validateLength, validatePhotoUrls } from "@/lib/validate"

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
