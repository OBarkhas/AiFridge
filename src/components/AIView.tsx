"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import {
  Send,
  Bot,
  User,
  Loader2,
  ChefHat,
  CalendarCheck,
  Check,
  AlertCircle,
  Sparkles,
  Plus,
  Trash2,
  MessageSquare,
  Clock,
} from "lucide-react";

interface RecipeAction {
  title: string;
  description?: string;
  ingredients: string;
  instructions: string;
}

interface MealPlanAction {
  dayOfWeek: string;
  mealType: string;
  recipeTitle: string;
  instructions?: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  actions?: {
    recipes: RecipeAction[];
    mealPlans: MealPlanAction[];
  };
  importedRecipeIndices?: number[];
  importedMealPlanIndices?: number[];
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

const GREETING_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "Hello! I'm your AI cooking assistant. I can see everything in your fridge and your saved recipes. Ask me for meal ideas, cooking tips, or help planning your weekly meals!",
};

const SUGGESTIONS = [
  "What can I cook with what's expiring soon?",
  "Give me tips to preserve vegetables longer",
  "Suggest a weekly meal plan using my ingredients",
  "What's a good recipe for leftover ingredients?",
];

function getStorageKey(userId?: string | null): string {
  return userId ? `ai-fridge-chat-sessions-${userId}` : "ai-fridge-chat-sessions";
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function generateTitle(messages: ChatMessage[]): string {
  const firstUserMsg = messages.find((m) => m.role === "user");
  if (firstUserMsg) {
    const text = firstUserMsg.content.replace(/[^\w\s]/g, "").trim();
    return text.length > 48 ? text.slice(0, 48) + "\u2026" : text;
  }
  return "New Chat";
}

function hasContent(messages: ChatMessage[]): boolean {
  return (
    messages.length > 1 || messages[0]?.content !== GREETING_MESSAGE.content
  );
}

export default function AIView({
  initialPrompt,
  onPromptSent,
}: {
  initialPrompt?: string | null;
  onPromptSent?: () => void;
}) {
  const { user } = useUser();
  const userIdRef = useRef(user?.id);
  userIdRef.current = user?.id;

  const loadSessions = useCallback((): ChatSession[] => {
    try {
      const key = getStorageKey(userIdRef.current);
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, []);

  const saveSessions = useCallback((sessions: ChatSession[]) => {
    try {
      const key = getStorageKey(userIdRef.current);
      localStorage.setItem(key, JSON.stringify(sessions));
    } catch {}
  }, []);

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState<{
    type: string;
    index: number;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeSessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

  useEffect(() => {
    const stored = loadSessions();
    setSessions(stored);
    if (stored.length > 0) {
      const mostRecent = stored.reduce((a, b) =>
        a.updatedAt > b.updatedAt ? a : b,
      );
      setActiveSessionId(mostRecent.id);
      setMessages(mostRecent.messages);
    }
  }, []);

  useEffect(() => {
    if (initialPrompt) {
      onPromptSent?.();

      const timer = setTimeout(() => {
        handleSend(initialPrompt);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [initialPrompt]);

  const skipNextSave = useRef(true);
  useEffect(() => {
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    if (sessions.length > 0) {
      saveSessions(sessions);
    }
  }, [sessions, saveSessions]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const persistMessages = useCallback(
    (newMessages: ChatMessage[], sessionId: string | null) => {
      if (!sessionId) return;
      setSessions((prev) => {
        const idx = prev.findIndex((s) => s.id === sessionId);
        if (idx === -1) return prev;
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          messages: newMessages,
          title:
            updated[idx].title === "New Chat"
              ? generateTitle(newMessages)
              : updated[idx].title,
          updatedAt: Date.now(),
        };
        return updated;
      });
    },
    [],
  );

  const handleNewChat = useCallback(() => {
    if (activeSessionId && hasContent(messages)) {
      persistMessages(messages, activeSessionId);
    }
    const newId = generateId();
    const newSession: ChatSession = {
      id: newId,
      title: "New Chat",
      messages: [GREETING_MESSAGE],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setActiveSessionId(newId);
    setMessages([GREETING_MESSAGE]);
    setInput("");
    setError(null);
    setSessions((prev) => [newSession, ...prev]);
  }, [activeSessionId, messages, persistMessages]);

  const handleSelectSession = useCallback(
    (sessionId: string) => {
      if (sessionId === activeSessionId) return;

      if (activeSessionId && hasContent(messages)) {
        persistMessages(messages, activeSessionId);
      }
      const session = sessions.find((s) => s.id === sessionId);
      if (session) {
        setActiveSessionId(sessionId);
        setMessages(session.messages);
        setInput("");
        setError(null);
        setLoading(false);
      }
    },
    [activeSessionId, messages, sessions, persistMessages],
  );

  const handleDeleteSession = useCallback(
    (sessionId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setSessions((prev) => {
        const updated = prev.filter((s) => s.id !== sessionId);
        saveSessions(updated);
        return updated;
      });
      if (sessionId === activeSessionId) {
        const remaining = sessions.filter((s) => s.id !== sessionId);
        if (remaining.length > 0) {
          const mostRecent = remaining.reduce((a, b) =>
            a.updatedAt > b.updatedAt ? a : b,
          );
          setActiveSessionId(mostRecent.id);
          setMessages(mostRecent.messages);
        } else {
          const newId = generateId();
          const newSession: ChatSession = {
            id: newId,
            title: "New Chat",
            messages: [GREETING_MESSAGE],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          setActiveSessionId(newId);
          setMessages([GREETING_MESSAGE]);
          setSessions([newSession]);
        }
      }
    },
    [activeSessionId, sessions, saveSessions],
  );

  const handleSend = useCallback(
    async (overrideText?: string) => {
      const text = (overrideText ?? input).trim();
      if (!text || loading) return;

      setInput("");
      setError(null);

      const userMessage: ChatMessage = { role: "user", content: text };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setLoading(true);

      let currentSessionId = activeSessionId;
      if (!currentSessionId) {
        currentSessionId = generateId();
        const newSession: ChatSession = {
          id: currentSessionId,
          title: generateTitle(updatedMessages),
          messages: updatedMessages,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setActiveSessionId(currentSessionId);
        setSessions((prev) => [newSession, ...prev]);
      } else {
        persistMessages(updatedMessages, currentSessionId);
      }

      try {
        const history = [...messages, userMessage].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history }),
        });

        if (currentSessionId !== activeSessionIdRef.current) return;

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Failed to get response");
        }

        const data: {
          message: string;
          actions: { recipes: RecipeAction[]; mealPlans: MealPlanAction[] };
        } = await res.json();

        if (currentSessionId !== activeSessionIdRef.current) return;

        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: data.message,
          actions: data.actions,
          importedRecipeIndices: [],
          importedMealPlanIndices: [],
        };

        const finalMessages = [...updatedMessages, assistantMessage];
        setMessages(finalMessages);

        if (currentSessionId) {
          persistMessages(finalMessages, currentSessionId);
        }
      } catch (err) {
        if (currentSessionId !== activeSessionIdRef.current) return;

        const msg =
          err instanceof Error ? err.message : "An unexpected error occurred.";
        setError(msg);
        const errorMessage: ChatMessage = {
          role: "assistant",
          content: `Sorry, I ran into an issue: ${msg}. Please try again.`,
        };
        const finalMessages = [...updatedMessages, errorMessage];
        setMessages(finalMessages);
        if (currentSessionId) {
          persistMessages(finalMessages, currentSessionId);
        }
      } finally {
        setLoading(false);
      }
    },
    [input, loading, messages, activeSessionId, persistMessages],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImportRecipe = async (
    messageIndex: number,
    recipeIndex: number,
    recipe: RecipeAction,
  ) => {
    setImporting({ type: "recipe", index: recipeIndex });
    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: recipe.title,
          description: recipe.description ?? null,
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to import recipe");
      }

      const newMessages = messages.map((msg, i) =>
        i === messageIndex && msg.role === "assistant"
          ? {
              ...msg,
              importedRecipeIndices: [
                ...(msg.importedRecipeIndices ?? []),
                recipeIndex,
              ],
            }
          : msg,
      );
      setMessages(newMessages);
      if (activeSessionId) {
        persistMessages(newMessages, activeSessionId);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to import";
      alert(`Could not import recipe: ${msg}`);
    } finally {
      setImporting(null);
    }
  };

  const handleImportMealPlan = async (
    messageIndex: number,
    planIndex: number,
    plan: MealPlanAction,
  ) => {
    setImporting({ type: "mealplan", index: planIndex });
    try {
      const res = await fetch("/api/meal-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayOfWeek: plan.dayOfWeek,
          mealType: plan.mealType,
          recipeTitle: plan.recipeTitle,
          instructions: plan.instructions ?? null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to import meal plan");
      }

      const newMessages = messages.map((msg, i) =>
        i === messageIndex && msg.role === "assistant"
          ? {
              ...msg,
              importedMealPlanIndices: [
                ...(msg.importedMealPlanIndices ?? []),
                planIndex,
              ],
            }
          : msg,
      );
      setMessages(newMessages);
      if (activeSessionId) {
        persistMessages(newMessages, activeSessionId);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to import";
      alert(`Could not import meal plan: ${msg}`);
    } finally {
      setImporting(null);
    }
  };

  const formatContent = (content: string) => {
    let clean = content
      .replace(/---BEGIN_RECIPE---[\s\S]*?---END_RECIPE---/g, "")
      .replace(/---BEGIN_MEALPLAN---[\s\S]*?---END_MEALPLAN---/g, "")
      .trim();

    if (!clean) return [];

    const parts: Array<{ type: "text" | "code"; content: string }> = [];
    let buffer = "";
    let isCodeBlock = false;

    const lines = clean.split("\n");
    for (const line of lines) {
      if (line.trimStart().startsWith("```")) {
        if (buffer) {
          parts.push({ type: isCodeBlock ? "code" : "text", content: buffer });
          buffer = "";
        }
        isCodeBlock = !isCodeBlock;
        continue;
      }
      buffer += (buffer ? "\n" : "") + line;
    }

    if (buffer) {
      parts.push({ type: isCodeBlock ? "code" : "text", content: buffer });
    }

    return parts;
  };

  const isImportingRecipe = (idx: number) =>
    importing?.type === "recipe" && importing.index === idx;
  const isImportingMealPlan = (idx: number) =>
    importing?.type === "mealplan" && importing.index === idx;

  const isRecipeImported = (msg: ChatMessage, idx: number) =>
    (msg.importedRecipeIndices ?? []).includes(idx);

  const isMealPlanImported = (msg: ChatMessage, idx: number) =>
    (msg.importedMealPlanIndices ?? []).includes(idx);

  const sortedSessions = [...sessions].sort(
    (a, b) => b.updatedAt - a.updatedAt,
  );

  return (
    <div className="flex h-full w-full">
      <div className="flex-shrink-0 w-72 border-r border-zinc-200 bg-zinc-50/50 flex flex-col">
        <div className="border-b border-zinc-200 px-3 py-3">
          <button
            onClick={handleNewChat}
            className="w-full bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-900 font-medium rounded-lg p-2.5 flex items-center gap-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>New Chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-3">
          {sortedSessions.length === 0 ? (
            <div className="flex flex-col items-center px-4 py-12 text-center">
              <MessageSquare className="mb-3 h-8 w-8 text-zinc-300" />
              <p className="text-sm text-zinc-400">No chat history yet</p>
              <p className="mt-1 text-xs text-zinc-300">
                Start a new conversation above
              </p>
            </div>
          ) : (
            <ul className="space-y-0.5">
              {sortedSessions.map((session) => {
                const isActive = session.id === activeSessionId;
                return (
                  <li key={session.id}>
                    <div
                      onClick={() => handleSelectSession(session.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleSelectSession(session.id);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      className={`group relative flex w-full cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all duration-150 ${
                        isActive ? "bg-zinc-100" : "hover:bg-zinc-50"
                      }`}
                    >
                      <div className="flex-shrink-0 pt-0.5">
                        <MessageSquare
                          className={`h-4 w-4 ${
                            isActive ? "text-zinc-700" : "text-zinc-400"
                          }`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-sm ${
                            isActive
                              ? "font-medium text-zinc-900"
                              : "font-normal text-zinc-600"
                          }`}
                        >
                          {session.title}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-zinc-400">
                          <Clock className="h-3 w-3" />
                          {new Date(session.updatedAt).toLocaleDateString(
                            undefined,
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSession(session.id, e);
                        }}
                        className="flex-shrink-0 rounded-md p-1 text-zinc-300 opacity-0 transition-all duration-150 hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 focus:opacity-100"
                        title="Delete chat"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full bg-white">
        <div className="flex items-center gap-3 border-b border-zinc-200 px-4 py-4 sm:px-6">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-900 shadow-sm">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold text-zinc-900">
              {activeSessionId
                ? (sessions.find((s) => s.id === activeSessionId)?.title ??
                  "AI Cooking Assistant")
                : "AI Cooking Assistant"}
            </h1>
            <p className="text-[11px] text-zinc-400">
              Powered by Groq AI &middot; Knows your fridge
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="mx-auto max-w-3xl space-y-5">
            {messages.length === 1 && !loading && (
              <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-zinc-500" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Try asking
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleSend(suggestion)}
                      className="rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-medium text-zinc-600 shadow-sm transition-all duration-150 hover:border-zinc-300 hover:bg-white hover:text-zinc-900"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, msgIdx) => (
              <div
                key={msgIdx}
                className={`flex gap-3 ${
                  msg.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                    msg.role === "user"
                      ? "bg-zinc-200"
                      : "bg-zinc-900 shadow-sm"
                  }`}
                >
                  {msg.role === "user" ? (
                    <User className="h-4 w-4 text-zinc-500" />
                  ) : (
                    <Bot className="h-4 w-4 text-white" />
                  )}
                </div>

                <div
                  className={`max-w-[85%] space-y-2 ${
                    msg.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-zinc-900 text-white shadow-sm"
                        : "border border-zinc-200 bg-white text-zinc-800 shadow-sm"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="space-y-2 text-sm leading-relaxed">
                        {formatContent(msg.content).map((part, i) =>
                          part.type === "code" ? (
                            <pre
                              key={i}
                              className="overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-700"
                            >
                              <code>{part.content}</code>
                            </pre>
                          ) : (
                            <p key={i} className="whitespace-pre-wrap">
                              {part.content}
                            </p>
                          ),
                        )}
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    )}
                  </div>

                  {msg.role === "assistant" && msg.actions && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {msg.actions.recipes.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {msg.actions.recipes.map((recipe, rIdx) => (
                            <button
                              key={`recipe-${rIdx}`}
                              onClick={() =>
                                handleImportRecipe(msgIdx, rIdx, recipe)
                              }
                              disabled={
                                isImportingRecipe(rIdx) ||
                                isRecipeImported(msg, rIdx)
                              }
                              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                                isRecipeImported(msg, rIdx)
                                  ? "border-green-200 bg-green-50 text-green-700"
                                  : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
                              } disabled:cursor-not-allowed disabled:opacity-60`}
                            >
                              {isImportingRecipe(rIdx) ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : isRecipeImported(msg, rIdx) ? (
                                <Check className="h-3.5 w-3.5" />
                              ) : (
                                <ChefHat className="h-3.5 w-3.5" />
                              )}
                              {isRecipeImported(msg, rIdx)
                                ? "Imported \u2713"
                                : `Import "${recipe.title}"`}
                            </button>
                          ))}
                        </div>
                      )}

                      {msg.actions.mealPlans.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {msg.actions.mealPlans.map((plan, pIdx) => (
                            <button
                              key={`mealplan-${pIdx}`}
                              onClick={() =>
                                handleImportMealPlan(msgIdx, pIdx, plan)
                              }
                              disabled={
                                isImportingMealPlan(pIdx) ||
                                isMealPlanImported(msg, pIdx)
                              }
                              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                                isMealPlanImported(msg, pIdx)
                                  ? "border-green-200 bg-green-50 text-green-700"
                                  : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
                              } disabled:cursor-not-allowed disabled:opacity-60`}
                            >
                              {isImportingMealPlan(pIdx) ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : isMealPlanImported(msg, pIdx) ? (
                                <Check className="h-3.5 w-3.5" />
                              ) : (
                                <CalendarCheck className="h-3.5 w-3.5" />
                              )}
                              {isMealPlanImported(msg, pIdx)
                                ? "Imported \u2713"
                                : `Add ${plan.recipeTitle} (${plan.mealType} \u2014 ${plan.dayOfWeek})`}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-zinc-900 shadow-sm">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                  <span className="text-sm text-zinc-500">Thinking...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="border-t border-zinc-200 bg-white px-4 pb-4 pt-3 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Ask about your ingredients, recipes, or meal planning..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 pr-12 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm transition-colors focus:border-zinc-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-300 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-sm transition-all duration-150 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] text-zinc-400">
              AI suggestions are generated based on your fridge contents and
              saved recipes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
