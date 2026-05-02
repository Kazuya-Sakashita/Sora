import { ImageResponse } from "next/og"
import type { NextRequest } from "next/server"

export const runtime = "edge"

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const type = searchParams.get("type") ?? "memory"
  const petName = searchParams.get("petName") ?? ""

  if (type === "milestone") {
    const label = searchParams.get("label") ?? "記念日"
    const emoji = searchParams.get("emoji") ?? "🎉"

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #0F0C29 0%, #302B63 50%, #24243E 100%)",
            fontFamily: "sans-serif",
            position: "relative",
          }}
        >
          {/* Stars */}
          {[...Array(24)].map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                top: `${(i * 37 + 11) % 90}%`,
                left: `${(i * 53 + 7) % 95}%`,
                width: i % 3 === 0 ? 4 : 2,
                height: i % 3 === 0 ? 4 : 2,
                borderRadius: "50%",
                background: "white",
                opacity: 0.5 + (i % 5) * 0.1,
              }}
            />
          ))}

          {/* Emoji */}
          <div style={{ fontSize: 120, marginBottom: 24 }}>{emoji}</div>

          {/* Label */}
          <div
            style={{
              fontSize: 56,
              fontWeight: 700,
              color: "#FFFFFF",
              letterSpacing: "0.02em",
              marginBottom: 16,
            }}
          >
            {label}
          </div>

          {/* Pet name */}
          {petName && (
            <div style={{ fontSize: 28, color: "#FFD97D", marginBottom: 8 }}>
              {petName}
            </div>
          )}

          {/* Sora logo */}
          <div
            style={{
              position: "absolute",
              bottom: 36,
              right: 48,
              fontSize: 24,
              fontWeight: 700,
              color: "#A07840",
              letterSpacing: "0.08em",
            }}
          >
            Sora
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    )
  }

  const title = searchParams.get("title") ?? "思い出"
  const date = searchParams.get("date") ?? ""
  const photoUrl = searchParams.get("photoUrl") ?? ""

  const dateLabel = date
    ? new Date(`${date}T00:00:00Z`).toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "Asia/Tokyo",
      })
    : ""

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #F5EEE4 0%, #EDD9B5 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* Photo area */}
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt=""
            style={{ width: "100%", height: 420, objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: 420,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #F0E6D8 0%, #E8D5B0 100%)",
              fontSize: 120,
            }}
          >
            🐾
          </div>
        )}

        {/* Content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "28px 40px 24px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {petName && (
              <div style={{ fontSize: 22, color: "#A07840", fontWeight: 500 }}>
                {petName}との思い出
              </div>
            )}
            <div
              style={{
                fontSize: 34,
                fontWeight: 700,
                color: "#3D2B1F",
                lineHeight: 1.3,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {title}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: 18, color: "#8B6B4A" }}>{dateLabel}</div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "#A07840",
                letterSpacing: "0.05em",
              }}
            >
              Sora
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
