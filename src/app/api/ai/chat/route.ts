import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messages } = await req.json();

    const userItems = await prisma.item.findMany({ where: { userId } });
    const userRecipes = await prisma.recipe.findMany({ where: { userId } });

    const itemsList = userItems
      .map(
        (i) =>
          `- ${i.name} (Amount: ${i.amount || "N/A"}, Expires: ${new Date(
            i.expireDate,
          ).toLocaleDateString()})`,
      )
      .join("\n");

    const recipesList = userRecipes.map((r) => `- ${r.title}`).join("\n");

    const systemPrompt = `
You are an expert AI Kitchen Assistant for "AI Fridge".
Your goal is to help the user reduce food waste, suggest recipes based on their current fridge items, and plan meals.

CURRENT FRIDGE ITEMS:
${itemsList || "No items in fridge currently."}

SAVED RECIPES:
${recipesList || "No saved recipes."}

CRITICAL FORMATTING RULES FOR IMPORTS:
1. If you suggest a specific recipe that the user can import, end that suggestion block with a JSON block in this EXACT format:
\`\`\`json:recipe
{
  "title": "Recipe Title",
  "ingredients": "Ingredient 1, Ingredient 2",
  "instructions": "Step 1... Step 2..."
}
\`\`\`

2. If you suggest a weekly meal schedule, end that response with a JSON block in this EXACT format:
\`\`\`json:schedule
[
  { "dayOfWeek": "Monday", "mealType": "Lunch", "recipeTitle": "Dish Name", "instructions": "Notes" },
  { "dayOfWeek": "Tuesday", "mealType": "Dinner", "recipeTitle": "Dish Name", "instructions": "Notes" }
]
\`\`\`
Always be helpful, encouraging, and clear! Respond in Mongolian if the user asks in Mongolian.
`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m: any) => ({
          role: m.role,
          content: m.content,
        })),
      ],
      model: "llama-3.3-70b-versatile",
    });

    const aiMessage =
      completion.choices[0]?.message?.content || "Sorry there was an error";

    return NextResponse.json({ reply: aiMessage });
  } catch (error) {
    console.error("Groq AI Error:", error);
    return NextResponse.json({ error: "Error on ai chat" }, { status: 500 });
  }
}
