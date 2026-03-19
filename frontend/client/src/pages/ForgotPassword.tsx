import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiPost } from "@/lib/api";

export default function ForgotPassword() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim()) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Please enter your email",
            });
            return;
        }

        setIsLoading(true);
        try {
            await apiPost('/api/auth/password-reset', { email });
            setIsSubmitted(true);
            toast({
                title: "Email Sent",
                description: "Check your inbox for password reset instructions.",
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to send reset email",
            });
        } finally {
            setIsLoading(false);
        }
    };

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
                        <h1 className="text-4xl md:text-5xl font-fodax text-white tracking-wide mb-6">
                            Krishi<span className="text-primary">Saarthi</span>
                        </h1>
                    </button>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Forgot Password</h1>
                    <p className="text-white/50 text-sm font-medium">
                        Enter your email and we'll send you a link to reset it.
                    </p>
                </div>

                <div className="bg-[#0A120E] border border-white/10 rounded-[2.5rem] shadow-[0_16px_40px_rgba(0,0,0,0.8)] overflow-hidden backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both ring-1 ring-white/5 relative">
                    {/* Shimmer effect inside card */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-50 pointer-events-none" />
                    
                    <div className="p-6 sm:p-8 md:p-10 relative z-10">
                        {isSubmitted ? (
                            <div className="text-center space-y-8 py-4">
                                <div className="mx-auto size-20 bg-primary/10 rounded-[1.5rem] flex items-center justify-center border border-primary/20 shadow-[0_0_30px_rgba(34,197,94,0.1)]">
                                    <span className="material-symbols-outlined text-5xl text-primary animate-bounce">mark_email_read</span>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-3">Check your email</h3>
                                    <p className="text-white/50 text-sm leading-relaxed">
                                        We've sent password reset instructions to <br />
                                        <span className="font-bold text-primary mt-2 block break-all">{email}</span>
                                    </p>
                                </div>
                                <Button
                                    onClick={() => setLocation("/login")}
                                    className="w-full h-[60px] rounded-2xl font-bold bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all active:scale-[0.98]"
                                >
                                    Return to login
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-sm font-semibold text-white/90">Email address</label>
                                    <div className="relative group">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/40 transition-colors group-focus-within:text-primary z-10">mail</span>
                                        <Input
                                            type="email"
                                            placeholder="you@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            disabled={isLoading}
                                            className="h-[60px] pl-[50px] bg-black/40 border-white/10 hover:border-white/20 text-white placeholder:text-white/30 focus:border-primary/50 focus:ring-primary/20 transition-all rounded-2xl shadow-inner font-medium text-[15px]"
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-[60px] text-base font-bold rounded-2xl bg-gradient-to-r from-primary to-[#10B981] hover:from-primary/90 hover:to-[#10B981]/90 text-black shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] border border-white/20 hover:border-white/40 transition-all active:scale-[0.98]"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            Sending instructions...
                                        </>
                                    ) : (
                                        "Send Link"
                                    )}
                                </Button>
                            </form>
                        )}
                    </div>
                    
                    {!isSubmitted && (
                        <div className="p-6 bg-black/20 border-t border-white/5 text-center relative z-10">
                            <span className="text-[14px] text-white/50 font-medium">Remember your password? </span>
                            <button 
                                onClick={() => setLocation("/login")}
                                className="text-[14px] font-bold text-primary hover:text-emerald-400 transition-colors ml-1 hover:underline underline-offset-4"
                            >
                                Back to login
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
