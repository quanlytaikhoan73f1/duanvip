"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type {
  AppData,
  Construction,
  Floor,
  Team,
  Worker,
  Assignment,
  DailyReport,
  PersonnelRequest,
  RequestStatus,
} from "@/lib/types";
import { SEED_DATA } from "@/data/seed";
import { genId, todayISO } from "@/lib/utils";
import { calcFloorProgress } from "@/lib/calc";

const STORAGE_KEY = "construction-app-v1";

interface AppDataContextValue {
  data: AppData;
  // Công trình
  addConstruction: (c: Omit<Construction, "id" | "floors">) => void;
  updateConstruction: (id: string, updates: Partial<Construction>) => void;
  addFloor: (floor: Omit<Floor, "id">) => void;
  updateFloor: (constructionId: string, floorId: string, updates: Partial<Floor>) => void;
  // Tổ đội & nhân công
  addTeam: (name: string, leaderName: string, leaderPhone?: string) => void;
  addWorker: (worker: Omit<Worker, "id">) => void;
  removeWorker: (workerId: string) => void;
  // Phân công
  createAssignment: (a: Omit<Assignment, "id">) => void;
  completeAssignment: (assignmentId: string) => void;
  // Báo cáo ngày
  submitDailyReport: (report: Omit<DailyReport, "id" | "submittedAt">) => void;
  // Điều phối nhân sự
  submitPersonnelRequest: (req: Omit<PersonnelRequest, "id" | "requestedAt" | "status">) => void;
  reviewPersonnelRequest: (id: string, status: Extract<RequestStatus, "approved" | "rejected">, reviewedBy: string, note?: string) => void;
  // Reset
  resetToSeed: () => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(SEED_DATA);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setData(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, []);

