"use client";

import { useState } from "react";
import { useAppData } from "@/components/providers/AppDataProvider";
import { formatDate, getStatusClass, getStatusLabel } from "@/lib/utils";
import { Users, UserPlus, Plus, X, MapPin, Crown } from "lucide-react";
import type { WorkerRole } from "@/lib/types";

export default function TeamsPage() {
  const { data, addTeam, addWorker, removeWorker, createAssignment, completeAssignment } = useAppData();

  const [showTeamForm, setShowTeamForm] = useState(false);
  const [showWorkerForm, setShowWorkerForm] = useState<string | null>(null); // teamId
  const [showAssignForm, setShowAssignForm] = useState<string | null>(null); // teamId
  const [teamForm, setTeamForm] = useState({ name: "", leaderName: "", leaderPhone: "" });
  const [workerForm, setWorkerForm] = useState({ name: "", phone: "", role: "member" as WorkerRole });
  const [assignForm, setAssignForm] = useState({ constructionId: "", floorId: "" });

  function handleAddTeam(e: React.FormEvent) {
    e.preventDefault();
    addTeam(teamForm.name, teamForm.leaderName, teamForm.leaderPhone || undefined);
    setShowTeamForm(false);
    setTeamForm({ name: "", leaderName: "", leaderPhone: "" });
  }

  function handleAddWorker(e: React.FormEvent) {
    e.preventDefault();
    if (!showWorkerForm) return;
    addWorker({ name: workerForm.name, phone: workerForm.phone || undefined, teamId: showWorkerForm, role: workerForm.role });
    setShowWorkerForm(null);
    setWorkerForm({ name: "", phone: "", role: "member" });
  }

  function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!showAssignForm) return;
    // Complete previous active assignment for this team first
    const prev = data.assignments.find((a) => a.teamId === showAssignForm && a.status === "active");
    if (prev) completeAssignment(prev.id);
    createAssignment({
      teamId: showAssignForm,
      constructionId: assignForm.constructionId,
      floorId: assignForm.floorId,
      startDate: new Date().toISOString().split("T")[0],
      status: "active",
    });
    setShowAssignForm(null);
    setAssignForm({ constructionId: "", floorId: "" });
  }

  const selectedConstruction = data.constructions.find((c) => c.id === assignForm.constructionId);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="section-title">Module 2</p>
          <h2 className="mt-2 text-3xl font-black text-slate-100">Tổ đội & Phân công</h2>
        </div>
        <button
          onClick={() => setShowTeamForm(true)}
          className="flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-400 transition-colors"
        >
          <Plus className="h-4 w-4" /> Tạo tổ mới
        </button>
      </div>

      {/* Teams Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {data.teams.map((team) => {
          const members = data.workers.filter((w) => team.memberIds.includes(w.id));
          const leader = members.find((w) => w.id === team.leaderId);
          const activeAssignment = data.assignments.find(
            (a) => a.teamId === team.id && a.status === "active"
          );
          const assignedConstruction = activeAssignment
            ? data.constructions.find((c) => c.id === activeAssignment.constructionId)
            : null;
          const assignedFloor = assignedConstruction?.floors.find(
            (f) => f.id === activeAssignment?.floorId
          );

          return (
            <div key={team.id} className="glass-card rounded-3xl p-6">
              {/* Team Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="rounded-2xl bg-sky-500/10 p-2">
                      <Users className="h-5 w-5 text-sky-400" />
                    </div>
                    <h3 className="font-black text-slate-100 text-lg">{team.name}</h3>
                  </div>
                  {leader && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <Crown className="h-3.5 w-3.5 text-amber-400" />
                      <span className="text-sm text-slate-300">{leader.name}</span>
                      {leader.phone && (
                        <span className="text-xs text-slate-500">· {leader.phone}</span>
                      )}
                    </div>
                  )}
                </div>
                <span className="rounded-full bg-slate-700/40 px-2 py-1 text-xs font-bold text-slate-300">
                  {members.length} người
                </span>
              </div>

              {/* Assignment Badge */}
              <div className="mt-4">
                {activeAssignment && assignedConstruction ? (
                  <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-emerald-300 truncate">
                          {assignedConstruction.name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {assignedFloor?.name} · Từ {formatDate(activeAssignment.startDate)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-slate-800/40 border border-white/5 p-3">
                    <p className="text-xs text-slate-500 text-center">Chưa được phân công</p>
                  </div>
                )}
              </div>

              {/* Members List */}
              <div className="mt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Thành viên
                </p>
                <div className="space-y-1.5">
                  {members.map((m) => (
                    <div key={m.id} className="flex items-center justify-between rounded-xl bg-slate-800/40 px-3 py-2">
                      <div className="flex items-center gap-2">
                        {m.role === "leader" ? (
                          <Crown className="h-3 w-3 text-amber-400" />
                        ) : (
                          <div className="h-3 w-3 rounded-full bg-slate-600" />
                        )}
                        <span className="text-xs text-slate-200">{m.name}</span>
                        {m.phone && <span className="text-[10px] text-slate-500">{m.phone}</span>}
                      </div>
                      {m.role !== "leader" && (
                        <button
                          onClick={() => removeWorker(m.id)}
                          className="rounded-lg p-1 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400"
                          title="Xóa khỏi tổ"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setShowWorkerForm(team.id)}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-sky-500/10 py-2 text-xs font-bold text-sky-300 hover:bg-sky-500/20"
                >
                  <UserPlus className="h-3.5 w-3.5" /> Thêm người
                </button>
                <button
                  onClick={() => { setShowAssignForm(team.id); setAssignForm({ constructionId: "", floorId: "" }); }}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-500/10 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/20"
                >
                  <MapPin className="h-3.5 w-3.5" /> Phân công
                </button>
              </div>
            </div>
          );
        })}

        {data.teams.length === 0 && (
          <div className="col-span-3 glass-card rounded-3xl p-12 text-center">
            <Users className="mx-auto h-12 w-12 text-slate-600 mb-4" />
            <p className="text-slate-400">Chưa có tổ đội nào.</p>
            <button onClick={() => setShowTeamForm(true)} className="mt-4 text-sm font-bold text-amber-400 hover:underline">
              Tạo tổ đầu tiên →
            </button>
          </div>
        )}
      </div>

      {/* Assignment History */}
      {data.assignments.filter((a) => a.status === "completed").length > 0 && (
        <div className="glass-card rounded-3xl p-6">
          <p className="section-title mb-4">Lịch sử phân công</p>
          <div className="space-y-2">
            {data.assignments
              .filter((a) => a.status === "completed")
              .slice(-10)
              .reverse()
              .map((a) => {
                const team = data.teams.find((t) => t.id === a.teamId);
                const ct = data.constructions.find((c) => c.id === a.constructionId);
                const floor = ct?.floors.find((f) => f.id === a.floorId);
                return (
                  <div key={a.id} className="flex items-center gap-3 rounded-xl bg-white/3 px-4 py-3">
                    <span className="rounded-full bg-slate-700/40 px-2 py-0.5 text-[10px] font-bold text-slate-400">Xong</span>
                    <span className="text-sm text-slate-300 flex-1">{team?.name}</span>
                    <span className="text-xs text-slate-500">{ct?.name} · {floor?.name}</span>
                    <span className="text-xs text-slate-500">{formatDate(a.startDate)} → {a.endDate ? formatDate(a.endDate) : "?"}</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Modals */}
      {showTeamForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md rounded-3xl p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-100">Tạo tổ mới</h3>
              <button onClick={() => setShowTeamForm(false)} className="rounded-xl p-1.5 text-slate-400 hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddTeam} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Tên tổ *</label>
                <input required value={teamForm.name} onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                  placeholder="Tổ An / Tổ Khoa"
                  className="w-full rounded-xl bg-slate-800/60 border border-white/10 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-500/50 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Tên tổ trưởng *</label>
                <input required value={teamForm.leaderName} onChange={(e) => setTeamForm({ ...teamForm, leaderName: e.target.value })}
                  placeholder="Nguyễn Văn An"
                  className="w-full rounded-xl bg-slate-800/60 border border-white/10 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-500/50 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">SĐT tổ trưởng</label>
                <input value={teamForm.leaderPhone} onChange={(e) => setTeamForm({ ...teamForm, leaderPhone: e.target.value })}
                  placeholder="0901234567"
                  className="w-full rounded-xl bg-slate-800/60 border border-white/10 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-500/50 focus:outline-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowTeamForm(false)} className="flex-1 rounded-2xl border border-white/10 py-2.5 text-sm font-bold text-slate-400 hover:bg-white/5">Hủy</button>
                <button type="submit" className="flex-1 rounded-2xl bg-amber-500 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-400">Tạo tổ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showWorkerForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md rounded-3xl p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-100">Thêm người vào tổ</h3>
              <button onClick={() => setShowWorkerForm(null)} className="rounded-xl p-1.5 text-slate-400 hover:bg-white/10"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAddWorker} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Họ tên *</label>
                <input required value={workerForm.name} onChange={(e) => setWorkerForm({ ...workerForm, name: e.target.value })}
                  placeholder="Nguyễn Văn B"
                  className="w-full rounded-xl bg-slate-800/60 border border-white/10 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-500/50 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">SĐT</label>
                <input value={workerForm.phone} onChange={(e) => setWorkerForm({ ...workerForm, phone: e.target.value })}
                  placeholder="0901234567"
                  className="w-full rounded-xl bg-slate-800/60 border border-white/10 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-500/50 focus:outline-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowWorkerForm(null)} className="flex-1 rounded-2xl border border-white/10 py-2.5 text-sm font-bold text-slate-400 hover:bg-white/5">Hủy</button>
                <button type="submit" className="flex-1 rounded-2xl bg-amber-500 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-400">Thêm người</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssignForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md rounded-3xl p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-100">Phân công tổ đội</h3>
              <button onClick={() => setShowAssignForm(null)} className="rounded-xl p-1.5 text-slate-400 hover:bg-white/10"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAssign} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Công trình *</label>
                <select required value={assignForm.constructionId}
                  onChange={(e) => setAssignForm({ ...assignForm, constructionId: e.target.value, floorId: "" })}
                  className="w-full rounded-xl bg-slate-800/60 border border-white/10 px-3 py-2.5 text-sm text-slate-100 focus:border-amber-500/50 focus:outline-none">
                  <option value="">-- Chọn công trình --</option>
                  {data.constructions.filter((c) => c.status === "active").map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Tầng *</label>
                <select required value={assignForm.floorId}
                  onChange={(e) => setAssignForm({ ...assignForm, floorId: e.target.value })}
                  disabled={!assignForm.constructionId}
                  className="w-full rounded-xl bg-slate-800/60 border border-white/10 px-3 py-2.5 text-sm text-slate-100 focus:border-amber-500/50 focus:outline-none disabled:opacity-50">
                  <option value="">-- Chọn tầng --</option>
                  {selectedConstruction?.floors.map((f) => (
                    <option key={f.id} value={f.id}>{f.name} ({getStatusLabel(f.status)})</option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-amber-300/70 bg-amber-500/8 rounded-xl p-3">
                ⚠️ Phân công này sẽ thay thế phân công hiện tại (nếu có).
              </p>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAssignForm(null)} className="flex-1 rounded-2xl border border-white/10 py-2.5 text-sm font-bold text-slate-400 hover:bg-white/5">Hủy</button>
                <button type="submit" className="flex-1 rounded-2xl bg-amber-500 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-400">Phân công</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
