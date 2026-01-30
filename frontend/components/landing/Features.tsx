import { Section, Container, SectionHeader, Card } from "@/components/ui";

const features = [
  {
    icon: "📡",
    title: "Multi-Sensor Fusion",
    description: "Combines Sentinel radar and optical imagery for comprehensive analysis of your sites, even through persistent clouds.",
  },
  {
    icon: "🔥",
    title: "Fire & Risk Detection",
    description: "Advanced algorithms detect early fire signs and moisture stress in forests and fields to prevent environmental damage.",
  },
  {
    icon: "🌳",
    title: "Forest Health & Carbon",
    description: "Monitor canopy cover, species health, and estimate carbon stock changes over time with high-resolution data.",
  },
  {
    icon: "📊",
    title: "State-of-the-art Indices",
    description: "Access NDVI, NBR, and NDMI reports to track vegetation health and moisture levels accurately.",
  },
  {
    icon: "🔔",
    title: "Real-Time Alerts",
    description: "Instant notifications for forest fire risks, pest threats, and soil anomalies detected at your sites.",
  },
  {
    icon: "💬",
    title: "AI Site Assistant",
    description: "Chat with our AI about your land. Ask questions about forest density, crop health, or historical trends.",
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
                Modern Monitoring
              </span>
            </>
          }
          subtitle="Leverage satellite data and AI to make smarter decisions for your land. From real-time monitoring to advanced environmental insights."
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
