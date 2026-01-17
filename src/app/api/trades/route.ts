import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { Trade, DailySummary } from "@/types";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const journalType = searchParams.get("journalType") || "crypto";
    const tradeType = searchParams.get("tradeType");

    const client = await clientPromise;
    const db = client.db("trading-journal");

    const filter: any = {
      userId: new ObjectId(session.user.id),
      journalType,
    };

    if (tradeType) {
      filter.tradeType = tradeType;
    }

    const trades = await db
      .collection<Trade>("trades")
      .find(filter)
      .sort({ entryDate: -1 })
      .toArray();

    return NextResponse.json({ trades });
  } catch (error) {
    console.error("Error fetching trades:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      platformId,
      journalType,
      tradeType,
      direction,
      symbol,
      entry,
      exit,
      size,
      leverage,
      fee,
      pnl,
      pnlPercentage,
      entryDate,
      exitDate,
      notes,
    } = body;

    const client = await clientPromise;
    const db = client.db("trading-journal");

    const trade: Partial<Trade> = {
      userId: new ObjectId(session.user.id),
      platformId: new ObjectId(platformId),
      journalType,
      tradeType,
      direction,
      symbol,
      entry,
      exit,
      size,
      leverage,
      fee,
      pnl,
      pnlPercentage,
      entryDate: new Date(entryDate),
      exitDate: exitDate ? new Date(exitDate) : undefined,
      notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection<Trade>("trades").insertOne(trade as Trade);

    // Update daily summary if trade is closed
    if (exit && exitDate && pnl !== undefined) {
      await updateDailySummary(
        db,
        new ObjectId(session.user.id),
        new Date(exitDate),
        journalType,
        pnl
      );
    }

    return NextResponse.json(
      { message: "Trade created", tradeId: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating trade:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function updateDailySummary(
  db: any,
  userId: ObjectId,
  date: Date,
  journalType: string,
  pnl: number
) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Get all trades for this day
  const trades = await db
    .collection("trades")
    .find({
      userId,
      journalType,
      exitDate: { $gte: startOfDay, $lte: endOfDay },
      pnl: { $exists: true },
    })
    .toArray();

  const totalPnl = trades.reduce((sum: number, trade: any) => sum + (trade.pnl || 0), 0);
  const winningTrades = trades.filter((t: any) => (t.pnl || 0) > 0).length;
  const losingTrades = trades.filter((t: any) => (t.pnl || 0) < 0).length;

  await db.collection("daily_summaries").updateOne(
    {
      userId,
      date: startOfDay,
      journalType,
    },
    {
      $set: {
        totalPnl,
        totalTrades: trades.length,
        winningTrades,
        losingTrades,
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );
}
