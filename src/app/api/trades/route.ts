import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { Trade, DailySummary, TradeStatus } from "@/types";
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
      size,
      leverage,
      fee,
      entryDate,
      notes,
      currency,
      // Take Profit levels
      tp1,
      tp2,
      tp3,
      tp4,
      tp5,
      stopLoss,
    } = body;

    const client = await clientPromise;
    const db = client.db("trading-journal");

    const trade: Partial<Trade> = {
      userId: new ObjectId(session.user.id),
      platformId: new ObjectId(platformId),
      journalType,
      tradeType,
      direction,
      currency: currency || "USD",
      symbol,
      entry,
      size,
      leverage,
      fee,
      entryDate: new Date(entryDate),
      notes,
      // Take Profit levels (optional)
      tp1,
      tp2,
      tp3,
      tp4,
      tp5,
      stopLoss,
      // New trade starts as "running"
      status: "running" as TradeStatus,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection<Trade>("trades").insertOne(trade as Trade);

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

// Calculate trade status based on exit price and TP levels
function calculateTradeStatus(
  trade: Trade,
  exitPrice: number
): TradeStatus {
  const { entry, direction, tp1, tp2, tp3, tp4, tp5, stopLoss } = trade;
  const isLong = direction === "long";
  
  // Check if it's a loss (hit stop loss or price went against direction)
  const isLoss = isLong ? exitPrice < entry : exitPrice > entry;
  
  if (isLoss) {
    return "stoploss";
  }
  
  // It's a profit - check which TP was hit (from highest to lowest)
  const tpLevels = [
    { level: "tp5" as TradeStatus, price: tp5 },
    { level: "tp4" as TradeStatus, price: tp4 },
    { level: "tp3" as TradeStatus, price: tp3 },
    { level: "tp2" as TradeStatus, price: tp2 },
    { level: "tp1" as TradeStatus, price: tp1 },
  ];
  
  for (const tp of tpLevels) {
    if (tp.price !== undefined && tp.price !== null) {
      if (isLong && exitPrice >= tp.price) {
        return tp.level;
      }
      if (!isLong && exitPrice <= tp.price) {
        return tp.level;
      }
    }
  }
  
  // Profit but no TP level matched
  return "profit";
}

// PATCH - Close/Exit a position
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { tradeId, exitPrice, exitDate } = body;

    if (!tradeId || !exitPrice) {
      return NextResponse.json(
        { error: "Trade ID and exit price are required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("trading-journal");

    // Get the existing trade
    const trade = await db.collection<Trade>("trades").findOne({
      _id: new ObjectId(tradeId),
      userId: new ObjectId(session.user.id),
    });

    if (!trade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    if (trade.status !== "running") {
      return NextResponse.json(
        { error: "Trade is already closed" },
        { status: 400 }
      );
    }

    // Calculate PnL
    const { entry, direction, size, fee } = trade;
    let pnl = 0;
    if (direction === "long") {
      pnl = (exitPrice - entry) * size - (fee || 0);
    } else {
      pnl = (entry - exitPrice) * size - (fee || 0);
    }
    const pnlPercentage = ((exitPrice - entry) / entry) * 100;

    // Calculate status
    const status = calculateTradeStatus(trade, exitPrice);

    const exitDateValue = exitDate ? new Date(exitDate) : new Date();

    // Update the trade
    await db.collection<Trade>("trades").updateOne(
      { _id: new ObjectId(tradeId) },
      {
        $set: {
          exit: exitPrice,
          exitDate: exitDateValue,
          pnl,
          pnlPercentage,
          status,
          updatedAt: new Date(),
        },
      }
    );

    // Update daily summary
    await updateDailySummary(
      db,
      new ObjectId(session.user.id),
      exitDateValue,
      trade.journalType,
      pnl
    );

    return NextResponse.json({
      message: "Trade closed successfully",
      status,
      pnl,
      pnlPercentage,
    });
  } catch (error) {
    console.error("Error closing trade:", error);
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
