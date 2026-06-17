// Subtle magnetic hover effect: pulls towards the cursor by a few pixels.
import { useRef } from "react";
import gsap from "gsap";

export const MagneticButton = ({ children, className = "", ...rest }) => {
  const ref = useRef(null);

  const handleMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    gsap.to(el, { x: x * 0.18, y: y * 0.25, duration: 0.4, ease: "power3.out" });
  };

  const handleLeave = () => {
    if (ref.current) {
      gsap.to(ref.current, { x: 0, y: 0, duration: 0.55, ease: "elastic.out(1, 0.5)" });
    }
  };

  return (
    <button
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={className}
      {...rest}
    >
      {children}
    </button>
  );
};

export default MagneticButton;
