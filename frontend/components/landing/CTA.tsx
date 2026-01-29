import Link from "next/link";
import { Button } from "@/components/ui";
import { ArrowRightIcon } from "@/components/icons";

export function CTA() {
  return (
    <section className="relative py-20 md:py-28 bg-gradient-to-r from-emerald-600 to-emerald-500 overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Ready to Transform Your Farming?
        </h2>
        <p className="text-lg text-emerald-100 mb-8 max-w-xl mx-auto">
          Join thousands of farmers using satellite data to boost yields and
          reduce costs. Start your free trial today.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white text-emerald-600 font-semibold rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            Start Free Trial
            <ArrowRightIcon className="w-5 h-5" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-8 py-3 text-white font-medium hover:bg-white/10 rounded-full transition-all"
          >
            Already have an account? Log In
          </Link>
        </div>

        <p className="text-sm text-emerald-100/80">
          Free 14-day trial • No credit card required • Cancel anytime
        </p>
      </div>
    </section>
  );
}
