"use client";

import { useState } from "react";
import { useAppData } from "@/components/providers/AppDataProvider";
import { formatDate, getRequestTypeClass, getRequestTypeLabel, getStatusClass, getStatusLabel, todayISO } from "@/lib/utils";
import { GitBranch, Plus, X, CheckCircle2, XCircle, Clock } from "lucide-react";
import type { RequestType } from "@/lib/types";

const REVIEWER = "Quản lý - Nguyễn Hoàng";

export default function ApprovalsPage() {
  const { data, submitPersonnelRequest, reviewPersonnelRequest } = useAppData();
  const [showForm, setShowForm] = useState(false);
  const [reviewNote, setReviewNote] = useState<Record<string, string>>({});
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const [form, setForm] = useState({
    type: "add" as RequestType,
    teamId: "",
    workerId: "",
    workerName: "",
    fromConstructionId: "",
    fromFloorId: "",
    toConstructionId: "",
    toFloorId: "",
    reason: "",
  });

  const selectedTeam = form.teamId ? data.teams.find((t) => t.id === form.teamId) : null;
  const teamMembers = selectedTeam ? data.workers.filter((w) => selectedTeam.memberIds.includes(w.id)) : [];
  const fromConstruction = data.constructions.find((c) => c.id === form.fromConstructionId);
  const toConstruction = data.constructions.find((c) => c.id === form.toConstructionId);

  function handleSubmitRequest(e: React.FormEvent) {
    e.preventDefault();
    const requester = selectedTeam ? data.workers.find((w) => w.id === selectedTeam.leaderId) : null;
    submitPersonnelRequest({
      type: form.type,
      requestedBy: selectedTeam?.leaderId ?? "",
      teamId: form.teamId,
      workerName: form.type === "add" ? form.workerName : undefined,
      workerId: form.type !== "add" ? form.workerId : undefined,
      fromConstructionId: form.fromConstructionId || undefined,
      fromFloorId: form.fromFloorId || undefined,
      toConstructionId: form.toConstructionId || undefined,
      toFloorId: form.toFloorId || undefined,
      reason: form.reason,
    });
    setShowForm(false);
    setForm({ type: "add", teamId: "", workerId: "", workerName: "", fromConstructionId: "", fromFloorId: "", toConstructionId: "", toFloorId: "", reason: "" });
  }

  const filtered = [...data.personnelRequests]
    .filter((r) => filterStatus === "all" || r.status === filterStatus)
    .sort((a, b) => (b.requestedAt > a.requestedAt ? 1 : -1));

  const pendingCount = data.personnelRequests.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="section-title">Module 4 · Luồng duyệt</p>
          <h2 className="mt-2 text-3xl font-black text-slate-100">Điều phối nhân sự</h2>
          {pendingCount > 0 && (
            <p className="mt-1 text-sm text-rose-400 font-bold">{pendingCount} yêu cầu đang chờ duyệt</p>
          )}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-400 transition-colors"
        >
          <Plus className="h-4 w-4" /> Gửi yêu cầu
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: "all", label: "Tất cả" },
          { value: "pending", label: `Chờ duyệt (${pendingCount})` },
          { value: "approved", label: "Đã duyệt" },
          { value: "rejected", label: "Từ chối" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilterStatus(f.value as typeof filterStatus)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
              filterStatus === f.value
                ? "bg-amber-500 text-slate-950"
                : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filtered.length === 0 && (
          <div className="glass-card rounded-3xl p-12 text-center">
            <GitBranch className="mx-auto h-12 w-12 text-slate-600 mb-4" />
            <p className="text-slate-400">Không có yêu cầu nào.</p>
          </div>
        )}

        {filtered.map((req) => {
          const team = data.teams.find((t) => t.id === req.teamId);
          const requester = data.workers.find((w) => w.id === req.requestedBy);
          const worker = req.workerId ? data.workers.find((w) => w.id === req.workerId) : null;
          const fromCt = req.fromConstructionId
            ? data.constructions.find((c) => c.id === req.fromConstructionId)
            : null;
          const fromFloor = fromCt?.floors.find((f) => f.id === req.fromFloorId);
          const toCt = req.toConstructionId
            ? data.constructions.find((c) => c.id === req.toConstructionId)
            : null;
          const toFloor = toCt?.floors.find((f) => f.id === req.toFloorId);
          const isPending = req.status === "pending";

          return (
            <div key={req.id} className="glass-card rounded-3xl p-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`rounded-2xl p-2.5 shrink-0 ${
                    req.type === "add" ? "bg-emerald-500/10" : req.type === "remove" ? "bg-rose-500/10" : "bg-sky-500/10"
                  }`}>
                    <GitBranch className={`h-5 w-5 ${
                      req.type === "add" ? "text-emerald-400" : req.type === "remove" ? "text-rose-400" : "text-sky-400"
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${getRequestTypeClass(req.type)}`}>
                        {getRequestTypeLabel(req.type)}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${getStatusClass(req.status)}`}>
                        {getStatusLabel(req.status)}
                      </span>
                    </div>
                    <p className="mt-1.5 font-bold text-slate-100">
                      {req.type === "add"
                        ? `Thêm "${req.workerName}" vào ${team?.name}`
                        : req.type === "remove"
                        ? `Xóa ${worker?.name ?? "?"} khỏi ${team?.name}`
                        : `Chuyển ${worker?.name ?? "?"} từ ${team?.name}`}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Gửi bởi: {requester?.name} · {new Date(req.requestedAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>

                {/* Status icon */}
                <div className="shrink-0">
                  {isPending ? (
                    <Clock className="h-5 w-5 text-amber-400" />
                  ) : req.status === "approved" ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <XCircle className="h-5 w-5 text-rose-400" />
                  )}
                </div>
              </div>

              {/* Transfer details */}
              {req.type === "transfer" && (fromCt || toCt) && (
                <div className="mt-4 flex items-center gap-3 rounded-2xl bg-slate-800/40 p-3">
                  <div className="flex-1 text-xs">
                    {fromCt && <p className="text-slate-400">Từ: <span className="text-slate-200 font-bold">{fromCt.name} · {fromFloor?.name}</span></p>}
                    {toCt && <p className="text-slate-400 mt-1">Sang: <span className="text-sky-300 font-bold">{toCt.name} · {toFloor?.name}</span></p>}
                  </div>
                </div>
              )}
              {req.type === "add" && toCt && (
                <div className="mt-3 rounded-xl bg-slate-800/40 p-3 text-xs text-slate-400">
                  Vị trí: <span className="text-emerald-300 font-bold">{toCt.name} · {toFloor?.name}</span>
                </div>
              )}

              {/* Reason */}
              <div className="mt-4 rounded-xl bg-slate-800/30 p-3">
                <p className="text-xs text-slate-500 mb-1">Lý do:</p>
                <p className="text-sm text-slate-300">{req.reason}</p>
              </div>

              {/* Review result */}
              {!isPending && req.reviewedAt && (
                <div className={`mt-3 rounded-xl p-3 text-xs ${req.status === "approved" ? "bg-emerald-500/8" : "bg-rose-500/8"}`}>
                  <span className="font-bold text-slate-300">{req.reviewedBy}</span>
                  <span className="text-slate-500"> · {new Date(req.reviewedAt).toLocaleDateString("vi-VN")}</span>
                  {req.reviewNote && <p className="mt-1 text-slate-400">{req.reviewNote}</p>}
                </div>
              )}

              {/* Approve/Reject Actions */}
              {isPending && (
                <div className="mt-5 space-y-3">
                  <textarea
                    value={reviewNote[req.id] ?? ""}
                    onChange={(e) => setReviewNote((p) => ({ ...p, [req.id]: e.target.value }))}
                    placeholder="Ghi chú khi duyệt (tùy chọn)..."
                    rows={2}
                    className="w-full rounded-xl bg-slate-800/60 border border-white/10 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-500/50 focus:outline-none resize-none"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => reviewPersonnelRequest(req.id, "rejected", REVIEWER, reviewNote[req.id])}
                      className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-rose-500/30 py-2.5 text-sm font-bold text-rose-400 hover:bg-rose-500/10"
                    >
                      <XCircle className="h-4 w-4" /> Từ chối
                    </button>
                    <button
                      onClick={() => reviewPersonnelRequest(req.id, "approved", REVIEWER, reviewNote[req.id])}
                      className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 py-2.5 text-sm font-bold text-emerald-300 hover:bg-emerald-500/25"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Duyệt
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Send Request Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/80 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="glass-card w-full max-w-lg rounded-3xl p-6 my-8">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-100">Gửi yêu cầu điều phối</h3>
              <button onClick={() => setShowForm(false)} className="rounded-xl p-1.5 text-slate-400 hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitRequest} className="space-y-4">
              {/* Type */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">Loại yêu cầu</label>
                <div className="flex gap-2">
                  {(["add", "remove", "transfer"] as RequestType[]).map((t) => (
                    <button key={t} type="button"
                      onClick={() => setForm({ ...form, type: t })}
                      className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${form.type === t ? getRequestTypeClass(t) + " ring-1 ring-current" : "bg-slate-800/40 text-slate-500"}`}>
                      {getRequestTypeLabel(t)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Team */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Tổ đội *</label>
                <select required value={form.teamId}
                  onChange={(e) => setForm({ ...form, teamId: e.target.value, workerId: "" })}
                  className="w-full rounded-xl bg-slate-800/60 border border-white/10 px-3 py-2.5 text-sm text-slate-100 focus:border-amber-500/50 focus:outline-none">
                  <option value="">-- Chọn tổ --</option>
                  {data.teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              {/* Add: worker name */}
              {form.type === "add" && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Tên người cần thêm *</label>
                  <input required value={form.workerName}
                    onChange={(e) => setForm({ ...form, workerName: e.target.value })}
                    placeholder="Nguyễn Văn X"
                    className="w-full rounded-xl bg-slate-800/60 border border-white/10 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-500/50 focus:outline-none" />
                </div>
              )}

              {/* Remove/Transfer: select worker */}
              {(form.type === "remove" || form.type === "transfer") && form.teamId && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">
                    {form.type === "remove" ? "Người cần xóa *" : "Người cần chuyển *"}
                  </label>
                  <select required value={form.workerId}
                    onChange={(e) => setForm({ ...form, workerId: e.target.value })}
                    className="w-full rounded-xl bg-slate-800/60 border border-white/10 px-3 py-2.5 text-sm text-slate-100 focus:border-amber-500/50 focus:outline-none">
                    <option value="">-- Chọn người --</option>
                    {teamMembers.filter((m) => m.role !== "leader").map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Transfer: destination */}
              {form.type === "transfer" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5">Chuyển sang công trình *</label>
                    <select required value={form.toConstructionId}
                      onChange={(e) => setForm({ ...form, toConstructionId: e.target.value, toFloorId: "" })}
                      className="w-full rounded-xl bg-slate-800/60 border border-white/10 px-3 py-2.5 text-sm text-slate-100 focus:border-amber-500/50 focus:outline-none">
                      <option value="">-- Chọn --</option>
                      {data.constructions.filter((c) => c.status === "active").map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5">Tầng *</label>
                    <select required value={form.toFloorId}
                      onChange={(e) => setForm({ ...form, toFloorId: e.target.value })}
                      disabled={!form.toConstructionId}
                      className="w-full rounded-xl bg-slate-800/60 border border-white/10 px-3 py-2.5 text-sm text-slate-100 focus:border-amber-500/50 focus:outline-none disabled:opacity-50">
                      <option value="">-- Chọn tầng --</option>
                      {toConstruction?.floors.map((f) => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Add: destination */}
              {form.type === "add" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5">Công trình cần thêm</label>
                    <select value={form.toConstructionId}
                      onChange={(e) => setForm({ ...form, toConstructionId: e.target.value, toFloorId: "" })}
                      className="w-full rounded-xl bg-slate-800/60 border border-white/10 px-3 py-2.5 text-sm text-slate-100 focus:border-amber-500/50 focus:outline-none">
                      <option value="">-- Tùy chọn --</option>
                      {data.constructions.filter((c) => c.status === "active").map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5">Tầng</label>
                    <select value={form.toFloorId}
                      onChange={(e) => setForm({ ...form, toFloorId: e.target.value })}
                      disabled={!form.toConstructionId}
                      className="w-full rounded-xl bg-slate-800/60 border border-white/10 px-3 py-2.5 text-sm text-slate-100 focus:border-amber-500/50 focus:outline-none disabled:opacity-50">
                      <option value="">-- Tùy chọn --</option>
                      {toConstruction?.floors.map((f) => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Lý do *</label>
                <textarea required value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="Khối lượng lớn, cần thêm người cho kịp tiến độ..."
                  rows={3}
                  className="w-full rounded-xl bg-slate-800/60 border border-white/10 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-500/50 focus:outline-none resize-none" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 rounded-2xl border border-white/10 py-2.5 text-sm font-bold text-slate-400 hover:bg-white/5">Hủy</button>
                <button type="submit" className="flex-1 rounded-2xl bg-amber-500 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-400">Gửi yêu cầu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
