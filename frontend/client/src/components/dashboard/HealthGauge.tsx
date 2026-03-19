import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Droplets, Bug, Leaf, TrendingUp, AlertTriangle } from "lucide-react";

interface HealthGaugeProps {
  score: number;
  rating: string;
  title: string;
  accentColor?: string;
  className?: string;
}

const ratingConfig: Record<
  string,
  { gradient: string; badge: string; icon: React.ReactNode }
> = {
  Excellent: {
    gradient: "from-emerald-400 to-teal-500",
    badge: "bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 ring-1 ring-emerald-500/20",
    icon: <TrendingUp className="h-3 w-3" />,
  },
  Good: {
    gradient: "from-amber-400 to-yellow-500",
    badge: "bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20",
    icon: <Leaf className="h-3 w-3" />,
  },
  Fair: {
    gradient: "from-orange-400 to-red-500",
    badge: "bg-orange-500/15 text-orange-600 dark:text-orange-400 ring-1 ring-orange-500/20",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
};

const fallbackConfig = {
  gradient: "from-slate-400 to-slate-500",
  badge: "bg-muted text-muted-foreground ring-1 ring-border",
  icon: <Leaf className="h-3 w-3" />,
};

export function HealthGauge({
  score,
  rating,
  title,
  className,
}: HealthGaugeProps) {
  const config = ratingConfig[rating] ?? fallbackConfig;
  const circumference = 2 * Math.PI * 40;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <Card
      className={cn(
        "h-full overflow-hidden group relative hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 border-border/40",
        className,
      )}
    >
      <div className={`absolute inset-0 bg-gradient-to-br from-transparent to-${rating === "Good" ? "amber" : rating === "Fair" ? "orange" : "emerald"}-500/[0.03] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      <CardContent className="p-5 flex items-center gap-6 h-full relative z-10">
        {/* Animated gauge */}
        <div className="relative size-[90px] shrink-0">
          <svg className="size-full -rotate-90 drop-shadow-sm" viewBox="0 0 100 100">
            <defs>
              <linearGradient id={`gauge-${title.replace(/\s+/g, "-")}`} x1="0" y1="0" x2="1" y2="1">
                <stop
                  offset="0%"
                  stopColor={rating === "Good" ? "#fbbf24" : rating === "Fair" ? "#f97316" : "#34d399"}
                />
                <stop
                  offset="100%"
                  stopColor={rating === "Good" ? "#f59e0b" : rating === "Fair" ? "#ef4444" : "#10b981"}
                />
              </linearGradient>
              <filter id={`glow-${title.replace(/\s+/g, "-")}`}>
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            {/* Track */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              className="stroke-muted/30"
              strokeWidth="6"
            />
            {/* Progress arc */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke={`url(#gauge-${title.replace(/\s+/g, "-")})`}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              filter={`url(#glow-${title.replace(/\s+/g, "-")})`}
              className="transition-all duration-1000 ease-out origin-center"
              style={{
                transform: `rotate(${dashOffset === circumference ? "0deg" : "0deg"})`
              }}
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-black tracking-tighter">
              {score}<span className="text-[11px] font-bold text-muted-foreground ml-0.5">%</span>
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-1.5 mb-3">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-black tracking-tight truncate">{title}</h4>
              <span
                className={cn(
                  "text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md flex items-center gap-1 whitespace-nowrap shadow-sm border-0",
                  config.badge,
                )}
              >
                {config.icon}
                {rating}
              </span>
            </div>
            {/* Custom info text mapping based on rating */}
            <p className="text-[11px] text-muted-foreground font-medium truncate">
              {rating === "Excellent" ? "Crop is thriving optimally." : rating === "Good" ? "Healthy growth detected." : "Requires attention soon."}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="flex flex-col gap-1 p-2 rounded-lg bg-blue-500/5 border border-blue-500/10">
              <div className="flex items-center gap-1 text-blue-500">
                <Droplets className="size-3" />
                <span className="text-[9px] uppercase tracking-wider font-bold">Moisture</span>
              </div>
              <span className="text-[11px] font-semibold text-foreground/80 truncate">Optimal</span>
            </div>
            <div className="flex flex-col gap-1 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
              <div className="flex items-center gap-1 text-emerald-500">
                <Bug className="size-3" />
                <span className="text-[9px] uppercase tracking-wider font-bold">Pests</span>
              </div>
              <span className="text-[11px] font-semibold text-foreground/80 truncate">Clear</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
