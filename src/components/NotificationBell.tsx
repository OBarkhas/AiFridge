"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Bell,
  AlertTriangle,
  X,
  ShoppingCart,
  Package,
  Refrigerator,
} from "lucide-react";

interface Item {
  id: string;
  name: string;
  category: string | null;
  amount: string | null;
  expireDate: string;
}

function isOutOfStock(amount: string | null): boolean {
  if (!amount) return false;
  const match = amount.match(/^(\d+(?:\.\d+)?)/);
  if (!match) return false;
  return parseFloat(match[1]) === 0;
}

export default function NotificationBell() {
  const [items, setItems] = useState<Item[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/items");
      if (res.ok) setItems(await res.json());
    } catch (err) {
      console.error("Failed to fetch items for notification:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
    const interval = setInterval(fetchItems, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, [fetchItems]);

  useEffect(() => {
    const handleUpdate = () => fetchItems();
    window.addEventListener("fridge-items-updated", handleUpdate);
    return () =>
      window.removeEventListener("fridge-items-updated", handleUpdate);
  }, [fetchItems]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open]);

  const now = new Date();
  const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const expiringItems = items.filter(
    (item) =>
      new Date(item.expireDate) >= now &&
      new Date(item.expireDate) <= inThreeDays,
  );

  const expiredItems = items.filter((item) => new Date(item.expireDate) < now);

  const outOfStockItems = items.filter((item) => isOutOfStock(item.amount));

  const allNotificationItems = [
    ...expiredItems,
    ...expiringItems.filter(
      (ei) => !expiredItems.some((ex) => ex.id === ei.id),
    ),
    ...outOfStockItems.filter(
      (os) =>
        !expiredItems.some((ex) => ex.id === os.id) &&
        !expiringItems.some((ei) => ei.id === os.id),
    ),
  ];

  const getDaysText = (expireDate: string) => {
    const diff = new Date(expireDate).getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) {
      const absDays = Math.abs(days);
      if (absDays === 0) return "Expired today";
      if (absDays === 1) return "Expired yesterday";
      return `Expired ${absDays} days ago`;
    }
    if (days === 0) return "Expires today!";
    if (days === 1) return "Expires tomorrow!";
    return `${days} days left`;
  };

  const getItemBadge = (item: Item) => {
    const diff = new Date(item.expireDate).getTime() - now.getTime();
    const isExpired = diff < 0;
    const isUrgent = !isExpired && diff <= 24 * 60 * 60 * 1000;
    const outOfStock = isOutOfStock(item.amount);

    if (outOfStock && !isExpired) {
      return {
        label: "Out of Stock",
        color: "bg-red-100 text-red-700",
        iconColor: "text-red-500",
        bgColor: "bg-red-50",
      };
    }
    if (isExpired) {
      return {
        label: getDaysText(item.expireDate),
        color: isUrgent ? "bg-red-100 text-red-700" : "bg-red-100 text-red-700",
        iconColor: "text-red-500",
        bgColor: "bg-red-50",
      };
    }
    return {
      label: getDaysText(item.expireDate),
      color: isUrgent
        ? "bg-red-100 text-red-700"
        : "bg-amber-100 text-amber-700",
      iconColor: isUrgent ? "text-red-500" : "text-amber-500",
      bgColor: isUrgent ? "bg-red-50" : "bg-amber-50",
    };
  };

  const handleItemClick = (itemId: string) => {
    setOpen(false);
    router.push(`/?view=items&highlight=${itemId}`);
  };

  const badgeCount = allNotificationItems.length;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`btn-active relative flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 ${
          open
            ? "bg-zinc-100 text-zinc-900"
            : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
        }`}
        title="Notifications"
        aria-label={`Notifications${badgeCount > 0 ? `, ${badgeCount} items needing attention` : ""}`}
      >
        <Bell className="h-4.5 w-4.5" />
        {badgeCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 py-0.5 text-[10px] font-bold leading-none text-white shadow-sm ring-2 ring-white animate-scale-in">
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        )}
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="animate-scale-in w-full max-w-lg rounded-2xl border border-zinc-200/80 bg-white dark:bg-zinc-900 shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
              <div className="flex items-start justify-between border-b border-zinc-100 px-6 py-5">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900">
                    Expiring &amp; Out of Stock Notifications
                  </h3>
                  <p className="mt-0.5 text-sm text-zinc-500">
                    {badgeCount === 0
                      ? "Everything looks good!"
                      : badgeCount === 1
                        ? "1 item needs your attention"
                        : `${badgeCount} items need your attention`}
                  </p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="h-16 animate-pulse rounded-xl bg-zinc-100"
                      />
                    ))}
                  </div>
                ) : allNotificationItems.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
                      <Package className="h-6 w-6 text-green-500" />
                    </div>
                    <p className="text-base font-medium text-zinc-900">
                      All clear!
                    </p>
                    <p className="mt-1 text-sm text-zinc-500">
                      No items are expiring, expired, or out of stock.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {allNotificationItems.map((item) => {
                      const badge = getItemBadge(item);
                      const diff =
                        new Date(item.expireDate).getTime() - now.getTime();
                      const isExpired = diff < 0;
                      const isUrgent =
                        !isExpired && diff <= 24 * 60 * 60 * 1000;
                      const outOfStock = isOutOfStock(item.amount);

                      return (
                        <li key={item.id}>
                          <button
                            onClick={() => handleItemClick(item.id)}
                            className="group flex w-full items-center gap-3.5 rounded-xl border border-zinc-100 bg-white px-4 py-3.5 text-left transition-all duration-200 hover:border-zinc-200 hover:shadow-sm active:scale-[0.99]"
                          >
                            <div
                              className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-colors ${badge.bgColor} group-hover:brightness-95`}
                            >
                              {outOfStock && !isExpired ? (
                                <ShoppingCart
                                  className={`h-4.5 w-4.5 ${badge.iconColor}`}
                                />
                              ) : (
                                <AlertTriangle
                                  className={`h-4.5 w-4.5 ${badge.iconColor}`}
                                />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="truncate text-sm font-medium text-zinc-900 group-hover:text-zinc-700">
                                  {item.name}
                                </p>
                                {outOfStock && !isExpired && (
                                  <span className="flex-shrink-0 rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">
                                    OOS
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-400">
                                <Refrigerator className="h-3 w-3" />
                                {item.amount ?? "No amount set"}
                              </p>
                            </div>
                            <span
                              className={`flex-shrink-0 rounded-full px-3 py-1 text-[10px] font-semibold ${badge.color}`}
                            >
                              {badge.label}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-zinc-100 px-6 py-4">
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setOpen(false);
                    router.push("/?view=items");
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-zinc-800"
                >
                  <Refrigerator className="h-4 w-4" />
                  View All Fridge Items
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
