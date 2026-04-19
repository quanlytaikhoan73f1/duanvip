"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  ClipboardCheck,
  FileText,
  GitBranch,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppData } from "../providers/AppDataProvider";

const navItems = [
  { name: "Tổng quan", href: "/", icon: LayoutDashboard },
  { name: "Công trình", href: "/constructions", icon: Building2 },
  { name: "Tổ đội", href: "/teams", icon: Users },
  { name: "Chấm công", href: "/attendance", icon: ClipboardCheck },
  { name: "Báo cáo", href: "/reports", icon: FileText },
  { name: "Điều phối", href: "/approvals", icon: GitBranch },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data } = useAppData();

  const activeConstructions = data.constructions.filter((c) => c.status === "active").length;
  const pendingRequests = data.personnelRequests.filter((r) => r.status === "pending").length;

  return (
    <aside className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-slate-900/85 backdrop-blur md:sticky md:top-0 md:h-screen md:w-72 md:border-r md:border-t-0">
      <div className="flex h-full flex-col justify-between px-3 py-3 md:px-5 md:py-8">
        <div>
          {/* Logo / Brand */}
          <div className="mb-8 hidden md:block">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-amber-300">
                Hệ thống
              </p>
              <h1 className="mt-2 text-xl font-black uppercase tracking-tight text-slate-100 leading-tight">
                Quản lý<br />Thi công
              </h1>
              <p className="mt-2 text-xs text-slate-400">
                Tiến độ · Dòng tiền · Nhân sự
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="grid grid-cols-6 gap-1 md:grid-cols-1 md:gap-1.5">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;
              const hasBadge = item.href === "/approvals" && pendingRequests > 0;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex items-center justify-center gap-2.5 rounded-2xl px-2 py-3 text-center text-[10px] font-bold transition-all md:justify-start md:px-4 md:text-sm",
                    isActive
                      ? "bg-amber-500/15 text-amber-300 shadow-[0_0_30px_rgba(245,158,11,0.1)]"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="hidden md:inline">{item.name}</span>
                  {hasBadge && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white">
                      {pendingRequests}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Snapshot */}
        <div className="hidden rounded-3xl border border-white/10 bg-gradient-to-br from-amber-500/10 to-sky-500/10 p-5 md:block">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-300">Snapshot</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-slate-950/50 p-3">
              <div className="text-[10px] uppercase text-slate-500">CT đang thi</div>
              <div className="mt-1 text-xl font-black text-slate-100">{activeConstructions}</div>
            </div>
            <div className="rounded-2xl bg-slate-950/50 p-3">
              <div className="text-[10px] uppercase text-slate-500">Chờ duyệt</div>
              <div className={cn("mt-1 text-xl font-black", pendingRequests > 0 ? "text-rose-400" : "text-slate-100")}>
                {pendingRequests}
              </div>
            </div>
            <div className="rounded-2xl bg-slate-950/50 p-3 col-span-2">
              <div className="text-[10px] uppercase text-slate-500">Tổng nhân công</div>
              <div className="mt-1 font-black text-slate-100">{data.workers.length} người · {data.teams.length} tổ</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
