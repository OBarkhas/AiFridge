"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleLike, toggleRecipeVisibility } from "@/app/actions/community";
import CommentSection from "@/components/community/CommentSection";
import type { PostData as CommunityPostData } from "@/components/community/PostCard";
import {
  Heart,
  MessageCircle,
  ChefHat,
  Loader2,
  Globe,
  Lock,
  FileText,
} from "lucide-react";

interface User {
  id: string;
  name: string | null;
  imageUrl: string | null;
  createdAt: Date;
}

interface RecipeData {
  id: string;
  title: string;
  description: string | null;
  isPublic: boolean;
}

interface UserProfileProps {
  user: User & { _count: { posts: number } };
  recipes: RecipeData[];
  posts: CommunityPostData[];
  isOwnProfile: boolean;
  currentUserId: string;
}

function formatJoinDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });
}

function RecipeCard({
  recipe,
  isOwnProfile,
  onToggleVisibility,
}: {
  recipe: RecipeData;
  isOwnProfile: boolean;
  onToggleVisibility: (id: string) => void;
}) {
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    try {
      await toggleRecipeVisibility(recipe.id);
      onToggleVisibility(recipe.id);
    } catch (error) {
      console.error("Failed to toggle visibility:", error);
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <ChefHat className="h-4 w-4 flex-shrink-0 text-zinc-400" />
            <h3 className="truncate text-sm font-semibold text-zinc-900">
              {recipe.title}
            </h3>
          </div>
          {recipe.description && (
            <p className="mt-1.5 line-clamp-2 text-xs text-zinc-500">
              {recipe.description}
            </p>
          )}
        </div>
        {isOwnProfile && (
          <button
            onClick={handleToggle}
            disabled={toggling}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-medium transition-colors ${
              recipe.isPublic
                ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                : "border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
            }`}
          >
            {toggling ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : recipe.isPublic ? (
              <Globe className="h-3 w-3" />
            ) : (
              <Lock className="h-3 w-3" />
            )}
            {recipe.isPublic ? "Public" : "Private"}
          </button>
        )}
      </div>
    </div>
  );
}

function ProfilePostCard({
  post,
  currentUserId,
}: {
  post: CommunityPostData;
  currentUserId: string;
}) {
  const [showComments, setShowComments] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [localLiked, setLocalLiked] = useState(
    post.likes.some((l) => l.userId === currentUserId),
  );
  const [localLikeCount, setLocalLikeCount] = useState(post.likes.length);
  const router = useRouter();

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    const wasLiked = localLiked;
    setLocalLiked(!wasLiked);
    setLocalLikeCount((c) => (wasLiked ? c - 1 : c + 1));
    try {
      await toggleLike(post.id);
    } catch {
      setLocalLiked(wasLiked);
      setLocalLikeCount((c) => (wasLiked ? c + 1 : c - 1));
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="px-4 py-3">
        <p className="whitespace-pre-wrap text-sm text-zinc-800">
          {post.content}
        </p>
      </div>

      {post.imageUrls && post.imageUrls.length > 0 && (
        <div className="border-y border-zinc-100">
          <div className="aspect-[4/3] overflow-hidden bg-zinc-100">
            <img
              src={post.imageUrls[0]}
              alt="Post image"
              className="h-full w-full object-cover"
            />
          </div>
          {post.imageUrls.length > 1 && (
            <div className="flex items-center justify-center gap-1 border-t border-zinc-100 py-1.5">
              <span className="text-[10px] text-zinc-400">
                +{post.imageUrls.length - 1} more photo
                {post.imageUrls.length - 1 > 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      )}

      {post.recipes && post.recipes.length > 0 && (
        <div className="mx-4 mb-2 grid gap-2 sm:grid-cols-2">
          {post.recipes.map((recipe) => (
            <div
              key={recipe.id}
              className="rounded-lg border border-zinc-200 bg-zinc-50 p-3"
            >
              <div className="flex items-center gap-2">
                <ChefHat className="h-4 w-4 flex-shrink-0 text-zinc-500" />
                <span className="text-xs font-medium text-zinc-700 truncate">
                  {recipe.title}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 border-t border-zinc-100 px-4 py-2">
        <button
          onClick={handleLike}
          disabled={isLiking}
          className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
            localLiked ? "text-red-500" : "text-zinc-500 hover:text-red-500"
          }`}
        >
          <Heart className={`h-4 w-4 ${localLiked ? "fill-red-500" : ""}`} />
          {localLikeCount > 0 && <span>{localLikeCount}</span>}
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-700 transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
          {post.comments.length > 0 && <span>{post.comments.length}</span>}
        </button>
      </div>

      {showComments && (
        <div className="border-t border-zinc-100 px-4 py-3">
          <CommentSection
            postId={post.id}
            comments={post.comments}
            currentUserId={currentUserId}
          />
        </div>
      )}
    </div>
  );
}

export default function UserProfile({
  user,
  recipes,
  posts,
  isOwnProfile,
  currentUserId,
}: UserProfileProps) {
  const [activeTab, setActiveTab] = useState<"recipes" | "posts">("recipes");
  const [localRecipes, setLocalRecipes] = useState(recipes);

  const handleToggleVisibility = (recipeId: string) => {
    setLocalRecipes((prev) =>
      prev.map((r) =>
        r.id === recipeId ? { ...r, isPublic: !r.isPublic } : r,
      ),
    );
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-200 text-xl font-bold text-zinc-600">
            {user.name?.charAt(0) ?? "?"}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-zinc-900">
              {user.name ?? "Anonymous"}
            </h1>
            <div className="mt-1 flex items-center gap-3 text-sm text-zinc-400">
              <span>Joined {formatJoinDate(user.createdAt)}</span>
              <span className="text-zinc-300">·</span>
              <span>
                {user._count.posts} {user._count.posts === 1 ? "post" : "posts"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 flex border-b border-zinc-200">
        <button
          onClick={() => setActiveTab("recipes")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "recipes"
              ? "border-zinc-900 text-zinc-900"
              : "border-transparent text-zinc-500 hover:text-zinc-700"
          }`}
        >
          <ChefHat className="h-4 w-4" />
          Recipes
        </button>
        <button
          onClick={() => setActiveTab("posts")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "posts"
              ? "border-zinc-900 text-zinc-900"
              : "border-transparent text-zinc-500 hover:text-zinc-700"
          }`}
        >
          <FileText className="h-4 w-4" />
          Posts ({posts.length})
        </button>
      </div>

      {activeTab === "recipes" ? (
        localRecipes.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center">
            <ChefHat className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
            <p className="text-sm font-medium text-zinc-500">
              {isOwnProfile ? "You haven't" : "This user hasn't"} shared any
              public recipes yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {localRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                isOwnProfile={isOwnProfile}
                onToggleVisibility={handleToggleVisibility}
              />
            ))}
          </div>
        )
      ) : posts.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
          <p className="text-sm font-medium text-zinc-500">No posts yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <ProfilePostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
