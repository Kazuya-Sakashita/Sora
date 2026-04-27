"use client"

export function SkyBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* メイングラデーション: Sky Blue → Twilight Blue → Warm Sand */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, #E8F4FF 0%, #D8E4F0 40%, #F0E6D8 100%)",
        }}
      />

      {/* 頂部: 柔らかな光の輪 */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-[380px] opacity-[0.15]"
        style={{
          background:
            "radial-gradient(ellipse at center top, rgba(237,217,181,0.6) 0%, rgba(216,228,240,0.4) 40%, transparent 75%)",
        }}
      />

      {/* 右上: Amber Light の温かい光 */}
      <div
        className="absolute top-[8%] right-[8%] w-[300px] h-[300px] rounded-full blur-3xl opacity-20"
        style={{
          background: "radial-gradient(circle, rgba(237,217,181,0.7) 0%, transparent 70%)",
        }}
      />

      {/* 左上: Warm Sand の光 */}
      <div
        className="absolute top-[12%] left-[5%] w-[200px] h-[200px] rounded-full blur-3xl opacity-[0.18]"
        style={{
          background: "radial-gradient(circle, rgba(240,230,216,0.6) 0%, transparent 70%)",
        }}
      />

      {/* 中央左: Twilight Blue */}
      <div
        className="absolute top-[42%] left-[0%] w-[180px] h-[180px] rounded-full blur-3xl opacity-[0.20]"
        style={{
          background: "radial-gradient(circle, rgba(216,228,240,0.6) 0%, transparent 70%)",
        }}
      />

      {/* 右下: Sage Mist */}
      <div
        className="absolute bottom-[18%] right-[10%] w-[240px] h-[240px] rounded-full blur-3xl opacity-[0.18]"
        style={{
          background: "radial-gradient(circle, rgba(229,237,232,0.6) 0%, transparent 70%)",
        }}
      />
    </div>
  )
}
