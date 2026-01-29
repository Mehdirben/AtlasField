"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui";
import { ArrowRightIcon, MenuIcon, CloseIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
];

export function Navbar() {
  const { data: session } = useSession();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 p-4 flex justify-center">
      <nav
        className={cn(
          "flex items-center justify-between w-full max-w-5xl px-6 py-3 rounded-full border transition-all duration-300",
          isScrolled
            ? "bg-white/95 backdrop-blur-xl border-slate-200 shadow-lg"
            : "bg-white/80 backdrop-blur-xl border-slate-100"
        )}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="text-2xl">🛰️</span>
          <span className="bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
            AtlasField
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-all"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Auth Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {session ? (
            <Button href="/dashboard" size="sm">
              Dashboard
              <ArrowRightIcon className="w-4 h-4" />
            </Button>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors"
              >
                Log In
              </Link>
              <Button href="/register" size="sm">
                Get Started
                <ArrowRightIcon className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>

        {/* Mobile Menu */}
        <div
          className={cn(
            "absolute top-full left-0 right-0 mt-2 p-2 bg-white rounded-2xl border border-slate-200 shadow-xl md:hidden transition-all duration-300",
            isMobileMenuOpen
              ? "opacity-100 translate-y-0 visible"
              : "opacity-0 -translate-y-4 invisible"
          )}
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="block px-4 py-3 text-slate-700 font-medium hover:bg-emerald-50 hover:text-emerald-600 rounded-xl transition-all"
            >
              {link.label}
            </a>
          ))}
          <hr className="my-2 border-slate-100" />
          {session ? (
            <Link
              href="/dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-4 py-3 text-center font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-xl"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-3 text-slate-700 font-medium hover:bg-slate-50 rounded-xl transition-all"
              >
                Log In
              </Link>
              <Link
                href="/register"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-3 text-center font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-xl"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
