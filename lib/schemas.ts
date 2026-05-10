import { z } from "zod"

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 形式で入力してください")

export const PetInputSchema = z.object({
  name: z.string().min(1, "name は必須です").max(50, "name は50文字以内にしてください"),
  nickname: z.string().max(50).optional(),
  species: z.enum(["dog", "cat", "rabbit", "bird", "other"]).optional(),
  breed: z.string().max(50).optional(),
  birthDate: dateStr.optional(),
  broughtAt: dateStr.optional(),
  gender: z.enum(["male", "female", "unknown"]).optional(),
  photoUrl: z.string().url("有効なURLを入力してください").optional(),
  personality: z.string().max(500).optional(),
  favorites: z.string().max(500).optional(),
  personalityVault: z.string().max(1000).optional(),
  status: z.enum(["alive", "rainbow_bridge"]).optional(),
})

export const PetPatchSchema = PetInputSchema.partial().extend({
  publicProfile: z.boolean().optional(),
})

export const MemoryInputSchema = z.object({
  title: z.string().min(1, "title は必須です").max(100, "title は100文字以内にしてください"),
  description: z.string().max(2000).optional(),
  date: dateStr,
  category: z.enum(["trip", "daily", "hospital", "trimming", "anniversary", "other", "note"]).optional(),
  moodTag: z.enum(["happy", "calm", "worried", "fun", "loving"]).optional(),
  photoUrls: z.array(z.string().url()).max(10, "写真は10枚以内にしてください").optional(),
})

export const MemoryPatchSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(2000).optional(),
  date: dateStr.optional(),
  moodTag: z.enum(["happy", "calm", "worried", "fun", "loving"]).nullable().optional(),
})

export const FeelingInputSchema = z.object({
  tag: z.enum(["happy", "calm", "fun", "worried", "loving", "sad", "hard", "numb"]),
  memo: z.string().max(500).optional(),
  date: dateStr,
})

export const ScheduleInputSchema = z.object({
  type: z.enum(["hospital", "trimming", "vaccine", "anniversary", "other"]),
  title: z.string().min(1, "title は必須です").max(100, "title は100文字以内にしてください"),
  date: dateStr,
  memo: z.string().max(500).optional(),
})

export const ChatInputSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(2000, "メッセージは2000文字以内にしてください"),
      })
    )
    .max(20, "会話履歴は20件以内にしてください"),
  tone: z.string().max(50).optional(),
  recentFeelings: z.array(z.string()).max(5).optional(),
})
