import Link from "next/link";
import { Section, Container, SectionHeader, Card, Button } from "@/components/ui";
import { CheckIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Free",
    price: "€0",
    period: "/month",
    description: "Perfect for small farmers getting started",
    features: [
      "1 field monitoring",
      "10 analyses per month",
      "Basic NDVI reports",
      "Weekly email updates",
      "Community support",
    ],
    cta: "Get Started",
    highlighted: false,
    href: "/register",
  },
  {
    name: "Pro",
    price: "€29",
    period: "/month",
    description: "For growing farms that need more insights",
    features: [
      "10 fields monitoring",
      "Unlimited analyses",
      "AI-powered chat assistant",
      "Real-time alerts",
      "Yield predictions",
      "Priority support",
    ],
    cta: "Start Free Trial",
    highlighted: true,
    href: "/register",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For cooperatives and large operations",
    features: [
      "Unlimited fields",
      "API access",
      "Custom AI models",
      "Dedicated account manager",
      "On-premise deployment",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
    highlighted: false,
    href: "mailto:contact@atlasfield.ai?subject=Enterprise%20Inquiry",
  },
];

export function Pricing() {
  return (
    <Section id="pricing" className="bg-slate-50">
      <Container>
        <SectionHeader
          title={
            <>
              Simple,{" "}
              <span className="bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
                Transparent
              </span>{" "}
              Pricing
            </>
          }
          subtitle="Start free and scale as you grow. No hidden fees."
        />

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <Card
              key={index}
              hover={false}
              className={cn(
                "relative p-6 flex flex-col",
                plan.highlighted &&
                  "border-2 border-emerald-500 shadow-xl shadow-emerald-500/10 scale-105"
              )}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-semibold rounded-full">
                  Most Popular
                </span>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                <p className="text-slate-600 text-sm mt-1">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                <span className="text-slate-500">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckIcon className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-600">{feature}</span>
                  </li>
                ))}
              </ul>

              {plan.name === "Enterprise" ? (
                <a
                  href={plan.href}
                  className={cn(
                    "w-full text-center py-3 rounded-full font-semibold transition-all",
                    "border border-slate-200 text-slate-700 hover:bg-slate-50"
                  )}
                >
                  {plan.cta}
                </a>
              ) : (
                <Link
                  href={plan.href}
                  className={cn(
                    "w-full text-center py-3 rounded-full font-semibold transition-all",
                    plan.highlighted
                      ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl"
                      : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                  )}
                >
                  {plan.cta}
                </Link>
              )}
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  );
}
