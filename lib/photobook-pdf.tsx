import path from "path"
import { Document, Page, View, Text, Image, StyleSheet, Font } from "@react-pdf/renderer"
import type { PhotobookData } from "@/lib/photobook"

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
  page: { fontFamily: "NotoSansJP", backgroundColor: "#FDFAF6", padding: 40 },
  // Cover
  coverBrand: { fontSize: 11, color: WARM, letterSpacing: 2, marginBottom: 24 },
  coverTitle: { fontSize: 26, fontWeight: 700, color: DARK, lineHeight: 1.4 },
  coverSub: { fontSize: 12, color: MUTED, marginTop: 6 },
  coverPhoto: { width: 88, height: 88, borderRadius: 44, objectFit: "cover", marginBottom: 20 },
  coverMeta: { flexDirection: "row", gap: 20, marginTop: 24 },
  coverMetaBox: { alignItems: "center" },
  coverMetaNum: { fontSize: 24, fontWeight: 700, color: WARM },
  coverMetaLabel: { fontSize: 9, color: MUTED, marginTop: 2 },
  divider: { height: 1, backgroundColor: "#E8DDD0", marginVertical: 20 },
  // Grid
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  gridItem: { width: "47%", backgroundColor: WARM_LIGHT, borderRadius: 10, overflow: "hidden" },
  gridPhoto: { width: "100%", height: 140, objectFit: "cover" },
  gridPlaceholder: {
    width: "100%",
    height: 140,
    backgroundColor: "#EDE3D8",
    alignItems: "center",
    justifyContent: "center",
  },
  gridPlaceholderText: { fontSize: 28 },
  gridInfo: { padding: 8, gap: 3 },
  gridTitle: { fontSize: 10, fontWeight: 700, color: DARK, lineHeight: 1.4 },
  gridDate: { fontSize: 8, color: MUTED },
  gridMood: { fontSize: 8, color: WARM },
  sectionLabel: { fontSize: 10, color: MUTED, letterSpacing: 1, marginBottom: 12 },
})

const MOOD_LABELS: Record<string, string> = {
  happy: "🥰 うれしい",
  calm: "😌 おだやか",
  fun: "😄 笑った",
  worried: "😟 心配",
  loving: "💝 愛おしい",
}

const ITEMS_PER_PAGE = 6

function CoverPage({ data }: { data: PhotobookData }) {
  return (
    <Page size="A4" style={s.page}>
      {data.petPhotoUrl && <Image src={data.petPhotoUrl} style={s.coverPhoto} />}
      <Text style={s.coverBrand}>Sora</Text>
      <Text style={s.coverTitle}>{data.petName}の{data.monthLabel}</Text>
      <Text style={s.coverSub}>フォトブック</Text>
      <View style={s.coverMeta}>
        <View style={s.coverMetaBox}>
          <Text style={s.coverMetaNum}>{data.items.length}</Text>
          <Text style={s.coverMetaLabel}>件の思い出</Text>
        </View>
        <View style={s.coverMetaBox}>
          <Text style={s.coverMetaNum}>{data.items.filter((i) => i.photoUrl).length}</Text>
          <Text style={s.coverMetaLabel}>枚の写真</Text>
        </View>
      </View>
    </Page>
  )
}

function GridPage({ items, pageNum }: { items: PhotobookData["items"]; pageNum: number }) {
  return (
    <Page size="A4" style={s.page}>
      {pageNum === 1 && <Text style={s.sectionLabel}>思い出</Text>}
      <View style={s.grid}>
        {items.map((item) => (
          <View key={item.id} style={s.gridItem}>
            {item.photoUrl ? (
              <Image src={item.photoUrl} style={s.gridPhoto} />
            ) : (
              <View style={s.gridPlaceholder}>
                <Text style={s.gridPlaceholderText}>🐾</Text>
              </View>
            )}
            <View style={s.gridInfo}>
              <Text style={s.gridTitle}>{item.title}</Text>
              <Text style={s.gridDate}>{item.date}</Text>
              {item.moodTag && (
                <Text style={s.gridMood}>{MOOD_LABELS[item.moodTag] ?? item.moodTag}</Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </Page>
  )
}

export function PhotobookDocument({ data }: { data: PhotobookData }) {
  const pages: PhotobookData["items"][] = []
  for (let i = 0; i < data.items.length; i += ITEMS_PER_PAGE) {
    pages.push(data.items.slice(i, i + ITEMS_PER_PAGE))
  }
  if (pages.length === 0) pages.push([])

  return (
    <Document title={`${data.petName}の${data.monthLabel} — Sora フォトブック`}>
      <CoverPage data={data} />
      {pages.map((items, i) => (
        <GridPage key={i} items={items} pageNum={i + 1} />
      ))}
    </Document>
  )
}
