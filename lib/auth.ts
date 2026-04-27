import { createSupabaseServerClient } from "./supabase-server"
import { NextResponse } from "next/server"

export type AuthResult =
  | { user: { id: string; email: string }; errorResponse: null }
  | { user: null; errorResponse: NextResponse }

export async function getAuthUser(): Promise<AuthResult> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      user: null,
      errorResponse: problem(401, "Unauthorized"),
    }
  }

  return {
    user: { id: user.id, email: user.email! },
    errorResponse: null,
  }
}

export function problem(status: number, title: string, detail?: string): NextResponse {
  return NextResponse.json(
    {
      type: `https://sora.app/errors/${title.toLowerCase().replace(/\s+/g, "-")}`,
      title,
      status,
      ...(detail ? { detail } : {}),
    },
    { status }
  )
}
