"use client";

import CreatePostForm from "@/components/community/CreatePostForm";
import PostCard, { type PostData } from "@/components/community/PostCard";
import { Globe } from "lucide-react";

interface CommunityFeedProps {
  posts: PostData[];
  currentUserId: string;
  userRecipes: { id: string; title: string }[];
}

export default function CommunityFeed({
  posts,
  currentUserId,
  userRecipes,
}: CommunityFeedProps) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 shadow-sm">
            <Globe className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-zinc-900">Community</h1>
            <p className="text-xs text-zinc-400">
              Share recipes, tips, and connect with others
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <CreatePostForm
          currentUserId={currentUserId}
          userRecipes={userRecipes}
          onPostCreated={() => window.location.reload()}
        />
      </div>

      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center">
            <Globe className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
            <p className="text-sm font-medium text-zinc-500">No posts yet</p>
            <p className="mt-1 text-xs text-zinc-400">
              Be the first to share with the community!
            </p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              onRefresh={() => window.location.reload()}
            />
          ))
        )}
      </div>
    </div>
  );
}
