import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { Activity } from "lucide-react";

export function GAProgressPanel({ generationHistory }) {
  if (!generationHistory || generationHistory.length === 0) return null;

  const data = generationHistory.filter((_, i) => i % Math.max(1, Math.floor(generationHistory.length / 60)) === 0 || i === generationHistory.length - 1);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-6" id="ga-progress-panel">
      <div className="flex items-center gap-3 mb-6">
        <div className="rounded-2xl bg-amber-100 p-3 text-amber-600"><Activity className="h-5 w-5" /></div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">GA Convergence</p>
          <h3 className="mt-1 text-xl font-bold text-slate-800">Fitness vs Generation</h3>
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="fitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
              <XAxis dataKey="generation" tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
              <Area type="monotone" dataKey="best_fitness" stroke="#6366f1" fill="url(#fitGrad)" strokeWidth={2} name="Best Fitness" />
              <Line type="monotone" dataKey="avg_fitness" stroke="#10b981" strokeWidth={1.5} dot={false} name="Avg Fitness" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
              <XAxis dataKey="generation" tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
              <Line type="monotone" dataKey="mutation_rate" stroke="#f59e0b" strokeWidth={2} dot={false} name="Mutation Rate" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}
