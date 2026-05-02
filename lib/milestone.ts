export type MilestoneType = "days" | "birthday" | "anniversary"

export type Milestone = {
  type: MilestoneType
  label: string    // 表示タイトル
  emoji: string
  message: string  // カード本文
  pushBody: string // プッシュ通知本文
}

const DAY_MILESTONES = [100, 365, 1000] as const

function isSameMonthDay(a: Date, b: Date): boolean {
  return a.getUTCMonth() === b.getUTCMonth() && a.getUTCDate() === b.getUTCDate()
}

function utcToday(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

/**
 * 今日が節目かどうかを判定し、該当する Milestone を返す。
 * 複数該当する場合は最初の1件のみ返す。
 */
export function getTodayMilestone(pet: {
  name: string
  broughtAt: string | null
  birthDate: string | null
}): Milestone | null {
  const today = utcToday()

  // 一緒に過ごした日数の節目
  if (pet.broughtAt) {
    const start = new Date(`${pet.broughtAt}T00:00:00Z`)
    const diffDays =
      Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

    for (const milestone of DAY_MILESTONES) {
      if (diffDays === milestone) {
        const label = milestone === 365 ? "1年" : `${milestone}日`
        return {
          type: "days",
          label: `${pet.name}と${label}`,
          emoji: milestone === 1000 ? "🌟" : milestone === 365 ? "🎊" : "🎉",
          message: `${pet.name}と一緒に過ごして、今日で${label}になりました。`,
          pushBody: `${pet.name}との${label}記念日です！今日も残しましょう`,
        }
      }
    }
  }

  // 誕生日
  if (pet.birthDate) {
    const birth = new Date(`${pet.birthDate}T00:00:00Z`)
    if (isSameMonthDay(birth, today) && birth.getUTCFullYear() !== today.getUTCFullYear()) {
      const age = today.getUTCFullYear() - birth.getUTCFullYear()
      return {
        type: "birthday",
        label: `${pet.name}の誕生日`,
        emoji: "🎂",
        message: `${pet.name}、${age}歳のお誕生日おめでとう！`,
        pushBody: `今日は${pet.name}の${age}歳の誕生日です🎂`,
      }
    }
  }

  // お迎え記念日（broughtAt の月日が今日と同じ・年が異なる）
  if (pet.broughtAt) {
    const brought = new Date(`${pet.broughtAt}T00:00:00Z`)
    if (isSameMonthDay(brought, today) && brought.getUTCFullYear() !== today.getUTCFullYear()) {
      const years = today.getUTCFullYear() - brought.getUTCFullYear()
      return {
        type: "anniversary",
        label: `${pet.name}のお迎え記念日`,
        emoji: "🏠",
        message: `${pet.name}を迎えて${years}年が経ちました。たくさんの思い出をありがとう。`,
        pushBody: `${pet.name}のお迎えから${years}周年です🏠 今日の思い出も残しませんか`,
      }
    }
  }

  return null
}
