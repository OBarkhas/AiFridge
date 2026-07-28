"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CalendarCheck,
  ChevronDown,
  Plus,
  Trash2,
  X,
  Sparkles,
} from "lucide-react";

interface MealPlan {
  id: string;
  dayOfWeek: string;
  mealType: string;
  recipeTitle: string;
  instructions: string | null;
}

interface Recipe {
  id: string;
  title: string;
  description: string | null;
  ingredients: string;
  instructions: string;
}

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"] as const;

export default function MealPlansView({
  onAskAI,
}: {
  onAskAI?: (recipeTitle: string) => void;
}) {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    dayOfWeek: "Monday",
    mealType: "Dinner",
    recipeTitle: "",
    instructions: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [showRecipePicker, setShowRecipePicker] = useState(false);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const recipePickerRef = useRef<HTMLDivElement>(null);

  const fetchMealPlans = async () => {
    try {
      const res = await fetch("/api/meal-plans");
      if (res.ok) setMealPlans(await res.json());
    } catch (err) {
      console.error("Failed to fetch meal plans:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecipes = useCallback(async () => {
    setLoadingRecipes(true);
    try {
      const res = await fetch("/api/recipes");
      if (res.ok) setRecipes(await res.json());
    } catch (err) {
      console.error("Failed to fetch recipes:", err);
    } finally {
      setLoadingRecipes(false);
    }
  }, []);

  useEffect(() => {
    fetchMealPlans();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        recipePickerRef.current &&
        !recipePickerRef.current.contains(e.target as Node)
      ) {
        setShowRecipePicker(false);
      }
    };
    if (showRecipePicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showRecipePicker]);

  const handleFillRecipe = async () => {
    setShowRecipePicker(true);
    if (recipes.length === 0) {
      await fetchRecipes();
    }
  };

  const handleSelectRecipe = (recipe: Recipe) => {
    const notes = [
      recipe.ingredients ? `Ingredients:\n${recipe.ingredients}` : "",
      recipe.instructions ? `Instructions:\n${recipe.instructions}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    setForm((prev) => ({
      ...prev,
      recipeTitle: recipe.title,
      instructions: notes,
    }));
    setShowRecipePicker(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.recipeTitle.trim()) {
      setError("Recipe title is required.");
      return;
    }
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/meal-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayOfWeek: form.dayOfWeek,
          mealType: form.mealType,
          recipeTitle: form.recipeTitle.trim(),
          instructions: form.instructions.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to create meal plan");
      }

      const plan = await res.json();
      setMealPlans((prev) => [...prev, plan]);
      setShowForm(false);
      setForm({
        dayOfWeek: "Monday",
        mealType: "Dinner",
        recipeTitle: "",
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
    try {
      const res = await fetch(`/api/meal-plans?id=${id}`, { method: "DELETE" });
      if (res.ok) setMealPlans((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Failed to delete meal plan:", err);
    }
  };

  const getPlansForDayAndType = (day: string, type: string) => {
    return mealPlans.filter((p) => p.dayOfWeek === day && p.mealType === type);
  };

  return (
    <div className="animate-fade-in px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            Meal Plans
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500">
            Plan your meals for the week ahead.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-active inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-zinc-800"
        >
          <Plus className="h-4 w-4" />
          Add Meal
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
          <div className="animate-scale-in w-full max-w-md rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900">
                  Add a Meal
                </h3>
                <p className="text-sm text-zinc-500">
                  Plan a meal for a specific day.
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Day
                  </label>
                  <select
                    value={form.dayOfWeek}
                    onChange={(e) =>
                      setForm({ ...form, dayOfWeek: e.target.value })
                    }
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  >
                    {DAYS.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Meal Type
                  </label>
                  <select
                    value={form.mealType}
                    onChange={(e) =>
                      setForm({ ...form, mealType: e.target.value })
                    }
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  >
                    {MEAL_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-zinc-700">
                    Recipe Title <span className="text-red-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleFillRecipe}
                    className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-900 transition-colors hover:bg-zinc-200"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                    Fill from your recipes
                  </button>
                </div>

                {showRecipePicker && (
                  <div
                    ref={recipePickerRef}
                    className="mb-2 rounded-lg border border-zinc-200 bg-white shadow-lg"
                  >
                    {loadingRecipes ? (
                      <div className="flex items-center justify-center py-6">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
                        <span className="ml-2 text-sm text-zinc-500">
                          Loading recipes...
                        </span>
                      </div>
                    ) : recipes.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-zinc-400">
                        No saved recipes found.
                      </div>
                    ) : (
                      <div className="max-h-56 overflow-y-auto py-1">
                        {recipes.map((recipe) => (
                          <button
                            key={recipe.id}
                            type="button"
                            onClick={() => handleSelectRecipe(recipe)}
                            className="w-full px-4 py-2.5 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
                          >
                            <span className="font-medium text-zinc-900">
                              {recipe.title}
                            </span>
                            {recipe.description && (
                              <span className="ml-2 text-xs text-zinc-400">
                                {recipe.description}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <input
                  type="text"
                  placeholder="e.g. Spaghetti Bolognese"
                  value={form.recipeTitle}
                  onChange={(e) =>
                    setForm({ ...form, recipeTitle: e.target.value })
                  }
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Notes / Instructions
                </label>
                <textarea
                  placeholder="Any special notes for this meal..."
                  value={form.instructions}
                  onChange={(e) =>
                    setForm({ ...form, instructions: e.target.value })
                  }
                  rows={3}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Adding..." : "Add Meal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl bg-zinc-100"
            />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
          <div className="hidden md:grid md:grid-cols-7 border-b border-zinc-100">
            {DAYS.map((day) => (
              <div
                key={day}
                className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500 border-r border-zinc-100 last:border-r-0"
              >
                {day.slice(0, 3)}
              </div>
            ))}
          </div>

          {MEAL_TYPES.map((mealType) => (
            <div
              key={mealType}
              className="grid grid-cols-1 md:grid-cols-7 border-b border-zinc-100 last:border-b-0"
            >
              {DAYS.map((day) => {
                const plans = getPlansForDayAndType(day, mealType);
                return (
                  <div
                    key={`${day}-${mealType}`}
                    className="min-h-[100px] border-b border-zinc-100 md:border-b-0 md:border-r border-zinc-100 last:border-r-0 p-2 transition-colors hover:bg-zinc-50"
                  >
                    <div className="flex items-center justify-between md:hidden mb-1.5">
                      <span className="text-[11px] font-semibold uppercase text-zinc-400">
                        {day.slice(0, 3)} - {mealType}
                      </span>
                    </div>

                    {plans.length > 0 ? (
                      <div className="space-y-1.5">
                        {plans.map((plan) => (
                          <div
                            key={plan.id}
                            className="group relative rounded-lg bg-zinc-100 px-2.5 py-2"
                          >
                            <p className="text-xs font-medium text-zinc-800 pr-5">
                              {plan.recipeTitle}
                            </p>
                            {plan.instructions && (
                              <p className="mt-0.5 text-[11px] text-zinc-500 line-clamp-2">
                                {plan.instructions}
                              </p>
                            )}
                            <button
                              onClick={() => handleDelete(plan.id)}
                              className="absolute right-1 top-1 rounded p-0.5 text-zinc-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                              title="Remove"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                            {onAskAI && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAskAI(plan.recipeTitle);
                                }}
                                className="absolute right-1 bottom-1 inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-white bg-zinc-900 opacity-0 transition-all duration-200 hover:bg-zinc-800 group-hover:opacity-100"
                                title="Ask AI how to make this"
                              >
                                <Sparkles className="h-2.5 w-2.5" />
                                Ask AI
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="hidden md:flex items-center justify-center h-full"></div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {!loading && mealPlans.length > 0 && (
        <div className="mt-6 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <CalendarCheck className="h-5 w-5 text-zinc-500" />
            <p className="text-sm text-zinc-600">
              You have planned{" "}
              <span className="font-semibold text-zinc-900">
                {mealPlans.length} meal{mealPlans.length === 1 ? "" : "s"}
              </span>{" "}
              for this week.
            </p>
          </div>
        </div>
      )}

      {!loading && mealPlans.length === 0 && (
        <div className="mt-6 flex flex-col items-center rounded-xl border border-zinc-200 bg-white py-14 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100">
            <CalendarCheck className="h-6 w-6 text-zinc-400" />
          </div>
          <h3 className="text-base font-medium text-zinc-900">
            No meals planned
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            Start planning your weekly meals!
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Plan Your First Meal
          </button>
        </div>
      )}
    </div>
  );
}
