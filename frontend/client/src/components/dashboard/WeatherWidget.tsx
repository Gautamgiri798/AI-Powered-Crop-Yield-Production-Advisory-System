import { Card, CardContent } from "@/components/ui/card";
import {
  Cloud,
  CloudRain,
  Sun,
  CloudSun,
  Snowflake,
  Wind,
  Droplets,
  Thermometer,
  Eye,
} from "lucide-react";

interface WeatherData {
  temp: number | string;
  condition: string;
  humidity: number;
  wind: number;
}

interface WeatherWidgetProps {
  weather: WeatherData | null;
}

const conditionIcon = (c: string) => {
  const lower = c?.toLowerCase() ?? "";
  if (lower.includes("rain") || lower.includes("drizzle"))
    return <CloudRain className="h-10 w-10" />;
  if (lower.includes("cloud") && lower.includes("sun"))
    return <CloudSun className="h-10 w-10" />;
  if (lower.includes("cloud") || lower.includes("overcast"))
    return <Cloud className="h-10 w-10" />;
  if (lower.includes("snow")) return <Snowflake className="h-10 w-10" />;
  if (lower.includes("clear") || lower.includes("sunny"))
    return <Sun className="h-10 w-10" />;
  return <CloudSun className="h-10 w-10" />;
};

export function WeatherWidget({ weather }: WeatherWidgetProps) {
  const loading = !weather;

  if (loading) {
    return (
      <Card className="h-full overflow-hidden border-0">
        <CardContent className="p-0 h-full">
          <div className="h-full bg-gradient-to-br from-sky-600/80 via-blue-700/80 to-indigo-800/80 animate-pulse rounded-xl min-h-[220px]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full overflow-hidden border-0 shadow-none group relative ring-1 ring-border/20">
      <CardContent className="p-0 h-full relative">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-sky-400 via-blue-600 to-indigo-800 dark:from-sky-600 dark:via-blue-800 dark:to-indigo-950 transition-all duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(255,255,255,0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />

        {/* Floating icon (subtle pulse) */}
        <div className="absolute -top-10 -right-10 opacity-[0.15] pointer-events-none select-none mix-blend-overlay">
          <Sun className="h-64 w-64 text-white animate-[spin_60s_linear_infinite]" />
        </div>

        <div className="relative z-10 p-7 flex flex-col justify-between h-full min-h-[220px] text-white">
          {/* Top */}
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-1.5 flex items-center gap-1.5 backdrop-blur-sm bg-white/10 px-2 py-0.5 rounded-sm w-fit">
                <CloudSun className="size-3" />
                Live Weather
              </p>
              <div className="flex items-baseline gap-1 relative">
                <span className="text-7xl font-black tracking-tighter leading-none drop-shadow-md">
                  {weather.temp}°
                </span>
              </div>
              <p className="text-sm font-semibold text-white/90 mt-2 tracking-wide">
                {weather.condition}
              </p>
            </div>
            <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
              {conditionIcon(weather.condition)}
            </div>
          </div>

          {/* Bottom stats — frosted glass pills */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 mt-8">
            {[
              {
                label: "Wind",
                value: `${weather.wind} km/h`,
                icon: <Wind className="h-3 w-3 hidden sm:block" />,
              },
              {
                label: "Humidity",
                value: `${weather.humidity}%`,
                icon: <Droplets className="h-3 w-3 hidden sm:block" />,
              },
              {
                label: "UV Index",
                value: "Moderate",
                icon: <Eye className="h-3 w-3 hidden sm:block" />,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center sm:items-start text-center sm:text-left gap-1 bg-white/10 backdrop-blur-md rounded-xl p-2 sm:p-3 border border-white/[0.08] transition-all duration-300 hover:bg-white/[0.18] hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-center sm:justify-start gap-1 sm:gap-1.5 text-[8px] sm:text-[9px] uppercase tracking-widest text-white/60 font-bold mb-0.5">
                  {stat.icon}
                  <span className="truncate">{stat.label}</span>
                </div>
                <span className="text-xs sm:text-sm font-black tracking-tight">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
