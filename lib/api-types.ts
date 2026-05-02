/**
 * openapi.yaml から自動生成された型の再エクスポート。
 * 手書き型の代わりにこちらを参照する。型を変更するには openapi.yaml を更新して
 * `pnpm gen:types` を再実行すること。
 */
import type { components } from "@/types/api"

// API レスポンス (Prisma 経由) はオプショナルフィールドを null で返すため、
// 生成型の `? T` を `T | null` (required nullable) に変換するユーティリティを使う。
type WithNulls<T> = {
  [K in keyof T]-?: undefined extends T[K] ? NonNullable<T[K]> | null : T[K]
}

export type Pet = WithNulls<components["schemas"]["Pet"]>
export type PetInput = components["schemas"]["PetInput"]
export type PetStatus = components["schemas"]["PetStatus"]
export type PetRole = components["schemas"]["PetRole"]

export type Memory = WithNulls<components["schemas"]["Memory"]>
export type MemoryInput = components["schemas"]["MemoryInput"]
export type MemoryCategory = components["schemas"]["MemoryCategory"]
export type MoodTag = components["schemas"]["MoodTag"]

export type Feeling = WithNulls<components["schemas"]["Feeling"]>
export type FeelingInput = components["schemas"]["FeelingInput"]
export type FeelingTag = components["schemas"]["FeelingTag"]

export type Schedule = WithNulls<components["schemas"]["Schedule"]>
export type ScheduleInput = components["schemas"]["ScheduleInput"]
export type ScheduleType = components["schemas"]["ScheduleType"]

export type PetMember = components["schemas"]["PetMember"]
export type BillingPlan = components["schemas"]["BillingPlan"]
