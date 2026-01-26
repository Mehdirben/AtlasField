"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Satellite,
  Menu,
  X,
  Sparkles,
  ArrowRight,
} from "lucide-react";

const navLinks = [
  { name: "Features", href: "#features" },
  { name: "How It Works", href: "#how-it-works" },
  { name: "Pricing", href: "#pricing" },
  { name: "About", href: "#about" },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4 md:pt-6"
      >
        <nav
          className={cn(
            "relative flex items-center justify-between gap-2 px-2 py-2 md:px-3 md:py-2.5 rounded-full transition-all duration-500 ease-out",
            "border backdrop-blur-xl",
            isScrolled
              ? "bg-white/80 border-slate-200 shadow-[0_8px_32px_rgba(0,0,0,0.08)]"
              : "bg-white/60 border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.05)]",
            "w-full max-w-4xl"
          )}
        >
          {/* Glow effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-atlas-500/5 via-transparent to-atlas-500/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          
          {/* Logo */}
          <motion.a
            href="/"
            className="relative flex items-center gap-2 pl-2 md:pl-3 group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-atlas-500/20 blur-lg rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-atlas-400 to-atlas-600 shadow-[0_2px_10px_rgba(34,197,94,0.4)]">
                <Satellite className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <span className="text-lg font-semibold tracking-tight">
              <span className="text-slate-900">Atlas</span>
              <span className="bg-gradient-to-r from-atlas-600 to-atlas-500 bg-clip-text text-transparent">Field</span>
            </span>
          </motion.a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <motion.a
                key={link.name}
                href={link.href}
                onHoverStart={() => setActiveLink(link.name)}
                onHoverEnd={() => setActiveLink("")}
                className="relative px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors duration-200"
              >
                {activeLink === link.name && (
                  <motion.span
                    layoutId="navHighlight"
                    className="absolute inset-0 bg-slate-100 rounded-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
                <span className="relative z-10">{link.name}</span>
              </motion.a>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-2 pr-1">
            <motion.a
              href="#demo"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors duration-200"
            >
              Demo
            </motion.a>
            <motion.a
              href="#get-started"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="group relative flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-atlas-500 to-atlas-600 rounded-full overflow-hidden shadow-[0_2px_20px_rgba(34,197,94,0.3)] hover:shadow-[0_4px_25px_rgba(34,197,94,0.5)] transition-shadow duration-300"
            >
              <span className="relative z-10">Get Started</span>
              <ArrowRight className="relative z-10 w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              <div className="absolute inset-0 bg-gradient-to-r from-atlas-400 to-atlas-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.a>
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden relative flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-all duration-200"
          >
            <AnimatePresence mode="wait">
              {isMobileMenuOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="w-5 h-5" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="w-5 h-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </nav>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-20 left-4 right-4 z-40 p-4 rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200 shadow-[0_8px_40px_rgba(0,0,0,0.12)] md:hidden"
          >
            <div className="flex flex-col gap-1">
              {navLinks.map((link, index) => (
                <motion.a
                  key={link.name}
                  href={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-base font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all duration-200"
                >
                  <Sparkles className="w-4 h-4 text-atlas-500" />
                  {link.name}
                </motion.a>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col gap-2">
              <a
                href="#demo"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center px-4 py-3 text-base font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all duration-200"
              >
                View Demo
              </a>
              <a
                href="#get-started"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 px-4 py-3 text-base font-semibold text-white bg-gradient-to-r from-atlas-500 to-atlas-600 rounded-xl shadow-[0_2px_20px_rgba(34,197,94,0.3)]"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop for mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>
    </>
  );
}
