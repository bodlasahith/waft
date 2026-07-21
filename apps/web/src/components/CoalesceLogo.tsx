"use client";

import { useEffect, useRef } from "react";

// The "Coalesce" wordmark from DESIGN.md: the ribbon-W lockup — the icon's
// folded-ribbon W (left flourish trimmed 30%, sized to the x-height of "aft")
// beside "aft" in the vapor gradient — condenses out of turbulent vapor
// (feTurbulence displacement 46 -> ~1) while reveal wisps sweep through, then
// keeps a low-amplitude breathe with ambient wisps drifting by at random
// short intervals. Mount once per page — the SVG defs use fixed ids.

const SVGNS = "http://www.w3.org/2000/svg";
const FONT = '"Avenir Next", "Segoe UI", system-ui, sans-serif';
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Ribbon-W geometry, lowercase-w silhouette — symmetric tips on the x-line,
// wider stance and higher middle peak than the icon's W, so it reads as the
// "w" in "waft" rather than a capital.
const V: [number, number][] = [
  [20, 30],
  [38, 74],
  [52, 42],
  [66, 74],
  [84, 30],
];
const WL = { minX: 20, maxX: 84, minY: 30, maxY: 74 };
const RIB_H = 6.6;
const PAL = ["#eef2ff", "#b9c8ff", "#6c8cff"];
const BASE = 170;
const GAP = 6;
const CX = 300;

// ---- Alive ribbon: traveling ripple (tips anchored) + laminar flow ----
const RIP_A = 1.4; // ripple amplitude, local units
const RIP_K = 6.8; // spatial frequency along the stroke
const RIP_W = 2.6; // temporal frequency (rad/s)
const SAMPLES = 9;
const FLOW_N = 7;

function ripple(s: number, phase: number, t: number) {
  return RIP_A * Math.sin(RIP_K * s - t * RIP_W + phase) * Math.sin(Math.PI * s);
}

// Smooth-sampled rib path: full-bellied at the middle, tapering to
// near-points at the ends (wispiness from geometry, not blur), rippling
// perpendicular to the stroke over time like a flag in light air.
function ribD(a: [number, number], b: [number, number], H: number, phase: number, t: number) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const L = Math.hypot(dx, dy);
  const nx = -dy / L;
  const ny = dx / L;
  const E = Math.max(1.1, H * 0.24);
  const top: string[] = [];
  const bot: string[] = [];
  for (let j = 0; j <= SAMPLES; j++) {
    const s = j / SAMPLES;
    const env = Math.sin(Math.PI * s);
    const w = E + (H - E) * Math.pow(env, 0.85);
    const d = ripple(s, phase, t);
    const px = a[0] + dx * s + nx * d;
    const py = a[1] + dy * s + ny * d;
    top.push(`${(px + nx * w).toFixed(1)} ${(py + ny * w).toFixed(1)}`);
    bot.push(`${(px - nx * w).toFixed(1)} ${(py - ny * w).toFixed(1)}`);
  }
  return `M${top.join(" L")} L${bot.reverse().join(" L")} Z`;
}

// Streamline streaks traverse the whole W left→right along the centerline,
// riding the same ripple as the ribbon (laminar, not turbulent).
const SEG = [0, 1, 2, 3].map((i) => {
  const a = V[i];
  const b = V[i + 1];
  return { a, b, L: Math.hypot(b[0] - a[0], b[1] - a[1]) };
});
const SEG_TOTAL = SEG.reduce((s, g) => s + g.L, 0);

interface FlowParticle {
  p: number;
  v: number;
  lat: number;
  len: number;
  w: number;
  o: number;
}
function newParticle(p: number): FlowParticle {
  return {
    p,
    v: 0.09 + Math.random() * 0.09,
    lat: (Math.random() * 2 - 1) * 0.85,
    len: 1.8 + Math.random() * 1.6,
    w: 0.55 + Math.random() * 0.5,
    o: 0.5 + Math.random() * 0.4,
  };
}

const wordStyle: React.CSSProperties = {
  fontFamily: FONT,
  fontWeight: 800,
  fontSize: 150,
  letterSpacing: -5,
};

