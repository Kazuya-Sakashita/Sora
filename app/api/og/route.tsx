import { ImageResponse } from "next/og"
import type { NextRequest } from "next/server"

export const runtime = "edge"

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const title = searchParams.get("title") ?? "思い出"
  const date = searchParams.get("date") ?? ""
  const petName = searchParams.get("petName") ?? ""
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
