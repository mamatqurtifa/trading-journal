import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { DailySummary } from "@/types";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const journalType = searchParams.get("journalType") || "crypto";

    const client = await clientPromise;
    const db = client.db("trading-journal");

    const summaries = await db
      .collection<DailySummary>("daily_summaries")
      .find({
        userId: new ObjectId(session.user.id),
        journalType: journalType as "crypto" | "stock",
      })
      .sort({ date: -1 })
      .limit(90) // Last 90 days
      .toArray();

    return NextResponse.json({ summaries });
  } catch (error) {
    console.error("Error fetching daily summaries:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
