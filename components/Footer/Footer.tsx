"use client";

import { motion } from "framer-motion";
import {
  Satellite,
  Github,
  Twitter,
  Linkedin,
  Mail,
  MapPin,
  Award,
} from "lucide-react";

const footerLinks = {
  product: [
    { name: "Features", href: "#features" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Pricing", href: "#pricing" },
    { name: "API Docs", href: "#api" },
  ],
  company: [
    { name: "About", href: "#about" },
    { name: "Blog", href: "#blog" },
    { name: "Careers", href: "#careers" },
    { name: "Contact", href: "#contact" },
  ],
  resources: [
    { name: "Documentation", href: "#docs" },
    { name: "Help Center", href: "#help" },
    { name: "FAQ", href: "#faq" },
    { name: "Status", href: "#status" },
  ],
  legal: [
    { name: "Privacy", href: "#privacy" },
    { name: "Terms", href: "#terms" },
    { name: "Security", href: "#security" },
    { name: "Cookies", href: "#cookies" },
  ],
};

const socialLinks = [
  { name: "Twitter", icon: Twitter, href: "#" },
  { name: "LinkedIn", icon: Linkedin, href: "#" },
  { name: "GitHub", icon: Github, href: "#" },
  { name: "Email", icon: Mail, href: "mailto:contact@atlasfield.com" },
];

export default function Footer() {
  return (
    <footer className="relative bg-slate-50 border-t border-slate-200">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-atlas-500/30 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 pt-16 pb-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <motion.a
              href="/"
              className="inline-flex items-center gap-2 mb-4"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-atlas-400 to-atlas-600 shadow-[0_2px_10px_rgba(34,197,94,0.4)]">
                <Satellite className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-xl font-semibold tracking-tight">
                <span className="text-white">Atlas</span>
                <span className="bg-gradient-to-r from-atlas-400 to-atlas-300 bg-clip-text text-transparent">
                  Field
                </span>
              </span>
            </motion.a>

            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              Satellite intelligence for smarter agriculture. Powered by ESA Sentinel satellites and AI.
            </p>

            {/* ESA Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-atlas-50 border border-atlas-200">
              <Award className="w-4 h-4 text-atlas-600" />
              <span className="text-xs font-medium text-atlas-700">
                ESA ActInSpace 2026 Finalist
              </span>
            </div>

            {/* Location */}
            <div className="flex items-center gap-2 mt-4 text-slate-500 text-sm">
              <MapPin className="w-4 h-4" />
              <span>Casablanca, Morocco 🇲🇦</span>
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h3 className="text-slate-900 font-semibold mb-4">Product</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-white/60 hover:text-atlas-400 text-sm transition-colors duration-200"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-white/60 hover:text-atlas-400 text-sm transition-colors duration-200"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-slate-900 font-semibold mb-4">Resources</h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-white/60 hover:text-atlas-400 text-sm transition-colors duration-200"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-slate-900 font-semibold mb-4">Legal</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-slate-600 hover:text-atlas-600 text-sm transition-colors duration-200"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Copyright */}
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} AtlasField. All rights reserved.
          </p>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => {
              const Icon = social.icon;
              return (
                <motion.a
                  key={social.name}
                  href={social.href}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-atlas-600 hover:bg-slate-50 hover:border-atlas-200 transition-all duration-200"
                  aria-label={social.name}
                >
                  <Icon className="w-4 h-4" />
                </motion.a>
              );
            })}
          </div>
        </div>

        {/* Powered by */}
        <div className="mt-8 pt-6 border-t border-slate-200 text-center">
          <p className="text-slate-500 text-xs">
            Powered by{" "}
            <a
              href="https://sentinel.esa.int"
              target="_blank"
              rel="noopener noreferrer"
              className="text-atlas-600 hover:text-atlas-700 transition-colors duration-200"
            >
              ESA Sentinel Satellites
            </a>
            {" "}&{" "}
            <a
              href="https://dataspace.copernicus.eu"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 transition-colors duration-200"
            >
              Copernicus Data Space
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
