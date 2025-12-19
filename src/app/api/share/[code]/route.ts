import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";
import type { ShareData } from "../route";

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    if (!code || code.length < 6) {
      return NextResponse.json(
        { error: "Invalid share code" },
        { status: 400 }
      );
    }

    const data = await redis.get(`share:${code}`);

    if (!data) {
      return NextResponse.json(
        { error: "Share link not found or expired" },
        { status: 404 }
      );
    }

    // Parse if it's a string
    const shareData: ShareData = typeof data === "string" ? JSON.parse(data) : data;

    return NextResponse.json(shareData);
  } catch (error) {
    console.error("Failed to get share:", error);
    return NextResponse.json(
      { error: "Failed to retrieve share data" },
      { status: 500 }
    );
  }
}

// Optional: DELETE to manually expire a link
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    await redis.del(`share:${code}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete share:", error);
    return NextResponse.json(
      { error: "Failed to delete share" },
      { status: 500 }
    );
  }
}
