import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Building2, FileText, ExternalLink, Calendar, IndianRupee, Filter, Search, CheckCircle2, Clock, AlertCircle, Wallet, GraduationCap, Shield, Gift, RefreshCw } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Scheme {
    id: number;
    name: string;
    scheme_type: string;
    description: string;
    benefits: string;
    eligible_crops: string[];
    eligible_states: string[];
    min_land_acres: number;
    max_subsidy_amount: number | null;
    subsidy_percentage?: number;
    documents_required: string[];
    link: string;
    is_active: boolean;
    application_deadline?: string;
    match_score: number;
}

interface SchemesData {
    total_schemes: number;
    user_crops: string[];
    schemes: Scheme[];
    grouped: {
        subsidy: Scheme[];
        loan: Scheme[];
        insurance: Scheme[];
        grant: Scheme[];
        training: Scheme[];
    };
    tips: { icon: string; text: string }[];
}

const STATES = ['Punjab', 'Haryana', 'Uttar Pradesh', 'Maharashtra', 'Gujarat', 'Madhya Pradesh', 'Kerala'];
const SCHEME_TYPES = [
    { value: 'all', label: 'All Types', icon: Filter },
    { value: 'subsidy', label: 'Subsidies', icon: Gift },
    { value: 'loan', label: 'Loans', icon: Wallet },
    { value: 'insurance', label: 'Insurance', icon: Shield },
    { value: 'grant', label: 'Grants', icon: IndianRupee },
    { value: 'training', label: 'Training', icon: GraduationCap },
];

