// src/pages/LoginPage.tsx
import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GoogleLogin } from '@react-oauth/google';

export default function LoginPage() {
    const [, setLocation] = useLocation();
    const { login, googleLogin, isAuthenticated } = useAuth();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    if (isAuthenticated) {
        setLocation("/dashboard");
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!username.trim() || !password.trim()) {
            setError("Please fill in all fields");
            return;
        }

        setIsLoading(true);
        const result = await login(username, password);
        setIsLoading(false);

        if (result.success) {
            setLocation("/dashboard");
        } else {
            setError(result.error || "Login failed");
        }
    };

    return (
        <div className="min-h-screen flex bg-[#060D09] relative overflow-hidden font-sans">
            {/* Global Ambient Lights */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/15 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-emerald-600/15 rounded-full blur-[150px] pointer-events-none" />
            
            {/* Soft Grid Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />

            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative z-10 items-center justify-center border-r border-white/5 bg-black/20 backdrop-blur-sm">
                <div className="relative z-10 p-12 w-full max-w-xl">
                    <div className="mb-12 animate-in fade-in slide-in-from-left-8 duration-1000">
                        <div className="size-20 bg-black/40 backdrop-blur-2xl rounded-[1.5rem] flex items-center justify-center mb-8 border border-white/10 shadow-[0_0_40px_rgba(34,197,94,0.15)] text-primary">
                            <span className="material-symbols-outlined text-5xl bg-gradient-to-br from-primary to-emerald-400 bg-clip-text text-transparent">agriculture</span>
                        </div>
                        <h1 className="text-6xl md:text-[5rem] font-fodax text-white tracking-wide mb-6 drop-shadow-md leading-none">
                            Krishi<span className="text-primary drop-shadow-[0_0_25px_rgba(34,197,94,0.4)]">Saarthi</span>
                        </h1>
                        <p className="text-xl text-white/70 font-medium leading-relaxed max-w-sm">
                            Harness the power of AI to transform your crop yields and secure your farming future.
                        </p>
                    </div>

                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 fill-mode-both">
                        {[
                            { icon: "analytics", text: "Predictive Yield Analytics" },
                            { icon: "partly_cloudy_day", text: "Hyper-local Weather Intelligence" },
                            { icon: "water_drop", text: "Automated Irrigation Plans" }
                        ].map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-5 text-white/80 group cursor-default">
                                <div className="size-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-500 border border-white/5 group-hover:border-primary/30 group-hover:shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                                    <span className="material-symbols-outlined text-white/70 group-hover:text-primary transition-colors text-[28px]">{feature.icon}</span>
                                </div>
                                <span className="text-lg font-medium group-hover:text-white transition-colors tracking-wide">{feature.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 flex items-center justify-center p-6 relative z-10">
                <div className="w-full max-w-[440px]">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
                        <div className="size-16 sm:size-20 bg-black/40 backdrop-blur-2xl rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 sm:mb-6 border border-white/10 shadow-[0_0_40px_rgba(34,197,94,0.15)] text-primary">
                            <span className="material-symbols-outlined text-4xl sm:text-5xl bg-gradient-to-br from-primary to-emerald-400 bg-clip-text text-transparent">agriculture</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-fodax text-white drop-shadow-md">
                            Krishi<span className="text-primary drop-shadow-[0_0_20px_rgba(34,197,94,0.4)]">Saarthi</span>
                        </h1>
                    </div>

                    <div className="bg-[#0A120E] border border-white/10 rounded-[2.5rem] shadow-[0_16px_40px_rgba(0,0,0,0.8)] p-6 sm:p-8 md:p-10 backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both relative overflow-hidden ring-1 ring-white/5">
                        {/* Shimmer effect inside card */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-50 pointer-events-none" />

                        <div className="text-center mb-10 relative z-10">
                            <h2 className="text-[28px] font-bold text-white tracking-tight">Welcome Back</h2>
                            <p className="text-white/40 text-[13px] mt-2.5 font-bold uppercase tracking-[0.15em]">Sign in to your account</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                            {error && (
                                <div className="p-3.5 text-sm text-red-200 bg-red-500/20 rounded-2xl border border-red-500/30 flex items-center gap-3 animate-in slide-in-from-top-2 backdrop-blur-md font-medium">
                                    <span className="material-symbols-outlined text-red-400">error</span>
                                    {error}
                                </div>
                            )}

                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-white/90">Username</label>
                                <div className="relative group">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/40 transition-colors group-focus-within:text-primary z-10">person</span>
                                    <Input
                                        type="text"
                                        placeholder="Enter your username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        disabled={isLoading}
                                        className="h-[60px] pl-[50px] bg-black/40 border-white/10 hover:border-white/20 text-white placeholder:text-white/30 focus:border-primary/50 focus:ring-primary/20 transition-all rounded-2xl shadow-inner font-medium text-[15px]"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-semibold text-white/90">Password</label>
                                    <button
                                        type="button"
                                        onClick={() => setLocation("/forgot-password")}
                                        className="text-sm font-semibold text-primary/90 hover:text-primary transition-colors hover:underline underline-offset-4"
                                    >
                                        Forgot password?
                                    </button>
                                </div>
                                <div className="relative group">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/40 transition-colors group-focus-within:text-primary z-10">lock</span>
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter your password"
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
                                        <span className="material-symbols-outlined text-[22px]">{showPassword ? "visibility_off" : "visibility"}</span>
                                    </button>
                                </div>
                            </div>

                            <Button type="submit" disabled={isLoading} className="w-full h-[60px] gap-2 mt-2 rounded-2xl font-bold bg-gradient-to-r from-primary to-[#10B981] hover:from-primary/90 hover:to-[#10B981]/90 text-black shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] border border-white/20 hover:border-white/40 transition-all active:scale-[0.98] text-[16px]">
                                {isLoading ? (
                                    <>
                                        <span className="material-symbols-outlined animate-spin align-middle mr-1">progress_activity</span>
                                        Signing in...
                                    </>
                                ) : (
                                    <>
                                        Sign In
                                    </>
                                )}
                            </Button>
                        </form>

                        <div className="mt-10 relative z-10">
                            <div className="relative flex items-center py-2 mb-8">
                                <div className="flex-grow border-t border-white/10"></div>
                                <span className="flex-shrink-0 mx-4 text-white/30 text-[11px] font-bold uppercase tracking-[0.2em]">Or continue with</span>
                                <div className="flex-grow border-t border-white/10"></div>
                            </div>
                            
                            <div className="flex justify-center transition-transform hover:scale-[1.02] active:scale-[0.98] drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)]">
                                <GoogleLogin
                                    onSuccess={async (credentialResponse) => {
                                        setIsLoading(true);
                                        if (credentialResponse.credential) {
                                            const result = await googleLogin(credentialResponse.credential);
                                            if (result.success) {
                                                setLocation("/dashboard");
                                            } else {
                                                setError(result.error || "Google login failed");
                                            }
                                        }
                                        setIsLoading(false);
                                    }}
                                    onError={() => {
                                        setError("Google Login was unsuccessful");
                                    }}
                                    useOneTap
                                    theme="filled_black"
                                    shape="pill"
                                />
                            </div>
                        </div>

                        <div className="mt-10 text-center text-[15px] text-white/60 relative z-10 font-medium">
                            Don't have an account?{" "}
                            <button
                                onClick={() => setLocation("/signup")}
                                className="text-primary font-bold hover:text-emerald-400 transition-colors hover:underline underline-offset-4"
                            >
                                Sign up
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