export function CoalesceLogo({ className }: { className?: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const turbRef = useRef<SVGFETurbulenceElement>(null);
  const dispRef = useRef<SVGFEDisplacementMapElement>(null);
  const glowRef = useRef<SVGTextElement>(null);
  const wgroupRef = useRef<SVGGElement>(null);
  const wordRef = useRef<SVGTextElement>(null);
  const wispsRef = useRef<SVGGElement>(null);
  const ambientRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    const turb = turbRef.current;
    const disp = dispRef.current;
    const glow = glowRef.current;
    const wgroup = wgroupRef.current;
    const word = wordRef.current;
    const wisps = wispsRef.current;
    const ambient = ambientRef.current;
    if (!svg || !turb || !disp || !glow || !wgroup || !word || !wisps || !ambient) return;
    const ribs = [...wgroup.querySelectorAll("path")] as SVGPathElement[];
    const flowLines = [...wgroup.querySelectorAll("line")] as SVGLineElement[];
    let particles = flowLines.map(() => newParticle(Math.random()));

    const updateRibs = (t: number) =>
      ribs.forEach((r, i) => r.setAttribute("d", ribD(V[i], V[i + 1], RIB_H, i * 1.7, t)));

    const updateFlow = (t: number, dt: number, master: number) => {
      particles.forEach((pt, idx) => {
        pt.p += pt.v * dt;
        if (pt.p > 1) particles[idx] = pt = newParticle(0);
        let d = pt.p * SEG_TOTAL;
        let i = 0;
        while (i < 3 && d > SEG[i].L) {
          d -= SEG[i].L;
          i++;
        }
        const g = SEG[i];
        const s = d / g.L;
        const tx = (g.b[0] - g.a[0]) / g.L;
        const ty = (g.b[1] - g.a[1]) / g.L;
        const off = ripple(s, i * 1.7, t) + pt.lat * (RIB_H + 2) * Math.sin(Math.PI * s);
        const cx = g.a[0] + (g.b[0] - g.a[0]) * s + -ty * off;
        const cy = g.a[1] + (g.b[1] - g.a[1]) * s + tx * off;
        const half = pt.len / 2;
        const l = flowLines[idx];
        l.setAttribute("x1", (cx - tx * half).toFixed(1));
        l.setAttribute("y1", (cy - ty * half).toFixed(1));
        l.setAttribute("x2", (cx + tx * half).toFixed(1));
        l.setAttribute("y2", (cy + ty * half).toFixed(1));
        l.setAttribute("stroke-width", pt.w.toFixed(2));
        l.setAttribute("opacity", (master * pt.o * Math.pow(Math.sin(Math.PI * pt.p), 0.7)).toFixed(3));
      });
    };
    updateRibs(0);

    // Layout: the W tops out at the x-height of "aft" (+3% optical overshoot
    // for its pointed, dissolving tips) and shares its baseline. Ink metrics
    // come from canvas — svg text getBBox() returns the em box, not ink.
    const ctx = document.createElement("canvas").getContext("2d");
    let xh = 70; // Avenir Next x-height at 150px, if canvas is unavailable
    if (ctx) {
      ctx.font = `800 150px ${FONT}`;
      xh = ctx.measureText("a").actualBoundingBoxAscent;
    }
    const bb = word.getBBox();
    const targetH = xh * 1.03;
    const wScale = targetH / (WL.maxY - WL.minY);
    const wW = (WL.maxX - WL.minX) * wScale;
    const startX = CX - (wW + GAP + bb.width) / 2;
    wgroup.setAttribute(
      "transform",
      `translate(${(startX - WL.minX * wScale).toFixed(1)} ${(BASE - WL.maxY * wScale).toFixed(1)}) scale(${wScale.toFixed(3)})`
    );
    word.setAttribute("x", (startX + wW + GAP - bb.x).toFixed(1));

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

    // Gentle, low-amplitude so the settled logo stays sharp; the ribbon W
    // keeps fluttering with laminar streaks once settled.
    function idleBreathe() {
      let s = 7;
      let last = performance.now();
      const tick = () => {
        const now = performance.now();
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        s += 0.005;
        turb!.setAttribute("seed", (7 + Math.sin(s) * 2.2).toFixed(2));
        disp!.setAttribute("scale", (1 + Math.sin(s * 1.3) * 0.9).toFixed(2));
        updateRibs(now / 1000);
        updateFlow(now / 1000, dt, 1);
        raf(tick);
      };
      raf(tick);
    }

    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      disp.setAttribute("scale", "0");
      word.style.opacity = "1";
      ribs.forEach((r) => (r.style.opacity = "1"));
      glow.style.opacity = "0.24";
      // One static flutter frame with streaks spread along the ribbon.
      updateRibs(1.3);
      particles = flowLines.map((_, i) => newParticle((i + 0.5) / flowLines.length));
      updateFlow(1.3, 0, 1);
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
      word.style.opacity = String(Math.min(1, Math.max(0, (e - 0.14) * 1.5)));
      updateRibs(now / 1000);
      ribs.forEach((r, i) => {
        r.style.opacity = String(Math.min(1, Math.max(0, (e - i * 0.1) / 0.55)));
      });
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
      ref={svgRef}
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
        {[0, 1, 2, 3].map((i) => (
          <linearGradient
            key={i}
            id={`clg-w-${i}`}
            gradientUnits="userSpaceOnUse"
            x1={V[i][0]}
            y1={V[i][1]}
            x2={V[i + 1][0]}
            y2={V[i + 1][1]}
          >
            {/* Segment 0's dissolving tail (the left flourish) fades in ~30%
                sooner so it doesn't out-gesture the letterforms. */}
            <stop offset="0" stopColor={PAL[0]} stopOpacity={i === 0 ? "0.3" : "0.1"} />
            <stop offset={i === 0 ? "0.17" : "0.24"} stopColor={PAL[0]} stopOpacity="0.92" />
            <stop offset="0.6" stopColor={PAL[1]} stopOpacity="1" />
            <stop offset="1" stopColor={PAL[2]} stopOpacity="0.18" />
          </linearGradient>
        ))}
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
      <g filter="url(#clg-vapor)">
        <g ref={wgroupRef}>
          {[0, 1, 2, 3].map((i) => (
            <path key={i} fill={`url(#clg-w-${i})`} style={{ opacity: 0 }} />
          ))}
          <g>
            {Array.from({ length: FLOW_N }, (_, i) => (
              <line key={i} stroke="#eef2ff" strokeLinecap="round" opacity={0} />
            ))}
          </g>
        </g>
        <text ref={wordRef} y={170} style={{ ...wordStyle, fill: "url(#clg-ink)", opacity: 0 }}>
          aft
        </text>
      </g>
    </svg>
  );
}
