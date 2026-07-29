"use client";

import { useState, useCallback, useEffect } from "react";
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
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  AlertTriangle,
  Refrigerator,
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
  imageUrl?: string | null;
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

function Lightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);

  const goPrev = useCallback(() => {
    setIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  }, [images.length]);

  const goNext = useCallback(() => {
    setIndex((i) => (i === images.length - 1 ? 0 : i + 1));
  }, [images.length]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, goPrev, goNext]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        title="Close (Esc)"
      >
        <X className="h-5 w-5" />
      </button>

      {images.length > 1 && (
        <div className="absolute top-4 left-4 z-10 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white">
          {index + 1} / {images.length}
        </div>
      )}

      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          className="absolute left-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          title="Previous"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      <img
        src={images[index]}
        alt={`Full size ${index + 1}`}
        className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />

      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          className="absolute right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          title="Next"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                setIndex(i);
              }}
              className={`h-2.5 rounded-full transition-all ${
                i === index
                  ? "w-8 bg-white"
                  : "w-2.5 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
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
  const [lightboxOpen, setLightboxOpen] = useState(false);

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
    <>
      <div className="card-hover rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {recipe.imageUrl ? (
                <button
                  onClick={() => setLightboxOpen(true)}
                  className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-200 ring-1 ring-zinc-200 transition-all duration-200 hover:ring-zinc-400"
                >
                  <img
                    src={recipe.imageUrl}
                    alt={recipe.title}
                    className="h-full w-full object-cover"
                  />
                </button>
              ) : (
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-100 ring-1 ring-zinc-200">
                  <ChefHat className="h-4 w-4 text-zinc-500" />
                </div>
              )}
              <h3 className="truncate text-sm font-semibold text-zinc-900">
                {recipe.title}
              </h3>
            </div>
            {recipe.description && (
              <p className="mt-1.5 line-clamp-2 text-xs text-zinc-500 leading-relaxed">
                {recipe.description}
              </p>
            )}
          </div>
          {isOwnProfile && (
            <button
              onClick={handleToggle}
              disabled={toggling}
              className={`btn-active flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[10px] font-medium transition-all duration-200 ${
                recipe.isPublic
                  ? "border-green-200/80 bg-green-50 text-green-700 hover:bg-green-100"
                  : "border-zinc-200/80 bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
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

      {lightboxOpen && recipe.imageUrl && (
        <Lightbox
          images={[recipe.imageUrl]}
          initialIndex={0}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
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
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
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

  const images = post.imageUrls ?? [];

  return (
    <>
      <div className="card-hover rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        <div className="px-4 py-3">
          <p className="whitespace-pre-wrap text-sm text-zinc-800 leading-relaxed">
            {post.content}
          </p>
        </div>

        {images.length > 0 && (
          <div className="border-y border-zinc-100 px-4 py-3">
            <div className="flex flex-wrap gap-2">
              {images.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setLightboxIndex(i)}
                  className="group relative h-16 w-16 overflow-hidden rounded-lg border border-zinc-200/80 bg-zinc-100 transition-all duration-200 hover:ring-2 hover:ring-zinc-300"
                >
                  <img
                    src={url}
                    alt={`Post image ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                  {images.length > 1 && i === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <Maximize2 className="h-4 w-4 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            {images.length > 1 && (
              <p className="mt-1.5 text-[10px] text-zinc-400 tabular-nums">
                {images.length} {images.length === 1 ? "photo" : "photos"}
              </p>
            )}
          </div>
        )}

        {post.recipes && post.recipes.length > 0 && (
          <div className="mx-4 mb-2 grid gap-2 sm:grid-cols-2">
            {post.recipes.map((recipe) => (
              <div
                key={recipe.id}
                className="rounded-xl border border-zinc-200/80 bg-zinc-50 p-3"
              >
                <div className="flex items-center gap-2">
                  {recipe.imageUrl ? (
                    <img
                      src={recipe.imageUrl}
                      alt={recipe.title}
                      className="h-8 w-8 flex-shrink-0 rounded-md object-cover"
                    />
                  ) : (
                    <ChefHat className="h-4 w-4 flex-shrink-0 text-zinc-500" />
                  )}
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
            className={`btn-active flex items-center gap-1.5 text-xs font-medium transition-colors ${
              localLiked ? "text-red-500" : "text-zinc-500 hover:text-red-500"
            }`}
          >
            <Heart
              className={`h-4 w-4 transition-transform duration-200 active:scale-125 ${localLiked ? "fill-red-500" : ""}`}
            />
            {localLikeCount > 0 && <span>{localLikeCount}</span>}
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="btn-active flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-700"
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

      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
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
  const [expiringItems, setExpiringItems] = useState<
    { id: string; name: string; amount: string | null; expireDate: string }[]
  >([]);
  const [expiringLoading, setExpiringLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchExpiring() {
      try {
        const res = await fetch("/api/items");
        if (res.ok) {
          const items = await res.json();
          const now = new Date();
          const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
          const expiring = items.filter(
            (item: { expireDate: string }) =>
              new Date(item.expireDate) >= now &&
              new Date(item.expireDate) <= inThreeDays,
          );
          setExpiringItems(expiring);
        }
      } catch (err) {
        console.error("Failed to fetch expiring items:", err);
      } finally {
        setExpiringLoading(false);
      }
    }
    fetchExpiring();
  }, []);

  const handleToggleVisibility = (recipeId: string) => {
    setLocalRecipes((prev) =>
      prev.map((r) =>
        r.id === recipeId ? { ...r, isPublic: !r.isPublic } : r,
      ),
    );
  };

  const getDaysText = (expireDate: string) => {
    const diff = new Date(expireDate).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Expires today!";
    if (days === 1) return "Expires tomorrow!";
    return `${days} days left`;
  };

  return (
    <div className="animate-fade-in mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-8 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-xl font-bold text-zinc-600 ring-2 ring-zinc-200">
            {user.name?.charAt(0) ?? "?"}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-zinc-900">
              {user.name ?? "Anonymous"}
            </h1>
            <div className="mt-1.5 flex items-center gap-3 text-sm text-zinc-400">
              <span>Joined {formatJoinDate(user.createdAt)}</span>
              <span className="text-zinc-300">·</span>
              <span>
                {user._count.posts} {user._count.posts === 1 ? "post" : "posts"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {!expiringLoading && expiringItems.length > 0 && (
        <div className="mb-6 rounded-2xl border border-red-200/80 bg-red-50/80 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-red-900">
                Expiring Soon Alert
              </h3>
              <p className="mt-0.5 text-xs text-red-600/80">
                {expiringItems.length === 1
                  ? "1 item in your fridge is about to expire"
                  : `${expiringItems.length} items in your fridge are about to expire`}
              </p>
              <ul className="mt-3 space-y-2">
                {expiringItems.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() =>
                        router.push(`/?view=items&highlight=${item.id}`)
                      }
                      className="group flex w-full items-center justify-between rounded-xl border border-red-200/60 bg-white px-3.5 py-2.5 transition-all duration-200 hover:border-red-300 hover:shadow-sm active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-red-50">
                          <Refrigerator className="h-3.5 w-3.5 text-red-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-zinc-900 group-hover:text-zinc-700">
                            {item.name}
                          </p>
                          {item.amount && (
                            <p className="truncate text-xs text-zinc-400">
                              {item.amount}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="ml-3 flex-shrink-0 rounded-full bg-red-100 px-3 py-1 text-[10px] font-semibold text-red-700">
                        {getDaysText(item.expireDate)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 flex border-b border-zinc-200">
        <button
          onClick={() => setActiveTab("recipes")}
          className={`btn-active flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-all duration-200 ${
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
          className={`btn-active flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-all duration-200 ${
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
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-100">
              <ChefHat className="h-7 w-7 text-zinc-300" />
            </div>
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
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-100">
            <FileText className="h-7 w-7 text-zinc-300" />
          </div>
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
