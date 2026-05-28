import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

interface NumberTickerProps {
  value: number;
  direction?: "up" | "down";
  delay?: number;
  decimalPlaces?: number;
  className?: string;
}

export function NumberTicker({
  value,
  direction = "up",
  delay = 0,
  decimalPlaces = 0,
  className,
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const motionValue = useMotionValue(direction === "down" ? value : 0);
  const spring = useSpring(motionValue, { damping: 60, stiffness: 80 });
  const inView = useInView(ref, { once: true, margin: "0px" });

  useEffect(() => {
    if (!inView) return;
    const timeout = window.setTimeout(() => {
      motionValue.set(direction === "down" ? 0 : value);
    }, delay * 1000);
    return () => window.clearTimeout(timeout);
  }, [delay, direction, inView, motionValue, value]);

  useEffect(() => {
    return spring.on("change", (latest) => {
      if (!ref.current) return;
      ref.current.textContent = Intl.NumberFormat("zh-TW", {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      }).format(Number(latest.toFixed(decimalPlaces)));
    });
  }, [decimalPlaces, spring]);

  return (
    <span ref={ref} className={cn("inline-block tabular-nums", className)}>
      0
    </span>
  );
}
