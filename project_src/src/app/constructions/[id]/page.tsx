"use client";

import { use, useState } from "react";
import { useAppData } from "@/components/providers/AppDataProvider";
import { calcConstructionStats, calcFloorProgress, calcFloorRetention } from "@/lib/calc";
import {
  formatCurrency,
  formatDate,
  getStatusClass,
  getStatusLabel,
  todayISO,
} from "@/lib/utils";
import { ArrowLeft, Plus, X, Users, TrendingUp } from "lucide-react";
import Link from "next/link";
import type { FloorStatus } from "@/lib/types";

export default function ConstructionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, addFloor, updateFloor, updateConstruction } = useAppData();

  const construction = data.constructions.find((c) => c.id === id);
  const [showFloorForm, setShowFloorForm] = useState(false);
  const [floorForm, setFloorForm] = useState({
    name: "",
    plannedVolume: "",
    unit: "m²",
    contractValue: "",
    retentionRate: construction?.retentionRate.toString() ?? "5",
  });

  if (!construction) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">Không tìm thấy công trình.</p>
      </div>
    );
  }

  const stats = calcConstructionStats(construction, data);
  const activeAssignments = data.assignments.filter(
    (a) => a.constructionId === id && a.status === "active"
  );

  const reports = data.dailyReports
    .filter((r) => r.constructionId === id && r.status === "submitted")
    .sort((a, b) => (b.date > a.date ? 1 : -1))
    .slice(0, 8);

  function handleAddFloor(e: React.FormEvent) {
    e.preventDefault();
    addFloor({
      constructionId: id,
      name: floorForm.name,
      plannedVolume: Number(floorForm.plannedVolume),
      completedVolume: 0,
      unit: floorForm.unit,
      contractValue: Number(floorForm.contractValue),
      retentionRate: Number(floorForm.retentionRate),
      status: "not_started",
    });
    setShowFloorForm(false);
    setFloorForm({ name: "", plannedVolume: "", unit: "m²", contractValue: "", retentionRate: construction.retentionRate.toString() });
  }

  return (
    <div className="space-y-8">
      {/* Back + Header */}
      <div>
        <Link href="/constructions" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 mb-4">
          <ArrowLeft className="h-4 w-4" /> Danh sách công trình
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${getStatusClass(construction.status)}`}>
              {getStatusLabel(construction.status)}
            </span>
            <h2 className="mt-2 text-2xl font-black text-slate-100">{construction.name}</h2>
            <p className="text-sm text-slate-400">{construction.address}</p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-3xl font-black text-amber-300">{stats.totalProgress.toFixed(1)}%</div>
            <div className="text-xs text-slate-500">tổng tiến độ</div>
          </div>
        </div>
        <div className="mt-4 h-3 w-full rounded-full bg-slate-700/60">
          <div
            className="h-3 rounded-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all"
            style={{ width: `${Math.min(100, stats.totalProgress)}%` }}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Giá trị HĐ", value: formatCurrency(construction.contractValue), sub: `Bảo lưu ${construction.retentionRate}%` },
          { label: "Tổng bảo lưu", value: formatCurrency(stats.totalRetention), sub: "Tích lũy theo tiến độ", valueClass: "text-rose-300" },
          { label: "Tổng chi phí", value: formatCurrency(stats.totalExpense), sub: "Ăn + vật tư + khác" },
          { label: "Nhân sự", value: `${stats.workerCount} người`, sub: `${stats.activeTeams} tổ đang làm` },
        ].map((item) => (
          <div key={item.label} className="glass-card rounded-3xl p-5">
            <div className="text-[10px] uppercase text-slate-500 font-bold">{item.label}</div>
            <div className={`mt-2 text-xl font-black ${item.valueClass ?? "text-slate-100"}`}>{item.value}</div>
            <div className="mt-1 text-xs text-slate-500">{item.sub}</div>
          </div>
        ))}
      </div>

      {/* Floors */}
      <div className="glass-card rounded-3xl p-6">
        <div className="mb-5 flex items-center justify-between">
          <p className="section-title">Danh sách tầng & tiến độ</p>
          <button
            onClick={() => setShowFloorForm(true)}
            className="flex items-center gap-1.5 rounded-xl bg-amber-500/15 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/25"
          >
            <Plus className="h-3.5 w-3.5" /> Thêm tầng
          </button>
        </div>

        <div className="space-y-4">
          {construction.floors.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-8">Chưa có tầng nào. Thêm tầng để theo dõi tiến độ.</p>
          )}
          {construction.floors.map((floor) => {
            const progress = calcFloorProgress(floor);
            const retention = calcFloorRetention(floor);
            const assignment = activeAssignments.find((a) => a.floorId === floor.id);
            const team = assignment ? data.teams.find((t) => t.id === assignment.teamId) : null;

            return (
              <div key={floor.id} className="rounded-2xl border border-white/5 bg-white/3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-slate-100">{floor.name}</h4>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${getStatusClass(floor.status)}`}>
                        {getStatusLabel(floor.status)}
                      </span>
                      {team && (
                        <span className="flex items-center gap-1 rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold text-sky-300">
                          <Users className="h-3 w-3" /> {team.name}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex gap-4 text-xs text-slate-500">
                      <span>KH: {floor.plannedVolume} {floor.unit}</span>
                      <span>Đã làm: {floor.completedVolume} {floor.unit}</span>
                      <span>HĐ: {formatCurrency(floor.contractValue)}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xl font-black text-amber-300">{progress.toFixed(1)}%</div>
                    <div className="text-xs text-rose-300">BL: {formatCurrency(retention)}</div>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="h-2 w-full rounded-full bg-slate-700/60">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, progress)}%`,
                        background: progress >= 100 ? "#10b981" : "linear-gradient(to right, #f59e0b, #10b981)",
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Assignments */}
      {activeAssignments.length > 0 && (
        <div className="glass-card rounded-3xl p-6">
          <p className="section-title mb-5">Tổ đội đang thi công</p>
          <div className="space-y-3">
            {activeAssignments.map((a) => {
              const team = data.teams.find((t) => t.id === a.teamId);
              const floor = construction.floors.find((f) => f.id === a.floorId);
              const members = data.workers.filter((w) => team?.memberIds.includes(w.id));
              return (
                <div key={a.id} className="flex items-center gap-4 rounded-2xl bg-white/3 p-4">
                  <div className="rounded-2xl bg-sky-500/10 p-2.5">
                    <Users className="h-5 w-5 text-sky-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-100">{team?.name}</p>
                    <p className="text-xs text-slate-500">
                      {floor?.name} · {members.length} người · Từ {formatDate(a.startDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex gap-1 flex-wrap justify-end">
                      {members.slice(0, 3).map((m) => (
                        <span key={m.id} className="rounded-full bg-slate-700/60 px-2 py-0.5 text-[10px] text-slate-400">
                          {m.name.split(" ").slice(-1)[0]}
                        </span>
                      ))}
                      {members.length > 3 && (
                        <span className="rounded-full bg-slate-700/60 px-2 py-0.5 text-[10px] text-slate-400">
                          +{members.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Reports */}
      {reports.length > 0 && (
        <div className="glass-card rounded-3xl p-6">
          <p className="section-title mb-5">Báo cáo ngày gần đây</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-white/5">
                  <th className="pb-3 pr-4 font-bold">Ngày</th>
                  <th className="pb-3 pr-4 font-bold">Tổ</th>
                  <th className="pb-3 pr-4 font-bold">Tầng</th>
                  <th className="pb-3 pr-4 font-bold text-right">KL hoàn thành</th>
                  <th className="pb-3 pr-4 font-bold text-right">Tiền ăn</th>
                  <th className="pb-3 font-bold text-right">Vật tư</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {reports.map((r) => {
                  const team = data.teams.find((t) => t.id === r.teamId);
                  const floor = construction.floors.find((f) => f.id === r.floorId);
                  return (
                    <tr key={r.id}>
                      <td className="py-3 pr-4 text-slate-300">{formatDate(r.date)}</td>
                      <td className="py-3 pr-4 text-slate-300">{team?.name}</td>
                      <td className="py-3 pr-4 text-slate-400 text-xs">{floor?.name}</td>
                      <td className="py-3 pr-4 text-right font-bold text-amber-300">
                        {r.completedVolume} {floor?.unit}
                      </td>
                      <td className="py-3 pr-4 text-right text-slate-300">{formatCurrency(r.foodExpense)}</td>
                      <td className="py-3 text-right text-slate-300">{formatCurrency(r.materialExpense)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Floor Modal */}
      {showFloorForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md rounded-3xl p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-100">Thêm tầng mới</h3>
              <button onClick={() => setShowFloorForm(false)} className="rounded-xl p-1.5 text-slate-400 hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddFloor} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Tên tầng *</label>
                <input
                  required
                  value={floorForm.name}
                  onChange={(e) => setFloorForm({ ...floorForm, name: e.target.value })}
                  placeholder="Tầng trệt / Tầng 1 / Mái"
                  className="w-full rounded-xl bg-slate-800/60 border border-white/10 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-500/50 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Khối lượng KH *</label>
                  <input
                    required
                    type="number"
                    value={floorForm.plannedVolume}
                    onChange={(e) => setFloorForm({ ...floorForm, plannedVolume: e.target.value })}
                    placeholder="120"
                    className="w-full rounded-xl bg-slate-800/60 border border-white/10 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-500/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Đơn vị</label>
                  <select
                    value={floorForm.unit}
                    onChange={(e) => setFloorForm({ ...floorForm, unit: e.target.value })}
                    className="w-full rounded-xl bg-slate-800/60 border border-white/10 px-3 py-2.5 text-sm text-slate-100 focus:border-amber-500/50 focus:outline-none"
                  >
                    <option>m²</option>
                    <option>m³</option>
                    <option>bộ</option>
                    <option>cái</option>
                    <option>gói</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Giá trị HĐ (VNĐ) *</label>
                  <input
                    required
                    type="number"
                    value={floorForm.contractValue}
                    onChange={(e) => setFloorForm({ ...floorForm, contractValue: e.target.value })}
                    placeholder="480000000"
                    className="w-full rounded-xl bg-slate-800/60 border border-white/10 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-500/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">% Bảo lưu</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={floorForm.retentionRate}
                    onChange={(e) => setFloorForm({ ...floorForm, retentionRate: e.target.value })}
                    className="w-full rounded-xl bg-slate-800/60 border border-white/10 px-3 py-2.5 text-sm text-slate-100 focus:border-amber-500/50 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowFloorForm(false)} className="flex-1 rounded-2xl border border-white/10 py-2.5 text-sm font-bold text-slate-400 hover:bg-white/5">
                  Hủy
                </button>
                <button type="submit" className="flex-1 rounded-2xl bg-amber-500 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-400">
                  Thêm tầng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
