"use client";

import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 md:flex-row">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <div className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
