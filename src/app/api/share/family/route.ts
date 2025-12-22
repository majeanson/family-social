import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Generate a cryptographically secure, URL-safe code
function generateCode(length = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(randomValues[i] % chars.length);
  }
  return code;
}

// Expiry options in seconds
const EXPIRY_OPTIONS: Record<string, number> = {
  "1h": 60 * 60,
  "24h": 60 * 60 * 24,
  "7d": 60 * 60 * 24 * 7,
};

export interface SharedPerson {
  tempId: string; // Temporary ID for relationship mapping
  firstName: string;
  lastName?: string;
  nickname?: string;
  email?: string;
  phone?: string;
  birthday?: string;
  photo?: string;
  notes?: string;
  tags?: string[];
  customFields?: Array<{
    id: string;
    label: string;
    value: string;
    type: "text" | "date" | "url" | "number";
  }>;
}

export interface SharedRelationship {
  personATempId: string;
  personBTempId: string;
  type: string;
  reverseType?: string;
  label?: string;
}

export interface FamilyShareData {
  type: "family";
  familyName?: string;
  people: SharedPerson[];
  relationships: SharedRelationship[];
  createdAt: string;
  expiresAt: string;
  sharedBy?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { people, relationships = [], familyName, expiry = "24h", sharedBy } = body as {
      people: SharedPerson[];
      relationships?: SharedRelationship[];
      familyName?: string;
      expiry?: string;
      sharedBy?: string;
    };

    // Validate required data
    if (!people || !Array.isArray(people) || people.length === 0) {
      return NextResponse.json(
        { error: "At least one person is required" },
        { status: 400 }
      );
    }

    // Validate each person has a firstName
    for (const person of people) {
      if (!person.firstName) {
        return NextResponse.json(
          { error: "Each person must have a first name" },
          { status: 400 }
        );
      }
    }

    // Get expiry in seconds
    const expirySeconds = EXPIRY_OPTIONS[expiry] || EXPIRY_OPTIONS["24h"];

    // Generate unique code
    let code = generateCode();
    let attempts = 0;
    while (attempts < 5) {
      const existing = await redis.get(`share:family:${code}`);
      if (!existing) break;
      code = generateCode();
      attempts++;
    }

    // Add timestamps
    const now = new Date();
    const shareData: FamilyShareData = {
      type: "family",
      familyName,
      people,
      relationships,
      sharedBy,
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + expirySeconds * 1000).toISOString(),
    };

    // Store with TTL
    await redis.set(`share:family:${code}`, JSON.stringify(shareData), { ex: expirySeconds });

    return NextResponse.json({
      code,
      expiresAt: shareData.expiresAt,
      url: `/import/family/${code}`,
      peopleCount: people.length,
      relationshipCount: relationships.length,
    });
  } catch (error) {
    console.error("Failed to create family share:", error);
    return NextResponse.json(
      { error: "Failed to create share link" },
      { status: 500 }
    );
  }
}
