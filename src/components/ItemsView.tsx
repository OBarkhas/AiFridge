"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Search,
  Plus,
  Trash2,
  Edit3,
  AlertTriangle,
  X,
  ImagePlus,
  Camera,
  ShoppingCart,
  Package,
} from "lucide-react";

interface Item {
  id: string;
  name: string;
  category: string | null;
  amount: string | null;
  imageUrl: string | null;
  expireDate: string;
  createdAt: string;
}

const CATEGORIES = [
  "Dairy",
  "Meat",
  "Vegetables",
  "Fruits",
  "Beverages",
  "Condiments",
  "Frozen",
  "Snacks",
  "Other",
];

type StockFilter = "all" | "in-stock" | "out-of-stock";

function isOutOfStock(amount: string | null): boolean {
  if (!amount) return false;
  const match = amount.match(/^(\d+(?:\.\d+)?)/);
  if (!match) return false;
  return parseFloat(match[1]) === 0;
}

export default function ItemsView({
  highlightItemId,
}: {
  highlightItemId?: string;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const highlightedRef = useRef<HTMLTableRowElement>(null);
  const [highlightActive, setHighlightActive] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    category: "",
    amount: "",
    expireDate: "",
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    category: "",
    amount: "",
    expireDate: "",
  });
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [createImageFile, setCreateImageFile] = useState<File | null>(null);
  const [createImagePreview, setCreateImagePreview] = useState<string | null>(
    null,
  );
  const previewUrlRef = useRef<string | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (categoryFilter) params.set("category", categoryFilter);

      const res = await fetch(`/api/items?${params.toString()}`);
      if (res.ok) setItems(await res.json());
    } catch (err) {
      console.error("Failed to fetch items:", err);
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    const handleFridgeUpdate = () => {
      fetchItems();
    };
    window.addEventListener("fridge-items-updated", handleFridgeUpdate);
    return () =>
      window.removeEventListener("fridge-items-updated", handleFridgeUpdate);
  }, [fetchItems]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    try {
      const res = await fetch(`/api/items?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.id !== id));
        window.dispatchEvent(new CustomEvent("fridge-items-updated"));
      }
    } catch (err) {
      console.error("Failed to delete item:", err);
    }
  };

  const startEditing = (item: Item) => {
    setEditingItem(item);
    setEditForm({
      name: item.name,
      category: item.category ?? "",
      amount: item.amount ?? "",
      expireDate: new Date(item.expireDate).toISOString().split("T")[0],
    });
  };

  const handleUpdate = async () => {
    if (!editingItem) return;
    try {
      const res = await fetch(`/api/items`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingItem.id,
          ...editForm,
          category: editForm.category || null,
          amount: editForm.amount || null,
        }),
      });
      if (res.ok) {
        setEditingItem(null);

        await fetchItems();

        window.dispatchEvent(new CustomEvent("fridge-items-updated"));
      }
    } catch (err) {
      console.error("Failed to update item:", err);
    }
  };

  const handleImageSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        setCreateError("Please select a valid image file.");
        return;
      }

      const MAX_SIZE = 5 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        setCreateError("Image is too large (max 5MB).");
        return;
      }

      if (previewUrlRef.current && !previewUrlRef.current.startsWith("http")) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
      const url = URL.createObjectURL(file);
      previewUrlRef.current = url;
      setCreateImageFile(file);
      setCreateImagePreview(url);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [],
  );

  const removeFormImage = useCallback(() => {
    if (previewUrlRef.current && !previewUrlRef.current.startsWith("http")) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
    previewUrlRef.current = null;
    setCreateImageFile(null);
    setCreateImagePreview(null);
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current && !previewUrlRef.current.startsWith("http")) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.expireDate) {
      setCreateError("Name and expiry date are required.");
      return;
    }
    setCreateSaving(true);
    setCreateError("");

    try {
      let imageUrl: string | null = null;

      if (createImageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", createImageFile);

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

      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name.trim(),
          category: createForm.category || null,
          amount: createForm.amount || null,
          imageUrl,
          expireDate: createForm.expireDate,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to create item");
      }

      const item = await res.json();
      setItems((prev) => [item, ...prev]);
      setShowCreateModal(false);
      setCreateForm({ name: "", category: "", amount: "", expireDate: "" });
      removeFormImage();
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "An unexpected error occurred.",
      );
    } finally {
      setCreateSaving(false);
    }
  };

  const now = new Date();
  const getDaysLeft = (expireDate: string) => {
    const diff = new Date(expireDate).getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getStatusBadge = (expireDate: string, amount: string | null) => {
    if (isOutOfStock(amount)) {
      return {
        label: "Out of Stock",
        class: "bg-red-50 text-red-700 border-red-200",
        icon: ShoppingCart,
      };
    }

    const days = getDaysLeft(expireDate);
    if (days < 0)
      return {
        label: "Expired",
        class: "bg-red-50 text-red-700 border-red-100",
        icon: AlertTriangle,
      };
    if (days <= 3)
      return {
        label: `${days}d left`,
        class: "bg-amber-50 text-amber-700 border-amber-100",
        icon: AlertTriangle,
      };
    if (days <= 7)
      return {
        label: `${days}d left`,
        class: "bg-yellow-50 text-yellow-700 border-yellow-100",
        icon: null,
      };
    return {
      label: `${days}d left`,
      class: "bg-green-50 text-green-700 border-green-100",
      icon: null,
    };
  };

  const filteredItems = items.filter((item) => {
    if (stockFilter === "out-of-stock") return isOutOfStock(item.amount);
    if (stockFilter === "in-stock") return !isOutOfStock(item.amount);
    return true;
  });

  const outOfStockCount = items.filter((item) =>
    isOutOfStock(item.amount),
  ).length;

  useEffect(() => {
    if (highlightItemId && !loading) {
      setHighlightActive(true);

      const scrollTimer = setTimeout(() => {
        highlightedRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 300);

      const pulseTimer = setTimeout(() => {
        setHighlightActive(false);
      }, 4000);
      return () => {
        clearTimeout(scrollTimer);
        clearTimeout(pulseTimer);
      };
    } else {
      setHighlightActive(false);
    }
  }, [highlightItemId, loading]);

  return (
    <div className="animate-fade-in px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            Fridge Items
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500">
            Manage all items in your fridge.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-active inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-zinc-800"
        >
          <Plus className="h-4 w-4" />
          Add Item
        </button>
      </div>

      <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setStockFilter("all")}
          className={`btn-active inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-medium transition-all duration-200 ${
            stockFilter === "all"
              ? "bg-zinc-900 text-white shadow-sm"
              : "bg-white text-zinc-600 border border-zinc-200/80 hover:bg-zinc-50 hover:border-zinc-300"
          }`}
        >
          <Package className="h-3.5 w-3.5" />
          All Items
        </button>
        <button
          onClick={() => setStockFilter("in-stock")}
          className={`btn-active inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-medium transition-all duration-200 ${
            stockFilter === "in-stock"
              ? "bg-zinc-900 text-white shadow-sm"
              : "bg-white text-zinc-600 border border-zinc-200/80 hover:bg-zinc-50 hover:border-zinc-300"
          }`}
        >
          <Package className="h-3.5 w-3.5" />
          In Stock
        </button>
        <button
          onClick={() => setStockFilter("out-of-stock")}
          className={`btn-active inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-medium transition-all duration-200 ${
            stockFilter === "out-of-stock"
              ? "bg-zinc-900 text-white shadow-sm"
              : "bg-white text-zinc-600 border border-zinc-200/80 hover:bg-zinc-50 hover:border-zinc-300"
          } ${outOfStockCount > 0 && stockFilter !== "out-of-stock" ? "border-red-200 text-red-600" : ""}`}
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          Out of Stock
          {outOfStockCount > 0 && (
            <span className="ml-1 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">
              {outOfStockCount}
            </span>
          )}
        </button>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-zinc-200/80 bg-white py-2.5 pl-10 pr-4 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm transition-all duration-200 focus:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full rounded-xl border border-zinc-200/80 bg-white px-4 py-2.5 text-sm text-zinc-700 shadow-sm transition-all duration-200 focus:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 sm:w-auto"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl bg-zinc-100"
            />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100">
            {stockFilter === "out-of-stock" ? (
              <ShoppingCart className="h-6 w-6 text-zinc-400" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-zinc-400" />
            )}
          </div>
          <h3 className="text-base font-medium text-zinc-900">
            {stockFilter === "out-of-stock"
              ? "No out-of-stock items"
              : "No items found"}
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            {stockFilter === "out-of-stock"
              ? "Everything is in stock! Items you run out of will appear here."
              : search || categoryFilter
                ? "Try adjusting your search or filters."
                : "Your fridge is empty. Start adding items!"}
          </p>
          {!search && !categoryFilter && stockFilter !== "out-of-stock" && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
            >
              <Plus className="h-4 w-4" />
              Add Your First Item
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Item
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Category
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Amount
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Status
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredItems.map((item) => {
                const badge = getStatusBadge(item.expireDate, item.amount);
                const isZeroStock = isOutOfStock(item.amount);
                return (
                  <tr
                    ref={
                      item.id === highlightItemId ? highlightedRef : undefined
                    }
                    key={item.id}
                    className={`transition-colors hover:bg-zinc-50 ${
                      isZeroStock ? "bg-red-50/30" : ""
                    }                    ${item.id === highlightItemId && highlightActive ? "ring-2 ring-red-400 bg-red-50/60 animate-pulse-soft" : item.id === highlightItemId ? "ring-2 ring-red-400 bg-red-50/60" : ""}`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {item.imageUrl ? (
                          <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100">
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50">
                            <Package className="h-4 w-4 text-zinc-400" />
                          </div>
                        )}
                        <p className="text-sm font-medium text-zinc-900">
                          {item.name}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {item.category ? (
                        <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
                          {item.category}
                        </span>
                      ) : (
                        <span className="text-sm text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`text-sm ${isZeroStock ? "text-red-400 line-through" : "text-zinc-600"}`}
                      >
                        {item.amount ?? "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${badge.class}`}
                      >
                        {badge.icon && <badge.icon className="h-3 w-3" />}
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => startEditing(item)}
                          className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
                          title="Edit"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
          <div className="animate-scale-in w-full max-w-md rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900">
                  Add New Item
                </h3>
                <p className="text-sm text-zinc-500">
                  Record a new item in your fridge.
                </p>
              </div>
              <button
                onClick={() => {
                  removeFormImage();
                  setShowCreateModal(false);
                }}
                className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {createError && (
              <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Item Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Organic Milk, Baby Spinach..."
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, name: e.target.value })
                  }
                  className="w-full rounded-lg border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Photo
                </label>
                {createImagePreview ? (
                  <div className="relative inline-block">
                    <img
                      src={createImagePreview}
                      alt="Item preview"
                      className="h-28 w-28 rounded-lg object-cover border border-zinc-200"
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
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.removeAttribute("capture");
                          fileInputRef.current.click();
                        }
                      }}
                      className="flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm text-zinc-600 hover:bg-zinc-50 hover:text-zinc-800 transition-colors"
                    >
                      <ImagePlus className="h-4 w-4" />
                      Browse Gallery
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.setAttribute(
                            "capture",
                            "environment",
                          );
                          fileInputRef.current.click();
                        }
                      }}
                      className="flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm text-zinc-600 hover:bg-zinc-50 hover:text-zinc-800 transition-colors"
                    >
                      <Camera className="h-4 w-4" />
                      Take Photo
                    </button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelect}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Category
                  </label>
                  <select
                    value={createForm.category}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, category: e.target.value })
                    }
                    className="w-full rounded-lg border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-700 focus:border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-300"
                  >
                    <option value="">Select a category</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Amount
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1 gallon"
                    value={createForm.amount}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, amount: e.target.value })
                    }
                    className="w-full rounded-lg border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Expiry Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={createForm.expireDate}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, expireDate: e.target.value })
                  }
                  className="w-full rounded-lg border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-300"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    removeFormImage();
                    setShowCreateModal(false);
                  }}
                  className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSaving}
                  className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  {createSaving ? "Adding..." : "Add Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
          <div className="animate-scale-in w-full max-w-md rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-zinc-900">Edit Item</h3>
            <p className="mb-5 text-sm text-zinc-500">
              Update the details for {editingItem.name}.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className="w-full rounded-lg border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Category
                  </label>
                  <select
                    value={editForm.category}
                    onChange={(e) =>
                      setEditForm({ ...editForm, category: e.target.value })
                    }
                    className="w-full rounded-lg border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-300"
                  >
                    <option value="">None</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Amount
                  </label>
                  <input
                    type="text"
                    value={editForm.amount}
                    onChange={(e) =>
                      setEditForm({ ...editForm, amount: e.target.value })
                    }
                    placeholder="e.g. 2 lbs"
                    className="w-full rounded-lg border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-300"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={editForm.expireDate}
                  onChange={(e) =>
                    setEditForm({ ...editForm, expireDate: e.target.value })
                  }
                  className="w-full rounded-lg border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-300"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setEditingItem(null)}
                className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
