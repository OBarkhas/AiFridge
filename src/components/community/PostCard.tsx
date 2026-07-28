"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toggleLike, deletePost } from "@/app/actions/community";
import CommentSection, { type CommentData } from "./CommentSection";
import {
  Heart,
  MessageCircle,
  Trash2,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  X,
  Maximize2,
} from "lucide-react";

export interface PostUser {
  id: string;
  name: string | null;
  imageUrl: string | null;
}

export interface PostRecipe {
  id: string;
  title: string;
  description: string | null;
}

export interface PostData {
  id: string;
  userId: string;
  content: string;
  imageUrls: string[];
  createdAt: Date;
  user: PostUser;
  recipes: PostRecipe[];
  likes: { id: string; userId: string; postId: string }[];
  comments: CommentData[];
}

interface PostCardProps {
  post: PostData;
  currentUserId: string;
  onRefresh?: () => void;
}

function timeAgo(date: Date): string {
  const now = Date.now();
  const diffMs = now - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(date).toLocaleDateString();
}

function ImageCarousel({
  images,
  onImageClick,
}: {
  images: string[];
  onImageClick: (index: number) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  }, [images.length]);

  const goNext = useCallback(() => {
    setCurrentIndex((i) => (i === images.length - 1 ? 0 : i + 1));
  }, [images.length]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goPrev, goNext]);

  return (
    <div className="relative group">
      <button
        onClick={() => onImageClick(currentIndex)}
        className="block w-full aspect-[4/3] overflow-hidden bg-zinc-100"
      >
        <img
          src={images[currentIndex]}
          alt={`Post image ${currentIndex + 1}`}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </button>

      <button
        onClick={() => onImageClick(currentIndex)}
        className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg bg-black/40 text-white opacity-0 transition-opacity hover:bg-black/60 group-hover:opacity-100"
        title="View full size"
      >
        <Maximize2 className="h-4 w-4" />
      </button>

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-zinc-700 shadow-sm opacity-0 transition-all hover:bg-white hover:text-zinc-900 group-hover:opacity-100"
            title="Previous image"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-zinc-700 shadow-sm opacity-0 transition-all hover:bg-white hover:text-zinc-900 group-hover:opacity-100"
            title="Next image"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(i);
              }}
              className={`h-2 rounded-full transition-all ${
                i === currentIndex
                  ? "w-6 bg-white shadow-sm"
                  : "w-2 bg-white/60 hover:bg-white/90"
              }`}
              title={`Image ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
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

export default function PostCard({
  post,
  currentUserId,
  onRefresh,
}: PostCardProps) {
  const router = useRouter();
  const [showComments, setShowComments] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [localLiked, setLocalLiked] = useState(
    post.likes.some((l) => l.userId === currentUserId),
  );
  const [localLikeCount, setLocalLikeCount] = useState(post.likes.length);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const isOwner = post.userId === currentUserId;
  const images = post.imageUrls ?? [];
  const hasMultipleImages = images.length > 1;

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

  const handleDelete = async () => {
    if (!confirm("Delete this post?")) return;
    setIsDeleting(true);
    try {
      await deletePost(post.id);
      onRefresh?.();
      router.refresh();
    } catch (error) {
      console.error("Failed to delete post:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md">
        <div className="flex items-center justify-between p-4 pb-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/user/${post.user.id}`)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-600 hover:opacity-80 transition-opacity"
            >
              {post.user.imageUrl ? (
                <img
                  src={post.user.imageUrl}
                  alt=""
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                (post.user.name?.charAt(0) ?? "?")
              )}
            </button>
            <div>
              <button
                onClick={() => router.push(`/user/${post.user.id}`)}
                className="text-sm font-semibold text-zinc-900 hover:underline"
              >
                {post.user.name ?? "Anonymous"}
              </button>
              <p className="text-xs text-zinc-400">{timeAgo(post.createdAt)}</p>
            </div>
          </div>
          {isOwner && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-red-50 hover:text-red-500 transition-colors"
              title="Delete post"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        {post.content && (
          <div className="px-4 py-2">
            <p className="whitespace-pre-wrap text-sm text-zinc-800">
              {post.content}
            </p>
          </div>
        )}

        {images.length > 0 && (
          <div className="border-y border-zinc-100">
            <ImageCarousel
              images={images}
              onImageClick={(i) => setLightboxIndex(i)}
            />
          </div>
        )}

        {post.recipes.length > 0 && (
          <div className="px-4 py-3">
            <div className="mb-2 flex items-center gap-1.5">
              <ChefHat className="h-3.5 w-3.5 text-zinc-400" />
              <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                Attached {post.recipes.length === 1 ? "Recipe" : "Recipes"}
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {post.recipes.map((recipe) => (
                <button
                  key={recipe.id}
                  onClick={() => router.push(`/?view=recipes`)}
                  className="group flex items-start gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-left transition-all hover:border-zinc-300 hover:bg-zinc-100 active:scale-[0.98]"
                >
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-zinc-200 transition-colors group-hover:bg-zinc-300">
                    <ChefHat className="h-4 w-4 text-zinc-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-800 group-hover:text-zinc-900">
                      {recipe.title}
                    </p>
                    {recipe.description && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500">
                        {recipe.description}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="mt-1 h-3.5 w-3.5 flex-shrink-0 text-zinc-300 transition-colors group-hover:text-zinc-500" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 border-t border-zinc-100 px-4 py-2.5">
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
              localLiked ? "text-red-500" : "text-zinc-500 hover:text-red-500"
            }`}
          >
            <Heart
              className={`h-4 w-4 transition-transform active:scale-125 ${
                localLiked ? "fill-red-500" : ""
              }`}
            />
            {localLikeCount > 0 && (
              <span className="tabular-nums">{localLikeCount}</span>
            )}
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-700 transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            {post.comments.length > 0 && (
              <span className="tabular-nums">{post.comments.length}</span>
            )}
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
