"use client";

import Sidebar from "./Sidebar";

interface PageShellProps {
  children: React.ReactNode;
}

export default function PageShell({ children }: PageShellProps) {
  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar />
      <main className="ml-0 flex-1 pb-20 md:ml-64 md:pb-0">{children}</main>
    </div>
  );
}
