import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { Follow } from "@/types";
import { ObjectId } from "mongodb";

// POST - Follow a user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Can't follow yourself
    if (userId === session.user.id) {
      return NextResponse.json({ error: "You cannot follow yourself" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("trading-journal");

    // Check if target user exists
    const targetUser = await db.collection("users").findOne({
      _id: new ObjectId(userId),
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if already following
    const existingFollow = await db.collection<Follow>("follows").findOne({
      followerId: new ObjectId(session.user.id),
      followingId: new ObjectId(userId),
    });

    if (existingFollow) {
      return NextResponse.json({ error: "Already following this user" }, { status: 400 });
    }

    // Create follow relationship
    const follow: Follow = {
      followerId: new ObjectId(session.user.id),
      followingId: new ObjectId(userId),
      createdAt: new Date(),
    };

    await db.collection<Follow>("follows").insertOne(follow);

    // Update follower/following counts
    await db.collection("users").updateOne(
      { _id: new ObjectId(session.user.id) },
      { $inc: { followingCount: 1 } }
    );

    await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      { $inc: { followersCount: 1 } }
    );

    return NextResponse.json({ message: "Successfully followed user" }, { status: 201 });
  } catch (error) {
    console.error("Error following user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Unfollow a user
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("trading-journal");

    // Check if following
    const existingFollow = await db.collection<Follow>("follows").findOne({
      followerId: new ObjectId(session.user.id),
      followingId: new ObjectId(userId),
    });

    if (!existingFollow) {
      return NextResponse.json({ error: "Not following this user" }, { status: 400 });
    }

    // Delete follow relationship
    await db.collection<Follow>("follows").deleteOne({
      followerId: new ObjectId(session.user.id),
      followingId: new ObjectId(userId),
    });

    // Update follower/following counts
    await db.collection("users").updateOne(
      { _id: new ObjectId(session.user.id) },
      { $inc: { followingCount: -1 } }
    );

    await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      { $inc: { followersCount: -1 } }
    );

    return NextResponse.json({ message: "Successfully unfollowed user" });
  } catch (error) {
    console.error("Error unfollowing user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET - Check if following a user or get followers/following list
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const type = searchParams.get("type"); // "check", "followers", "following"

    const client = await clientPromise;
    const db = client.db("trading-journal");

    if (type === "check" && userId) {
      // Check if current user is following the specified user
      const isFollowing = await db.collection<Follow>("follows").findOne({
        followerId: new ObjectId(session.user.id),
        followingId: new ObjectId(userId),
      });

      return NextResponse.json({ isFollowing: !!isFollowing });
    }

    if (type === "followers") {
      // Get followers of a user
      const targetUserId = userId || session.user.id;
      const followers = await db.collection<Follow>("follows")
        .aggregate([
          { $match: { followingId: new ObjectId(targetUserId) } },
          {
            $lookup: {
              from: "users",
              localField: "followerId",
              foreignField: "_id",
              as: "user",
            },
          },
          { $unwind: "$user" },
          {
            $project: {
              _id: "$user._id",
              name: "$user.name",
              username: "$user.username",
              avatar: "$user.avatar",
              followedAt: "$createdAt",
            },
          },
        ])
        .toArray();

      return NextResponse.json({ followers });
    }

    if (type === "following") {
      // Get users that a user is following
      const targetUserId = userId || session.user.id;
      const following = await db.collection<Follow>("follows")
        .aggregate([
          { $match: { followerId: new ObjectId(targetUserId) } },
          {
            $lookup: {
              from: "users",
              localField: "followingId",
              foreignField: "_id",
              as: "user",
            },
          },
          { $unwind: "$user" },
          {
            $project: {
              _id: "$user._id",
              name: "$user.name",
              username: "$user.username",
              avatar: "$user.avatar",
              followedAt: "$createdAt",
            },
          },
        ])
        .toArray();

      return NextResponse.json({ following });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("Error getting follow data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
