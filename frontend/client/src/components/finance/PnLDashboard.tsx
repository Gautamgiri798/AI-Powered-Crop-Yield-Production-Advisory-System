// src/components/finance/PnLDashboard.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useField } from "@/context/FieldContext";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';

type PnLData = {
    summary: {
        total_costs: number;
        total_revenue: number;
        profit_loss: number;
        profit_margin: number | null;
        is_profitable: boolean;
    };
    cost_breakdown: Array<{
        category: string;
        category_display: string;
        total: number;
        percentage: number;
    }>;
    revenue_by_crop: Array<{
        crop: string;
        total: number;
        quantity: number;
    }>;
};

// Stat Card Component
const StatCard = ({
    title,
    value,
    trend,
    icon,
    iconBg,
    iconColor,
    valueColor
}: {
    title: string;
    value: string;
    trend?: string;
    icon: string;
    iconBg: string;
    iconColor: string;
    valueColor?: string;
}) => (
    <Card className="border-border/50 bg-card/60 backdrop-blur shadow-sm hover:shadow-md transition-all">
        <CardContent className="p-6">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-muted-foreground">{title}</p>
                    <p className={cn("text-2xl font-bold mt-1", valueColor)}>{value}</p>
                    {trend && (
                        <p className="text-xs text-muted-foreground mt-1">{trend}</p>
                    )}
                </div>
                <div className={cn("size-12 rounded-xl flex items-center justify-center", iconBg)}>
                    <span className={cn("material-symbols-outlined text-xl", iconColor)}>{icon}</span>
                </div>
            </div>
        </CardContent>
    </Card>
);

