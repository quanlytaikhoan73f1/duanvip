"use client";

import { useState } from "react";
import { useAppData } from "@/components/providers/AppDataProvider";
import { calcWage, calcReportTotalExpense, calcReportTotalWage } from "@/lib/calc";
import {
  formatCurrency,
  formatDate,
  getMarkBadgeClass,
  getMarkLabel,
  getStatusClass,
  todayISO,
} from "@/lib/utils";
import { FileText, Plus, X, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import type { AttendanceMark } from "@/lib/types";

export default function ReportsPage() {
  const { data, submitDailyReport } = useAppData();
  const [showForm, setShowForm] = useState(false);
  const [expandedReport, setExpandedReport] = useState<string | null>(null);

  const [form, setForm] = useState({
    date: todayISO(),
    teamId: "",
    completedVolume: "",
    foodExpense: "",
    materialExpense: "",
    otherExpense: "",
    notes: "",
  });
  const [marks, setMarks] = useState<Record<string, { mark: AttendanceMark; unitPrice: number }>>({});

  const selectedTeam = form.teamId ? data.teams.find((t) => t.id === form.teamId) : null;
  const activeAssignment = form.teamId
    ? data.assignments.find((a) => a.teamId === form.teamId && a.status === "active")
    : null;
  const assignedConstruction = activeAssignment
    ? data.constructions.find((c) => c.id === activeAssignment.constructionId)
    : null;
  const assignedFloor = assignedConstruction?.floors.find((f) => f.id === activeAssignment?.floorId);
  const members = selectedTeam ? data.workers.filter((w) => selectedTeam.memberIds.includes(w.id)) : [];

  function getMark(wId: string): AttendanceMark { return marks[wId]?.mark ?? "O"; }
  function getPrice(wId: string): number { return marks[wId]?.unitPrice ?? 400_000; }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTeam || !activeAssignment || !assignedConstruction || !assignedFloor) return;
    const attendance = members.map((m) => ({
      workerId: m.id,
      mark: getMark(m.id),
      unitPrice: getPrice(m.id),
      wage: calcWage(getPrice(m.id), getMark(m.id)),
    }));
    submitDailyReport({
      date: form.date,
      teamId: selectedTeam.id,
      constructionId: assignedConstruction.id,
      floorId: assignedFloor.id,
      submittedBy: selectedTeam.leaderId,
      completedVolume: Number(form.completedVolume) || 0,
      foodExpense: Number(form.foodExpense) || 0,
      materialExpense: Number(form.materialExpense) || 0,
      otherExpense: Number(form.otherExpense) || 0,
      notes: form.notes,
      status: "submitted",
      attendance,
    });
    setShowForm(false);
    setForm({ date: todayISO(), teamId: "", completedVolume: "", foodExpense: "", materialExpense: "", otherExpense: "", notes: "" });
    setMarks({});
  }

  const sortedReports = [...data.dailyReports].sort((a, b) => (b.date > a.date ? 1 : -1));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="section-title">Module 3</p>
          <h2 className="mt-2 text-3xl font-black text-slate-100">Báo cáo hằng ngày</h2>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-400 transition-colors"
        >
          <Plus className="h-4 w-4" /> Nộp báo cáo
        </button>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {sortedReports.length === 0 && (
          <div className="glass-card rounded-3xl p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-slate-600 mb-4" />
            <p className="text-slate-400">Chưa có báo cáo nào.</p>
          </div>
        )}
        {sortedReports.map((r) => {
          const team = data.teams.find((t) => t.id === r.teamId);
          const ct = data.constructions.find((c) => c.id === r.constructionId);
          const floor = ct?.floors.find((f) => f.id === r.floorId);
          const totalExpense = calcReportTotalExpense(r);
          const totalWage = calcReportTotalWage(r);
          const isExpanded = expandedReport === r.id;

          return (
            <div key={r.id} className="glass-card rounded-3xl overflow-hidden">
              {/* Header */}
              <button
                onClick={() => setExpandedReport(isExpanded ? null : r.id)}
                className="w-full p-5 text-left hover:bg-white/3 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${getStatusClass(r.status)}`}>
                        {r.status === "submitted" ? "Đã nộp" : "Nháp"}
                      </span>
                      <span className="text-xs text-slate-400">{formatDate(r.date)}</span>
                      <span className="text-xs font-bold text-slate-300">{team?.name}</span>
                    </div>
                    <p className="font-bold text-slate-100 truncate">{ct?.name}</p>
                    <p className="text-xs text-slate-500">{floor?.name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-black text-amber-300">
                      {r.completedVolume} {floor?.unit}
                    </div>
                    <div className="text-xs text-slate-500">{formatCurrency(totalExpense)}</div>
                  </div>
                  <div className="shrink-0 mt-1 text-slate-500">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>

                {/* Quick stats */}
                <div className="mt-3 flex gap-3 text-xs text-slate-500">
                  <span className="text-emerald-400 font-bold">
                    {r.attendance.filter((e) => e.mark !== "X").length}/{r.attendance.length} đi làm
                  </span>
                  <span>Lương: {formatCurrency(totalWage)}</span>
                  <span>Ăn: {formatCurrency(r.foodExpense)}</span>
                  <span>Vật tư: {formatCurrency(r.materialExpense)}</span>
                </div>
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="border-t border-white/5 p-5">
                  {r.notes && (
                    <div className="mb-4 rounded-xl bg-slate-800/40 p-3">
                      <p className="text-xs font-bold text-slate-400 mb-1">Ghi chú:</p>
                      <p className="text-sm text-slate-300">{r.notes}</p>
                    </div>
                  )}

                  {/* Expense breakdown */}
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    {[
                      { label: "Tiền ăn", value: r.foodExpense },
                      { label: "Vật tư", value: r.materialExpense },
                      { label: "Chi khác", value: r.otherExpense },
                    ].map((item) => (
                      <div key={item.label} className="rounded-xl bg-slate-800/40 p-3 text-center">
                        <div className="text-[10px] text-slate-500">{item.label}</div>
                        <div className="mt-1 font-bold text-slate-200">{formatCurrency(item.value)}</div>
                      </div>
                    ))}
                  </div>

                  {/* Attendance table */}
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Bảng chấm công</p>
                  <div className="space-y-2">
                    {r.attendance.map((entry) => {
                      const worker = data.workers.find((w) => w.id === entry.workerId);
                      return (
                        <div key={entry.workerId} className="flex items-center gap-3 rounded-xl bg-slate-800/30 px-3 py-2">
                          <span className="flex-1 text-sm text-slate-200">{worker?.name ?? entry.workerId}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${getMarkBadgeClass(entry.mark)}`}>
                            {entry.mark} — {getMarkLabel(entry.mark)}
                          </span>
                          <span className="text-xs text-slate-400">{entry.unitPrice.toLocaleString("vi-VN")} đ</span>
                          <span className="text-sm font-bold text-emerald-300 w-24 text-right">
                            {formatCurrency(entry.wage)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex justify-between border-t border-white/5 pt-3">
                    <span className="text-sm text-slate-400">Tổng lương:</span>
                    <span className="font-black text-slate-100">{formatCurrency(totalWage)}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/80 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="glass-card w-full max-w-lg rounded-3xl p-6 my-8">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-100">Nộp báo cáo ngày</h3>
              <button onClick={() => setShowForm(false)} className="rounded-xl p-1.5 text-slate-400 hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Date + Team */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Ngày *</label>
                  <input type="date" required value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full rounded-xl bg-slate-800/60 border border-white/10 px-3 py-2.5 text-sm text-slate-100 focus:border-amber-500/50 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Tổ đội *</label>
                  <select required value={form.teamId}
                    onChange={(e) => { setForm({ ...form, teamId: e.target.value }); setMarks({}); }}
                    className="w-full rounded-xl bg-slate-800/60 border border-white/10 px-3 py-2.5 text-sm text-slate-100 focus:border-amber-500/50 focus:outline-none">
                    <option value="">-- Chọn tổ --</option>
                    {data.teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Location Lock indicator */}
              {form.teamId && (
                <div className={`rounded-xl p-3 text-xs ${activeAssignment ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/10 text-rose-300"}`}>
                  {activeAssignment && assignedConstruction
                    ? `📍 ${assignedConstruction.name} · ${assignedFloor?.name}`
                    : "⚠️ Tổ chưa được phân công công trình"}
                </div>
              )}

              {/* Volume + Expenses */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">
                    KL hoàn thành ({assignedFloor?.unit ?? "m²"})
                  </label>
                  <input type="number" step="0.1" value={form.completedVolume}
                    onChange={(e) => setForm({ ...form, completedVolume: e.target.value })}
                    placeholder="8"
                    className="w-full rounded-xl bg-slate-800/60 border border-white/10 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-500/50 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Tiền ăn (đ)</label>
                  <input type="number" value={form.foodExpense}
                    onChange={(e) => setForm({ ...form, foodExpense: e.target.value })}
                    placeholder="400000"
                    className="w-full rounded-xl bg-slate-800/60 border border-white/10 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-500/50 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Vật tư (đ)</label>
                  <input type="number" value={form.materialExpense}
                    onChange={(e) => setForm({ ...form, materialExpense: e.target.value })}
                    placeholder="2800000"
                    className="w-full rounded-xl bg-slate-800/60 border border-white/10 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-500/50 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Chi khác (đ)</label>
                  <input type="number" value={form.otherExpense}
                    onChange={(e) => setForm({ ...form, otherExpense: e.target.value })}
                    placeholder="0"
                    className="w-full rounded-xl bg-slate-800/60 border border-white/10 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-500/50 focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Ghi chú</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Đổ bê tông cột trục B, đặt thép sàn..."
                  rows={2}
                  className="w-full rounded-xl bg-slate-800/60 border border-white/10 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-500/50 focus:outline-none resize-none" />
              </div>

              {/* Attendance in report */}
              {members.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Chấm công</p>
                  <div className="space-y-2">
                    {members.map((m) => {
                      const mark = getMark(m.id);
                      const price = getPrice(m.id);
                      return (
                        <div key={m.id} className="rounded-xl bg-slate-800/40 p-3">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-sm font-bold text-slate-200">{m.name}</span>
                            <span className="text-sm text-emerald-300">{formatCurrency(calcWage(price, mark))}</span>
                          </div>
                          <div className="flex gap-1.5 mb-2">
                            {(["O", "N", "X"] as AttendanceMark[]).map((mk) => (
                              <button key={mk} type="button"
                                onClick={() => setMarks((p) => ({ ...p, [m.id]: { ...p[m.id], mark: mk, unitPrice: p[m.id]?.unitPrice ?? 400_000 } }))}
                                className={`flex-1 rounded-lg py-1.5 text-xs font-bold ${mark === mk ? getMarkBadgeClass(mk) + " ring-1 ring-current" : "bg-slate-700/40 text-slate-500"}`}>
                                {mk}
                              </button>
                            ))}
                          </div>
                          <input type="number" value={price}
                            onChange={(e) => setMarks((p) => ({ ...p, [m.id]: { ...p[m.id], mark: p[m.id]?.mark ?? "O", unitPrice: Number(e.target.value) } }))}
                            className="w-full rounded-lg bg-slate-700/40 border border-white/10 px-2 py-1.5 text-xs text-slate-200 focus:border-amber-500/50 focus:outline-none"
                            placeholder="Đơn giá (đ)" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 rounded-2xl border border-white/10 py-2.5 text-sm font-bold text-slate-400 hover:bg-white/5">Hủy</button>
                <button type="submit" disabled={!activeAssignment}
                  className="flex-1 rounded-2xl bg-amber-500 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed">
                  Nộp báo cáo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
