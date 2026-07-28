import { db } from "@/lib/db";
import { getCurrentUserId } from "@/app/actions/community";
import UserProfile from "@/components/UserProfile";
import PageShell from "@/components/PageShell";
import { notFound } from "next/navigation";
import type { PostData } from "@/components/community/PostCard";

export const dynamic = "force-dynamic";

type PrismaPost = Awaited<ReturnType<typeof fetchUserPosts>>[number];

function toPostData(post: PrismaPost): PostData {
  return {
    ...post,
    imageUrls: (post.imageUrls as string[]) ?? [],
  };
}

async function fetchUserPosts(userId: string) {
  return db.post.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, imageUrl: true } },
      recipes: {
        select: { id: true, title: true, description: true, imageUrl: true },
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

export default async function UserPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) notFound();

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      imageUrl: true,
      createdAt: true,
      _count: { select: { posts: true } },
    },
  });

  if (!user) notFound();

  const isOwnProfile = currentUserId === userId;

  const [recipes, rawPosts] = await Promise.all([
    isOwnProfile
      ? db.recipe.findMany({
          where: { userId },
          select: {
            id: true,
            title: true,
            description: true,
            imageUrl: true,
            isPublic: true,
          },
          orderBy: { createdAt: "desc" },
        })
      : db.recipe.findMany({
          where: { userId, isPublic: true },
          select: {
            id: true,
            title: true,
            description: true,
            imageUrl: true,
            isPublic: true,
          },
          orderBy: { createdAt: "desc" },
        }),
    fetchUserPosts(userId),
  ]);

  const posts = rawPosts.map(toPostData);

  return (
    <PageShell>
      <UserProfile
        user={user}
        recipes={recipes}
        posts={posts}
        isOwnProfile={isOwnProfile}
        currentUserId={currentUserId}
      />
    </PageShell>
  );
}
