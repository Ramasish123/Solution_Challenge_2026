import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Cpu, Dna, Gauge, TrendingUp } from "lucide-react";

export function LiveStatusPanel({ generationHistory, isRunning }) {
  const [displayIndex, setDisplayIndex] = useState(0);

  useEffect(() => {
    if (!generationHistory || generationHistory.length === 0) { setDisplayIndex(0); return; }
    if (displayIndex >= generationHistory.length - 1) return;
    const timer = setTimeout(() => setDisplayIndex((p) => Math.min(p + 1, generationHistory.length - 1)), 30);
    return () => clearTimeout(timer);
  }, [displayIndex, generationHistory]);

  useEffect(() => { setDisplayIndex(0); }, [generationHistory]);

  const current = generationHistory?.[displayIndex];
  const final = generationHistory?.[generationHistory.length - 1];
  const progress = generationHistory?.length > 0 ? ((displayIndex + 1) / generationHistory.length) * 100 : 0;
  const animating = displayIndex < (generationHistory?.length || 0) - 1;

  if (!generationHistory || generationHistory.length === 0) {
    if (!isRunning) return null;
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-5">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-slate-200 border-t-primary-600" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary-600">Optimizing Schedule</p>
            <p className="text-lg font-bold text-slate-800 mt-1">Running genetic algorithm...</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-6" id="live-status-panel">
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className={`rounded-2xl p-3 ${animating ? "bg-primary-100 text-primary-600 animate-pulse" : "bg-emerald-100 text-emerald-600"}`}>
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Live Optimization</p>
            <h3 className="mt-1 text-lg font-bold text-slate-800">{animating ? "Processing..." : "Optimization Complete"}</h3>
          </div>
        </div>
        {animating && <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-slate-200 border-t-primary-600" />}
      </div>

      <div className="mb-5">
        <div className="flex justify-between text-xs text-slate-400 font-medium mb-1.5">
          <span>Generation {current?.generation || 0} / {final?.generation || 0}</span>
          <span>{progress.toFixed(0)}%</span>
        </div>
        <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-600" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-2"><TrendingUp className="h-3 w-3" />Best Fitness</div>
          <p className="text-xl font-bold text-primary-600">{current?.best_fitness || "—"}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-2"><Dna className="h-3 w-3" />Mutation Rate</div>
          <p className="text-xl font-bold text-amber-600">{current?.mutation_rate || "—"}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-2"><Gauge className="h-3 w-3" />Avg Fitness</div>
          <p className="text-xl font-bold text-emerald-600">{current?.avg_fitness || "—"}</p>
        </div>
      </div>
    </motion.div>
  );
}
