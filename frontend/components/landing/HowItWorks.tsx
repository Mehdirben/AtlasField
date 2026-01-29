import { Section, Container, SectionHeader } from "@/components/ui";

const steps = [
  {
    number: "01",
    icon: "✏️",
    title: "Draw Your Field",
    description: "Simply draw your field boundaries on our interactive map. It takes less than a minute.",
  },
  {
    number: "02",
    icon: "📡",
    title: "Automatic Data Fetch",
    description: "We automatically fetch the latest Sentinel-1 and Sentinel-2 satellite imagery for your area.",
  },
  {
    number: "03",
    icon: "🧠",
    title: "AI Analysis",
    description: "Our AI calculates vegetation indices, detects anomalies, and predicts potential issues.",
  },
  {
    number: "04",
    icon: "📱",
    title: "Get Insights",
    description: "Receive actionable recommendations via dashboard or chat with our AI assistant.",
  },
];

export function HowItWorks() {
  return (
    <Section id="how-it-works">
      <Container>
        <SectionHeader
          title={
            <>
              How{" "}
              <span className="bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
                AtlasField
              </span>{" "}
              Works
            </>
          }
          subtitle="From satellite to actionable insights in four simple steps"
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[calc(50%+40px)] w-[calc(100%-40px)] h-0.5 bg-gradient-to-r from-emerald-200 to-emerald-100" />
              )}

              <div className="text-center">
                <div className="relative inline-block mb-4">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-50 to-cyan-50 border border-emerald-100 flex items-center justify-center text-4xl">
                    {step.icon}
                  </div>
                  <span className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-sm font-bold rounded-full flex items-center justify-center">
                    {step.number}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-slate-600">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
