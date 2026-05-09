import { NextResponse } from "next/server"
import { Resend } from "resend"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(1).max(100),
  clinicName: z.string().min(1).max(100),
  email: z.string().email(),
  message: z.string().min(1).max(2000),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { name, clinicName, email, message } = parsed.data

  const apiKey = process.env.RESEND_API_KEY
  const toEmail = process.env.CONTACT_EMAIL ?? "kz0508@gmail.com"

  if (apiKey) {
    const resend = new Resend(apiKey)
    await resend.emails.send({
      from: "Sora <noreply@sora-app.jp>",
      to: toEmail,
      subject: `【Soraパートナー問い合わせ】${clinicName}`,
      text: [
        `お名前: ${name}`,
        `クリニック名: ${clinicName}`,
        `メールアドレス: ${email}`,
        ``,
        `メッセージ:`,
        message,
      ].join("\n"),
      replyTo: email,
    })
  }

  return NextResponse.json({ ok: true })
}
