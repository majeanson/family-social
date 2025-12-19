import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Generate a short, URL-safe code
function generateCode(length = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Expiry options in seconds
const EXPIRY_OPTIONS: Record<string, number> = {
  "1h": 60 * 60,           // 1 hour
  "24h": 60 * 60 * 24,     // 24 hours
  "7d": 60 * 60 * 24 * 7,  // 7 days
};

export interface ShareData {
  firstName: string;
  lastName?: string;
  nickname?: string;
  email?: string;
  phone?: string;
  birthday?: string;
  photo?: string;  // Base64 photo data
  notes?: string;
  createdAt: string;
  expiresAt: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, expiry = "24h" } = body as { data: ShareData; expiry?: string };

    // Validate required field
    if (!data?.firstName) {
      return NextResponse.json(
        { error: "First name is required" },
        { status: 400 }
      );
    }

    // Get expiry in seconds
    const expirySeconds = EXPIRY_OPTIONS[expiry] || EXPIRY_OPTIONS["24h"];

    // Generate unique code
    let code = generateCode();
    let attempts = 0;
    while (attempts < 5) {
      const existing = await redis.get(`share:${code}`);
      if (!existing) break;
      code = generateCode();
      attempts++;
    }

    // Add timestamps
    const now = new Date();
    const shareData: ShareData = {
      ...data,
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + expirySeconds * 1000).toISOString(),
    };

    // Store with TTL (ex = expire in seconds)
    await redis.set(`share:${code}`, JSON.stringify(shareData), { ex: expirySeconds });

    return NextResponse.json({
      code,
      expiresAt: shareData.expiresAt,
      url: `/import/${code}`,
    });
  } catch (error) {
    console.error("Failed to create share:", error);
    return NextResponse.json(
      { error: "Failed to create share link" },
      { status: 500 }
    );
  }
}
