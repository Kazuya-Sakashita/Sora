import { z } from "zod"
import { problem } from "@/lib/auth"

export type ValidationError = { field: string; message: string }

export async function parseBody<T>(
  schema: z.ZodType<T>,
  request: Request
): Promise<{ data: T; error?: never } | { data?: never; error: ReturnType<typeof problem> }> {
  const raw = await request.json().catch(() => null)
  const result = schema.safeParse(raw)
  if (!result.success) {
    const detail = result.error.errors
      .map((e) => (e.path.length ? `${e.path.join(".")}: ${e.message}` : e.message))
      .join(", ")
    return { error: problem(400, "Bad Request", detail) }
  }
  return { data: result.data }
}

export function validateLength(
  value: string | undefined | null,
  field: string,
  max: number
): ValidationError | null {
  if (value && value.length > max) {
    return { field, message: `${field} は${max}文字以内にしてください` }
  }
  return null
}

export function validatePhotoUrls(urls: unknown): ValidationError | null {
  if (!urls) return null
  if (!Array.isArray(urls)) return { field: "photoUrls", message: "photoUrls は配列である必要があります" }
  if (urls.length > 10) return { field: "photoUrls", message: "写真は10枚以内にしてください" }

  const storageHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!storageHost) return null

  for (const url of urls) {
    if (typeof url !== "string" || !url.startsWith(storageHost)) {
      return { field: "photoUrls", message: "無効な写真URLが含まれています" }
    }
  }
  return null
}
