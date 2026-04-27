"use client"

export function SkyBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* 朝焼けグラデーション: 桃白 → 薄ピンク → 空青 */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to bottom, #fff5ee 0%, #fdf0f8 50%, #eff4ff 100%)",
        }}
      />

      {/* 頂部: 虹の輝き */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-[420px] opacity-[0.18]"
        style={{
          background:
            "radial-gradient(ellipse at center top, rgba(255,190,150,0.5) 0%, rgba(255,180,210,0.35) 25%, rgba(255,245,180,0.2) 50%, rgba(200,225,255,0.25) 75%, transparent 100%)",
        }}
      />

      {/* 右上: 温かいピーチ光 */}
      <div
        className="absolute top-[8%] right-[8%] w-[320px] h-[320px] rounded-full blur-3xl opacity-25"
        style={{
          background: "radial-gradient(circle, rgba(255,195,155,0.65) 0%, transparent 70%)",
        }}
      />

      {/* 左上: 柔らかいゴールド */}
      <div
        className="absolute top-[15%] left-[3%] w-[220px] h-[220px] rounded-full blur-3xl opacity-20"
        style={{
          background: "radial-gradient(circle, rgba(255,225,150,0.55) 0%, transparent 70%)",
        }}
      />

      {/* 中央左: スカイブルー */}
      <div
        className="absolute top-[40%] left-[0%] w-[200px] h-[200px] rounded-full blur-3xl opacity-[0.18]"
        style={{
          background: "radial-gradient(circle, rgba(180,215,255,0.5) 0%, transparent 70%)",
        }}
      />

      {/* 右下: ラベンダー */}
      <div
        className="absolute bottom-[18%] right-[12%] w-[260px] h-[260px] rounded-full blur-3xl opacity-[0.18]"
        style={{
          background: "radial-gradient(circle, rgba(215,190,255,0.45) 0%, transparent 70%)",
        }}
      />
    </div>
  )
}