export function SchemeMatcher() {
    const [data, setData] = useState<SchemesData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [state, setState] = useState('Punjab');
    const [schemeType, setSchemeType] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedScheme, setExpandedScheme] = useState<number | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchSchemes = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (state) params.append('state', state);
            if (schemeType !== 'all') params.append('type', schemeType);
            params.append('_t', Date.now().toString());

            const response = await apiFetch(`/finance/schemes?${params.toString()}`);
            setData(response as SchemesData);
            setLastUpdated(new Date());
        } catch (err) {
            setError('Failed to load government schemes');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSchemes();

        // Auto-refresh periodically to keep data recent (every 5 minutes)
        const interval = setInterval(() => {
            fetchSchemes();
        }, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [state, schemeType]);

    const getSchemeTypeIcon = (type: string) => {
        const typeConfig = SCHEME_TYPES.find(t => t.value === type);
        if (typeConfig) {
            const Icon = typeConfig.icon;
            return <Icon className="h-4 w-4" />;
        }
        return <FileText className="h-4 w-4" />;
    };

    const getSchemeTypeBadge = (type: string) => {
        const colors: Record<string, string> = {
            subsidy: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
            loan: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
            insurance: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
            grant: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
            training: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
        };
        return colors[type] || 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    };

    const getMatchScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-gray-600';
    };

    const formatAmount = (amount: number | null) => {
        if (!amount) return 'Varies';
        return `₹${amount.toLocaleString('en-IN')}`;
    };

    const filteredSchemes = data?.schemes.filter(scheme => {
        if (!searchQuery) return true;
        return scheme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            scheme.description.toLowerCase().includes(searchQuery.toLowerCase());
    }) || [];

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="size-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 relative shrink-0">
                        <Building2 className="h-7 w-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground uppercase">Govt Schemes</h1>
                        <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-0.5">Advisory & financial support programs</p>
                    </div>
                </div>

                <div className="flex gap-3 md:mt-0 items-center">
                    {lastUpdated && (
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] bg-muted/40 px-3 py-1.5 rounded-lg border border-border/50 hidden sm:flex items-center gap-1.5 animate-in fade-in">
                            <Clock className="h-3 w-3 text-emerald-500" />
                            Updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    )}
                    <Button variant="outline" onClick={fetchSchemes} disabled={loading} className="gap-2 transition-all shadow-md active:scale-95 bg-card/60 backdrop-blur-xl border-border/50 hover:bg-emerald-600 hover:text-white hover:border-transparent group">
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                        {loading ? 'Fetching...' : 'Refresh'}
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-4 px-1">
                <Card className="border-border/40 shadow-sm bg-card/40 backdrop-blur-xl overflow-hidden relative group">
                    <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
                    <CardContent className="p-4 sm:p-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em] text-muted-foreground ml-1">Location</label>
                                <Select value={state} onValueChange={setState}>
                                    <SelectTrigger className="bg-black/40 backdrop-blur-xl border-border/40 focus:ring-emerald-500/30 h-12 sm:h-11 text-xs font-black uppercase tracking-widest rounded-xl text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-border/50 bg-[#0A120E] backdrop-blur-3xl">
                                        {STATES.map(s => (
                                            <SelectItem key={s} value={s} className="text-xs font-bold uppercase tracking-widest">{s}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em] text-muted-foreground ml-1">Category</label>
                                <Select value={schemeType} onValueChange={setSchemeType}>
                                    <SelectTrigger className="bg-black/40 backdrop-blur-xl border-border/40 focus:ring-emerald-500/30 h-12 sm:h-11 text-xs font-black uppercase tracking-widest rounded-xl text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-border/50 bg-[#0A120E] backdrop-blur-3xl">
                                        {SCHEME_TYPES.map(t => (
                                            <SelectItem key={t.value} value={t.value} className="text-xs font-bold uppercase tracking-widest">{t.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em] text-muted-foreground ml-1">Search Database</label>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500/60" />
                                <Input
                                    placeholder="e.g. Subsidy, Loan..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-11 bg-black/40 backdrop-blur-xl text-white placeholder:text-muted-foreground/40 border-border/40 transition-all h-11 text-sm font-bold focus-visible:ring-emerald-500/30 rounded-xl"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Stats */}
            {data && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
                    <Card className="border-border/50 shadow-sm bg-card/60 backdrop-blur-xl overflow-hidden relative group transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-green-500/50 to-transparent" />
                        <CardContent className="p-3 sm:p-5 flex flex-col items-center justify-center text-center">
                            <div className="text-2xl sm:text-3xl font-black text-green-600 dark:text-green-500 drop-shadow-sm mb-0.5 sm:mb-1">{data.grouped.subsidy.length}</div>
                            <div className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Subsidies</div>
                        </CardContent>
                    </Card>
                    <Card className="border-border/50 shadow-sm bg-card/60 backdrop-blur-xl overflow-hidden relative group transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
                        <CardContent className="p-3 sm:p-5 flex flex-col items-center justify-center text-center">
                            <div className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-500 drop-shadow-sm mb-0.5 sm:mb-1">{data.grouped.loan.length}</div>
                            <div className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Loans</div>
                        </CardContent>
                    </Card>
                    <Card className="border-border/50 shadow-sm bg-card/60 backdrop-blur-xl overflow-hidden relative group transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
                        <CardContent className="p-3 sm:p-5 flex flex-col items-center justify-center text-center">
                            <div className="text-2xl sm:text-3xl font-black text-violet-600 dark:text-violet-500 drop-shadow-sm mb-0.5 sm:mb-1">{data.grouped.insurance.length}</div>
                            <div className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Insurance</div>
                        </CardContent>
                    </Card>
                    <Card className="border-border/50 shadow-sm bg-card/60 backdrop-blur-xl overflow-hidden relative group transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />
                        <CardContent className="p-3 sm:p-5 flex flex-col items-center justify-center text-center">
                            <div className="text-2xl sm:text-3xl font-black text-yellow-600 dark:text-yellow-500 drop-shadow-sm mb-0.5 sm:mb-1">{data.grouped.grant.length}</div>
                            <div className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Grants</div>
                        </CardContent>
                    </Card>
                    <Card className="border-border/50 shadow-sm bg-card/60 backdrop-blur-xl overflow-hidden relative group transition-all duration-300 hover:shadow-lg hover:-translate-y-1 col-span-2 sm:col-span-1">
                        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />
                        <CardContent className="p-3 sm:p-5 flex flex-col items-center justify-center text-center">
                            <div className="text-2xl sm:text-3xl font-black text-orange-600 dark:text-orange-500 drop-shadow-sm mb-0.5 sm:mb-1">{data.total_schemes}</div>
                            <div className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Total Options</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {error && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-4 flex items-center gap-2 text-red-700">
                        <AlertCircle className="h-5 w-5" />
                        {error}
                    </CardContent>
                </Card>
            )}

            {/* Schemes List */}
            <div className="space-y-4">
                {filteredSchemes.map(scheme => (
                    <Card key={scheme.id} className={`overflow-hidden border-border/50 bg-card/60 backdrop-blur-xl transition-all group ${expandedScheme === scheme.id ? 'shadow-lg border-emerald-500/50 ring-1 ring-emerald-500/20' : 'hover:shadow-md hover:border-emerald-500/30 hover:-translate-y-0.5'}`}>
                        <CardContent className="p-0">
                            {/* Scheme Header */}
                            <div
                                className="p-4 sm:p-6 cursor-pointer"
                                onClick={() => setExpandedScheme(expandedScheme === scheme.id ? null : scheme.id)}
                            >
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <Badge variant="outline" className={`px-2.5 py-0.5 border ${getSchemeTypeBadge(scheme.scheme_type)} font-semibold tracking-wide uppercase text-[10px]`}>
                                                {getSchemeTypeIcon(scheme.scheme_type)}
                                                <span className="ml-1.5">{scheme.scheme_type}</span>
                                            </Badge>
                                            {scheme.application_deadline && (
                                                <Badge variant="outline" className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase bg-muted/50 border-border/50 text-muted-foreground">
                                                    <Clock className="h-3 w-3" />
                                                    Deadline: <span className="text-foreground">{new Date(scheme.application_deadline).toLocaleDateString()}</span>
                                                </Badge>
                                            )}
                                        </div>

                                        <h3 className="text-xl font-bold text-foreground tracking-tight group-hover:text-emerald-500 transition-colors">{scheme.name}</h3>
                                        <p className="text-sm text-muted-foreground font-medium mt-1.5 line-clamp-2">{scheme.description}</p>

                                        {scheme.benefits && (
                                            <div className="flex items-center gap-2 mt-3 text-sm font-bold text-emerald-600 dark:text-emerald-500">
                                                <span className="material-symbols-outlined text-[18px]">payments</span>
                                                {scheme.benefits}
                                            </div>
                                        )}
                                    </div>

                                    <div className="text-center md:text-right mt-3 md:mt-0 flex flex-col justify-center bg-muted/30 py-2.5 px-4 rounded-xl border border-border/40 md:w-32 items-center flex-shrink-0 self-start md:self-auto max-w-[fit-content]">
                                        <div className={`text-2xl md:text-3xl font-black tracking-tight ${getMatchScoreColor(scheme.match_score)}`}>
                                            {scheme.match_score}%
                                        </div>
                                        <div className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">match score</div>
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            <div className={`grid transition-all duration-300 ease-in-out ${expandedScheme === scheme.id ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                <div className="overflow-hidden">
                                    <div className="border-t border-border/50 bg-muted/10 p-4 sm:p-6 space-y-4 sm:space-y-6">
                                        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
                                            <div className="bg-background/50 p-3 sm:p-4 rounded-xl border border-border/40">
                                                <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Max Benefit</div>
                                                <div className="text-lg sm:text-xl font-black text-foreground truncate">
                                                    {scheme.subsidy_percentage
                                                        ? <span className="text-emerald-500">{scheme.subsidy_percentage}%</span>
                                                        : <span className="text-emerald-500">{formatAmount(scheme.max_subsidy_amount)}</span>
                                                    }
                                                    {scheme.subsidy_percentage && <span className="text-[10px] sm:text-sm text-muted-foreground ml-1">subsidy</span>}
                                                </div>
                                            </div>

                                            <div className="bg-background/50 p-3 sm:p-4 rounded-xl border border-border/40">
                                                <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Eligible Crops</div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {scheme.eligible_crops.length > 0
                                                        ? scheme.eligible_crops.slice(0, 2).map(crop => (
                                                            <Badge key={crop} variant="secondary" className="text-[9px] sm:text-xs font-semibold bg-background border-border/50 shadow-sm px-1.5 py-0">
                                                                {crop}
                                                            </Badge>
                                                        ))
                                                        : <span className="text-[10px] sm:text-sm font-bold text-foreground bg-muted px-2 py-0.5 rounded-md truncate max-w-full block">All crops</span>
                                                    }
                                                    {scheme.eligible_crops.length > 2 && <span className="text-[9px] text-muted-foreground">+{scheme.eligible_crops.length - 2}</span>}
                                                </div>
                                            </div>

                                            <div className="bg-background/50 p-3 sm:p-4 rounded-xl border border-border/40 col-span-1 xs:col-span-2 md:col-span-1">
                                                <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Eligible States</div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {scheme.eligible_states.length > 0
                                                        ? scheme.eligible_states.slice(0, 2).map(s => (
                                                            <Badge key={s} variant="secondary" className="text-[9px] sm:text-xs font-semibold bg-background border-border/50 shadow-sm px-1.5 py-0">
                                                                {s}
                                                            </Badge>
                                                        ))
                                                        : <span className="text-[10px] sm:text-sm font-bold text-foreground bg-muted px-2 py-0.5 rounded-md truncate">All India</span>
                                                    }
                                                    {scheme.eligible_states.length > 2 && <span className="text-[9px] text-muted-foreground">+{scheme.eligible_states.length - 2}</span>}
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                                                <FileText className="h-4 w-4" /> Documents Required
                                            </div>
                                            <div className="flex flex-wrap gap-2.5">
                                                {scheme.documents_required.map((doc, i) => (
                                                    <div key={i} className="flex items-center gap-2 text-[13px] text-foreground font-semibold bg-background/80 px-3 py-2 rounded-lg border border-border/50 shadow-sm hover:border-emerald-500/30 transition-colors">
                                                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                                        {doc}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {scheme.link && (
                                            <div className="pt-2 border-t border-border/30">
                                                <Button asChild className="w-full md:w-auto gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 font-bold tracking-wide">
                                                    <a href={scheme.link} target="_blank" rel="noopener noreferrer">
                                                        Apply Now
                                                        <ExternalLink className="h-4 w-4 ml-1" />
                                                    </a>
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Tips */}
            {data?.tips && (
                <Card className="border-border/50 shadow-sm bg-card/60 backdrop-blur-xl mt-8">
                    <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <span className="text-amber-500 text-lg material-symbols-outlined">lightbulb</span>
                            Application Tips
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            {data.tips.map((tip, i) => (
                                <div key={i} className="flex items-start gap-4 p-4 rounded-xl relative group overflow-hidden bg-background/50 border border-border/40 hover:border-amber-500/30 transition-colors">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500/30 group-hover:bg-amber-500 transition-colors" />
                                    <span className="text-xl filter drop-shadow-sm">{tip.icon}</span>
                                    <span className="text-sm font-medium leading-relaxed">{tip.text}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
