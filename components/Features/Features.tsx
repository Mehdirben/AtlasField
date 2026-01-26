"use client";

import { motion } from "framer-motion";
import {
  Satellite,
  Cloud,
  Brain,
  Zap,
  BarChart3,
  Bell,
  Shield,
  Globe2,
  Layers,
  TrendingUp,
  Droplets,
  Bug,
} from "lucide-react";

const features = [
  {
    icon: Satellite,
    title: "Multi-Sensor Fusion",
    description: "Combines Sentinel-1 radar and Sentinel-2 optical data for comprehensive field analysis.",
    color: "from-atlas-400 to-emerald-400",
    bgColor: "bg-atlas-500/10",
    borderColor: "border-atlas-500/20",
  },
  {
    icon: Cloud,
    title: "All-Weather Monitoring",
    description: "SAR radar technology sees through clouds, ensuring 24/7 uninterrupted monitoring.",
    color: "from-blue-400 to-cyan-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
  },
  {
    icon: Brain,
    title: "AI-Powered Insights",
    description: "Machine learning analyzes satellite data to provide actionable agricultural recommendations.",
    color: "from-purple-400 to-pink-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
  },
  {
    icon: TrendingUp,
    title: "Yield Forecasting",
    description: "Predict crop yields with high accuracy using NDVI time series and AI models.",
    color: "from-emerald-400 to-green-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
  },
  {
    icon: BarChart3,
    title: "Biomass Estimation",
    description: "Real-time above-ground biomass calculations for better carbon tracking and crop management.",
    color: "from-orange-400 to-amber-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
  },
  {
    icon: Bug,
    title: "Disease Detection",
    description: "Early identification of pest infestations and crop diseases through anomaly detection.",
    color: "from-red-400 to-rose-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
  },
  {
    icon: Droplets,
    title: "Water Management",
    description: "Optimize irrigation with soil moisture and NDWI (water stress) indices.",
    color: "from-cyan-400 to-blue-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/20",
  },
  {
    icon: Bell,
    title: "Smart Alerts",
    description: "Receive instant notifications for critical field conditions requiring immediate action.",
    color: "from-yellow-400 to-orange-400",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/20",
  },
  {
    icon: Layers,
    title: "Multi-Field Dashboard",
    description: "Manage multiple fields from a single intuitive interface with comparative analytics.",
    color: "from-indigo-400 to-purple-400",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-500/20",
  },
  {
    icon: Shield,
    title: "ESA-Grade Data",
    description: "Powered by official ESA Sentinel satellites with 10m resolution imagery.",
    color: "from-slate-400 to-gray-400",
    bgColor: "bg-slate-500/10",
    borderColor: "border-slate-500/20",
  },
  {
    icon: Zap,
    title: "Real-Time Processing",
    description: "Get insights within minutes of satellite overpass with cloud-optimized processing.",
    color: "from-yellow-400 to-amber-400",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/20",
  },
  {
    icon: Globe2,
    title: "Global Coverage",
    description: "Monitor fields anywhere in the world with Sentinel's global revisit cycle.",
    color: "from-teal-400 to-cyan-400",
    bgColor: "bg-teal-500/10",
    borderColor: "border-teal-500/20",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export default function Features() {
  return (
    <section id="features" className="relative py-24 md:py-32 overflow-hidden bg-gradient-to-b from-white via-slate-50 to-white">
      {/* Background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-atlas-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-[100px]" />
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
            <Satellite className="w-4 h-4 text-atlas-600" />
            <span className="text-sm font-medium text-atlas-700">Powerful Features</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Everything You Need for
            <br />
            <span className="bg-gradient-to-r from-atlas-600 to-emerald-600 bg-clip-text text-transparent">
              Precision Agriculture
            </span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Harness cutting-edge satellite technology and AI to make data-driven decisions
            that increase yields and reduce costs.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group relative p-6 rounded-2xl bg-white border border-slate-200 backdrop-blur-sm transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
              >
                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-12 h-12 mb-4 rounded-xl ${feature.bgColor} border ${feature.borderColor}`}>
                  <Icon className="w-6 h-6 text-atlas-400" strokeWidth={2} />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-slate-900 mb-2 group-hover:text-atlas-600 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-atlas-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 text-center"
        >
          <p className="text-slate-600 mb-6">
            Ready to transform your agricultural operations?
          </p>
          <motion.a
            href="#get-started"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-atlas-500 to-atlas-600 rounded-full shadow-[0_4px_30px_rgba(34,197,94,0.4)] hover:shadow-[0_8px_40px_rgba(34,197,94,0.5)] transition-all duration-300"
          >
            Start Your Free Trial
            <Zap className="w-5 h-5" />
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
