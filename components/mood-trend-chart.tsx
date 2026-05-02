"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { MOOD_TAGS, MOOD_INFO } from "@/lib/mood-trend"
import type { TrendPoint } from "@/lib/mood-trend"

type Props = {
  data: TrendPoint[]
  selectedTag: string | null
}

const TooltipContent = ({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { name: string; value: number }[]
  label?: string
}) => {
  if (!active || !payload?.length) return null
  const nonZero = payload.filter((p) => p.value > 0)
  if (!nonZero.length) return null
  return (
    <div className="rounded-xl bg-white/90 backdrop-blur-sm border border-white/60 shadow-md px-3 py-2 text-xs">
      <p className="text-muted-foreground mb-1">{label}</p>
      {nonZero.map((p) => {
        const info = MOOD_INFO[p.name as keyof typeof MOOD_INFO]
        return (
          <p key={p.name} className="text-foreground/80">
            {info?.emoji} {info?.label} × {p.value}
          </p>
        )
      })}
    </div>
  )
}

export function MoodTrendChart({ data, selectedTag }: Props) {
  const tags = selectedTag ? [selectedTag as (typeof MOOD_TAGS)[number]] : [...MOOD_TAGS]

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart
        data={data}
        margin={{ top: 4, right: 4, left: -28, bottom: 0 }}
        barCategoryGap="20%"
      >
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: "#9CA3AF" }}
          tickLine={false}
          axisLine={false}
          interval={4}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 10, fill: "#9CA3AF" }}
          tickLine={false}
          axisLine={false}
          domain={[0, "auto"]}
          width={28}
        />
        <Tooltip content={<TooltipContent />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
        {tags.map((tag) => (
          <Bar
            key={tag}
            dataKey={tag}
            stackId="stack"
            fill={MOOD_INFO[tag].color}
            radius={tag === tags[tags.length - 1] ? [3, 3, 0, 0] : undefined}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
