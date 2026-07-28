import { db } from "@/lib/db";
import { getCurrentUserId } from "@/app/actions/community";
import CommunityFeed from "@/components/CommunityFeed";
import PageShell from "@/components/PageShell";
import { redirect } from "next/navigation";
import type { PostData } from "@/components/community/PostCard";

export const dynamic = "force-dynamic";

type PrismaPost = Awaited<ReturnType<typeof fetchPosts>>[number];

function toPostData(post: PrismaPost): PostData {
  return {
    ...post,
    imageUrls: (post.imageUrls as string[]) ?? [],
  };
}

async function fetchPosts() {
  return db.post.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, imageUrl: true } },
      recipes: {
        select: { id: true, title: true, description: true },
      },
      likes: true,
      comments: {
        include: {
          user: { select: { id: true, name: true, imageUrl: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export default async function CommunityPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/");

  const [rawPosts, userRecipes] = await Promise.all([
    fetchPosts(),
    db.recipe.findMany({
      where: { userId },
      select: { id: true, title: true },
    }),
  ]);

  const posts = rawPosts.map(toPostData);

  return (
    <PageShell>
      <CommunityFeed posts={posts} currentUserId={userId} userRecipes={userRecipes} />
    </PageShell>
  );
}
