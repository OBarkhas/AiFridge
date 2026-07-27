"use client";

import { useEffect, useState } from "react";
import { Search, Plus, Trash2, ChefHat, X } from "lucide-react";

interface Recipe {
  id: string;
  title: string;
  description: string | null;
  ingredients: string;
  instructions: string;
  createdAt: string;
}

export default function RecipesView() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    ingredients: "",
    instructions: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || null,
          ingredients: form.ingredients.trim(),
          instructions: form.instructions.trim(),
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

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Recipes</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Save and manage your favorite recipes.
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
                onClick={() => setShowForm(false)}
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
                  Ingredients <span className="text-red-400">*</span>
                </label>
                <textarea
                  placeholder="2 cups flour&#10;1 cup sugar&#10;3 eggs"
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
                  placeholder="1. Preheat oven to 350°F&#10;2. Mix dry ingredients&#10;3. Bake for 30 minutes"
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
                  onClick={() => setShowForm(false)}
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
              className="group rounded-xl border border-zinc-200 bg-white shadow-sm transition-all duration-150 hover:shadow-md"
            >
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-zinc-900 truncate">
                      {recipe.title}
                    </h3>
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
    </div>
  );
}
