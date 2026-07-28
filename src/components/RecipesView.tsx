"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Search,
  Plus,
  Trash2,
  ChefHat,
  X,
  ImagePlus,
  CookingPot,
  Minus,
  Check,
  AlertCircle,
  Loader2,
  ShoppingCart,
  Package,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { showToast } from "@/components/ToastContainer";

interface Recipe {
  id: string;
  title: string;
  description: string | null;
  ingredients: string;
  instructions: string;
  imageUrl?: string | null;
  createdAt: string;
}

interface FridgeItem {
  id: string;
  name: string;
  category: string | null;
  amount: string | null;
  imageUrl: string | null;
  expireDate: string;
}

interface IngredientMatch {
  ingredientLine: string;
  ingredientName: string;
  quantity: number;
  matchedItem: FridgeItem | null;
  deductAmount: number;
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

      <img
        src={images[index]}
        alt={`Full size ${index + 1}`}
        className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

/** Parse a quantity number from the start of a string, e.g. "2 cups" -> 2 */
function parseQuantity(text: string): number {
  const match = text.trim().match(/^(\d+(?:\/\d+)?(?:\.\d+)?)\s*/);
  if (!match) return 1;
  const raw = match[1];
  if (raw.includes("/")) {
    const [num, den] = raw.split("/").map(Number);
    return den ? num / den : num;
  }
  return parseFloat(raw) || 1;
}

/** Parse the ingredient name from a line, removing leading quantity and unit */
function parseIngredientName(line: string): string {
  const trimmed = line.trim();

  const cleaned = trimmed
    .replace(/^[\d\s./]+/, "") // remove leading numbers
    .replace(
      /^(cup|cups|tbsp|tsp|oz|lb|lbs|g|kg|ml|l|pint|pints|quart|quarts|gallon|gallons|piece|pieces|slice|slices|clove|cloves|pack|packs|can|cans|bunch|bunches|head|heads|sprig|sprigs|dash|pinch|to taste)\s+/i,
      "",
    )
    .replace(/^of\s+/i, "")
    .replace(/,\s*.*$/, "") // remove anything after a comma (prep notes)
    .trim();
  return cleaned || trimmed;
}

/** Clean ingredient name for matching against fridge items */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

export default function RecipesView() {
  const { user } = useUser();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    ingredients: "",
    instructions: "",
  });
  const [formImageFile, setFormImageFile] = useState<File | null>(null);
  const [formImagePreview, setFormImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [cookingRecipe, setCookingRecipe] = useState<Recipe | null>(null);
  const [cookingMatches, setCookingMatches] = useState<IngredientMatch[]>([]);
  const [fridgeItems, setFridgeItems] = useState<FridgeItem[]>([]);
  const [cookingLoading, setCookingLoading] = useState(false);
  const [cookingSaving, setCookingSaving] = useState(false);
  const [cookingError, setCookingError] = useState("");
  const [cookingSuccess, setCookingSuccess] = useState(false);

  const fetchRecipes = async (query = "") => {
    try {
      const params = query ? `?search=${encodeURIComponent(query)}` : "";
      const res = await fetch(`/api/recipes${params}`);
      if (res.ok) setRecipes(await res.json());
    } catch (err) {
      console.error("Failed to fetch recipes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes(search);
  }, [search]);

  const handleImageSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file.");
        return;
      }

      const MAX_SIZE = 5 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        setError(`Image is too large (max 5MB).`);
        return;
      }

      if (previewUrlRef.current && !previewUrlRef.current.startsWith("http")) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
      const url = URL.createObjectURL(file);
      previewUrlRef.current = url;
      setFormImageFile(file);
      setFormImagePreview(url);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [],
  );

  const previewUrlRef = useRef<string | null>(null);

  const removeFormImage = useCallback(() => {
    if (previewUrlRef.current && !previewUrlRef.current.startsWith("http")) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
    previewUrlRef.current = null;
    setFormImageFile(null);
    setFormImagePreview(null);
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current && !previewUrlRef.current.startsWith("http")) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.title.trim() ||
      !form.ingredients.trim() ||
      !form.instructions.trim()
    ) {
      setError("Title, ingredients, and instructions are required.");
      return;
    }
    setSaving(true);
    setError("");

    try {
      let imageUrl: string | null = null;

      if (formImageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", formImageFile);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });

        if (!uploadRes.ok) {
          const err = await uploadRes.json();
          throw new Error(err.error ?? "Image upload failed");
        }

        const uploadData = await uploadRes.json();
        imageUrl = uploadData.urls?.[0] ?? null;
      }

      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || null,
          ingredients: form.ingredients.trim(),
          instructions: form.instructions.trim(),
          imageUrl,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to create recipe");
      }

      const recipe = await res.json();
      setRecipes((prev) => [recipe, ...prev]);
      setShowForm(false);
      setForm({
        title: "",
        description: "",
        ingredients: "",
        instructions: "",
      });
      removeFormImage();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this recipe?")) return;
    try {
      const res = await fetch(`/api/recipes?id=${id}`, { method: "DELETE" });
      if (res.ok) setRecipes((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error("Failed to delete recipe:", err);
    }
  };

  const handleProfileRedirect = () => {
    if (user?.id) {
      router.push(`/user/${user.id}`);
    }
  };

  const openCookModal = useCallback(async (recipe: Recipe) => {
    setCookingRecipe(recipe);
    setCookingSuccess(false);
    setCookingError("");
    setCookingLoading(true);

    try {
      const res = await fetch("/api/items");
      if (!res.ok) throw new Error("Failed to fetch fridge items");
      const items: FridgeItem[] = await res.json();
      setFridgeItems(items);

      const ingredientLines = recipe.ingredients
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      const matches: IngredientMatch[] = ingredientLines.map((line) => {
        const ingredientName = parseIngredientName(line);
        const quantity = parseQuantity(line);
        const normalizedIngredient = normalizeName(ingredientName);

        const matchedItem =
          items.find((item) => {
            const normalizedItem = normalizeName(item.name);
            return (
              normalizedItem.includes(normalizedIngredient) ||
              normalizedIngredient.includes(normalizedItem)
            );
          }) ?? null;

        return {
          ingredientLine: line,
          ingredientName,
          quantity,
          matchedItem,
          deductAmount: quantity,
        };
      });

      setCookingMatches(matches);
    } catch (err) {
      setCookingError(
        err instanceof Error ? err.message : "Failed to load fridge items",
      );
    } finally {
      setCookingLoading(false);
    }
  }, []);

  const updateDeductAmount = useCallback((index: number, newAmount: number) => {
    setCookingMatches((prev) =>
      prev.map((m, i) =>
        i === index ? { ...m, deductAmount: Math.max(0, newAmount) } : m,
      ),
    );
  }, []);

  const closeCookModal = useCallback(() => {
    setCookingRecipe(null);
    setCookingMatches([]);
    setCookingError("");
    setCookingSuccess(false);
  }, []);

  const handleCookConfirm = useCallback(async () => {
    if (!cookingRecipe) return;
    setCookingSaving(true);
    setCookingError("");

    try {
      const deductions = cookingMatches.filter(
        (m) => m.matchedItem && m.deductAmount > 0,
      );

      if (deductions.length === 0) {
        setCookingError(
          "No ingredients to deduct. Add matching items to your fridge first.",
        );
        setCookingSaving(false);
        return;
      }

      const res = await fetch("/api/items/deduct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deductions: deductions.map((d) => ({
            itemId: d.matchedItem!.id,
            amountToDeduct: d.deductAmount,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to deduct ingredients");
      }

      setCookingSuccess(true);

      setTimeout(() => {
        closeCookModal();
        const matchedCount = deductions.length;
        showToast(
          `Ingredients updated in your fridge! ${matchedCount} item${matchedCount !== 1 ? "s" : ""} deducted.`,
        );

        window.dispatchEvent(new CustomEvent("fridge-items-updated"));
      }, 1200);
    } catch (err) {
      setCookingError(
        err instanceof Error ? err.message : "An unexpected error occurred.",
      );
    } finally {
      setCookingSaving(false);
    }
  }, [cookingRecipe, cookingMatches, closeCookModal]);

  const matchedCount = cookingMatches.filter(
    (m) => m.matchedItem && m.deductAmount > 0,
  ).length;
  const unmatchedCount = cookingMatches.filter((m) => !m.matchedItem).length;

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Recipes</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Save and manage your favorite recipes.
          </p>
          <p
            onClick={handleProfileRedirect}
            className="mt-1 text-sm text-zinc-400 hover:text-zinc-600 hover:underline cursor-pointer transition-colors"
          >
            If you want to let your recipes be seen by others, please edit to
            public on your profile page.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:bg-zinc-800"
        >
          <Plus className="h-4 w-4" />
          New Recipe
        </button>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search recipes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm transition-colors focus:border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-300"
          />
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/20 backdrop-blur-sm pt-12">
          <div className="mb-12 w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900">
                  New Recipe
                </h3>
                <p className="text-sm text-zinc-500">
                  Add a recipe to your collection.
                </p>
              </div>
              <button
                onClick={() => {
                  removeFormImage();
                  setShowForm(false);
                }}
                className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chicken Stir Fry"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-lg border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="A brief description..."
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full rounded-lg border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Photo
                </label>
                {formImagePreview ? (
                  <div className="relative inline-block">
                    <img
                      src={formImagePreview}
                      alt="Recipe preview"
                      className="h-32 w-32 rounded-lg object-cover border border-zinc-200"
                    />
                    <button
                      type="button"
                      onClick={removeFormImage}
                      className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-white shadow-md hover:bg-red-600 transition-colors"
                      title="Remove image"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm text-zinc-600 hover:bg-zinc-50 hover:text-zinc-800 transition-colors"
                  >
                    <ImagePlus className="h-4 w-4" />
                    Add Photo
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleImageSelect}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Ingredients <span className="text-red-400">*</span>
                </label>
                <textarea
                  placeholder={"2 cups flour\n1 cup sugar\n3 eggs"}
                  value={form.ingredients}
                  onChange={(e) =>
                    setForm({ ...form, ingredients: e.target.value })
                  }
                  rows={4}
                  className="w-full rounded-lg border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-300 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Instructions <span className="text-red-400">*</span>
                </label>
                <textarea
                  placeholder={
                    "1. Preheat oven to 350°F\n2. Mix dry ingredients\n3. Bake for 30 minutes"
                  }
                  value={form.instructions}
                  onChange={(e) =>
                    setForm({ ...form, instructions: e.target.value })
                  }
                  rows={5}
                  className="w-full rounded-lg border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-300 resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    removeFormImage();
                    setShowForm(false);
                  }}
                  className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                >
                  {saving ? "Saving..." : "Save Recipe"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-xl bg-zinc-100"
            />
          ))}
        </div>
      ) : recipes.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100">
            <ChefHat className="h-6 w-6 text-zinc-400" />
          </div>
          <h3 className="text-base font-medium text-zinc-900">
            No recipes yet
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            {search
              ? "No recipes match your search."
              : "Start saving your favorite recipes!"}
          </p>
          {!search && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Your First Recipe
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              className="group flex flex-col rounded-xl border border-zinc-200 bg-white shadow-sm transition-all duration-150 hover:shadow-md"
            >
              {recipe.imageUrl && (
                <button
                  onClick={() => setLightboxImage(recipe.imageUrl!)}
                  className="block w-full aspect-[16/9] overflow-hidden rounded-t-xl bg-zinc-100"
                >
                  <img
                    src={recipe.imageUrl}
                    alt={recipe.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </button>
              )}

              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {recipe.imageUrl && (
                        <button
                          onClick={() => setLightboxImage(recipe.imageUrl!)}
                          className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-md bg-zinc-200 hover:opacity-90 transition-opacity"
                        >
                          <img
                            src={recipe.imageUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </button>
                      )}
                      <h3 className="text-base font-semibold text-zinc-900 truncate">
                        {recipe.title}
                      </h3>
                    </div>
                    {recipe.description && (
                      <p className="mt-1 text-sm text-zinc-500 line-clamp-2">
                        {recipe.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(recipe.id)}
                    className="ml-3 flex-shrink-0 rounded-lg p-2 text-zinc-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-auto pt-4">
                  <button
                    onClick={() => openCookModal(recipe)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:bg-zinc-800"
                  >
                    <CookingPot className="h-4 w-4" />
                    Cook & Use Ingredients
                  </button>
                </div>

                <button
                  onClick={() =>
                    setExpandedId(expandedId === recipe.id ? null : recipe.id)
                  }
                  className="mt-3 text-xs font-medium text-zinc-500 hover:text-zinc-700 transition-colors"
                >
                  {expandedId === recipe.id ? "Hide details" : "Show details"}
                </button>

                {expandedId === recipe.id && (
                  <div className="mt-4 space-y-4 border-t border-zinc-100 pt-4">
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                        Ingredients
                      </h4>
                      <pre className="whitespace-pre-wrap text-sm text-zinc-700 font-sans leading-relaxed">
                        {recipe.ingredients}
                      </pre>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                        Instructions
                      </h4>
                      <pre className="whitespace-pre-wrap text-sm text-zinc-700 font-sans leading-relaxed">
                        {recipe.instructions}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {lightboxImage && (
        <Lightbox
          images={[lightboxImage]}
          initialIndex={0}
          onClose={() => setLightboxImage(null)}
        />
      )}

      {cookingRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900">
                  <CookingPot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900">
                    Cook: {cookingRecipe.title}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Match ingredients with your fridge and deduct quantities
                  </p>
                </div>
              </div>
              <button
                onClick={closeCookModal}
                className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
                disabled={cookingSaving}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {cookingSuccess ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <Check className="h-6 w-6 text-green-600" />
                  </div>
                  <h4 className="text-base font-semibold text-green-800">
                    Cooking Complete!
                  </h4>
                  <p className="mt-1 text-sm text-green-600">
                    {matchedCount} ingredient{matchedCount !== 1 ? "s" : ""}{" "}
                    deducted from your fridge.
                    {unmatchedCount > 0 &&
                      ` ${unmatchedCount} ingredient${unmatchedCount !== 1 ? "s" : ""} could not be matched.`}
                  </p>
                  <p className="mt-2 text-xs text-green-500 animate-pulse">
                    Closing automatically...
                  </p>
                </div>
              </div>
            ) : cookingLoading ? (
              <div className="flex flex-col items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
                <p className="mt-3 text-sm text-zinc-500">
                  Checking your fridge...
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {cookingError && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{cookingError}</span>
                  </div>
                )}

                <div className="flex items-center gap-3 rounded-lg bg-zinc-50 px-4 py-3 text-xs text-zinc-600">
                  <span className="flex items-center gap-1">
                    <Package className="h-3.5 w-3.5 text-green-600" />
                    <span>
                      <strong className="text-zinc-800">{matchedCount}</strong>{" "}
                      matched
                    </span>
                  </span>
                  {unmatchedCount > 0 && (
                    <span className="flex items-center gap-1">
                      <ShoppingCart className="h-3.5 w-3.5 text-amber-600" />
                      <span>
                        <strong className="text-zinc-800">
                          {unmatchedCount}
                        </strong>{" "}
                        no match
                      </span>
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <ChefHat className="h-3.5 w-3.5 text-zinc-400" />
                    <span>
                      <strong className="text-zinc-800">
                        {cookingMatches.length}
                      </strong>{" "}
                      total ingredients
                    </span>
                  </span>
                </div>

                <div className="space-y-2">
                  {cookingMatches.map((match, idx) => (
                    <div
                      key={idx}
                      className={`rounded-lg border p-3 transition-all ${
                        match.matchedItem
                          ? "border-zinc-200 bg-white"
                          : "border-amber-200 bg-amber-50/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {match.matchedItem ? (
                              match.matchedItem.imageUrl ? (
                                <img
                                  src={match.matchedItem.imageUrl}
                                  alt=""
                                  className="h-7 w-7 flex-shrink-0 rounded border border-zinc-200 object-cover"
                                />
                              ) : (
                                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded border border-zinc-200 bg-zinc-50">
                                  <Package className="h-3.5 w-3.5 text-zinc-400" />
                                </div>
                              )
                            ) : (
                              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded border border-amber-200 bg-amber-100">
                                <ShoppingCart className="h-3.5 w-3.5 text-amber-600" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-zinc-800 truncate">
                                {match.ingredientLine}
                              </p>
                              {match.matchedItem ? (
                                <p className="text-xs text-green-600 truncate">
                                  ↔ {match.matchedItem.name}
                                  {match.matchedItem.amount &&
                                    ` (${match.matchedItem.amount})`}
                                </p>
                              ) : (
                                <p className="text-xs text-amber-600">
                                  No matching item in fridge
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {match.matchedItem && (
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                updateDeductAmount(
                                  idx,
                                  Math.max(0, match.deductAmount - 1),
                                )
                              }
                              disabled={
                                match.deductAmount <= 0 || cookingSaving
                              }
                              className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-200 text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 transition-colors"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-8 text-center text-sm font-semibold text-zinc-900 tabular-nums">
                              {match.deductAmount}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateDeductAmount(idx, match.deductAmount + 1)
                              }
                              disabled={cookingSaving}
                              className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-200 text-zinc-500 hover:bg-zinc-100 transition-colors"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-3 pt-2 border-t border-zinc-100">
                  <button
                    onClick={closeCookModal}
                    disabled={cookingSaving}
                    className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCookConfirm}
                    disabled={matchedCount === 0 || cookingSaving}
                    className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {cookingSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Cooking...
                      </>
                    ) : (
                      <>
                        <CookingPot className="h-4 w-4" />
                        Confirm & Cook
                        {matchedCount > 0 && ` (${matchedCount})`}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
