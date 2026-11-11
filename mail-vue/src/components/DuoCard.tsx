import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export interface StatItem {
  value: string;
  label: string;
}

const DEFAULT_STATS: StatItem[] = [
  { value: "+99.9%", label: "Inbound & Outbound\nDeliverability" },
  { value: "0", label: "Serverless Edge\nLogs Stored" },
  { value: "<1ms", label: "Cloudflare Edge\nGlobal Latency" },
];

export function DuoCard({
  title = "GrabMails Edge",
  description = "Instant serverless mailboxes engineered natively on Cloudflare Workers and D1 database. Infinite scale, zero servers.",
  stats = DEFAULT_STATS,
  children = null,
  className = "",
}: {
  title?: string;
  description?: string;
  stats?: StatItem[];
  children?: React.ReactNode;
  className?: string;
}) {
  const cardRef = useRef<HTMLButtonElement | null>(null);
  const contextRef = useRef<gsap.Context | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const round = (n: number) => Math.round(n * 10000) / 10000;
    const state = { p: 0 };

    const apply = () => {
      const angle = state.p * Math.PI;
      const cos = Math.cos(angle);
      el.style.setProperty("--turn", `${round(180 - state.p * 180)}deg`);
      el.style.setProperty("--spread", String(round(Math.max(0, -cos))));
      el.style.setProperty("--night", String(round((1 - cos) / 2)));
      el.style.setProperty("--blur-cover", String(round(Math.sin(angle))));
      el.style.setProperty("--blur-inside", String(round(Math.sin(angle) ** 2)));
      el.style.setProperty("--hinge-k", String(round(Math.max(0, cos))));
      el.dataset.state = state.p === 0 ? "folded" : state.p === 1 ? "open" : "moving";
    };

    apply();

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ paused: true });
      tl.to(state, { p: 1, duration: 1.4, ease: "sine.inOut", onUpdate: apply }, 0);
      tl.fromTo(
        el.querySelectorAll("[data-stat]"),
        { "--reveal": 0 },
        { "--reveal": 1, duration: 0.25, ease: "power2.out", stagger: 0.08 },
        1.02
      );
      timelineRef.current = tl;
    }, el);

    contextRef.current = ctx;
    return () => ctx.revert();
  }, []);

  const handleClick = () => {
    const next = !open;
    setOpen(next);
    if (timelineRef.current) {
      if (next) {
        timelineRef.current.play();
      } else {
        timelineRef.current.reverse();
      }
    }
  };

  return (
    <div className={`duo-card-scene ${className}`}>
      <button
        ref={cardRef}
        type="button"
        onClick={handleClick}
        aria-expanded={open}
        className="duo-card-btn"
        data-state="folded"
      >
        {/* Left Leaf (Swings in 3D) */}
        <span className="leaf flap">
          {/* Cover Face (Seen when folded) */}
          <span className="face cover" aria-hidden={open}>
            <span className="cover-bg" />
            <span className="cover-content">
              <span className="duo-badge">Interactive 3D Duo</span>
              <span className="duo-title">{title}</span>
              <span className="duo-desc">{description}</span>
              <span className="click-hint">Click to flip &amp; view stats ↗</span>
            </span>
          </span>

          {/* Inside Face (Seen when open) */}
          <span className="face inside" aria-hidden={!open}>
            <span className="inside-bg day" />
            <span className="inside-bg night" />
            <span className="inside-content">
              <span className="duo-title">{title}</span>
              <span className="duo-desc">{description}</span>
            </span>
          </span>
        </span>

        {/* Right Leaf (Holds Stats or Content) */}
        <span className="leaf right" aria-hidden={!open}>
          <span className="inside-bg day" style={{ backgroundPosition: "100% 0" }} />
          <span className="inside-bg night" style={{ backgroundPosition: "100% 0" }} />
          <span className="stats-column">
            {stats.map((s, idx) => (
              <span key={idx} className="stat-item" data-stat="">
                <span className="stat-circle">
                  <span className="stat-val">{s.value}</span>
                </span>
                <span className="stat-lbl">{s.label}</span>
              </span>
            ))}
          </span>
        </span>
      </button>

      {children && <div className="duo-card-slot">{children}</div>}
    </div>
  );
}

export default DuoCard;
