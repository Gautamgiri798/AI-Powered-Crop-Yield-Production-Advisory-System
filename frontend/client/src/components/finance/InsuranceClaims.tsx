import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Shield, Plus, FileText, Calendar, AlertTriangle, CheckCircle2, Clock, XCircle, IndianRupee, RefreshCw, Send, Trash2, Eye, Edit3 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useField } from "@/context/FieldContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
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

interface Claim {
    id: number;
    field_id: number;
    field_name: string;
    crop: string;
    damage_type: string;
    damage_type_display: string;
    damage_date: string;
    area_affected_acres: number;
    estimated_loss: number;
    claim_amount: number | null;
    status: string;
    status_display: string;
    submitted_at: string | null;
    damage_description: string;
    policy_number: string;
    bank_account: string;
    ifsc_code: string;
    created_at: string;
}

interface ClaimFormData {
    field_id: string;
    crop: string;
    damage_type: string;
    damage_date: string;
    area_affected_acres: string;
    damage_description: string;
    estimated_loss: string;
    policy_number: string;
    bank_account: string;
    ifsc_code: string;
}

interface ClaimsData {
    claims: Claim[];
    summary: {
        total_claims: number;
        pending_claims: number;
        approved_total: number;
    };
    damage_types: { value: string; label: string; icon: string }[];
    tips: { icon: string; text: string }[];
    top_plans?: {
        id: number;
        name: string;
        provider: string;
        rating: number;
        premium: string;
        coverage: string;
        tag: string;
        icon: string;
        category?: 'government' | 'private';
        full_description?: string;
        benefits?: string[];
        eligibility?: string;
    }[];
    all_plans?: {
        id: number;
        name: string;
        provider: string;
        rating: number;
        premium: string;
        coverage: string;
        tag: string;
        icon: string;
        category?: 'government' | 'private';
        full_description?: string;
        benefits?: string[];
        eligibility?: string;
    }[];
}

const INITIAL_FORM: ClaimFormData = {
    field_id: '',
    crop: '',
    damage_type: '',
    damage_date: new Date().toISOString().split('T')[0],
    area_affected_acres: '',
    damage_description: '',
    estimated_loss: '',
    policy_number: '',
    bank_account: '',
    ifsc_code: '',
};

