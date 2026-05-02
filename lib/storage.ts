import { createSupabaseBrowserClient } from "./supabase-browser"

const BUCKET = "photos"
const MAX_SIZE_BYTES = 10 * 1024 * 1024

export async function uploadPhoto(file: File, folder: string): Promise<string> {
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("写真は10MB以内にしてください")
  }

  const supabase = createSupabaseBrowserClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("ログインが必要です")

  const ext = file.name.split(".").pop() ?? "jpg"
  const path = `${user.id}/${folder}/${Date.now()}.${ext}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file)
  if (error) throw new Error("写真のアップロードに失敗しました")

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}
