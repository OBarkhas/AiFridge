import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { db } from "@/lib/db";
import { ensureUser } from "@/lib/auth";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const userId = await ensureUser();

    const { messages }: { messages: { role: "user" | "assistant"; content: string }[] } =
      await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 },
      );
    }

    // Fetch the user's fridge items and saved recipes for context
    const [items, recipes] = await Promise.all([
      db.item.findMany({
        where: { userId },
        orderBy: { expireDate: "asc" },
      }),
      db.recipe.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const now = new Date();
    const expiringSoon = items.filter(
      (item) =>
        new Date(item.expireDate) >= now &&
        new Date(item.expireDate) <= new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
    );

    const itemsContext =
      items.length > 0
        ? items
            .map((item) => {
              const daysLeft = Math.ceil(
                (new Date(item.expireDate).getTime() - now.getTime()) /
                  (1000 * 60 * 60 * 24),
              );
              return `- ${item.name}${item.amount ? ` (${item.amount})` : ""}${item.category ? ` [${item.category}]` : ""} — expires ${new Date(item.expireDate).toLocaleDateString()}${daysLeft <= 3 ? " ⚠️ EXPIRING SOON" : ""}${daysLeft < 0 ? " (EXPIRED)" : ` (${daysLeft} day${daysLeft === 1 ? "" : "s"} left)`}`;
            })
            .join("\n")
        : "Your fridge is currently empty.";

    const recipesContext =
      recipes.length > 0
        ? recipes
            .map((r) => `- ${r.title}${r.description ? `: ${r.description}` : ""}`)
            .join("\n")
        : "You have no saved recipes yet.";

    const systemPrompt = [
      "You are a helpful AI cooking assistant for the 'Smart Fridge' app. Your role is to help users make the most of the ingredients they have in their fridge, reduce food waste, and plan delicious meals.",
      "",
      "## 🔴 CRITICAL RULE: You MUST use ONLY ingredients listed below in 'Current fridge contents.'",
      "You are STRICTLY FORBIDDEN from inventing or assuming ingredients that are NOT in the user's fridge.",
      "The ingredient list below is the COMPLETE and EXCLUSIVE set of items available. Do not add any unlisted ingredients.",
      "",
      "## Current fridge contents (COMPLETE INVENTORY — do not add anything else):",
      itemsContext,
      "",
      "## Saved recipes:",
      recipesContext,
      "",
      "## Ingredient Priority & Usage Rules:",
      "- 🥇 FIRST PRIORITY: Use expiring items (marked ⚠️ EXPIRING SOON or EXPIRED) before anything else",
      "- 🥈 SECOND PRIORITY: Use other available fridge items",
      "- 🥉 THIRD PRIORITY: If you absolutely must suggest a recipe that needs missing ingredients, you MUST clearly separate them (see format below)",
      "- You can assume basic pantry staples always exist (salt, black pepper, cooking oil, water, sugar — but nothing else)",
      "",
      "## How to handle missing ingredients:",
      "When you suggest a meal or recipe, you MUST explicitly separate ingredients into two lists:",
      "",
      "✅ Ingredients from your fridge:",
      "- [item 1]",
      "- [item 2]",
      "",
      "🛒 Missing ingredients you need to buy:",
      "- [item 1]",
      "- [item 2]",
      "",
      "If a recipe can be made 100% with fridge contents, celebrate that! If it requires external items, always try to suggest an alternative recipe first that uses only fridge items.",
      "",
      "## Meal Plan / Weekly Schedule Rules:",
      "- When generating a multi-day meal plan, maximize the use of current fridge items across all days",
      "- Distribute expiring items FIRST across early days of the week",
      "- If missing ingredients are needed to complete the weekly plan, include a concise '🛍️ Shopping Checklist' section at the end of your response",
      "- Keep the shopping checklist minimal — only items truly necessary to round out the plan",
      "",
      "## General Guidelines:",
      "- Be practical and consider common pantry staples (salt, oil, spices, etc.) — these are the ONLY assumed extras",
      "- Give clear, step-by-step instructions when suggesting recipes",
      "- When suggesting a complete recipe that the user could save to their collection, include a structured recipe block AFTER your natural language description",
      "- When suggesting a weekly meal plan schedule, include structured meal plan blocks AFTER the relevant suggestion",
      "- Be encouraging and enthusiastic about cooking",
      "",
      "## Structured output format for importable data:",
      "",
      'When you suggest a recipe the user could save, include this EXACT format with valid JSON (place it after your text description):',
      "",
      "---BEGIN_RECIPE---",
      '{"title": "Recipe Title", "description": "Short description", "ingredients": "Ingredient list", "instructions": "Step-by-step instructions"}',
      "---END_RECIPE---",
      "",
      "When you suggest a weekly meal plan entry, include this EXACT format with valid JSON (place it after your text description):",
      "",
      "---BEGIN_MEALPLAN---",
      '{"dayOfWeek": "Monday", "mealType": "Dinner", "recipeTitle": "Recipe Name", "instructions": "Cooking instructions"}',
      "---END_MEALPLAN---",
      "",
      "Valid dayOfWeek values: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday",
      "Valid mealType values: Breakfast, Lunch, Dinner, Snack",
      "",
      "You can include multiple structured blocks in a single response. Only include a block when you are genuinely suggesting something the user could take action on.",
    ].join("\n");

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 2048,
    });

    const responseText = completion.choices[0]?.message?.content || "";

    // Extract structured recipe blocks
    const extractedRecipes: Array<{
      title: string;
      description?: string;
      ingredients: string;
      instructions: string;
    }> = [];

    const recipeRegex = /---BEGIN_RECIPE---\s*([\s\S]*?)\s*---END_RECIPE---/g;
    let match: RegExpExecArray | null;
    while ((match = recipeRegex.exec(responseText)) !== null) {
      try {
        const data = JSON.parse(match[1].trim());
        if (data.title && data.ingredients && data.instructions) {
          extractedRecipes.push(data);
        }
      } catch {
        // Skip invalid JSON blocks
      }
    }

    // Extract structured meal plan blocks
    const extractedMealPlans: Array<{
      dayOfWeek: string;
      mealType: string;
      recipeTitle: string;
      instructions?: string;
    }> = [];

    const mealPlanRegex = /---BEGIN_MEALPLAN---\s*([\s\S]*?)\s*---END_MEALPLAN---/g;
    while ((match = mealPlanRegex.exec(responseText)) !== null) {
      try {
        const data = JSON.parse(match[1].trim());
        if (data.dayOfWeek && data.mealType && data.recipeTitle) {
          extractedMealPlans.push(data);
        }
      } catch {
        // Skip invalid JSON blocks
      }
    }

    return NextResponse.json({
      message: responseText,
      actions: {
        recipes: extractedRecipes,
        mealPlans: extractedMealPlans,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/ai/chat error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
