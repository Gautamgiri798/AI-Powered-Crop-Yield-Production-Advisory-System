import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, LineChart, RefreshCw, AlertTriangle, Lightbulb, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import {
    ComposedChart,
    Area,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer
} from 'recharts';

interface ForecastDay {
    date: string;
    day: number;
    predicted_price: number;
    lower_bound: number;
    upper_bound: number;
    confidence: number;
}

interface Recommendation {
    type: string;
    icon: string;
    text: string;
    action?: string;
}

interface ForecastData {
    crop: string;
    base_price: number;
    forecast_days: number;
    forecast: ForecastDay[];
    summary: {
        current_price: number;
        end_price: number;
        min_price: number;
        max_price: number;
        avg_price: number;
        trend: string;
        volatility: string;
        confidence: string;
    };
    recommendation: Recommendation[];
}

const CROPS = ['Rice', 'Wheat', 'Cotton', 'Sugarcane', 'Maize', 'Soybean', 'Groundnut', 'Pulses', 'Potato', 'Onion', 'Tomato'];

export function PriceForecast() {
    const [crop, setCrop] = useState('Rice');
    const [days, setDays] = useState('30');
    const [data, setData] = useState<ForecastData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchForecast = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiFetch(`/finance/price-forecast?crop=${crop}&days=${days}`);
            setData(response as ForecastData);
        } catch (err) {
            setError('Failed to load price forecast');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchForecast();
    }, [crop, days]);

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'bullish': return <TrendingUp className="h-5 w-5 text-green-500" />;
            case 'bearish': return <TrendingDown className="h-5 w-5 text-red-500" />;
            default: return <Minus className="h-5 w-5 text-gray-500" />;
        }
    };

    const getTrendColor = (trend: string) => {
        switch (trend) {
            case 'bullish': return 'text-green-600 dark:text-green-400 bg-green-500/10';
            case 'bearish': return 'text-red-600 dark:text-red-400 bg-red-500/10';
            default: return 'text-foreground bg-muted';
        }
    };

    const getVolatilityColor = (volatility: string) => {
        switch (volatility) {
            case 'low': return 'bg-green-500/15 text-green-700 dark:text-green-400';
            case 'medium': return 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400';
            case 'high': return 'bg-red-500/15 text-red-700 dark:text-red-400';
            default: return 'bg-muted text-muted-foreground';
        }
    };

    const enhancedForecast = useMemo(() => {
        if (!data?.forecast) return [];
        return data.forecast.map(d => ({
            ...d,
            bounds: [Math.round(d.lower_bound), Math.round(d.upper_bound)]
        }));
    }, [data]);

    const formatPrice = (price: number) => `₹${price.toLocaleString('en-IN')}`;

    const priceChange = data ? data.summary.end_price - data.summary.current_price : 0;
    const priceChangePercent = data ? ((priceChange / data.summary.current_price) * 100).toFixed(1) : '0';

    return (
        <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                        <LineChart className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                        Price Forecast
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">AI-powered crop price predictions for the next {days} days</p>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                    <Select value={crop} onValueChange={setCrop}>
                        <SelectTrigger className="w-[100px] sm:w-40 text-xs sm:text-sm h-9 sm:h-10">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px]">
                            {CROPS.map(c => (
                                <SelectItem key={c} value={c} className="text-xs sm:text-sm">{c}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={days} onValueChange={setDays}>
                        <SelectTrigger className="w-[85px] sm:w-32 text-xs sm:text-sm h-9 sm:h-10">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7" className="text-xs sm:text-sm">7 Days</SelectItem>
                            <SelectItem value="15" className="text-xs sm:text-sm">15 Days</SelectItem>
                            <SelectItem value="30" className="text-xs sm:text-sm">30 Days</SelectItem>
                            <SelectItem value="60" className="text-xs sm:text-sm">60 Days</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button variant="outline" size="icon" onClick={fetchForecast} disabled={loading} className="h-9 w-9 sm:h-10 sm:w-10 shrink-0">
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {error && (
                <Card className="border-red-200 bg-red-400/10">
                    <CardContent className="p-3 sm:p-4 flex items-center gap-2 text-red-500 text-xs sm:text-sm font-semibold">
                        <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
                        {error}
                    </CardContent>
                </Card>
            )}

            {data && (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
                        <Card className="border-border/50 bg-card/60 backdrop-blur shadow-sm hover:shadow-md transition-all overflow-hidden">
                            <CardContent className="p-3 sm:p-5 flex flex-col justify-center min-h-[100px]">
                                <div className="text-[9px] sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider truncate">Current Price</div>
                                <div className="text-lg sm:text-3xl font-bold mt-1 sm:mt-2 text-foreground truncate">{formatPrice(data.summary.current_price)}</div>
                                <div className="text-[9px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">per quintal</div>
                            </CardContent>
                        </Card>

                        <Card className="border-border/50 bg-card/60 backdrop-blur shadow-sm hover:shadow-md transition-all overflow-hidden">
                            <CardContent className="p-3 sm:p-5 flex flex-col justify-center min-h-[100px]">
                                <div className="text-[9px] sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider truncate">Expected ({days}d)</div>
                                <div className="text-lg sm:text-3xl font-bold flex items-center gap-1 sm:gap-2 mt-1 sm:mt-2 text-foreground truncate">
                                    {formatPrice(data.summary.end_price)}
                                    {priceChange >= 0 ? (
                                        <ArrowUpRight className="h-4 w-4 sm:h-6 sm:w-6 text-emerald-500 shrink-0" />
                                    ) : (
                                        <ArrowDownRight className="h-4 w-4 sm:h-6 sm:w-6 text-red-500 shrink-0" />
                                    )}
                                </div>
                                <div className={`text-[10px] sm:text-sm mt-0.5 sm:mt-1 font-semibold truncate ${priceChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {priceChange >= 0 ? '+' : ''}{priceChangePercent}% vs now
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-border/50 bg-card/60 backdrop-blur shadow-sm hover:shadow-md transition-all overflow-hidden">
                            <CardContent className="p-3 sm:p-5 flex flex-col justify-center min-h-[100px]">
                                <div className="text-[9px] sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider truncate">Price Range</div>
                                <div className="text-sm sm:text-xl font-bold mt-1 sm:mt-2 flex flex-col sm:flex-row sm:items-center tracking-tight text-foreground truncate">
                                    {formatPrice(data.summary.min_price)} <span className="text-muted-foreground hidden sm:inline mx-1">-</span>
                                    <span className="sm:hidden text-[9px] text-muted-foreground opacity-50 px-1 text-center">to</span>
                                    {formatPrice(data.summary.max_price)}
                                </div>
                                <div className="text-[9px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">predicted limits</div>
                            </CardContent>
                        </Card>

                        <Card className="border-border/50 bg-card/60 backdrop-blur shadow-sm hover:shadow-md transition-all overflow-hidden">
                            <CardContent className="p-3 sm:p-5 flex flex-col justify-center min-h-[100px]">
                                <div className="text-[9px] sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider truncate">Market Trend</div>
                                <div className={`inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-sm font-bold mt-1 sm:mt-2 self-start ${getTrendColor(data.summary.trend)}`}>
                                    {data.summary.trend === 'bullish' ? <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" /> : data.summary.trend === 'bearish' ? <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4" /> : <Minus className="h-3 w-3 sm:h-4 sm:w-4" />}
                                    <span className="truncate">{data.summary.trend.charAt(0).toUpperCase() + data.summary.trend.slice(1)}</span>
                                </div>
                                <div className="mt-1 sm:mt-2 text-left">
                                    <Badge className={`${getVolatilityColor(data.summary.volatility)} font-bold tracking-wider uppercase text-[8px] sm:text-[10px] leading-tight px-1.5 py-0`}>
                                        {data.summary.volatility} volatility
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Chart */}
                    <Card className="border-border/50 bg-card/60 backdrop-blur shadow-sm">
                        <CardHeader className="pb-0 sm:pb-2 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm sm:text-lg flex items-center gap-1.5 sm:gap-2">
                                <LineChart className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                                Price Trend Chart
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-2 sm:p-6 pt-0">
                            <div className="relative h-[250px] sm:h-[300px] w-full mt-2 sm:mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={enhancedForecast} margin={{ top: 10, right: 8, left: 2, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.3} />
                                        <XAxis 
                                            dataKey="day" 
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 500 }}
                                            tickFormatter={(val) => `D${val}`}
                                            dy={5}
                                            minTickGap={20}
                                        />
                                        <YAxis 
                                            domain={['dataMin - Math.round(dataMin * 0.05)', 'dataMax + Math.round(dataMax * 0.05)']}
                                            axisLine={false}
                                            tickLine={false}
                                            tickFormatter={(val) => `₹${val}`}
                                            tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 500 }}
                                            width={44}
                                            dx={-2}
                                        />
                                        <RechartsTooltip 
                                            cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '4 4' }}
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0].payload;
                                                    return (
                                                        <div className="bg-background/95 backdrop-blur-md border border-border/60 p-2 sm:p-4 rounded-xl shadow-2xl min-w-[140px] sm:min-w-[180px]">
                                                            <div className="flex items-center justify-between mb-2 sm:mb-3 border-b border-border/50 pb-1.5 sm:pb-2">
                                                                <p className="font-bold text-xs sm:text-sm text-foreground">Day {data.day}</p>
                                                                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded-md">
                                                                    {new Date(data.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                                                                </span>
                                                            </div>
                                                            <div className="space-y-1.5 sm:space-y-2">
                                                                <div className="flex justify-between items-center gap-2 sm:gap-4">
                                                                    <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Predicted</span>
                                                                    <span className="font-bold text-emerald-500 text-xs sm:text-base tracking-tight">₹{data.predicted_price.toLocaleString('en-IN')}</span>
                                                                </div>
                                                                <div className="flex justify-between items-center gap-2 sm:gap-4">
                                                                    <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Range</span>
                                                                    <span className="font-medium text-muted-foreground text-[10px] sm:text-sm tracking-tight">₹{data.bounds[0].toLocaleString('en-IN')}-₹{data.bounds[1].toLocaleString('en-IN')}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="bounds" 
                                            stroke="none" 
                                            fill="#10b981" 
                                            fillOpacity={0.15} 
                                        />
                                        <Line 
                                            type="monotone" 
                                            dataKey="predicted_price" 
                                            stroke="#10b981" 
                                            strokeWidth={3} 
                                            dot={false}
                                            activeDot={{ r: 6, fill: "#10b981", stroke: "hsl(var(--background))", strokeWidth: 2 }}
                                            style={{ filter: "drop-shadow(0px 4px 8px rgba(16, 185, 129, 0.4))" }}
                                        />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recommendations */}
                    <Card>
                        <CardHeader className="pb-2 sm:pb-6">
                            <CardTitle className="text-sm sm:text-lg flex items-center gap-1.5 sm:gap-2">
                                <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                                AI Recommendations
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 sm:space-y-3 px-3 sm:px-6 pb-4 sm:pb-6">
                            {data.recommendation.map((rec, index) => (
                                <div
                                    key={index}
                                    className={`flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg ${
                                        rec.type === 'warning'
                                            ? 'bg-yellow-500/10 border border-yellow-500/20'
                                            : 'bg-muted border border-border'
                                    }`}
                                >
                                    <span className="text-lg sm:text-xl shrink-0 mt-0.5">{rec.icon}</span>
                                    <div className="min-w-0">
                                        <p className="text-xs sm:text-sm text-foreground leading-snug">{rec.text}</p>
                                        {rec.action && (
                                            <Badge variant="outline" className="mt-1.5 text-foreground border-border text-[9px] sm:text-[10px] px-1.5 py-0 sm:py-0.5">
                                                Recommended: {rec.action.toUpperCase()}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
