import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { MemoryCalendar } from "@/components/memory-calendar"

const baseProps = {
  year: 2026,
  month: 4, // May (0-indexed)
  recordedDates: new Set(["2026-05-01", "2026-05-10", "2026-05-15"]),
  hasPhotoDates: new Set(["2026-05-10"]),
  onDayClick: vi.fn(),
  onPrevMonth: vi.fn(),
  onNextMonth: vi.fn(),
}

describe("MemoryCalendar — 基本表示", () => {
  it("月ラベルが表示される", () => {
    render(<MemoryCalendar {...baseProps} />)
    expect(screen.getByText("2026年5月")).toBeInTheDocument()
  })

  it("曜日ヘッダーが7列表示される", () => {
    render(<MemoryCalendar {...baseProps} />)
    expect(screen.getByText("日")).toBeInTheDocument()
    expect(screen.getByText("土")).toBeInTheDocument()
  })

  it("月の日付が全て表示される", () => {
    render(<MemoryCalendar {...baseProps} />)
    expect(screen.getByRole("button", { name: /2026年5月1日/ })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /2026年5月31日/ })).toBeInTheDocument()
  })

  it("前の月ナビゲーションボタンがある", () => {
    render(<MemoryCalendar {...baseProps} />)
    expect(screen.getByRole("button", { name: "前の月" })).toBeInTheDocument()
  })

  it("次の月ナビゲーションボタンがある", () => {
    render(<MemoryCalendar {...baseProps} />)
    expect(screen.getByRole("button", { name: "次の月" })).toBeInTheDocument()
  })
})

describe("MemoryCalendar — 記録ドット", () => {
  it("記録のある日はボタンが有効", () => {
    render(<MemoryCalendar {...baseProps} />)
    const day = screen.getByRole("button", { name: /2026年5月1日/ })
    expect(day).not.toBeDisabled()
  })

  it("記録のない日はボタンが無効", () => {
    render(<MemoryCalendar {...baseProps} />)
    const day = screen.getByRole("button", { name: /2026年5月2日/ })
    expect(day).toBeDisabled()
  })

  it("記録が0件のとき全日付が無効", () => {
    render(
      <MemoryCalendar
        {...baseProps}
        recordedDates={new Set()}
        hasPhotoDates={new Set()}
      />
    )
    const day1 = screen.getByRole("button", { name: /2026年5月1日/ })
    expect(day1).toBeDisabled()
  })
})

describe("MemoryCalendar — インタラクション", () => {
  it("記録のある日をクリックすると onDayClick が呼ばれる", async () => {
    const onDayClick = vi.fn()
    render(<MemoryCalendar {...baseProps} onDayClick={onDayClick} />)
    await userEvent.click(screen.getByRole("button", { name: /2026年5月10日/ }))
    expect(onDayClick).toHaveBeenCalledWith("2026-05-10")
  })

  it("「前の月」クリックで onPrevMonth が呼ばれる", async () => {
    const onPrevMonth = vi.fn()
    render(<MemoryCalendar {...baseProps} onPrevMonth={onPrevMonth} />)
    await userEvent.click(screen.getByRole("button", { name: "前の月" }))
    expect(onPrevMonth).toHaveBeenCalled()
  })

  it("「次の月」クリックで onNextMonth が呼ばれる", async () => {
    const onNextMonth = vi.fn()
    render(<MemoryCalendar {...baseProps} onNextMonth={onNextMonth} />)
    await userEvent.click(screen.getByRole("button", { name: "次の月" }))
    expect(onNextMonth).toHaveBeenCalled()
  })
})

describe("MemoryCalendar — 月移動", () => {
  it("1月（month=0）が正しく表示される", () => {
    render(<MemoryCalendar {...baseProps} year={2026} month={0} />)
    expect(screen.getByText("2026年1月")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /2026年1月31日/ })).toBeInTheDocument()
  })

  it("2月（うるう年なし）が28日まで表示される", () => {
    render(<MemoryCalendar {...baseProps} year={2025} month={1} />)
    expect(screen.getByText("2025年2月")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /2025年2月28日/ })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /2025年2月29日/ })).not.toBeInTheDocument()
  })
})
