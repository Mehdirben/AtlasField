import styles from "./Features.module.css";

const features = [
    {
        icon: "🛰️",
        title: "Multi-Sensor Fusion",
        description:
            "Combines Sentinel-1 radar and Sentinel-2 optical imagery for comprehensive field analysis, even through clouds.",
    },
    {
        icon: "☁️",
        title: "Cloud-Free Monitoring",
        description:
            "SAR radar technology sees through clouds and works in any weather. Your monitoring never stops.",
    },
    {
        icon: "🧠",
        title: "AI-Powered Analysis",
        description:
            "Deep learning models detect diseases early, identify pests, and provide actionable recommendations.",
    },
    {
        icon: "📊",
        title: "Yield Prediction",
        description:
            "Get accurate harvest forecasts 2-3 months ahead using historical data and current field conditions.",
    },
    {
        icon: "🔔",
        title: "Real-Time Alerts",
        description:
            "Instant notifications for pest threats, irrigation needs, and anomalies detected in your fields.",
    },
    {
        icon: "💬",
        title: "Interactive Dashboard",
        description:
            "Chat with our AI assistant about your fields. Ask questions and get instant, data-driven answers.",
    },
];

export default function Features() {
    return (
        <section id="features" className={styles.features}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h2 className={styles.title}>
                        Everything You Need for{" "}
                        <span className={styles.highlight}>Precision Farming</span>
                    </h2>
                    <p className={styles.subtitle}>
                        Leverage satellite data and AI to make smarter decisions for your fields.
                        From real-time monitoring to predictive analytics.
                    </p>
                </div>

                <div className={styles.grid}>
                    {features.map((feature, index) => (
                        <div key={index} className={styles.card}>
                            <div className={styles.iconWrapper}>
                                <span className={styles.icon}>{feature.icon}</span>
                            </div>
                            <h3 className={styles.cardTitle}>{feature.title}</h3>
                            <p className={styles.cardDescription}>{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
