import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  if (amount >= 1_000_000_000) {
    return (amount / 1_000_000_000).toFixed(2).replace(/\.?0+$/, "") + " tỷ";
  }
  if (amount >= 1_000_000) {
    return (amount / 1_000_000).toFixed(1).replace(/\.?0+$/, "") + " tr";
  }
  return amount.toLocaleString("vi-VN") + " đ";
}

export function formatCurrencyFull(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function formatDateShort(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

export function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

export function genId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function getMarkLabel(mark: string): string {
  if (mark === "O") return "Cả ngày";
  if (mark === "N") return "Nửa ngày";
  return "Vắng";
}

export function getMarkBadgeClass(mark: string): string {
  if (mark === "O") return "bg-emerald-500/20 text-emerald-300";
  if (mark === "N") return "bg-amber-500/20 text-amber-300";
  return "bg-slate-700 text-slate-400";
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    planning: "Lên kế hoạch",
    active: "Đang thi công",
    paused: "Tạm dừng",
    completed: "Hoàn thành",
    not_started: "Chưa bắt đầu",
    in_progress: "Đang thi công",
    pending: "Chờ duyệt",
    approved: "Đã duyệt",
    rejected: "Từ chối",
    draft: "Nháp",
    submitted: "Đã nộp",
  };
  return map[status] ?? status;
}

export function getStatusClass(status: string): string {
  const map: Record<string, string> = {
    planning: "bg-sky-500/15 text-sky-300",
    active: "bg-emerald-500/15 text-emerald-300",
    in_progress: "bg-emerald-500/15 text-emerald-300",
    paused: "bg-amber-500/15 text-amber-300",
    completed: "bg-slate-500/15 text-slate-300",
    not_started: "bg-slate-700/40 text-slate-400",
    pending: "bg-amber-500/15 text-amber-300",
    approved: "bg-emerald-500/15 text-emerald-300",
    rejected: "bg-rose-500/15 text-rose-300",
    submitted: "bg-sky-500/15 text-sky-300",
    draft: "bg-slate-700/40 text-slate-400",
  };
  return map[status] ?? "bg-slate-700 text-slate-400";
}

export function getRequestTypeLabel(type: string): string {
  if (type === "add") return "Thêm người";
  if (type === "remove") return "Giảm người";
  return "Chuyển người";
}

export function getRequestTypeClass(type: string): string {
  if (type === "add") return "bg-emerald-500/15 text-emerald-300";
  if (type === "remove") return "bg-rose-500/15 text-rose-300";
  return "bg-sky-500/15 text-sky-300";
}
