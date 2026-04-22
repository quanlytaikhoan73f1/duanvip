"use client";

import { useState } from "react";
import { useAppData } from "@/components/providers/AppDataProvider";
import { calcConstructionStats, calcFloorProgress } from "@/lib/calc";
import {
  formatCurrency,
  formatDate,
  getStatusClass,
  getStatusLabel,
  genId,
} from "@/lib/utils";
import { Building2, Plus, ChevronRight, X } from "lucide-react";
import Link from "next/link";
import type { ConstructionStatus } from "@/lib/types";

const STATUS_FILTERS = [
  { value: "all", label: "Tất cả" },
  { value: "active", label: "Đang thi công" },
  { value: "planning", label: "Lên kế hoạch" },
  { value: "paused", label: "Tạm dừng" },
  { value: "completed", label: "Hoàn thành" },
] as const;

export default function ConstructionsPage() {
  const { data, addConstruction } = useAppData();
  const [filter, setFilter] = useState<"all" | ConstructionStatus>("all");
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    name: "",
    address: "",
    contractValue: "",
    startDate: "",
    expectedEndDate: "",
    status: "planning" as ConstructionStatus,
    retentionRate: "5",
  });

  const filtered = data.constructions.filter(
    (c) => filter === "all" || c.status === filter
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    addConstruction({
      name: form.name,
      address: form.address,
      contractValue: Number(form.contractValue.replace(/\D/g, "")),
      startDate: form.startDate,
      expectedEndDate: form.expectedEndDate,
      status: form.status,
      retentionRate: Number(form.retentionRate),
    });
    setShowForm(false);
    setForm({ name: "", address: "", contractValue: "", startDate: "", expectedEndDate: "", status: "planning", retentionRate: "5" });
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="section-title">Module 1</p>
          <h2 className="mt-2 text-3xl font-black text-slate-100">Công trình</h2>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-400 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Thêm công trình
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value as typeof filter)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
              filter === f.value
                ? "bg-amber-500 text-slate-950"
                : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((c) => {
          const stats = calcConstructionStats(c, data);
          return (
            <Link
              key={c.id}
              href={`/constructions/${c.id}`}
              className="glass-card group rounded-3xl p-6 hover:bg-white/6 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${getStatusClass(c.status)}`}>
                      {getStatusLabel(c.status)}
                    </span>
                    {c.status === "active" && (
                      <span className="text-xs text-slate-500">
                        {stats.activeTeams} tổ · {stats.workerCount} người
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2 font-black text-slate-100 text-lg leading-tight">{c.name}</h3>
                  <p className="mt-1 text-xs text-slate-500">{c.address}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0 mt-1" />
              </div>

              {/* Progress */}
              <div className="mt-5">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-400 font-bold">Tiến độ tổng</span>
                  <span className="text-amber-300 font-black">{stats.totalProgress.toFixed(1)}%</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-700/60">
                  <div
                    className="h-2.5 rounded-full bg-gradient-to-r from-amber-500 to-emerald-400"
                    style={{ width: `${Math.min(100, stats.totalProgress)}%` }}
                  />
                </div>
              </div>

              {/* Floor chips */}
              <div className="mt-3 flex gap-1.5 flex-wrap">
                {c.floors.map((f) => {
                  const p = calcFloorProgress(f);
                  return (
                    <div key={f.id} className="flex items-center gap-1 rounded-lg bg-slate-800/60 px-2 py-1">
                      <div
                        className="h-1.5 w-1.5 rounded-full shrink-0"
                        style={{ background: p >= 100 ? "#10b981" : p > 0 ? "#f59e0b" : "#475569" }}
                      />
                      <span className="text-[10px] text-slate-400">{f.name}</span>
                      <span className="text-[10px] font-bold text-slate-300">{p.toFixed(0)}%</span>
                    </div>
                  );
                })}
                {c.floors.length === 0 && (
                  <span className="text-[11px] text-slate-500 italic">Chưa có tầng nào</span>
                )}
              </div>

              {/* Stats */}
              <div className="mt-4 grid grid-cols-3 gap-3 border-t border-white/5 pt-4">
                <div>
                  <div className="text-[10px] uppercase text-slate-500">Hợp đồng</div>
                  <div className="mt-1 text-sm font-black text-slate-200">
                    {formatCurrency(c.contractValue)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-slate-500">Bảo lưu</div>
                  <div className="mt-1 text-sm font-black text-rose-300">
                    {formatCurrency(stats.totalRetention)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-slate-500">Chi phí</div>
                  <div className="mt-1 text-sm font-black text-slate-200">
                    {formatCurrency(stats.totalExpense)}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex justify-between text-xs text-slate-500">
                <span>Bắt đầu: {formatDate(c.startDate)}</span>
                <span>Dự kiến: {formatDate(c.expectedEndDate)}</span>
              </div>
            </Link>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-2 glass-card rounded-3xl p-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-slate-600 mb-4" />
            <p className="text-slate-400">Chưa có công trình nào.</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 text-sm font-bold text-amber-400 hover:underline"
            >
              Thêm công trình đầu tiên →
            </button>
          </div>
        )}
      </div>

      {/* Add Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg rounded-3xl p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-100">Thêm công trình mới</h3>
              <button onClick={() => setShowForm(false)} className="rounded-xl p-1.5 text-slate-400 hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Tên công trình *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nhà phố Quận 7 - Ông Minh"
                  className="w-full rounded-xl bg-slate-800/60 border border-white/10 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-500/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Địa chỉ</label>
                <input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="142 Lê Văn Lương, Q.7, TP.HCM"
                  className="w-full rounded-xl bg-slate-800/60 border border-white/10 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-500/50 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Giá trị HĐ (VNĐ) *</label>
                  <input
                    required
                    type="number"
                    value={form.contractValue}
                    onChange={(e) => setForm({ ...form, contractValue: e.target.value })}
                    placeholder="3200000000"
                    className="w-full rounded-xl bg-slate-800/60 border border-white/10 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-500/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">% Bảo lưu</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={form.retentionRate}
                    onChange={(e) => setForm({ ...form, retentionRate: e.target.value })}
                    className="w-full rounded-xl bg-slate-800/60 border border-white/10 px-3 py-2.5 text-sm text-slate-100 focus:border-amber-500/50 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Ngày bắt đầu *</label>
                  <input
                    required
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full rounded-xl bg-slate-800/60 border border-white/10 px-3 py-2.5 text-sm text-slate-100 focus:border-amber-500/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Dự kiến xong</label>
                  <input
                    type="date"
                    value={form.expectedEndDate}
                    onChange={(e) => setForm({ ...form, expectedEndDate: e.target.value })}
                    className="w-full rounded-xl bg-slate-800/60 border border-white/10 px-3 py-2.5 text-sm text-slate-100 focus:border-amber-500/50 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Trạng thái</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as ConstructionStatus })}
                  className="w-full rounded-xl bg-slate-800/60 border border-white/10 px-3 py-2.5 text-sm text-slate-100 focus:border-amber-500/50 focus:outline-none"
                >
                  <option value="planning">Lên kế hoạch</option>
                  <option value="active">Đang thi công</option>
                  <option value="paused">Tạm dừng</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-2xl border border-white/10 py-2.5 text-sm font-bold text-slate-400 hover:bg-white/5"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-2xl bg-amber-500 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-400"
                >
                  Thêm công trình
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
