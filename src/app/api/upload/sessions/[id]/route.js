import { NextResponse } from "next/server"
import { getUserFromCookie } from "@/lib/api/auth"
import { getDb } from "@/lib/mongodb"
import { cancelUploadSession, completeUploadSession, recordUploadedPart } from "@/lib/ipfs/uploadSessions"

async function context(request, params) {
  const user = await getUserFromCookie(request)
  if (!user?.sub) return null
  return { db: await getDb(), ownerId: user.sub, sessionId: (await params).id }
}

export async function GET(request, { params }) {
  const ctx = await context(request, params)
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const session = await ctx.db.collection("upload_sessions").findOne({ _id: ctx.sessionId, ownerId: ctx.ownerId })
  return session ? NextResponse.json({ session }) : NextResponse.json({ error: "Not found" }, { status: 404 })
}

export async function PATCH(request, { params }) {
  const ctx = await context(request, params)
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const body = await request.json()
    const result =
      body.action === "record-part" ? await recordUploadedPart(ctx.db, { ...ctx, ...body }) :
      body.action === "complete" ? await completeUploadSession(ctx.db, { ...ctx, material: body.material || {} }) :
      body.action === "cancel" ? await cancelUploadSession(ctx.db, ctx) :
      null
    if (!result) return NextResponse.json({ error: "Unknown action" }, { status: 400 })
    return NextResponse.json({ result })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 409 })
  }
}
