"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createComment } from "@/app/actions/community";
import { Send, Loader2 } from "lucide-react";

export interface CommentUser {
  id: string;
  name: string | null;
  imageUrl: string | null;
}

export interface CommentData {
  id: string;
  userId: string;
  postId: string;
  content: string;
  createdAt: Date;
  user: CommentUser;
}

interface CommentSectionProps {
  postId: string;
  comments: CommentData[];
  currentUserId: string;
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

export default function CommentSection({
  postId,
  comments: initialComments,
  currentUserId,
}: CommentSectionProps) {
  const router = useRouter();
  const [comments, setComments] = useState(initialComments);
  const [commentText, setCommentText] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);

  const handleComment = async () => {
    if (!commentText.trim() || isCommenting) return;
    setIsCommenting(true);
    try {
      const newComment = await createComment({
        postId,
        content: commentText.trim(),
      });
      setComments((prev) => [...prev, newComment]);
      setCommentText("");
    } catch (error) {
      console.error("Failed to create comment:", error);
    } finally {
      setIsCommenting(false);
    }
  };

  return (
    <div>
      <div className="mb-3 max-h-60 space-y-3 overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-xs text-zinc-400">No comments yet.</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-2">
              <button
                onClick={() => router.push(`/user/${comment.user.id}`)}
                className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-medium text-zinc-600 hover:opacity-80 transition-opacity"
              >
                {comment.user.name?.charAt(0) ?? "?"}
              </button>
              <div className="flex-1">
                <div className="rounded-lg bg-zinc-100 px-3 py-2">
                  <button
                    onClick={() => router.push(`/user/${comment.user.id}`)}
                    className="text-xs font-semibold text-zinc-900 hover:underline"
                  >
                    {comment.user.name ?? "Anonymous"}
                  </button>
                  <p className="mt-0.5 text-xs text-zinc-700">
                    {comment.content}
                  </p>
                </div>
                <p className="mt-0.5 text-[10px] text-zinc-400">
                  {timeAgo(comment.createdAt)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-medium text-zinc-600">
          {currentUserId?.charAt(0) ?? "?"}
        </div>
        <input
          type="text"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleComment();
            }
          }}
          placeholder="Write a comment..."
          className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-400 focus:bg-white transition-all"
        />
        <button
          onClick={handleComment}
          disabled={!commentText.trim() || isCommenting}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30 transition-colors"
        >
          {isCommenting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}
