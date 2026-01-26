"use client";

import { motion } from "framer-motion";
import { Check, X, Zap, ArrowRight, Sparkles } from "lucide-react";
import { useState } from "react";

const plans = [
  {
    name: "Starter",
    description: "Perfect for small farms",
    price: "Free",
    period: "forever",
    features: [
      "Up to 10 hectares",
      "Basic NDVI analysis",
      "Weekly satellite updates",
      "Email support",
      "Historical data (6 months)",
      "Export reports (PDF)",
    ],
    limitations: [
      "No radar data",
      "No AI predictions",
      "No API access",
    ],
    cta: "Start Free",
    highlighted: false,
    color: "from-slate-400 to-gray-400",
  },
  {
    name: "Professional",
    description: "For serious farmers",
    price: "€49",
    period: "/month",
    features: [
      "Up to 200 hectares",
      "Full multi-sensor fusion (Sentinel-1 + 2)",
      "Daily updates",
      "AI yield predictions",
      "Disease & pest alerts",
      "Biomass estimation",
      "Priority support (24h response)",
      "Historical data (2 years)",
      "Export all formats",
      "Mobile app access",
    ],
    limitations: [],
    cta: "Start 14-Day Trial",
    highlighted: true,
    color: "from-atlas-400 to-emerald-500",
    badge: "Most Popular",
  },
  {
    name: "Enterprise",
    description: "For cooperatives & organizations",
    price: "Custom",
    period: "pricing",
    features: [
      "Unlimited hectares",
      "White-label solution",
      "Custom integrations",
      "Dedicated account manager",
      "On-premise deployment option",
      "SLA guarantee (99.9%)",
      "Custom AI model training",
      "API access (unlimited calls)",
      "Bulk operations",
      "Advanced analytics",
      "Phone support",
    ],
    limitations: [],
    cta: "Contact Sales",
    highlighted: false,
    color: "from-purple-400 to-pink-400",
  },
];

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  return (
    <section id="pricing" className="relative py-24 md:py-32 overflow-hidden bg-gradient-to-b from-white via-slate-50 to-white">
      {/* Background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-atlas-500/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-atlas-50 border border-atlas-200">
            <Zap className="w-4 h-4 text-atlas-600" />
            <span className="text-sm font-medium text-atlas-700">Simple Pricing</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Choose Your{" "}
            <span className="bg-gradient-to-r from-atlas-600 to-purple-600 bg-clip-text text-transparent">
              Perfect Plan
            </span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
            Start free, upgrade as you grow. All plans include core satellite monitoring features.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 p-1.5 rounded-full bg-slate-100 border border-slate-200">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                billingCycle === "monthly"
                  ? "bg-atlas-500 text-white shadow-[0_2px_20px_rgba(34,197,94,0.4)]"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 relative ${
                billingCycle === "annual"
                  ? "bg-atlas-500 text-white shadow-[0_2px_20px_rgba(34,197,94,0.4)]"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Annual
              <span className="absolute -top-2 -right-2 px-2 py-0.5 text-xs font-bold text-atlas-900 bg-atlas-400 rounded-full">
                -20%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative"
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-atlas-400 to-atlas-500 text-space-900 text-xs font-bold shadow-[0_4px_20px_rgba(34,197,94,0.4)]">
                    <Sparkles className="w-3.5 h-3.5" />
                    {plan.badge}
                  </div>
                </div>
              )}

              {/* Card */}
              <div
                className={`relative h-full p-8 rounded-3xl backdrop-blur-sm transition-all duration-500 ${
                  plan.highlighted
                    ? "bg-white border-2 border-atlas-300 shadow-[0_8px_40px_rgba(34,197,94,0.15)] hover:shadow-[0_12px_50px_rgba(34,197,94,0.25)] scale-105"
                    : "bg-white border border-slate-200 hover:border-slate-300 hover:shadow-lg"
                }`}
              >
                {/* Glow effect for highlighted plan */}
                {plan.highlighted && (
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-atlas-500/10 to-transparent pointer-events-none" />
                )}

                {/* Header */}
                <div className="relative mb-6">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                  <p className="text-slate-600 text-sm">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="relative mb-8">
                  <div className="flex items-baseline gap-2">
                    <span className={`text-5xl font-bold bg-gradient-to-r ${plan.color} bg-clip-text text-transparent`}>
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-white/40 text-lg">{plan.period}</span>
                    )}
                  </div>
                  {billingCycle === "annual" && plan.price !== "Free" && plan.price !== "Custom" && (
                    <p className="mt-2 text-sm text-atlas-400">
                      Save €{(parseFloat(plan.price.replace("€", "")) * 12 * 0.2).toFixed(0)}/year
                    </p>
                  )}
                </div>

                {/* CTA Button */}
                <motion.a
                  href={plan.price === "Custom" ? "#contact" : "#get-started"}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className={`block w-full mb-8 px-6 py-4 rounded-xl text-center font-semibold transition-all duration-300 ${
                    plan.highlighted
                      ? "bg-gradient-to-r from-atlas-500 to-atlas-600 text-white shadow-[0_4px_25px_rgba(34,197,94,0.4)] hover:shadow-[0_6px_30px_rgba(34,197,94,0.5)]"
                      : "bg-slate-100 text-slate-900 border border-slate-200 hover:bg-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    {plan.cta}
                    <ArrowRight className="w-5 h-5" />
                  </span>
                </motion.a>

                {/* Features */}
                <div className="space-y-4 mb-6">
                  <p className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                    What's included:
                  </p>
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center bg-gradient-to-br ${plan.color} bg-opacity-20`}>
                          <Check className="w-3 h-3 text-atlas-400" strokeWidth={3} />
                        </div>
                      </div>
                      <span className="text-slate-700 text-sm">{feature}</span>
                    </div>
                  ))}
                  
                  {plan.limitations.length > 0 && (
                    <>
                      <div className="my-6 border-t border-slate-200" />
                      {plan.limitations.map((limitation, i) => (
                        <div key={i} className="flex items-start gap-3 opacity-50">
                          <div className="flex-shrink-0 mt-0.5">
                            <X className="w-5 h-5 text-slate-400" strokeWidth={2} />
                          </div>
                          <span className="text-slate-400 text-sm">{limitation}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <p className="text-slate-600 text-sm mb-4">
            All plans include access to ESA Sentinel satellites, automatic updates, and email support.
          </p>
          <p className="text-slate-500 text-xs">
            Prices in EUR. Billed {billingCycle === "annual" ? "annually" : "monthly"}. Cancel anytime.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
