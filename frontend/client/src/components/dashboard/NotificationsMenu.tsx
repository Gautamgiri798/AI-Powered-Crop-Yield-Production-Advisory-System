"use client";

import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useField } from "@/context/FieldContext";
import { cn } from "@/lib/utils";
import { useSmartAlerts, SmartAlert } from "@/hooks/useSmartAlerts";

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

interface NotificationsMenuProps {
  onNavigate: (tabId: string) => void;
}

export function NotificationsMenu({ onNavigate }: NotificationsMenuProps) {
  const { allAlerts, unreadCount, markAsRead, loading } = useSmartAlerts();
  const [open, setOpen] = useState(false);

  const displayAlerts = allAlerts
    .filter(a => !a.is_read)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 5);
  
  const handleViewAll = () => {
    setOpen(false);
    onNavigate("alerts");
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors group">
          <span className="material-symbols-outlined group-hover:scale-110 transition-transform">notifications</span>
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex size-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full size-3 bg-red-500 border-2 border-background"></span>
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-[320px] rounded-xl shadow-xl border-border/50 bg-background/95 backdrop-blur-xl p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-card/80 border-b border-border/50">
          <h4 className="font-semibold text-sm">Notifications</h4>
          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">
            {unreadCount} unread
          </span>
        </div>
        
        <div className="max-h-[360px] overflow-y-auto thin-scrollbar">
          {loading ? (
            <div className="p-8 text-center flex flex-col items-center">
              <div className="size-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin mb-3"></div>
              <p className="text-xs text-muted-foreground">Syncing alerts...</p>
            </div>
          ) : displayAlerts.length === 0 ? (
            <div className="px-4 py-8 text-center flex flex-col items-center">
              <div className="size-14 rounded-2xl bg-muted/30 flex items-center justify-center mb-3 group-hover:rotate-12 transition-transform">
                <span className="material-symbols-outlined text-muted-foreground/30 text-3xl">notifications_off</span>
              </div>
              <p className="text-sm font-semibold text-foreground/80">No New Notifications</p>
              <p className="text-[11px] text-muted-foreground mt-1 max-w-[200px] mx-auto">
                You're all caught up! AI-generated field advisories will appear here.
              </p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border/20">
              {displayAlerts.map((alertItem) => (
                <DropdownMenuItem 
                  key={alertItem.id} 
                  className="flex flex-col items-start gap-1 p-3 cursor-pointer border-b border-border/30 last:border-0 hover:bg-muted/50 focus:bg-muted/50"
                  onClick={() => {
                    markAsRead(alertItem.id);
                    handleViewAll();
                  }}
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className={cn(
                      "size-8 rounded-lg shrink-0 flex items-center justify-center mt-0.5",
                      alertItem.priority === 'critical' || alertItem.priority === 'high' ? "bg-red-500/10" : "bg-blue-500/10"
                    )}>
                      <span className={cn(
                        "material-symbols-outlined text-[16px]",
                        alertItem.priority === 'critical' || alertItem.priority === 'high' ? "text-red-500" : "text-blue-500"
                      )}>{alertItem.icon || 'notifications'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-snug line-clamp-1">{alertItem.title}</p>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">{alertItem.message}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] bg-muted/80 text-muted-foreground px-1.5 py-0.5 rounded flex items-center gap-1">
                            <span className="material-symbols-outlined text-[10px]">schedule</span>
                            {timeAgo(alertItem.timestamp.toISOString())}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(alertItem.id);
                          }}
                          className="text-[10px] text-primary hover:underline font-bold"
                        >
                          Mark Read
                        </button>
                      </div>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </div>
        
        <DropdownMenuSeparator className="m-0 bg-border/50" />
        
        <div className="p-2 bg-card">
            <button 
                onClick={handleViewAll}
                className="w-full py-2 text-xs font-semibold rounded-lg text-center hover:bg-muted transition-colors text-primary"
            >
                View all reports & alerts →
            </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
