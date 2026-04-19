import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatCardColor = "emerald" | "sky" | "amber" | "rose";

const toneMap: Record<StatCardColor, string> = {
  emerald: "bg-emerald-500/12 text-emerald-300",
  sky: "bg-sky-500/12 text-sky-300",
  amber: "bg-amber-500/12 text-amber-300",
  rose: "bg-rose-500/12 text-rose-300",
};

export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  color = "emerald",
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  color?: StatCardColor;
}) {
  return (
    <div className="glass-card group relative overflow-hidden rounded-3xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{title}</p>
          <h3 className="text-2xl font-black tracking-tight text-slate-100 md:text-3xl">{value}</h3>
          {description ? <p className="text-sm text-slate-400">{description}</p> : null}
        </div>
        <div className={cn("rounded-2xl p-3", toneMap[color])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-white/5 blur-2xl transition-all duration-500 group-hover:bg-white/10" />
    </div>
  );
}
