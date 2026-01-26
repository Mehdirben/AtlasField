"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./Stats.module.css";

const stats = [
    { value: 10000, suffix: "+", label: "Hectares Monitored" },
    { value: 500, suffix: "+", label: "Farmers Trust Us" },
    { value: 98, suffix: "%", label: "Accuracy Rate" },
];

function useCountUp(end: number, duration: number = 2000, startOnView: boolean = true) {
    const [count, setCount] = useState(0);
    const [hasStarted, setHasStarted] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!startOnView || hasStarted) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setHasStarted(true);
                }
            },
            { threshold: 0.5 }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, [startOnView, hasStarted]);

    useEffect(() => {
        if (!hasStarted) return;

        let startTime: number;
        let animationFrame: number;

        const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);

            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            setCount(Math.floor(easeOutQuart * end));

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            }
        };

        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [end, duration, hasStarted]);

    return { count, ref };
}

export default function Stats() {
    const counters = stats.map((stat) => useCountUp(stat.value));

    return (
        <section className={styles.stats}>
            <div className={styles.container}>
                {stats.map((stat, index) => (
                    <div key={index} className={styles.statItem} ref={counters[index].ref}>
                        <span className={styles.statValue}>
                            {counters[index].count.toLocaleString()}
                            {stat.suffix}
                        </span>
                        <span className={styles.statLabel}>{stat.label}</span>
                    </div>
                ))}
            </div>
        </section>
    );
}
