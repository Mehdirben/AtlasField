"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import {
  Satellite,
  CloudSun,
  Leaf,
  TrendingUp,
  ArrowRight,
  Play,
  Sparkles,
  Globe,
  Zap,
} from "lucide-react";



const stats = [
  { value: "99.7%", label: "Accuracy", icon: Zap },
  { value: "24/7", label: "Monitoring", icon: Globe },
  { value: "50K+", label: "Hectares", icon: Leaf },
];

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-blue-50 via-white to-green-50">
      {/* Hero Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/field-image.png"
          alt="Farm with satellite"
          fill
          className="object-cover object-center opacity-70"
          priority
          quality={100}
        />
        {/* Gradient overlays for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/40 to-white/70" />
      </div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 z-10">
        {/* Subtle animated gradient orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.03, 0.06, 0.03],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-atlas-500/10 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.03, 0.06, 0.03],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px]"
        />
      </div>

      {/* Main Content */}
      <div className="relative z-20 max-w-6xl mx-auto px-6 pt-32 pb-20 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-white/80 border border-atlas-200 backdrop-blur-sm shadow-sm"
        >
          <span className="flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-atlas-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-atlas-500"></span>
          </span>
          <span className="text-sm font-medium text-slate-700">
            ESA ActInSpace 2026 Finalist
          </span>
          <Sparkles className="w-4 h-4 text-atlas-500" />
        </motion.div>

        {/* Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6"
        >
          <span className="text-slate-900">Satellite Intelligence for</span>
          <br />
          <span className="relative">
            <span className="bg-gradient-to-r from-atlas-600 via-atlas-500 to-emerald-600 bg-clip-text text-transparent">
              Smarter Agriculture
            </span>
            <motion.span
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-atlas-500/50 via-atlas-600/50 to-transparent rounded-full origin-left"
            />
          </span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-2xl mx-auto text-lg md:text-xl text-slate-600 mb-10 leading-relaxed"
        >
          Harness the power of <span className="text-slate-900 font-semibold">Sentinel-1 & Sentinel-2</span> satellite data 
          with AI-driven insights. Monitor crops 24/7, even through clouds, and get actionable recommendations.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <motion.a
            href="#get-started"
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="group relative flex items-center gap-3 px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-atlas-500 to-atlas-600 rounded-full overflow-hidden shadow-[0_4px_30px_rgba(34,197,94,0.4)] hover:shadow-[0_8px_40px_rgba(34,197,94,0.5)] transition-all duration-300"
          >
            <span className="relative z-10">Start Free Trial</span>
            <ArrowRight className="relative z-10 w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            <div className="absolute inset-0 bg-gradient-to-r from-atlas-400 to-atlas-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </motion.a>

          <motion.a
            href="#demo"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="group flex items-center gap-3 px-8 py-4 text-base font-medium text-slate-700 bg-white/80 hover:bg-white border border-slate-200 hover:border-slate-300 rounded-full backdrop-blur-sm transition-all duration-300 shadow-sm"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-atlas-100 group-hover:bg-atlas-200 transition-colors duration-300">
              <Play className="w-4 h-4 text-atlas-600 ml-0.5" />
            </div>
            <span>Watch Demo</span>
          </motion.a>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-8 md:gap-16"
        >
          {stats.map(({ value, label, icon: Icon }, index) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="flex items-center gap-3"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/80 border border-slate-200 shadow-sm">
                <Icon className="w-5 h-5 text-atlas-600" />
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold text-slate-900">{value}</div>
                <div className="text-sm text-slate-600">{label}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="relative mt-20"
        >
          {/* Glow effect behind the card */}
          <div className="absolute inset-0 bg-gradient-to-b from-atlas-500/10 to-transparent blur-3xl" />
          
          {/* Dashboard mockup */}
          <div className="relative rounded-2xl md:rounded-3xl overflow-hidden border-2 border-slate-200 bg-white shadow-[0_20px_80px_rgba(0,0,0,0.15)]">
            {/* Window controls */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 bg-slate-50">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-4 py-1 rounded-md bg-slate-100 text-xs text-slate-500">
                  app.atlasfield.com/dashboard
                </div>
              </div>
            </div>
            
            {/* Dashboard content placeholder */}
            <div className="aspect-[16/9] md:aspect-[21/9] bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 p-6 md:p-10">
              <div className="h-full grid grid-cols-3 gap-4 md:gap-6">
                {/* Sidebar */}
                <div className="col-span-1 hidden md:flex flex-col gap-4">
                  <div className="h-12 rounded-xl bg-white border border-slate-200 shadow-sm" />
                  <div className="flex-1 rounded-xl bg-white border border-slate-200 shadow-sm" />
                </div>
                
                {/* Main content */}
                <div className="col-span-3 md:col-span-2 flex flex-col gap-4">
                  {/* Top cards */}
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-20 md:h-24 rounded-xl bg-white border border-slate-200 shadow-sm p-3 md:p-4">
                        <div className="w-8 h-2 rounded bg-atlas-500/30 mb-2" />
                        <div className="w-12 h-4 rounded bg-slate-200" />
                      </div>
                    ))}
                  </div>
                  
                  {/* Map area */}
                  <div className="flex-1 rounded-xl bg-gradient-to-br from-atlas-50 to-green-50 border-2 border-atlas-200 overflow-hidden relative shadow-sm">
                    <div className="absolute inset-0 opacity-40">
                      <div className="absolute top-1/4 left-1/3 w-20 h-20 md:w-32 md:h-32 rounded-full bg-atlas-500/40 blur-2xl" />
                      <div className="absolute bottom-1/3 right-1/4 w-16 h-16 md:w-24 md:h-24 rounded-full bg-green-500/30 blur-xl" />
                    </div>
                    <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/90 border border-slate-200 backdrop-blur-sm shadow-sm">
                      <Satellite className="w-4 h-4 text-atlas-500" />
                      <span className="text-xs text-slate-700 font-medium">Live Sentinel Feed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-xs text-slate-500 uppercase tracking-widest">Scroll</span>
          <div className="w-5 h-8 rounded-full border-2 border-slate-300 flex justify-center pt-2">
            <motion.div
              animate={{ y: [0, 8, 0], opacity: [1, 0, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-1 h-1 rounded-full bg-atlas-500"
            />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
