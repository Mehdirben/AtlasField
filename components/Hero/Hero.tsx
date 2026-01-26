"use client";

import styles from "./Hero.module.css";

export default function Hero() {
    const handlePrimaryClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        const element = document.querySelector("#pricing");
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
        }
    };

    const handleSecondaryClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        alert("Demo video coming soon! 🎬");
    };

    return (
        <section className={styles.hero}>
            {/* Background mesh gradient */}
            <div className={styles.meshGradient} aria-hidden="true">
                <div className={`${styles.blob} ${styles.blob1}`}></div>
                <div className={`${styles.blob} ${styles.blob2}`}></div>
                <div className={`${styles.blob} ${styles.blob3}`}></div>
            </div>

            <div className={styles.container}>
                <div className={styles.content}>
                    <div className={styles.textContent}>
                        <div className={styles.badge}>
                            <span className={styles.badgeIcon}>🛰️</span>
                            <span>Powered by ESA Sentinel Data</span>
                        </div>

                        <h1 className={styles.title}>
                            Monitor Your Fields{" "}
                            <span className={styles.highlight}>From Space</span>
                        </h1>

                        <p className={styles.subtitle}>
                            Get real-time insights on crop health, yield predictions, and pest
                            alerts using Sentinel satellite data and AI. Make smarter farming
                            decisions with data from space.
                        </p>

                        <div className={styles.ctas}>
                            <a href="#pricing" className={styles.primaryBtn} onClick={handlePrimaryClick}>
                                Start Free Trial
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M4.167 10h11.666M10 4.167L15.833 10 10 15.833" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </a>
                            <button className={styles.secondaryBtn} onClick={handleSecondaryClick}>
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M10 18.333A8.333 8.333 0 1010 1.667a8.333 8.333 0 000 16.666z" stroke="currentColor" strokeWidth="1.5" />
                                    <path d="M8.333 7.5l4.167 2.5-4.167 2.5V7.5z" fill="currentColor" />
                                </svg>
                                Watch Demo
                            </button>
                        </div>

                        <div className={styles.trustBadges}>
                            <div className={styles.trustItem}>
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M16.667 5L7.5 14.167 3.333 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <span>500+ Farmers</span>
                            </div>
                            <div className={styles.trustItem}>
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M16.667 5L7.5 14.167 3.333 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <span>10,000+ Hectares</span>
                            </div>
                            <div className={styles.trustItem}>
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M16.667 5L7.5 14.167 3.333 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <span>98% Accuracy</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.visualContent}>
                        <div className={styles.dashboardMockup}>
                            <div className={styles.mockupHeader}>
                                <div className={styles.mockupDots}>
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                                <span className={styles.mockupTitle}>AtlasField Dashboard</span>
                            </div>
                            <div className={styles.mockupBody}>
                                <div className={styles.mapPlaceholder}>
                                    <div className={styles.fieldOverlay}>
                                        <div className={styles.healthIndicator}>
                                            <span className={styles.healthLabel}>NDVI</span>
                                            <span className={styles.healthValue}>0.78</span>
                                        </div>
                                        <div className={styles.satelliteIcon}>🛰️</div>
                                    </div>
                                    <div className={styles.mapGrid}>
                                        {[...Array(20)].map((_, i) => (
                                            <div key={i} className={styles.gridCell} style={{
                                                backgroundColor: `rgba(16, 185, 129, ${0.2 + Math.random() * 0.6})`
                                            }}></div>
                                        ))}
                                    </div>
                                </div>
                                <div className={styles.statsPanel}>
                                    <div className={styles.statItem}>
                                        <span className={styles.statLabel}>Crop Health</span>
                                        <div className={styles.statBar}>
                                            <div className={styles.statFill} style={{ width: "85%" }}></div>
                                        </div>
                                    </div>
                                    <div className={styles.statItem}>
                                        <span className={styles.statLabel}>Soil Moisture</span>
                                        <div className={styles.statBar}>
                                            <div className={styles.statFill} style={{ width: "62%" }}></div>
                                        </div>
                                    </div>
                                    <div className={styles.statItem}>
                                        <span className={styles.statLabel}>Yield Forecast</span>
                                        <span className={styles.statValue}>+12% vs last year</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
