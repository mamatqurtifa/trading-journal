import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { User, Trade, Follow } from "@/types";
import { ObjectId } from "mongodb";

// GET - Get public profile by username
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const session = await getServerSession(authOptions);

    const client = await clientPromise;
    const db = client.db("trading-journal");

    // Find user by username
    const user = await db.collection<User>("users").findOne(
      { username: username.toLowerCase() },
      { projection: { password: 0, email: 0 } } // Exclude sensitive data
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if profile is public or if it's the user's own profile
    const isOwnProfile = session?.user?.id === user._id?.toString();
    
    if (!user.isPublic && !isOwnProfile) {
      return NextResponse.json(
        { error: "This profile is private" },
        { status: 403 }
      );
    }

    // Check if current user is following this user
    let isFollowing = false;
    if (session?.user?.id && !isOwnProfile) {
      const followRecord = await db.collection<Follow>("follows").findOne({
        followerId: new ObjectId(session.user.id),
        followingId: user._id,
      });
      isFollowing = !!followRecord;
    }

    // Get trading stats (only closed trades)
    const trades = await db.collection<Trade>("trades")
      .find({
        userId: user._id,
        status: { $ne: "running" },
      })
      .toArray();

    const totalTrades = trades.length;
    const winningTrades = trades.filter(t => (t.pnl || 0) > 0).length;
    const losingTrades = trades.filter(t => (t.pnl || 0) < 0).length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

    // Group PnL by currency
    const pnlByCurrency: Record<string, number> = {};
    for (const trade of trades) {
      const currency = trade.currency || "USD";
      pnlByCurrency[currency] = (pnlByCurrency[currency] || 0) + (trade.pnl || 0);
    }

    // Get recent trades (only if public)
    const recentTrades = await db.collection<Trade>("trades")
      .find({ userId: user._id })
      .sort({ entryDate: -1 })
      .limit(10)
      .toArray();

    return NextResponse.json({
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        bio: user.bio,
        avatar: user.avatar,
        followersCount: user.followersCount || 0,
        followingCount: user.followingCount || 0,
        createdAt: user.createdAt,
      },
      stats: {
        totalTrades,
        winningTrades,
        losingTrades,
        winRate,
        pnlByCurrency,
      },
      recentTrades: recentTrades.map(t => ({
        _id: t._id,
        symbol: t.symbol,
        direction: t.direction,
        tradeType: t.tradeType,
        status: t.status,
        pnl: t.pnl,
        pnlPercentage: t.pnlPercentage,
        currency: t.currency,
        entryDate: t.entryDate,
        exitDate: t.exitDate,
      })),
      isOwnProfile,
      isFollowing,
    });
  } catch (error) {
    console.error("Error fetching public profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
