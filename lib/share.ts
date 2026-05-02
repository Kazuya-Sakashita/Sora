function getAppUrl(): string {
  if (typeof window !== "undefined") return window.location.origin
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://app.sora.jp"
}

export async function shareMemory(memoryId: string, title: string): Promise<"shared" | "copied"> {
  const url = `${getAppUrl()}/share/${memoryId}`

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title, url })
      return "shared"
    } catch {
      // user cancelled or share failed — fall through to copy
    }
  }

  await navigator.clipboard.writeText(url)
  return "copied"
}
