"use client";

import Sidebar from "./Sidebar";

interface PageShellProps {
  children: React.ReactNode;
}

export default function PageShell({ children }: PageShellProps) {
  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar />
      <main className="ml-64 flex-1">{children}</main>
    </div>
  );
}
