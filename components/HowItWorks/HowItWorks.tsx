import styles from "./HowItWorks.module.css";

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

export default function HowItWorks() {
    return (
        <section id="how-it-works" className={styles.howItWorks}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h2 className={styles.title}>
                        How <span className={styles.highlight}>AtlasField</span> Works
                    </h2>
                    <p className={styles.subtitle}>
                        From satellite to actionable insights in four simple steps
                    </p>
                </div>

                <div className={styles.timeline}>
                    {steps.map((step, index) => (
                        <div key={index} className={styles.step}>
                            <div className={styles.stepNumber}>{step.number}</div>
                            <div className={styles.stepContent}>
                                <div className={styles.stepIcon}>{step.icon}</div>
                                <h3 className={styles.stepTitle}>{step.title}</h3>
                                <p className={styles.stepDescription}>{step.description}</p>
                            </div>
                            {index < steps.length - 1 && <div className={styles.connector}></div>}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
