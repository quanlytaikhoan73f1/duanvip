import type {
  Construction,
  Floor,
  FloorStats,
  ConstructionStats,
  AppData,
  DailyReport,
  AttendanceMark,
} from "./types";

export function calcFloorProgress(floor: Floor): number {
  if (floor.plannedVolume <= 0) return 0;
  return Math.min(100, (floor.completedVolume / floor.plannedVolume) * 100);
}

export function calcFloorRetention(floor: Floor): number {
  const progress = calcFloorProgress(floor);
  return floor.contractValue * (floor.retentionRate / 100) * (progress / 100);
}

export function calcFloorStats(floor: Floor): FloorStats {
  return {
    progress: calcFloorProgress(floor),
    retentionAmount: calcFloorRetention(floor),
  };
}

export function calcConstructionStats(
  construction: Construction,
  data: AppData
): ConstructionStats {
  const { floors } = construction;

  // Weighted progress by contractValue
  const totalContractValue = floors.reduce((s, f) => s + f.contractValue, 0);
  const totalProgress =
    totalContractValue > 0
      ? floors.reduce((s, f) => s + calcFloorProgress(f) * f.contractValue, 0) /
        totalContractValue
      : 0;

  const totalRetention = floors.reduce((s, f) => s + calcFloorRetention(f), 0);

  // Sum all expenses from daily reports for this construction
  const reports = data.dailyReports.filter(
    (r) => r.constructionId === construction.id && r.status === "submitted"
  );
  const totalExpense = reports.reduce(
    (s, r) => s + r.foodExpense + r.materialExpense + r.otherExpense,
    0
  );

  // Active assignments
  const activeAssignments = data.assignments.filter(
    (a) => a.constructionId === construction.id && a.status === "active"
  );
  const activeTeams = new Set(activeAssignments.map((a) => a.teamId)).size;

  const teamIds = new Set(activeAssignments.map((a) => a.teamId));
  const workerCount = data.workers.filter((w) => teamIds.has(w.teamId)).length;

  return { totalProgress, totalRetention, totalExpense, activeTeams, workerCount };
}

export function calcWage(unitPrice: number, mark: AttendanceMark): number {
  if (mark === "O") return unitPrice;
  if (mark === "N") return unitPrice * 0.5;
  return 0;
}

export function calcReportTotalWage(report: DailyReport): number {
  return report.attendance.reduce((s, e) => s + e.wage, 0);
}

export function calcReportTotalExpense(report: DailyReport): number {
  return report.foodExpense + report.materialExpense + report.otherExpense;
}

export function calcDashboardStats(data: AppData) {
  const activeConstructions = data.constructions.filter(
    (c) => c.status === "active"
  ).length;

  const pendingRequests = data.personnelRequests.filter(
    (r) => r.status === "pending"
  ).length;

  const today = new Date().toISOString().split("T")[0];
  const todayReports = data.dailyReports.filter(
    (r) => r.date === today && r.status === "submitted"
  );

  const totalWorkersToday = todayReports.reduce(
    (s, r) => s + r.attendance.filter((e) => e.mark !== "X").length,
    0
  );

  const totalExpenseToday = todayReports.reduce(
    (s, r) => s + calcReportTotalExpense(r),
    0
  );

  return { activeConstructions, pendingRequests, totalWorkersToday, totalExpenseToday };
}
