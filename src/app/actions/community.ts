"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function ensureUser(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const { clerkClient } = await import("@clerk/nextjs/server");
  const client = await clerkClient();
  const clerkUser = await client.users.getUser(userId);
  const email = clerkUser.emailAddresses[0]?.emailAddress ?? null;
  const name =
    clerkUser.fullName ?? clerkUser.firstName ?? clerkUser.username ?? null;
  const imageUrl = clerkUser.imageUrl ?? null;

  await db.user.upsert({
    where: { id: userId },
    create: { id: userId, email, name, imageUrl },
    update: { email, name, imageUrl },
  });

  return userId;
}

export async function getCurrentUserId() {
  const { userId } = await auth();
  return userId;
}

export async function createPost(data: {
  content: string;
  imageUrls?: string[];
  recipeIds?: string[];
}) {
  const userId = await ensureUser();

  const post = await db.post.create({
    data: {
      userId,
      content: data.content,
      imageUrls:
        data.imageUrls && data.imageUrls.length > 0 ? data.imageUrls : [],
      recipes:
        data.recipeIds && data.recipeIds.length > 0
          ? { connect: data.recipeIds.map((id) => ({ id })) }
          : undefined,
    },
    include: {
      user: { select: { id: true, name: true, imageUrl: true } },
      recipes: {
        select: { id: true, title: true, description: true },
      },
    },
  });

  revalidatePath("/community");
  return post;
}

export async function deletePost(postId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const post = await db.post.findUnique({ where: { id: postId } });
  if (!post || post.userId !== userId) throw new Error("Forbidden");

  await db.post.delete({ where: { id: postId } });

  revalidatePath("/community");
}

export async function toggleLike(postId: string) {
  const userId = await ensureUser();

  const existing = await db.like.findUnique({
    where: { userId_postId: { userId, postId } },
  });

  if (existing) {
    await db.like.delete({ where: { id: existing.id } });
    revalidatePath("/community");
    return { liked: false };
  } else {
    await db.like.create({ data: { userId, postId } });
    revalidatePath("/community");
    return { liked: true };
  }
}

export async function createComment(data: {
  postId: string;
  content: string;
}) {
  const userId = await ensureUser();

  if (!data.content.trim()) throw new Error("Comment cannot be empty");

  const comment = await db.comment.create({
    data: {
      userId,
      postId: data.postId,
      content: data.content,
    },
    include: {
      user: { select: { id: true, name: true, imageUrl: true } },
    },
  });

  revalidatePath("/community");
  return comment;
}

export async function toggleRecipeVisibility(recipeId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const recipe = await db.recipe.findUnique({ where: { id: recipeId } });
  if (!recipe || recipe.userId !== userId) throw new Error("Forbidden");

  const updated = await db.recipe.update({
    where: { id: recipeId },
    data: { isPublic: !recipe.isPublic },
  });

  revalidatePath("/community");
  return updated;
}
