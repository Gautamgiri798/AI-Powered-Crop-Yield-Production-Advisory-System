import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/layout/ThemeProvider";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(resolvedTheme === "light" ? "dark" : "light")}
      className={cn(
        "relative rounded-xl w-10 h-10 transition-all duration-300 overflow-hidden group border border-transparent shadow-sm",
        resolvedTheme === "dark" 
            ? "bg-slate-800/80 hover:bg-slate-800 hover:border-slate-700/50 hover:shadow-indigo-500/10" 
            : "bg-amber-100/50 hover:bg-amber-100 hover:border-amber-200/50 hover:shadow-orange-500/10"
      )}
      title="Toggle Theme"
    >
      <div className="absolute inset-0 flex items-center justify-center transition-transform duration-500 transform group-hover:scale-110">
          <Sun className={cn(
              "absolute h-[1.3rem] w-[1.3rem] text-amber-500 transition-all duration-500",
              resolvedTheme === "dark" ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
          )} />
          <Moon className={cn(
              "absolute h-[1.3rem] w-[1.3rem] text-indigo-400 transition-all duration-500",
              resolvedTheme === "dark" ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
          )} />
      </div>
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
