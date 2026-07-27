import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const userId = await ensureUser();
    const { searchParams } = new URL(req.url);
    const dayOfWeek = searchParams.get("dayOfWeek");

    let where: Record<string, unknown> = { userId };

    if (dayOfWeek) {
      where.dayOfWeek = dayOfWeek;
    }

    const mealPlans = await db.mealPlan.findMany({
      where,
      orderBy: [{ dayOfWeek: "asc" }, { mealType: "asc" }],
    });

    return NextResponse.json(mealPlans);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/meal-plans error:", error);
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

    const { dayOfWeek, mealType, recipeTitle, instructions } = body;

    if (!dayOfWeek || !mealType || !recipeTitle) {
      return NextResponse.json(
        {
          error:
            "dayOfWeek, mealType, and recipeTitle are required",
        },
        { status: 400 },
      );
    }

    const validDays = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
    const validMealTypes = ["Breakfast", "Lunch", "Dinner", "Snack"];

    if (!validDays.includes(dayOfWeek)) {
      return NextResponse.json(
        {
          error: `dayOfWeek must be one of: ${validDays.join(", ")}`,
        },
        { status: 400 },
      );
    }

    if (!validMealTypes.includes(mealType)) {
      return NextResponse.json(
        {
          error: `mealType must be one of: ${validMealTypes.join(", ")}`,
        },
        { status: 400 },
      );
    }

    const mealPlan = await db.mealPlan.create({
      data: {
        userId,
        dayOfWeek,
        mealType,
        recipeTitle,
        instructions: instructions ?? null,
      },
    });

    return NextResponse.json(mealPlan, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/meal-plans error:", error);
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
        { error: "MealPlan id is required" },
        { status: 400 },
      );
    }

    const existing = await db.mealPlan.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await db.mealPlan.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("DELETE /api/meal-plans error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
