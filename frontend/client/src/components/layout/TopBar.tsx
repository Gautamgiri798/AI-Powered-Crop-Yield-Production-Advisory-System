import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, useLocation } from 'wouter';
import { Menu, Search, Bell, User, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSmartAlerts } from '@/hooks/useSmartAlerts';
import { cn } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopBarProps {
    onMenuClick: () => void;
    className?: string;
    userName?: string;
}

const PRIORITY_COLORS: Record<string, { dot: string; text: string; bg: string }> = {
    critical: { dot: "bg-red-500 animate-pulse", text: "text-red-400", bg: "bg-red-500/10" },
    high: { dot: "bg-amber-500", text: "text-amber-400", bg: "bg-amber-500/10" },
    medium: { dot: "bg-blue-500", text: "text-blue-400", bg: "bg-blue-500/10" },
    low: { dot: "bg-emerald-500", text: "text-emerald-400", bg: "bg-emerald-500/10" },
    info: { dot: "bg-slate-400", text: "text-slate-400", bg: "bg-slate-500/10" },
};

const CATEGORY_ICONS: Record<string, { icon: string; color: string }> = {
    weather: { icon: "thunderstorm", color: "text-red-400" },
    crop_suggestion: { icon: "spa", color: "text-emerald-400" },
    schedule: { icon: "alarm", color: "text-blue-400" },
    input_recommendation: { icon: "science", color: "text-purple-400" },
    season: { icon: "calendar_month", color: "text-amber-400" },
    general: { icon: "notifications", color: "text-teal-400" },
};

function timeAgoShort(d: Date) {
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `${days}d`;
}