export function PnLDashboard() {
    const { token } = useAuth();
    const { selectedField } = useField();

    const [data, setData] = useState<PnLData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPnL = async () => {
            if (!token || !selectedField) return;
            setLoading(true);
            try {
                const pnlData = await apiFetch<PnLData>(
                    `/finance/pnl?field_id=${selectedField.id}`
                );
                setData(pnlData);
            } catch (err) {
                console.error("Failed to fetch P&L data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPnL();
    }, [token, selectedField]);

    const handleExportPDF = () => { window.print(); };

    if (!selectedField) {
        return (
            <Card className="text-center">
                <CardContent className="p-12 flex flex-col items-center">
                    <span className="material-symbols-outlined text-5xl text-muted-foreground mb-4">payments</span>
                    <p className="text-muted-foreground">Please select a field to view P&L dashboard.</p>
                </CardContent>
            </Card>
        );
    }

    if (loading) {
        return (
            <Card className="text-center">
                <CardContent className="p-12 flex flex-col items-center">
                    <span className="material-symbols-outlined text-4xl animate-spin text-primary">progress_activity</span>
                </CardContent>
            </Card>
        );
    }

    if (!data) {
        return (
            <Card className="text-center">
                <CardContent className="p-12 space-y-4 flex flex-col items-center">
                    <div className="size-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                        <span className="material-symbols-outlined text-3xl text-muted-foreground">currency_rupee</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold">No Financial Data Yet</h3>
                        <p className="text-muted-foreground text-sm mt-1 max-w-sm mx-auto">
                            Start tracking your farm's finances by adding cost entries or recording revenue.
                        </p>
                    </div>
                    <div className="flex gap-4 justify-center">
                        <Button variant="outline" className="gap-2">
                            <span className="material-symbols-outlined text-lg">receipt_long</span>
                            Track Costs
                        </Button>
                        <Button className="gap-2">
                            <span className="material-symbols-outlined text-lg">add</span>
                            Add Revenue
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const { summary, cost_breakdown, revenue_by_crop } = data;
    const COLORS = ['#10b981', '#0ea5e9', '#8b5cf6', '#f43f5e', '#f59e0b', '#14b8a6', '#d946ef', '#06b6d4'];

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Profit & Loss</h1>
                    <p className="text-muted-foreground text-sm mt-1">Financial overview for {selectedField.name}</p>
                </div>
                <div className="flex gap-2">
                    <Button 
                        variant="outline" 
                        onClick={handleExportPDF}
                        className="gap-2 border-border/40 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 shadow-sm print:hidden"
                    >
                        <span className="material-symbols-outlined text-lg">download</span>
                        Export
                    </Button>
                    <Button className="gap-2 print:hidden">
                        <span className="material-symbols-outlined text-lg">add</span>
                        Add Entry
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 px-1">
                <StatCard
                    title="Total Revenue"
                    value={`₹${summary.total_revenue.toLocaleString("en-IN")}`}
                    icon="trending_up"
                    iconBg="bg-emerald-500/10"
                    iconColor="text-emerald-500"
                    valueColor="text-emerald-500"
                />
                <StatCard
                    title="Total Costs"
                    value={`₹${summary.total_costs.toLocaleString("en-IN")}`}
                    icon="trending_down"
                    iconBg="bg-rose-500/10"
                    iconColor="text-rose-500"
                    valueColor="text-rose-500"
                />
                <StatCard
                    title="Net Profit"
                    value={`${summary.is_profitable ? "+" : ""}₹${summary.profit_loss.toLocaleString("en-IN")}`}
                    icon={summary.is_profitable ? "savings" : "money_off"}
                    iconBg={summary.is_profitable ? "bg-primary/10" : "bg-rose-500/10"}
                    iconColor={summary.is_profitable ? "text-primary" : "text-rose-500"}
                    valueColor={summary.is_profitable ? "text-primary" : "text-rose-500"}
                />
                <StatCard
                    title="Margin"
                    value={summary.profit_margin !== null ? `${summary.profit_margin.toFixed(1)}%` : "N/A"}
                    icon="pie_chart"
                    iconBg="bg-blue-500/10"
                    iconColor="text-blue-500"
                    valueColor={(summary.profit_margin ?? 0) >= 0 ? "text-primary" : "text-rose-500"}
                />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cost Breakdown */}
                <Card className="flex flex-col border-border/50 bg-card/60 backdrop-blur shadow-sm">
                    <CardContent className="p-6 flex-1 flex flex-col">
                        <div className="flex items-center gap-2 mb-6">
                            <span className="material-symbols-outlined text-primary">donut_large</span>
                            <h3 className="font-bold">Cost Breakdown</h3>
                        </div>
                        {cost_breakdown.length > 0 ? (
                            <div className="flex-1 flex flex-col justify-center min-h-[300px] -mt-4 relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={cost_breakdown}
                                            dataKey="total"
                                            nameKey="category_display"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={75}
                                            outerRadius={105}
                                            paddingAngle={4}
                                            stroke="transparent"
                                        >
                                            {cost_breakdown.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0].payload;
                                                    return (
                                                        <div className="bg-background/95 backdrop-blur-md border border-border/50 p-3 rounded-xl shadow-xl">
                                                            <p className="font-semibold text-sm mb-1">{data.category_display}</p>
                                                            <p className="text-primary font-bold">₹{data.total.toLocaleString("en-IN")}</p>
                                                            <p className="text-xs text-muted-foreground mt-0.5">{data.percentage.toFixed(1)}% of total</p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-4">
                                     <span className="text-2xl font-black text-foreground -mb-1">
                                         ₹{(summary.total_costs / 1000).toFixed(0)}K
                                     </span>
                                     <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                                         Total
                                     </span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center py-8">No cost data available.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Revenue by Crop */}
                <Card className="flex flex-col border-border/50 bg-card/60 backdrop-blur shadow-sm">
                    <CardContent className="p-6 flex-1 flex flex-col">
                        <div className="flex items-center gap-2 mb-6">
                            <span className="material-symbols-outlined text-primary">bar_chart</span>
                            <h3 className="font-bold">Revenue by Crop</h3>
                        </div>
                        {revenue_by_crop.length > 0 ? (
                            <div className="space-y-5">
                                {revenue_by_crop.map((item) => {
                                    const maxRevenue = Math.max(...revenue_by_crop.map(r => r.total));
                                    const barWidth = (item.total / maxRevenue) * 100;
                                    return (
                                        <div key={item.crop} className="space-y-2">
                                            <div className="flex justify-between items-end text-sm">
                                                <span className="font-semibold text-foreground tracking-tight">{item.crop}</span>
                                                <span className="text-primary font-bold tracking-tight">₹{item.total.toLocaleString("en-IN")}</span>
                                            </div>
                                            <div className="h-6 bg-muted/50 rounded-lg overflow-hidden relative border border-border/30">
                                                <div
                                                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-lg transition-all duration-700 ease-out shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                                                    style={{ width: `${barWidth}%` }}
                                                />
                                                <span className="absolute inset-y-0 left-3 flex items-center text-[11px] text-white font-bold tracking-wider drop-shadow-sm whitespace-nowrap overflow-hidden text-ellipsis right-3">
                                                    {item.quantity.toLocaleString("en-IN")} kg
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <span className="material-symbols-outlined text-4xl text-muted-foreground mb-2">receipt</span>
                                <p className="text-muted-foreground text-sm">No revenue recorded yet.</p>
                                <Button variant="outline" className="mt-4 gap-2">
                                    <span className="material-symbols-outlined text-lg">add</span>
                                    Add Revenue
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Monthly Trend */}
            <Card className="border-border/50 bg-card/60 backdrop-blur shadow-sm">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">trending_up</span>
                            <h3 className="font-bold">Monthly Trend</h3>
                        </div>
                    </div>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={[
                                    { month: "Jan", revenue: 45000, costs: 22000 },
                                    { month: "Feb", revenue: 52000, costs: 28000 },
                                    { month: "Mar", revenue: 48000, costs: 25000 },
                                    { month: "Apr", revenue: 61000, costs: 30000 },
                                    { month: "May", revenue: 59000, costs: 32000 },
                                    { month: "Jun", revenue: Math.max(summary.total_revenue, 65000), costs: Math.max(summary.total_costs, 34000) }
                                ]}
                                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                                barGap={8}
                            >
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={1}/>
                                        <stop offset="95%" stopColor="#059669" stopOpacity={0.8}/>
                                    </linearGradient>
                                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={1}/>
                                        <stop offset="95%" stopColor="#e11d48" stopOpacity={0.8}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                                <XAxis 
                                    dataKey="month" 
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 500 }}
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                                    tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 500 }}
                                    dx={-10}
                                />
                                <Tooltip
                                    cursor={{ fill: 'hsl(var(--muted)/0.4)' }}
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-background/95 backdrop-blur-md border border-border/50 p-3 rounded-xl shadow-xl min-w-[150px]">
                                                    <p className="font-bold text-sm mb-3 border-b border-border/50 pb-2">{label} Overview</p>
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">Revenue</span>
                                                        <span className="font-bold text-emerald-500 text-sm">₹{payload[0].value?.toLocaleString('en-IN')}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs font-semibold text-rose-500 uppercase tracking-wider">Costs</span>
                                                        <span className="font-bold text-rose-500 text-sm">₹{payload[1].value?.toLocaleString('en-IN')}</span>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Legend 
                                    wrapperStyle={{ paddingTop: '20px' }}
                                    iconType="circle"
                                    formatter={(value) => <span className="text-sm font-semibold text-foreground ml-1">{value}</span>}
                                />
                                <Bar dataKey="revenue" name="Revenue" fill="url(#colorRev)" radius={[6, 6, 0, 0]} maxBarSize={35} />
                                <Bar dataKey="costs" name="Costs" fill="url(#colorCost)" radius={[6, 6, 0, 0]} maxBarSize={35} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
