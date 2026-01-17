import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { User } from "@/types";
import { ObjectId } from "mongodb";

// GET - Get current user profile
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("trading-journal");

    const user = await db.collection<User>("users").findOne(
      { _id: new ObjectId(session.user.id) },
      { projection: { password: 0 } } // Exclude password
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - Update user profile
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, username, bio, avatar, defaultCurrency, isPublic } = body;

    const client = await clientPromise;
    const db = client.db("trading-journal");

    // If username is being updated, check if it's unique
    if (username) {
      // Validate username format (alphanumeric, underscores, hyphens, 3-30 chars)
      const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
      if (!usernameRegex.test(username)) {
        return NextResponse.json(
          { error: "Username must be 3-30 characters and can only contain letters, numbers, underscores, and hyphens" },
          { status: 400 }
        );
      }

      const existingUser = await db.collection<User>("users").findOne({
        username: username.toLowerCase(),
        _id: { $ne: new ObjectId(session.user.id) },
      });

      if (existingUser) {
        return NextResponse.json({ error: "Username is already taken" }, { status: 400 });
      }
    }

    const updateData: Partial<User> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (username !== undefined) updateData.username = username.toLowerCase();
    if (bio !== undefined) updateData.bio = bio;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (defaultCurrency !== undefined) updateData.defaultCurrency = defaultCurrency;
    if (isPublic !== undefined) updateData.isPublic = isPublic;

    await db.collection<User>("users").updateOne(
      { _id: new ObjectId(session.user.id) },
      { $set: updateData }
    );

    // Get updated user
    const updatedUser = await db.collection<User>("users").findOne(
      { _id: new ObjectId(session.user.id) },
      { projection: { password: 0 } }
    );

    return NextResponse.json({ user: updatedUser, message: "Profile updated successfully" });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
