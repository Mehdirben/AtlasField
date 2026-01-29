import { Section, Container, SectionHeader, Card } from "@/components/ui";

const features = [
  {
    icon: "🛰️",
    title: "Multi-Sensor Fusion",
    description: "Combines Sentinel-1 radar and Sentinel-2 optical imagery for comprehensive field analysis, even through clouds.",
  },
  {
    icon: "☁️",
    title: "Cloud-Free Monitoring",
    description: "SAR radar technology sees through clouds and works in any weather. Your monitoring never stops.",
  },
  {
    icon: "🧠",
    title: "AI-Powered Analysis",
    description: "Deep learning models detect diseases early, identify pests, and provide actionable recommendations.",
  },
  {
    icon: "📊",
    title: "Yield Prediction",
    description: "Get accurate harvest forecasts 2-3 months ahead using historical data and current field conditions.",
  },
  {
    icon: "🔔",
    title: "Real-Time Alerts",
    description: "Instant notifications for pest threats, irrigation needs, and anomalies detected in your fields.",
  },
  {
    icon: "💬",
    title: "AI Chat Assistant",
    description: "Chat with our AI assistant about your fields. Ask questions and get instant, data-driven answers.",
  },
];

export function Features() {
  return (
    <Section id="features" className="bg-slate-50">
      <Container>
        <SectionHeader
          title={
            <>
              Everything You Need for{" "}
              <span className="bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
                Precision Farming
              </span>
            </>
          }
          subtitle="Leverage satellite data and AI to make smarter decisions for your fields. From real-time monitoring to predictive analytics."
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="p-6">
              <div className="w-12 h-12 flex items-center justify-center text-2xl bg-emerald-50 rounded-xl mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-slate-600">{feature.description}</p>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  );
}