export function InsuranceClaims() {
    const { fields, selectedField } = useField();
    const [data, setData] = useState<ClaimsData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showNewClaimDialog, setShowNewClaimDialog] = useState(false);
    const [formData, setFormData] = useState<ClaimFormData>(INITIAL_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [editingClaimId, setEditingClaimId] = useState<number | null>(null);
    const [claimToDelete, setClaimToDelete] = useState<Claim | null>(null);
    const [selectedPlanDetails, setSelectedPlanDetails] = useState<any>(null);
    const [showAllPlans, setShowAllPlans] = useState(false);
    const [planFilter, setPlanFilter] = useState<'all' | 'government' | 'private'>('all');
    const { toast } = useToast();

    const fetchClaims = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiFetch('/finance/insurance');
            setData(response as ClaimsData);
        } catch (err) {
            setError('Failed to load insurance claims');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClaims();
    }, []);

    useEffect(() => {
        if (selectedField) {
            setFormData(prev => ({
                ...prev,
                field_id: String(selectedField.id),
                crop: selectedField.cropType || '',
            }));
        }
    }, [selectedField]);

    const handleInputChange = (field: keyof ClaimFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmitClaim = async () => {
        setSubmitting(true);
        try {
            const url = editingClaimId ? `/finance/insurance/${editingClaimId}` : '/finance/insurance';
            const method = editingClaimId ? 'PATCH' : 'POST';
            
            await apiFetch(url, {
                method: method,
                body: JSON.stringify({
                    field_id: parseInt(formData.field_id),
                    crop: formData.crop,
                    damage_type: formData.damage_type,
                    damage_date: formData.damage_date,
                    area_affected_acres: parseFloat(formData.area_affected_acres),
                    damage_description: formData.damage_description,
                    estimated_loss: parseFloat(formData.estimated_loss),
                    policy_number: formData.policy_number,
                    bank_account: formData.bank_account,
                    ifsc_code: formData.ifsc_code,
                }),
            });

            toast({
                title: editingClaimId ? "Claim Updated" : "Claim Saved",
                description: editingClaimId ? "Changes saved successfully" : "Draft claim created successfully",
            });

            setShowNewClaimDialog(false);
            setFormData(INITIAL_FORM);
            setEditingClaimId(null);
            fetchClaims();
        } catch (err) {
            console.error('Failed to submit claim:', err);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to save the claim. Please try again.",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditClaim = (claim: Claim) => {
        setEditingClaimId(claim.id);
        setFormData({
            field_id: String(claim.field_id),
            crop: claim.crop,
            damage_type: claim.damage_type,
            damage_date: claim.damage_date,
            area_affected_acres: String(claim.area_affected_acres),
            damage_description: claim.damage_description || '',
            estimated_loss: String(claim.estimated_loss),
            policy_number: claim.policy_number || '',
            bank_account: claim.bank_account || '',
            ifsc_code: claim.ifsc_code || '',
        });
        setShowNewClaimDialog(true);
    };

    const handleDeleteClaim = async () => {
        if (!claimToDelete) return;
        try {
            await apiFetch(`/finance/insurance/${claimToDelete.id}`, { method: 'DELETE' });
            toast({
                title: "Claim Deleted",
                description: "The claim has been removed successfully.",
            });
            fetchClaims();
        } catch (err) {
            console.error('Failed to delete claim:', err);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to delete the claim.",
            });
        } finally {
            setClaimToDelete(null);
        }
    };

    const handleSubmitForReview = async (claimId: number) => {
        try {
            await apiFetch(`/finance/insurance/${claimId}`, {
                method: 'PATCH',
                body: JSON.stringify({ status: 'submitted' }),
            });
            toast({
                title: "Claim Submitted",
                description: "Your claim is now under review",
            });
            fetchClaims();
        } catch (err) {
            console.error('Failed to submit claim:', err);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not submit the claim.",
            });
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'draft': return <FileText className="h-4 w-4 text-gray-500" />;
            case 'submitted': return <Clock className="h-4 w-4 text-blue-500" />;
            case 'under_review': return <Eye className="h-4 w-4 text-yellow-500" />;
            case 'approved': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
            case 'paid': return <IndianRupee className="h-4 w-4 text-green-600" />;
            default: return <FileText className="h-4 w-4" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft': return 'bg-muted/30 text-muted-foreground border-border/50';
            case 'submitted': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'under_review': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'approved': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'rejected': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
            case 'paid': return 'bg-emerald-500 text-white border-transparent';
            default: return 'bg-muted/30 text-muted-foreground border-border/50';
        }
    };

    const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="size-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 relative shrink-0">
                        <Shield className="h-7 w-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground uppercase">Insurance Hub</h1>
                        <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-0.5">Manage your protection plans & claims</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button variant="outline" onClick={fetchClaims} disabled={loading} className="gap-2 transition-all shadow-md active:scale-95 bg-card/60 backdrop-blur-xl border-border/50 hover:bg-emerald-600 hover:text-white hover:border-transparent group">
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                        Refresh
                    </Button>

                    <Dialog open={showNewClaimDialog} onOpenChange={setShowNewClaimDialog}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5">
                                <Plus className="h-4 w-4" />
                                New Claim
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-bold">{editingClaimId ? 'Edit Insurance Claim' : 'File New Insurance Claim'}</DialogTitle>
                            </DialogHeader>

                            <div className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Field</Label>
                                        <Select value={formData.field_id} onValueChange={(v) => handleInputChange('field_id', v)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select field" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {fields.map(field => (
                                                    <SelectItem key={field.id} value={String(field.id)}>{field.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Crop</Label>
                                        <Input
                                            value={formData.crop}
                                            onChange={(e) => handleInputChange('crop', e.target.value)}
                                            placeholder="e.g. Rice"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Damage Type</Label>
                                        <Select value={formData.damage_type} onValueChange={(v) => handleInputChange('damage_type', v)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {data?.damage_types.map(type => (
                                                    <SelectItem key={type.value} value={type.value}>
                                                        {type.icon} {type.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Damage Date</Label>
                                        <Input
                                            type="date"
                                            value={formData.damage_date}
                                            onChange={(e) => handleInputChange('damage_date', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Area Affected (acres)</Label>
                                        <Input
                                            type="number"
                                            step="0.1"
                                            value={formData.area_affected_acres}
                                            onChange={(e) => handleInputChange('area_affected_acres', e.target.value)}
                                            placeholder="e.g. 2.5"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Estimated Loss (₹)</Label>
                                        <Input
                                            type="number"
                                            value={formData.estimated_loss}
                                            onChange={(e) => handleInputChange('estimated_loss', e.target.value)}
                                            placeholder="e.g. 50000"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Description of Damage</Label>
                                    <Textarea
                                        value={formData.damage_description}
                                        onChange={(e) => handleInputChange('damage_description', e.target.value)}
                                        placeholder="Describe the damage in detail..."
                                        rows={3}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Policy Number (optional)</Label>
                                    <Input
                                        value={formData.policy_number}
                                        onChange={(e) => handleInputChange('policy_number', e.target.value)}
                                        placeholder="e.g. PMFBY/2026/12345"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Bank Account</Label>
                                        <Input
                                            value={formData.bank_account}
                                            onChange={(e) => handleInputChange('bank_account', e.target.value)}
                                            placeholder="Account number"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>IFSC Code</Label>
                                        <Input
                                            value={formData.ifsc_code}
                                            onChange={(e) => handleInputChange('ifsc_code', e.target.value)}
                                            placeholder="e.g. SBIN0001234"
                                        />
                                    </div>
                                </div>

                                <Button
                                    onClick={handleSubmitClaim}
                                    disabled={submitting || !formData.field_id || !formData.damage_type}
                                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 font-bold rounded-xl shadow-lg shadow-emerald-500/10"
                                >
                                    {submitting ? 'Processing...' : editingClaimId ? 'Update Claim' : 'Save Draft Claim'}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Summary Stats */}
            {data && (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 px-1">
                    {[
                        { label: "Total Claims", value: data.summary.total_claims, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
                        { label: "Pending", value: data.summary.pending_claims, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
                        { label: "Approved Amt", value: formatCurrency(data.summary.approved_total), color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", full: true },
                    ].map((stat, i) => (
                        <Card key={i} className={cn("border-border/40 shadow-sm bg-card/40 backdrop-blur-xl overflow-hidden relative group transition-all duration-300 hover:shadow-lg hover:-translate-y-1", stat.full && "col-span-2 lg:col-span-1")}>
                            {i === 2 && <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />}
                            <CardContent className="p-4 sm:p-6 flex flex-col items-center justify-center text-center">
                                <div className={cn("text-2xl sm:text-4xl font-black drop-shadow-sm mb-1", stat.color)}>{stat.value}</div>
                                <div className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">{stat.label}</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {error && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-4 flex items-center gap-2 text-red-700">
                        <AlertTriangle className="h-5 w-5" />
                        {error}
                    </CardContent>
                </Card>
            )}

            {/* Top Recommended Section Header */}
            <div className="flex items-center justify-between px-1">
                <h2 className="text-lg font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-500">verified</span>
                    Top Recommended Plans
                </h2>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowAllPlans(true)}
                    className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/5 font-bold gap-1"
                >
                    View More 
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Button>
            </div>

            {/* Top Recommended Plans */}
            {data?.top_plans && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {data.top_plans.map((plan) => (
                        <Card key={plan.id} className="group border-border/50 bg-card/40 backdrop-blur-xl relative overflow-hidden hover:border-emerald-500/40 transition-all duration-500 hover:-translate-y-1.5 focus-within:ring-2 focus-within:ring-emerald-500/20">
                            <div className="absolute top-0 right-0 p-3 sm:p-4 z-10 shrink-0">
                                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full backdrop-blur-sm">
                                    {plan.tag}
                                </Badge>
                            </div>
                            <div className="absolute -bottom-8 -right-8 size-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all duration-700" />
                            
                            <CardContent className="p-4 sm:p-6 relative">
                                <div className="flex items-start gap-4 mb-4 sm:mb-5">
                                    <div className="size-12 sm:size-14 rounded-2xl bg-gradient-to-br from-background to-muted flex items-center justify-center text-2xl sm:text-3xl shadow-inner border border-white/5 shrink-0 group-hover:scale-110 transition-transform duration-500">
                                        {plan.icon}
                                    </div>
                                    <div className="pr-16 sm:pr-0 mt-0.5">
                                        <h3 className="font-bold text-sm sm:text-base leading-tight group-hover:text-emerald-500 transition-colors">{plan.name}</h3>
                                        <p className="text-[10px] sm:text-xs text-muted-foreground font-medium mt-0.5">{plan.provider}</p>
                                    </div>
                                </div>

                                <div className="space-y-3.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60">Rating & Trust</span>
                                        <div className="flex items-center gap-1.5 bg-amber-500/10 px-2 py-0.5 rounded-md">
                                            <span className="material-symbols-outlined text-[14px] text-amber-500 fill-amber-500 text-xs">star</span>
                                            <span className="text-xs font-black text-amber-600">{plan.rating}</span>
                                        </div>
                                    </div>
                                    <div className="h-px bg-gradient-to-r from-transparent via-border/30 to-transparent" />
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60 mb-1">Premium</p>
                                            <p className="text-xs font-bold text-foreground">{plan.premium}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60 mb-1">Coverage</p>
                                            <p className="text-xs font-bold text-foreground">{plan.coverage}</p>
                                        </div>
                                    </div>
                                </div>

                                <Button 
                                    onClick={() => setSelectedPlanDetails(plan)}
                                    className="w-full mt-6 h-10 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-600 hover:text-white border-emerald-500/20 hover:border-transparent font-bold text-xs rounded-xl transition-all duration-300"
                                >
                                    View Details
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <div className="space-y-4">
                <h2 className="text-xl font-black text-foreground flex items-center gap-2 mb-6 px-1">
                    <span className="material-symbols-outlined text-emerald-500 text-2xl">receipt_long</span>
                    Your Claims
                </h2>

                {data?.claims.length === 0 ? (
                    <Card className="border-border/40 shadow-sm bg-card/40 backdrop-blur-xl border-dashed">
                        <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground opacity-70 hover:opacity-100 transition-opacity">
                            <div className="size-16 rounded-2xl bg-muted/30 flex items-center justify-center mb-4 rotate-3">
                                <Shield className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <p className="text-lg font-black text-foreground">No insurance claims yet.</p>
                            <p className="text-sm font-medium mt-1">Tap "New Claim" to file your protection request.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {data?.claims.map(claim => (
                            <Card key={claim.id} className="border-border/40 shadow-sm bg-card/40 backdrop-blur-xl overflow-hidden hover:border-emerald-500/40 transition-all group relative">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                                    <Shield className="size-24 -mr-8 -mt-8" />
                                </div>
                                <CardContent className="p-5 sm:p-6 relative z-10">
                                    <div className="flex flex-col gap-4">
                                        <div className="flex-1">
                                            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                                                <Badge variant="outline" className={cn("px-3 py-1 border rounded-xl font-black tracking-widest uppercase text-[10px] flex items-center gap-2", getStatusColor(claim.status))}>
                                                    {getStatusIcon(claim.status)}
                                                    {claim.status_display}
                                                </Badge>
                                                <span className="text-[10px] font-black text-muted-foreground tracking-widest uppercase bg-muted/40 px-2.5 py-1 rounded-xl border border-border/40">
                                                    ID: #{claim.id}
                                                </span>
                                            </div>

                                            <div className="space-y-1">
                                                <h3 className="font-black text-xl text-foreground tracking-tight leading-tight">
                                                    {claim.crop} <span className="text-muted-foreground/30 mx-1">—</span> <span className="text-emerald-500 uppercase tracking-tight">{claim.damage_type_display}</span>
                                                </h3>
                                                <p className="text-[13px] text-muted-foreground font-bold flex items-center gap-1.5 flex-wrap">
                                                    <span className="text-muted-foreground/60 font-medium">Field:</span> <span className="text-foreground">{claim.field_name}</span> 
                                                    <span className="text-muted-foreground/40 text-[10px]">•</span>
                                                    <span className="bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded-lg border border-orange-500/20">{claim.area_affected_acres} acres affected</span>
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 mt-5">
                                                <div className="bg-muted/30 p-3 rounded-2xl border border-border/30 flex flex-col gap-1 items-center justify-center text-center">
                                                    <div className="flex items-center gap-1.5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                                        <Calendar className="h-3 w-3" />
                                                        Incident
                                                    </div>
                                                    <span className="font-black text-sm text-foreground">{new Date(claim.damage_date).toLocaleDateString("en-IN", { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                </div>
                                                <div className="bg-muted/30 p-3 rounded-2xl border border-border/30 flex flex-col gap-1 items-center justify-center text-center">
                                                    <div className="flex items-center gap-1.5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                                        <IndianRupee className="h-3 w-3" />
                                                        Est. Loss
                                                    </div>
                                                    <span className="font-black text-sm text-foreground">{formatCurrency(claim.estimated_loss)}</span>
                                                </div>
                                                {claim.claim_amount && (
                                                    <div className="col-span-2 bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20 flex items-center justify-between mt-1">
                                                        <div className="text-[11px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">Approved</div>
                                                        <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(claim.claim_amount)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-row items-center gap-2 mt-2 pt-4 border-t border-border/30">
                                            {claim.status === 'draft' && (
                                                <Button
                                                    size="sm"
                                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 transition-all rounded-xl h-10 font-black uppercase text-[10px] tracking-widest active:scale-95"
                                                    onClick={() => handleSubmitForReview(claim.id)}
                                                >
                                                    <Send className="h-3.5 w-3.5 mr-2" />
                                                    Submit
                                                </Button>
                                            )}
                                            {(claim.status === 'draft' || claim.status === 'submitted') && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="flex-1 bg-blue-500/5 border-blue-500/30 text-blue-500 hover:bg-blue-500 hover:text-white transition-all rounded-xl h-10 font-black uppercase text-[10px] tracking-widest active:scale-95"
                                                        onClick={() => handleEditClaim(claim)}
                                                    >
                                                        <Edit3 className="h-3.5 w-3.5 mr-2" />
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="size-10 rounded-xl bg-rose-500/5 text-rose-500 hover:bg-rose-500 hover:text-white transition-all active:scale-95 border border-rose-500/20 p-0 flex items-center justify-center shrink-0"
                                                        onClick={() => setClaimToDelete(claim)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Tips */}
            {data?.tips && (
                <Card className="border-border/40 shadow-lg bg-card/40 backdrop-blur-xl mt-10 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
                    <CardHeader className="pb-2 pt-6 px-6 border-b-0 bg-transparent">
                        <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-amber-500 flex items-center gap-2">
                            <span className="text-xl material-symbols-outlined">lightbulb</span>
                            Claim Expert Tips
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 pt-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {data.tips.map((tip, idx) => (
                                <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-muted/20 border border-border/20 group hover:border-amber-500/30 transition-all">
                                    <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20 group-hover:scale-110 transition-transform">
                                        <span className="text-xl filter drop-shadow-sm">{tip.icon}</span>
                                    </div>
                                    <p className="text-xs sm:text-sm font-bold text-foreground leading-relaxed">{tip.text}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Plan Details Dialog */}
            <Dialog open={!!selectedPlanDetails} onOpenChange={(open) => !open && setSelectedPlanDetails(null)}>
                <DialogContent className="max-w-xl max-h-[85vh] overflow-hidden flex flex-col p-0 rounded-[2rem] border-white/10 bg-[#0A120E] backdrop-blur-3xl ring-1 ring-white/5">
                    <div className="p-8 overflow-y-auto custom-scrollbar">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-6 sm:mb-8 text-center sm:text-left">
                            <div className="size-16 sm:size-20 rounded-[1.25rem] sm:rounded-[1.5rem] bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-3xl sm:text-4xl shadow-xl shadow-emerald-500/20 shrink-0 scale-100 animate-in zoom-in-50 duration-500">
                                {selectedPlanDetails?.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <Badge variant="outline" className="mb-2 bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-black tracking-widest text-[9px] sm:text-[10px] uppercase">
                                    {selectedPlanDetails?.tag}
                                </Badge>
                                <DialogTitle className="text-xl sm:text-2xl font-black text-white leading-tight break-words">
                                    {selectedPlanDetails?.name}
                                </DialogTitle>
                                <p className="text-white/40 font-bold text-xs sm:text-sm tracking-wide mt-1 truncate">{selectedPlanDetails?.provider} • Approved Agency</p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500/60 mb-3 flex items-center gap-2">
                                    <span className="size-1 bg-emerald-500 rounded-full" />
                                    About Protection Plan
                                </h4>
                                <p className="text-white/60 text-[13px] leading-relaxed font-medium">
                                    {selectedPlanDetails?.full_description || "Comprehensive crop protection plan designed to safeguard your agricultural investments against unforeseen natural risks and market volatility."}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1 group-hover:text-emerald-500/60 transition-colors">Premium Cost</p>
                                    <p className="text-sm font-black text-white">{selectedPlanDetails?.premium}</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1 group-hover:text-emerald-500/60 transition-colors">Total Coverage</p>
                                    <p className="text-sm font-black text-white">{selectedPlanDetails?.coverage}</p>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500/60 mb-4 flex items-center gap-2">
                                    <span className="size-1 bg-emerald-500 rounded-full" />
                                    Key Coverage Benefits
                                </h4>
                                <div className="grid gap-3">
                                    {(selectedPlanDetails?.benefits || [
                                        "Natural Calamity Protection",
                                        "Pest & Disease Outbreak Cover",
                                        "Post-Harvest Loss Support",
                                        "Parametric Income Guarantee"
                                    ]).map((benefit: string, i: number) => (
                                        <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl bg-white/5 border border-white/5 group hover:bg-emerald-500/5 hover:border-emerald-500/20 transition-all duration-300">
                                            <div className="size-6 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                                <span className="material-symbols-outlined text-sm">done_all</span>
                                            </div>
                                            <span className="text-[13px] font-bold text-white/70 group-hover:text-white transition-colors">{benefit}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-6 rounded-[1.5rem] bg-amber-500/5 border border-amber-500/10">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500/80 mb-2 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[16px]">info</span>
                                    Eligibility Criteria
                                </h4>
                                <p className="text-[12px] text-amber-200/60 font-medium leading-relaxed">
                                    {selectedPlanDetails?.eligibility || "Open to all verified farmers with valid land records. Specific crop notifications may vary by state and season."}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-6 bg-white/5 border-t border-white/5 flex gap-3">
                        <Button variant="ghost" className="flex-1 h-12 rounded-xl text-white/40 hover:text-white hover:bg-white/5 font-bold transition-all" onClick={() => setSelectedPlanDetails(null)}>
                            Close Browser
                        </Button>
                        <Button className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-lg shadow-emerald-500/20 transition-all active:scale-95">
                            Apply Now
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* All Plans Browser Dialog */}
            <Dialog open={showAllPlans} onOpenChange={setShowAllPlans}>
                <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 rounded-[2.5rem] border-white/10 bg-[#0A120E] backdrop-blur-3xl ring-1 ring-white/5">
                    <div className="p-8 border-b border-white/5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div className="text-center sm:text-left">
                                <DialogTitle className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center justify-center sm:justify-start gap-3">
                                    <span className="material-symbols-outlined text-emerald-500 text-3xl">policy</span>
                                    Insurance Catalog
                                </DialogTitle>
                                <p className="text-white/40 font-bold text-xs sm:text-sm mt-1">Explore all government and private insurance schemes for 2026</p>
                            </div>
                            <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-2xl border border-white/10 shadow-inner w-full sm:w-[320px]">
                                {(['all', 'government', 'private'] as const).map((type) => (
                                    <Button 
                                        key={type}
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => setPlanFilter(type)}
                                        className={cn(
                                            "flex-1 rounded-xl h-10 text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                                            planFilter === type 
                                                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 scale-105" 
                                                : "text-white/40 hover:text-white hover:bg-white/5"
                                        )}
                                    >
                                        {type === 'government' ? 'Govt' : type}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                            {(data?.all_plans || data?.top_plans || [])
                                .filter(plan => planFilter === 'all' || plan.category === planFilter)
                                .map((plan) => (
                                <Card key={plan.id} className="group border-white/5 bg-white/5 rounded-3xl overflow-hidden hover:border-emerald-500/30 transition-all duration-500">
                                    <CardContent className="p-6">
                                        <div className="flex items-start gap-5">
                                            <div className="size-16 rounded-2xl bg-gradient-to-br from-background to-muted/50 border border-white/5 flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 transition-transform duration-500">
                                                {plan.icon}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h3 className="font-bold text-base leading-tight text-white group-hover:text-emerald-500 transition-colors">{plan.name}</h3>
                                                    <div className="flex items-center gap-1 bg-amber-500/10 px-1.5 py-0.5 rounded-md">
                                                        <span className="material-symbols-outlined text-[12px] text-amber-500 fill-amber-500">star</span>
                                                        <span className="text-[10px] font-black text-amber-500">{plan.rating}</span>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-white/40 font-medium">{plan.provider}</p>
                                                
                                                <div className="flex flex-wrap gap-1.5 mt-3 sm:mt-4">
                                                    <Badge className="bg-white/5 text-white/60 border-transparent text-[8px] sm:text-[9px] font-bold px-1.5 py-0">Prem: {plan.premium}</Badge>
                                                    <Badge className="bg-white/5 text-white/60 border-transparent text-[8px] sm:text-[9px] font-bold px-1.5 py-0">Cov: {plan.coverage}</Badge>
                                                    <Badge className="bg-emerald-500/10 text-emerald-500 border-transparent text-[8px] sm:text-[9px] font-bold uppercase px-1.5 py-0">{plan.tag}</Badge>
                                                </div>

                                                <Button 
                                                    onClick={() => setSelectedPlanDetails(plan)}
                                                    variant="outline" 
                                                    className="w-full mt-6 h-10 border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all"
                                                >
                                                    Inspect Plan Details
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!claimToDelete} onOpenChange={(open) => !open && setClaimToDelete(null)}>
                <AlertDialogContent className="rounded-[1.5rem] border-white/10 bg-[#0A120E] backdrop-blur-2xl ring-1 ring-white/5">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-white">Discard Claim?</AlertDialogTitle>
                        <AlertDialogDescription className="text-white/40 font-medium text-sm">
                            Are you sure you want to delete this insurance claim for <span className="text-white font-bold">"{claimToDelete?.crop}"</span>? 
                            This action cannot be undone and you will need to refile the details.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6 gap-3">
                        <AlertDialogCancel className="bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white rounded-xl font-bold transition-all h-11 px-6">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleDeleteClaim}
                            className="bg-red-500 hover:bg-red-600 text-white border-0 rounded-xl font-bold transition-all shadow-lg shadow-red-500/20 h-11 px-6"
                        >
                            Confirm Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
