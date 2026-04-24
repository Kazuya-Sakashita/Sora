import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

type GlassCardProps = {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function GlassCard({ children, className, onClick }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-3xl p-6",
        "bg-white/60 backdrop-blur-xl",
        "border border-white/40",
        "shadow-[0_8px_32px_rgba(0,0,0,0.04)]",
        onClick && "cursor-pointer active:scale-[0.98] transition-transform",
        className
      )}
    >
      {children}
    </div>
  )
}
