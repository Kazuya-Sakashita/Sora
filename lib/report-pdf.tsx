import path from "path"
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer"
import type { ReportData } from "@/lib/report"

// Noto Sans JP — japanese-400 covers all unicode ranges needed
Font.register({
  family: "NotoSansJP",
  src: path.join(
    process.cwd(),
    "node_modules/@fontsource/noto-sans-jp/files/noto-sans-jp-japanese-400-normal.woff2"
  ),
})

const WARM = "#A07840"
const WARM_LIGHT = "#F5EEE4"
const MUTED = "#9B8878"
const DARK = "#3D2B1F"

const s = StyleSheet.create({
  page: { fontFamily: "NotoSansJP", backgroundColor: "#FDFAF6", padding: 48 },
  // Cover
  coverBrand: { fontSize: 13, color: WARM, letterSpacing: 2, marginBottom: 32 },
  coverTitle: { fontSize: 28, fontWeight: 700, color: DARK, lineHeight: 1.4 },
  coverSub: { fontSize: 13, color: MUTED, marginTop: 8 },
  coverPhoto: { width: 100, height: 100, borderRadius: 50, objectFit: "cover", marginBottom: 24 },
  coverStats: { flexDirection: "row", gap: 24, marginTop: 32 },
  coverStatBox: { alignItems: "center" },
  coverStatNum: { fontSize: 28, fontWeight: 700, color: WARM },
  coverStatLabel: { fontSize: 10, color: MUTED, marginTop: 2 },
  divider: { height: 1, backgroundColor: "#E8DDD0", marginVertical: 24 },
  // Monthly grid
  sectionTitle: { fontSize: 11, color: MUTED, letterSpacing: 1, marginBottom: 16 },
  monthGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  monthCell: { width: "22%", backgroundColor: WARM_LIGHT, borderRadius: 8, padding: 8 },
  monthLabel: { fontSize: 10, fontWeight: 700, color: DARK },
  monthCount: { fontSize: 18, fontWeight: 700, color: WARM, marginTop: 4 },
  monthCountLabel: { fontSize: 9, color: MUTED },
  monthMood: { fontSize: 9, color: MUTED, marginTop: 4 },
  monthEmpty: { opacity: 0.4 },
  // Featured
  memoryRow: { flexDirection: "row", gap: 12, marginBottom: 16, alignItems: "flex-start" },
  memoryPhoto: { width: 72, height: 72, borderRadius: 8, objectFit: "cover" },
  memoryPhotoPlaceholder: { width: 72, height: 72, borderRadius: 8, backgroundColor: WARM_LIGHT, alignItems: "center", justifyContent: "center" },
  memoryTitle: { fontSize: 12, color: DARK, fontWeight: 700, lineHeight: 1.4, flex: 1 },
  memoryDate: { fontSize: 10, color: MUTED, marginTop: 4 },
})

function CoverPage({ data }: { data: ReportData }) {
  const hasRecords = data.totalMemories > 0
  return (
    <Page size="A4" style={s.page}>
      {data.petPhotoUrl && (
        <Image src={data.petPhotoUrl} style={s.coverPhoto} />
      )}
      <Text style={s.coverBrand}>Sora</Text>
      <Text style={s.coverTitle}>{data.petName}との{data.year}年</Text>
      <Text style={s.coverSub}>思い出レポート</Text>

      {hasRecords && (
        <View style={s.coverStats}>
          <View style={s.coverStatBox}>
            <Text style={s.coverStatNum}>{data.totalMemories}</Text>
            <Text style={s.coverStatLabel}>件の思い出</Text>
          </View>
          <View style={s.coverStatBox}>
            <Text style={s.coverStatNum}>{data.totalPhotos}</Text>
            <Text style={s.coverStatLabel}>枚の写真</Text>
          </View>
        </View>
      )}
    </Page>
  )
}

function MonthlySummaryPage({ data }: { data: ReportData }) {
  const activeMonths = data.months.filter((m) => m.memoryCount > 0)
  return (
    <Page size="A4" style={s.page}>
      <Text style={s.sectionTitle}>月別サマリー</Text>
      <View style={s.monthGrid}>
        {data.months.map((m) => (
          <View key={m.month} style={m.memoryCount === 0 ? [s.monthCell, s.monthEmpty] : s.monthCell}>
            <Text style={s.monthLabel}>{m.label}</Text>
            <Text style={s.monthCount}>{m.memoryCount}</Text>
            <Text style={s.monthCountLabel}>件</Text>
            {m.topMoodLabel && <Text style={s.monthMood}>{m.topMoodLabel}</Text>}
          </View>
        ))}
      </View>

      {activeMonths.length > 0 && <View style={s.divider} />}

      <Text style={[s.sectionTitle, { marginTop: 8 }]}>思い出ピックアップ</Text>
      {data.featuredMemories.length === 0 ? (
        <Text style={{ fontSize: 11, color: MUTED }}>写真付きの思い出がありません</Text>
      ) : (
        data.featuredMemories.map((mem, i) => (
          <View key={i} style={s.memoryRow}>
            {mem.photoUrl ? (
              <Image src={mem.photoUrl} style={s.memoryPhoto} />
            ) : (
              <View style={s.memoryPhotoPlaceholder} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={s.memoryTitle}>{mem.title}</Text>
              <Text style={s.memoryDate}>{mem.date}</Text>
            </View>
          </View>
        ))
      )}
    </Page>
  )
}

export function AnnualReportDocument({ data }: { data: ReportData }) {
  return (
    <Document title={`${data.petName}との${data.year}年 — Sora`}>
      <CoverPage data={data} />
      <MonthlySummaryPage data={data} />
    </Document>
  )
}
