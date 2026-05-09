import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: vi.fn().mockResolvedValue({ id: "mock-id" }) },
  })),
}))

const makeRequest = (body: unknown) =>
  new Request("http://localhost/api/contact/clinic", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

describe("POST /api/contact/clinic", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
  })

  it("有効なデータで200を返す", async () => {
    const { POST } = await import("@/app/api/contact/clinic/route")
    const res = await POST(makeRequest({
      name: "山田太郎",
      clinicName: "さくら動物病院",
      email: "test@example.com",
      message: "パートナーシップについて教えてください",
    }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
  })

  it("必須項目が欠けていると400を返す", async () => {
    const { POST } = await import("@/app/api/contact/clinic/route")
    const res = await POST(makeRequest({
      name: "山田太郎",
      email: "test@example.com",
      // clinicName missing
      message: "お問い合わせです",
    }))
    expect(res.status).toBe(400)
  })

  it("不正なメールアドレスで400を返す", async () => {
    const { POST } = await import("@/app/api/contact/clinic/route")
    const res = await POST(makeRequest({
      name: "山田太郎",
      clinicName: "さくら動物病院",
      email: "not-an-email",
      message: "お問い合わせです",
    }))
    expect(res.status).toBe(400)
  })

  it("不正なJSONで400を返す", async () => {
    const { POST } = await import("@/app/api/contact/clinic/route")
    const req = new Request("http://localhost/api/contact/clinic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
