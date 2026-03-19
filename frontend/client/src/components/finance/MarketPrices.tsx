import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { MapPin, Search, RefreshCw, TrendingUp, TrendingDown, Wheat, Lightbulb, AlertCircle } from "lucide-react";

interface MandiPrice {
  crop: string;
  min_price: number;
  max_price: number;
  modal_price: number;
  msp: number | null;
  vs_msp: number | null;
  trend: string;
  unit: string;
}

interface MandiData {
  mandi: string;
  prices: MandiPrice[];
  arrivals: number;
  last_updated: string;
}

interface PriceTrend {
  crop: string;
  data: { date: string; price: number; day: string }[];
  change_7d: number;
}

interface CropSummary {
  crop: string;
  modal_price: number;
  msp: number | null;
  trend: string;
  change: number;
}

interface MarketTip {
  type: string;
  icon: string;
  text: string;
}

interface MarketData {
  state: string;
  crop: string | null;
  date: string;
  mandi_prices: MandiData[];
  price_trends: PriceTrend;
  crops_summary: CropSummary[] | null;
  market_tips: MarketTip[];
}

const STATES = ['Punjab', 'Haryana', 'Uttar Pradesh', 'Maharashtra', 'Gujarat', 'Madhya Pradesh', 'Kerala'];
const CROPS = ['Rice', 'Wheat', 'Cotton', 'Sugarcane', 'Maize', 'Soybean', 'Groundnut', 'Pulses', 'Potato', 'Onion', 'Tomato'];

