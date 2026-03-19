import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/components/layout/ThemeProvider';
import { useField } from '@/context/FieldContext';
import { Sprout, BarChart3, User, Globe, LandPlot, ChartLine, BugOff, CalendarDays, LogOut, Sun, Moon, Plus, IndianRupee, PieChart, Package, Users, Tractor, Droplets, Target, RotateCw, Store, TrendingUp, Building2, Shield, Home, AlertCircle } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  className?: string;
}

export function Sidebar({ activeTab, onTabChange, className = '' }: SidebarProps) {
  const [, setLocation] = useLocation();
  const { language, setLanguage, t } = useTranslation();
  const { user, logout } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { fields, selectedField, setSelectedField } = useField();

  const tabs = [
    { id: 'home', icon: Home, label: t('home') },
    { id: 'my-field', icon: LandPlot, label: t('my_field') },
    { id: 'field-report', icon: BarChart3, label: t('field_report') },
    { id: 'data-analytics', icon: ChartLine, label: t('data_analytics') },
    { id: 'field-log', icon: CalendarDays, label: t('field_log') },
    { id: 'pest', icon: BugOff, label: t('pest') },
    { id: 'irrigation', icon: Droplets, label: t('irrigation') },
    { id: 'yield-prediction', icon: Target, label: t('yield_prediction') },
    { id: 'alerts', icon: AlertCircle, label: t('alerts') },
    { id: 'season-calendar', icon: CalendarDays, label: t('season_calendar') },
    { id: 'cost-calculator', icon: IndianRupee, label: t('cost_calculator') },
    { id: 'pnl-dashboard', icon: PieChart, label: t('pnl_dashboard') },
    { id: 'inventory', icon: Package, label: t('inventory') },
    { id: 'labor', icon: Users, label: t('labor') },
    { id: 'equipment', icon: Tractor, label: t('equipment') },
    { id: 'rotation', icon: RotateCw, label: t('crop_rotation') },
    { id: 'market', icon: Store, label: t('market_prices') },
    { id: 'forecast', icon: TrendingUp, label: t('price_forecast') },
    { id: 'schemes', icon: Building2, label: t('govt_schemes') },
    { id: 'insurance', icon: Shield, label: t('insurance') },
  ];

  const handleLogout = () => {
    logout();
    setLocation('/login');
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className={`w-[260px] bg-card/80 backdrop-blur-xl border-r border-border/40 text-foreground flex-shrink-0 flex flex-col transition-all duration-300 ${className}`}>
      {/* Logo and Brand */}
      <div className="p-6 pb-2 flex-shrink-0">
        <div className="flex items-center justify-between mb-2 border-b border-border/40 pb-5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white">
              <Sprout className="size-6" />
            </div>
            <div>
              <span className="text-xl tracking-tight leading-none bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent block font-fodax">AgriSmart</span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground leading-none">Farm Management</span>
            </div>
          </div>
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-muted-foreground hover:bg-muted/50 rounded-xl size-9"
            title={resolvedTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {resolvedTheme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </Button>
        </div>
      </div>

      {/* Scrollable Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden thin-scrollbar px-4 pb-4 space-y-8">
        {/* Navigation Menu */}
        <nav className="space-y-1 mt-4">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Button
                key={tab.id}
                variant="ghost"
                className={`w-full justify-start py-2.5 px-3 mb-1 font-semibold transition-all duration-200 rounded-xl border border-transparent group ${
                  isActive 
                    ? 'bg-primary/10 text-primary border-primary/20 shadow-sm' 
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }`}
                onClick={() => onTabChange(tab.id)}
                data-testid={`tab-${tab.id}`}
              >
                <tab.icon className={`mr-3 h-[18px] w-[18px] transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
                <span className="truncate">{tab.label}</span>
                {isActive && (
                  <div className="ml-auto w-1 h-4 bg-primary rounded-full shadow-[0_0_8px_var(--primary)]" />
                )}
              </Button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Sticky Section */}
      <div className="p-4 border-t border-border/40 bg-card/50 backdrop-blur-md flex-shrink-0 space-y-4">
        {/* Field Selector */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center">
              <LandPlot className="mr-1.5 h-3 w-3" />
              Current Field
            </label>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-md hover:bg-muted/80 text-muted-foreground"
              onClick={() => {
                setSelectedField(null);
                onTabChange('my-field');
              }}
              title="Add New Field"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          <Select
            value={selectedField ? String(selectedField.id) : "new"}
            onValueChange={(val) => {
              if (val === "new") {
                setSelectedField(null);
                onTabChange('my-field');
              } else {
                const field = fields.find(f => f.id === Number(val));
                setSelectedField(field || null);
              }
            }}
          >
            <SelectTrigger className="w-full bg-muted/30 border-border/50 text-sm font-semibold rounded-xl h-9 hover:bg-muted/50 transition-colors">
              <SelectValue placeholder="Select Field" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/60 shadow-xl">
              <SelectItem value="new" className="font-semibold text-primary">-- New Field --</SelectItem>
              {fields.map(field => (
                <SelectItem key={field.id} value={String(field.id)} className="font-medium">
                  {field.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* User Profile & Post Actions */}
        <div className="flex items-center justify-between p-2.5 bg-muted/40 rounded-2xl border border-border/40 hover:bg-muted/60 transition-colors">
          <div className="flex items-center space-x-3 overflow-hidden">
             {/* User Avatar */}
            <div className="w-9 h-9 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold relative shrink-0">
               {user?.username ? user.username.charAt(0).toUpperCase() : <User className="size-4" />}
               <div className="absolute -bottom-0.5 -right-0.5 size-2.5 bg-emerald-500 rounded-full border-2 border-card" />
            </div>
            <div className="truncate">
              <p className="font-bold text-sm truncate text-foreground">{user?.username || t('farmer')}</p>
              <div className="flex items-center gap-1.5 opacity-80 mt-0.5">
                  <Select value={language} onValueChange={(value) => setLanguage(value as any)}>
                    <SelectTrigger className="h-4 p-0 border-0 bg-transparent text-[10px] font-bold uppercase tracking-wider text-muted-foreground focus:ring-0 shadow-none w-auto gap-0.5 hover:text-foreground transition-colors cursor-pointer">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="min-w-[100px] rounded-lg border-border/60 shadow-lg">
                      <SelectItem value="en" className="text-xs font-semibold">English</SelectItem>
                      <SelectItem value="hi" className="text-xs font-semibold">हिंदी</SelectItem>
                      <SelectItem value="or" className="text-xs font-semibold">ଓଡ଼ିଆ</SelectItem>
                      <SelectItem value="bn" className="text-xs font-semibold">বাংলা</SelectItem>
                      <SelectItem value="pa" className="text-xs font-semibold">ਪੰਜਾਬੀ</SelectItem>
                      <SelectItem value="te" className="text-xs font-semibold">తెలుగు</SelectItem>
                    </SelectContent>
                  </Select>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-muted-foreground hover:bg-red-500/10 hover:text-red-500 rounded-xl size-8 shrink-0 transition-colors"
            title="Logout"
          >
            <LogOut className="h-[15px] w-[15px]" />
          </Button>
        </div>
      </div>
    </div>
  );
}