  function persist(next: AppData) {
    setData(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function addConstruction(c: Omit<Construction, "id" | "floors">) {
    persist({ ...data, constructions: [...data.constructions, { ...c, id: genId(), floors: [] }] });
  }

  function updateConstruction(id: string, updates: Partial<Construction>) {
    persist({
      ...data,
      constructions: data.constructions.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    });
  }

  function addFloor(floor: Omit<Floor, "id">) {
    const newFloor: Floor = { ...floor, id: genId() };
    persist({
      ...data,
      constructions: data.constructions.map((c) =>
        c.id === floor.constructionId ? { ...c, floors: [...c.floors, newFloor] } : c
      ),
    });
  }

  function updateFloor(constructionId: string, floorId: string, updates: Partial<Floor>) {
    persist({
      ...data,
      constructions: data.constructions.map((c) =>
        c.id === constructionId
          ? {
              ...c,
              floors: c.floors.map((f) => {
                if (f.id !== floorId) return f;
                const updated = { ...f, ...updates };
                const progress = calcFloorProgress(updated);
                const status =
                  progress >= 100 ? "completed" : progress > 0 ? "in_progress" : "not_started";
                return { ...updated, status };
              }),
            }
          : c
      ),
    });
  }

  function addTeam(name: string, leaderName: string, leaderPhone?: string) {
    const leaderId = genId();
    const teamId = genId();
    const leader: Worker = { id: leaderId, name: leaderName, phone: leaderPhone, teamId, role: "leader" };
    const team: Team = { id: teamId, name, leaderId, memberIds: [leaderId] };
    persist({ ...data, teams: [...data.teams, team], workers: [...data.workers, leader] });
  }

  function addWorker(worker: Omit<Worker, "id">) {
    const newWorker: Worker = { ...worker, id: genId() };
    persist({
      ...data,
      workers: [...data.workers, newWorker],
      teams: data.teams.map((t) =>
        t.id === worker.teamId ? { ...t, memberIds: [...t.memberIds, newWorker.id] } : t
      ),
    });
  }

  function removeWorker(workerId: string) {
    const worker = data.workers.find((w) => w.id === workerId);
    if (!worker) return;
    persist({
      ...data,
      workers: data.workers.filter((w) => w.id !== workerId),
      teams: data.teams.map((t) =>
        t.id === worker.teamId
          ? { ...t, memberIds: t.memberIds.filter((id) => id !== workerId) }
          : t
      ),
    });
  }

  function createAssignment(a: Omit<Assignment, "id">) {
    persist({ ...data, assignments: [...data.assignments, { ...a, id: genId() }] });
  }

  function completeAssignment(assignmentId: string) {
    persist({
      ...data,
      assignments: data.assignments.map((a) =>
        a.id === assignmentId ? { ...a, status: "completed", endDate: todayISO() } : a
      ),
    });
  }

  function submitDailyReport(report: Omit<DailyReport, "id" | "submittedAt">) {
    const id = genId();
    const submittedAt = new Date().toISOString();
    const newReport: DailyReport = { ...report, id, submittedAt, status: "submitted" };

    // Cộng dồn khối lượng vào tầng
    const next = {
      ...data,
      dailyReports: [...data.dailyReports, newReport],
    };

    if (report.status === "submitted" && report.completedVolume > 0) {
      next.constructions = data.constructions.map((c) => {
        if (c.id !== report.constructionId) return c;
        return {
          ...c,
          floors: c.floors.map((f) => {
            if (f.id !== report.floorId) return f;
            const newCompleted = f.completedVolume + report.completedVolume;
            const progress = Math.min(100, (newCompleted / f.plannedVolume) * 100);
            const status =
              progress >= 100 ? "completed" : progress > 0 ? "in_progress" : "not_started";
            return { ...f, completedVolume: newCompleted, status };
          }),
        };
      });
    }

    persist(next);
  }

  function submitPersonnelRequest(req: Omit<PersonnelRequest, "id" | "requestedAt" | "status">) {
    persist({
      ...data,
      personnelRequests: [
        ...data.personnelRequests,
        { ...req, id: genId(), requestedAt: new Date().toISOString(), status: "pending" },
      ],
    });
  }

  function reviewPersonnelRequest(
    id: string,
    status: Extract<RequestStatus, "approved" | "rejected">,
    reviewedBy: string,
    note?: string
  ) {
    const req = data.personnelRequests.find((r) => r.id === id);
    if (!req) return;

    const next: AppData = {
      ...data,
      personnelRequests: data.personnelRequests.map((r) =>
        r.id === id
          ? { ...r, status, reviewedBy, reviewNote: note, reviewedAt: new Date().toISOString() }
          : r
      ),
    };

    // Tự động cập nhật phân công khi approved
    if (status === "approved") {
      if (req.type === "transfer" && req.workerId && req.toConstructionId && req.toFloorId) {
        const worker = data.workers.find((w) => w.id === req.workerId);
        if (worker) {
          // Complete old assignment for original team if needed
          // Add new assignment for the team
          next.assignments = [
            ...next.assignments,
            {
              id: genId(),
              teamId: req.teamId,
              constructionId: req.toConstructionId,
              floorId: req.toFloorId,
              startDate: todayISO(),
              status: "active",
            },
          ];
        }
      }
      if (req.type === "remove" && req.workerId) {
        next.workers = next.workers.filter((w) => w.id !== req.workerId);
        next.teams = next.teams.map((t) =>
          t.id === req.teamId
            ? { ...t, memberIds: t.memberIds.filter((mid) => mid !== req.workerId) }
            : t
        );
      }
    }

    persist(next);
  }

  function resetToSeed() {
    persist(SEED_DATA);
  }

  return (
    <AppDataContext.Provider
      value={{
        data,
        addConstruction,
        updateConstruction,
        addFloor,
        updateFloor,
        addTeam,
        addWorker,
        removeWorker,
        createAssignment,
        completeAssignment,
        submitDailyReport,
        submitPersonnelRequest,
        reviewPersonnelRequest,
        resetToSeed,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