export function MarketPrices() {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState(() => localStorage.getItem('market_state') || 'Punjab');
  const [crop, setCrop] = useState<string>('');

  useEffect(() => {
    localStorage.setItem('market_state', state);
    fetchMarketData();
  }, [state, crop]);

  const fetchMarketData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ state });
      if (crop && crop !== 'all') params.append('crop', crop);
      const result = await apiFetch(`/finance/market-prices?${params}`) as MarketData;
      setData(result);
    } catch (error) {
      console.error("Failed to fetch market data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => `₹${price.toLocaleString()}`;

  // Get top gainers and losers
  const topGainers = data?.crops_summary?.filter(c => c.change > 0).sort((a, b) => b.change - a.change).slice(0, 3) || [];
  const topLosers = data?.crops_summary?.filter(c => c.change < 0).sort((a, b) => a.change - b.change).slice(0, 3) || [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-gradient-to-r from-amber-500/10 via-transparent to-transparent p-5 rounded-3xl border border-amber-500/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">Market Prices</h1>
          <p className="text-muted-foreground text-sm mt-1.5 font-medium">Live commodity rates from regional mandis</p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap relative z-10">
          <Select value={state} onValueChange={setState}>
            <SelectTrigger className="w-[160px] bg-card/50 backdrop-blur-md border-border/50 rounded-xl hover:bg-card/80 transition-colors h-10">
              <MapPin className="size-4 mr-2 text-primary" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/50 shadow-xl">
              {STATES.map(s => (
                <SelectItem key={s} value={s} className="rounded-lg">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={crop} onValueChange={setCrop}>
            <SelectTrigger className="w-[140px] bg-card/50 backdrop-blur-md border-border/50 rounded-xl hover:bg-card/80 transition-colors h-10">
              <SelectValue placeholder="All Crops" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/50 shadow-xl">
              <SelectItem value="all" className="rounded-lg">All Crops</SelectItem>
              {CROPS.map(c => (
                <SelectItem key={c} value={c} className="rounded-lg">{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search items..."
              className="w-48 pl-9 pr-4 h-10 bg-black/40 backdrop-blur-md border border-border/40 rounded-xl text-sm text-white focus:bg-black/60 focus:ring-2 focus:ring-primary/30 outline-none transition-all placeholder:text-muted-foreground/50"
            />
          </div>
          
          <Button onClick={fetchMarketData} variant="outline" size="icon" disabled={loading} className="shrink-0 rounded-xl size-10 bg-card/50 backdrop-blur-md hover:bg-primary/10 hover:text-primary transition-colors border-border/50">
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {loading ? (
        <Card className="text-center rounded-3xl border-border/40 overflow-hidden relative shadow-sm h-64 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50 pointer-events-none" />
            <div className="flex flex-col items-center gap-3 relative z-10">
              <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse">
                <RefreshCw className="size-5 text-primary animate-spin" />
              </div>
              <p className="text-sm font-medium text-muted-foreground animate-pulse">Syncing live market data...</p>
            </div>
        </Card>
      ) : data ? (
        <div className="space-y-6">
          {/* Top Gainers & Losers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Top Gainers */}
            <Card className="rounded-3xl border-border/40 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-6 relative z-10">
                <div className="flex items-center gap-3 mb-5">
                  <div className="size-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <TrendingUp className="size-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold tracking-tight text-lg">Top Gainers</h3>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-semibold">Past 24 Hours</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {topGainers.length > 0 ? topGainers.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-2xl hover:bg-muted/40 border border-transparent hover:border-border/30 transition-colors">
                      <div className="flex items-center gap-3.5">
                        <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                           <Wheat className="size-5" />
                        </div>
                        <div>
                          <p className="font-bold text-[15px]">{item.crop}</p>
                          <p className="text-xs text-muted-foreground font-medium mt-0.5">{formatPrice(item.modal_price)} / qtl</p>
                        </div>
                      </div>
                      <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 font-bold border-0 px-2.5 py-1 text-xs">
                        +{item.change}%
                      </Badge>
                    </div>
                  )) : (
                    <div className="p-4 flex justify-center border border-dashed border-border/50 rounded-2xl">
                        <p className="text-sm text-muted-foreground italic">No gainers recorded today.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top Losers */}
            <Card className="rounded-3xl border-border/40 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-6 relative z-10">
                <div className="flex items-center gap-3 mb-5">
                  <div className="size-10 rounded-xl bg-gradient-to-br from-red-400 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/20">
                     <TrendingDown className="size-5 text-white" />
                  </div>
                  <div>
                     <h3 className="font-bold tracking-tight text-lg">Top Losers</h3>
                     <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-semibold">Past 24 Hours</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {topLosers.length > 0 ? topLosers.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-2xl hover:bg-muted/40 border border-transparent hover:border-border/30 transition-colors">
                      <div className="flex items-center gap-3.5">
                        <div className="size-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                          <Wheat className="size-5" />
                        </div>
                        <div>
                          <p className="font-bold text-[15px]">{item.crop}</p>
                          <p className="text-xs text-muted-foreground font-medium mt-0.5">{formatPrice(item.modal_price)} / qtl</p>
                        </div>
                      </div>
                      <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20 font-bold border-0 px-2.5 py-1 text-xs">
                        {item.change}%
                      </Badge>
                    </div>
                  )) : (
                    <div className="p-4 flex justify-center border border-dashed border-border/50 rounded-2xl">
                        <p className="text-sm text-muted-foreground italic">No losers recorded today.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Price Table */}
          <Card className="rounded-3xl border-border/40 shadow-sm relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.02] to-transparent pointer-events-none" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-5 border-b border-border/40 relative z-10 px-6 pt-6">
              <div className="flex items-center gap-3">
                 <div className="size-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm shadow-amber-500/20">
                   <Wheat className="size-4 text-white" />
                 </div>
                 <CardTitle className="text-lg font-bold tracking-tight">Market Directory</CardTitle>
              </div>
              <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-card/50 backdrop-blur-sm border-border/50 py-1">
                Updated: {data.date}
              </Badge>
            </CardHeader>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto relative z-10">
              <table className="w-full text-left border-collapse">
                <thead className="bg-muted/30 text-[11px] uppercase tracking-widest text-muted-foreground font-bold border-b border-border/40">
                  <tr>
                    <th className="px-6 py-4 font-bold">Commodity</th>
                    <th className="px-6 py-4 font-bold">Market (Mandi)</th>
                    <th className="px-6 py-4 font-bold text-right">Min Rate</th>
                    <th className="px-6 py-4 font-bold text-right">Max Rate</th>
                    <th className="px-6 py-4 font-bold text-right">Modal Rate</th>
                    <th className="px-6 py-4 font-bold text-center">MSP Diff</th>
                    <th className="px-6 py-4 font-bold text-center">Trend Chart</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 text-[13px]">
                  {data.mandi_prices.flatMap(m =>
                    m.prices.map((p, pIdx) => ({ ...p, mandi: m.mandi, arrivals: m.arrivals, id: `${m.mandi}-${p.crop}-${pIdx}` }))
                  ).slice(0, 15).map((row) => (
                    <tr key={row.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-4 font-bold flex items-center gap-3 text-foreground/90">
                        <div className="size-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                          <Wheat className="size-4" />
                        </div>
                        {row.crop}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground font-medium">{row.mandi}</td>
                      <td className="px-6 py-4 text-right font-mono font-medium text-muted-foreground/70">{formatPrice(row.min_price)}</td>
                      <td className="px-6 py-4 text-right font-mono font-medium text-muted-foreground/70">{formatPrice(row.max_price)}</td>
                      <td className="px-6 py-4 text-right font-black text-foreground tracking-tight text-[15px]">{formatPrice(row.modal_price)}</td>
                      <td className="px-6 py-4">
                        {row.vs_msp !== null ? (
                          <div className={cn(
                            "flex items-center justify-center gap-1 font-bold text-xs px-2 py-1 rounded-md w-fit mx-auto border",
                            row.vs_msp >= 0 ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" : "text-red-500 bg-red-500/10 border-red-500/20"
                          )}>
                            {row.vs_msp >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                            {row.vs_msp >= 0 ? '+' : ''}{row.vs_msp}%
                          </div>
                        ) : (
                          <div className="text-center font-bold text-muted-foreground/50">-</div>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <div className="w-16 h-8 mx-auto opacity-70 group-hover:opacity-100 transition-opacity">
                          <svg
                            className={cn(
                              "w-full h-full fill-none stroke-[2.5]",
                              row.trend === 'up' ? "stroke-emerald-500" : row.trend === 'down' ? "stroke-red-500" : "stroke-muted-foreground"
                            )}
                            viewBox="0 0 80 24"
                            strokeLinecap="round"
                          >
                            <path d={row.trend === 'up'
                              ? "M0,20 Q10,22 20,16 T40,12 T60,8 T80,4"
                              : row.trend === 'down'
                                ? "M0,4 Q10,6 20,10 T40,14 T60,18 T80,20"
                                : "M0,12 Q20,12 40,12 T80,12"
                            }></path>
                          </svg>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <CardContent className="md:hidden p-4 space-y-4 relative z-10 bg-muted/10">
              {data.mandi_prices.slice(0, 5).map((mandi, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-card border border-border/50 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between pb-2 border-b border-border/40">
                    <div className="flex items-center gap-2">
                       <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
                          <MapPin className="size-3.5 text-primary" />
                       </div>
                       <span className="font-bold tracking-tight">{mandi.mandi}</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted p-1 rounded-md">{mandi.arrivals} qtl</span>
                  </div>
                  {mandi.prices.slice(0, 3).map((p, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2">
                         <Wheat className="size-3.5 text-amber-500" />
                         <span className="font-bold text-sm tracking-tight">{p.crop}</span>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <span className="font-black tracking-tighter">{formatPrice(p.modal_price)}</span>
                        {p.vs_msp !== null && (
                          <Badge variant="outline" className={cn(
                            "text-[10px] px-1.5 py-0 border-0 font-bold",
                            p.vs_msp >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                          )}>
                             {p.vs_msp >= 0 ? '+' : ''}{p.vs_msp}%
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Market Tips */}
          {data.market_tips.length > 0 && (
            <Card className="rounded-3xl border-border/40 shadow-sm relative overflow-hidden overflow-visible border border-primary/20">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
              <CardContent className="p-6 relative z-10">
                <div className="flex items-center gap-3 mb-5">
                   <div className="size-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                     <Lightbulb className="size-5 text-white" />
                   </div>
                   <h3 className="font-bold tracking-tight text-lg">Market Intelligence</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.market_tips.map((tip, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-card border border-border/50 flex items-start gap-4 hover:shadow-md transition-shadow">
                      <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 opacity-80">
                         {/* Fallback to text icon if mapping fails, otherwise could use a proper icon map */}
                         <span className="text-xl leading-none">{tip.icon}</span> 
                      </div>
                      <p className="text-sm font-medium leading-relaxed text-foreground/80 mt-1">{tip.text}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card className="text-center rounded-3xl border-border/40 overflow-hidden relative shadow-sm h-64 flex items-center justify-center group border-dashed">
            <div className="flex flex-col items-center gap-3 relative z-10">
              <div className="size-12 rounded-2xl bg-muted flex items-center justify-center group-hover:scale-110 transition-transform">
                <AlertCircle className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Unable to fetch live commodity rates at this moment.</p>
              <Button onClick={fetchMarketData} variant="outline" size="sm" className="rounded-xl mt-2 h-8 text-xs font-bold border-border/50">Try Again</Button>
            </div>
        </Card>
      )}
    </div>
  );
}
