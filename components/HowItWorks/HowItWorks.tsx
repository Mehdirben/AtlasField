"use client";

import { motion } from "framer-motion";
import {
  MapPin,
  Satellite,
  Brain,
  LineChart,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const steps = [
  {
    number: "01",
    icon: MapPin,
    title: "Select Your Fields",
    description: "Draw your field boundaries on our interactive map or upload existing shapefiles. Support for multiple fields and polygons.",
    details: ["GPS coordinates", "Import KML/GeoJSON", "Multi-field management"],
    color: "from-atlas-400 to-emerald-400",
    bgGlow: "bg-atlas-500/20",
  },
  {
    number: "02",
    icon: Satellite,
    title: "Satellite Data Collection",
    description: "Our system automatically fetches the latest Sentinel-1 and Sentinel-2 imagery for your fields, processing it in real-time.",
    details: ["10m resolution", "5-day revisit cycle", "Cloud-free radar data"],
    color: "from-blue-400 to-cyan-400",
    bgGlow: "bg-blue-500/20",
  },
  {
    number: "03",
    icon: Brain,
    title: "AI Analysis",
    description: "Advanced machine learning algorithms analyze multi-spectral data to extract vegetation indices, detect anomalies, and predict outcomes.",
    details: ["NDVI & RVI fusion", "Anomaly detection", "Yield prediction models"],
    color: "from-purple-400 to-pink-400",
    bgGlow: "bg-purple-500/20",
  },
  {
    number: "04",
    icon: LineChart,
    title: "Actionable Insights",
    description: "Receive clear, actionable recommendations through our dashboard, mobile alerts, or API integration with your farm management system.",
    details: ["Real-time alerts", "Historical trends", "Export reports"],
    color: "from-orange-400 to-amber-400",
    bgGlow: "bg-orange-500/20",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-24 md:py-32 overflow-hidden bg-gradient-to-b from-slate-50 via-blue-50/30 to-slate-50">
      {/* Background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-[100px]" />
        
        {/* Animated connection lines */}
        <div className="absolute inset-0 hidden lg:block">
          <svg className="w-full h-full" style={{ opacity: 0.1 }}>
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#22c55e" stopOpacity="0" />
                <stop offset="50%" stopColor="#22c55e" stopOpacity="1" />
                <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
              </linearGradient>
            </defs>
            <motion.path
              d="M 20% 30% Q 50% 20%, 80% 30%"
              stroke="url(#lineGradient)"
              strokeWidth="2"
              fill="none"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
            <motion.path
              d="M 20% 70% Q 50% 80%, 80% 70%"
              stroke="url(#lineGradient)"
              strokeWidth="2"
              fill="none"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 2, delay: 0.3, ease: "easeInOut" }}
            />
          </svg>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-blue-50 border border-blue-200">
            <Satellite className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Simple Process</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            How <span className="bg-gradient-to-r from-atlas-600 to-blue-600 bg-clip-text text-transparent">AtlasField</span> Works
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            From field selection to actionable insights in four simple steps.
            Our automated pipeline handles the complexity so you can focus on farming.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="space-y-12 lg:space-y-24">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isEven = index % 2 === 0;

            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-8 lg:gap-16`}
              >
                {/* Content */}
                <div className={`flex-1 ${isEven ? 'lg:text-right' : 'lg:text-left'}`}>
                  <div className={`inline-flex items-center gap-3 mb-4 ${isEven ? 'lg:flex-row-reverse' : ''}`}>
                    <span className={`text-6xl font-bold bg-gradient-to-r ${step.color} bg-clip-text text-transparent opacity-20`}>
                      {step.number}
                    </span>
                    <div className={`h-px flex-1 bg-gradient-to-r ${step.color} opacity-20`} />
                  </div>

                  <h3 className="text-3xl font-bold text-slate-900 mb-4">
                    {step.title}
                  </h3>
                  <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                    {step.description}
                  </p>

                  {/* Details */}
                  <div className={`space-y-3 ${isEven ? 'lg:flex lg:flex-col lg:items-end' : ''}`}>
                    {step.details.map((detail, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: isEven ? 20 : -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                        className="flex items-center gap-3"
                      >
                        <CheckCircle2 className="w-5 h-5 text-atlas-600" />
                        <span className="text-slate-700">{detail}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Icon Card */}
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="relative"
                >
                  <div className={`absolute inset-0 ${step.bgGlow} rounded-3xl blur-3xl opacity-30`} />
                  <div className="relative w-64 h-64 flex items-center justify-center rounded-3xl bg-white border-2 border-slate-200 backdrop-blur-sm shadow-[0_8px_40px_rgba(0,0,0,0.08)]">
                    <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${step.color} opacity-5`} />
                    <Icon className="w-24 h-24 text-slate-700" strokeWidth={1.5} />
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom Arrow */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-20 flex justify-center"
        >
          <motion.a
            href="#pricing"
            whileHover={{ y: 5 }}
            className="flex flex-col items-center gap-3 text-slate-500 hover:text-atlas-600 transition-colors duration-300"
          >
            <span className="text-sm uppercase tracking-widest">See Pricing</span>
            <ArrowRight className="w-6 h-6 rotate-90" />
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