export function TopBar({ onMenuClick, className = '', userName }: TopBarProps) {
    const [, setLocation] = useLocation();
    const { logout } = useAuth();
    const { allAlerts, unreadCount, criticalCount, markAsRead, markAllAsRead } = useSmartAlerts();
    const [notifOpen, setNotifOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    // Close panel on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setNotifOpen(false);
            }
        };
        if (notifOpen) document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [notifOpen]);
    
    const handleLogout = () => {
        logout();
        setLocation('/login');
    };

    const topAlerts = allAlerts.filter(a => !a.is_read).slice(0, 8);

    return (
        <div className={`h-[72px] bg-background/80 backdrop-blur-2xl border-b border-border/40 flex items-center px-6 lg:px-8 justify-between sticky top-0 z-40 transition-all duration-300 ${className}`}>
            {/* Left: Hamburger & Brand (Mobile) / View Title (Desktop) */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="lg:hidden hover:bg-muted/50 rounded-xl" onClick={onMenuClick}>
                    <Menu className="h-6 w-6 text-foreground" />
                </Button>
                <div className="hidden lg:flex flex-col">
                   <span className="font-extrabold text-[22px] tracking-tight text-foreground leading-none">
                       Overview
                   </span>
                   <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase mt-1">
                       Hello, {userName || 'Farmer'}
                   </span>
                </div>
                <span className="text-xl lg:hidden bg-gradient-to-br from-emerald-500 to-teal-400 bg-clip-text text-transparent font-fodax">
                    AgriSmart
                </span>
            </div>

            {/* Center: Search Bar (Desktop) */}
            <div className="hidden lg:flex flex-1 max-w-xl mx-8 relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-teal-500/0 rounded-[18px] blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative w-full">
                    <Search className="absolute left-3.5 top-3.5 h-[18px] w-[18px] text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        type="search"
                        placeholder="Search data, crops, reports..."
                        className="pl-11 pr-4 h-12 w-full bg-black/20 hover:bg-black/30 focus:bg-black/40 border-border/40 focus:border-emerald-500/50 rounded-2xl shadow-sm transition-all duration-300 placeholder:text-muted-foreground/50 text-white"
                    />
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
                {/* ── Notification Bell ── */}
                <div className="relative" ref={panelRef}>
                    <Button
                        variant="outline"
                        size="icon"
                        className="relative rounded-2xl border-border/50 bg-background/50 backdrop-blur hover:bg-muted shadow-sm hover:shadow transition-all group"
                        onClick={() => setNotifOpen(!notifOpen)}
                    >
                        <Bell className="h-[18px] w-[18px] text-muted-foreground group-hover:text-foreground transition-colors" />
                        {unreadCount > 0 && (
                            <span className={cn(
                                "absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full flex items-center justify-center border border-background shadow-sm",
                                criticalCount > 0 ? "bg-red-500 text-white animate-pulse" : "bg-amber-500 text-white"
                            )}>
                                {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                        )}
                    </Button>

                    {/* Notification Dropdown Panel */}
                    {notifOpen && (
                        <div className="absolute right-0 top-full mt-2 w-[380px] max-h-[520px] bg-card border border-border/50 rounded-2xl shadow-2xl shadow-black/20 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200 z-[100]">
                            {/* Panel Header */}
                            <div className="px-4 py-3 border-b border-border/40 bg-muted/20 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-amber-500 text-lg">notifications</span>
                                    <h3 className="text-sm font-bold text-foreground">Notifications</h3>
                                    {unreadCount > 0 && (
                                        <span className="px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 text-[10px] font-bold">
                                            {unreadCount} new
                                        </span>
                                    )}
                                </div>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-[11px] font-semibold text-emerald-500 hover:text-emerald-400 transition-colors"
                                    >
                                        Mark all read
                                    </button>
                                )}
                            </div>

                            {/* Alert Items */}
                            <div className="overflow-y-auto max-h-[400px] custom-scrollbar">
                                {topAlerts.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 px-4">
                                        <div className="size-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-3">
                                            <span className="material-symbols-outlined text-2xl text-emerald-500">done_all</span>
                                        </div>
                                        <p className="text-sm font-semibold text-foreground">All caught up!</p>
                                        <p className="text-xs text-muted-foreground mt-1 text-center">No unread notifications right now.</p>
                                    </div>
                                ) : (
                                    topAlerts.map((alert) => {
                                        const priStyle = PRIORITY_COLORS[alert.priority] || PRIORITY_COLORS.info;
                                        const catStyle = CATEGORY_ICONS[alert.category] || CATEGORY_ICONS.general;

                                        return (
                                            <div
                                                key={alert.id}
                                                className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors border-b border-border/20 last:border-none group"
                                            >
                                                {/* Priority dot */}
                                                <div className="pt-1.5 shrink-0">
                                                    <div className={cn("size-2 rounded-full", priStyle.dot)} />
                                                </div>

                                                {/* Icon */}
                                                <div className={cn("size-8 rounded-lg flex items-center justify-center shrink-0", priStyle.bg)}>
                                                    <span className={cn("material-symbols-outlined text-base", catStyle.color)}>
                                                        {alert.icon || catStyle.icon}
                                                    </span>
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[13px] font-semibold text-foreground leading-snug truncate">
                                                        {alert.title}
                                                    </p>
                                                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                                                        {alert.message}
                                                    </p>
                                                    <span className="text-[10px] text-muted-foreground/60 mt-1 inline-block">
                                                        {timeAgoShort(alert.timestamp)}
                                                    </span>
                                                </div>

                                                {/* Mark read */}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); markAsRead(alert.id); }}
                                                    className="size-7 rounded-md flex items-center justify-center text-emerald-500 hover:bg-emerald-500/10 transition-all opacity-0 group-hover:opacity-100 shrink-0 mt-0.5"
                                                    title="Mark as read"
                                                >
                                                    <span className="material-symbols-outlined text-base">check</span>
                                                </button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-4 py-2.5 border-t border-border/40 bg-muted/10">
                                <a
                                    href="/dashboard"
                                    onClick={() => setNotifOpen(false)}
                                    className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-500 hover:text-emerald-400 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                                    View All Alerts
                                </a>
                            </div>
                        </div>
                    )}
                </div>

                {/* Mobile Profile Icon with Dropdown */}
                <div className="lg:hidden">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="rounded-2xl border-border/50 bg-background/50 hover:bg-muted shadow-sm">
                                <User className="h-5 w-5 text-muted-foreground" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-xl border-border/50 shadow-xl bg-background/95 backdrop-blur-xl">
                            <DropdownMenuLabel className="font-bold">My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-border/50" />
                            <DropdownMenuItem className="text-red-500 hover:text-red-600 hover:bg-red-50 focus:text-red-600 focus:bg-red-50 cursor-pointer font-medium" onClick={handleLogout}>
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Log out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Desktop Profile Icon with Dropdown */}
                <div className="hidden lg:flex items-center ml-1.5">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <div className="flex items-center gap-3 p-1 pr-4 bg-muted/30 border border-border/40 rounded-full cursor-pointer hover:bg-muted/60 transition-colors">
                                <div className="h-9 w-9 bg-gradient-to-br from-primary/20 to-teal-500/20 rounded-full flex items-center justify-center border border-primary/20 text-primary font-bold shadow-inner shrink-0">
                                    {userName ? userName.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
                                </div>
                                <div className="flex flex-col -gap-0.5">
                                   <span className="text-sm font-bold text-foreground leading-tight">
                                       {userName || 'Farmer Profile'}
                                   </span>
                                   <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                       Free Tier
                                   </span>
                                </div>
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 mt-2 rounded-xl border-border/50 shadow-xl bg-background/95 backdrop-blur-xl">
                            <DropdownMenuLabel className="px-3 py-2.5">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-bold leading-none">{userName || 'Farmer Profile'}</p>
                                    <p className="text-xs font-medium text-muted-foreground leading-none">
                                        Free Tier User
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-border/50" />
                            <DropdownMenuItem className="text-red-500 hover:text-red-600 focus:text-red-600 focus:bg-red-500/10 cursor-pointer p-3 font-semibold transition-colors rounded-lg" onClick={handleLogout}>
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Log out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    );
}

