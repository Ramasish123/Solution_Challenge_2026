import { motion } from "framer-motion";

export function StatCard({ title, value, accent, subtitle, dotColor, isPrimary }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl p-5 transition-all ${
        isPrimary 
          ? "bg-[#14532d] text-white shadow-lg shadow-primary-900/20" 
          : "bg-white border border-slate-100 shadow-sm hover:shadow-md"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className={`text-[13px] font-medium ${isPrimary ? "text-white/80" : "text-slate-500"}`}>{title}</p>
        {isPrimary ? (
          <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-white text-[10px]">↗</span>
          </div>
        ) : (
          <div className="h-6 w-6 rounded-full border border-slate-200 flex items-center justify-center">
             <span className="text-slate-400 text-[10px]">↗</span>
          </div>
        )}
      </div>
      <div className="mt-4 flex items-end justify-between">
        <h3 className={`text-4xl font-bold tracking-tight ${isPrimary ? "text-white" : "text-slate-800"}`}>{value}</h3>
        <span className={`rounded-md px-2 py-1 text-[10px] font-semibold ${isPrimary ? "bg-white/10 text-white" : accent}`}>{subtitle}</span>
      </div>
    </motion.div>
  );
}
