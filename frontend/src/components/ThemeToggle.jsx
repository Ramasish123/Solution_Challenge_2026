import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

function getInitialTheme() {
  const saved = localStorage.getItem("smart-classroom-theme");
  if (saved) return saved;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
  localStorage.setItem("smart-classroom-theme", theme);
}

// ── Star component for the night sky effect ─────────
function Star({ x, y, size, delay }) {
  return (
    <motion.div
      className="absolute rounded-full bg-white"
      style={{ left: `${x}%`, top: `${y}%`, width: size, height: size }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: [0, 1, 0.6, 1], scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{ delay, duration: 0.5, opacity: { repeat: Infinity, repeatType: "reverse", duration: 2 + delay } }}
    />
  );
}

const stars = [
  { x: 12, y: 18, size: 2, delay: 0.1 },
  { x: 28, y: 35, size: 1.5, delay: 0.2 },
  { x: 72, y: 14, size: 2, delay: 0.15 },
  { x: 82, y: 40, size: 1.5, delay: 0.25 },
  { x: 55, y: 22, size: 1, delay: 0.3 },
  { x: 18, y: 60, size: 1.5, delay: 0.35 },
  { x: 65, y: 55, size: 1, delay: 0.18 },
  { x: 40, y: 10, size: 1.5, delay: 0.22 },
];

// ── Cloud component for day mode ─────────────────
function Cloud({ x, delay }) {
  return (
    <motion.div
      className="absolute"
      style={{ left: `${x}%`, top: "50%", translateY: "-50%" }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 0.7, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <div className="flex gap-px">
        <div className="h-1.5 w-2 rounded-full bg-white/80" />
        <div className="h-2 w-3 rounded-full bg-white/90 -mt-0.5" />
        <div className="h-1.5 w-2 rounded-full bg-white/80" />
      </div>
    </motion.div>
  );
}

export function ThemeToggle() {
  const [theme, setTheme] = useState(getInitialTheme);
  const isDark = theme === "dark";

  // Apply on mount and changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Listen for system preference changes
  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => {
      if (!localStorage.getItem("smart-classroom-theme")) {
        setTheme(e.matches ? "dark" : "light");
      }
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const toggle = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  return (
    <button
      onClick={toggle}
      className="relative h-9 w-[72px] rounded-full overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      data-no-theme-transition
    >
      {/* ── Background sky ────────────────────── */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: isDark
            ? "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)"
            : "linear-gradient(135deg, #fbbf24 0%, #38bdf8 40%, #0ea5e9 100%)",
        }}
        transition={{ duration: 0.5 }}
      />

      {/* ── Stars (night only) ────────────────── */}
      <AnimatePresence>
        {isDark && stars.map((star, i) => <Star key={`star-${i}`} {...star} />)}
      </AnimatePresence>

      {/* ── Clouds (day only) ─────────────────── */}
      <AnimatePresence>
        {!isDark && (
          <>
            <Cloud x={12} delay={0.1} />
            <Cloud x={52} delay={0.2} />
          </>
        )}
      </AnimatePresence>

      {/* ── Sun / Moon knob ───────────────────── */}
      <motion.div
        className="absolute top-1 h-7 w-7 rounded-full shadow-lg"
        animate={{
          x: isDark ? 38 : 4,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30,
        }}
      >
        {/* ── Sun face ───────────────────────── */}
        <AnimatePresence mode="wait">
          {!isDark ? (
            <motion.div
              key="sun"
              className="relative h-full w-full rounded-full bg-gradient-to-br from-amber-300 to-orange-400"
              initial={{ rotate: -90, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              exit={{ rotate: 90, scale: 0 }}
              transition={{ duration: 0.35, type: "spring", stiffness: 200 }}
            >
              {/* Sun rays */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                <motion.div
                  key={deg}
                  className="absolute bg-amber-400"
                  style={{
                    width: "2px",
                    height: "3px",
                    borderRadius: "1px",
                    top: "50%",
                    left: "50%",
                    transformOrigin: "center",
                    transform: `rotate(${deg}deg) translateY(-13px) translateX(-1px)`,
                  }}
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={{ opacity: 0.8, scaleY: 1 }}
                  transition={{ delay: 0.15 + deg * 0.001, duration: 0.3 }}
                />
              ))}
              {/* Sun center glow */}
              <div className="absolute inset-1 rounded-full bg-gradient-to-br from-yellow-200 to-amber-300" />
            </motion.div>
          ) : (
            <motion.div
              key="moon"
              className="relative h-full w-full rounded-full bg-gradient-to-br from-slate-200 to-slate-300"
              initial={{ rotate: 90, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              exit={{ rotate: -90, scale: 0 }}
              transition={{ duration: 0.35, type: "spring", stiffness: 200 }}
            >
              {/* Moon craters */}
              <div className="absolute top-1 left-2 h-1.5 w-1.5 rounded-full bg-slate-400/40" />
              <div className="absolute top-3 left-3.5 h-2 w-2 rounded-full bg-slate-400/30" />
              <div className="absolute top-1.5 left-4 h-1 w-1 rounded-full bg-slate-400/40" />
              {/* Moon shadow */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tl from-transparent to-white/20" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </button>
  );
}
