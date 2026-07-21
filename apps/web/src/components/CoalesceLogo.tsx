"use client";

import { useEffect, useRef } from "react";

// The "Coalesce" wordmark from DESIGN.md: "waft" condenses out of vapor
// (feTurbulence displacement 46 -> ~1), reveal wisps sweep through, then the
// settled mark keeps a low-amplitude breathe with ambient wisps drifting by
// at random short intervals. Mount once per page — the SVG defs use fixed ids.

const SVGNS = "http://www.w3.org/2000/svg";
const FONT = '"Avenir Next", "Segoe UI", system-ui, sans-serif';
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const wordStyle: React.CSSProperties = {
  fontFamily: FONT,
  fontWeight: 800,
  fontSize: 150,
  letterSpacing: -5,
};

export function CoalesceLogo({ className }: { className?: string }) {
  const turbRef = useRef<SVGFETurbulenceElement>(null);
  const dispRef = useRef<SVGFEDisplacementMapElement>(null);
  const glowRef = useRef<SVGTextElement>(null);
  const wordRef = useRef<SVGTextElement>(null);
  const wispsRef = useRef<SVGGElement>(null);
  const ambientRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const turb = turbRef.current;
    const disp = dispRef.current;
    const glow = glowRef.current;
    const word = wordRef.current;
    const wisps = wispsRef.current;
    const ambient = ambientRef.current;
    if (!turb || !disp || !glow || !word || !wisps || !ambient) return;

    const rafs = new Set<number>();
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const raf = (fn: FrameRequestCallback) => {
      const id = requestAnimationFrame((now) => {
        rafs.delete(id);
        fn(now);
      });
      rafs.add(id);
      return id;
    };

    // A wisp draws itself along its path (dashoffset) while its opacity
    // rises and falls on a sine — it never pops in or out.
    function newWisp(group: SVGGElement, d: string, width: number, dur: number, peak: number) {
      const p = document.createElementNS(SVGNS, "path");
      p.setAttribute("d", d);
      p.setAttribute("stroke-width", String(width));
      const len = 300;
      p.style.strokeDasharray = String(len);
      p.style.strokeDashoffset = String(len);
      p.style.opacity = "0";
      group.appendChild(p);
      const t0 = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / dur);
        p.style.strokeDashoffset = String(len * (1 - Math.min(1, t * 1.6)));
        p.style.opacity = String(Math.sin(t * Math.PI) * peak);
        if (t < 1) raf(step);
        else p.remove();
      };
      raf(step);
    }

    function ambientLoop() {
      const y = 150 + (Math.random() * 60 - 30);
      const x = 40 + Math.random() * 440;
      const dir = Math.random() > 0.5 ? 1 : -1;
      newWisp(
        ambient!,
        `M${x} ${y} C ${x + dir * 40} ${y - 24}, ${x + dir * 90} ${y + 20}, ${x + dir * 140} ${y - 6}`,
        1.7,
        1600 + Math.random() * 800,
        0.28
      );
      timers.add(setTimeout(ambientLoop, 700 + Math.random() * 1900));
    }

    // Gentle, low-amplitude so the settled logo stays sharp.
    function idleBreathe() {
      let s = 7;
      const tick = () => {
        s += 0.005;
        turb!.setAttribute("seed", (7 + Math.sin(s) * 2.2).toFixed(2));
        disp!.setAttribute("scale", (1 + Math.sin(s * 1.3) * 0.9).toFixed(2));
        raf(tick);
      };
      raf(tick);
    }

    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      disp.setAttribute("scale", "0");
      word.style.opacity = "1";
      glow.style.opacity = "0.24";
      return;
    }

    [
      "M70 138 C 120 108,150 168,205 138",
      "M320 138 C 370 166,420 108,475 136",
      "M120 178 C 180 193,240 173,300 186",
    ].forEach((d, i) => timers.add(setTimeout(() => newWisp(wisps, d, 2.3, 1400, 0.6), i * 90)));

    const start = performance.now();
    const DUR = 2100;
    const frame = (now: number) => {
      const t = Math.min(1, (now - start) / DUR);
      const e = easeOut(t);
      disp.setAttribute("scale", lerp(46, 1, e).toFixed(2));
      turb.setAttribute(
        "baseFrequency",
        `${lerp(0.03, 0.012, e).toFixed(4)} ${lerp(0.05, 0.02, e).toFixed(4)}`
      );
      word.style.opacity = String(Math.min(1, e * 1.5));
      glow.style.opacity = String(lerp(0, 0.5, e) * (1 - e * 0.35));
      if (t < 1) raf(frame);
      else {
        glow.style.opacity = "0.24";
        idleBreathe();
        ambientLoop();
      }
    };
    raf(frame);

    return () => {
      rafs.forEach(cancelAnimationFrame);
      timers.forEach(clearTimeout);
      wisps.innerHTML = "";
      ambient.innerHTML = "";
    };
  }, []);

  return (
    <svg
      className={className}
      viewBox="0 0 600 240"
      role="img"
      aria-label="waft"
      style={{ overflow: "visible" }}
    >
      <defs>
        <linearGradient id="clg-ink" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#eaf0ff" />
          <stop offset=".55" stopColor="#b9c8ff" />
          <stop offset="1" stopColor="#6c8cff" />
        </linearGradient>
        <filter id="clg-vapor" x="-40%" y="-60%" width="180%" height="260%">
          <feTurbulence
            ref={turbRef}
            type="fractalNoise"
            baseFrequency="0.03 0.05"
            numOctaves={2}
            seed={7}
            result="n"
          />
          <feDisplacementMap
            ref={dispRef}
            in="SourceGraphic"
            in2="n"
            scale={46}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
      <text
        ref={glowRef}
        x={300}
        y={170}
        textAnchor="middle"
        style={{ ...wordStyle, fill: "#6c8cff", filter: "blur(22px)", opacity: 0 }}
      >
        waft
      </text>
      <g ref={ambientRef} fill="none" stroke="url(#clg-ink)" strokeLinecap="round" />
      <g ref={wispsRef} fill="none" stroke="url(#clg-ink)" strokeLinecap="round" opacity={0.9} />
      <text
        ref={wordRef}
        x={300}
        y={170}
        textAnchor="middle"
        filter="url(#clg-vapor)"
        style={{ ...wordStyle, fill: "url(#clg-ink)", opacity: 0 }}
      >
        waft
      </text>
    </svg>
  );
}
