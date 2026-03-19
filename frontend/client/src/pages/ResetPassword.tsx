import { useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiPost } from "@/lib/api";

export default function ResetPassword() {
    const [, setLocation] = useLocation();
    const [match, params] = useRoute("/reset-password/:uid/:token");
    const { toast } = useToast();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!password || !confirmPassword) {
            toast({ variant: "destructive", title: "Error", description: "Please fill in all fields" });
            return;
        }

        if (password !== confirmPassword) {
            toast({ variant: "destructive", title: "Error", description: "Passwords do not match" });
            return;
        }

        if (password.length < 8) {
            toast({ variant: "destructive", title: "Error", description: "Password must be at least 8 characters" });
            return;
        }

        if (!match || !params) {
            toast({ variant: "destructive", title: "Error", description: "Invalid password reset link" });
            return;
        }

        setIsLoading(true);
        try {
            await apiPost('/api/auth/password-reset-confirm', {
                uidb64: params.uid,
                token: params.token,
                password: password
            });

            setIsSuccess(true);
            toast({ title: "Success", description: "Your password has been reset successfully." });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Invalid or expired token"
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (!match) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#060D09] relative overflow-hidden font-sans">
                {/* Global Ambient Lights */}
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/15 rounded-full blur-[150px] pointer-events-none" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-emerald-600/15 rounded-full blur-[150px] pointer-events-none" />

                <div className="text-center animate-in fade-in zoom-in duration-500 relative z-10 p-6">
                    <div className="mx-auto size-20 bg-red-500/10 rounded-[1.5rem] flex items-center justify-center mb-6 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
                        <span className="material-symbols-outlined text-5xl text-red-500">error</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Invalid Link</h1>
                    <p className="text-white/50 mt-2 mb-8 max-w-xs mx-auto font-medium">This password reset link is invalid or has expired.</p>
                    <Button 
                        onClick={() => setLocation("/forgot-password")}
                        className="h-[56px] px-8 rounded-2xl font-bold bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all active:scale-[0.98]"
                    >
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#060D09] relative overflow-hidden font-sans">
            {/* Global Ambient Lights */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/15 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-emerald-600/15 rounded-full blur-[150px] pointer-events-none" />
            
            {/* Soft Grid Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
            
            <div className="w-full max-w-[440px] p-6 relative z-10">
                <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <button onClick={() => setLocation("/login")} className="inline-flex items-center gap-3 mb-8 group transition-transform hover:scale-105">
                        <div className="size-14 rounded-2xl bg-black/40 backdrop-blur-2xl flex items-center justify-center border border-white/10 shadow-[0_0_30px_rgba(34,197,94,0.15)] text-primary">
                            <span className="material-symbols-outlined text-3xl bg-gradient-to-br from-primary to-emerald-400 bg-clip-text text-transparent">agriculture</span>
                        </div>
                        <span className="text-3xl font-fodax text-white group-hover:text-primary transition-colors">
                            Krishi<span className="text-primary">Saarthi</span>
                        </span>
                    </button>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">New Password</h1>
                    <p className="text-white/50 text-sm font-medium">
                        Please enter your new password below.
                    </p>
                </div>

                <div className="bg-[#0A120E] border border-white/10 rounded-[2.5rem] shadow-[0_16px_40px_rgba(0,0,0,0.8)] overflow-hidden backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both ring-1 ring-white/5 relative">
                    {/* Shimmer effect inside card */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-50 pointer-events-none" />

                    <div className="p-6 sm:p-8 md:p-10 relative z-10">
                        {isSuccess ? (
                            <div className="text-center space-y-8 py-4">
                                <div className="mx-auto size-20 bg-primary/10 rounded-[1.5rem] flex items-center justify-center border border-primary/20 shadow-[0_0_30px_rgba(34,197,94,0.1)]">
                                    <span className="material-symbols-outlined text-5xl text-primary animate-bounce">check_circle</span>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-3">Password Updated!</h3>
                                    <p className="text-white/50 text-sm leading-relaxed">
                                        Your password has been successfully updated. You can now sign in with your new credentials.
                                    </p>
                                </div>
                                <Button
                                    onClick={() => setLocation("/login")}
                                    className="w-full h-[60px] rounded-2xl font-bold bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all active:scale-[0.98]"
                                >
                                    Continue to login
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6 text-left">
                                <div className="space-y-3">
                                    <label className="text-sm font-semibold text-white/90">New Password</label>
                                    <div className="relative group">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/40 transition-colors group-focus-within:text-primary z-10">lock</span>
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            disabled={isLoading}
                                            className="h-[60px] pl-[50px] pr-[50px] bg-black/40 border-white/10 hover:border-white/20 text-white placeholder:text-white/30 focus:border-primary/50 focus:ring-primary/20 transition-all rounded-2xl shadow-inner font-medium text-[15px]"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors z-10"
                                        >
                                            <span className="material-symbols-outlined text-[22px]">
                                                {showPassword ? "visibility_off" : "visibility"}
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-sm font-semibold text-white/90">Confirm Password</label>
                                    <div className="relative group">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/40 transition-colors group-focus-within:text-primary z-10">lock_reset</span>
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            disabled={isLoading}
                                            className="h-[60px] pl-[50px] bg-black/40 border-white/10 hover:border-white/20 text-white placeholder:text-white/30 focus:border-primary/50 focus:ring-primary/20 transition-all rounded-2xl shadow-inner font-medium text-[15px]"
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-[60px] text-base font-bold rounded-2xl bg-gradient-to-r from-primary to-[#10B981] hover:from-primary/90 hover:to-[#10B981]/90 text-black shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] border border-white/20 hover:border-white/40 transition-all active:scale-[0.98] mt-4"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        "Update Password"
                                    )}
                                </Button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
