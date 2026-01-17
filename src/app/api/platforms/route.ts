import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { Platform, Currency } from "@/types";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("trading-journal");

    const platforms = await db
      .collection<Platform>("platforms")
      .find({ userId: new ObjectId(session.user.id) })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ platforms });
  } catch (error) {
    console.error("Error fetching platforms:", error);
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

    const { name, type, currency } = await request.json();

    if (!name || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("trading-journal");

    const result = await db.collection<Platform>("platforms").insertOne({
      userId: new ObjectId(session.user.id),
      name,
      type,
      currency: currency || "USD",
      createdAt: new Date(),
    });

    return NextResponse.json(
      { message: "Platform created", platformId: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating platform:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Platform ID required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("trading-journal");

    await db.collection<Platform>("platforms").deleteOne({
      _id: new ObjectId(id),
      userId: new ObjectId(session.user.id),
    });

    return NextResponse.json({ message: "Platform deleted" });
  } catch (error) {
    console.error("Error deleting platform:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, name, type, currency } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Platform ID required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("trading-journal");

    const updateData: Partial<Platform> = {};
    if (name) updateData.name = name;
    if (type) updateData.type = type;
    if (currency) updateData.currency = currency;

    await db.collection<Platform>("platforms").updateOne(
      {
        _id: new ObjectId(id),
        userId: new ObjectId(session.user.id),
      },
      { $set: updateData }
    );

    return NextResponse.json({ message: "Platform updated" });
  } catch (error) {
    console.error("Error updating platform:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
