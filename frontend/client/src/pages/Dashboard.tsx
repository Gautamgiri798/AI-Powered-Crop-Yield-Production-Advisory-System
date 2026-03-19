import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { NotificationsMenu } from "@/components/dashboard/NotificationsMenu";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { FieldReport } from "@/components/field/FieldReport";
import { MyField } from "@/components/field/MyField";
import { DataAnalytics } from "@/components/analytics/DataAnalytics";
import ChatBot from "@/components/chat/ChatBot";
import { Pest } from "@/components/field/Pest";
import { FieldLog } from "@/components/field/FieldLog";
import { FieldAlerts } from "@/components/field/FieldAlerts";
import { CostCalculator } from "@/components/finance/CostCalculator";
import { PnLDashboard } from "@/components/finance/PnLDashboard";
import { SeasonCalendar } from "@/components/planning/SeasonCalendar";
import { InventoryTracker } from "@/components/planning/InventoryTracker";
import { LaborManager } from "@/components/planning/LaborManager";
import { EquipmentScheduler } from "@/components/planning/EquipmentScheduler";
import { IrrigationScheduler } from "@/components/field/IrrigationScheduler";
import { YieldPrediction } from "@/components/field/YieldPrediction";
import { RotationPlanner } from "@/components/planning/RotationPlanner";
import { MarketPrices } from "@/components/finance/MarketPrices";
import { PriceForecast } from "@/components/finance/PriceForecast";
import { SchemeMatcher } from "@/components/finance/SchemeMatcher";
import { InsuranceClaims } from "@/components/finance/InsuranceClaims";
import { HomeDashboard } from "@/components/dashboard/HomeDashboard";
import { PricingPlans } from "@/components/dashboard/PricingPlans";
import { useAuth } from "@/context/AuthContext";
import { useField, Field } from "@/context/FieldContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
// Navigation items configuration with grouping
const navItems = [
  // Core
  { id: "home", label: "Dashboard", icon: "dashboard" },
  { id: "my-field", label: "My Field", icon: "grass" },
  { id: "field-report", label: "Field Report", icon: "monitoring" },
  { id: "data-analytics", label: "Analytics", icon: "query_stats" },
  // Field Operations
  { id: "field-log", label: "Field Log", icon: "event_note" },
  { id: "pest", label: "Pest Detection", icon: "bug_report" },
  { id: "irrigation", label: "Irrigation", icon: "water_drop" },
  { id: "yield-prediction", label: "Yield Prediction", icon: "trending_up" },
  { id: "alerts", label: "Alerts", icon: "notifications" },
  // Planning
  { id: "season-calendar", label: "Season Calendar", icon: "calendar_month" },
  { id: "rotation", label: "Crop Rotation", icon: "autorenew" },
  { id: "inventory", label: "Inventory", icon: "inventory_2" },
  { id: "labor", label: "Labor", icon: "groups" },
  { id: "equipment", label: "Equipment", icon: "agriculture" },
  // Finance & Market
  { id: "cost-calculator", label: "Costs & Revenue", icon: "calculate" },
  { id: "pnl-dashboard", label: "Profit & Loss", icon: "pie_chart" },
  { id: "market", label: "Market Prices", icon: "storefront" },
  { id: "forecast", label: "Price Forecast", icon: "show_chart" },
  { id: "schemes", label: "Govt Schemes", icon: "account_balance" },
  { id: "insurance", label: "Insurance", icon: "shield" },
];

