import { NextResponse } from "next/server"
import { getUserFromCookie } from "@/lib/api/auth"
import { getDb } from "@/lib/mongodb"
import { createUploadSession } from "@/lib/ipfs/uploadSessions"

export async function POST(request) {
  const user = await getUserFromCookie(request)
  if (!user?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const session = await createUploadSession(await getDb(), {
      ownerId: user.sub,
      idempotencyKey: request.headers.get("idempotency-key"),
      ...(await request.json()),
    })
    return NextResponse.json({ session }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
