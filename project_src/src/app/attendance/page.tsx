"use client";

import { useState } from "react";
import { useAppData } from "@/components/providers/AppDataProvider";
import { calcWage } from "@/lib/calc";
import {
  formatCurrency,
  formatDate,
  getMarkBadgeClass,
  getMarkLabel,
  todayISO,
} from "@/lib/utils";
import { ClipboardCheck, Lock, Users, CheckCircle2 } from "lucide-react";
import type { AttendanceMark } from "@/lib/types";

export default function AttendancePage() {
  const { data, submitDailyReport } = useAppData();
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");

  // Tìm phân công hiện tại của tổ (KHÓA VỊ TRÍ)
  const activeAssignment = selectedTeamId
    ? data.assignments.find((a) => a.teamId === selectedTeamId && a.status === "active")
    : null;
  const assignedConstruction = activeAssignment
    ? data.constructions.find((c) => c.id === activeAssignment.constructionId)
    : null;
  const assignedFloor = assignedConstruction?.floors.find(
    (f) => f.id === activeAssignment?.floorId
  );

  const team = selectedTeamId ? data.teams.find((t) => t.id === selectedTeamId) : null;
  const members = team ? data.workers.filter((w) => team.memberIds.includes(w.id)) : [];

  // State chấm công
  const [marks, setMarks] = useState<Record<string, { mark: AttendanceMark; unitPrice: number }>>({});
  const [submitted, setSubmitted] = useState(false);

  function setMark(workerId: string, mark: AttendanceMark) {
    setMarks((prev) => ({
      ...prev,
      [workerId]: { mark, unitPrice: prev[workerId]?.unitPrice ?? 400_000 },
    }));
  }

  function setUnitPrice(workerId: string, price: number) {
    setMarks((prev) => ({
      ...prev,
      [workerId]: { mark: prev[workerId]?.mark ?? "O", unitPrice: price },
    }));
  }

  function getMark(workerId: string): AttendanceMark {
    return marks[workerId]?.mark ?? "O";
  }

  function getUnitPrice(workerId: string): number {
    return marks[workerId]?.unitPrice ?? 400_000;
  }

  // Check if already submitted for this team+date
  const alreadySubmitted = data.dailyReports.some(
    (r) => r.teamId === selectedTeamId && r.date === selectedDate && r.status === "submitted"
  );

  function handleSubmitAttendance() {
    if (!team || !activeAssignment || !assignedConstruction || !assignedFloor) return;
    const attendance = members.map((m) => {
      const mark = getMark(m.id);
      const unitPrice = getUnitPrice(m.id);
      return { workerId: m.id, mark, unitPrice, wage: calcWage(unitPrice, mark) };
    });
    submitDailyReport({
      date: selectedDate,
      teamId: team.id,
      constructionId: assignedConstruction.id,
      floorId: assignedFloor.id,
      submittedBy: team.leaderId,
      completedVolume: 0, // Chấm công nhanh - không nhập khối lượng
      foodExpense: 0,
      materialExpense: 0,
      otherExpense: 0,
      notes: "Chấm công nhanh",
      status: "submitted",
      attendance,
    });
    setSubmitted(true);
  }

  const totalWage = members.reduce((s, m) => s + calcWage(getUnitPrice(m.id), getMark(m.id)), 0);
  const presentCount = members.filter((m) => getMark(m.id) !== "X").length;

  return (
    <div className="space-y-8">
      <div>
        <p className="section-title">Module 2 · Khóa vị trí</p>
        <h2 className="mt-2 text-3xl font-black text-slate-100">Chấm công</h2>
        <p className="mt-1 text-sm text-slate-400">
          Chỉ được chấm công tại đúng công trình/tầng đang được phân công.
        </p>
      </div>

      {/* Date + Team selector */}
      <div className="glass-card rounded-3xl p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2">Ngày chấm công</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => { setSelectedDate(e.target.value); setSubmitted(false); }}
              className="w-full rounded-xl bg-slate-800/60 border border-white/10 px-3 py-2.5 text-sm text-slate-100 focus:border-amber-500/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2">Tổ đội</label>
            <select
              value={selectedTeamId}
              onChange={(e) => { setSelectedTeamId(e.target.value); setSubmitted(false); setMarks({}); }}
              className="w-full rounded-xl bg-slate-800/60 border border-white/10 px-3 py-2.5 text-sm text-slate-100 focus:border-amber-500/50 focus:outline-none"
            >
              <option value="">-- Chọn tổ --</option>
              {data.teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* KHÓA VỊ TRÍ indicator */}
        {selectedTeamId && (
          <div className={`mt-4 rounded-2xl p-4 flex items-center gap-3 ${
            activeAssignment
              ? "bg-emerald-500/10 border border-emerald-500/20"
              : "bg-rose-500/10 border border-rose-500/20"
          }`}>
            <Lock className={`h-5 w-5 shrink-0 ${activeAssignment ? "text-emerald-400" : "text-rose-400"}`} />
            {activeAssignment && assignedConstruction ? (
              <div>
                <p className="text-sm font-bold text-emerald-300">
                  Vị trí được khóa: {assignedConstruction.name}
                </p>
                <p className="text-xs text-slate-400">{assignedFloor?.name} · Từ {formatDate(activeAssignment.startDate)}</p>
              </div>
            ) : (
              <p className="text-sm font-bold text-rose-300">
                Tổ này chưa được phân công vào công trình nào. Vui lòng phân công trước.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Already submitted warning */}
      {alreadySubmitted && (
        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-amber-400 shrink-0" />
          <p className="text-sm text-amber-300">Đã chấm công cho tổ này vào ngày {formatDate(selectedDate)}. Báo cáo ngày sẽ thay thế nếu bạn nộp lại.</p>
        </div>
      )}

      {/* Success */}
      {submitted && (
        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <p className="text-sm text-emerald-300 font-bold">Chấm công thành công! Tổng lương: {formatCurrency(totalWage)}</p>
        </div>
      )}

      {/* Attendance Grid */}
      {team && activeAssignment && !submitted && (
        <div className="glass-card rounded-3xl p-6">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-sky-400" />
              <div>
                <p className="font-bold text-slate-100">{team.name}</p>
                <p className="text-xs text-slate-400">{members.length} người · {formatDate(selectedDate)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Đi làm</p>
              <p className="font-black text-slate-100">{presentCount}/{members.length}</p>
            </div>
          </div>

          <div className="space-y-3">
            {members.map((m) => {
              const mark = getMark(m.id);
              const unitPrice = getUnitPrice(m.id);
              const wage = calcWage(unitPrice, mark);
              const isLeader = m.id === team.leaderId;

              return (
                <div key={m.id} className="rounded-2xl bg-slate-800/40 p-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <span className="font-bold text-slate-100 text-sm">{m.name}</span>
                      {isLeader && (
                        <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                          Tổ trưởng
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-bold text-emerald-300">{formatCurrency(wage)}</span>
                  </div>

                  {/* Mark buttons */}
                  <div className="flex gap-2 mb-3">
                    {(["O", "N", "X"] as AttendanceMark[]).map((m2) => (
                      <button
                        key={m2}
                        onClick={() => setMark(m.id, m2)}
                        className={`flex-1 rounded-xl py-2 text-sm font-black transition-all ${
                          mark === m2
                            ? getMarkBadgeClass(m2) + " ring-2 ring-current"
                            : "bg-slate-700/40 text-slate-500 hover:bg-slate-700"
                        }`}
                      >
                        {m2} — {getMarkLabel(m2)}
                      </button>
                    ))}
                  </div>

                  {/* Unit price */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-400 whitespace-nowrap">Đơn giá (đ):</label>
                    <input
                      type="number"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(m.id, Number(e.target.value))}
                      step="10000"
                      className="flex-1 rounded-xl bg-slate-700/40 border border-white/10 px-3 py-1.5 text-sm text-slate-100 focus:border-amber-500/50 focus:outline-none"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary + Submit */}
          <div className="mt-6 border-t border-white/5 pt-5">
            <div className="grid grid-cols-3 gap-4 mb-5">
              <div className="rounded-2xl bg-slate-800/40 p-3 text-center">
                <div className="text-[10px] text-slate-500 uppercase">Cả ngày (O)</div>
                <div className="text-xl font-black text-emerald-400 mt-1">
                  {members.filter((m) => getMark(m.id) === "O").length}
                </div>
              </div>
              <div className="rounded-2xl bg-slate-800/40 p-3 text-center">
                <div className="text-[10px] text-slate-500 uppercase">Nửa ngày (N)</div>
                <div className="text-xl font-black text-amber-400 mt-1">
                  {members.filter((m) => getMark(m.id) === "N").length}
                </div>
              </div>
              <div className="rounded-2xl bg-slate-800/40 p-3 text-center">
                <div className="text-[10px] text-slate-500 uppercase">Vắng (X)</div>
                <div className="text-xl font-black text-slate-400 mt-1">
                  {members.filter((m) => getMark(m.id) === "X").length}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-slate-400">Tổng lương hôm nay:</span>
              <span className="text-xl font-black text-slate-100">{formatCurrency(totalWage)}</span>
            </div>
            <button
              onClick={handleSubmitAttendance}
              className="w-full rounded-2xl bg-amber-500 py-3 text-sm font-bold text-slate-950 hover:bg-amber-400 transition-colors flex items-center justify-center gap-2"
            >
              <ClipboardCheck className="h-5 w-5" />
              Lưu chấm công ngày {formatDate(selectedDate)}
            </button>
          </div>
        </div>
      )}

      {/* No team selected */}
      {!selectedTeamId && (
        <div className="glass-card rounded-3xl p-12 text-center">
          <ClipboardCheck className="mx-auto h-12 w-12 text-slate-600 mb-4" />
          <p className="text-slate-400">Chọn tổ đội để bắt đầu chấm công.</p>
        </div>
      )}
    </div>
  );
}
