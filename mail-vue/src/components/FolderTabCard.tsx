import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Plus } from 'lucide-react';

/**
 * FolderTabCard
 * A modern tactile UI card featuring an asymmetrical folder-tab cutout sheet,
 * animated mesh fluid gradient background, and frosted translucent folder flap.
 * Matched to media_1794244249257_13333aa6.jpg
 * Infused with the 4-color focused SaaS palette: #8EB69B, #190019, #051F20, #FBE4DB.
 */
export function FolderTabCard({
  title = "My Files",
  subtitle = "Zero-log Cloud Mailbox",
  tagsCount = "24",
  tagsLabel = "Unread",
  shotsCount = "Wed 19 Aug",
  actionType = "plus", // 'plus' | 'arrow' | 'dots'
  onAction = null,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  tagsCount?: string;
  tagsLabel?: string;
  shotsCount?: string;
  actionType?: 'plus' | 'arrow' | 'dots';
  onAction?: (() => void) | null;
  className?: string;
}) {
  const [isDark, setIsDark] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return true;
  });

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    return () => observer.disconnect();
  }, []);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const applyWidth = (w: number) => setIsCompact(w < 220);
    applyWidth(el.getBoundingClientRect().width);
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) applyWidth(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 45;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 45;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  return (
    <div className="flex items-center justify-center w-full max-w-full h-full max-h-full p-1 select-none">
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`relative w-full max-w-[320px] aspect-[4/5] max-h-[min(410px,100%)] rounded-[28px] sm:rounded-[32px] p-2 sm:p-2.5 overflow-hidden transition-all duration-300 ${
          isDark
            ? "bg-[#051F20] border border-white/10 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.65)]"
            : "bg-[#FBE4DB] border border-black/8 shadow-[0_20px_45px_-12px_rgba(142,182,155,0.25)]"
        } ${className}`}
      >
        {/* Inner Card Canvas */}
        <div className="relative w-full h-full rounded-[24px] sm:rounded-[26px] overflow-hidden">

          {/* ── 1. Animated Fluid Artwork (Inside / Behind Folder) ── */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
              className={`absolute inset-0 transition-colors duration-500 ${
                isDark ? "bg-[#190019]" : "bg-[#FBE4DB]"
              }`}
            />

            <motion.div
              animate={{
                rotate: [0, 360],
                x: mousePos.x,
                y: mousePos.y,
              }}
              transition={{
                rotate: { duration: 24, repeat: Infinity, ease: "linear" },
                x: { type: "spring", stiffness: 120, damping: 18 },
                y: { type: "spring", stiffness: 120, damping: 18 },
              }}
              className="absolute -top-[35%] -left-[35%] w-[170%] h-[170%] pointer-events-none"
            >
              {/* Fluid Swirl 1: Fiery Coral / Crimson (#ff4136 / #FBE4DB) */}
              <motion.div
                animate={{
                  x: [-50, 45, -35, -50],
                  y: [-30, 40, -45, -30],
                  scale: [1, 1.35, 0.9, 1],
                }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[18%] left-[16%] w-[68%] h-[68%] blur-[26px]"
                style={{
                  background: isDark
                    ? "radial-gradient(circle, #ff334b 0%, #190019 60%, rgba(25,0,25,0) 90%)"
                    : "radial-gradient(circle, #ff6b6b 0%, #FBE4DB 60%, rgba(251,228,219,0) 100%)",
                }}
              />

              {/* Fluid Swirl 2: Deep Teal / Ocean (#8EB69B / #051F20) */}
              <motion.div
                animate={{
                  x: [40, -45, 35, 40],
                  y: [30, -35, 45, 30],
                  scale: [0.95, 1.4, 0.9, 0.95],
                }}
                transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[22%] left-[24%] w-[58%] h-[58%] blur-[20px]"
                style={{
                  background: isDark
                    ? "radial-gradient(circle, #8EB69B 0%, #051F20 60%, rgba(5,31,32,0) 95%)"
                    : "radial-gradient(circle, #8EB69B 0%, #e2efe8 55%, rgba(226,239,232,0) 90%)",
                }}
              />
            </motion.div>
          </div>

          {/* ── 2. Top Protruding Document Sheet (Matching middle folder in screenshot) ── */}
          <div className="absolute top-4 inset-x-5 h-[38%] rounded-t-2xl bg-white/90 dark:bg-white/95 shadow-md flex flex-col p-3 pointer-events-none transition-transform duration-300">
            <div className="w-16 h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-300 mb-2"></div>
            <div className="w-24 h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-200"></div>
          </div>

          {/* ── 3. Frosted Glass Folder Tab Cutout ── */}
          <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-end">
            <div className="relative w-full h-[64%]">
              {/* Frosted Glass Silhouette */}
              <svg
                viewBox="0 0 380 240"
                preserveAspectRatio="none"
                className="absolute inset-0 w-full h-full filter drop-shadow-[0_-8px_24px_rgba(0,0,0,0.18)]"
              >
                <path
                  d="M 0 28
                     A 28 28 0 0 1 28 0
                     L 180 0
                     A 22 22 0 0 1 202 22
                     A 22 22 0 0 0 224 44
                     L 352 44
                     A 28 28 0 0 1 380 72
                     L 380 212
                     A 28 28 0 0 1 352 240
                     L 28 240
                     A 28 28 0 0 1 0 212
                     Z"
                  fill={isDark ? "rgba(10, 15, 22, 0.82)" : "rgba(255, 255, 255, 0.76)"}
                  stroke={isDark ? "rgba(255, 255, 255, 0.16)" : "rgba(255, 255, 255, 0.85)"}
                  strokeWidth="1.2"
                  style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
                />
              </svg>

              {/* Folder Content & Badges */}
              <div className={`relative z-20 w-full h-full flex flex-col justify-between pointer-events-auto ${
                isCompact ? 'p-3' : 'p-4 sm:p-5'
              }`}>
                {/* Upper Left Tab Content */}
                <div className="pt-0.5 max-w-[50%]">
                  <h3 className={`font-bold tracking-tight leading-tight ${
                    isCompact ? 'text-[13px]' : 'text-[15px] sm:text-[17px]'
                  } ${
                    isDark ? "text-white" : "text-neutral-900"
                  }`}>
                    {title}
                  </h3>
                  <p className={`font-medium mt-0.5 tracking-normal leading-tight ${
                    isCompact ? 'text-[9px]' : 'text-[10px] sm:text-[11px]'
                  } ${
                    isDark ? "text-neutral-400" : "text-neutral-500"
                  }`}>
                    {shotsCount}
                  </p>
                </div>

                {/* Lower Row */}
                <div className="flex items-end justify-between pb-0.5">
                  <div className="flex flex-col">
                    <span className={`font-black tracking-tight leading-none ${
                      isCompact ? 'text-lg' : 'text-xl sm:text-2xl'
                    } ${
                      isDark ? "text-white" : "text-neutral-900"
                    }`}>
                      {tagsCount}
                    </span>
                    <span className={`font-semibold mt-1 ${
                      isCompact ? 'text-[9px]' : 'text-[10px] sm:text-[11px]'
                    } ${
                      isDark ? "text-[#8EB69B]" : "text-neutral-500"
                    }`}>
                      {tagsLabel}
                    </span>
                  </div>

                  {/* Action Button: Squircle '+' or 'ooo' (Matching screenshot) */}
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => onAction && onAction()}
                    className={`rounded-2xl flex items-center justify-center cursor-pointer shadow-md transition-all duration-200 ${
                      isCompact ? 'w-8 h-8' : 'w-10 h-10'
                    } ${
                      isDark
                        ? "bg-black/90 hover:bg-black text-white border border-white/20"
                        : "bg-black hover:bg-neutral-800 text-white border border-black/10"
                    }`}
                  >
                    {actionType === 'plus' ? (
                      <Plus className="w-5 h-5 stroke-[2.2]" />
                    ) : actionType === 'arrow' ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <span className="font-mono text-xs tracking-widest text-neutral-300">ooo</span>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default FolderTabCard;
