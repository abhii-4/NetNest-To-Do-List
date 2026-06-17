// Cinematic crimson spinner with stroke-dasharray + GSAP rotation.
import { useEffect, useRef } from "react";
import gsap from "gsap";

export const Spinner = ({ size = 36, className = "" }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const tween = gsap.to(ref.current, {
      rotate: 360,
      duration: 1.1,
      ease: "none",
      repeat: -1,
    });
    return () => tween.kill();
  }, []);

  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 50 50"
      className={className}
      data-testid="loading-spinner"
    >
      <circle
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="3"
      />
      <circle
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke="#DC143C"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="90 150"
      />
    </svg>
  );
};

export default Spinner;
