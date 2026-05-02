"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"]

type Props = {
  year: number
  month: number // 0-indexed
  recordedDates: Set<string>
  hasPhotoDates: Set<string>
  onDayClick: (dateStr: string) => void
  onPrevMonth: () => void
  onNextMonth: () => void
}

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

export function MemoryCalendar({
  year,
  month,
  recordedDates,
  hasPhotoDates,
  onDayClick,
  onPrevMonth,
  onNextMonth,
}: Props) {
  const firstDow = new Date(year, month, 1).getDay() // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`

  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  // pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null)

  const monthLabel = `${year}年${month + 1}月`

  return (
    <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)] p-4 space-y-3">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          aria-label="前の月"
          onClick={onPrevMonth}
          className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center text-muted-foreground hover:bg-white/80 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-medium text-foreground/80">{monthLabel}</span>
        <button
          aria-label="次の月"
          onClick={onNextMonth}
          className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center text-muted-foreground hover:bg-white/80 transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 text-center">
        {DAY_LABELS.map((d, i) => (
          <span
            key={d}
            className={`text-[10px] font-medium pb-1 ${
              i === 0 ? "text-red-400/70" : i === 6 ? "text-blue-400/70" : "text-muted-foreground/60"
            }`}
          >
            {d}
          </span>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} />
          const dateKey = toDateKey(year, month, day)
          const hasRecord = recordedDates.has(dateKey)
          const hasPhoto = hasPhotoDates.has(dateKey)
          const isToday = dateKey === todayKey
          const dow = (firstDow + day - 1) % 7

          return (
            <button
              key={dateKey}
              aria-label={`${year}年${month + 1}月${day}日`}
              onClick={() => hasRecord && onDayClick(dateKey)}
              disabled={!hasRecord}
              className={`relative flex flex-col items-center justify-center h-9 rounded-xl transition-colors ${
                hasRecord
                  ? "hover:bg-primary/10 active:scale-95 cursor-pointer"
                  : "cursor-default"
              } ${isToday ? "bg-primary/10" : ""}`}
            >
              <span
                className={`text-xs leading-none ${
                  isToday
                    ? "font-bold text-primary/90"
                    : dow === 0
                    ? "text-red-400/70"
                    : dow === 6
                    ? "text-blue-400/70"
                    : "text-foreground/70"
                }`}
              >
                {day}
              </span>
              {/* Record dot */}
              {hasRecord && (
                <span
                  className={`mt-0.5 rounded-full ${
                    hasPhoto
                      ? "w-1.5 h-1.5 bg-primary/70"
                      : "w-1 h-1 bg-primary/40"
                  }`}
                />
              )}
            </button>
          )
        })}
      </div>

      <p className="text-center text-[10px] text-muted-foreground/50">
        記録のある日をタップするとジャンプします
      </p>
    </div>
  )
}
