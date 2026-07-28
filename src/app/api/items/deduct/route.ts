import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureUser } from "@/lib/auth";

interface DeductionRequest {
  itemId: string;
  amountToDeduct: number;
}

export async function POST(req: NextRequest) {
  try {
    const userId = await ensureUser();
    const body: { deductions: DeductionRequest[] } = await req.json();

    if (
      !body.deductions ||
      !Array.isArray(body.deductions) ||
      body.deductions.length === 0
    ) {
      return NextResponse.json(
        { error: "At least one deduction is required." },
        { status: 400 },
      );
    }

    const itemIds = body.deductions.map((d) => d.itemId);
    const existingItems = await db.item.findMany({
      where: { id: { in: itemIds }, userId },
    });

    if (existingItems.length !== itemIds.length) {
      const foundIds = new Set(existingItems.map((i) => i.id));
      const missingIds = itemIds.filter((id) => !foundIds.has(id));
      return NextResponse.json(
        { error: `Items not found: ${missingIds.join(", ")}` },
        { status: 404 },
      );
    }

    const itemMap = new Map(existingItems.map((i) => [i.id, i]));

    const updatedData = body.deductions.map((d) => {
      const item = itemMap.get(d.itemId)!;
      const parsed = parseItemAmount(item.amount);

      const currentQty = parsed?.value ?? null;
      const unit = parsed?.unit ?? "";

      let newAmount: string;
      if (currentQty !== null) {
        const remaining = Math.max(
          0,
          currentQty - Math.max(0, d.amountToDeduct),
        );
        newAmount = remaining === 0 ? `0${unit}` : `${remaining}${unit}`;
      } else {
        newAmount = "0";
      }

      return {
        where: { id: d.itemId },
        data: { amount: newAmount },
      };
    });

    const updatedItems = await db.$transaction(
      updatedData.map((update) => db.item.update(update)),
    );

    return NextResponse.json({
      success: true,
      items: updatedItems,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/items/deduct error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

interface ParsedAmount {
  value: number;
  unit: string;
}

function parseItemAmount(amount: string | null): ParsedAmount | null {
  if (!amount) return null;
  const match = amount.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
  if (!match) return null;
  return {
    value: parseFloat(match[1]),
    unit: match[2] ? ` ${match[2].trim()}` : "",
  };
}
