import { NextRequest, NextResponse } from "next/server";

export function validateApiKey(request: NextRequest): NextResponse | null {
  const apiKey = request.headers.get("x-api-key");
  const expected = process.env.API_SECRET;

  if (!expected) {
    return NextResponse.json(
      { error: "Server misconfigured: API_SECRET not set" },
      { status: 500 }
    );
  }

  if (apiKey !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null; // valid
}