// Tab title mapping
const tabTitles: Record<string, string> = {
  home: "Dashboard Overview",
  "my-field": "Field Management",
  "field-report": "Field Report",
  "data-analytics": "Data Analytics",
  pest: "Pest Detection",
  "field-log": "Field Log",
  "cost-calculator": "Cost Calculator",
  "pnl-dashboard": "Profit & Loss",
  "season-calendar": "Season Calendar",
  inventory: "Inventory Tracker",
  labor: "Labor Management",
  equipment: "Equipment Scheduler",
  irrigation: "Irrigation Scheduler",
  "yield-prediction": "Yield Prediction",
  rotation: "Crop Rotation",
  market: "Market Prices",
  forecast: "Price Forecast",
  schemes: "Government Schemes",
  insurance: "Insurance Claims",
  alerts: "Field Alerts",
  settings: "Settings",
  pricing: "Subscription Plans",
};

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
     if (typeof window !== "undefined") {
       return localStorage.getItem("krishisaarthi_active_tab") || "home";
     }
     return "home";
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const { user, logout } = useAuth();
  const {
    fields,
    selectedField,
    setSelectedField,
    deleteField,
    loading: fieldsLoading,
  } = useField();
  const { toast } = useToast();

  const handleDeleteField = async () => {
    if (!fieldToDelete) return;
    const success = await deleteField(fieldToDelete.id);
    if (success) {
      toast({
        title: "Field Deleted",
        description: `Successfully removed ${fieldToDelete.name}`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete the field. Please try again.",
      });
    }
    setFieldToDelete(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("krishisaarthi_active_tab");
    logout();
    setLocation("/login");
  };

  // Effect to save tab preference to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("krishisaarthi_active_tab", activeTab);
    }
  }, [activeTab]);

  const renderTabContent = () => {
    switch (activeTab) {
      case "home":
        return <HomeDashboard onNavigate={setActiveTab} />;
      case "field-report":
        return <FieldReport />;
      case "my-field":
        return <MyField />;
      case "data-analytics":
        return <DataAnalytics />;
      case "pest":
        return <Pest />;
      case "field-log":
        return <FieldLog />;
      case "cost-calculator":
        return <CostCalculator />;
      case "pnl-dashboard":
        return <PnLDashboard />;
      case "season-calendar":
        return <SeasonCalendar />;
      case "inventory":
        return <InventoryTracker />;
      case "labor":
        return <LaborManager />;
      case "equipment":
        return <EquipmentScheduler />;
      case "irrigation":
        return <IrrigationScheduler />;
      case "yield-prediction":
        return <YieldPrediction />;
      case "rotation":
        return <RotationPlanner />;
      case "market":
        return <MarketPrices />;
      case "forecast":
        return <PriceForecast />;
      case "schemes":
        return <SchemeMatcher />;
      case "insurance":
        return <InsuranceClaims />;
      case "alerts":
        return <FieldAlerts />;
      case "pricing":
        return <PricingPlans />;
      case "logout":
        handleLogout();
        return null; // Redirecting
      default:
        return <HomeDashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground font-sans transition-colors duration-200 print:h-auto print:block print:overflow-visible">
      {/* Mobile Menu Overlay - Premium Blur */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1999] lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-[2000] w-[285px] flex-shrink-0 flex flex-col print:hidden",
          "bg-[#040A07]/95 backdrop-blur-3xl border-r border-white/5 shadow-[25px_0_50px_rgba(0,0,0,0.6)]",
          "transform transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1)",
          isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Subtle Side Glow */}
        <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-transparent via-primary/20 to-transparent"></div>

        {/* Logo Section */}
        <div className="p-8 flex items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-700">
          <div className="size-12 rounded-[1.2rem] bg-black/40 backdrop-blur-2xl flex items-center justify-center border border-white/10 shadow-[0_0_30px_rgba(34,197,94,0.15)] text-primary shrink-0 transition-transform hover:scale-105 active:scale-95 cursor-pointer">
            <span className="material-symbols-outlined text-3xl bg-gradient-to-br from-primary to-emerald-400 bg-clip-text text-transparent">
              agriculture
            </span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-fodax text-white tracking-tight leading-none">
              Krishi<span className="text-primary">Saarthi</span>
            </h1>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mt-1.5 ml-0.5">
              Farm Intelligence
            </p>
          </div>
        </div>

        {/* Navigation - Futuristic Command Style */}
        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto thin-scrollbar relative z-10">
          <div className="px-4 py-2 text-[10px] font-bold text-white/20 uppercase tracking-[0.25em] mb-2">
            Main Controls
          </div>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'logout') {
                  handleLogout();
                } else {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }
              }}
              className={cn(
                "w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold transition-all duration-500 relative group overflow-hidden active:scale-95 touch-manipulation",
                activeTab === item.id
                  ? "bg-primary/10 text-primary border border-primary/30 active-nav-item-bg shadow-[0_0_20px_rgba(34,197,94,0.1)]"
                  : item.id === 'logout'
                  ? "text-red-400/60 hover:bg-red-500/10 hover:text-red-400 border border-transparent"
                  : "text-white/40 hover:bg-white/[0.04] hover:text-white border border-transparent hover:border-white/5",
              )}
            >
              {/* Active/Hover Glow Effect Layer */}
              <div className={cn(
                "absolute inset-0 transition-opacity duration-700 pointer-events-none overflow-hidden",
                activeTab === item.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              )}>
                <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.04] via-transparent to-transparent"></div>
                {activeTab === item.id && <div className="active-item-scan-line"></div>}
                <div className="nav-item-glow-effect"></div>
              </div>

              {/* Active Indicator Line - Smoother & Pulses */}
              {activeTab === item.id && (
                <div className="absolute left-[-16px] top-1/2 -translate-y-1/2 w-[6px] h-12 bg-primary rounded-r-full shadow-[0_0_20px_rgba(34,197,94,1),0_0_40px_rgba(34,197,94,0.4)] animate-[sidebarActivePulse_2s_infinite_ease-in-out] z-30"></div>
              )}

              <span
                className={cn(
                  "material-symbols-outlined transition-all duration-500 text-[22px] relative z-20",
                  activeTab === item.id
                    ? "scale-110 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]"
                    : "group-hover:text-primary group-hover:scale-125 group-hover:rotate-6",
                )}
              >
                {item.icon}
              </span>
              <span className={cn(
                "text-[14px] tracking-tight relative z-20 transition-all duration-500",
                activeTab === item.id ? "translate-x-1" : "group-hover:translate-x-2"
              )}>
                {item.label}
              </span>

              {/* Subtle Point on Hover - Animated */}
              <div className="ml-auto opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-2 group-hover:translate-x-0">
                <span className="material-symbols-outlined text-[16px] text-primary/60 group-hover:animate-pulse">
                  chevron_right
                </span>
              </div>
            </button>
          ))}
        </nav>

        {/* User Profile - Integrated Logout */}
        <div className="p-4 border-t border-white/5 mt-auto bg-black/40 backdrop-blur-md relative z-10">
          <div className="flex items-center gap-3 p-3 rounded-[1.25rem] bg-white/[0.03] border border-white/5 shadow-sm relative overflow-hidden group hover:bg-white/[0.06] transition-all duration-500 cursor-pointer">
            {/* Shifting background glow for profile */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/[0.02] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            
            <div className="size-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold shadow-[inset_0_0_12px_rgba(34,197,94,0.1)] border border-primary/20 shrink-0 group-hover:scale-105 transition-transform duration-500">
              {user?.username?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate text-white tracking-tight">
                {user?.username || "Farmer Profile"}
              </p>
              <p className="text-[10px] uppercase font-black text-primary/60 truncate tracking-[0.1em] mt-0.5">
                Premium Tier ⚡
              </p>
            </div>
            <button 
              onClick={handleLogout}
              className="size-9 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all duration-300 active:scale-95 touch-manipulation relative z-20 group/logout"
              title="Logout"
            >
              <span className="material-symbols-outlined text-[18px] group-hover/logout:rotate-12 transition-transform">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative print:block print:overflow-visible print:h-auto print:bg-[#020604]">
        {/* Top Header - Premium Design */}
        <header className="h-14 md:h-20 flex items-center justify-between px-3 md:px-10 bg-[#060D09]/95 backdrop-blur-2xl border-b border-white/5 sticky top-0 z-30 ring-1 ring-white/[0.02] gap-2 lg:gap-3 print:hidden">
          <div className="flex items-center gap-2 lg:gap-3 flex-1 min-w-0">
            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-1.5 sm:p-2 text-white/60 hover:text-white transition-colors bg-white/5 rounded-xl border border-white/10 shrink-0"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <span className="material-symbols-outlined text-[20px] sm:text-[20px]">
                menu
              </span>
            </button>

            {/* Page Title & Breadcrumb */}
            <div className="flex flex-col animate-in fade-in slide-in-from-top-4 duration-700 min-w-0 pr-1 sm:pr-2">
              <div className="flex items-center gap-1 sm:gap-2 text-[8px] sm:text-[10px] uppercase font-bold text-white/30 tracking-[0.15em] mb-0.5">
                <span className="hidden sm:inline">Main Console</span>
                <span className="material-symbols-outlined text-[10px] hidden sm:inline">
                  chevron_right
                </span>
                <span className="text-primary/60 truncate">
                  {activeTab.replace("-", " ")}
                </span>
              </div>
              <h2 className="text-[15px] sm:text-lg md:text-2xl font-bold text-white tracking-tight drop-shadow-sm flex items-center gap-1.5 sm:gap-2 shrink-0 min-w-0">
                <span className="truncate">
                  {tabTitles[activeTab] || "Dashboard"}
                </span>
                <div className="hidden sm:block size-1.5 rounded-full bg-primary animate-pulse shrink-0 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
              </h2>
            </div>

            {/* Field Selector - Global Integration */}
            <div className="sm:ml-2 border-l border-white/10 pl-2 lg:ml-4 lg:pl-4 shrink-0 flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 sm:gap-2.5 px-2 sm:px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all group">
                    <div className="size-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[16px] text-primary">
                        landscape
                      </span>
                    </div>
                    <div className="text-left overflow-hidden hidden sm:block">
                      <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider leading-none mb-1">
                        Active Field
                      </p>
                      <p className="text-xs font-bold text-white/80 group-hover:text-white transition-colors truncate max-w-[120px]">
                        {selectedField?.name || "No Field"}
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-white/20 text-[18px] group-hover:text-primary transition-all duration-500 group-hover:rotate-180">
                      expand_more
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-[260px] rounded-[1.5rem] shadow-[0_10px_40px_rgba(0,0,0,0.6)] border-white/10 bg-[#0A120E] backdrop-blur-2xl p-2 ring-1 ring-white/5"
                >
                  <div className="px-3 py-2 text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">
                    Switch Workspace
                  </div>

                  <div className="max-h-[280px] overflow-y-auto thin-scrollbar">
                    {fields.length > 0 ? (
                      fields.map((f: Field) => (
                        <DropdownMenuItem
                          key={f.id}
                          onClick={() => setSelectedField(f)}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all mb-1 group/field",
                            selectedField?.id === f.id
                              ? "bg-primary/10 text-primary border border-primary/20"
                              : "hover:bg-white/5 text-white/60 hover:text-white border border-transparent",
                          )}
                        >
                          <div
                            className={cn(
                              "size-8 rounded-lg flex items-center justify-center shrink-0",
                              selectedField?.id === f.id
                                ? "bg-primary/20"
                                : "bg-white/5",
                            )}
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              grass
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-bold truncate">
                              {f.name}
                            </p>
                            <p className="text-[10px] text-white/30 mt-0.5">
                              {f.cropType || "Unknown Crop"} •{" "}
                              {f.area ? `${f.area} ha` : "Auto-calc"}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 min-w-max">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setFieldToDelete({ id: f.id, name: f.name });
                              }}
                              className="opacity-40 hover:opacity-100 p-1 hover:bg-red-500/10 text-red-400 rounded-md transition-all duration-300 hover:scale-110 active:scale-90"
                              title="Delete Field"
                            >
                              <span className="material-symbols-outlined text-[15px]">
                                delete
                              </span>
                            </button>
                            {selectedField?.id === f.id && (
                              <span className="material-symbols-outlined text-primary text-[18px] animate-in zoom-in-50 duration-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]">
                                check_circle
                              </span>
                            )}
                          </div>
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <div className="p-10 text-center animate-in fade-in zoom-in-95 duration-700">
                        <div className="size-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3 border border-white/5">
                          <span className="material-symbols-outlined text-2xl text-white/10">
                            landscape
                          </span>
                        </div>
                        <p className="text-xs font-bold text-white/30 uppercase tracking-[0.1em]">
                          No active fields found
                        </p>
                        <p className="text-[10px] text-white/10 mt-1">
                          Initialize your first field below
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="h-px bg-white/5 my-2"></div>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedField(null);
                      setActiveTab("my-field");
                    }}
                    className="flex items-center gap-3 p-3 rounded-xl cursor-pointer bg-primary/[0.08] hover:bg-primary/[0.15] text-primary transition-all border border-primary/10"
                  >
                    <div className="size-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[18px]">
                        add_circle
                      </span>
                    </div>
                    <p className="text-[13px] font-black uppercase tracking-wider">
                      Add New Field
                    </p>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-1 sm:gap-2 md:gap-4 shrink-0 animate-in fade-in slide-in-from-right-4 duration-700">
            {/* Search - Desktop Only */}
            <div className="relative hidden md:block group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-white/30 group-focus-within:text-primary transition-colors text-xl z-20">
                search
              </span>
              <input
                className="w-72 lg:w-96 pl-12 pr-6 py-3 bg-black/40 border border-white/10 rounded-2xl text-[14px] font-medium text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-inner"
                placeholder="Search data, crops, reports..."
                type="text"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <kbd className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] text-white/40 font-bold tracking-tighter shadow-sm">
                  ⌘
                </kbd>
                <kbd className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] text-white/40 font-bold tracking-tighter shadow-sm">
                  K
                </kbd>
              </div>
            </div>

            <div className="h-6 sm:h-8 w-px bg-white/10 hidden sm:block mx-0.5 sm:mx-1"></div>

            <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
              <ThemeToggle />
              <div className="relative">
                <NotificationsMenu onNavigate={setActiveTab} />
              </div>
            </div>

            {/* Mobile Search Button */}
            <button 
              onClick={() => setIsMobileSearchOpen(true)}
              className="md:hidden p-1.5 sm:p-2 text-white/60 hover:text-white transition-colors bg-white/5 rounded-xl border border-white/10"
            >
              <span className="material-symbols-outlined text-[18px] sm:text-[20px]">
                search
              </span>
            </button>
          </div>

          {/* Mobile Search Overlay */}
          {isMobileSearchOpen && (
            <div className="absolute inset-0 z-50 bg-[#040A07] flex items-center px-4 md:hidden animate-in slide-in-from-top-2 fade-in duration-200 border-b border-white/10">
               <span className="material-symbols-outlined text-primary text-[22px] shrink-0">search</span>
               <input
                 autoFocus
                 type="text"
                 placeholder="Search data, crops, reports..."
                 className="flex-1 bg-transparent text-white text-[15px] px-3 focus:outline-none placeholder:text-white/30 h-full"
               />
               <button 
                 onClick={() => setIsMobileSearchOpen(false)}
                 className="p-2 text-white/50 hover:text-white rounded-xl bg-white/5 border border-white/10 shrink-0 ml-2 transition-all active:scale-95"
               >
                 <span className="material-symbols-outlined text-[20px]">close</span>
               </button>
            </div>
          )}
        </header>

        {/* Dashboard Content - Scrollable Viewport */}
        <div className="flex-1 overflow-y-auto thin-scrollbar print:overflow-visible print:h-auto">
          <div className="p-3 sm:p-5 md:p-10 max-w-[1600px] mx-auto w-full print:p-0 print:max-w-none">
            {renderTabContent()}
          </div>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!fieldToDelete}
        onOpenChange={(open) => !open && setFieldToDelete(null)}
      >
        <AlertDialogContent className="rounded-[1.5rem] border-white/10 bg-[#0A120E] backdrop-blur-2xl ring-1 ring-white/5">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-white">
              Delete Field?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/40 font-medium">
              Are you sure you want to delete{" "}
              <span className="text-white font-bold">
                "{fieldToDelete?.name}"
              </span>
              ? This will permanently remove all associated logs, analytics, and
              data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-3">
            <AlertDialogCancel className="bg-white/5 border-white/5 text-white/60 hover:bg-white/10 hover:text-white rounded-xl font-bold transition-all">
              Cancel Action
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteField}
              className="bg-red-500 hover:bg-red-600 text-white border-0 rounded-xl font-bold transition-all shadow-lg shadow-red-500/20"
            >
              Confirm Deletion
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ChatBot Floating */}
      <ChatBot />
    </div>
  );
}
