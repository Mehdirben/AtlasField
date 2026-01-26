"use client";

import { useState } from "react";
import styles from "./CTA.module.css";

export default function CTA() {
    const [email, setEmail] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email) {
            setSubmitted(true);
            // In production, this would send to an API
            console.log("Email submitted:", email);
        }
    };

    return (
        <section id="cta" className={styles.cta}>
            <div className={styles.container}>
                <div className={styles.content}>
                    <h2 className={styles.title}>
                        Ready to Transform Your Farming?
                    </h2>
                    <p className={styles.subtitle}>
                        Join thousands of farmers using satellite data to boost yields and
                        reduce costs. Start your free trial today.
                    </p>

                    {!submitted ? (
                        <form className={styles.form} onSubmit={handleSubmit}>
                            <div className={styles.inputWrapper}>
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={styles.input}
                                    required
                                />
                                <button type="submit" className={styles.submitButton}>
                                    Get Started
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                        <path
                                            d="M4.167 10h11.666M10 4.167L15.833 10 10 15.833"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className={styles.successMessage}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" fill="white" fillOpacity="0.2" />
                                <path
                                    d="M8 12l3 3 5-6"
                                    stroke="white"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                            <span>Thanks! We'll be in touch soon.</span>
                        </div>
                    )}

                    <p className={styles.disclaimer}>
                        Free 14-day trial • No credit card required • Cancel anytime
                    </p>
                </div>
            </div>

            {/* Decorative elements */}
            <div className={styles.decorativeOrb1}></div>
            <div className={styles.decorativeOrb2}></div>
        </section>
    );
}
