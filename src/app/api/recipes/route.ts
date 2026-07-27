import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const userId = await ensureUser();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase();

    let where: Record<string, unknown> = { userId };

    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }

    const recipes = await db.recipe.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(recipes);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/recipes error:", error);
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

    const { title, description, ingredients, instructions } = body;

    if (!title || !ingredients || !instructions) {
      return NextResponse.json(
        { error: "Title, ingredients, and instructions are required" },
        { status: 400 },
      );
    }

    const recipe = await db.recipe.create({
      data: {
        userId,
        title,
        description: description ?? null,
        ingredients,
        instructions,
      },
    });

    return NextResponse.json(recipe, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/recipes error:", error);
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
        { error: "Recipe id is required" },
        { status: 400 },
      );
    }

    const existing = await db.recipe.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await db.recipe.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("DELETE /api/recipes error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
