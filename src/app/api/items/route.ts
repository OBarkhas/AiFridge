import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const userId = await ensureUser();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase();
    const category = searchParams.get("category");
    const expireBefore = searchParams.get("expireBefore");

    let where: Record<string, unknown> = { userId };

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }
    if (category) {
      where.category = category;
    }
    if (expireBefore) {
      where.expireDate = { lte: new Date(expireBefore) };
    }

    const items = await db.item.findMany({
      where,
      orderBy: { expireDate: "asc" },
    });

    return NextResponse.json(items);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/items error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await ensureUser();
    const body = await req.json();

    const { name, category, amount, imageUrl, expireDate } = body;

    if (!name || !expireDate) {
      return NextResponse.json(
        { error: "Name and expireDate are required" },
        { status: 400 },
      );
    }

    const item = await db.item.create({
      data: {
        userId,
        name,
        category: category ?? null,
        amount: amount ?? null,
        imageUrl: imageUrl ?? null,
        expireDate: new Date(expireDate),
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/items error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = await ensureUser();
    const body = await req.json();
    const { id, name, category, amount, imageUrl, expireDate } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Item id is required" },
        { status: 400 },
      );
    }

    const existing = await db.item.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const item = await db.item.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(category !== undefined && { category }),
        ...(amount !== undefined && { amount }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl ?? null }),
        ...(expireDate !== undefined && { expireDate: new Date(expireDate) }),
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("PATCH /api/items error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await ensureUser();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Item id is required" },
        { status: 400 },
      );
    }

    const existing = await db.item.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await db.item.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("DELETE /api/items error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
