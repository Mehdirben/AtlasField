"use client";

import styles from "./Pricing.module.css";

const plans = [
    {
        name: "Free",
        price: "€0",
        period: "/month",
        description: "Perfect for small farmers getting started",
        features: [
            "1 field monitoring",
            "10 analyses per month",
            "Basic NDVI reports",
            "Weekly email updates",
            "Community support",
        ],
        cta: "Get Started",
        highlighted: false,
    },
    {
        name: "Pro",
        price: "€29",
        period: "/month",
        description: "For growing farms that need more insights",
        features: [
            "10 fields monitoring",
            "Unlimited analyses",
            "AI-powered chat assistant",
            "Real-time alerts",
            "Yield predictions",
            "Priority support",
        ],
        cta: "Start Free Trial",
        highlighted: true,
    },
    {
        name: "Enterprise",
        price: "Custom",
        period: "",
        description: "For cooperatives and large operations",
        features: [
            "Unlimited fields",
            "API access",
            "Custom AI models",
            "Dedicated account manager",
            "On-premise deployment",
            "SLA guarantee",
        ],
        cta: "Contact Sales",
        highlighted: false,
    },
];

export default function Pricing() {
    const handleClick = (planName: string) => {
        if (planName === "Enterprise") {
            window.location.href = "mailto:contact@atlasfield.ai?subject=Enterprise%20Inquiry";
        } else {
            const element = document.querySelector("#cta");
            if (element) {
                element.scrollIntoView({ behavior: "smooth" });
            }
        }
    };

    return (
        <section id="pricing" className={styles.pricing}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h2 className={styles.title}>
                        Simple, <span className={styles.highlight}>Transparent</span> Pricing
                    </h2>
                    <p className={styles.subtitle}>
                        Start free and scale as you grow. No hidden fees.
                    </p>
                </div>

                <div className={styles.grid}>
                    {plans.map((plan, index) => (
                        <div
                            key={index}
                            className={`${styles.card} ${plan.highlighted ? styles.highlighted : ""}`}
                        >
                            {plan.highlighted && (
                                <span className={styles.badge}>Most Popular</span>
                            )}
                            <div className={styles.cardHeader}>
                                <h3 className={styles.planName}>{plan.name}</h3>
                                <p className={styles.planDescription}>{plan.description}</p>
                            </div>
                            <div className={styles.priceWrapper}>
                                <span className={styles.price}>{plan.price}</span>
                                <span className={styles.period}>{plan.period}</span>
                            </div>
                            <ul className={styles.features}>
                                {plan.features.map((feature, i) => (
                                    <li key={i} className={styles.featureItem}>
                                        <svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 20 20"
                                            fill="none"
                                            className={styles.checkIcon}
                                        >
                                            <path
                                                d="M16.667 5L7.5 14.167 3.333 10"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            <button
                                className={`${styles.ctaButton} ${plan.highlighted ? styles.ctaHighlighted : ""}`}
                                onClick={() => handleClick(plan.name)}
                            >
                                {plan.cta}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
