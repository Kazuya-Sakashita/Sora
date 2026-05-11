import path from "path"
import { Document, Page, View, Text, Image, StyleSheet, Font } from "@react-pdf/renderer"
import type { PhotobookItem } from "@/lib/photobook"

Font.register({
  family: "NotoSansJP",
  src: path.join(
    process.cwd(),
    "node_modules/@fontsource/noto-sans-jp/files/noto-sans-jp-japanese-400-normal.woff"
  ),
})

const WARM = "#A07840"
const WARM_LIGHT = "#F5EEE4"
const MUTED = "#9B8878"
const DARK = "#3D2B1F"

const s = StyleSheet.create({
  page: { fontFamily: "NotoSansJP", backgroundColor: "#FDFAF6", padding: 40 },
  coverBrand: { fontSize: 11, color: WARM, letterSpacing: 2, marginBottom: 20 },
  coverTitle: { fontSize: 28, fontWeight: 700, color: DARK, lineHeight: 1.4 },
  coverSub: { fontSize: 12, color: MUTED, marginTop: 6 },
  coverPhoto: { width: 100, height: 100, borderRadius: 50, objectFit: "cover", marginBottom: 20 },
  coverMeta: { flexDirection: "row", gap: 24, marginTop: 24 },
  coverMetaBox: { alignItems: "center" },
  coverMetaNum: { fontSize: 26, fontWeight: 700, color: WARM },
  coverMetaLabel: { fontSize: 9, color: MUTED, marginTop: 2 },
  divider: { height: 1, backgroundColor: "#E8DDD0", marginVertical: 20 },
  sectionLabel: { fontSize: 10, color: MUTED, letterSpacing: 1, marginBottom: 14 },
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
  gridInfo: { padding: 8, gap: 3 },
  gridTitle: { fontSize: 10, fontWeight: 700, color: DARK, lineHeight: 1.4 },
  gridDate: { fontSize: 8, color: MUTED },
  gridMood: { fontSize: 8, color: WARM },
  letterItem: { marginBottom: 24 },
  letterMeta: { fontSize: 9, color: WARM, marginBottom: 6 },
  letterContent: { fontSize: 10, color: DARK, lineHeight: 1.8 },
})

const MOOD_LABELS: Record<string, string> = {
  happy: "うれしい",
  calm: "おだやか",
  fun: "笑った",
  worried: "心配",
  loving: "愛おしい",
}

const ITEMS_PER_PAGE = 6

export type MemorialBookData = {
  petName: string
  petPhotoUrl: string | null
  daysTogether: number | null
  items: PhotobookItem[]
  letters: Array<{ year: number; month: number; content: string }>
}

function CoverPage({ data }: { data: MemorialBookData }) {
  return (
    <Page size="A4" style={s.page}>
      {data.petPhotoUrl && <Image src={data.petPhotoUrl} style={s.coverPhoto} />}
      <Text style={s.coverBrand}>Sora</Text>
      <Text style={s.coverTitle}>{data.petName}のメモリアルブック</Text>
      <Text style={s.coverSub}>大切な記録をひとつの本に</Text>
      <View style={s.coverMeta}>
        <View style={s.coverMetaBox}>
          <Text style={s.coverMetaNum}>{data.items.length}</Text>
          <Text style={s.coverMetaLabel}>件の思い出</Text>
        </View>
        <View style={s.coverMetaBox}>
          <Text style={s.coverMetaNum}>{data.items.filter((i) => i.photoUrl).length}</Text>
          <Text style={s.coverMetaLabel}>枚の写真</Text>
        </View>
        {data.daysTogether !== null && (
          <View style={s.coverMetaBox}>
            <Text style={s.coverMetaNum}>{data.daysTogether}</Text>
            <Text style={s.coverMetaLabel}>日間ともに</Text>
          </View>
        )}
      </View>
    </Page>
  )
}

function GridPage({ items, pageNum }: { items: MemorialBookData["items"]; pageNum: number }) {
  return (
    <Page size="A4" style={s.page}>
      {pageNum === 1 && <Text style={s.sectionLabel}>思い出</Text>}
      <View style={s.grid}>
        {items.map((item) => (
          <View key={item.id} style={s.gridItem}>
            {item.photoUrl ? (
              <Image src={item.photoUrl} style={s.gridPhoto} />
            ) : (
              <View style={s.gridPlaceholder} />
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

function LettersPage({ letters }: { letters: MemorialBookData["letters"] }) {
  return (
    <Page size="A4" style={s.page}>
      <Text style={s.sectionLabel}>Soraからの手紙</Text>
      {letters.map((letter) => (
        <View key={`${letter.year}-${letter.month}`} style={s.letterItem}>
          <Text style={s.letterMeta}>{letter.year}年{letter.month}月</Text>
          <View style={s.divider} />
          <Text style={s.letterContent}>{letter.content}</Text>
        </View>
      ))}
    </Page>
  )
}

export function MemorialBookDocument({ data }: { data: MemorialBookData }) {
  const pages: MemorialBookData["items"][] = []
  for (let i = 0; i < data.items.length; i += ITEMS_PER_PAGE) {
    pages.push(data.items.slice(i, i + ITEMS_PER_PAGE))
  }
  if (pages.length === 0) pages.push([])

  return (
    <Document title={`${data.petName}のメモリアルブック — Sora`}>
      <CoverPage data={data} />
      {pages.map((items, i) => (
        <GridPage key={i} items={items} pageNum={i + 1} />
      ))}
      {data.letters.length > 0 && <LettersPage letters={data.letters} />}
    </Document>
  )
}
