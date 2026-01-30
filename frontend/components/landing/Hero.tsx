"use client";

import { useState, useEffect } from "react";
import { Button, Badge } from "@/components/ui";
import { ArrowRightIcon, PlayIcon, CheckIcon } from "@/components/icons";

const trustItems = [
  { text: "500+ Land Managers" },
  { text: "10,000+ Hectares" },
  { text: "98% Accuracy" },
];

export function Hero() {
  const [gridOpacities, setGridOpacities] = useState<number[]>([]);

  useEffect(() => {
    setGridOpacities([...Array(20)].map(() => 0.2 + Math.random() * 0.6));
  }, []);

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-cyan-50 to-blue-50 -z-10" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-200/30 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-200/30 rounded-full blur-3xl -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            <Badge variant="primary" className="mb-6">
              <span>🛰️</span>
              <span>Powered by ESA Sentinel Data</span>
            </Badge>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight mb-6">
              Monitor Your Fields &{" "}
              <span className="bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
                Forests from Space
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-xl mx-auto lg:mx-0">
              Get real-time insights on crop health, forest density, and
              environmental risks using Sentinel satellite data and AI. Build a
              sustainable future for your land with data from space.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
              <Button href="/register" size="lg">
                Start Free Trial
                <ArrowRightIcon />
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => alert("Demo video coming soon! 🎬")}
              >
                <PlayIcon />
                Watch Demo
              </Button>
            </div>

            <div className="flex flex-wrap gap-6 justify-center lg:justify-start">
              {trustItems.map((item) => (
                <div
                  key={item.text}
                  className="flex items-center gap-2 text-slate-600"
                >
                  <CheckIcon className="text-emerald-500" />
                  <span className="font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard Mockup */}
          <div className="relative hidden lg:block">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
              {/* Mockup Header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-400" />
                  <span className="w-3 h-3 rounded-full bg-amber-400" />
                  <span className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <span className="text-sm text-slate-500 ml-2">AtlasField Dashboard</span>
              </div>

              {/* Mockup Body */}
              <div className="p-4">
                <div className="relative aspect-video rounded-lg bg-gradient-to-br from-emerald-100 to-cyan-100 overflow-hidden">
                  {/* Health Indicator - Centered */}
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="bg-white/90 backdrop-blur rounded-lg px-4 py-3 shadow-lg">
                      <span className="text-xs text-slate-500 block text-center">NDVI</span>
                      <span className="text-2xl font-bold text-emerald-600">0.78</span>
                    </div>
                  </div>

                  {/* Grid */}
                  <div className="absolute inset-4 grid grid-cols-5 grid-rows-4 gap-1">
                    {gridOpacities.map((opacity, i) => (
                      <div
                        key={i}
                        className="rounded"
                        style={{ backgroundColor: `rgba(16, 185, 129, ${opacity})` }}
                      />
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-4 space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">Site Health (NDVI)</span>
                      <span className="font-medium text-slate-900">85%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full w-[85%] bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">Forest Carbon Stock</span>
                      <span className="font-medium text-slate-900">124 t/ha</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full w-[72%] bg-gradient-to-r from-green-500 to-emerald-400 rounded-full" />
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Environmental Risk</span>
                    <span className="font-medium text-emerald-600 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> Low
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
