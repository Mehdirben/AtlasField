"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";

const benefits = [
  "14-day free trial, no credit card required",
  "Cancel anytime, no questions asked",
  "Join 50,000+ hectares monitored",
  "Trusted by farmers in 30+ countries",
];

export default function CTA() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden bg-gradient-to-b from-slate-50 to-white">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-atlas-500/5 to-transparent" />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-atlas-500/10 rounded-full blur-[120px]"
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-atlas-50 border border-atlas-200">
            <Sparkles className="w-4 h-4 text-atlas-600" />
            <span className="text-sm font-medium text-atlas-700">
              Get Started Today
            </span>
          </div>

          {/* Heading */}
          <h2 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Ready to Transform Your
            <br />
            <span className="bg-gradient-to-r from-atlas-600 via-emerald-600 to-atlas-500 bg-clip-text text-transparent">
              Farming Operations?
            </span>
          </h2>

          <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            Join thousands of farmers using satellite intelligence to increase yields,
            reduce costs, and make smarter decisions.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <motion.a
              href="#get-started"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="group relative px-8 py-5 text-lg font-semibold text-white bg-gradient-to-r from-atlas-500 to-atlas-600 rounded-full overflow-hidden shadow-[0_8px_40px_rgba(34,197,94,0.5)] hover:shadow-[0_12px_50px_rgba(34,197,94,0.6)] transition-all duration-300"
            >
              <span className="relative z-10 flex items-center gap-2">
                Start Free Trial
                <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-atlas-300 to-atlas-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.a>

            <motion.a
              href="#pricing"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-5 text-lg font-medium text-slate-900 bg-white border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-full backdrop-blur-sm transition-all duration-300 shadow-sm"
            >
              View Pricing
            </motion.a>
          </div>

          {/* Benefits List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="flex items-center gap-3 text-left"
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-atlas-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-atlas-600" strokeWidth={2.5} />
                </div>
                <span className="text-slate-700">{benefit}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
