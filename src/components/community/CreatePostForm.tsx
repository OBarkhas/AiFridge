"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createPost } from "@/app/actions/community";
import { Send, ImagePlus, X, ChefHat, Loader2, Images } from "lucide-react";

interface CreatePostFormProps {
  currentUserId: string;
  userRecipes: { id: string; title: string }[];
  onPostCreated?: () => void;
}

const DRAFT_KEY = "community_post_draft";

interface Draft {
  content: string;
  selectedRecipeIds: string[];
}

function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed.content !== "string") return null;
    return {
      content: parsed.content ?? "",
      selectedRecipeIds: Array.isArray(parsed.selectedRecipeIds)
        ? parsed.selectedRecipeIds
        : [],
    };
  } catch {
    return null;
  }
}

function saveDraft(content: string, selectedRecipeIds: string[]) {
  try {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ content, selectedRecipeIds }),
    );
  } catch {}
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {}
}

export default function CreatePostForm({
  currentUserId,
  userRecipes,
  onPostCreated,
}: CreatePostFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRecipeDropdown, setShowRecipeDropdown] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);

  const selectedRecipes = userRecipes.filter((r) =>
    selectedRecipeIds.includes(r.id),
  );

  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      setContent(draft.content);
      setSelectedRecipeIds(draft.selectedRecipeIds);
      setDraftRestored(true);
    }
  }, []);

  useEffect(() => {
    if (draftRestored || content || selectedRecipeIds.length > 0) {
      saveDraft(content, selectedRecipeIds);
    }
  }, [content, selectedRecipeIds, draftRestored]);

  useEffect(() => {
    return () => {
      imagePreviews.forEach((p) => {
        if (!p.startsWith("data:") && !p.startsWith("http")) {
          URL.revokeObjectURL(p);
        }
      });
    };
  }, []);

  const handleImagesSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (files.length === 0) return;
      setUploadError(null);

      const MAX_SIZE = 5 * 1024 * 1024;
      const valid: File[] = [];
      const errors: string[] = [];

      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          errors.push(`"${file.name}" is not an image.`);
          continue;
        }
        if (file.size > MAX_SIZE) {
          errors.push(`"${file.name}" exceeds 5MB.`);
          continue;
        }
        if (file.size === 0) {
          errors.push(`"${file.name}" is empty.`);
          continue;
        }
        valid.push(file);
      }

      const totalAfterAdd = imageFiles.length + valid.length;
      if (totalAfterAdd > 10) {
        setUploadError(
          `Maximum 10 images per post. You already have ${imageFiles.length}.`,
        );
        return;
      }

      if (errors.length > 0) {
        setUploadError(errors.join(" "));
      }

      setImageFiles((prev) => [...prev, ...valid]);
      setImagePreviews((prev) => [
        ...prev,
        ...valid.map((f) => URL.createObjectURL(f)),
      ]);

      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [imageFiles.length],
  );

  const removeImage = useCallback((index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => {
      const url = prev[index];
      if (url && !url.startsWith("data:") && !url.startsWith("http")) {
        URL.revokeObjectURL(url);
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const removeRecipe = useCallback((recipeId: string) => {
    setSelectedRecipeIds((prev) => prev.filter((id) => id !== recipeId));
  }, []);

  const clearAll = useCallback(() => {
    setContent("");
    setImageFiles([]);
    imagePreviews.forEach((p) => {
      if (!p.startsWith("data:") && !p.startsWith("http")) {
        URL.revokeObjectURL(p);
      }
    });
    setImagePreviews([]);
    setSelectedRecipeIds([]);
    clearDraft();
    setUploadError(null);
  }, [imagePreviews]);

  const handleSubmit = useCallback(async () => {
    if ((!content.trim() && imageFiles.length === 0) || isSubmitting) return;
    setIsSubmitting(true);
    setUploadError(null);

    try {
      let imageUrls: string[] = [];

      if (imageFiles.length > 0) {
        const formData = new FormData();
        imageFiles.forEach((f) => formData.append("files", f));

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? "Upload failed");
        }

        const data = await res.json();
        imageUrls = data.urls ?? [];
      }

      await createPost({
        content: content.trim(),
        imageUrls,
        recipeIds: selectedRecipeIds,
      });

      clearAll();
      onPostCreated?.();
      router.refresh();
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Failed to create post.";
      setUploadError(msg);
      console.error("Failed to create post:", msg);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    content,
    imageFiles,
    selectedRecipeIds,
    isSubmitting,
    clearAll,
    onPostCreated,
    router,
  ]);

  const canSubmit = content.trim().length > 0 || imageFiles.length > 0;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      {uploadError && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="flex-1">{uploadError}</span>
          <button
            onClick={() => setUploadError(null)}
            className="flex h-5 w-5 items-center justify-center rounded-full text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      <textarea
        placeholder="Share something with the community..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        className="w-full resize-none rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-400 focus:bg-white focus:ring-1 focus:ring-zinc-400 transition-all"
      />

      {content.length > 0 && (
        <div className="mt-1 flex justify-end">
          <span
            className={`text-[10px] tabular-nums ${
              content.length > 1000 ? "text-amber-500" : "text-zinc-400"
            }`}
          >
            {content.length.toLocaleString()}
          </span>
        </div>
      )}

      {imagePreviews.length > 0 && (
        <div className="mt-3">
          <div className="mb-2 flex items-center gap-1.5">
            <Images className="h-3.5 w-3.5 text-zinc-400" />
            <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
              {imagePreviews.length}{" "}
              {imagePreviews.length === 1 ? "Photo" : "Photos"}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-2.5">
            {imagePreviews.map((preview, i) => (
              <div
                key={i}
                className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100"
              >
                <img
                  src={preview}
                  alt={`Preview ${i + 1}`}
                  className="h-full w-full object-cover transition-opacity group-hover:opacity-80"
                />

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="text-[9px] font-medium text-white">
                    {imageFiles[i]
                      ? `${(imageFiles[i].size / 1024).toFixed(0)} KB`
                      : ""}
                  </span>
                </div>

                <button
                  onClick={() => removeImage(i)}
                  className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-white shadow-md opacity-0 transition-all hover:bg-red-600 hover:scale-110 group-hover:opacity-100"
                  title={`Remove image ${i + 1}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedRecipes.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {selectedRecipes.map((recipe) => (
            <div
              key={recipe.id}
              className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-200">
                <ChefHat className="h-3.5 w-3.5 text-zinc-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-zinc-800">
                  {recipe.title}
                </p>
                <p className="text-[10px] text-zinc-400">Attached recipe</p>
              </div>
              <button
                onClick={() => removeRecipe(recipe.id)}
                className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 transition-colors"
                title="Remove recipe"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-800 transition-colors"
          >
            <ImagePlus className="h-3.5 w-3.5" />
            {imageFiles.length > 0 ? "Add More Photos" : "Photos"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleImagesSelect}
          />

          <div className="relative">
            <button
              onClick={() => setShowRecipeDropdown(!showRecipeDropdown)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                selectedRecipeIds.length > 0
                  ? "border-zinc-300 bg-zinc-100 text-zinc-700"
                  : "border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-800"
              }`}
            >
              <ChefHat className="h-3.5 w-3.5" />
              {selectedRecipeIds.length > 0
                ? `${selectedRecipeIds.length} Recipe${selectedRecipeIds.length > 1 ? "s" : ""}`
                : "Attach Recipe"}
            </button>
            {showRecipeDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowRecipeDropdown(false)}
                />
                <div className="absolute top-full left-0 z-20 mt-1 w-64 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg">
                  <div className="border-b border-zinc-100 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                      Your Recipes
                    </p>
                  </div>
                  {userRecipes.length === 0 ? (
                    <p className="px-3 py-3 text-center text-xs text-zinc-400">
                      No recipes yet.
                    </p>
                  ) : (
                    <div className="max-h-48 overflow-y-auto">
                      {userRecipes.map((recipe) => {
                        const isSelected = selectedRecipeIds.includes(
                          recipe.id,
                        );
                        return (
                          <button
                            key={recipe.id}
                            onClick={() => {
                              setSelectedRecipeIds((prev) =>
                                isSelected
                                  ? prev.filter((id) => id !== recipe.id)
                                  : [...prev, recipe.id],
                              );
                            }}
                            className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-xs transition-colors ${
                              isSelected
                                ? "bg-zinc-100 text-zinc-900"
                                : "text-zinc-600 hover:bg-zinc-50"
                            }`}
                          >
                            <ChefHat className="h-3.5 w-3.5 flex-shrink-0 text-zinc-400" />
                            <span className="truncate">{recipe.title}</span>
                            {isSelected && (
                              <span className="ml-auto text-zinc-400">
                                <ChefHat className="h-3 w-3" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(content || imageFiles.length > 0 || selectedRecipeIds.length > 0) &&
            !isSubmitting && (
              <span className="hidden text-[10px] text-zinc-400 sm:inline">
                Draft saved
              </span>
            )}

          <button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-medium text-white shadow-sm transition-all hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.97]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                Post
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
