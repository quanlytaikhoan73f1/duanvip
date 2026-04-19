"use client";

import { useAppData } from "@/components/providers/AppDataProvider";
import { calcConstructionStats, calcDashboardStats, calcFloorProgress } from "@/lib/calc";
import { formatCurrency, formatDate, getStatusClass, getStatusLabel } from "@/lib/utils";
import { Building2, Users, Clock, TrendingUp, FileText, GitBranch } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { data } = useAppData();
  const dash = calcDashboardStats(data);

  const recentReports = [...data.dailyReports]
    .sort((a, b) => (b.date > a.date ? 1 : -1))
    .slice(0, 5);

  const pendingRequests = data.personnelRequests.filter((r) => r.status === "pending");

  return (
    <div className="space-y-8">
      <div>
        <p className="section-title">Hệ thống quản lý thi công</p>
        <h2 className="mt-2 text-3xl font-black text-slate-100">Tổng quan</h2>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          {
            label: "Đang thi công",
            value: dash.activeConstructions,
            unit: "công trình",
            icon: Building2,
            color: "text-emerald-400 bg-emerald-500/15",
          },
          {
            label: "Nhân công hôm nay",
            value: dash.totalWorkersToday,
            unit: "người đi làm",
            icon: Users,
            color: "text-sky-400 bg-sky-500/15",
          },
          {
            label: "Chờ duyệt",
            value: dash.pendingRequests,
            unit: "yêu cầu điều phối",
            icon: GitBranch,
            color: "text-rose-400 bg-rose-500/15",
            valueClass: dash.pendingRequests > 0 ? "text-rose-400" : undefined,
          },
          {
            label: "Chi phí hôm nay",
            value: formatCurrency(dash.totalExpenseToday),
            unit: "ăn + vật tư",
            icon: TrendingUp,
            color: "text-amber-400 bg-amber-500/15",
          },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="glass-card rounded-3xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className={`rounded-2xl p-2.5 ${kpi.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 leading-tight">
                  {kpi.label}
                </span>
              </div>
              <div className={`text-2xl font-black ${kpi.valueClass ?? "text-slate-100"}`}>
                {kpi.value}
              </div>
              <div className="mt-1 text-xs text-slate-500">{kpi.unit}</div>
            </div>
          );
        })}
      </div>

      {/* Construction Progress */}
      <div className="glass-card rounded-3xl p-6">
        <div className="mb-5 flex items-center justify-between">
          <p className="section-title">Tiến độ công trình</p>
          <Link href="/constructions" className="text-xs font-bold text-amber-400 hover:text-amber-300">
            Xem tất cả →
          </Link>
        </div>
        <div className="space-y-4">
          {data.constructions
            .filter((c) => c.status === "active")
            .map((c) => {
              const stats = calcConstructionStats(c, data);
              return (
                <Link
                  key={c.id}
                  href={`/constructions/${c.id}`}
                  className="block rounded-2xl border border-white/5 bg-white/3 p-4 hover:bg-white/6 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${getStatusClass(c.status)}`}>
                          {getStatusLabel(c.status)}
                        </span>
                        <span className="text-xs text-slate-500">
                          {stats.activeTeams} tổ · {stats.workerCount} người
                        </span>
                      </div>
                      <p className="mt-1.5 font-bold text-slate-100 truncate">{c.name}</p>
                      <p className="text-xs text-slate-500 truncate">{c.address}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-2xl font-black text-amber-300">
                        {stats.totalProgress.toFixed(1)}%
                      </div>
                      <div className="text-xs text-slate-500">tiến độ</div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="h-2 w-full rounded-full bg-slate-700/60">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all"
                        style={{ width: `${Math.min(100, stats.totalProgress)}%` }}
                      />
                    </div>
                    <div className="mt-2 flex justify-between text-xs text-slate-500">
                      <span>Bảo lưu: {formatCurrency(stats.totalRetention)}</span>
                      <span>Chi phí: {formatCurrency(stats.totalExpense)}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-1.5 flex-wrap">
                    {c.floors.map((f) => {
                      const p = calcFloorProgress(f);
                      return (
                        <div key={f.id} className="flex items-center gap-1 rounded-lg bg-slate-800/60 px-2 py-1">
                          <div
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ background: p >= 100 ? "#10b981" : p > 0 ? "#f59e0b" : "#475569" }}
                          />
                          <span className="text-[10px] text-slate-400">{f.name}</span>
                          <span className="text-[10px] font-bold text-slate-300">{p.toFixed(0)}%</span>
                        </div>
                      );
                    })}
                  </div>
                </Link>
              );
            })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Recent Reports */}
        <div className="glass-card rounded-3xl p-6">
          <div className="mb-5 flex items-center justify-between">
            <p className="section-title">Báo cáo gần đây</p>
            <Link href="/reports" className="text-xs font-bold text-amber-400 hover:text-amber-300">
              Xem tất cả →
            </Link>
          </div>
          <div className="space-y-3">
            {recentReports.length === 0 && (
              <p className="text-sm text-slate-500">Chưa có báo cáo nào.</p>
            )}
            {recentReports.map((r) => {
              const team = data.teams.find((t) => t.id === r.teamId);
              const ct = data.constructions.find((c) => c.id === r.constructionId);
              const floor = ct?.floors.find((f) => f.id === r.floorId);
              const totalExpense = r.foodExpense + r.materialExpense + r.otherExpense;
              return (
                <div key={r.id} className="flex items-center gap-3 rounded-2xl bg-white/3 p-3">
                  <div className="rounded-xl bg-sky-500/10 p-2 shrink-0">
                    <FileText className="h-4 w-4 text-sky-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-200 truncate">
                      {team?.name} · {floor?.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{ct?.name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-slate-200">
                      {r.completedVolume} {floor?.unit}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDate(r.date)} · {formatCurrency(totalExpense)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="glass-card rounded-3xl p-6">
          <div className="mb-5 flex items-center justify-between">
            <p className="section-title">Yêu cầu chờ duyệt</p>
            <Link href="/approvals" className="text-xs font-bold text-amber-400 hover:text-amber-300">
              Xem tất cả →
            </Link>
          </div>
          <div className="space-y-3">
            {pendingRequests.length === 0 && (
              <p className="text-sm text-slate-500">Không có yêu cầu nào chờ duyệt.</p>
            )}
            {pendingRequests.map((req) => {
              const team = data.teams.find((t) => t.id === req.teamId);
              const requester = data.workers.find((w) => w.id === req.requestedBy);
              const typeLabel =
                req.type === "add" ? "Thêm người" : req.type === "remove" ? "Giảm người" : "Chuyển người";
              const typeClass =
                req.type === "add"
                  ? "bg-emerald-500/15 text-emerald-300"
                  : req.type === "remove"
                  ? "bg-rose-500/15 text-rose-300"
                  : "bg-sky-500/15 text-sky-300";
              return (
                <div key={req.id} className="rounded-2xl bg-white/3 p-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${typeClass}`}>
                      {typeLabel}
                    </span>
                    <span className="text-xs text-slate-400">{team?.name}</span>
                  </div>
                  <p className="mt-1.5 text-sm font-bold text-slate-200">{requester?.name}</p>
                  <p className="text-xs text-slate-500 line-clamp-2">{req.reason}</p>
                  <div className="mt-2 flex justify-end">
                    <Link href="/approvals" className="text-xs font-bold text-amber-400 hover:underline">
                      Xem & duyệt →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { href: "/constructions", label: "Thêm công trình", icon: Building2, color: "text-emerald-400 bg-emerald-500/10" },
          { href: "/teams", label: "Quản lý tổ đội", icon: Users, color: "text-sky-400 bg-sky-500/10" },
          { href: "/reports", label: "Nộp báo cáo ngày", icon: FileText, color: "text-amber-400 bg-amber-500/10" },
          { href: "/attendance", label: "Chấm công hôm nay", icon: Clock, color: "text-violet-400 bg-violet-500/10" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="glass-card flex items-center gap-3 rounded-2xl p-4 hover:bg-white/8 transition-colors"
            >
              <div className={`rounded-xl p-2 ${item.color} shrink-0`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-bold text-slate-200">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
