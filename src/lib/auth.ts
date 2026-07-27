"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function ensureUser(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const { clerkClient } = await import("@clerk/nextjs/server");
  const client = await clerkClient();
  const clerkUser = await client.users.getUser(userId);
  const email = clerkUser.emailAddresses[0]?.emailAddress ?? null;

  await db.user.upsert({
    where: { id: userId },
    create: { id: userId, email },
    update: { email },
  });

  return userId;
}
