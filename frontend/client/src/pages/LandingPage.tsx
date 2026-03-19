import { Link } from "wouter";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function LandingPage() {
    const [email, setEmail] = useState("");
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="bg-landing-bg-light dark:bg-landing-bg-dark text-landing-text-light dark:text-landing-text-dark font-sans antialiased overflow-x-hidden min-h-screen flex flex-col">
            {/* ─── Navigation ─── */}
            <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0f1419]/80 backdrop-blur-xl backdrop-saturate-150 shadow-[0_1px_30px_rgba(13,242,89,0.06)]">
                <div className="px-4 md:px-10 py-3 flex items-center justify-between max-w-[1440px] mx-auto">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <div className="size-9 rounded-xl bg-landing-primary/15 flex items-center justify-center ring-1 ring-landing-primary/30 group-hover:bg-landing-primary/25 transition-all duration-300">
                            <span className="material-symbols-outlined text-2xl text-landing-primary">agriculture</span>
                        </div>
                        <span className="text-2xl font-extrabold tracking-tight text-white" style={{ fontFamily: "'gc fodex', sans-serif" }}>
                            Krishi<span className="text-landing-primary">Saarthi</span>
                        </span>
                    </Link>

                    {/* Nav links */}
                    <nav className="hidden md:flex items-center gap-1">
                        {["Features", "How it Works", "Pricing", "Contact"].map((item) => (
                            <a
                                key={item}
                                href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                                className="relative px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors duration-200 group"
                            >
                                {item}
                                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-0 bg-landing-primary rounded-full group-hover:w-3/4 transition-all duration-300" />
                            </a>
                        ))}
                    </nav>

                    {/* Desktop Auth buttons */}
                    <div className="hidden md:flex items-center gap-3">
                        <Link
                            href="/login"
                            className="h-9 px-5 flex items-center justify-center rounded-lg text-sm font-semibold text-gray-300 hover:text-white border border-white/10 hover:border-white/25 bg-white/5 hover:bg-white/10 transition-all duration-200"
                        >
                            Log In
                        </Link>
                        <Link href="/signup">
                            <button className="flex h-9 px-6 cursor-pointer items-center justify-center rounded-lg bg-landing-primary hover:brightness-110 transition-all duration-200 text-black text-sm font-bold shadow-lg shadow-landing-primary/25 hover:shadow-landing-primary/40">
                                Get Started
                            </button>
                        </Link>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button 
                        className="md:hidden text-white/80 hover:text-white p-2"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
                    </button>
                </div>

                {/* Mobile Menu Dropdown */}
                {isMobileMenuOpen && (
                    <div className="md:hidden absolute top-full left-0 w-full bg-[#0f1419]/95 backdrop-blur-3xl border-b border-white/10 shadow-2xl py-4 px-4 flex flex-col gap-4 z-50 animate-in slide-in-from-top-2">
                        <nav className="flex flex-col gap-2">
                            {["Features", "How it Works", "Pricing", "Contact"].map((item) => (
                                <a
                                    key={item}
                                    href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="px-4 py-3 text-base font-semibold text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                                >
                                    {item}
                                </a>
                            ))}
                        </nav>
                        <div className="h-px w-full bg-white/10 my-2"></div>
                        <div className="flex flex-col gap-3 px-2">
                            <Link 
                                href="/login" 
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="w-full h-12 flex items-center justify-center rounded-xl text-base font-bold text-white border border-white/20 bg-white/5 hover:bg-white/10 transition-colors"
                            >
                                Log In
                            </Link>
                            <Link 
                                href="/signup" 
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="w-full h-12 flex items-center justify-center rounded-xl bg-landing-primary hover:brightness-110 text-black text-base font-bold transition-transform active:scale-[0.98]"
                            >
                                Get Started
                            </Link>
                        </div>
                    </div>
                )}
            </header>

            <main className="flex-1">
                {/* ─── Hero Section ─── */}
                <section className="relative w-full overflow-hidden">
                    {/* Stronger overlay so text is always readable */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-landing-bg-light dark:to-landing-bg-dark z-10" />
                    <div
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0 transform scale-105"
                        style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDX7LQwU0BCByxazKzVxG9x7AOIWY6YjKgJ4ENaeGS5MH9xZCDsUnUk7y8bWrQz9eGor2UYGDhxXtpH0x0TtiWORFciEOzZB6xfRERcozagltolI02MgWW32p7ZLdrjRTsPwY0yX38q70wXQUS0bimGtjRVGIK6faggOOLxKUnc2Zxw23Nyge40du2QJjU7WtCVPZWBXH5FBDZKpN2xxCthJM1czZhqnb9on8hY7_6tKZchakCBP8VyBjwo_t5oakk16QxeBdlcSas")' }}
                    />
                    <div className="relative z-20 container mx-auto flex flex-col items-center justify-center min-h-[600px] md:min-h-[700px] px-4 py-20 text-center">
                        <div className="max-w-4xl flex flex-col items-center gap-6 animate-fade-in-up">
                            {/* Announcement pill */}
                            <div className="inline-flex items-center rounded-full border border-landing-primary/30 bg-landing-primary/10 px-4 py-1.5 text-sm font-semibold text-landing-primary backdrop-blur-md mb-2 shadow-sm shadow-landing-primary/10">
                                <span className="mr-2 flex h-2 w-2 rounded-full bg-landing-primary animate-pulse" />
                                New: AI-Driven Yield Forecasting v2.0
                            </div>
                            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight tracking-tight drop-shadow-lg">
                                Empowering the <span className="text-landing-primary drop-shadow-[0_0_25px_rgba(13,242,89,0.4)]">Future</span> of Farming
                            </h1>
                            <p className="text-lg md:text-xl text-gray-200 max-w-2xl font-light leading-relaxed drop-shadow">
                                Leverage real-time satellite imagery and AI-driven insights to maximize yield, minimize waste, and cultivate a smarter future for your farm.
                            </p>
                            {/* CTA buttons — solid & visible */}
                            <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto">
                                <Link href="/signup">
                                    <button className="h-12 px-8 rounded-xl bg-landing-primary hover:brightness-110 text-black text-base font-bold transition-all transform hover:scale-[1.02] shadow-xl shadow-landing-primary/30 w-full sm:w-auto">
                                        Start Free Trial
                                    </button>
                                </Link>
                                <a href="#pricing" className="w-full sm:w-auto group">
                                    <button className="h-12 w-full px-8 rounded-xl bg-white/10 hover:bg-white/20 border border-white/30 hover:border-white/60 backdrop-blur-md text-white text-base font-bold transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_4_20px_rgba(0,0,0,0.4)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] transform group-hover:-translate-y-0.5 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out skew-x-12"></div>
                                        <span className="material-symbols-outlined text-[20px] transition-transform group-hover:scale-110 relative z-10">payments</span>
                                        <span className="relative z-10">View Pricing</span>
                                    </button>
                                </a>
                            </div>
                        </div>
                    </div>
                    {/* Curve separator */}
                    <div className="absolute bottom-0 left-0 right-0 z-20 h-16 bg-landing-bg-light dark:bg-landing-bg-dark" style={{ clipPath: "polygon(0 100%, 100% 100%, 100% 0, 0 100%)" }} />
                </section>

                {/* Features Section */}
                <section className="py-20 md:py-32 px-4 md:px-10 max-w-[1440px] mx-auto w-full" id="features">
                    <div className="flex flex-col md:flex-row gap-12 items-start justify-between mb-16">
                        <div className="max-w-xl">
                            <h2 className="text-3xl md:text-5xl font-black text-landing-text-light dark:text-landing-text-dark tracking-tight mb-4 leading-tight">
                                Cultivating <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-landing-primary to-green-600">Intelligence</span>
                            </h2>
                            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                                Our platform provides comprehensive tools to monitor and optimize every aspect of your farm, from the soil up to the satellite view.
                            </p>
                        </div>
                        <div className="flex items-end">
                            <a href="#" className="group flex items-center gap-2 text-landing-primary font-bold hover:underline">
                                View all features
                                <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
                            </a>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Feature 1 */}
                        <div className="group flex flex-col gap-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/5 p-6 hover:shadow-xl hover:shadow-landing-primary/5 hover:border-landing-primary/50 transition-all duration-300">
                            <div className="size-12 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-landing-primary group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-3xl">eco</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-landing-text-light dark:text-white mb-2">Crop Health</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">Monitor plant vitality with NDVI satellite imagery and detect stress before it spreads.</p>
                            </div>
                        </div>
                        {/* Feature 2 */}
                        <div className="group flex flex-col gap-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/5 p-6 hover:shadow-xl hover:shadow-landing-primary/5 hover:border-landing-primary/50 transition-all duration-300">
                            <div className="size-12 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-landing-primary group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-3xl">monitoring</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-landing-text-light dark:text-white mb-2">Market Prices</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">Real-time data on global commodity prices to help you decide when to sell.</p>
                            </div>
                        </div>
                        {/* Feature 3 */}
                        <div className="group flex flex-col gap-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/5 p-6 hover:shadow-xl hover:shadow-landing-primary/5 hover:border-landing-primary/50 transition-all duration-300">
                            <div className="size-12 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-landing-primary group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-3xl">support_agent</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-landing-text-light dark:text-white mb-2">Expert Connection</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">Direct, on-demand video access to agricultural specialists and agronomists.</p>
                            </div>
                        </div>
                        {/* Feature 4 */}
                        <div className="group flex flex-col gap-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/5 p-6 hover:shadow-xl hover:shadow-landing-primary/5 hover:border-landing-primary/50 transition-all duration-300">
                            <div className="size-12 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-landing-primary group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-3xl">psychology</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-landing-text-light dark:text-white mb-2">Yield Prediction</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">AI-driven forecasts that analyze historical data for better harvest planning.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How It Works Section */}
                <section className="py-20 bg-white dark:bg-[#0c1a0e] relative" id="how-it-works">
                    <div className="px-4 md:px-10 max-w-[1440px] mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-black text-landing-text-light dark:text-landing-text-dark mb-4">Streamlined for Success</h2>
                            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">From setup to harvest, KrishiSaarthi integrates seamlessly into your workflow in three simple steps.</p>
                        </div>
                        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                            {/* Connecting Line (Desktop) */}
                            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-gray-200 via-landing-primary to-gray-200 dark:from-gray-800 dark:via-landing-primary dark:to-gray-800 z-0"></div>
                            {/* Step 1 */}
                            <div className="relative z-10 flex flex-col items-center text-center group">
                                <div className="w-24 h-24 rounded-full bg-landing-bg-light dark:bg-landing-bg-dark border-4 border-white dark:border-[#0c1a0e] shadow-lg flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300">
                                    <span className="material-symbols-outlined text-4xl text-landing-primary">sensors</span>
                                </div>
                                <div className="bg-gray-50 dark:bg-white/5 p-6 rounded-2xl w-full border border-gray-100 dark:border-gray-800">
                                    <div className="inline-block px-3 py-1 bg-landing-primary/10 text-landing-primary text-xs font-bold rounded-full mb-3">STEP 01</div>
                                    <h3 className="text-xl font-bold text-landing-text-light dark:text-white mb-2">Connect Sensors</h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">Deploy IoT sensors or link existing hardware. Our system auto-calibrates in minutes.</p>
                                </div>
                            </div>
                            {/* Step 2 */}
                            <div className="relative z-10 flex flex-col items-center text-center group">
                                <div className="w-24 h-24 rounded-full bg-landing-bg-light dark:bg-landing-bg-dark border-4 border-white dark:border-[#0c1a0e] shadow-lg flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300">
                                    <span className="material-symbols-outlined text-4xl text-landing-primary">analytics</span>
                                </div>
                                <div className="bg-gray-50 dark:bg-white/5 p-6 rounded-2xl w-full border border-gray-100 dark:border-gray-800">
                                    <div className="inline-block px-3 py-1 bg-landing-primary/10 text-landing-primary text-xs font-bold rounded-full mb-3">STEP 02</div>
                                    <h3 className="text-xl font-bold text-landing-text-light dark:text-white mb-2">Analyze Data</h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">AI algorithms process soil, weather, and crop data to identify patterns and risks.</p>
                                </div>
                            </div>
                            {/* Step 3 */}
                            <div className="relative z-10 flex flex-col items-center text-center group">
                                <div className="w-24 h-24 rounded-full bg-landing-bg-light dark:bg-landing-bg-dark border-4 border-white dark:border-[#0c1a0e] shadow-lg flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300">
                                    <span className="material-symbols-outlined text-4xl text-landing-primary">rocket_launch</span>
                                </div>
                                <div className="bg-gray-50 dark:bg-white/5 p-6 rounded-2xl w-full border border-gray-100 dark:border-gray-800">
                                    <div className="inline-block px-3 py-1 bg-landing-primary/10 text-landing-primary text-xs font-bold rounded-full mb-3">STEP 03</div>
                                    <h3 className="text-xl font-bold text-landing-text-light dark:text-white mb-2">Optimize Harvest</h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">Receive actionable alerts and execute precise interventions to boost your ROI.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Pricing Section */}
                <section className="py-20 md:py-32 px-4 md:px-10 max-w-[1440px] mx-auto w-full bg-slate-50 dark:bg-[#0c1a0e]/50" id="pricing">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-black text-landing-text-light dark:text-landing-text-dark tracking-tight mb-4">Simple, transparent pricing</h2>
                        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">No hidden fees, no complicated contracts. Just the tools you need to maximize your yield.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {/* Basic Plan */}
                        <div className="flex flex-col p-8 rounded-3xl bg-[#0f1419]/80 backdrop-blur-xl border border-white/10 hover:border-landing-primary/30 shadow-2xl hover:shadow-[0_0_30px_rgba(13,242,89,0.1)] transition-all duration-500 group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-landing-primary/10 transition-colors duration-500"></div>
                            <h3 className="text-2xl font-bold text-white mb-2 relative z-10">Basic</h3>
                            <p className="text-gray-400 text-sm mb-6 relative z-10">Perfect for small family farms starting out.</p>
                            <div className="mb-6 relative z-10">
                                <span className="text-4xl font-black text-white">$29</span>
                                <span className="text-gray-400">/month</span>
                            </div>
                            <ul className="flex flex-col gap-4 mb-8 flex-1 relative z-10">
                                <li className="flex items-center gap-3 text-gray-300">
                                    <div className="size-5 rounded-full bg-white/10 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-[12px] text-white">check</span>
                                    </div>
                                    Up to 50 Acres
                                </li>
                                <li className="flex items-center gap-3 text-gray-300">
                                    <div className="size-5 rounded-full bg-white/10 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-[12px] text-white">check</span>
                                    </div>
                                    Basic Weather Forecasting
                                </li>
                                <li className="flex items-center gap-3 text-gray-300">
                                    <div className="size-5 rounded-full bg-white/10 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-[12px] text-white">check</span>
                                    </div>
                                    Manual Crop Tracking
                                </li>
                            </ul>
                            <Link href="/signup" className="relative z-10">
                                <button className="w-full flex items-center justify-center gap-2 h-12 rounded-xl text-white font-bold bg-white/5 hover:bg-white/10 border border-white/10 hover:border-landing-primary/50 transition-all duration-300">
                                    <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
                                    Start Basic
                                </button>
                            </Link>
                        </div>

                        {/* Pro Plan */}
                        <div className="flex flex-col p-8 rounded-3xl bg-[#0f1419]/90 backdrop-blur-xl border border-landing-primary/50 shadow-[0_0_40px_rgba(13,242,89,0.15)] relative hover:shadow-[0_0_60px_rgba(13,242,89,0.25)] transition-all duration-500 scale-105 z-10 overflow-hidden">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-landing-primary/20 rounded-full blur-[50px] -mr-10 -mt-10"></div>
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-gradient-to-r from-landing-primary to-green-500 text-black px-4 py-1 rounded-b-xl text-xs font-black tracking-widest uppercase shadow-lg shadow-landing-primary/20">
                                Most Popular
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2 mt-4 relative z-10">Professional</h3>
                            <p className="text-gray-300 text-sm mb-6 relative z-10">Advanced AI insights for mid-sized operations.</p>
                            <div className="mb-6 relative z-10">
                                <span className="text-5xl font-black text-white drop-shadow-md">$99</span>
                                <span className="text-gray-400">/month</span>
                            </div>
                            <ul className="flex flex-col gap-4 mb-8 flex-1 relative z-10">
                                <li className="flex items-center gap-3 text-gray-200">
                                    <div className="size-5 rounded-full bg-landing-primary/20 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-[12px] text-landing-primary">check</span>
                                    </div>
                                    Up to 500 Acres
                                </li>
                                <li className="flex items-center gap-3 text-gray-200">
                                    <div className="size-5 rounded-full bg-landing-primary/20 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-[12px] text-landing-primary">check</span>
                                    </div>
                                    AI Yield Forecasting
                                </li>
                                <li className="flex items-center gap-3 text-gray-200">
                                    <div className="size-5 rounded-full bg-landing-primary/20 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-[12px] text-landing-primary">check</span>
                                    </div>
                                    Satellite Imagery (Weekly)
                                </li>
                                <li className="flex items-center gap-3 text-gray-200">
                                    <div className="size-5 rounded-full bg-landing-primary/20 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-[12px] text-landing-primary">check</span>
                                    </div>
                                    Market Price Alerts
                                </li>
                            </ul>
                            <Link href="/signup" className="relative z-10">
                                <button className="w-full flex items-center justify-center gap-2 h-14 rounded-xl bg-gradient-to-r from-landing-primary to-green-500 text-black font-bold hover:brightness-110 shadow-[0_0_20px_rgba(13,242,89,0.3)] transition-all duration-300 transform hover:-translate-y-1">
                                    <span className="material-symbols-outlined text-[20px]">workspace_premium</span>
                                    Start Free Trial
                                </button>
                            </Link>
                        </div>

                        {/* Enterprise Plan */}
                        <div className="flex flex-col p-8 rounded-3xl bg-[#0f1419]/80 backdrop-blur-xl border border-white/10 hover:border-white/30 shadow-2xl hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] transition-all duration-500 group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-white/10 transition-colors duration-500"></div>
                            <h3 className="text-2xl font-bold text-white mb-2 relative z-10">Enterprise</h3>
                            <p className="text-gray-400 text-sm mb-6 relative z-10">Custom solutions for large scale agricultural giants.</p>
                            <div className="mb-6 relative z-10">
                                <span className="text-4xl font-black text-white">Custom</span>
                            </div>
                            <ul className="flex flex-col gap-4 mb-8 flex-1 relative z-10">
                                <li className="flex items-center gap-3 text-gray-300">
                                    <div className="size-5 rounded-full bg-white/10 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-[12px] text-white">check</span>
                                    </div>
                                    Unlimited Acres
                                </li>
                                <li className="flex items-center gap-3 text-gray-300">
                                    <div className="size-5 rounded-full bg-white/10 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-[12px] text-white">check</span>
                                    </div>
                                    Daily Drone/Satellite Sync
                                </li>
                                <li className="flex items-center gap-3 text-gray-300">
                                    <div className="size-5 rounded-full bg-white/10 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-[12px] text-white">check</span>
                                    </div>
                                    Dedicated Agronomist Rep
                                </li>
                                <li className="flex items-center gap-3 text-gray-300">
                                    <div className="size-5 rounded-full bg-white/10 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-[12px] text-white">check</span>
                                    </div>
                                    Custom API Integration
                                </li>
                            </ul>
                            <Link href="/signup" className="relative z-10">
                                <button className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-white text-black font-bold hover:bg-gray-200 transition-all duration-300 shadow-md">
                                    <span className="material-symbols-outlined text-[18px]">support_agent</span>
                                    Contact Sales
                                </button>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section id="contact" className="w-full py-20 bg-landing-bg-light dark:bg-landing-bg-dark scroll-mt-20">
                    <div className="px-4 md:px-10 max-w-[1440px] mx-auto">
                        <div className="relative overflow-hidden rounded-3xl bg-green-900 px-6 py-16 md:px-16 md:py-24 text-center shadow-2xl">
                            {/* Background Pattern */}
                            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(#13ec25 1px, transparent 1px)", backgroundSize: "30px 30px" }}></div>
                            <div className="relative z-10 max-w-3xl mx-auto">
                                <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Ready to maximize your yield?</h2>
                                <p className="text-green-100 text-lg mb-10">Join 10,000+ modern farmers using KrishiSaarthi to grow smarter, not harder. Start your 14-day free trial today.</p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Link href="/signup">
                                        <button className="h-12 px-8 rounded-lg bg-landing-primary hover:bg-landing-primary/90 text-black text-base font-bold transition-all shadow-lg shadow-green-900/50">
                                            Get Started Now
                                        </button>
                                    </Link>
                                    <button className="h-12 px-8 rounded-lg bg-transparent border border-white/30 text-white hover:bg-white/10 text-base font-bold transition-all">
                                        Contact Sales
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-white dark:bg-black border-t border-gray-200 dark:border-gray-900 pt-16 pb-8">
                <div className="px-4 md:px-10 max-w-[1440px] mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-16">
                        <div className="lg:col-span-2">
                            <div className="flex items-center gap-2 mb-6">
                                <span className="material-symbols-outlined text-3xl text-landing-primary">agriculture</span>
                                <span className="text-2xl font-bold text-landing-text-light dark:text-landing-text-dark" style={{ fontFamily: "'gc fodex', sans-serif" }}>KrishiSaarthi</span>
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-xs">
                                Empowering farmers worldwide with data-driven insights for sustainable and profitable agriculture.
                            </p>
                            <div className="flex gap-4">
                                <a href="#" className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-landing-primary hover:text-black transition-colors">
                                    <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path></svg>
                                </a>
                                <a href="#" className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-landing-primary hover:text-black transition-colors">
                                    <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path clipRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.468 2.37c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.882-.344-1.857-.047-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" fillRule="evenodd"></path></svg>
                                </a>
                                <a href="#" className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-landing-primary hover:text-black transition-colors">
                                    <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" fillRule="evenodd"></path></svg>
                                </a>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-bold text-landing-text-light dark:text-white mb-4">Product</h4>
                            <ul className="flex flex-col gap-3 text-sm text-gray-500 dark:text-gray-400">
                                <li><a href="#" className="hover:text-landing-primary transition-colors">Features</a></li>
                                <li><a href="#" className="hover:text-landing-primary transition-colors">Pricing</a></li>
                                <li><a href="#" className="hover:text-landing-primary transition-colors">Integrations</a></li>
                                <li><a href="#" className="hover:text-landing-primary transition-colors">Enterprise</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-landing-text-light dark:text-white mb-4">Company</h4>
                            <ul className="flex flex-col gap-3 text-sm text-gray-500 dark:text-gray-400">
                                <li><a href="#" className="hover:text-landing-primary transition-colors">About Us</a></li>
                                <li><a href="#" className="hover:text-landing-primary transition-colors">Careers</a></li>
                                <li><a href="#" className="hover:text-landing-primary transition-colors">Blog</a></li>
                                <li><a href="#" className="hover:text-landing-primary transition-colors">Contact</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-landing-text-light dark:text-white mb-4">Newsletter</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Subscribe for the latest agricultural trends and product updates.</p>
                            <form className="flex flex-col gap-2" onSubmit={(e) => e.preventDefault()}>
                                <input
                                    className="w-full h-10 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-landing-primary focus:border-transparent"
                                    placeholder="Enter your email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <button className="h-10 w-full rounded-md bg-landing-primary hover:bg-landing-primary/90 text-black text-sm font-bold transition-colors">Subscribe</button>
                            </form>
                        </div>
                    </div>
                    <div className="border-t border-gray-100 dark:border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                        <p>© 2026 KrishiSaarthi Inc. All rights reserved.</p>
                        <div className="flex gap-6">
                            <a href="#" className="hover:text-landing-text-light dark:hover:text-white transition-colors">Privacy Policy</a>
                            <a href="#" className="hover:text-landing-text-light dark:hover:text-white transition-colors">Terms of Service</a>
                            <a href="#" className="hover:text-landing-text-light dark:hover:text-white transition-colors">Cookie Settings</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
