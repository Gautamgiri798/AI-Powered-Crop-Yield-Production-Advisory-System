import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function PricingPlans() {
  const plans = [
    {
      name: "Basic",
      price: "₹2,499",
      period: "/year",
      description: "Essential tools for individual farmers.",
      features: [
        "Up to 2 fields monitoring",
        "Weekly satellite updates",
        "Basic pest detection",
        "Email support",
      ],
      current: false,
    },
    {
      name: "Professional",
      price: "₹7,999",
      period: "/year",
      description: "Advanced AI insights for growing farms.",
      features: [
        "Unlimited fields monitoring",
        "Real-time satellite imagery",
        "AI yield forecasting",
        "Priority 24/7 support",
        "Advanced P&L analytics",
      ],
      current: true,
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "Custom solutions for large cooperatives.",
      features: [
        "Everything in Pro",
        "Custom API integration",
        "Dedicated agronomist",
        "On-site sensor training",
        "Bulk field management",
      ],
      current: false,
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight text-white">Subscription Plans</h1>
        <p className="text-muted-foreground font-medium">Choose the plan that fits your farm's scale and needs.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card 
            key={plan.name}
            className={cn(
              "relative overflow-hidden border-white/5 bg-card/40 backdrop-blur-xl group transition-all duration-500",
              plan.popular && "ring-2 ring-primary/50 shadow-[0_0_30px_rgba(34,197,94,0.1)]"
            )}
          >
            {plan.popular && (
              <div className="absolute top-0 right-0">
                <div className="bg-primary text-black text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl shadow-lg">
                  Popular
                </div>
              </div>
            )}
            
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                {plan.name}
                {plan.current && <Badge className="bg-primary/20 text-primary border-primary/20 hover:bg-primary/30">Current Plan</Badge>}
              </CardTitle>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">{plan.price}</span>
                <span className="text-muted-foreground text-sm font-medium">{plan.period}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{plan.description}</p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="h-px bg-white/5 w-full" />
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-white/80">
                    <span className="material-symbols-outlined text-primary text-lg shrink-0">check_circle</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                className={cn(
                  "w-full h-12 rounded-xl font-bold transition-all active:scale-[0.98]",
                  plan.current 
                    ? "bg-white/5 border border-white/10 text-white/40 cursor-default" 
                    : plan.popular
                    ? "bg-primary hover:bg-primary/90 text-black shadow-lg shadow-primary/20"
                    : "bg-white/10 hover:bg-white/20 text-white"
                )}
                disabled={plan.current}
              >
                {plan.current ? "Currently Active" : plan.name === "Enterprise" ? "Contact Support" : "Upgrade Plan"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Comparison Info */}
      <Card className="border-white/5 bg-white/[0.02] backdrop-blur-md">
        <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8 justify-between">
          <div className="flex items-center gap-6">
            <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
              <span className="material-symbols-outlined text-3xl text-primary">verified_user</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Secure & Flexible Billing</h3>
              <p className="text-sm text-muted-foreground max-w-md">No long term contracts. Upgrade, downgrade, or cancel your subscription at any time directly from your dashboard.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" className="text-muted-foreground hover:text-white">View Billing History</Button>
            <Button className="bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold px-8 h-12 rounded-xl">Manage Cards</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
