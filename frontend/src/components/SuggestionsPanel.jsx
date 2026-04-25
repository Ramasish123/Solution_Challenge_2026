import { motion } from "framer-motion";

export function SuggestionsPanel({ suggestions = [] }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Smart Suggestions</p>
      <h3 className="mt-2 text-xl font-bold text-slate-800">Swap opportunities and decision support</h3>
      <div className="mt-6 grid gap-3">
        {suggestions.map((suggestion) => (
          <div
            key={`${suggestion.title}-${suggestion.projected_gain}`}
            className="rounded-xl border border-slate-200 bg-white p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-800">{suggestion.title}</p>
                <p className="mt-2 text-sm text-slate-500">{suggestion.detail}</p>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700">
                +{suggestion.projected_gain}
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
