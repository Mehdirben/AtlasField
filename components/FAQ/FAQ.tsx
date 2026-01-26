"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "What satellites does AtlasField use?",
    answer: "We use data from ESA's Sentinel-1 (SAR radar) and Sentinel-2 (optical) satellites. Sentinel-1 provides all-weather monitoring with 12-day revisit cycles, while Sentinel-2 offers high-resolution 10m optical imagery with 5-day revisits. This multi-sensor approach ensures continuous monitoring even in cloudy conditions.",
  },
  {
    question: "How often is my field data updated?",
    answer: "Sentinel-2 optical data is updated every 5 days, and Sentinel-1 radar data every 12 days. However, the actual update frequency depends on your location and cloud coverage. Our system automatically fetches the latest available imagery and alerts you when new data is processed.",
  },
  {
    question: "Can AtlasField see through clouds?",
    answer: "Yes! This is one of our key advantages. Sentinel-1 uses SAR (Synthetic Aperture Radar) technology that penetrates clouds, fog, and smoke. While optical imagery from Sentinel-2 is blocked by clouds, our AI fusion algorithms combine both data sources to provide uninterrupted insights regardless of weather conditions.",
  },
  {
    question: "What crops does AtlasField support?",
    answer: "AtlasField works with all major crops including cereals (wheat, barley, corn), legumes, vegetables, fruits, and perennial crops like olives and vineyards. Our AI models are calibrated for Mediterranean and North African agriculture, with specific optimizations for Morocco's climate and farming practices.",
  },
  {
    question: "How accurate are the yield predictions?",
    answer: "Our yield prediction models achieve 85-95% accuracy depending on crop type and data availability. Accuracy improves throughout the growing season as we collect more satellite observations. We use NDVI time series, weather data, and historical yields to train our machine learning models specifically for your region.",
  },
  {
    question: "Do I need special equipment or sensors?",
    answer: "No! AtlasField works entirely with satellite data - no ground sensors, drones, or special equipment required. All you need is an internet connection and a device (computer, tablet, or smartphone) to access our platform. This makes it extremely cost-effective compared to traditional precision agriculture tools.",
  },
  {
    question: "Can I integrate AtlasField with my existing farm management software?",
    answer: "Yes! We offer a REST API on Pro and Enterprise plans that allows seamless integration with popular farm management systems like FarmLogs, Agrivi, and custom solutions. You can export data in standard formats (CSV, GeoJSON, KML) or use our webhooks for real-time updates.",
  },
  {
    question: "What's the minimum field size for monitoring?",
    answer: "We recommend a minimum field size of 0.5 hectares (1.2 acres) for reliable results. Sentinel-2's 10m resolution means smaller fields may only have a few pixels, reducing accuracy. However, we can monitor fields as small as 0.2 hectares with reduced confidence levels.",
  },
  {
    question: "Is my farm data secure and private?",
    answer: "Absolutely. All data is encrypted in transit (TLS 1.3) and at rest (AES-256). We're GDPR compliant and never share your field data with third parties. You maintain full ownership of your data and can export or delete it anytime. Our servers are hosted in EU data centers with ISO 27001 certification.",
  },
  {
    question: "Can I try AtlasField before subscribing?",
    answer: "Yes! We offer a 14-day free trial with full access to all features (up to 50 hectares). No credit card required. You can explore the dashboard, analyze your fields, and see historical data before deciding on a plan. We also offer a free tier for small farms (up to 10 hectares) with limited features.",
  },
  {
    question: "What about historical data for my fields?",
    answer: "Sentinel satellites have been collecting data since 2015 (Sentinel-2) and 2014 (Sentinel-1). When you add a field, we automatically process up to 2 years of historical imagery, allowing you to see vegetation trends, compare current season to previous years, and understand long-term changes in your fields.",
  },
  {
    question: "Do you support cooperative or enterprise deployments?",
    answer: "Yes! Our Enterprise plan is designed for agricultural cooperatives, insurance companies, banks, and government agencies managing thousands of hectares. We offer white-label solutions, custom integrations, dedicated support, and on-premise deployment options. Contact our sales team for custom pricing.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="relative py-24 md:py-32 overflow-hidden bg-white">
      {/* Background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-atlas-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-purple-50 border border-purple-200">
            <HelpCircle className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-700">FAQ</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Frequently Asked{" "}
            <span className="bg-gradient-to-r from-atlas-600 to-purple-600 bg-clip-text text-transparent">
              Questions
            </span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Everything you need to know about AtlasField.
            Can't find what you're looking for? Contact our support team.
          </p>
        </motion.div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="group"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-start justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200 backdrop-blur-sm hover:shadow-lg hover:border-slate-300 transition-all duration-300 text-left"
              >
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 group-hover:text-atlas-600 transition-colors duration-300">
                    {faq.question}
                  </h3>
                  <AnimatePresence>
                    {openIndex === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <p className="mt-4 text-slate-600 leading-relaxed">
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-atlas-50 border border-atlas-200 text-atlas-600"
                >
                  {openIndex === index ? (
                    <Minus className="w-4 h-4" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </motion.div>
              </button>
            </motion.div>
          ))}
        </div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 text-center p-8 rounded-2xl bg-gradient-to-br from-atlas-50 to-purple-50 border border-slate-200"
        >
          <h3 className="text-2xl font-bold text-slate-900 mb-4">
            Still have questions?
          </h3>
          <p className="text-slate-600 mb-6">
            Our support team is here to help you get started with AtlasField.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.a
              href="mailto:support@atlasfield.com"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 text-base font-semibold text-white bg-gradient-to-r from-atlas-500 to-atlas-600 rounded-full shadow-[0_4px_20px_rgba(34,197,94,0.3)]"
            >
              Contact Support
            </motion.a>
            <motion.a
              href="#demo"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 text-base font-medium text-slate-900 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors duration-300"
            >
              Schedule a Demo
            </motion.a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
