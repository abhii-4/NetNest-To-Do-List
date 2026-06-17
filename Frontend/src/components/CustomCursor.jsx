import { useEffect, useRef } from "react";
import gsap from "gsap";

export const CustomCursor = () => {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    // Center cursor offsets
    gsap.set(dot, { xPercent: -50, yPercent: -50 });
    gsap.set(ring, { xPercent: -50, yPercent: -50, transformOrigin: "center center" });

    let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let ringPos = { x: mouse.x, y: mouse.y };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;

      // Small central dot moves immediately
      gsap.to(dot, {
        x: mouse.x,
        y: mouse.y,
        duration: 0.08,
        ease: "power2.out",
      });
    };

    // Ticker loops at 60fps to calculate velocity and deforms the ring
    const updateRing = () => {
      const ease = 0.16; // spring tension
      const dx = mouse.x - ringPos.x;
      const dy = mouse.y - ringPos.y;

      ringPos.x += dx * ease;
      ringPos.y += dy * ease;

      // Calculate speed / velocity vector
      const speed = Math.sqrt(dx * dx + dy * dy);

      // Determine stretching scale factors based on velocity (caps stretch at 1.75x)
      const stretch = Math.min(speed * 0.015, 0.75);
      const scaleX = 1 + stretch;
      const scaleY = 1 - stretch * 0.4; // squeeze the perpendicular axis slightly

      // Calculate the angle of travel in degrees
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);

      // Update ring transform properties
      gsap.set(ring, {
        x: ringPos.x,
        y: ringPos.y,
        scaleX: scaleX,
        scaleY: scaleY,
        rotation: angle,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    gsap.ticker.add(updateRing);

    const handleMouseOver = (e) => {
      const target = e.target;
      if (!target) return;

      const isClickable =
        target.tagName === "BUTTON" ||
        target.tagName === "A" ||
        target.tagName === "INPUT" ||
        target.closest("button") ||
        target.closest("a") ||
        target.getAttribute("role") === "button";

      if (isClickable) {
        gsap.to(ring, {
          borderColor: "rgba(220, 20, 60, 0.9)",
          backgroundColor: "rgba(220, 20, 60, 0.15)",
          borderWidth: "2px",
          width: 44,
          height: 44,
          duration: 0.2,
        });
        gsap.to(dot, {
          scale: 0, // hide core dot completely on interactive hovers for a clean look
          duration: 0.2,
        });
      }
    };

    const handleMouseOut = (e) => {
      const target = e.target;
      if (!target) return;

      const isClickable =
        target.tagName === "BUTTON" ||
        target.tagName === "A" ||
        target.tagName === "INPUT" ||
        target.closest("button") ||
        target.closest("a") ||
        target.getAttribute("role") === "button";

      if (isClickable) {
        gsap.to(ring, {
          borderColor: "rgba(220, 20, 60, 0.4)",
          backgroundColor: "transparent",
          borderWidth: "1px",
          width: 32,
          height: 32,
          duration: 0.2,
        });
        gsap.to(dot, {
          scale: 1,
          backgroundColor: "#DC143C",
          duration: 0.2,
        });
      }
    };

    window.addEventListener("mouseover", handleMouseOver);
    window.addEventListener("mouseout", handleMouseOut);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      gsap.ticker.remove(updateRing);
      window.removeEventListener("mouseover", handleMouseOver);
      window.removeEventListener("mouseout", handleMouseOut);
    };
  }, []);

  return (
    <>
      {/* Central glowing dot */}
      <div
        ref={dotRef}
        className="pointer-events-none fixed top-0 left-0 w-2.5 h-2.5 bg-[#DC143C] rounded-full z-[9999] shadow-[0_0_8px_rgba(220,20,60,0.8)] hidden md:block"
      />
      {/* Large trailing spring ring */}
      <div
        ref={ringRef}
        className="pointer-events-none fixed top-0 left-0 w-8 h-8 border border-[#DC143C]/40 rounded-full z-[9999] hidden md:block transition-all duration-75"
      />
    </>
  );
};

export default CustomCursor;
